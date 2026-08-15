import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
import joblib

def main():
    print("=" * 70)
    print("STEP 1: Loading Dataset")
    print("=" * 70)
    df = pd.read_csv("UC05_DECISION.csv")
    print(f"Dataset loaded successfully. Shape: {df.shape}")
    
    print("\n" + "=" * 70)
    print("STEP 2: Selecting Features")
    print("=" * 70)
    features = [
        'ESTIMATED_PATIENTS',
        'PROVIDER_COUNT',
        'TOTAL_BENEFICIARIES',
        'TOTAL_SERVICES',
        'PATIENTS_PER_PROVIDER'
    ]
    print(f"Features selected for Isolation Forest: {features}")
    
    X_raw = df[features].copy()
    if X_raw.isnull().sum().sum() > 0:
        print("Handling missing values by filling with 0...")
        X_raw = X_raw.fillna(0)
        
    print("\n" + "=" * 70)
    print("STEP 3: Applying log1p Transform")
    print("=" * 70)
    X_log = np.log1p(np.maximum(0, X_raw))
    print("Log1p transformation complete.")
    
    print("\n" + "=" * 70)
    print("STEP 4: Scaling with StandardScaler")
    print("=" * 70)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_log)
    print(f"StandardScaler fitting complete. Matrix shape: {X_scaled.shape}")
    
    print("\n" + "=" * 70)
    print("STEP 5: Training Isolation Forest (contamination=0.05, n_estimators=200)")
    print("=" * 70)
    iso_forest = IsolationForest(
        contamination=0.05,
        random_state=42,
        n_estimators=200
    )
    iso_forest.fit(X_scaled)
    print("Isolation Forest model training complete.")
    
    print("\n" + "=" * 70)
    print("STEP 6: Predicting Anomaly Labels & Anomaly Scores")
    print("=" * 70)
    # -1 = anomaly, 1 = normal
    preds = iso_forest.predict(X_scaled)
    # Lower decision_function score = more anomalous
    scores = iso_forest.decision_function(X_scaled)
    
    anomaly_count = (preds == -1).sum()
    normal_count = (preds == 1).sum()
    pct_anomaly = (anomaly_count / len(df)) * 100
    
    print(f"Total Rows: {len(df)}")
    print(f"Anomalies Flagged (-1): {anomaly_count} ({pct_anomaly:.2f}%)")
    print(f"Normal Rows Flagged (1): {normal_count} ({100 - pct_anomaly:.2f}%)")
    
    print("\n" + "=" * 70)
    print("STEP 7: Adding 'is_anomaly' and 'anomaly_score' to Dataframe")
    print("=" * 70)
    df['is_anomaly'] = (preds == -1)  # True if anomaly, False if normal
    df['anomaly_label'] = preds       # -1 for anomaly, 1 for normal
    df['anomaly_score'] = scores
    
    print("Columns 'is_anomaly', 'anomaly_label', and 'anomaly_score' added successfully.")
    
    print("\n" + "=" * 70)
    print("STEP 8: Anomaly vs Non-Anomaly Feature Comparison Summary")
    print("=" * 70)
    
    summary_features = ['ESTIMATED_PATIENTS', 'PROVIDER_COUNT', 'PATIENTS_PER_PROVIDER', 'TOTAL_BENEFICIARIES', 'TOTAL_SERVICES']
    
    group_means = df.groupby('is_anomaly')[summary_features].mean()
    group_means.index = ['Normal (False)', 'Anomaly (True)']
    
    counts = df.groupby('is_anomaly').size()
    counts.index = ['Normal (False)', 'Anomaly (True)']
    
    group_means.insert(0, 'COUNT', counts)
    group_means['PCT_OF_TOTAL'] = (group_means['COUNT'] / len(df)) * 100
    
    print("\nFeature Means: Anomalies vs Non-Anomalies:")
    print(group_means.to_string())
    
    print("\n" + "=" * 70)
    print("STEP 9: Validation against ACCESS_GAP_LEVEL")
    print("=" * 70)
    if 'ACCESS_GAP_LEVEL' in df.columns:
        df['IS_HIGH_OR_CRITICAL_GAP'] = df['ACCESS_GAP_LEVEL'].isin(['CRITICAL GAP', 'HIGH GAP'])
        
        gap_val = df.groupby('is_anomaly').agg(
            TOTAL_COUNT=('ACCESS_GAP_LEVEL', 'count'),
            HIGH_OR_CRITICAL_COUNT=('IS_HIGH_OR_CRITICAL_GAP', 'sum'),
            PCT_HIGH_OR_CRITICAL_GAP=('IS_HIGH_OR_CRITICAL_GAP', lambda x: x.mean() * 100),
            CRITICAL_GAP_COUNT=('ACCESS_GAP_LEVEL', lambda x: (x == 'CRITICAL GAP').sum()),
            PCT_CRITICAL_GAP=('ACCESS_GAP_LEVEL', lambda x: (x == 'CRITICAL GAP').mean() * 100),
            HIGH_GAP_COUNT=('ACCESS_GAP_LEVEL', lambda x: (x == 'HIGH GAP').sum()),
            PCT_HIGH_GAP=('ACCESS_GAP_LEVEL', lambda x: (x == 'HIGH GAP').mean() * 100)
        )
        gap_val.index = ['Normal (False)', 'Anomaly (True)']
        print("\nAccess Gap Level Breakdown for Anomalies vs Non-Anomalies:")
        print(gap_val[['TOTAL_COUNT', 'HIGH_OR_CRITICAL_COUNT', 'PCT_HIGH_OR_CRITICAL_GAP', 'PCT_CRITICAL_GAP', 'PCT_HIGH_GAP']].to_string())
        
        print("\nFull ACCESS_GAP_LEVEL Distribution (%) by Anomaly Status:")
        ct = pd.crosstab(df['is_anomaly'], df['ACCESS_GAP_LEVEL'], normalize='index') * 100
        ct.index = ['Normal (False)', 'Anomaly (True)']
        print(ct.round(2).to_string())
    else:
        print("WARNING: 'ACCESS_GAP_LEVEL' column not found in dataset!")

    print("\n" + "=" * 70)
    print("STEP 10: Saving Model Payload to anomaly_model.pkl")
    print("=" * 70)
    model_payload = {
        'isolation_forest': iso_forest,
        'scaler': scaler,
        'features': features
    }
    joblib.dump(model_payload, 'anomaly_model.pkl')
    print("Saved model payload successfully to 'anomaly_model.pkl'.")
    
    print("\n" + "=" * 70)
    print("STEP 11: Saving Labeled Dataframe to UC05_DECISION_with_anomalies.csv")
    print("=" * 70)
    save_df = df.drop(columns=['IS_HIGH_OR_CRITICAL_GAP'], errors='ignore')
    save_df.to_csv("UC05_DECISION_with_anomalies.csv", index=False)
    print(f"Saved labeled dataframe successfully to 'UC05_DECISION_with_anomalies.csv'. Shape: {save_df.shape}")
    
    print("\n" + "=" * 70)
    print("ALL STEPS COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == '__main__':
    main()
