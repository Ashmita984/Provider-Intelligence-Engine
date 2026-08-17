from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

@router.post("/what-if", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def simulate_what_if():
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={
            "status": "not implemented",
            "reason": "waiting on Access Gap Score formula"
        }
    )
