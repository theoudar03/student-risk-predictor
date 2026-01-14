from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import os
from typing import List

app = FastAPI(title="Student Risk ML Service")

# -------------------------------
# LOAD ML MODEL (ONCE)
# -------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "risk_calc_model.pkl")

if not os.path.isfile(MODEL_PATH):
    raise FileNotFoundError(f"ML model not found: {MODEL_PATH}")

model = joblib.load(MODEL_PATH)
print("✅ ML model loaded")

# -------------------------------
# REQUEST SCHEMA (AUTO-VALIDATION)
# -------------------------------
class RiskInput(BaseModel):
    attendance: float
    cgpa: float
    fee_delay: float
    assignments: float
    engagement: float

# -------------------------------
# RESPONSE SCHEMA (OPTIONAL)
# -------------------------------
class RiskOutput(BaseModel):
    risk_score: float
    risk_category: str
    risk_reasons: List[str]

# -------------------------------
# POLICY: RISK CATEGORY
# -------------------------------
def get_risk_category(risk_score: float) -> str:
    if risk_score <= 30:
        return "Low"
    elif risk_score <= 60:
        return "Medium"
    else:
        return "High"

# -------------------------------
# POLICY: RISK REASONS
# -------------------------------
def get_risk_reasons(data: RiskInput) -> List[str]:
    reasons = []

    if data.attendance < 65:
        reasons.append("Low attendance")

    if data.cgpa < 5.5:
        reasons.append("Low academic performance")

    if data.fee_delay > 60:
        reasons.append("Financial stress due to fee delay")

    if data.assignments < 50:
        reasons.append("Poor assignment completion")

    if data.engagement < 4:
        reasons.append("Low engagement or motivation")

    if not reasons:
        reasons.append("Student shows overall stability")

    return reasons

# -------------------------------
# API: CALCULATE RISK
# -------------------------------
@app.post(
    "/api/ml/calculate-risk",
    response_model=RiskOutput
)
def calculate_risk(payload: RiskInput):
    """
    Input  : student parameters
    Output : risk_score + risk_category + risk_reasons
    """
    import time
    start_time = time.time()
    
    try:
        X = np.array([[
            payload.attendance,
            payload.cgpa,
            payload.fee_delay,
            payload.assignments,
            payload.engagement
        ]])

        # ML prediction
        risk_score = float(model.predict(X)[0])
        risk_score = round(max(0, min(100, risk_score)), 2)

        # Policy logic (NOT ML)
        risk_category = get_risk_category(risk_score)
        risk_reasons = get_risk_reasons(payload)

        duration = round((time.time() - start_time) * 1000, 2)
        print(f"✅ Prediction for {payload} took {duration}ms. Score: {risk_score}")

        return {
            "risk_score": risk_score,
            "risk_category": risk_category,
            "risk_reasons": risk_reasons
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Risk calculation failed: {str(e)}"
        )

# -------------------------------
# HEALTH CHECK
# -------------------------------
@app.get("/health")
def health():
    return {"status": "ML service running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
