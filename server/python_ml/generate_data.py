import numpy as np
import pandas as pd

np.random.seed(42)

def strict_risk_score(att, cgpa, fee, assign, engage):
    # Attendance (absolute)
    att_linear = (100 - att) * 0.50
    att_exp = 45 * np.exp(-0.05 * att)

    # CGPA (attendance-amplified)
    cgpa_base = (10 - cgpa) * 10 * 0.20
    cgpa_effective = cgpa_base * (1 + (100 - att) / 100)

    # Fee delay (independent)
    fee_risk = min(fee / 90, 1.0) * 15

    # Assignments (limited buffer)
    assign_risk = (100 - assign) * 0.10

    # Engagement (weak signal)
    engage_risk = (10 - engage) * 0.5

    # Total risk
    risk = (
        att_linear +
        att_exp +
        cgpa_effective +
        fee_risk +
        assign_risk +
        engage_risk
    )

    # small realism noise
    risk += np.random.normal(0, 2)

    return np.clip(risk, 0, 100)

records = []

for _ in range(2500):  # 2500 samples
    attendance = np.random.randint(0, 101)
    cgpa = round(np.random.uniform(0, 10), 2)
    fee_delay = np.random.randint(0, 121)
    assignments = np.random.randint(0, 101)
    participation = round(np.random.uniform(0, 10), 1)

    risk = strict_risk_score(
        attendance,
        cgpa,
        fee_delay,
        assignments,
        participation
    )

    records.append([
        attendance,
        cgpa,
        fee_delay,
        participation,
        assignments,
        round(risk, 2)
    ])

columns = [
    "attendance",
    "cgpa",
    "fee_delay",
    "participation",
    "assignments",
    "risk_score"
]

df = pd.DataFrame(records, columns=columns)

df.to_csv("synthetic_student_risk_data.csv", index=False)

print("Success: Generated 2500 strict academic samples.")
print(df.head())