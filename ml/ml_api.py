import pickle
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

# Load model
with open("student_risk_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("feature_columns.pkl", "rb") as f:
    feature_columns = pickle.load(f)

app = FastAPI()

class StudentInput(BaseModel):
    attendancePercentage: float
    cgpa: float
    feeDelayDays: int
    classParticipationScore: float
    assignmentsCompleted: int

def get_risk_level(score):
    if score <= 35:
        return "Low"
    elif score <= 70:
        return "Medium"
    else:
        return "High"

@app.post("/predict-risk")
def predict_risk(student: StudentInput):

    engineered = {
        "attendancePercentage": student.attendancePercentage,
        "cgpa": student.cgpa,
        "feeDelayDays": student.feeDelayDays,
        "classParticipationScore": student.classParticipationScore,
        "assignmentsCompleted": student.assignmentsCompleted,
        "attendancePenalty": int(student.attendancePercentage < 50),
        "cgpaRisk": int(student.cgpa < 6.0),
        "feeDelayFlag": int(student.feeDelayDays > 15),
        "feeDelayPenalty": int(student.feeDelayDays > 60),
        "participationRisk": int(student.classParticipationScore < 5),
        "assignmentRisk": int(student.assignmentsCompleted < 60)
    }

    df = pd.DataFrame([engineered])[feature_columns]

    risk_score = model.predict(df)[0]
    risk_score = max(0, min(100, risk_score))

    return {
        "riskScore": round(risk_score, 2),
        "riskLevel": get_risk_level(risk_score)
    }
    