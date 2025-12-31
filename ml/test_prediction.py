import pickle
import pandas as pd

# Load feature columns
with open("feature_columns.pkl", "rb") as f:
    feature_columns = pickle.load(f)

# Load model
with open("student_risk_model.pkl", "rb") as f:
    model = pickle.load(f)

# Sample student
student = {
    "attendancePercentage": 42,
    "cgpa": 5.4,
    "feeDelayDays": 75,
    "classParticipationScore": 3,
    "assignmentsCompleted": 50,
    "attendancePenalty": 1,
    "cgpaRisk": 1,
    "feeDelayFlag": 1,
    "feeDelayPenalty": 1,
    "participationRisk": 1,
    "assignmentRisk": 1
}

df = pd.DataFrame([student])[feature_columns]

risk_score = model.predict(df)[0]
risk_score = max(0, min(100, risk_score))

print("🎯 Risk Score:", round(risk_score, 2))
