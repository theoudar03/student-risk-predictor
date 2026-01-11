import numpy as np
import pandas as pd

np.random.seed(42)

def extreme_strict_risk(att, cgpa, fee, assign, engage):
    """
    EXTREME STRICT risk logic used ONLY for data generation.
    ML must learn this implicitly.
    """

    # 1️⃣ Attendance dominance
    attendance_linear = (100 - att) * 0.50
    attendance_penalty = 45 * np.exp(-0.05 * att)

    # 2️⃣ CGPA amplified by attendance deficiency
    cgpa_risk = (10 - cgpa) * 10 * 0.20
    cgpa_amplified = cgpa_risk * (1 + (100 - att) / 100)

    # 3️⃣ Fee delay as independent dropout signal
    fee_risk = min(fee / 90, 1.0) * 15

    # 4️⃣ Weak buffers
    assignment_risk = (100 - assign) * 0.10
    engagement_risk = (10 - engage) * 0.5

    risk = (
        attendance_linear
        + attendance_penalty
        + cgpa_amplified
        + fee_risk
        + assignment_risk
        + engagement_risk
    )

    return np.clip(risk, 0, 100)


def explain_risk(att, cgpa, fee, assign, engage):
    reasons = []
    if att < 60:
        reasons.append("Low attendance")
    if cgpa < 5:
        reasons.append("Poor academic performance")
    if fee > 60:
        reasons.append("High fee delay")
    if assign < 50:
        reasons.append("Low assignment completion")
    if engage < 4:
        reasons.append("Low class engagement")
    return ", ".join(reasons) if reasons else "Consistent academic performance"


records = []
TOTAL = 2400  # >2000 samples

for _ in range(TOTAL):
    group = np.random.choice(["low", "medium", "high"], p=[0.33, 0.34, 0.33])

    if group == "low":
        att = np.random.randint(75, 101)
        cgpa = np.random.uniform(7.5, 10)
        fee = np.random.randint(0, 10)
        assign = np.random.randint(80, 101)
        engage = np.random.uniform(7, 10)

    elif group == "medium":
        att = np.random.randint(55, 75)
        cgpa = np.random.uniform(5.0, 7.5)
        fee = np.random.randint(10, 45)
        assign = np.random.randint(50, 80)
        engage = np.random.uniform(4, 7)

    else:
        att = np.random.randint(0, 55)
        cgpa = np.random.uniform(0.0, 5.0)
        fee = np.random.randint(30, 120)
        assign = np.random.randint(0, 50)
        engage = np.random.uniform(0, 4)

    risk = extreme_strict_risk(att, cgpa, fee, assign, engage)
    explanation = explain_risk(att, cgpa, fee, assign, engage)

    category = "Low" if risk <= 30 else "Medium" if risk <= 60 else "High"

    records.append([
        round(att, 1),
        round(cgpa, 2),
        fee,
        round(assign, 1),
        round(engage, 1),
        round(risk, 2),
        category,
        explanation
    ])

columns = [
    "attendance",
    "cgpa",
    "fee_delay",
    "assignments",
    "engagement",
    "risk_score",
    "risk_category",
    "risk_reason"
]

df = pd.DataFrame(records, columns=columns)
df.to_csv("synthetic_extreme_strict_students.csv", index=False)
print("[SUCCESS] Extreme strict synthetic dataset generated")