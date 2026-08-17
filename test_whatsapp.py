from twilio.rest import Client
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))

variables = json.dumps({"1": "Cardiology Alert", "2": "Autauga County - HIGH Risk"})

try:
    msg = client.messages.create(
        from_="whatsapp:+17372212163",
        to="whatsapp:+918610848428",
        content_sid="HXb5b62575e6e4ff6129ad7c8efe1f983e",
        content_variables=variables
    )
    print("SUCCESS:", msg.sid)
except Exception as e:
    print("FAILED:", str(e))
