import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.twilio_service import load_provider_data

client = TestClient(app)

def test_ml_predict_endpoint():
    """Test POST /api/ml/predict with valid area input metrics."""
    payload = {
        "ESTIMATED_PATIENTS": 5000.0,
        "PROVIDER_COUNT": 2.0,
        "TOTAL_BENEFICIARIES": 12000.0,
        "TOTAL_SERVICES": 45000.0,
        "PATIENTS_PER_PROVIDER": 2500.0,
        "MEDIAN_PATIENTS_PER_PROVIDER": 2100.0,
        "MEAN_PATIENTS_PER_PROVIDER": 2300.0,
        "REQUIRED_SPECIALTY": "CARDIOLOGY"
    }

    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "gap_prediction" in data
    assert "gap_probability" in data
    assert "cluster_id" in data
    assert "is_anomaly" in data
    assert "anomaly_score" in data
    assert isinstance(data["gap_prediction"], int)
    assert isinstance(data["is_anomaly"], bool)

def test_load_provider_data_resolution():
    """Test load_provider_data loads dataset correctly from active path."""
    df = load_provider_data()
    assert not df.empty
    assert len(df) == 8752
    assert "PROVIDER_ID" in df.columns or "NPI" in df.columns

def test_notification_with_ml_area_input():
    """Test /api/notification/notify with optional area_input triggers ML prediction in message."""
    with patch("backend.app.api.routes.notification.send_whatsapp_alert") as mock_wa, \
         patch("backend.app.api.routes.notification.send_sms_alert") as mock_sms:

        mock_wa.return_value = {"status": "sent", "message_sid": "WA_ML_123"}

        payload = {
            "to_number": "+919876543210",
            "area_name": "Travis County",
            "area_input": {
                "ESTIMATED_PATIENTS": 6000.0,
                "PROVIDER_COUNT": 1.0,
                "TOTAL_BENEFICIARIES": 15000.0,
                "TOTAL_SERVICES": 50000.0,
                "PATIENTS_PER_PROVIDER": 6000.0,
                "MEDIAN_PATIENTS_PER_PROVIDER": 5500.0,
                "MEAN_PATIENTS_PER_PROVIDER": 5800.0,
                "REQUIRED_SPECIALTY": "NEUROLOGY"
            }
        }

        response = client.post("/api/notification/notify", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "sent"
        assert data["message_sid"] == "WA_ML_123"

        # Verify custom message includes specialty and ML analysis text
        mock_wa.assert_called_once()
        call_msg = mock_wa.call_args[0][1]
        assert "NEUROLOGY" in call_msg
        assert "ML Analysis:" in call_msg

def test_matching_engine_specialty_lookup():
    """Test match_specialty_providers queries provider dataset and returns matching providers."""
    from backend.app.decision_engine.matching_engine import match_specialty_providers
    results = match_specialty_providers(specialty="Internal Medicine", location="1001", top_n=2)
    assert isinstance(results, list)
    assert len(results) > 0
