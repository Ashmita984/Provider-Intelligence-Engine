import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import joblib

def main():
    print("=" * 60)
    print("STEP 1: Loading Dataset")
    print("=" * 60)
    df = pd.read_csv("UC05_DECISION.csv")
    print(f"Dataset loaded successfully. Shape: {df.shape}")
    print(f"Columns present: {list(df.columns)}")
    
    print("\n" + "=" * 60)
    print("STEP 2: Selecting Features")
    print("=" * 60)
    features = [
        'ESTIMATED_PATIENTS',
        'PROVIDER_COUNT',
        'TOTAL_BENEFICIARIES',
        'TOTAL_SERVICES',
        'PATIENTS_PER_PROVIDER'
    ]
    
    # Check missing values
    missing = df[features].isnull().sum()
    print("Missing values per feature:")
    print(missing)
    
    X_raw = df[features].copy()
    
    # Handle any nulls or infs if present
    if X_raw.isnull().sum().sum() > 0:
        print("Handling missing values by filling with 0...")
        X_raw = X_raw.fillna(0)

    print("\nFeature Summary (Raw Data):")
    print(X_raw.describe().T[['min', 'mean', '50%', 'max', 'std']])
    
    print("\n" + "=" * 60)
    print("STEP 3: Applying log1p Transform")
    print("=" * 60)
    X_log = np.log1p(np.maximum(0, X_raw))
    print("Log1p transformation complete.")
    print("Feature Summary (Log Transformed Data):")
    print(pd.DataFrame(X_log, columns=features).describe().T[['min', 'mean', '50%', 'max', 'std']])
    
    print("\n" + "=" * 60)
    print("STEP 4: Scaling with StandardScaler")
    print("=" * 60)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_log)
    print("StandardScaler fitting and transformation complete.")
    print(f"Scaled feature matrix shape: {X_scaled.shape}")
    
    print("\n" + "=" * 60)
    print("STEP 5: Testing Cluster Counts k=2 through k=6 (Silhouette Scores)")
    print("=" * 60)
    silhouette_scores = {}
    for k in range(2, 7):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(X_scaled)
        score = silhouette_score(X_scaled, labels)
        silhouette_scores[k] = score
        print(f"k = {k}: Silhouette Score = {score:.4f}")
        
    print("\n" + "=" * 60)
    print("STEP 6: Training Final KMeans Model (k=4, random_state=42, n_init=10)")
    print("=" * 60)
    final_kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    cluster_labels = final_kmeans.fit_predict(X_scaled)
    print("Final KMeans model training complete.")
    print(f"Inertia: {final_kmeans.inertia_:.4f}")
    
    print("\n" + "=" * 60)
    print("STEP 7: Assigning Cluster Labels to Original Dataframe")
    print("=" * 60)
    df['CLUSTER'] = cluster_labels
    print("Cluster labels assigned to column 'CLUSTER'.")
    
    print("\n" + "=" * 60)
    print("STEP 8: Cluster Summary (Mean of Original Features & Row Count per Cluster)")
    print("=" * 60)
    cluster_counts = df['CLUSTER'].value_counts().sort_index()
    cluster_means = df.groupby('CLUSTER')[features].mean()
    
    summary_df = cluster_means.copy()
    summary_df.insert(0, 'ROW_COUNT', cluster_counts)
    summary_df['PCT_TOTAL_ROWS'] = (summary_df['ROW_COUNT'] / len(df)) * 100
    
    print("\nCluster Feature Means (Original Scale):")
    print(summary_df.to_string())
    
    print("\n" + "=" * 60)
    print("STEP 9: Validation against ACCESS_GAP_LEVEL")
    print("=" * 60)
    if 'ACCESS_GAP_LEVEL' in df.columns:
        print("Distribution of ACCESS_GAP_LEVEL in original dataset:")
        print(df['ACCESS_GAP_LEVEL'].value_counts(dropna=False))
        
        df['IS_HIGH_OR_CRITICAL_GAP'] = df['ACCESS_GAP_LEVEL'].isin(['CRITICAL GAP', 'HIGH GAP'])
        
        gap_validation = df.groupby('CLUSTER').agg(
            TOTAL_COUNT=('ACCESS_GAP_LEVEL', 'count'),
            HIGH_OR_CRITICAL_COUNT=('IS_HIGH_OR_CRITICAL_GAP', 'sum'),
            PCT_HIGH_OR_CRITICAL_GAP=('IS_HIGH_OR_CRITICAL_GAP', lambda x: x.mean() * 100),
            CRITICAL_GAP_COUNT=('ACCESS_GAP_LEVEL', lambda x: (x == 'CRITICAL GAP').sum()),
            PCT_CRITICAL_GAP=('ACCESS_GAP_LEVEL', lambda x: (x == 'CRITICAL GAP').mean() * 100),
            HIGH_GAP_COUNT=('ACCESS_GAP_LEVEL', lambda x: (x == 'HIGH GAP').sum()),
            PCT_HIGH_GAP=('ACCESS_GAP_LEVEL', lambda x: (x == 'HIGH GAP').mean() * 100)
        )
        print("\nAccess Gap Validation per Cluster:")
        print(gap_validation[['TOTAL_COUNT', 'HIGH_OR_CRITICAL_COUNT', 'PCT_HIGH_OR_CRITICAL_GAP', 'PCT_CRITICAL_GAP', 'PCT_HIGH_GAP']].to_string())
        
        print("\nFull Access Gap Level breakdown (%) by Cluster:")
        ct = pd.crosstab(df['CLUSTER'], df['ACCESS_GAP_LEVEL'], margins=True, normalize='index') * 100
        print(ct.round(2).to_string())
    else:
        print("WARNING: ACCESS_GAP_LEVEL column not found in dataset!")

    print("\n" + "=" * 60)
    print("STEP 10: Saving Trained Model + Scaler to clustering_model.pkl")
    print("=" * 60)
    model_payload = {
        'kmeans': final_kmeans,
        'scaler': scaler,
        'features': features
    }
    joblib.dump(model_payload, 'clustering_model.pkl')
    print("Model payload saved successfully to 'clustering_model.pkl'.")
    
    print("\n" + "=" * 60)
    print("STEP 11: Saving Labeled Dataframe to UC05_DECISION_with_clusters.csv")
    print("=" * 60)
    save_df = df.drop(columns=['IS_HIGH_OR_CRITICAL_GAP'], errors='ignore')
    save_df.to_csv("UC05_DECISION_with_clusters.csv", index=False)
    print(f"Labeled dataframe saved successfully to 'UC05_DECISION_with_clusters.csv'. Shape: {save_df.shape}")
    
    print("\n" + "=" * 60)
    print("ALL STEPS COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    main()
