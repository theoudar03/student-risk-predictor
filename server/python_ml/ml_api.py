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

from typing import List

@app.post("/predict-risk-batch")
def predict_risk_batch(students: List[StudentData]):
    # 1. Prepare Batch DataFrame
    data_list = []
    for s in students:
        data_list.append({
            'attendance': s.attendancePercentage,
            'cgpa': s.cgpa,
            'fee_delay': s.feeDelayDays,
            'assignments': s.assignmentsCompleted,
            'engagement': s.classParticipationScore
        })
    
    # 2. Convert to DataFrame and enforce column order
    input_df = pd.DataFrame(data_list)
    if input_df.empty:
        return []
        
    input_df = input_df[['attendance', 'cgpa', 'fee_delay', 'assignments', 'engagement']]
    
    # 3. Batch Inference (Optimized)
    try:
        predictions = model.predict(input_df)
    except Exception as e:
        print(f"Batch Error: {e}")
        # Return zeros on catastrophic failure, but this shouldn't happen with valid DF
        return [{"riskScore": 0, "riskLevel": "Low"} for _ in students]

    # 4. Process Results
    results = []
    for score in predictions:
        score = float(max(0, min(100, score)))
        level = "Low"
        if score > 50: level = "High"
        elif score > 25: level = "Medium"
        
        results.append({
            "riskScore": round(score),
            "riskLevel": level
        })
        
    print(f"Computed {len(results)} predictions in batch.")
    return results

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
