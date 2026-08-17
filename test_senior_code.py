import os
import json
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

client = Client(
    os.environ["TWILIO_ACCOUNT_SID"],
    os.environ["TWILIO_AUTH_TOKEN"]
)
message = client.messages.create(
    from_="whatsapp:+14155238886",
    to="whatsapp:+918610848428",
    content_sid="HXb5b62575e6e4ff6129ad7c8efe1f983e",
    content_variables=json.dumps({
        "1": "22 August 2026",
        "2": "10:00 AM"
    })
)
print("SID:", message.sid)
print("Status:", message.status)
