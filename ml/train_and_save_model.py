import json
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

# 1. Load training data
with open("StudentsTrainingData.json") as f:
    data = json.load(f)

df = pd.DataFrame(data)

# 2. Feature engineering
df["attendancePenalty"] = (df["attendancePercentage"] < 50).astype(int)
df["cgpaRisk"] = (df["cgpa"] < 6.0).astype(int)
df["feeDelayFlag"] = (df["feeDelayDays"] > 15).astype(int)
df["feeDelayPenalty"] = (df["feeDelayDays"] > 60).astype(int)
df["participationRisk"] = (df["classParticipationScore"] < 5).astype(int)
df["assignmentRisk"] = (df["assignmentsCompleted"] < 60).astype(int)

# 3. Create risk score labels (training only)
df["riskScore"] = (
    (100 - df["attendancePercentage"]) * 0.25 +
    (10 - df["cgpa"]) * 10 * 0.25 +
    df["feeDelayDays"].clip(0, 100) * 0.20 +
    (10 - df["classParticipationScore"]) * 5 * 0.15 +
    (100 - df["assignmentsCompleted"]) * 0.15
)

df["riskScore"] = df["riskScore"].clip(0, 100)

# 4. Feature columns (SAVE THIS)
feature_columns = [
    "attendancePercentage",
    "cgpa",
    "feeDelayDays",
    "classParticipationScore",
    "assignmentsCompleted",
    "attendancePenalty",
    "cgpaRisk",
    "feeDelayFlag",
    "feeDelayPenalty",
    "participationRisk",
    "assignmentRisk"
]

X = df[feature_columns]
y = df["riskScore"]

# 5. Train model
model = LinearRegression()
model.fit(X, y)

# 6. Save model
with open("student_risk_model.pkl", "wb") as f:
    pickle.dump(model, f)

# 7. Save feature columns
with open("feature_columns.pkl", "wb") as f:
    pickle.dump(feature_columns, f)

print("Training complete")
print("student_risk_model.pkl saved")
print("feature_columns.pkl saved")
