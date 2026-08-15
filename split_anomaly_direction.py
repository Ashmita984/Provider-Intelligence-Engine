import pandas as pd
import numpy as np

def main():
    print("=" * 75)
    print("STEP 1: Loading Dataset & Computing Median Thresholds")
    print("=" * 75)
    df = pd.read_csv("UC05_DECISION_with_anomalies_ratio.csv")
    print(f"Loaded UC05_DECISION_with_anomalies_ratio.csv successfully. Shape: {df.shape}")
    
    # Calculate medians:
    # 1. Overall median across all 20,692 rows (is 0.0 due to 66% NO PROVIDER rows)
    median_all = df['providers_per_1000_patients'].median()
    # 2. Median among active provider rows (PROVIDER_COUNT > 0 / providers_per_1000_patients > 0)
    median_active = df[df['providers_per_1000_patients'] > 0]['providers_per_1000_patients'].median()
    # 3. Median among flagged anomaly rows
    median_anomalies = df[df['is_anomaly']]['providers_per_1000_patients'].median()
    
    print(f"Overall Dataset Median (all rows):          {median_all:.6f} (66% of rows have 0 providers)")
    print(f"Active Provider Median (rows > 0):         {median_active:.6f}")
    print(f"Flagged Anomaly Median (is_anomaly=True):  {median_anomalies:.6f}")
    
    # Primary splitting threshold: Active Provider Median (0.221576) to isolate low-supply/high-demand shortage anomalies
    threshold = median_active
    
    print("\n" + "=" * 75)
    print(f"STEP 2: Splitting Flagged Anomalies by Direction (Threshold = {threshold:.6f})")
    print("=" * 75)
    
    def categorize_row(row):
        if not row['is_anomaly']:
            return 'Normal'
        elif row['providers_per_1000_patients'] <= threshold:
            return 'shortage_anomaly'
        else:
            return 'oversupply_anomaly'
            
    df['anomaly_type'] = df.apply(categorize_row, axis=1)
    
    print("\nRow Counts by Category:")
    counts = df['anomaly_type'].value_counts()
    pcts = df['anomaly_type'].value_counts(normalize=True) * 100
    counts_df = pd.DataFrame({'Count': counts, 'Percentage': pcts.round(2)})
    print(counts_df)
    
    print("\n" + "=" * 75)
    print("STEP 3: Feature Means by Group")
    print("=" * 75)
    metrics = [
        'ESTIMATED_PATIENTS',
        'PROVIDER_COUNT',
        'PATIENTS_PER_PROVIDER',
        'providers_per_1000_patients',
        'services_per_beneficiary'
    ]
    
    group_means = df.groupby('anomaly_type')[metrics].mean()
    ordered_indices = ['Normal', 'shortage_anomaly', 'oversupply_anomaly']
    group_means = group_means.reindex(ordered_indices)
    
    counts_series = df['anomaly_type'].value_counts().reindex(ordered_indices)
    group_means.insert(0, 'COUNT', counts_series)
    group_means['PCT_TOTAL'] = (group_means['COUNT'] / len(df)) * 100
    
    print("\nGroup Feature Means Comparison:")
    print(group_means.to_string())
    
    print("\n" + "=" * 75)
    print("STEP 4: Validation against ACCESS_GAP_LEVEL")
    print("=" * 75)
    if 'ACCESS_GAP_LEVEL' in df.columns:
        df['IS_HIGH_OR_CRITICAL_GAP'] = df['ACCESS_GAP_LEVEL'].isin(['CRITICAL GAP', 'HIGH GAP'])
        
        gap_val = df.groupby('anomaly_type').agg(
            TOTAL_COUNT=('ACCESS_GAP_LEVEL', 'count'),
            HIGH_OR_CRITICAL_COUNT=('IS_HIGH_OR_CRITICAL_GAP', 'sum'),
            PCT_HIGH_OR_CRITICAL_GAP=('IS_HIGH_OR_CRITICAL_GAP', lambda x: x.mean() * 100),
            CRITICAL_GAP_COUNT=('ACCESS_GAP_LEVEL', lambda x: (x == 'CRITICAL GAP').sum()),
            PCT_CRITICAL_GAP=('ACCESS_GAP_LEVEL', lambda x: (x == 'CRITICAL GAP').mean() * 100),
            HIGH_GAP_COUNT=('ACCESS_GAP_LEVEL', lambda x: (x == 'HIGH GAP').sum()),
            PCT_HIGH_GAP=('ACCESS_GAP_LEVEL', lambda x: (x == 'HIGH GAP').mean() * 100)
        ).reindex(ordered_indices)
        
        print("\nAccess Gap Level Breakdown:")
        print(gap_val[['TOTAL_COUNT', 'HIGH_OR_CRITICAL_COUNT', 'PCT_HIGH_OR_CRITICAL_GAP', 'PCT_CRITICAL_GAP', 'PCT_HIGH_GAP']].to_string())
        
        print("\nFull ACCESS_GAP_LEVEL Distribution (%) by Category:")
        ct = pd.crosstab(df['anomaly_type'], df['ACCESS_GAP_LEVEL'], normalize='index') * 100
        ct = ct.reindex(ordered_indices)
        print(ct.round(2).to_string())
        
    print("\n" + "=" * 75)
    print("STEP 5: Saving shortage_anomaly rows to UC05_shortage_anomalies.csv")
    print("=" * 75)
    shortage_df = df[df['anomaly_type'] == 'shortage_anomaly'].copy()
    shortage_df = shortage_df.drop(columns=['IS_HIGH_OR_CRITICAL_GAP'], errors='ignore')
    
    shortage_df.to_csv("UC05_shortage_anomalies.csv", index=False)
    print(f"Saved 'UC05_shortage_anomalies.csv' successfully with {len(shortage_df)} rows. Shape: {shortage_df.shape}")
    
    print("\n" + "=" * 75)
    print("ALL STEPS COMPLETED SUCCESSFULLY!")
    print("=" * 75)

if __name__ == '__main__':
    main()
