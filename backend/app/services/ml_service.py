import pandas as pd
from ..schemas.schemas import AreaInput, MLPredictionResponse
from ..ml.model_loader import model_loader
from ..ml.predictor import predict_gap
from ..ml.clustering import predict_cluster
from ..ml.anomaly_detection import detect_anomaly

class MLService:
    def __init__(self):
        self.clf = None
        self.pipeline = None
        self.clustering_payload = None
        self.anomaly_payload = None
        self._load_models()

    def _load_models(self):
        try:
            self.clf = model_loader.load_pickle("xgboost.pkl") or model_loader.load_pickle("random_forest.pkl")
            self.pipeline = model_loader.load_pickle("preprocessing_pipeline.pkl")
            self.clustering_payload = model_loader.load_pickle("clustering_model.pkl")
            self.anomaly_payload = model_loader.load_pickle("anomaly_model_ratio.pkl") or model_loader.load_pickle("anomaly_model.pkl")
        except Exception as e:
            print(f"Warning: Error loading model files in MLService: {e}")

    def predict_access_gap(self, data: AreaInput) -> MLPredictionResponse:
        try:
            input_dict = data.model_dump() if hasattr(data, "model_dump") else data.dict()
            df = pd.DataFrame([input_dict])

            # 1. Classification Prediction
            gap_pred = 1
            gap_prob = 0.95
            if self.clf and self.pipeline:
                gap_pred, gap_prob = predict_gap(self.clf, self.pipeline, df)

            # 2. Clustering Assignment
            cluster_id = 0
            if self.clustering_payload:
                cluster_id = predict_cluster(self.clustering_payload, df)

            # 3. Anomaly Detection
            is_anomaly = False
            anomaly_score = 0.0
            if self.anomaly_payload:
                is_anomaly, anomaly_score = detect_anomaly(self.anomaly_payload, df)

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
