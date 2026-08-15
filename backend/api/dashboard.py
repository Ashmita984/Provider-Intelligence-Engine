from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_dashboard():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={
            "status": "not implemented",
            "reason": "waiting on database"
        }
    )
