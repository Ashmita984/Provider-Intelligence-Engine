import numpy as np
import pandas as pd

def predict_cluster(clustering_payload: dict, df: pd.DataFrame) -> int:
    c_kmeans = clustering_payload['kmeans']
    c_scaler = clustering_payload['scaler']
    c_features = clustering_payload['features']

    X_c_raw = df[c_features].copy()
    X_c_log = np.log1p(np.maximum(0, X_c_raw))
    X_c_scaled = c_scaler.transform(X_c_log)
    return int(c_kmeans.predict(X_c_scaled)[0])
