import numpy as np
import pandas as pd
from typing import Tuple

def detect_anomaly(anomaly_payload: dict, df: pd.DataFrame) -> Tuple[bool, float]:
    a_iso = anomaly_payload['isolation_forest']
    a_scaler = anomaly_payload['scaler']
    a_features = anomaly_payload['features']

    df_a = df.copy()
    df_a['providers_per_1000_patients'] = (df_a['PROVIDER_COUNT'] / df_a['ESTIMATED_PATIENTS'].replace(0, np.nan)) * 1000
    df_a['services_per_beneficiary'] = df_a['TOTAL_SERVICES'] / (df_a['TOTAL_BENEFICIARIES'] + 1)
    df_a = df_a.fillna(0)

    X_a_raw = df_a[a_features]
    X_a_log = np.log1p(np.maximum(0, X_a_raw))
    X_a_scaled = a_scaler.transform(X_a_log)

    pred_label = a_iso.predict(X_a_scaled)[0]
    is_anomaly = bool(pred_label == -1)
    anomaly_score = float(a_iso.decision_function(X_a_scaled)[0])
    return is_anomaly, anomaly_score
