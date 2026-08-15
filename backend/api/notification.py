from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/notification", tags=["Notification"])

@router.post("/notify", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def send_notification():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={
            "status": "not implemented",
            "reason": "waiting on Twilio credentials setup"
        }
    )
