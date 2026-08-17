# Healthcare Provider Access-Gap Decision-Support API

Production-grade FastAPI backend for predicting regional healthcare access gaps, clustering geographic areas, detecting statistical supply anomalies, and dispatching automated Twilio WhatsApp / SMS alerts.

---

## Directory Architecture

```
backend/
├── app/
│   ├── main.py                     # FastAPI application entrypoint
│   │
│   ├── core/                       # Core application settings & security
│   │   ├── config.py               # Environment configuration (.env loader)
│   │   ├── database.py             # Database session manager (stub)
│   │   ├── security.py             # Auth & security helpers
│   │   └── dependencies.py         # FastAPI dependency injection
│   │
│   ├── models/                     # ORM Database Models (placeholders)
│   ├── schemas/                    # Pydantic Schemas
│   │   └── schemas.py              # Request / Response DTOs
│   │
│   ├── api/                        # API Routing Layer
│   │   ├── router.py               # Main Unified API Router
│   │   └── routes/                 # Endpoint Route Handlers
│   │       ├── ml.py               # ML Inference (/api/ml/predict)
│   │       ├── notification.py     # Twilio Alert Endpoints (/api/notification/*)
│   │       ├── auth.py             # Auth Endpoints (/api/auth/*)
│   │       ├── dashboard.py        # Dashboard Endpoints (/api/dashboard)
│   │       ├── data.py             # Data Endpoints (/api/data/*)
│   │       ├── analysis.py         # Analytics Endpoints (/api/analysis/*)
│   │       ├── optimization.py     # Optimization Endpoints (/api/optimization/*)
│   │       └── simulation.py       # Simulation Endpoints (/api/simulation/*)
│   │
│   ├── services/                   # Business Logic Services
│   │   ├── ml_service.py           # ML Orchestrator Service
│   │   ├── twilio_service.py       # Twilio WhatsApp & SMS Alert Service
│   │   ├── data_service.py         # Data Service
│   │   ├── analytics_service.py    # Analytics Service
│   │   ├── optimization_service.py # Optimization Service
│   │   └── recommendation_service.py # Recommendation Service
│   │
│   ├── decision_engine/            # Decision Support Logic
│   │   ├── gap_calculator.py       # Gap score mathematical formula
│   │   ├── risk_classifier.py      # Severity risk level classifier
│   │   ├── matching_engine.py      # Provider specialty matching
│   │   ├── recruitment_simulator.py# Recruitment impact simulator
│   │   └── explanation.py          # Reasoning & explanation generator
│   │
│   ├── ml/                         # Machine Learning Modules
│   │   ├── models/                 # Serialized .pkl Model Binaries
│   │   ├── model_loader.py         # Robust pickle model loader
│   │   ├── preprocessing.py        # One-hot encoding & StandardScaler
│   │   ├── predictor.py            # Classification prediction logic
│   │   ├── clustering.py           # KMeans cluster prediction logic
│   │   └── anomaly_detection.py    # Isolation Forest anomaly detector
│   │
│   ├── repositories/               # Data Access Repository Layer
│   └── utils/                      # Helper Utilities
│
├── tests/                          # Automated Pytest Suite
├── .env                            # Active environment file
├── .env.example                    # Template environment file
└── requirements.txt                # Dependencies specification
```

---

## Quick Start

### 1. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Environment Configuration
Create or edit `.env` in `backend/` or root directory:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_SMS_FROM=+17372212163
```

### 3. Run Development Server
```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
Open interactive Swagger UI docs at: `http://localhost:8000/docs`

---

## Live Endpoints

- `GET  /` - System Health Check
- `POST /api/ml/predict` - ML Access-Gap, Cluster, & Anomaly Prediction
- `POST /api/notification/notify` - Dispatch WhatsApp alert (with automatic SMS fallback)
- `POST /api/notification/notify-sms` - Direct SMS Alert Dispatcher
