from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend service for predicting access gaps, clustering regions, anomaly detection, and WhatsApp alerts.",
    version=settings.VERSION
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

# Register Unified API Router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
