from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])

REASON = "waiting on Access Gap Score formula definition"

@router.get("/access-gap-score", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_access_gap_score():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"status": "not implemented", "reason": REASON}
    )

@router.get("/risk-level", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_risk_level():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"status": "not implemented", "reason": REASON}
    )

@router.get("/priority-ranking", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_priority_ranking():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"status": "not implemented", "reason": REASON}
    )

@router.get("/specialty-matching", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_specialty_matching():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"status": "not implemented", "reason": REASON}
    )
