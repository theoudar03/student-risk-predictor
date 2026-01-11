import numpy as np
import pandas as pd

np.random.seed(42)

def extreme_dropout_risk(att, cgpa, fee, assign, engage):

    # Weakness normalization
    w_att = (100 - att) / 100
    w_cgpa = (10 - cgpa) / 10
    w_fee = min(fee / 90, 1.0)
    w_assign = (100 - assign) / 100
    w_engage = (10 - engage) / 10

    # Core weighted weakness
    base_risk = (
        w_att * 2.5 +
        w_cgpa * 2.0 +
        w_fee * 1.5 +
        w_assign * 1.0 +
        w_engage * 1.0
    )

    # Compound stress (mental + physical + financial)
    compound_stress = (w_att * w_cgpa * w_fee) ** 0.4

    risk = (base_risk + compound_stress * 2.0) * 20

    return np.clip(risk, 0, 100)


def risk_reason(att, cgpa, fee, assign, engage):
    reasons = []
    if att < 65: reasons.append("Low attendance")
    if cgpa < 5.5: reasons.append("Low academic performance")
    if fee > 60: reasons.append("Financial stress due to fee delay")
    if assign < 50: reasons.append("Poor assignment completion")
    if engage < 4: reasons.append("Low engagement / motivation")
    return ", ".join(reasons) or "Student shows overall stability"


records = []
TOTAL = 3000

for _ in range(TOTAL):

    group = np.random.choice(["low", "medium", "high"], p=[0.33, 0.34, 0.33])

    if group == "low":
        att = np.random.randint(80, 101)
        cgpa = np.random.uniform(7.5, 10)
        fee = np.random.randint(0, 10)
        assign = np.random.randint(80, 101)
        engage = np.random.uniform(7, 10)

    elif group == "medium":
        att = np.random.randint(60, 80)
        cgpa = np.random.uniform(5.5, 7.5)
        fee = np.random.randint(10, 50)
        assign = np.random.randint(50, 80)
        engage = np.random.uniform(4, 7)

    else:
        att = np.random.randint(0, 60)
        cgpa = np.random.uniform(0, 5.5)
        fee = np.random.randint(40, 120)
        assign = np.random.randint(0, 50)
        engage = np.random.uniform(0, 4)

    risk = extreme_dropout_risk(att, cgpa, fee, assign, engage)
    # Updated Thresholds: Low(0-25), Medium(26-50), High(51-100)
    category = "Low" if risk <= 25 else "Medium" if risk <= 50 else "High"

    records.append([
        round(att,1), round(cgpa,2), fee,
        round(assign,1), round(engage,1),
        round(risk,2), category,
        risk_reason(att, cgpa, fee, assign, engage)
    ])

df = pd.DataFrame(records, columns=[
    "attendance","cgpa","fee_delay","assignments","engagement",
    "risk_score","risk_category","risk_reason"
])

df.to_csv("synthetic_extreme_dropout_model.csv", index=False)

# Removing Emojis to prevent UnicodeEncodeError on Windows
print("[DONE] Extreme Dropout Dataset Generated:", len(df))
print(df.head())