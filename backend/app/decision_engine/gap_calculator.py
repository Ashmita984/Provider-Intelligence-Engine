def calculate_gap_score(patients: float, providers: float, median_ratio: float) -> float:
    if providers <= 0:
        return 100.0
    current_ratio = patients / providers
    if median_ratio <= 0:
        return 0.0
    ratio = current_ratio / median_ratio
    return min(100.0, max(0.0, ratio * 10.0))
