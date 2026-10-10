import os
from dotenv import load_dotenv

# Load variables from .env file if present
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-rems-2026")
    
    # Oracle Database Settings
    ORACLE_DSN = os.getenv("ORACLE_DSN", "REMS_DSN")
    ORACLE_DRIVER = os.getenv("ORACLE_DRIVER", "Oracle in XE")
    ORACLE_HOST = os.getenv("ORACLE_HOST", "127.0.0.1")
    ORACLE_PORT = os.getenv("ORACLE_PORT", "1521")
    ORACLE_SERVICE = os.getenv("ORACLE_SERVICE", "XE")
    ORACLE_USER = os.getenv("ORACLE_USER", "rems_user")
    ORACLE_PASSWORD = os.getenv("ORACLE_PASSWORD", "rems_password")
    
    DB_CONNECTION_MODE = os.getenv("DB_CONNECTION_MODE", "auto")
    
    # Flask Session Security
    SESSION_COOKIE_HTTPONLY = os.getenv("SESSION_COOKIE_HTTPONLY", "True").lower() == "true"
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "False").lower() == "true"
    SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours
