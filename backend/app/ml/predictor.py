import pandas as pd
from typing import Tuple
from .preprocessing import transform_features

def predict_gap(clf, pipeline: dict, df: pd.DataFrame) -> Tuple[int, float]:
    X_full = transform_features(df, pipeline)
    gap_pred = int(clf.predict(X_full)[0])
    if hasattr(clf, "predict_proba"):
        gap_prob = float(clf.predict_proba(X_full)[0][1])
    else:
        gap_prob = float(gap_pred)
    return gap_pred, gap_prob
