import pandas as pd
import numpy as np
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error

# -------------------------------
# CONFIG (SAME DIRECTORY)
# -------------------------------
BASE_DIR = r"c:\Theo Personal storage\DEC-25 Project\StayOnTrack\student-risk-predictor\server\python_ml"

DATA_PATH = os.path.join(
    BASE_DIR,
    "dp_synthetic_data.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "risk_calc_model.pkl"
)

# -------------------------------
# 1. LOAD DATA
# -------------------------------
if not os.path.isfile(DATA_PATH):
    raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

df = pd.read_csv(DATA_PATH)

print("✅ Dataset loaded")
print("📁", DATA_PATH)
print("📊 Shape:", df.shape)

# -------------------------------
# 2. SANITY CHECK
# -------------------------------
required_cols = [
    "attendance", "cgpa", "fee_delay",
    "assignments", "engagement", "risk_score"
]

missing = set(required_cols) - set(df.columns)
if missing:
    raise ValueError(f"Missing columns: {missing}")

# -------------------------------
# 3. FEATURES & TARGET
# -------------------------------
X = df[
    ["attendance", "cgpa", "fee_delay", "assignments", "engagement"]
]
y = df["risk_score"]

# -------------------------------
# 4. TRAIN / TEST SPLIT
# -------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

# -------------------------------
# 5. MODEL (PRODUCTION TUNED)
# -------------------------------
model = RandomForestRegressor(
    n_estimators=600,        # higher stability
    max_depth=18,            # captures non-linearity
    min_samples_leaf=4,
    min_samples_split=8,
    random_state=42,
    n_jobs=-1
)

# -------------------------------
# 6. TRAIN
# -------------------------------
model.fit(X_train, y_train)

# -------------------------------
# 7. EVALUATION
# -------------------------------
y_pred = model.predict(X_test)

r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)

print("\n✅ Model Evaluation")
print(f"📈 R² Score (Success Rate): {r2:.4f}")
print(f"📉 Mean Absolute Error: {mae:.2f}")

if r2 < 0.90:
    raise RuntimeError(
        "❌ R² below 0.90 — model NOT acceptable for deployment"
    )

# -------------------------------
# 8. SAVE MODEL (DEPLOYMENT READY)
# -------------------------------
joblib.dump(model, MODEL_PATH)

print("\n💾 Model saved successfully")
print("📁", MODEL_PATH)

# -------------------------------
# 9. FEATURE IMPORTANCE CHECK
# -------------------------------
importances = pd.Series(
    model.feature_importances_,
    index=X.columns
).sort_values(ascending=False)

print("\n🔍 Feature Importances:")
print(importances)