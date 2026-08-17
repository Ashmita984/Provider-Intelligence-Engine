import os
from pathlib import Path
from dotenv import load_dotenv

# Base Directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env file from backend/ or root
env_paths = [
    BASE_DIR / ".env",
    BASE_DIR.parent / ".env"
]
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        break

class Settings:
    PROJECT_NAME: str = "Healthcare Provider Access-Gap Decision-Support API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Twilio Credentials
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_WHATSAPP_NUMBER: str = os.getenv("TWILIO_WHATSAPP_NUMBER", "")
    TWILIO_SMS_FROM: str = os.getenv("TWILIO_SMS_FROM", os.getenv("TWILIO_WHATSAPP_NUMBER", "+17372212163"))
    TEST_TO_NUMBER: str = os.getenv("TEST_TO_NUMBER", "")

    # Model Directory Paths
    MODEL_DIR: Path = BASE_DIR / "app" / "ml" / "models"
    ROOT_MODEL_DIR: Path = BASE_DIR.parent

settings = Settings()
