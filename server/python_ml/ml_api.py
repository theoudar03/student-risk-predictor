from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

app = FastAPI()

class StudentData(BaseModel):
    attendancePercentage: float
    cgpa: float
    feeDelayDays: int
    classParticipationScore: int
    assignmentsCompleted: int

@app.post("/predict-risk")
def predict_risk(data: StudentData):
    # ML Logic (Simple Weighted Rule-based for now, extendable to Scikit-Learn)
    # Weights based on assumed importance
    risk_score = 0
    
    # 1. Attendance (High Impact) - Weight 35%
    # < 75% starts adding risk rapidly
    if data.attendancePercentage < 50:
        risk_score += 35
    elif data.attendancePercentage < 75:
        risk_score += 20
    elif data.attendancePercentage < 85:
        risk_score += 5
        
    # 2. CGPA (High Impact) - Weight 30%
    # < 5.0 is critical
    if data.cgpa < 4.0:
        risk_score += 30
    elif data.cgpa < 6.0:
        risk_score += 20
    elif data.cgpa < 7.5:
        risk_score += 5
        
    # 3. Fee Delay (Medium Impact) - Weight 15%
    if data.feeDelayDays > 60:
        risk_score += 15
    elif data.feeDelayDays > 30:
        risk_score += 10
    elif data.feeDelayDays > 7:
        risk_score += 5
        
    # 4. Assignments (Low-Medium Impact) - Weight 10%
    if data.assignmentsCompleted < 50:
        risk_score += 10
    elif data.assignmentsCompleted < 80:
        risk_score += 5
        
    # 5. Class Participation (Low Impact) - Weight 10%
    if data.classParticipationScore < 3:
        risk_score += 10
    elif data.classParticipationScore < 5:
        risk_score += 5

    # Cap score at 100
    risk_score = min(100, risk_score)
    
    # Determined Risk Level
    risk_level = "Low"
    if risk_score >= 70:
        risk_level = "High"
    elif risk_score >= 35:
        risk_level = "Medium"

    return {
        "riskScore": risk_score,
        "riskLevel": risk_level
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
