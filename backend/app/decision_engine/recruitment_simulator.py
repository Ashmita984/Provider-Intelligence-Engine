def simulate_recruitment_impact(current_providers: int, added_providers: int, estimated_patients: float) -> dict:
    new_total = current_providers + added_providers
    new_ratio = estimated_patients / max(1, new_total)
    return {
        "new_provider_count": new_total,
        "new_patients_per_provider": new_ratio
    }
