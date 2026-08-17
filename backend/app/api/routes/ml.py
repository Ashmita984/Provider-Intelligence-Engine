from fastapi import APIRouter, HTTPException, status
from ...schemas.schemas import AreaInput, MLPredictionResponse
from ...services.ml_service import ml_service

router = APIRouter(prefix="/api/ml", tags=["ML Machine Learning"])

@router.post("/predict", response_model=MLPredictionResponse, status_code=status.HTTP_200_OK)
def predict_access_gap(area_input: AreaInput):
    """
    ML Prediction Endpoint: Takes area metrics and predicts access gap, cluster ID, and anomaly score.
    """
    try:
        response = ml_service.predict_access_gap(area_input)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ML inference input: {str(e)}"
        )
