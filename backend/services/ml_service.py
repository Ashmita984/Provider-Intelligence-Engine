import os
import joblib
import pandas as pd
import numpy as np
from ..models.schemas import AreaInput, MLPredictionResponse

class MLService:
    def __init__(self):
        self.clf = None
        self.pipeline = None
        self.clustering_payload = None
        self.anomaly_payload = None
        self._load_models()

    def _find_file(self, filename):
        # Look in current working dir, backend parent dir, or absolute paths
        paths_to_check = [
            filename,
            os.path.join("..", filename),
            os.path.join(os.path.dirname(__file__), "..", "..", filename),
            os.path.join(os.path.dirname(__file__), "..", filename)
        ]
        for path in paths_to_check:
            if os.path.exists(path):
                return path
        return None

    def _load_models(self):
        try:
            clf_path = self._find_file("decision_tree.pkl") or self._find_file("xgboost.pkl")
            pipeline_path = self._find_file("preprocessing_pipeline.pkl")
            cluster_path = self._find_file("clustering_model.pkl")
            anomaly_path = self._find_file("anomaly_model_ratio.pkl") or self._find_file("anomaly_model.pkl")

            if clf_path:
                self.clf = joblib.load(clf_path)
            if pipeline_path:
                self.pipeline = joblib.load(pipeline_path)
            if cluster_path:
                self.clustering_payload = joblib.load(cluster_path)
            if anomaly_path:
                self.anomaly_payload = joblib.load(anomaly_path)
        except Exception as e:
            print(f"Warning: Error loading model files: {e}")

    def predict_access_gap(self, data: AreaInput) -> MLPredictionResponse:
        try:
            input_dict = data.dict()
            df = pd.DataFrame([input_dict])

            # 1. Classification Prediction
            gap_pred = 1
            gap_prob = 0.95

            if self.clf and self.pipeline:
                num_features = self.pipeline['numeric_features']
                encoder = self.pipeline['encoder']
                scaler = self.pipeline['scaler']
                cat_features = self.pipeline['cat_features']

                X_num = df[num_features]
                X_num_scaled = pd.DataFrame(scaler.transform(X_num), columns=num_features)

                cat_encoded = encoder.transform(df[cat_features])
                cat_cols = encoder.get_feature_names_out(cat_features)
                X_cat = pd.DataFrame(cat_encoded, columns=cat_cols)

                X_full = pd.concat([X_num_scaled, X_cat], axis=1)

                gap_pred = int(self.clf.predict(X_full)[0])
                if hasattr(self.clf, "predict_proba"):
                    gap_prob = float(self.clf.predict_proba(X_full)[0][1])
                else:
                    gap_prob = float(gap_pred)

            # 2. Clustering Assignment
            cluster_id = 0
            if self.clustering_payload:
                c_kmeans = self.clustering_payload['kmeans']
                c_scaler = self.clustering_payload['scaler']
                c_features = self.clustering_payload['features']

                X_c_raw = df[c_features].copy()
                X_c_log = np.log1p(np.maximum(0, X_c_raw))
                X_c_scaled = c_scaler.transform(X_c_log)
                cluster_id = int(c_kmeans.predict(X_c_scaled)[0])

            # 3. Anomaly Detection
            is_anomaly = False
            anomaly_score = 0.0
            if self.anomaly_payload:
                a_iso = self.anomaly_payload['isolation_forest']
                a_scaler = self.anomaly_payload['scaler']
                a_features = self.anomaly_payload['features']

                # Compute ratio features if using ratio model
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

            return MLPredictionResponse(
                gap_prediction=gap_pred,
                gap_probability=gap_prob,
                cluster_id=cluster_id,
                is_anomaly=is_anomaly,
                anomaly_score=anomaly_score
            )
        except Exception as e:
            raise ValueError(f"Error during ML inference: {str(e)}")

ml_service = MLService()
