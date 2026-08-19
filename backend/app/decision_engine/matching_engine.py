from ..services.twilio_service import load_provider_data, find_nearby_providers

def match_specialty_providers(specialty: str, location: str, top_n: int = 5) -> list:
    df = load_provider_data()
    return find_nearby_providers(df, specialty=specialty, location=str(location), top_n=top_n)
