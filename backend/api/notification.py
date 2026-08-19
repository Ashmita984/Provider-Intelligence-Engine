from fastapi import APIRouter, status
from ..models.schemas import NotificationRequest, NotificationResponse
from ..services.twilio_service import send_whatsapp_alert, send_sms_alert
from ..services.ml_service import ml_service
from ..app.decision_engine.explanation import generate_explanation

router = APIRouter(prefix="/api/notification", tags=["Notification"])

def _build_custom_message(payload: NotificationRequest) -> str:
    """Helper to get user-provided message or construct custom healthcare access-gap alert."""
    if payload.message:
        return payload.message

    area = payload.area_name or "specified area"
    specialty = payload.specialty or (payload.area_input.REQUIRED_SPECIALTY if payload.area_input else "Healthcare")
    risk_level = payload.risk_level or "HIGH"
    recommendation = payload.recommendation or "Provider recruitment recommended."

    ml_explanation = ""
    if payload.area_input:
        try:
            ml_res = ml_service.predict_access_gap(payload.area_input)
            ml_explanation = f" ML Analysis: {generate_explanation(ml_res.gap_prediction, ml_res.cluster_id, ml_res.is_anomaly)}"
        except Exception as e:
            print(f"[Notification API] ML evaluation warning: {e}")

    return (
        f"High healthcare access gap detected in {area}. "
        f"{specialty} provider shortage identified ({risk_level} risk). "
        f"{recommendation}{ml_explanation}"
    )

@router.post("/notify", response_model=NotificationResponse, status_code=status.HTTP_200_OK)
def send_notification(payload: NotificationRequest):
    """
    Sends a healthcare access-gap alert.
    Tries WhatsApp first. If WhatsApp fails (e.g. trial/template restrictions),
    automatically falls back to SMS with the SAME custom healthcare notification message.
    """
    message = _build_custom_message(payload)

    # 1. Attempt WhatsApp notification first
    wa_result = send_whatsapp_alert(payload.to_number, message)
    if wa_result.get("status") == "sent":
        return NotificationResponse(
            success=True,
            channel="whatsapp",
            status="sent",
            message_sid=wa_result.get("message_sid"),
            error=None
        )

    # 2. If WhatsApp fails, automatically fall back to SMS
    wa_error = wa_result.get("error", "WhatsApp delivery failed")
    print(f"[Notification API] WhatsApp delivery failed ({wa_error}). Retrying via SMS fallback...")

    sms_result = send_sms_alert(payload.to_number, message)
    if sms_result.get("status") == "sent":
        return NotificationResponse(
            success=True,
            channel="sms",
            status="sent",
            message_sid=sms_result.get("message_sid"),
            error=None
        )

    # Return clean failure status with exact error if both/fallback fail
    return NotificationResponse(
        success=False,
        channel="sms",
        status="failed",
        message_sid=None,
        error=sms_result.get("error") or wa_error
    )

@router.post("/notify-sms", response_model=NotificationResponse, status_code=status.HTTP_200_OK)
def send_sms_notification(payload: NotificationRequest):
    """
    Sends a custom healthcare access-gap SMS alert directly using Twilio.
    """
    message = _build_custom_message(payload)
    sms_result = send_sms_alert(payload.to_number, message)

    if sms_result.get("status") == "sent":
        return NotificationResponse(
            success=True,
            channel="sms",
            status="sent",
            message_sid=sms_result.get("message_sid"),
            error=None
        )

    return NotificationResponse(
        success=False,
        channel="sms",
        status="failed",
        message_sid=None,
        error=sms_result.get("error")
    )


