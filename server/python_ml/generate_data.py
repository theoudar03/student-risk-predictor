import numpy as np
import pandas as pd

np.random.seed(42)

def calculate_risk_strict(att, cgpa, fee, part, assign):
    """
    Strict Academic Risk Formula (Mathematical, No Branching)
    Uses non-linear transformations to enforce penalties naturally.
    """
    # 1. Base Linear Risk (0-100 scale components)
    # Weights: Att(0.35), CGPA(0.20), Fee(0.15), Part(0.15), Assign(0.15)
    linear_risk = (
        (100 - att) * 0.35 +
        (10 - cgpa) * 10 * 0.20 +
        (fee / 60) * 100 * 0.15 +  # Normalize fee delay (e.g. 60 days = 100%)
        (10 - part) * 10 * 0.15 +
        (100 - assign) * 0.15
    )
    
    # 2. Strict Exponential Penalty for Attendance
    # This mathematically mimics the "If Att < X then Penalty" rule without using 'if'
    # As attendance drops below 60, this term explodes, creating a soft-barrier.
    att_penalty = 30 * np.exp(-0.08 * att)  # ~30pts at 0% att, ~0.2pts at 100% att
    
    # 3. Combine
    risk = linear_risk + att_penalty
    
    # 4. Add realistic noise
    risk += np.random.normal(0, 2)
    
    return np.clip(risk, 0, 100)

records = []

# Generate densely populated training data
for _ in range(2000):
    attendance = np.random.randint(0, 101)
    cgpa = round(np.random.uniform(0, 10), 2)
    fee_delay = np.random.randint(0, 90) # Cap realistic delay for training
    participation = round(np.random.uniform(0, 10), 1)
    assignments = np.random.randint(0, 101)

    risk_score = calculate_risk_strict(
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

columns = ["attendance", "cgpa", "fee_delay", "participation", "assignments", "risk_score"]
df = pd.DataFrame(records, columns=columns)

df.to_csv("synthetic_student_risk_data.csv", index=False)

print("Success: Generated 2000 strict academic samples.")
print(df.head())