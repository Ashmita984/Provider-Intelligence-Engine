def classify_risk_level(gap_score: float, provider_count: float) -> str:
    if provider_count <= 0:
        return "NO PROVIDER"
    elif gap_score >= 80:
        return "CRITICAL GAP"
    elif gap_score >= 50:
        return "HIGH GAP"
    elif gap_score >= 20:
        return "MODERATE GAP"
    else:
        return "LOW GAP"
