import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.twilio_service import send_sms_alert

client = TestClient(app)


def test_send_sms_alert_success():
    """Test send_sms_alert formats phone numbers correctly and returns SID on success."""
    mock_msg = MagicMock()
    mock_msg.sid = "SM_MOCK_TEST_12345"

    with patch("twilio.rest.Client") as MockClient:
        mock_instance = MockClient.return_value
        mock_instance.messages.create.return_value = mock_msg

        result = send_sms_alert("whatsapp:+919876543210")

        assert result["status"] == "sent"
        assert result["message_sid"] == "SM_MOCK_TEST_12345"

        # Verify arguments passed to client.messages.create
        mock_instance.messages.create.assert_called_once_with(
            body="High healthcare access gap detected. Provider shortage identified. Provider recruitment recommended.",
            from_="+17372212163",
            to="+919876543210"
        )


def test_send_sms_alert_failure():
    """Test send_sms_alert handles exception gracefully without crashing."""
    with patch("twilio.rest.Client") as MockClient:
        mock_instance = MockClient.return_value
        mock_instance.messages.create.side_effect = Exception("Twilio API Error")

        result = send_sms_alert("+919876543210")

        assert result["status"] == "failed"
        assert "Twilio API Error" in result["error"]


def test_notify_endpoint_sms_fallback():
    """Test /api/notification/notify falls back to SMS when WhatsApp fails."""
    with patch("backend.app.api.routes.notification.send_whatsapp_alert") as mock_wa, \
         patch("backend.app.api.routes.notification.send_sms_alert") as mock_sms:
        
        mock_wa.return_value = {"status": "failed", "error": "WhatsApp template unapproved"}
        mock_sms.return_value = {"status": "sent", "message_sid": "SM_FALLBACK_999"}

        payload = {
            "to_number": "+919876543210",
            "area_name": "Autauga County",
            "specialty": "Cardiology",
            "risk_level": "HIGH"
        }

        response = client.post("/api/notification/notify", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "sent"
        assert data["message_sid"] == "SM_FALLBACK_999"
        mock_sms.assert_called_once_with("+919876543210", "High healthcare access gap detected in Autauga County. Cardiology provider shortage identified (HIGH risk). Provider recruitment recommended.")


def test_notify_sms_endpoint_direct():
    """Test /api/notification/notify-sms sends SMS directly."""
    with patch("backend.app.api.routes.notification.send_sms_alert") as mock_sms:
        mock_sms.return_value = {"status": "sent", "message_sid": "SM_DIRECT_888"}

        payload = {"to_number": "+919876543210"}

        response = client.post("/api/notification/notify-sms", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "sent"
        assert data["message_sid"] == "SM_DIRECT_888"
        mock_sms.assert_called_once_with("+919876543210", "High healthcare access gap detected in specified area. Healthcare provider shortage identified (HIGH risk). Provider recruitment recommended.")
