import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")
from_num = os.getenv("TWILIO_SMS_FROM") or "+17372212163"
if from_num.startswith("whatsapp:"):
    from_num = from_num[len("whatsapp:"):]

to_num = os.getenv("TEST_TO_NUMBER") or "+918610848428"
if to_num.startswith("whatsapp:"):
    to_num = to_num[len("whatsapp:"):]

client = Client(account_sid, auth_token)

print("=" * 60)
print(f"TESTING VOICE CALL WITH TWILIO DEMO URL TO: {to_num} FROM: {from_num}")
print("=" * 60)

try:
    call = client.calls.create(
        url="http://demo.twilio.com/docs/voice.xml",
        to=to_num,
        from_=from_num
    )
    print("VOICE CALL SUCCESS!")
    print(f"Call SID: {call.sid}")
    print(f"Call Status: {call.status}")
except Exception as e:
    print(f"Voice Call Failed: {e}")
