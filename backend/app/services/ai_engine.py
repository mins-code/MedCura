import os
import json
import joblib
import pandas as pd
import numpy as np

# Adjust path based on where ai_engine.py is located
# backend/app/services/ai_engine.py -> backend/models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

multi_models = {}
binary_models = {}
scaler = None
bn_model = None
BEST_MODEL_NAME = None

MODEL_MAPPINGS = {
    "RandomForest": "randomforest",
    "KNN": "knn",
    "SVM": "svm",
    "LogisticReg": "logisticreg"
}

def load_models():
    """
    Load all models and scaler into memory, and determine the BEST_MODEL_NAME.
    """
    global multi_models, binary_models, scaler, bn_model, BEST_MODEL_NAME
    
    # 1. Load scaler
    scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")
    if os.path.exists(scaler_path):
        scaler = joblib.load(scaler_path)
    
    # 2. Load Bayesian Network model
    bn_path = os.path.join(MODELS_DIR, "bn_model.pkl")
    if os.path.exists(bn_path):
        bn_model = joblib.load(bn_path)
        
    # 3. Load Binary and Multi-class models
    for model_name, suffix in MODEL_MAPPINGS.items():
        multi_path = os.path.join(MODELS_DIR, f"multi_{suffix}.pkl")
        binary_path = os.path.join(MODELS_DIR, f"binary_{suffix}.pkl")
        
        if os.path.exists(multi_path):
            multi_models[model_name] = joblib.load(multi_path)
            
        if os.path.exists(binary_path):
            binary_models[model_name] = joblib.load(binary_path)

    # 4. Determine BEST_MODEL_NAME from model_metrics.json
    metrics_path = os.path.join(MODELS_DIR, "model_metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            metrics = json.load(f)
            
        best_f1 = -1
        best_model = None
        
        for name, data in metrics.items():
            f1_score = data.get("weighted_f1", 0)
            if f1_score > best_f1:
                best_f1 = f1_score
                best_model = name
                
        BEST_MODEL_NAME = best_model
        print(f"[AIEngine] Best model selected: {BEST_MODEL_NAME} with weighted_f1={best_f1}")
    else:
        # Fallback if metrics file doesn't exist
        BEST_MODEL_NAME = "RandomForest"
        print(f"[AIEngine] Metrics file not found, defaulting to: {BEST_MODEL_NAME}")

# Initialize models when the module is imported
load_models()


def predict_anemia(cbc_data: dict) -> dict:
    """
    Core inference function outlining the two-stage prediction logic.
    
    Stage 1: Binary prediction (Anemic vs Non-Anemic)
    Stage 2: Multi-class prediction (Anemia Type) and Bayesian Network cross-check
    """
    if not BEST_MODEL_NAME or BEST_MODEL_NAME not in binary_models:
        raise ValueError("Models are not properly loaded or BEST_MODEL_NAME is invalid.")
        
    # Convert input data to DataFrame for prediction
    # Expected cbc_data keys should match the features the model was trained on
    df = pd.DataFrame([cbc_data])
    
    # Scale features
    if scaler is not None:
        X_scaled = scaler.transform(df)
    else:
        X_scaled = df.values
        
    # Get the best classifiers
    binary_clf = binary_models[BEST_MODEL_NAME]
    multi_clf = multi_models[BEST_MODEL_NAME]
    
    # --- STAGE 1: Binary Prediction ---
    is_anemic_pred = binary_clf.predict(X_scaled)[0]
    
    # Convert numpy types to native Python types for JSON serialization
    is_anemic = bool(is_anemic_pred)
    
    # --- STAGE 2: Multi-class & Bayesian Network Cross-check ---
    # Default outputs if not anemic
    anemia_type = 0  # Assuming 0 is the class for "Healthy/No Anemia"
    confidence = 1.0
    bn_confidence = 1.0
    model_predictions = {name: 0 for name in multi_models.keys()}
    
    if is_anemic:
        # Predict using all models for the voting system
        for name, clf in multi_models.items():
            model_predictions[name] = int(clf.predict(X_scaled)[0])

        # Get probability/confidence for the BEST model's multi-class prediction
        anemia_type = model_predictions[BEST_MODEL_NAME]
        
        if hasattr(multi_clf, "predict_proba"):
            probs = multi_clf.predict_proba(X_scaled)[0]
            confidence = float(probs[anemia_type])
            
        # Bayesian Network Cross-check
        if bn_model is not None:
            # Here we would query the Bayesian Network to cross-check the classification
            bn_confidence = 0.95 # Placeholder for actual BN output
            
    return {
        "is_anemic": is_anemic,
        "anemia_type": anemia_type,
        "confidence": confidence,
        "bn_confidence": bn_confidence,
        "best_model_used": BEST_MODEL_NAME,
        "model_predictions": model_predictions
    }
