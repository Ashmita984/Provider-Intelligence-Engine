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

class NotificationRequest(BaseModel):
    to_number: str = Field(..., description="Recipient phone number (e.g. +91XXXXXXXXXX or whatsapp:+91XXXXXXXXXX)")
    message: Optional[str] = Field(None, description="Custom healthcare notification message text")
    area_name: Optional[str] = Field(None, description="Area or region name where shortage was detected")
    specialty: Optional[str] = Field(None, description="Healthcare specialty experiencing shortage")
    risk_level: Optional[str] = Field(None, description="Risk level (e.g. HIGH, CRITICAL)")
    recommendation: Optional[str] = Field(None, description="Recommended action (e.g. Provider recruitment recommended)")
    area_input: Optional[AreaInput] = Field(None, description="Optional area metrics for dynamic ML access gap evaluation")

class NotificationResponse(BaseModel):
    success: bool = Field(..., description="True if delivery succeeded on any channel, False otherwise")
    channel: str = Field(..., description="Delivery channel used: 'whatsapp' or 'sms'")
    status: str = Field(..., description="Status of delivery: 'sent' or 'failed'")
    message_sid: Optional[str] = Field(None, description="Twilio message SID if sent successfully")
    error: Optional[str] = Field(None, description="Error message if delivery failed")
