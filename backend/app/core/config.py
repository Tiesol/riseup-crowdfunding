import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/database_crowdfunding")

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "riseup_crowdfunding_secret_key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_HOURS: int = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "sandbox.smtp.mailtrap.io")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "2525"))
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "noreply@riseup.com")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "RiseUp Platform")
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")
    # Modo demo: las cuentas nuevas quedan activas sin verificar el correo
    AUTO_VERIFY_USERS: bool = os.getenv("AUTO_VERIFY_USERS", "false").lower() == "true"

    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:8080")

settings = Settings()
