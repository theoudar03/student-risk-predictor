import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor

# 1. Load Training Data (Generated Synthetic Data)
# [Attendance, CGPA, FeeDelay, Participation, Assignments] -> RiskScore
try:
    df = pd.read_csv("synthetic_student_risk_data.csv")
    print(f"Loaded {len(df)} samples from synthetic_student_risk_data.csv")
except FileNotFoundError:
    print("Error: synthetic_student_risk_data.csv not found. Run generate_data.py first.")
    exit(1)

# 2. Train Model
X = df[['attendance', 'cgpa', 'fee_delay', 'participation', 'assignments']]
y = df['risk_score']

# Using Random Forest with deeper trees for better nuance
model = RandomForestRegressor(n_estimators=300, max_depth=12, random_state=42)
model.fit(X, y)

# 3. Save Model
joblib.dump(model, 'risk_model.pkl')

print("Model trained and saved as 'risk_model.pkl'")
print("   Feature Importances:", model.feature_importances_)
