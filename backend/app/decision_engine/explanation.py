def generate_explanation(gap_prediction: int, cluster_id: int, is_anomaly: bool) -> str:
    parts = []
    if gap_prediction == 1:
        parts.append("High patient-to-provider ratio indicates healthcare access gap.")
    else:
        parts.append("Access level meets baseline requirements.")
    parts.append(f"Assigned to regional cluster #{cluster_id}.")
    if is_anomaly:
        parts.append("Area flagged as statistical anomaly requiring manual review.")
    return " ".join(parts)
