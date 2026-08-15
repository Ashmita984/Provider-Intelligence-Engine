import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
import joblib

def main():
    print("=" * 75)
    print("STEP 1: Loading Dataset & Computing Ratio Features")
    print("=" * 75)
    df = pd.read_csv("UC05_DECISION.csv")
    print(f"Dataset loaded successfully. Shape: {df.shape}")
    
    # Compute the 3 ratio features
    df['providers_per_1000_patients'] = (df['PROVIDER_COUNT'] / df['ESTIMATED_PATIENTS']) * 1000
    df['services_per_beneficiary'] = df['TOTAL_SERVICES'] / (df['TOTAL_BENEFICIARIES'] + 1)
    # PATIENTS_PER_PROVIDER is already present in dataset
    
    ratio_features = [
        'PATIENTS_PER_PROVIDER',
        'providers_per_1000_patients',
        'services_per_beneficiary'
    ]
    
    print("\n" + "=" * 75)
    print("STEP 2: Handling Infinite & Missing Values")
    print("=" * 75)
    X_raw = df[ratio_features].copy()
    
    # Replace inf/-inf with NaN
    inf_count = np.isinf(X_raw).sum().sum()
    nan_count = X_raw.isna().sum().sum()
    print(f"Initial Infinite values detected: {inf_count}")
    print(f"Initial NaN values detected:      {nan_count}")
    
    X_clean = X_raw.replace([np.inf, -np.inf], np.nan).fillna(0)
    
    print("\nSummary of Ratio Features (Raw Cleaned Scale):")
    print(X_clean.describe().T[['min', 'mean', '50%', 'max', 'std']])
    
    print("\n" + "=" * 75)
    print("STEP 3: Applying log1p Transform & StandardScaler")
    print("=" * 75)
    X_log = np.log1p(np.maximum(0, X_clean))
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_log)
    print(f"StandardScaler complete. Scaled matrix shape: {X_scaled.shape}")
    
    print("\n" + "=" * 75)
    print("STEP 4: Training Ratio-Based Isolation Forest (contamination=0.05)")
    print("=" * 75)
    iso_forest = IsolationForest(
        contamination=0.05,
        random_state=42,
        n_estimators=200
    )
    iso_forest.fit(X_scaled)
    print("Isolation Forest trained successfully on ratio features.")
    
    print("\n" + "=" * 75)
    print("STEP 5: Predicting Anomalies & Adding Output Columns")
    print("=" * 75)
    preds = iso_forest.predict(X_scaled)
    scores = iso_forest.decision_function(X_scaled)
    
    anomaly_count = (preds == -1).sum()
    normal_count = (preds == 1).sum()
    
    print(f"Total Rows: {len(df)}")
    print(f"Anomalies Flagged (-1): {anomaly_count} ({(anomaly_count/len(df))*100:.2f}%)")
    print(f"Normal Rows Flagged (1): {normal_count} ({(normal_count/len(df))*100:.2f}%)")
    
    df['is_anomaly'] = (preds == -1)
    df['anomaly_label'] = preds
    df['anomaly_score'] = scores
    
    print("\n" + "=" * 75)
    print("STEP 6: Anomaly vs Normal Group Summary (Provider Count, Patient Count, Ratios)")
    print("=" * 75)
    compare_cols = [
        'PROVIDER_COUNT',
        'ESTIMATED_PATIENTS',
        'PATIENTS_PER_PROVIDER',
        'providers_per_1000_patients',
        'services_per_beneficiary'
    ]
    
    group_summary = df.groupby('is_anomaly')[compare_cols].mean()
    group_summary.index = ['Normal (False)', 'Anomaly (True)']
    
    counts = df.groupby('is_anomaly').size()
    counts.index = ['Normal (False)', 'Anomaly (True)']
    
    group_summary.insert(0, 'COUNT', counts)
    group_summary['PCT_TOTAL'] = (group_summary['COUNT'] / len(df)) * 100
    
    print("\nGroup Means Comparison (Original Scale):")
    print(group_summary.to_string())
    
    print("\n" + "=" * 75)
    print("STEP 7: Validation against ACCESS_GAP_LEVEL")
    print("=" * 75)
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
        print("\nAccess Gap Level Validation Breakdown:")
        print(gap_val[['TOTAL_COUNT', 'HIGH_OR_CRITICAL_COUNT', 'PCT_HIGH_OR_CRITICAL_GAP', 'PCT_CRITICAL_GAP', 'PCT_HIGH_GAP']].to_string())
        
        print("\nFull ACCESS_GAP_LEVEL Distribution (%) by Anomaly Status:")
        ct = pd.crosstab(df['is_anomaly'], df['ACCESS_GAP_LEVEL'], normalize='index') * 100
        ct.index = ['Normal (False)', 'Anomaly (True)']
        print(ct.round(2).to_string())
    else:
        print("WARNING: ACCESS_GAP_LEVEL not present in dataframe!")

    print("\n" + "=" * 75)
    print("STEP 8: Saving Updated Model & Labeled CSV")
    print("=" * 75)
    model_payload = {
        'isolation_forest': iso_forest,
        'scaler': scaler,
        'features': ratio_features
    }
    
    # Save both designated ratio filenames and standard filenames
    joblib.dump(model_payload, 'anomaly_model_ratio.pkl')
    joblib.dump(model_payload, 'anomaly_model.pkl')
    print("Saved model payloads to 'anomaly_model_ratio.pkl' and 'anomaly_model.pkl'.")
    
    save_df = df.drop(columns=['IS_HIGH_OR_CRITICAL_GAP'], errors='ignore')
    save_df.to_csv("UC05_DECISION_with_anomalies_ratio.csv", index=False)
    save_df.to_csv("UC05_DECISION_with_anomalies.csv", index=False)
    print(f"Saved labeled dataframes to 'UC05_DECISION_with_anomalies_ratio.csv' and 'UC05_DECISION_with_anomalies.csv'. Shape: {save_df.shape}")
    
    print("\n" + "=" * 75)
    print("ALL STEPS COMPLETED SUCCESSFULLY!")
    print("=" * 75)

if __name__ == '__main__':
    main()
