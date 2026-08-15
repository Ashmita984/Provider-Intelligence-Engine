from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/optimization", tags=["Optimization"])

REASON = "waiting on cost data and geographic distance data"

@router.post("/recruitment", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def optimize_recruitment():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"status": "not implemented", "reason": REASON}
    )

@router.post("/placement", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def optimize_placement():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"status": "not implemented", "reason": REASON}
    )

@router.post("/alternative-care", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def optimize_alternative_care():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"status": "not implemented", "reason": REASON}
    )
