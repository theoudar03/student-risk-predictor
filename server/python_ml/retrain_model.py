import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error
import numpy as np

# -------------------------------
# LOAD DATA
# -------------------------------
import os

# -------------------------------
# LOAD DATA
# -------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "dp_synthetic_data.csv")
MODEL_OUT = os.path.join(BASE_DIR, "risk_calc_model.pkl")

df = pd.read_csv(DATA_PATH)

FEATURES = [
    "attendance",
    "cgpa",
    "fee_delay",
    "assignments",
    "engagement"
]

TARGET = "risk_score"

X = df[FEATURES]
y = df[TARGET]

# -------------------------------
# TRAIN / TEST SPLIT
# -------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.20,
    random_state=42
)

# -------------------------------
# MODEL CONFIG (POLICY-FRIENDLY)
# -------------------------------
model = RandomForestRegressor(
    n_estimators=600,
    max_depth=14,          # prevents soft averaging
    min_samples_leaf=5,
    min_samples_split=10,
    random_state=42,
    n_jobs=-1
)

# -------------------------------
# TRAIN
# -------------------------------
model.fit(X_train, y_train)

# -------------------------------
# EVALUATION
# -------------------------------
y_pred = model.predict(X_test)

r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)

print("\n📊 MODEL EVALUATION")
print("────────────────────")
print(f"R² Score : {r2:.4f}")
print(f"MAE      : {mae:.2f}")

if r2 < 0.90:
    print("⚠️ WARNING: R² below 0.90 — review data or depth")
else:
    print("✅ Model quality acceptable")

# -------------------------------
# FEATURE IMPORTANCE CHECK
# -------------------------------
importances = (
    pd.Series(model.feature_importances_, index=FEATURES)
    .sort_values(ascending=False)
)

print("\n🔍 FEATURE IMPORTANCE")
print(importances)

# -------------------------------
# SAVE MODEL
# -------------------------------
joblib.dump(model, MODEL_OUT)
print(f"\n💾 Model saved as: {MODEL_OUT}")