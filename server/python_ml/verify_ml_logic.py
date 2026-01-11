
import requests
import json
import time

# --- Configuration ---
ML_SERVICE_URL = "http://127.0.0.1:8001/predict-risk"  # Directly testing ML API locally
BACKEND_BASE_URL = "http://localhost:5000/api"      # Testing Backend API

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def test_ml_direct(tc_id, inputs, expected_range, description):
    """Directly Tests Python ML Service logic"""
    log(f"--- Running {tc_id}: {description} ---")
    try:
        response = requests.post(ML_SERVICE_URL, json=inputs)
        if response.status_code != 200:
            log(f"ML Service failed with {response.status_code}", "FAIL")
            return
        
        data = response.json()
        score = data.get("riskScore")
        level = data.get("riskLevel")
        
        log(f"Input: {inputs}")
        log(f"Output: {score} ({level})")
        
        if expected_range[0] <= score <= expected_range[1]:
            log(f"Score {score} is within expected range {expected_range}", "PASS")
        else:
            log(f"Score {score} is OUTSIDE expected range {expected_range}", "FAIL")
            
    except Exception as e:
        log(f"Error testing ML: {e}", "FAIL")

# --- Test Cases Definitions ---

# TC-01: Good Student
test_ml_direct(
    "TC-01", 
    {
        "attendancePercentage": 88,
        "cgpa": 8.4,
        "feeDelayDays": 2,
        "classParticipationScore": 8,
        "assignmentsCompleted": 92
    },
    [5, 25],
    "New Student - Low Risk"
)

# TC-04: High Risk Student
test_ml_direct(
    "TC-04", 
    {
        "attendancePercentage": 15,
        "cgpa": 2.1,
        "feeDelayDays": 95,
        "classParticipationScore": 1,
        "assignmentsCompleted": 10
    },
    [85, 100],
    "Edge Case - Very High Risk"
)

# TC-05: Very Low Risk Student
test_ml_direct(
    "TC-05", 
    {
        "attendancePercentage": 97,
        "cgpa": 9.6,
        "feeDelayDays": 0,
        "classParticipationScore": 10,
        "assignmentsCompleted": 100
    },
    [0, 10],
    "Edge Case - Very Low Risk"
)

# TC: Aarav Scenario (The one user complained about)
test_ml_direct(
    "TC-AARAV",
    {
        "attendancePercentage": 51,
        "cgpa": 6.6,
        "feeDelayDays": 0,    # Assuming 0 as per typical hidden defaults
        "classParticipationScore": 8,
        "assignmentsCompleted": 100 # Assuming high based on "Engagement"
    },
    [40, 80],
    "Aarav Scenario - 51% Attendance Check"
)

print("\n--- ML Integrity Tests Completed ---")
