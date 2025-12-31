import pandas as pd
import numpy as np
import joblib
from sklearn.linear_model import LinearRegression

# 1. Create Training Data (Synthetic Data based on our logic)
# [Attendance, CGPA, FeeDelay, Participation, Assignments] -> RiskScore
data = [
    # Low Risk (Score < 35)
    [95, 9.5, 0, 9, 100, 5],
    [90, 8.5, 5, 8, 90, 10],
    [85, 8.0, 0, 7, 85, 15],
    [80, 7.5, 7, 6, 80, 25],
    
    # Medium Risk (35 <= Score < 70)
    [70, 7.0, 15, 6, 75, 40],
    [65, 6.5, 20, 5, 70, 50],
    [60, 6.0, 30, 5, 65, 60],
    [75, 6.5, 10, 5, 60, 45],
    
    # High Risk (Score >= 70)
    [50, 5.0, 45, 4, 50, 75],
    [40, 4.0, 60, 3, 40, 85],
    [30, 3.5, 70, 2, 30, 95],
    [20, 2.0, 90, 1, 10, 99],
    [0, 0.0, 100, 0, 0, 100],
    [55, 5.5, 40, 4, 20, 72] 
]

columns = ['attendance', 'cgpa', 'fee_delay', 'participation', 'assignments', 'risk_score']
df = pd.DataFrame(data, columns=columns)

# 2. Train Model
X = df[['attendance', 'cgpa', 'fee_delay', 'participation', 'assignments']]
y = df['risk_score']

model = LinearRegression()
model.fit(X, y)

# 3. Save Model
joblib.dump(model, 'risk_model.pkl')

print("Model trained and saved as 'risk_model.pkl'")
print("   Coefficients:", model.coef_)
print("   Intercept:", model.intercept_)
