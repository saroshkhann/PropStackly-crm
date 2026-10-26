from typing import List, Union, Optional
from pydantic import AnyHttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


DEV_ONLY_FALLBACK_SECRET = "propstackly-insecure-dev-only-secret-key-32chars-min"
INSECURE_SECRET_KEYS = {
    "",
    "secret",
    "secret_key",
    "change_me",
    "changeme",
    "replace_with_a_secure_random_key_in_production",
    "veltrivo_insecure_dev_secret_key_change_in_prod_847192",
    "dev_secret_key_veltrivo_pk_7492018",
    "propstackly_insecure_dev_secret_key_change_in_prod_847192",
    "dev_secret_key_propstackly_pk_7492018",
    DEV_ONLY_FALLBACK_SECRET,
}


class Settings(BaseSettings):
    PROJECT_NAME: str = "PropStackly CRM API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment mode: "development", "test", "staging", "production"
    ENVIRONMENT: str = "development"

    # Secret Key for JWT (MUST be explicitly configured and secure in production)
    SECRET_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Cookie Session Settings
    COOKIE_NAME: str = "propstackly_session"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_HTTPONLY: bool = True
    
    # Database URL: Supports PostgreSQL (e.g. postgresql+psycopg://user:pass@localhost:5432/propstackly_crm)
    # Default to sqlite:///./propstackly_crm.db for seamless local dev & test portability
    DATABASE_URL: str = "sqlite:///./propstackly_crm.db"
    
    # CORS Origins (allow Next.js frontend)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    # Email & Password Reset Settings
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True
    EMAILS_FROM_EMAIL: str = "noreply@propstackly.pk"
    EMAILS_FROM_NAME: str = "PropStackly CRM Security"
    FRONTEND_URL: str = "http://localhost:3000"
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 15

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        env = (self.ENVIRONMENT or "development").strip().lower()
        is_production = env in ("production", "prod", "staging")

        if is_production:
            if not self.SECRET_KEY or not self.SECRET_KEY.strip():
                raise ValueError(
                    "Production configuration error: SECRET_KEY environment variable is missing. "
                    "A cryptographically secure random string (at least 32 characters) must be configured."
                )
            key = self.SECRET_KEY.strip()
            if len(key) < 32:
                raise ValueError(
                    f"Production configuration error: SECRET_KEY must be at least 32 characters long (got {len(key)})."
                )
            if key in INSECURE_SECRET_KEYS or "dev" in key.lower() or "insecure" in key.lower():
                raise ValueError(
                    "Production configuration error: SECRET_KEY cannot use a known default, placeholder, or development secret."
                )
        else:
            # Convenient development-only configuration fallback
            if not self.SECRET_KEY or not self.SECRET_KEY.strip():
                self.SECRET_KEY = DEV_ONLY_FALLBACK_SECRET

        return self


settings = Settings()
