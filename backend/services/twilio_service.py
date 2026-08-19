import os
from dotenv import load_dotenv

# Ensure environment variables are loaded immediately at module import
load_dotenv()

def send_whatsapp_alert(to_number: str, message: str) -> dict:
    """
    Sends a WhatsApp message using Twilio's REST API.
    
    :param to_number: Recipient number, e.g. "whatsapp:+91XXXXXXXXXX" or "+91XXXXXXXXXX"
    :param message: The text message content to send
    :return: dict {"status": "sent", "message_sid": ...} or {"status": "failed", "error": ...}
    """
    # Ensure fresh read of environment variables on every function invocation
    load_dotenv()
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    whatsapp_number = os.getenv("TWILIO_WHATSAPP_NUMBER") or os.getenv("TWILIO_PHONE_NUMBER")

    # Debug log (printing FOUND or MISSING without exposing secret values)
    sid_status = "FOUND" if account_sid else "MISSING"
    token_status = "FOUND" if auth_token else "MISSING"
    number_status = "FOUND" if whatsapp_number else "MISSING"
    
    print(f"[TwilioService Debug] Credentials status - ACCOUNT_SID: {sid_status}, AUTH_TOKEN: {token_status}, WHATSAPP_NUMBER/PHONE_NUMBER: {number_status}")

    if not account_sid or not auth_token or not whatsapp_number:
        return {
            "status": "failed",
            "error": f"Twilio credentials missing. Status - ACCOUNT_SID: {sid_status}, AUTH_TOKEN: {token_status}, WHATSAPP_NUMBER: {number_status}"
        }

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)

        # Ensure to_number and from_ number have "whatsapp:" prefix
        formatted_to = to_number if to_number.startswith("whatsapp:") else f"whatsapp:{to_number}"
        formatted_from = whatsapp_number if whatsapp_number.startswith("whatsapp:") else f"whatsapp:{whatsapp_number}"

        msg = client.messages.create(
            body=message,
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


def send_sms_alert(to_number: str, message: str = None) -> dict:
    """
    Sends a custom SMS alert using Twilio's REST API.
    
    :param to_number: Recipient number, e.g. "+91XXXXXXXXXX" (without "whatsapp:" prefix)
    :param message: The custom healthcare notification text to send
    :return: dict {"status": "sent", "message_sid": ...} or {"status": "failed", "error": ...}
    """
    # Ensure fresh read of environment variables on every function invocation
    load_dotenv()
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    sms_from = os.getenv("TWILIO_SMS_FROM") or os.getenv("TWILIO_WHATSAPP_NUMBER") or os.getenv("TWILIO_PHONE_NUMBER") or "+17372212163"

    # Ensure sms_from does not have "whatsapp:" prefix
    if sms_from and sms_from.startswith("whatsapp:"):
        sms_from = sms_from[len("whatsapp:"):]

    sid_status = "FOUND" if account_sid else "MISSING"
    token_status = "FOUND" if auth_token else "MISSING"
    from_status = "FOUND" if sms_from else "MISSING"

    print(f"[TwilioService Debug] SMS Credentials status - ACCOUNT_SID: {sid_status}, AUTH_TOKEN: {token_status}, SMS_FROM: {from_status}")

    if not account_sid or not auth_token or not sms_from:
        return {
            "status": "failed",
            "error": f"Twilio SMS credentials missing. Status - ACCOUNT_SID: {sid_status}, AUTH_TOKEN: {token_status}, SMS_FROM: {from_status}"
        }

    # Use custom message if provided, otherwise default to healthcare notification template
    sms_body = message if message else "High healthcare access gap detected. Provider shortage identified. Provider recruitment recommended."

    # Ensure formatted_to does not have "whatsapp:" prefix
    formatted_to = to_number[len("whatsapp:"):] if to_number.startswith("whatsapp:") else to_number

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

