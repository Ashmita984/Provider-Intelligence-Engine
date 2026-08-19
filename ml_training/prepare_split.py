import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import joblib

def main():
    print("=" * 60)
    print("STEP 1: Loading Dataset & Creating Target 'gap'")
    print("=" * 60)
    import os
    dataset_paths = [
        "UC05_ALL_FOUR_DATASETS_UPDATED/UC05_DECISION_FINAL_WITH_DISEASE.csv",
        "UC05_ALL_FOUR_DATASETS/UC05_DECISION_FINAL_WITH_DISEASE.csv",
        "UC05_FINAL_DATA_WITH_DISEASE (2)/UC05_DECISION_FINAL_WITH_DISEASE.csv",
        "UC05_finalled_data/UC05_DECISION_FINAL.csv",
        "UC05_DECISION_FINAL.csv"
    ]
    df_path = next((p for p in dataset_paths if os.path.exists(p)), None)
    if not df_path:
        raise FileNotFoundError("Could not find UC05_DECISION dataset!")
    df = pd.read_csv(df_path)
    print(f"Loaded decision dataset from '{df_path}' successfully. Shape: {df.shape}")
    
    # Define binary target
    # gap = 1 if ACCESS_GAP_LEVEL in ['CRITICAL GAP', 'HIGH GAP', 'MODERATE GAP', 'NO PROVIDER']
    # gap = 0 if ACCESS_GAP_LEVEL == 'LOW GAP'
    gap_1_levels = ['CRITICAL GAP', 'HIGH GAP', 'MODERATE GAP', 'NO PROVIDER']
    df['gap'] = df['ACCESS_GAP_LEVEL'].apply(lambda x: 1 if x in gap_1_levels else 0)
    
    print("\nTarget ('gap') Class Distribution:")
    class_counts = df['gap'].value_counts()
    class_percents = df['gap'].value_counts(normalize=True) * 100
    balance_df = pd.DataFrame({'Count': class_counts, 'Percentage': class_percents.round(2)})
    print(balance_df)
    
    print("\nDetailed breakdown of ACCESS_GAP_LEVEL vs gap:")
    print(pd.crosstab(df['ACCESS_GAP_LEVEL'], df['gap'], margins=True))

    print("\n" + "=" * 60)
    print("STEP 2: Feature Selection & Preprocessing")
    print("=" * 60)
    numeric_features = [
        'ESTIMATED_PATIENTS',
        'PROVIDER_COUNT',
        'TOTAL_BENEFICIARIES',
        'TOTAL_SERVICES',
        'PATIENTS_PER_PROVIDER',
        'MEDIAN_PATIENTS_PER_PROVIDER',
        'MEAN_PATIENTS_PER_PROVIDER'
    ]
    cat_features = ['REQUIRED_SPECIALTY']
    
    X_num = df[numeric_features].copy()
    y = df['gap'].copy()
    
    # Check for any missing values in numeric features
    if X_num.isnull().sum().sum() > 0:
        print("Handling missing values in numeric features...")
        X_num = X_num.fillna(0)
        
    # One-hot encode REQUIRED_SPECIALTY
    encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
    cat_encoded = encoder.fit_transform(df[cat_features])
    cat_encoded_cols = encoder.get_feature_names_out(cat_features)
    X_cat_df = pd.DataFrame(cat_encoded, columns=cat_encoded_cols, index=df.index)
    
    print(f"One-hot encoded '{cat_features[0]}' into {len(cat_encoded_cols)} binary columns.")
    
    # Step 3: Train / Test Split
    print("\n" + "=" * 60)
    print("STEP 3: Train/Test Split (test_size=0.2, random_state=42, stratify=y)")
    print("=" * 60)
    
    # Split raw data indices / dataframes first to fit scaler on train set only (prevent data leakage)
    X_num_train, X_num_test, X_cat_train, X_cat_test, y_train, y_test = train_test_split(
        X_num, X_cat_df, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Fit StandardScaler on X_num_train, transform both train and test
    scaler = StandardScaler()
    X_num_train_scaled = pd.DataFrame(scaler.fit_transform(X_num_train), columns=numeric_features, index=X_num_train.index)
    X_num_test_scaled = pd.DataFrame(scaler.transform(X_num_test), columns=numeric_features, index=X_num_test.index)
    
    # Concatenate scaled numeric features and one-hot encoded categorical features
    X_train = pd.concat([X_num_train_scaled, X_cat_train], axis=1)
    X_test = pd.concat([X_num_test_scaled, X_cat_test], axis=1)
    
    print("\n" + "=" * 60)
    print("STEP 4: Saving X_train, X_test, y_train, y_test as CSV files")
    print("=" * 60)
    X_train.to_csv("X_train.csv", index=False)
    X_test.to_csv("X_test.csv", index=False)
    pd.DataFrame(y_train, columns=['gap']).to_csv("y_train.csv", index=False)
    pd.DataFrame(y_test, columns=['gap']).to_csv("y_test.csv", index=False)
    
    # Save transformers for future model inference
    joblib.dump({'scaler': scaler, 'encoder': encoder, 'numeric_features': numeric_features, 'cat_features': cat_features}, 'preprocessing_pipeline.pkl')
    
    print("Saved files successfully:")
    print("- X_train.csv")
    print("- X_test.csv")
    print("- y_train.csv")
    print("- y_test.csv")
    print("- preprocessing_pipeline.pkl")
    
    print("\n" + "=" * 60)
    print("STEP 5: Verification & Dataset Shapes")
    print("=" * 60)
    print(f"X_train shape: {X_train.shape}")
    print(f"X_test shape:  {X_test.shape}")
    print(f"y_train shape: {y_train.shape}")
    print(f"y_test shape:  {y_test.shape}")
    
    print("\nTrain Set Class Distribution:")
    print(y_train.value_counts(normalize=True).round(4) * 100)
    
    print("\nTest Set Class Distribution:")
    print(y_test.value_counts(normalize=True).round(4) * 100)
    
    print("\n" + "=" * 60)
    print("PREPARATION COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    main()
