import os
import json
import joblib
import pandas as pd

# Adjust path based on where ai_engine.py is located
# backend/app/services/ai_engine.py -> backend/models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

multi_models = {}
binary_models = {}
scaler = None
bn_model = None
BEST_MODEL_NAME = None
CLASSES = []

EXPECTED_FEATURES = ['WBC', 'LYMp', 'NEUTp', 'LYMn', 'NEUTn', 'RBC', 'HGB', 'HCT', 'MCV', 'MCH', 'MCHC', 'PLT', 'PDW', 'PCT']

MODEL_MAPPINGS = {
    "RandomForest": "randomforest",
    "KNN": "knn",
    "SVM": "svm",
    "LogisticReg": "logisticreg"
}

# ─── Clinical population means used as Bayesian Network fallback ──────────────
# These are median values from healthy adult populations (WHO / clinical references).
# The BN will refine these using the patient's known biomarkers; if BN inference
# fails for any reason, these values are used directly.
CLINICAL_MEANS = {
    'WBC':   7.0,    # ×10⁹/L
    'LYMp':  30.0,   # %
    'NEUTp': 60.0,   # %
    'LYMn':  2.0,    # ×10⁹/L
    'NEUTn': 4.5,    # ×10⁹/L
    'RBC':   4.5,    # ×10⁶/µL
    'HGB':   13.5,   # g/dL
    'HCT':   41.0,   # %
    'MCV':   90.0,   # fL
    'MCH':   30.0,   # pg
    'MCHC':  33.0,   # g/dL
    'PLT':   250.0,  # ×10⁹/L
    'PDW':   12.0,   # fL
    'PCT':   0.25,   # %
}

# Human-readable full names for the Results page display
FEATURE_NAMES = {
    'WBC':   'White Blood Cell Count',
    'LYMp':  'Lymphocyte %',
    'NEUTp': 'Neutrophil %',
    'LYMn':  'Lymphocyte Absolute',
    'NEUTn': 'Neutrophil Absolute',
    'RBC':   'Red Blood Cell Count',
    'HGB':   'Hemoglobin',
    'HCT':   'Hematocrit',
    'MCV':   'Mean Corpuscular Volume',
    'MCH':   'Mean Corpuscular Hemoglobin',
    'MCHC':  'MCH Concentration',
    'PLT':   'Platelet Count',
    'PDW':   'Platelet Distribution Width',
    'PCT':   'Plateletcrit',
}

FEATURE_UNITS = {
    'WBC':   '×10⁹/L', 'LYMp':  '%',    'NEUTp': '%',
    'LYMn':  '×10⁹/L', 'NEUTn': '×10⁹/L', 'RBC': '×10⁶/µL',
    'HGB':   'g/dL',   'HCT':   '%',    'MCV':  'fL',
    'MCH':   'pg',     'MCHC':  'g/dL', 'PLT':  '×10⁹/L',
    'PDW':   'fL',     'PCT':   '%',
}


def load_models():
    global multi_models, binary_models, scaler, bn_model, BEST_MODEL_NAME, CLASSES

    # 1. Load scaler
    scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")
    if os.path.exists(scaler_path):
        scaler = joblib.load(scaler_path)

    # 2. Load Bayesian Network model
    bn_path = os.path.join(MODELS_DIR, "bn_model.pkl")
    if os.path.exists(bn_path):
        try:
            bn_model = joblib.load(bn_path)
            print(f"[AIEngine] Bayesian Network loaded: {type(bn_model).__name__}")
            if hasattr(bn_model, 'nodes'):
                print(f"[AIEngine] BN nodes: {list(bn_model.nodes())}")
        except Exception as e:
            print(f"[AIEngine] Warning: Could not load BN model: {e}")
            bn_model = None

    # 3. Load Binary and Multi-class models
    for model_name, suffix in MODEL_MAPPINGS.items():
        multi_path  = os.path.join(MODELS_DIR, f"multi_{suffix}.pkl")
        binary_path = os.path.join(MODELS_DIR, f"binary_{suffix}.pkl")
        if os.path.exists(multi_path):
            multi_models[model_name] = joblib.load(multi_path)
        if os.path.exists(binary_path):
            binary_models[model_name] = joblib.load(binary_path)

    # 4. Load label classes
    classes_path = os.path.join(MODELS_DIR, "label_classes.pkl")
    if os.path.exists(classes_path):
        CLASSES = joblib.load(classes_path)
    else:
        CLASSES = ["Healthy"]

    # 5. Determine BEST_MODEL_NAME from model_metrics.json
    metrics_path = os.path.join(MODELS_DIR, "model_metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            metrics = json.load(f)
        best_f1, best_model = -1, None
        for name, data in metrics.items():
            f1 = data.get("weighted_f1", 0)
            if f1 > best_f1:
                best_f1, best_model = f1, name
        BEST_MODEL_NAME = best_model
        print(f"[AIEngine] Best model: {BEST_MODEL_NAME} (f1={best_f1:.4f})")
    else:
        BEST_MODEL_NAME = "RandomForest"
        print("[AIEngine] Metrics file not found, defaulting to RandomForest")


load_models()


# ─── Bayesian Network imputation ─────────────────────────────────────────────

def _bn_infer_missing(known: dict, missing_features: list) -> dict:
    """
    Attempt to use the loaded pgmpy BayesianNetwork to infer the most-probable
    state for each missing feature given the observed blood values.

    The BN was trained on discretised bins. We:
      1. Discretise the known continuous values by matching them to the nearest
         state stored in each CPD's state_names.
      2. Run VariableElimination MAP query for every missing node.
      3. Convert the returned discrete state back to a continuous value (taken
         as the midpoint of the bin if the state name is a number, otherwise we
         fall back to the clinical mean).

    Returns a dict {feature: float_value}.  Raises on any failure so the caller
    can catch and fall back cleanly.
    """
    from pgmpy.inference import VariableElimination  # imported lazily

    bn_nodes = set(bn_model.nodes())
    infer    = VariableElimination(bn_model)

    # Build discretised evidence for features that exist in the BN
    evidence = {}
    for feat, val in known.items():
        if feat not in bn_nodes:
            continue
        try:
            cpd    = bn_model.get_cpds(feat)
            states = cpd.state_names[feat]
            # States can be numbers (bin indices) or strings ('low', 'normal', etc.)
            numeric_states = [s for s in states if isinstance(s, (int, float))]
            if numeric_states:
                closest = min(numeric_states, key=lambda s: abs(s - float(val)))
                evidence[feat] = closest
            elif isinstance(states[0], str):
                # Named states – derive from value relative to clinical mean
                mean = CLINICAL_MEANS.get(feat, float(val))
                if   float(val) < mean * 0.8:   evidence[feat] = states[0]   # low
                elif float(val) > mean * 1.2:   evidence[feat] = states[-1]  # high
                else:                            evidence[feat] = states[len(states)//2]
        except Exception:
            pass  # skip features we can't discretise

    result = {}
    for feat in missing_features:
        if feat not in bn_nodes:
            raise ValueError(f"{feat} not in BN graph")
        ev = {k: v for k, v in evidence.items() if k != feat}
        map_result = infer.map_query([feat], evidence=ev, show_progress=False)
        inferred_state = map_result[feat]
        # Convert state back to float
        if isinstance(inferred_state, (int, float)):
            result[feat] = float(inferred_state)
        else:
            result[feat] = CLINICAL_MEANS[feat]   # string state → use mean

    return result


def bayesian_impute(cbc_data: dict, missing_features: list) -> dict:
    """
    Public imputation entry point.
    Returns {feature: imputed_value} for every feature in missing_features.
    Records the source ('bayesian_network' or 'clinical_mean') in the returned dict values.
    """
    imputed = {}
    if not missing_features:
        return imputed

    # --- Try Bayesian Network first ---
    if bn_model is not None:
        try:
            bn_result = _bn_infer_missing(cbc_data, missing_features)
            for feat in missing_features:
                imputed[feat] = {
                    "value":  round(bn_result.get(feat, CLINICAL_MEANS.get(feat, 0.0)), 4),
                    "source": "Bayesian Network",
                    "name":   FEATURE_NAMES.get(feat, feat),
                    "unit":   FEATURE_UNITS.get(feat, ""),
                }
            print(f"[BN] Successfully imputed via Bayesian Network: {list(imputed.keys())}")
            return imputed
        except Exception as e:
            print(f"[BN] Inference failed ({e}), falling back to clinical population means.")

    # --- Fallback: clinical population means ---
    for feat in missing_features:
        imputed[feat] = {
            "value":  CLINICAL_MEANS.get(feat, 0.0),
            "source": "Clinical Population Mean",
            "name":   FEATURE_NAMES.get(feat, feat),
            "unit":   FEATURE_UNITS.get(feat, ""),
        }
    print(f"[BN] Imputed via clinical means: {list(imputed.keys())}")
    return imputed


# ─── Main inference function ──────────────────────────────────────────────────

def predict_anemia(cbc_data: dict) -> dict:
    """
    Two-stage anemia prediction pipeline.

    Stage 0: Bayesian Network imputation for any missing biomarkers.
    Stage 1: Binary classification (Anemic vs Healthy) with per-model probabilities.
    Stage 2: Multi-class classification (Anemia Type) if anemia is detected.
    """
    print(f"DEBUG: CBC Data received by AI Engine: {cbc_data}")

    if not BEST_MODEL_NAME or BEST_MODEL_NAME not in binary_models:
        raise ValueError("Models are not properly loaded or BEST_MODEL_NAME is invalid.")

    # ── Stage 0: identify and impute missing features ────────────────────────
    missing_features = [f for f in EXPECTED_FEATURES if f not in cbc_data or cbc_data[f] is None]
    bayesian_imputed_meta = bayesian_impute(cbc_data, missing_features)

    # Build the complete input dict (observed + imputed)
    complete_data = dict(cbc_data)
    for feat, meta in bayesian_imputed_meta.items():
        complete_data[feat] = meta["value"]

    # Enforce feature order and create DataFrame
    input_vector = [float(complete_data.get(feat, CLINICAL_MEANS.get(feat, 0.0))) for feat in EXPECTED_FEATURES]
    df = pd.DataFrame([input_vector], columns=EXPECTED_FEATURES)
    print(f"DEBUG: Vector sent to model: {df.values.tolist()}")

    # Scale
    X_scaled = scaler.transform(df) if scaler is not None else df.values

    # ── Stage 1: Binary prediction ───────────────────────────────────────────
    binary_probs     = {}
    binary_label_map = {}

    for name, clf in binary_models.items():
        if hasattr(clf, "predict_proba"):
            prob = float(clf.predict_proba(X_scaled)[0][1])
        elif hasattr(clf, "decision_function"):
            raw  = clf.decision_function(X_scaled)[0]
            prob = float(1 / (1 + (2.71828 ** (-raw))))
        else:
            prob = float(clf.predict(X_scaled)[0])

        binary_probs[name]     = round(prob, 4)
        binary_label_map[name] = int(clf.predict(X_scaled)[0])

    is_anemic = bool(binary_label_map.get(BEST_MODEL_NAME, 0))

    # Weighted average probability
    weights = {}
    metrics_path = os.path.join(MODELS_DIR, "model_metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            metrics = json.load(f)
        for name in binary_probs:
            weights[name] = metrics.get(name, {}).get("weighted_f1", 1.0)
    else:
        weights = {name: 1.0 for name in binary_probs}

    total_weight        = sum(weights.values()) or 1.0
    weighted_anemia_prob = round(
        sum(binary_probs[n] * weights[n] for n in binary_probs) / total_weight, 4
    )

    # ── Stage 2: Multi-class prediction (only if anemic) ────────────────────
    anemia_type      = 0
    diagnosis        = CLASSES[0] if len(CLASSES) > 0 else "Healthy"
    model_predictions = {name: 0 for name in multi_models}

    if is_anemic:
        for name, clf in multi_models.items():
            model_predictions[name] = int(clf.predict(X_scaled)[0])
        anemia_type = model_predictions[BEST_MODEL_NAME]
        diagnosis   = CLASSES[anemia_type] if anemia_type < len(CLASSES) else "Unknown"

    return {
        "is_anemic":          is_anemic,
        "anemia_type":        anemia_type,
        "diagnosis":          diagnosis,
        "binary_probabilities": binary_probs,
        "weighted_anemia_prob": weighted_anemia_prob,
        "best_model_used":    BEST_MODEL_NAME,
        "model_predictions":  model_predictions,
        "bayesian_imputed":   bayesian_imputed_meta,   # {feat: {value, source, name, unit}}
    }
