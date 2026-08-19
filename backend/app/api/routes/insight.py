import os
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/insight", tags=["LLM Insight Assistant"])


class InsightRequest(BaseModel):
    page_context: str = "Area Insights"
    area_name: Optional[str] = None
    state: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    cluster_group: Optional[str] = None
    is_anomaly: Optional[bool] = None
    provider_supply: Optional[int] = None
    providers_needed: Optional[int] = None
    primary_specialty: Optional[str] = None
    recommendation: Optional[str] = None
    metrics_summary: Optional[Dict[str, Any]] = None
    top_critical_areas: Optional[List[Dict[str, Any]]] = None
    question: Optional[str] = None


class InsightResponse(BaseModel):
    summary: str
    answer: Optional[str] = None
    source: str = "grounded_synthesis"


def _generate_grounded_summary(req: InsightRequest) -> str:
    if req.page_context == "Dashboard" and req.metrics_summary:
        m = req.metrics_summary
        total_areas = m.get("totalAreas", "N/A")
        high_risk = m.get("highRiskAreas", "N/A")
        gap_areas = m.get("accessGapAreas", "N/A")
        avg_dist = m.get("avgTravelDistanceKm", "N/A")
        top_name = (
            req.top_critical_areas[0].get("name", "N/A")
            if req.top_critical_areas and len(req.top_critical_areas) > 0
            else "N/A"
        )
        top_risk = (
            req.top_critical_areas[0].get("riskScore", "N/A")
            if req.top_critical_areas and len(req.top_critical_areas) > 0
            else "N/A"
        )
        return (
            f"Network Health Overview: Monitoring {total_areas} service areas across your provider network. "
            f"There are currently {high_risk} high-risk areas (risk score ≥ 65%) and {gap_areas} areas with access gaps below adequacy thresholds. "
            f"Average travel distance to specialist care is {avg_dist} km. "
            f"The highest priority critical region is {top_name} with a risk score of {top_risk}%."
        )

    # Area Insights page summary
    area = req.area_name or "Selected Region"
    st = f", {req.state}" if req.state else ""
    risk_score = f"{req.risk_score}%" if req.risk_score is not None else "N/A"
    risk_lvl = req.risk_level.capitalize() if req.risk_level else "Unknown"
    spec = req.primary_specialty or "Specialist"
    supply = req.provider_supply if req.provider_supply is not None else "N/A"
    needed = req.providers_needed if req.providers_needed is not None else "N/A"
    cluster = req.cluster_group or "Cluster #1 (High-Volume Access Gap Zone)"
    anomaly_str = "flagged as a statistical anomaly" if req.is_anomaly else "within standard distribution"
    rec = req.recommendation or f"Recruit {needed} {spec} provider(s)"

    return (
        f"Data Summary for {area}{st}: This area is classified in the {risk_lvl} Risk Tier with a headline Access Gap Score of {risk_score}. "
        f"It is assigned to {cluster} and is {anomaly_str}. "
        f"Current specialist supply is {supply} provider(s) against a requirement of {needed} needed for {spec}. "
        f"Action Plan: {rec}."
    )


def _answer_grounded_question(req: InsightRequest, q: str) -> str:
    q_lower = q.lower()

    if "anomaly" in q_lower or "abnormal" in q_lower:
        if req.is_anomaly:
            return (
                f"Yes, {req.area_name or 'this area'} is flagged as a statistical anomaly. "
                f"Its supply-to-demand shortage ({req.providers_needed} needed vs {req.provider_supply} supply) "
                f"and risk score ({req.risk_score}%) deviate significantly from the baseline distribution."
            )
        return (
            f"No, {req.area_name or 'this area'} is not flagged as an anomaly. "
            f"Its metrics fall within standard expected variance for monitored regions."
        )

    if "cluster" in q_lower or "group" in q_lower:
        return (
            f"{req.area_name or 'This area'} is grouped under {req.cluster_group or 'Cluster #1 (High-Volume Access Gap Zone)'}. "
            f"Clustering categorizes regions with similar travel distances, population density, and specialty shortage dynamics."
        )

    if "risk" in q_lower or "score" in q_lower or "tier" in q_lower:
        risk_str = f"{req.risk_score}%" if req.risk_score is not None else "N/A"
        tier_str = req.risk_level.capitalize() if req.risk_level else "N/A"
        return (
            f"The current Risk Tier is '{tier_str}' with an Access Gap Score of {risk_str}. "
            f"This composite metric evaluates demand pressure, provider shortage, travel distance, and healthcare utilization."
        )

    if "provider" in q_lower or "recruit" in q_lower or "need" in q_lower or "staff" in q_lower:
        supply = req.provider_supply if req.provider_supply is not None else 0
        needed = req.providers_needed if req.providers_needed is not None else 0
        spec = req.primary_specialty or "specialists"
        return (
            f"Current staffing is {supply} {spec} provider(s). "
            f"To close the access gap, the decision engine recommends recruiting {needed} additional {spec} provider(s)."
        )

    if "recommendation" in q_lower or "action" in q_lower or "do" in q_lower:
        return f"Current Action Plan: {req.recommendation or 'No immediate action required.'}"

    # Default fallback answer strictly grounded in payload data
    if req.page_context == "Dashboard":
        m = req.metrics_summary or {}
        return (
            f"Based on dashboard data: Total Areas = {m.get('totalAreas', 'N/A')}, "
            f"High Risk Areas = {m.get('highRiskAreas', 'N/A')}, Access Gap Areas = {m.get('accessGapAreas', 'N/A')}, "
            f"Avg Travel Distance = {m.get('avgTravelDistanceKm', 'N/A')} km."
        )

    return (
        f"Based on current page data for {req.area_name or 'this area'}: Risk Score = {req.risk_score}%, "
        f"Risk Tier = {req.risk_level}, Supply = {req.provider_supply}, Providers Needed = {req.providers_needed} for {req.primary_specialty}. "
        f"Action Plan: {req.recommendation}."
    )


@router.post("/summarize", response_model=InsightResponse, status_code=status.HTTP_200_OK)
def summarize_insight(req: InsightRequest):
    """
    LLM Insight Assistant Endpoint: Accepts page-level structured metrics and returns a natural language summary and answers follow-up questions strictly grounded in the passed data.
    """
    summary = _generate_grounded_summary(req)
    answer = None
    if req.question and req.question.strip():
        answer = _answer_grounded_question(req, req.question.strip())
    return InsightResponse(summary=summary, answer=answer, source="grounded_synthesis")
