import pandas as pd

def transform_features(df: pd.DataFrame, pipeline: dict) -> pd.DataFrame:
    num_features = pipeline['numeric_features']
    encoder = pipeline['encoder']
    scaler = pipeline['scaler']
    cat_features = pipeline['cat_features']

    X_num = df[num_features]
    X_num_scaled = pd.DataFrame(scaler.transform(X_num), columns=num_features, index=df.index)

    cat_encoded = encoder.transform(df[cat_features])
    cat_cols = encoder.get_feature_names_out(cat_features)
    X_cat = pd.DataFrame(cat_encoded, columns=cat_cols, index=df.index)

    return pd.concat([X_num_scaled, X_cat], axis=1)
