import joblib
import numpy as np
import os

# -------------------------------
# LOAD MODEL
# -------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(
    BASE_DIR,
    "risk_calc_model.pkl"
)

if not os.path.isfile(MODEL_PATH):
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

model = joblib.load(MODEL_PATH)
print("✅ ML model loaded successfully\n")

# -------------------------------
# POLICY LOGIC (SAME AS API)
# -------------------------------
def get_risk_category(risk_score: float) -> str:
    if risk_score <= 30:
        return "Low"
    elif risk_score < 60:
        return "Medium"
    else:
        return "High"


def get_risk_reasons(att, cgpa, fee, assign, engage):
    reasons = []

    if att < 65:
        reasons.append("Low attendance")
    if cgpa < 5.5:
        reasons.append("Low academic performance")
    if fee > 60:
        reasons.append("Financial stress due to fee delay")
    if assign < 50:
        reasons.append("Poor assignment completion")
    if engage < 4:
        reasons.append("Low engagement or motivation")

    if not reasons:
        reasons.append("Student shows overall stability")

    return reasons

# -------------------------------
# GET USER INPUT
# -------------------------------
def get_float(prompt, min_val, max_val):
    while True:
        try:
            val = float(input(prompt))
            if val < min_val or val > max_val:
                raise ValueError
            return val
        except ValueError:
            print(f"❌ Enter a value between {min_val} and {max_val}")

print("📥 Enter Student Details\n")

attendance = get_float("Attendance (0–100): ", 0, 100)
cgpa = get_float("CGPA (0–10): ", 0, 10)
fee_delay = get_float("Fee Delay Days (>=0): ", 0, 1000)
assignments = get_float("Assignments % (0–100): ", 0, 100)
engagement = get_float("Engagement (0–10): ", 0, 10)

# -------------------------------
# ML PREDICTION
# -------------------------------
X = np.array([[attendance, cgpa, fee_delay, assignments, engagement]])
risk_score = float(model.predict(X)[0])
risk_score = round(max(0, min(100, risk_score)), 2)

risk_category = get_risk_category(risk_score)
risk_reasons = get_risk_reasons(
    attendance, cgpa, fee_delay, assignments, engagement
)

# -------------------------------
# OUTPUT
# -------------------------------
print("\n🧠 ML RISK ANALYSIS RESULT")
print("──────────────────────────")
print(f"Risk Score      : {risk_score}%")
print(f"Risk Category   : {risk_category}")
print("Risk Reasons    :")

for r in risk_reasons:
    print(f"  • {r}")

print("\n✅ Test completed successfully")