from sklearn.ensemble import RandomForestRegressor
import pandas as pd
import joblib

df = pd.read_csv("synthetic_extreme_dropout_model.csv")

X = df[["attendance","cgpa","fee_delay","assignments","engagement"]]
y = df["risk_score"]

model = RandomForestRegressor(
    n_estimators=500,
    max_depth=16,
    min_samples_leaf=6,
    random_state=42
)

model.fit(X, y)

# Save with metadata in the updated dictionary format for version control
model_data = {
    'model': model,
    'metadata': {
        'version': 'v4.0-ExtremeDropout',
        'training_date': str(pd.Timestamp.now()),
        'samples': len(df),
        'author': 'System_Extreme_Dropout_v4'
    }
}

# Save as 'risk_model.pkl' (standard) and 'risk_model_extreme_dropout_v4.pkl' (specific)
joblib.dump(model_data, "risk_model_extreme_dropout_v4.pkl")
joblib.dump(model_data, "risk_model.pkl")

# Removing Emojis to prevent UnicodeEncodeError on Windows
print("[DONE] NEW EXTREME DROPOUT MODEL SAVED (v4.0)")
