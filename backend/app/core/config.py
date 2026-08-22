import os
from pathlib import Path
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base Paths
APP_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = APP_DIR.parent
ROOT_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "Socivio"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"

    # Database (Postgres on Neon)
    DATABASE_URL: Optional[str] = None

    # JWT Authentication
    JWT_SECRET_KEY: str = "dev_jwt_secret_key_change_in_production_9876543210"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Cloudinary Photo Storage (Server-side credentials)
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    CLOUDINARY_FOLDER: str = "society_complaints"

    # Brevo Email Service (Optional server-side credentials)
    BREVO_API_KEY: Optional[str] = None
    EMAIL_FROM: Optional[str] = None
    EMAIL_FROM_NAME: str = "Socivio"
    FRONTEND_URL: str = "http://localhost:5173"

    # CORS configuration - Explicit origins only (never wildcard with credentials)
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Seed Defaults
    SEED_ADMIN_EMAIL: str = "admin@society.com"
    SEED_ADMIN_NAME: str = "Society Admin"
    SEED_ADMIN_PASSWORD: str = "Admin@12345"
    SEED_ADMIN_FLAT: str = "Office-101"

    SEED_RESIDENT_EMAIL: str = "resident@society.com"
    SEED_RESIDENT_NAME: str = "John Resident"
    SEED_RESIDENT_PASSWORD: str = "Resident@12345"
    SEED_RESIDENT_FLAT: str = "A-101"

    # Complaint SLA settings
    DEFAULT_OVERDUE_THRESHOLD_DAYS: int = 3

    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("ACCESS_TOKEN_EXPIRE_MINUTES", mode="before")
    @classmethod
    def validate_access_token_expire(cls, v: Union[str, int, None]) -> int:
        if v is None or v == "" or (isinstance(v, str) and not v.strip()):
            return 1440
        try:
            return int(v)
        except (ValueError, TypeError):
            return 1440

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        default_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        if isinstance(v, str) and not v.startswith("["):
            origins = [i.strip() for i in v.split(",") if i.strip()]
            for origin in default_origins:
                if origin not in origins:
                    origins.append(origin)
            return origins
        elif isinstance(v, list):
            for origin in default_origins:
                if origin not in v:
                    v.append(origin)
            return v
        return default_origins

    @property
    def sqlalchemy_database_uri(self) -> Optional[str]:
        if not self.DATABASE_URL:
            return None
        url = self.DATABASE_URL.strip()
        if url.startswith("postgres://"):
            return "postgresql+psycopg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            return "postgresql+psycopg://" + url[len("postgresql://"):]
        return url

    @property
    def is_database_configured(self) -> bool:
        if not self.DATABASE_URL or not self.DATABASE_URL.strip():
            return False
        if "user:password@host/dbname" in self.DATABASE_URL:
            return False
        return True

    @property
    def is_cloudinary_configured(self) -> bool:
        return bool(
            self.CLOUDINARY_CLOUD_NAME
            and self.CLOUDINARY_API_KEY
            and self.CLOUDINARY_API_SECRET
        )

    @property
    def is_brevo_configured(self) -> bool:
        return bool(
            self.BREVO_API_KEY
            and self.BREVO_API_KEY.strip()
            and self.EMAIL_FROM
            and self.EMAIL_FROM.strip()
        )


settings = Settings()
