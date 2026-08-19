from fastapi import APIRouter, status, Query
from fastapi.responses import JSONResponse
from ...decision_engine.xai_engine import calculate_xai_explanation

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])

REASON = "waiting on Access Gap Score formula definition"

@router.get("/xai-recommendation", status_code=status.HTTP_200_OK)
def get_xai_recommendation(
    area_name: str = Query("Wayne County", alias="areaName"),
    state: str = Query("MI"),
    specialty: str = Query("Cardiology"),
    risk_score: float = Query(88.5, alias="riskScore"),
    current_providers: int = Query(1, alias="currentProviders"),
    providers_needed: int = Query(3, alias="providersNeeded"),
    avg_travel_distance: float = Query(28.4, alias="avgTravelDistanceKm")
):
    """
    Returns Explainable AI (XAI) feature attribution breakdown, model confidence,
    and decision narrative for AI provider recruitment recommendations.
    """
    result = calculate_xai_explanation(
        area_name=area_name,
        state=state,
        specialty=specialty,
        risk_score=risk_score,
        current_providers=current_providers,
        providers_needed=providers_needed,
        avg_travel_distance=avg_travel_distance
    )
    return result

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
