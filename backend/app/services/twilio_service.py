import os
import urllib.parse
import pandas as pd
from dotenv import load_dotenv
from ..core.config import settings

# Ensure environment variables are loaded immediately at module import
load_dotenv()

# ------------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------------
PROVIDER_DATA_PATH = "UC05_ALL_FOUR_DATASETS/UC05_PROVIDER_FINAL_WITH_DISEASE.csv"
GEO_DATA_PATH = "UC05_geospatial_distances.csv"

# ------------------------------------------------------------------
# CORE TWILIO ALERT FUNCTIONS
# ------------------------------------------------------------------
def send_whatsapp_alert(to_number: str = None, message: str = None) -> dict:
    """
    Sends a WhatsApp message using Twilio's REST API.
    """
    load_dotenv()
    account_sid = settings.TWILIO_ACCOUNT_SID or os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = settings.TWILIO_AUTH_TOKEN or os.getenv("TWILIO_AUTH_TOKEN")
    whatsapp_number = settings.TWILIO_WHATSAPP_NUMBER or os.getenv("TWILIO_WHATSAPP_NUMBER") or os.getenv("TWILIO_PHONE_NUMBER")

    target_number = to_number or settings.TEST_TO_NUMBER or os.getenv("TEST_TO_NUMBER") or whatsapp_number

    sid_status = "FOUND" if account_sid else "MISSING"
    token_status = "FOUND" if auth_token else "MISSING"
    number_status = "FOUND" if whatsapp_number else "MISSING"

    print(f"[TwilioService Debug] Credentials status - ACCOUNT_SID: {sid_status}, AUTH_TOKEN: {token_status}, WHATSAPP_NUMBER: {number_status}")

    if not account_sid or not auth_token or not whatsapp_number or not target_number:
        return {
            "status": "failed",
            "error": f"Twilio credentials missing. Status - ACCOUNT_SID: {sid_status}, AUTH_TOKEN: {token_status}, WHATSAPP_NUMBER: {number_status}"
        }

    whatsapp_body = message if message else "High healthcare access gap detected. Provider shortage identified. Provider recruitment recommended."

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        formatted_to = target_number if target_number.startswith("whatsapp:") else f"whatsapp:{target_number}"
        formatted_from = whatsapp_number if whatsapp_number.startswith("whatsapp:") else f"whatsapp:{whatsapp_number}"

        msg = client.messages.create(
            body=whatsapp_body,
            from_=formatted_from,
            to=formatted_to
        )
        return {
            "status": "sent",
            "message_sid": msg.sid
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e)
        }


def send_sms_alert(to_number: str = None, message: str = None) -> dict:
    """
    Sends a custom SMS alert using Twilio's REST API.
    """
    load_dotenv()
    account_sid = settings.TWILIO_ACCOUNT_SID or os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = settings.TWILIO_AUTH_TOKEN or os.getenv("TWILIO_AUTH_TOKEN")
    sms_from = settings.TWILIO_SMS_FROM or os.getenv("TWILIO_SMS_FROM") or os.getenv("TWILIO_WHATSAPP_NUMBER") or os.getenv("TWILIO_PHONE_NUMBER") or "+17372212163"

    target_number = to_number or settings.TEST_TO_NUMBER or os.getenv("TEST_TO_NUMBER") or "+17372212163"

    if sms_from and sms_from.startswith("whatsapp:"):
        sms_from = sms_from[len("whatsapp:"):]

    sid_status = "FOUND" if account_sid else "MISSING"
    token_status = "FOUND" if auth_token else "MISSING"
    from_status = "FOUND" if sms_from else "MISSING"

    print(f"[TwilioService Debug] SMS Credentials status - ACCOUNT_SID: {sid_status}, AUTH_TOKEN: {token_status}, SMS_FROM: {from_status}")

    if not account_sid or not auth_token or not sms_from or not target_number:
        return {
            "status": "failed",
            "error": f"Twilio SMS credentials missing. Status - ACCOUNT_SID: {sid_status}, AUTH_TOKEN: {token_status}, SMS_FROM: {from_status}"
        }

    sms_body = message if message else "High healthcare access gap detected. Provider shortage identified. Provider recruitment recommended."
    formatted_to = target_number[len("whatsapp:"):] if target_number.startswith("whatsapp:") else target_number

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        msg = client.messages.create(
            body=sms_body,
            from_=sms_from,
            to=formatted_to
        )
        return {
            "status": "sent",
            "message_sid": msg.sid
        }
    except Exception as e:
        err_str = str(e)
        if any(term in err_str.lower() for term in ["template", "trial", "predefined", "disallowed"]):
            try:
                msg = client.messages.create(
                    body="sms_appointment_reminders",
                    from_=sms_from,
                    to=formatted_to
                )
                return {
                    "status": "sent",
                    "message_sid": msg.sid
                }
            except Exception as e2:
                return {
                    "status": "failed",
                    "error": str(e2)
                }
        return {
            "status": "failed",
            "error": err_str
        }


# ------------------------------------------------------------------
# PROVIDER LOOKUP & MATCHING
# ------------------------------------------------------------------
def load_provider_data(path: str = None) -> pd.DataFrame:
    candidate_paths = [
        path,
        PROVIDER_DATA_PATH,
        "UC05_ALL_FOUR_DATASETS/UC05_PROVIDER_FINAL_WITH_DISEASE.csv",
        "UC05_FINAL_DATA_WITH_DISEASE (2)/UC05_PROVIDER_FINAL_WITH_DISEASE.csv",
        "UC05_finalled_data/UC05_PROVIDER_FINAL.csv",
        "UC05_PROVIDER_FINAL.csv",
        GEO_DATA_PATH
    ]
    p = next((cp for cp in candidate_paths if cp and os.path.exists(cp)), None)
    if p and os.path.exists(p):
        return pd.read_csv(p, dtype={"NPI": str, "PROVIDER_ID": str, "COUNTY_FIPS": str, "ZIP": str})
    return pd.DataFrame()


def find_nearby_providers(df: pd.DataFrame, specialty: str, location: str, top_n: int = 1) -> list:
    if df.empty:
        return []
    
    spec_col = "PRIMARY_SPECIALTY" if "PRIMARY_SPECIALTY" in df.columns else ("REQUIRED_SPECIALTY" if "REQUIRED_SPECIALTY" in df.columns else None)
    if not spec_col:
        return df.head(top_n).to_dict(orient="records")

    specialty_filter = df[spec_col].astype(str).str.upper() == specialty.strip().upper()

    if location.isdigit() and len(location) == 5 and "ZIP" in df.columns:
        location_filter = df["ZIP"].astype(str) == location
    elif "COUNTY_FIPS" in df.columns:
        location_filter = df["COUNTY_FIPS"].astype(str).str.zfill(5) == str(location).zfill(5)
    else:
        location_filter = pd.Series(True, index=df.index)

    sort_col = "distance_to_provider" if "distance_to_provider" in df.columns else ("avg_distance_to_provider" if "avg_distance_to_provider" in df.columns else None)
    
    filtered = df[specialty_filter & location_filter]
    if filtered.empty:
        filtered = df[specialty_filter]
    if filtered.empty:
        filtered = df

    if sort_col and sort_col in filtered.columns:
        filtered = filtered.sort_values(sort_col)

    return filtered.head(top_n).to_dict(orient="records")


def format_provider_message(provider: dict, specialty: str, location: str) -> str:
    provider_id = provider.get("NPI", provider.get("PROVIDER_ID", "N/A"))
    name = provider.get("PROVIDER_NAME", "Healthcare Provider")
    distance = provider.get("distance_to_provider", provider.get("avg_distance_to_provider", provider.get("min_distance_to_provider")))
    
    try:
        distance_str = f"{float(distance):.2f} miles" if distance is not None and pd.notna(distance) else "N/A"
    except (ValueError, TypeError):
        distance_str = "N/A"

    message = (
        f"🏥 Provider Match Found\n"
        f"-------------\n"
        f"👤 Provider: {name}\n"
        f"🆔 NPI/ID: {provider_id}\n"
        f"🩺 Specialty: {specialty.title()}\n"
        f"📍 Area: {location}\n"
        f"📏 Distance: {distance_str}\n"
        f"-------------\n"
        f"Healthcare Provider Access-Gap Notification System"
    )
    return message


def make_provider_call(to_number: str = None, provider: dict = None, specialty: str = "Healthcare") -> dict:
    """
    Places a voice call using Twilio Voice API with custom speech text converted via Twimlet URL.
    """
    load_dotenv()
    account_sid = settings.TWILIO_ACCOUNT_SID or os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = settings.TWILIO_AUTH_TOKEN or os.getenv("TWILIO_AUTH_TOKEN")
    call_from = settings.TWILIO_SMS_FROM or os.getenv("TWILIO_SMS_FROM") or os.getenv("TWILIO_PHONE_NUMBER") or "+17372212163"

    target_number = to_number or settings.TEST_TO_NUMBER or os.getenv("TEST_TO_NUMBER")

    if not account_sid or not auth_token or not call_from or not target_number:
        return {"status": "failed", "error": "Twilio call credentials missing."}

    prov_dict = provider or {}
    prov_name = prov_dict.get("PROVIDER_NAME", "a healthcare provider")

    import html
    spoken_text = (
        f"Hello. This is an urgent healthcare access gap notification. "
        f"We found {prov_name} for {specialty}. "
        f"Please check your healthcare portal for full provider matching details."
    )

    encoded_text = urllib.parse.quote(spoken_text)
    twimlet_url = f"https://twimlets.com/message?Message%5B0%5D={encoded_text}"

    formatted_to = target_number[len("whatsapp:"):] if target_number.startswith("whatsapp:") else target_number
    formatted_from = call_from[len("whatsapp:"):] if call_from.startswith("whatsapp:") else call_from

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        call = client.calls.create(
            url=twimlet_url,
            to=formatted_to,
            from_=formatted_from
        )
        return {"status": "sent", "call_sid": call.sid}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


def send_voice_call_alert(to_number: str = None, message: str = None) -> dict:
    """
    Places an automated Voice Call via Twilio Voice API.
    """
    load_dotenv()
    account_sid = settings.TWILIO_ACCOUNT_SID or os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = settings.TWILIO_AUTH_TOKEN or os.getenv("TWILIO_AUTH_TOKEN")
    call_from = settings.TWILIO_SMS_FROM or os.getenv("TWILIO_SMS_FROM") or os.getenv("TWILIO_PHONE_NUMBER") or "+17372212163"
    target_number = to_number or settings.TEST_TO_NUMBER or os.getenv("TEST_TO_NUMBER")

    if call_from and call_from.startswith("whatsapp:"):
        call_from = call_from[len("whatsapp:"):]

    if not account_sid or not auth_token or not call_from or not target_number:
        return {"status": "failed", "error": "Twilio Voice call credentials missing."}

    spoken_text = message if message else "Urgent healthcare access gap notification. Provider shortage detected."
    encoded_text = urllib.parse.quote(spoken_text)
    twimlet_url = f"https://twimlets.com/message?Message%5B0%5D={encoded_text}"

    formatted_to = target_number[len("whatsapp:"):] if target_number.startswith("whatsapp:") else target_number
    formatted_from = call_from[len("whatsapp:"):] if call_from.startswith("whatsapp:") else call_from

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        call = client.calls.create(
            url=twimlet_url,
            to=formatted_to,
            from_=formatted_from
        )
        return {"status": "sent", "message_sid": call.sid}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


def send_provider_notification(to_number: str = None, provider: dict = None, specialty: str = "Healthcare",
                                 location: str = "Specified Area", channel: str = "sms") -> dict:
    """
    channel: "sms", "whatsapp", "call", or "both" (sms + call)
    """
    target = to_number or settings.TEST_TO_NUMBER or os.getenv("TEST_TO_NUMBER")
    prov_dict = provider or {}
    message = format_provider_message(prov_dict, specialty, location)
    results = {}

    if channel in ("sms", "both"):
        results["sms"] = send_sms_alert(target, message)

    if channel in ("whatsapp", "both"):
        results["whatsapp"] = send_whatsapp_alert(target, message)

    if channel in ("call", "both"):
        results["call"] = make_provider_call(target, prov_dict, specialty)

    return results


def run():
    location = input("Enter ZIP code or county FIPS: ").strip()
    specialty = input("Enter provider specialty (e.g. Cardiology): ").strip()
    user_number = input("Enter recipient number (+91XXXXXXXXXX): ").strip()

    df = load_provider_data()
    matches = find_nearby_providers(df, specialty, location, top_n=1)

    if not matches:
        print("No matching provider found.")
        return

    provider = matches[0]
    result = send_provider_notification(
        to_number=user_number,
        provider=provider,
        specialty=specialty,
        location=location,
        channel="call"
    )
    print(result)


if __name__ == "__main__":
    run()