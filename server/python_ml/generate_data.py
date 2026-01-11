import numpy as np
import pandas as pd

np.random.seed(42)

def calculate_risk(att, cgpa, fee, part, assign):
    """
    Human-like risk scoring logic (used only for data generation)
    """
    # Increased weight for attendance (0.45) to ensure it dominates
    risk = (
        (100 - att) * 0.45 +
        (10 - cgpa) * 10 * 0.20 +
        fee * 0.15 +
        (10 - part) * 5 * 0.10 +
        (100 - assign) * 0.10
    )
    
    # Non-linear penalty for critical attendance shortage
    # If attendance is below 60%, Risk jumps by 25 points immediately
    if att < 60:
        risk += 25
        
    # add small randomness to avoid perfect patterns
    risk += np.random.normal(0, 3)
    return np.clip(risk, 0, 100)

records = []

for _ in range(1500):  # 1500 samples
    attendance = np.random.randint(0, 101)
    cgpa = round(np.random.uniform(0, 10), 2)
    fee_delay = np.random.randint(0, 121)
    participation = round(np.random.uniform(0, 10), 1)
    assignments = np.random.randint(0, 101)

    risk_score = calculate_risk(
        attendance, cgpa, fee_delay, participation, assignments
    )

    records.append([
        attendance,
        cgpa,
        fee_delay,
        participation,
        assignments,
        round(risk_score, 2)
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

# Save dataset
df.to_csv("synthetic_student_risk_data.csv", index=False)

print("Success: Synthetic dataset generated")
print("Total samples:", len(df))
print(df.head())
