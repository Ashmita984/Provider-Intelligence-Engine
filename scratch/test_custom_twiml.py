import os
import urllib.parse
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
print(f"TESTING TWIMLET CUSTOM VOICE CALL TO: {to_num}")
print("=" * 60)

speech_text = (
    "Hello! This is an urgent healthcare provider access gap alert. "
    "A critical provider shortage has been identified in Cardiology for Wayne County. "
    "Immediate provider recruitment is recommended."
)

encoded_speech = urllib.parse.quote_plus(speech_text)
twimlet_url = f"http://twimlets.com/message?Message%5B0%5D={encoded_speech}"

try:
    call = client.calls.create(
        url=twimlet_url,
        to=to_num,
        from_=from_num
    )
    print("TWIMLET CUSTOM VOICE CALL SUCCESS!")
    print(f"Call SID: {call.sid}")
    print(f"Call Status: {call.status}")
except Exception as e:
    print(f"Twimlet Voice Call Failed: {e}")
