import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(__file__)
MODELS_DIR = os.path.join(BASE_DIR, "models")

print("Loading models...")
scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")
model_path = os.path.join(MODELS_DIR, "multi_randomforest.pkl")
le_path = os.path.join(MODELS_DIR, "label_encoder.pkl")

scaler = joblib.load(scaler_path)
model = joblib.load(model_path)
le = joblib.load(le_path) if os.path.exists(le_path) else None

cbc_data = {
    "WBC": 7000.0,
    "LYMp": 30.0,
    "NEUTp": 60.0,
    "LYMn": 2.0,
    "NEUTn": 4.0,
    "RBC": 5.0,
    "HGB": 14.0,
    "HCT": 45.0,
    "MCV": 90.0,
    "MCH": 30.0,
    "MCHC": 33.0,
    "PLT": 250000.0,
    "PDW": 12.0,
    "PCT": 0.2
}

EXPECTED_FEATURES = ['WBC', 'LYMp', 'NEUTp', 'LYMn', 'NEUTn', 'RBC', 'HGB', 'HCT', 'MCV', 'MCH', 'MCHC', 'PLT', 'PDW', 'PCT']

sanitized_data = {feature: float(cbc_data.get(feature, 0.0)) for feature in EXPECTED_FEATURES}
df = pd.DataFrame([sanitized_data])

print(f"Features: {list(df.columns)}")

X_scaled = scaler.transform(df)
pred = model.predict(X_scaled)[0]

print("="*30)
if le:
    pred_label = le.inverse_transform([pred])[0]
    print(f"Prediction Result: {pred} -> {pred_label}")
else:
    print(f"Prediction Result: {pred} (No LabelEncoder found)")
print("="*30)
