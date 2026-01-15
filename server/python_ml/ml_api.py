from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import os
import time
from typing import List

app = FastAPI(title="Student Risk ML Service (Strict Policy)")

# -------------------------------------------------
# LOAD ML MODEL (STRICT POLICY MODEL)
# -------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(
    BASE_DIR,
    "risk_calc_model.pkl"
)

if not os.path.isfile(MODEL_PATH):
    raise FileNotFoundError(f"ML model not found: {MODEL_PATH}")

model = joblib.load(MODEL_PATH)
print("✅ Strict-policy ML model loaded")

# -------------------------------------------------
# REQUEST SCHEMA
# -------------------------------------------------
class RiskInput(BaseModel):
    attendance: float = Field(..., ge=0, le=100)
    cgpa: float = Field(..., ge=0, le=10)
    fee_delay: float = Field(..., ge=0)
    assignments: float = Field(..., ge=0, le=100)
    engagement: float = Field(..., ge=0, le=10)

# -------------------------------------------------
# RESPONSE SCHEMA
# -------------------------------------------------
class RiskOutput(BaseModel):
    risk_score: float
    risk_category: str
    risk_reasons: List[str]

# -------------------------------------------------
# POLICY: RISK CATEGORY (STRICT)
# -------------------------------------------------
def get_risk_category(risk_score: float) -> str:
    if risk_score <= 30:
        return "Low"
    elif risk_score < 60:
        return "Medium"
    else:
        return "High"

# -------------------------------------------------
# POLICY: RISK REASONS (STRICT OVERRIDE)
# -------------------------------------------------
def get_risk_reasons(data: RiskInput, risk_score: float) -> List[str]:
    reasons = []

    # 🔴 PRIORITY 1 — ATTENDANCE < 50
    if data.attendance < 50:
        reasons.append(
            "Critically low attendance – immediate intervention required"
        )

        # Supporting factors (informational only)
        if data.cgpa < 7:
            reasons.append("Low academic performance")
        if data.fee_delay > 60:
            reasons.append("Financial stress due to fee delay")
        if data.assignments < 50:
            reasons.append("Poor assignment completion")
        if data.engagement < 4:
            reasons.append("Low engagement or motivation")

        return reasons  # STOP: attendance dominates

    # 🟠 PRIORITY 2 — CGPA < 7
    if data.cgpa < 7:
        reasons.append("Low academic performance")

    # Supporting factors
    if data.attendance < 65:
        reasons.append("Low attendance")
    if data.fee_delay > 60:
        reasons.append("Financial stress due to fee delay")
    if data.assignments < 50:
        reasons.append("Poor assignment completion")
    if data.engagement < 4:
        reasons.append("Low engagement or motivation")

    # 🟡 CUMULATIVE MODERATE RISK
    if not reasons and risk_score >= 30:
        reasons.append("Multiple moderate risk factors combined")

    # 🟢 STABLE
    if not reasons:
        reasons.append("No significant risk indicators detected")

    return reasons

# -------------------------------------------------
# API: CALCULATE RISK
# -------------------------------------------------
@app.post(
    "/api/ml/calculate-risk",
    response_model=RiskOutput
)
def calculate_risk(payload: RiskInput):
    start_time = time.time()

    try:
        # -----------------------------------------
        # ML INPUT (FEATURE-NAME SAFE)
        # -----------------------------------------
        X = pd.DataFrame([{
            "attendance": payload.attendance,
            "cgpa": payload.cgpa,
            "fee_delay": payload.fee_delay,
            "assignments": payload.assignments,
            "engagement": payload.engagement
        }])

        # -----------------------------------------
        # ML PREDICTION
        # -----------------------------------------
        risk_score = float(model.predict(X)[0])
        risk_score = round(max(0, min(100, risk_score)), 2)

        # -----------------------------------------
        # POLICY APPLICATION (NOT ML)
        # -----------------------------------------
        risk_category = get_risk_category(risk_score)
        risk_reasons = get_risk_reasons(payload, risk_score)

        duration = round((time.time() - start_time) * 1000, 2)
        print(
            f"✅ Prediction completed in {duration}ms | "
            f"Score={risk_score}, Category={risk_category}"
        )

        return RiskOutput(
            risk_score=risk_score,
            risk_category=risk_category,
            risk_reasons=risk_reasons
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Risk calculation failed: {str(e)}"
        )

# -------------------------------------------------
# HEALTH CHECK
# -------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ML service running",
        "model": "strict_policy_v1"
    }

# -------------------------------------------------
# LOCAL RUN
# -------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)