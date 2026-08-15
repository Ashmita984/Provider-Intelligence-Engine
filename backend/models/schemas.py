from pydantic import BaseModel, Field
from typing import Optional

class AreaInput(BaseModel):
    ESTIMATED_PATIENTS: float = Field(..., description="Estimated patient count in the region")
    PROVIDER_COUNT: float = Field(..., description="Number of available healthcare providers")
    TOTAL_BENEFICIARIES: float = Field(..., description="Total beneficiary count")
    TOTAL_SERVICES: float = Field(..., description="Total services volume")
    PATIENTS_PER_PROVIDER: float = Field(..., description="Calculated patients per provider ratio")
    MEDIAN_PATIENTS_PER_PROVIDER: float = Field(..., description="Median patients per provider")
    MEAN_PATIENTS_PER_PROVIDER: float = Field(..., description="Mean patients per provider")
    REQUIRED_SPECIALTY: str = Field(..., description="Required medical specialty")

class MLPredictionResponse(BaseModel):
    gap_prediction: int = Field(..., description="Predicted binary access gap (1 = gap, 0 = no gap)")
    gap_probability: float = Field(..., description="Predicted probability of access gap")
    cluster_id: int = Field(..., description="Assigned K-Means cluster ID")
    is_anomaly: bool = Field(..., description="Flag indicating if area is an anomaly")
    anomaly_score: float = Field(..., description="Isolation Forest anomaly decision score")
