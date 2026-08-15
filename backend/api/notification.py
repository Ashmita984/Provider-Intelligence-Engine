from fastapi import APIRouter, status
from ..models.schemas import NotificationRequest, NotificationResponse
from ..services.twilio_service import send_whatsapp_alert

router = APIRouter(prefix="/api/notification", tags=["Notification"])

@router.post("/notify", response_model=NotificationResponse, status_code=status.HTTP_200_OK)
def send_notification(payload: NotificationRequest):
    """
    Sends a WhatsApp alert for provider shortage in a specific area.
    """
    message = (
        f"HIGH PRIORITY: {payload.specialty} provider shortage detected in {payload.area_name}. "
        f"Risk Level: {payload.risk_level}. "
        f"Recommended action: review recruitment options."
    )
    result = send_whatsapp_alert(payload.to_number, message)
    
    return NotificationResponse(
        status=result.get("status", "failed"),
        message_sid=result.get("message_sid"),
        error=result.get("error")
    )
