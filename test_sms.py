import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

client = Client(
    os.environ["TWILIO_ACCOUNT_SID"],
    os.environ["TWILIO_AUTH_TOKEN"]
)

message = client.messages.create(
    from_="+17372212163",
    to="+918610848428",
    body="sms_appointment_reminders"
)

print("SID:", message.sid)
print("Status:", message.status)
