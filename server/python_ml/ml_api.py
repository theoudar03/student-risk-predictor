from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import joblib
import pandas as pd
import numpy as np
import os

app = FastAPI()

# Load the trained model
try:
    model = joblib.load('risk_model.pkl')
    print("ML Model loaded successfully")
except:
    print("Error loading ML Model. Ensure 'risk_model.pkl' exists.")

class StudentData(BaseModel):
    attendancePercentage: float
    cgpa: float
    feeDelayDays: int
    classParticipationScore: int
    assignmentsCompleted: int

@app.post("/predict-risk")
def predict_risk(data: StudentData):
    # Prepare Input for Model
    input_df = pd.DataFrame([{
        'attendance': data.attendancePercentage,
        'cgpa': data.cgpa,
        'fee_delay': data.feeDelayDays,
        'participation': data.classParticipationScore,
        'assignments': data.assignmentsCompleted
    }])
    
    # Predict using the loaded .pkl model
    try:
        prediction = model.predict(input_df)
        risk_score = float(prediction[0])
    except Exception as e:
        print(f"Prediction Error: {e}")
        risk_score = 0
    
    # Cap score at 0-100
    risk_score = max(0, min(100, risk_score))
    
    # Determine Level
    risk_level = "Low"
    if risk_score >= 70:
        risk_level = "High"
    elif risk_score >= 35:
        risk_level = "Medium"

    return {
        "riskScore": round(risk_score),
        "riskLevel": risk_level
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
