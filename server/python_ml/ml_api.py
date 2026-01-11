from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import joblib
import pandas as pd
import numpy as np
import os

app = FastAPI()

# Global variables
model = None
model_metadata = {"version": "unknown", "type": "legacy"}

# Load the trained model
try:
    loaded_data = joblib.load('risk_model.pkl')
    
    if isinstance(loaded_data, dict) and 'model' in loaded_data:
        # New Format with Metadata
        model = loaded_data['model']
        model_metadata = loaded_data.get('metadata', {})
        print(f"[SUCCESS] ML Model Loaded: {model_metadata.get('version')} (Trained: {model_metadata.get('training_date')})")
    else:
        # Legacy Format (Raw Model)
        model = loaded_data
        print("[WARNING] Legacy ML Model loaded (No metadata)")
        
except Exception as e:
    print(f"[ERROR] Error loading ML Model: {e}")

@app.get("/health")
def health_check():
    return {
        "status": "active", 
        "model_version": model_metadata.get('version'), 
        "model_type": "RandomForestRegressor"
    }

class StudentData(BaseModel):
    attendancePercentage: float
    cgpa: float
    feeDelayDays: int
    classParticipationScore: int
    assignmentsCompleted: int

@app.post("/predict-risk")
def predict_risk(data: StudentData):
    # Prepare Input for Model
    # Prepare Input for Model
    input_df = pd.DataFrame([{
        'attendance': data.attendancePercentage,
        'cgpa': data.cgpa,
        'fee_delay': data.feeDelayDays,
        'assignments': data.assignmentsCompleted,
        'engagement': data.classParticipationScore  # Map 'classParticipationScore' to 'engagement'
    }])
    
    # 🌟 CRITICAL: Enforce Column Order to match Training
    input_df = input_df[['attendance', 'cgpa', 'fee_delay', 'assignments', 'engagement']]
    
    # Log for Debugging
    print(f"Predicting for: {input_df.values.tolist()}")
    
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
    # Determine Level (Updated stricter thresholds)
    risk_level = "Low"
    if risk_score > 50:
        risk_level = "High"
    elif risk_score > 25: 
        risk_level = "Medium"

    return {
        "riskScore": round(risk_score),
        "riskLevel": risk_level
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
