import os
import sys
from dotenv import load_dotenv

def main():
    print("=" * 60)
    print("TWILIO CONFIGURATION DIAGNOSTIC CHECK")
    print("=" * 60)

    # 1. Load environment variables
    load_dotenv()

    # Track overall summary state
    credentials_found = False
    auth_success = False
    account_type = "Unknown"
    account_status = "Unknown"
    can_list_numbers = False
    test_send_success = False
    failure_reason = "N/A"

    # 2. CHECK 1 - Credentials present
    print("\n--- CHECK 1: Environment Credentials ---")
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    whatsapp_number = os.getenv("TWILIO_WHATSAPP_NUMBER") or os.getenv("TWILIO_PHONE_NUMBER")

    sid_status = "FOUND" if account_sid else "MISSING"
    token_status = "FOUND" if auth_token else "MISSING"
    number_status = "FOUND" if whatsapp_number else "MISSING"

    sms_from = os.getenv("TWILIO_SMS_FROM") or os.getenv("TWILIO_WHATSAPP_NUMBER") or os.getenv("TWILIO_PHONE_NUMBER")
    sms_status = "FOUND" if sms_from else "MISSING"

    print(f"TWILIO_ACCOUNT_SID:     {sid_status}")
    print(f"TWILIO_AUTH_TOKEN:      {token_status}")
    print(f"TWILIO_WHATSAPP_NUMBER: {number_status}")
    print(f"TWILIO_SMS_FROM:        {sms_status}")

    if account_sid and auth_token and whatsapp_number:
        credentials_found = True
    else:
        failure_reason = f"Missing credentials (SID: {sid_status}, Token: {token_status}, Number: {number_status})"
        print(f"\nResult: FAILED - {failure_reason}")

    # 3. CHECK 2 - Credentials valid (authentication test)
    print("\n--- CHECK 2: Authentication Test ---")
    if not account_sid or not auth_token:
        print("Authentication: SKIPPED - Missing Account SID or Auth Token.")
        print_summary(credentials_found, auth_success, account_type, can_list_numbers, test_send_success, failure_reason)
        return

    try:
        from twilio.rest import Client
        from twilio.base.exceptions import TwilioRestException
    except ImportError:
        print("Authentication: FAILED - 'twilio' package is not installed. Run 'pip install twilio'.")
        failure_reason = "'twilio' python library not installed"
        print_summary(credentials_found, auth_success, account_type, can_list_numbers, test_send_success, failure_reason)
        return

    client = None
    try:
        client = Client(account_sid, auth_token)
        account = client.api.accounts(account_sid).fetch()
        account_status = getattr(account, "status", "unknown")
        account_type = getattr(account, "type", "Unknown")

        auth_success = True
        print(f"Authentication: SUCCESS - Account status: {account_status}")
    except Exception as e:
        auth_success = False
        error_msg = str(e)
        if isinstance(e, TwilioRestException):
            error_msg = f"Code {e.code} - {e.msg} (Status: {e.status})"
        
        print(f"Authentication: FAILED - {error_msg}")
        failure_reason = f"Auth Failed: {error_msg}"
        print("\nStopping further checks due to authentication failure.")
        print_summary(credentials_found, auth_success, account_type, can_list_numbers, test_send_success, failure_reason)
        return

    # 4. CHECK 3 - WhatsApp sandbox status / Incoming Phone Numbers
    print("\n--- CHECK 3: Phone Numbers / Sandbox Status ---")
    try:
        incoming_numbers = client.incoming_phone_numbers.list(limit=5)
        can_list_numbers = True
        print(f"Incoming Phone Numbers found: {len(incoming_numbers)}")
        for num in incoming_numbers:
            print(f" - {num.phone_number} (Friendly Name: {num.friendly_name})")
        if len(incoming_numbers) == 0:
            print("Note: No dedicated incoming phone numbers found (account may be using Sandbox number).")
    except Exception as e:
        can_list_numbers = False
        print(f"Failed to fetch phone numbers: {e}")

    # 5. CHECK 4 - Account type check
    print("\n--- CHECK 4: Account Type ---")
    try:
        print(f"Account Type: {account_type} (Status: {account_status})")
        if str(account_type).lower() == "trial":
            print("Note: Account is in TRIAL mode. Custom unapproved template messages or un-joined sandbox recipients may be restricted by Twilio.")
        else:
            print("Account is FULL/PAID.")
    except Exception as e:
        print(f"Account Type Check Error: {e}")

    # 6. CHECK 5 - Test message send
    print("\n--- CHECK 5: Test Message Send ---")
    to_number = os.getenv("TEST_TO_NUMBER") or os.getenv("TWILIO_WHATSAPP_NUMBER")

    if not to_number:
        print("Test Message: SKIPPED - No recipient number provided.")
        failure_reason = "No target recipient number"
    else:
        try:
            formatted_from = whatsapp_number if whatsapp_number.startswith("whatsapp:") else f"whatsapp:{whatsapp_number}"
            formatted_to = to_number if to_number.startswith("whatsapp:") else f"whatsapp:{to_number}"

            print(f"Attempting test WhatsApp send from '{formatted_from}' to '{formatted_to}'...")

            # Attempt sending message
            msg = client.messages.create(
                from_=formatted_from,
                to=formatted_to,
                body="Twilio Diagnostic Check: Test alert from Healthcare Provider Access-Gap System."
            )
            test_send_success = True
            print(f"Test message: SENT - message_sid: {msg.sid}")
        except TwilioRestException as tre:
            test_send_success = False
            full_error = f"TwilioRestException Code {tre.code}: {tre.msg} (HTTP {tre.status}, More Info: {tre.uri})"
            print(f"Test message: FAILED\nFull Error Details:\n{full_error}")
            failure_reason = full_error
        except Exception as e:
            test_send_success = False
            full_error = f"Exception: {str(e)}"
            print(f"Test message: FAILED\nFull Error Details:\n{full_error}")
            failure_reason = full_error

    # 7. Final Summary
    print_summary(credentials_found, auth_success, account_type, can_list_numbers, test_send_success, failure_reason)

def print_summary(credentials_found, auth_success, account_type, can_list_numbers, test_send_success, failure_reason):
    print("\n" + "=" * 44)
    print("TWILIO CONFIGURATION CHECK SUMMARY")
    print("=" * 44)
    print(f"Credentials Found:  {'YES' if credentials_found else 'NO'}")
    print(f"Authentication:     {'SUCCESS' if auth_success else 'FAILED'}")
    print(f"Account Type:       {account_type}")
    print(f"Can List Numbers:   {'YES' if can_list_numbers else 'NO'}")
    print(f"Test Message Send:  {'SUCCESS' if test_send_success else 'FAILED'}")
    if not test_send_success or not auth_success or not credentials_found:
        print(f"Reason (if failed): {failure_reason}")
    print("=" * 44)

if __name__ == "__main__":
    main()
