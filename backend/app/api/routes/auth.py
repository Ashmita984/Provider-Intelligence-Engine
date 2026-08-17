from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def login():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={
            "status": "not implemented",
            "reason": "waiting on database/user table"
        }
    )
