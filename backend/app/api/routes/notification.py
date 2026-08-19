import os
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, status, Body
from ...schemas.schemas import NotificationRequest, NotificationResponse
from ...services.twilio_service import send_whatsapp_alert, send_sms_alert, send_voice_call_alert
from ...services.ml_service import ml_service
from ...decision_engine.explanation import generate_explanation

router = APIRouter(tags=["Notification"])

# In-memory record store for dispatch history
NOTIFICATION_HISTORY: List[Dict[str, Any]] = []

PROVIDER_LOOKUP = {
    "p1": {"name": "Dr. Sarah L. Jenkins, MD, FACC", "npi": "1023094653", "specialty": "Cardiology"},
    "p2": {"name": "Dr. Marcus Vance, MD", "npi": "1841392810", "specialty": "Orthopedic Surgery"},
    "p3": {"name": "Dr. Elena Rostova, MD", "npi": "1598302194", "specialty": "Neurology"},
    "p4": {"name": "Dr. David Chen, MD", "npi": "1275648391", "specialty": "Primary Care"},
    "p5": {"name": "Dr. Amara Okafor, MD", "npi": "1932481029", "specialty": "Psychiatry"},
}

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

# ------------------------------------------------------------------
# FRONTEND NOTIFICATION MODAL ENDPOINTS (/api/notify/*)
# ------------------------------------------------------------------

@router.post("/api/notify/sms", status_code=status.HTTP_200_OK)
def handle_notify_sms(payload: Dict[str, Any] = Body(...)):
    target_phone = payload.get("recipientPhone") or payload.get("to_number") or payload.get("toNumber")
    message = payload.get("customMessage") or payload.get("message") or "Healthcare provider access-gap alert."
    prov_id = payload.get("providerId") or "p1"
    prov_info = PROVIDER_LOOKUP.get(prov_id, PROVIDER_LOOKUP["p1"])

    sms_res = send_sms_alert(target_phone, message)
    is_success = sms_res.get("status") == "sent"
    sid = sms_res.get("message_sid") or f"SM{uuid.uuid4().hex[:30]}"

    record = {
        "id": f"notif_{uuid.uuid4().hex[:8]}",
        "sid": sid,
        "timestamp": datetime.now().isoformat(),
        "recipientName": payload.get("recipientName") or "Sarah Jenkins",
        "recipientPhone": target_phone,
        "recipientType": payload.get("recipientType") or "patient",
        "channel": "sms",
        "status": "sent" if is_success else "failed",
        "providerId": prov_id,
        "providerName": prov_info["name"],
        "providerNpi": prov_info["npi"],
        "providerSpecialty": prov_info["specialty"],
        "userLocation": payload.get("userLocation") or "Detroit, MI 48201",
        "messagePreview": message,
        "gapLevel": payload.get("gapLevel") or "CRITICAL",
        "actionRequired": payload.get("actionRequired", False),
        "errorMessage": sms_res.get("error") if not is_success else None
    }

    NOTIFICATION_HISTORY.insert(0, record)

    if not is_success:
        return {"success": False, "error": sms_res.get("error") or "SMS dispatch failed", "record": record}

    return {"success": True, "record": record}


@router.post("/api/notify/call", status_code=status.HTTP_200_OK)
def handle_notify_call(payload: Dict[str, Any] = Body(...)):
    target_phone = payload.get("recipientPhone") or payload.get("to_number") or payload.get("toNumber")
    script = payload.get("customScript") or payload.get("message") or "Urgent healthcare access gap notification."
    prov_id = payload.get("providerId") or "p1"
    prov_info = PROVIDER_LOOKUP.get(prov_id, PROVIDER_LOOKUP["p1"])

    call_res = send_voice_call_alert(target_phone, script)
    is_success = call_res.get("status") == "sent"
    sid = call_res.get("message_sid") or f"CA{uuid.uuid4().hex[:30]}"

    record = {
        "id": f"notif_{uuid.uuid4().hex[:8]}",
        "sid": sid,
        "timestamp": datetime.now().isoformat(),
        "recipientName": payload.get("recipientName") or "Sarah Jenkins",
        "recipientPhone": target_phone,
        "recipientType": payload.get("recipientType") or "patient",
        "channel": "call",
        "status": "sent" if is_success else "failed",
        "providerId": prov_id,
        "providerName": prov_info["name"],
        "providerNpi": prov_info["npi"],
        "providerSpecialty": prov_info["specialty"],
        "userLocation": payload.get("userLocation") or "Detroit, MI 48201",
        "messagePreview": script,
        "gapLevel": payload.get("gapLevel") or "CRITICAL",
        "actionRequired": payload.get("actionRequired", False),
        "errorMessage": call_res.get("error") if not is_success else None
    }

    NOTIFICATION_HISTORY.insert(0, record)

    if not is_success:
        return {"success": False, "error": call_res.get("error") or "Voice call failed", "record": record}

    return {"success": True, "record": record}


@router.get("/api/notify/history", status_code=status.HTTP_200_OK)
def get_notify_history():
    return {"records": NOTIFICATION_HISTORY}


@router.post("/api/notify/status-update/{sid}", status_code=status.HTTP_200_OK)
def update_notify_status(sid: str, payload: Dict[str, Any] = Body(...)):
    new_status = payload.get("status", "delivered")
    for rec in NOTIFICATION_HISTORY:
        if rec.get("sid") == sid or rec.get("id") == sid:
            rec["status"] = new_status
            return {"success": True, "record": rec}
    return {"success": False, "error": "Record not found"}


@router.post("/api/notify/clear", status_code=status.HTTP_200_OK)
def clear_notify_history():
    global NOTIFICATION_HISTORY
    NOTIFICATION_HISTORY.clear()
    return {"success": True}


@router.get("/api/twilio/config", status_code=status.HTTP_200_OK)
def get_twilio_config():
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    phone = os.getenv("TWILIO_SMS_FROM") or os.getenv("TWILIO_WHATSAPP_NUMBER") or "+17372212163"
    test_to = os.getenv("TEST_TO_NUMBER") or "+918610848428"
    is_live = bool(sid and token)
    return {
        "isLive": is_live,
        "accountSid": sid or "AC_mock_sandbox_account_sid",
        "phoneNumber": phone,
        "testToNumber": test_to,
        "sandboxMode": not is_live
    }


# ------------------------------------------------------------------
# BACKEND API ENDPOINTS (/api/notification/*)
# ------------------------------------------------------------------

@router.post("/api/notification/notify", response_model=NotificationResponse, status_code=status.HTTP_200_OK)
def send_notification(payload: NotificationRequest):
    """
    Sends a healthcare access-gap alert.
    Tries WhatsApp first. If WhatsApp fails, automatically falls back to SMS.
    """
    message = _build_custom_message(payload)

    wa_result = send_whatsapp_alert(payload.to_number, message)
    if wa_result.get("status") == "sent":
        return NotificationResponse(
            success=True,
            channel="whatsapp",
            status="sent",
            message_sid=wa_result.get("message_sid"),
            error=None
        )

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

    return NotificationResponse(
        success=False,
        channel="sms",
        status="failed",
        message_sid=None,
        error=sms_result.get("error") or wa_error
    )


@router.post("/api/notification/notify-sms", response_model=NotificationResponse, status_code=status.HTTP_200_OK)
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


@router.post("/api/notification/notify-call", response_model=NotificationResponse, status_code=status.HTTP_200_OK)
def send_voice_notification(payload: NotificationRequest):
    """
    Sends an automated Voice Call alert directly using Twilio Voice API.
    """
    message = _build_custom_message(payload)
    call_result = send_voice_call_alert(payload.to_number, message)

    if call_result.get("status") == "sent":
        return NotificationResponse(
            success=True,
            channel="call",
            status="sent",
            message_sid=call_result.get("message_sid"),
            error=None
        )

    return NotificationResponse(
        success=False,
        channel="call",
        status="failed",
        message_sid=None,
        error=call_result.get("error")
    )

