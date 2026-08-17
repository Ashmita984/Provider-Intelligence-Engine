from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/data", tags=["Data"])

REASON = "waiting on database schema from team"

@router.get("/provider", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_provider_data():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"status": "not implemented", "reason": REASON}
    )

@router.get("/population", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_population_data():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"status": "not implemented", "reason": REASON}
    )

@router.get("/utilization", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_utilization_data():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"status": "not implemented", "reason": REASON}
    )

@router.get("/geographic", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_geographic_data():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"status": "not implemented", "reason": REASON}
    )
