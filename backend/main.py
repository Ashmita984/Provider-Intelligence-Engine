"""
========================================================================================
HEALTHCARE PROVIDER ACCESS-GAP DECISION-SUPPORT SYSTEM - BACKEND API STATUS
========================================================================================

LIVE ENDPOINTS:
--------------
- GET  /                                (Root Health Check -> {"status": "ok"})
- POST /api/ml/predict                  (ML Prediction -> Access Gap, Cluster ID, Anomaly Score)
- POST /api/notification/notify         (WhatsApp Notification Alert via Twilio)

STUBBED ENDPOINTS (501 Not Implemented):
----------------------------------------
- POST /api/auth/login                  (Waiting on database/user table)
- GET  /api/dashboard                   (Waiting on database)
- GET  /api/data/provider               (Waiting on database schema from team)
- GET  /api/data/population             (Waiting on database schema from team)
- GET  /api/data/utilization            (Waiting on database schema from team)
- GET  /api/data/geographic             (Waiting on database schema from team)
- GET  /api/analysis/access-gap-score   (Waiting on Access Gap Score formula definition)
- GET  /api/analysis/risk-level         (Waiting on Access Gap Score formula definition)
- GET  /api/analysis/priority-ranking   (Waiting on Access Gap Score formula definition)
- GET  /api/analysis/specialty-matching (Waiting on Access Gap Score formula definition)
- POST /api/optimization/recruitment    (Waiting on cost data and geographic distance data)
- POST /api/optimization/placement      (Waiting on cost data and geographic distance data)
- POST /api/optimization/alternative-care (Waiting on cost data and geographic distance data)
- POST /api/simulation/what-if          (Waiting on Access Gap Score formula)
========================================================================================
"""

from dotenv import load_dotenv

# Load environment variables from .env file at startup
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import API routers
from .api.auth import router as auth_router
from .api.dashboard import router as dashboard_router
from .api.data import router as data_router
from .api.ml import router as ml_router
from .api.analysis import router as analysis_router
from .api.optimization import router as optimization_router
from .api.simulation import router as simulation_router
from .api.notification import router as notification_router

app = FastAPI(
    title="Healthcare Provider Access-Gap Decision-Support API",
    description="Backend service for predicting access gaps, clustering regions, anomaly detection, and WhatsApp alerts.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoint
@app.get("/")
def health_check():
    return {"status": "ok"}

# Register API Routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(data_router)
app.include_router(ml_router)
app.include_router(analysis_router)
app.include_router(optimization_router)
app.include_router(simulation_router)
app.include_router(notification_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
