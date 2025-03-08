from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import validator
import json

class Settings(BaseSettings):
    PROJECT_NAME: str
    BACKEND_CORS_ORIGINS: List[str]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                # Parse the JSON string into a list
                return json.loads(v)
            except json.JSONDecodeError:
                # If it's a single URL
                return [v]
        return v

    
    # Database
    POSTGRES_HOST: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: str

    # Security
    SECRET_KEY: str

    # S3/MinIO
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: str
    MINIO_HOST: str
    MINIO_PORT: str
    MINIO_URL: Optional[str] = None
    MINIO_CONSOLE_URL: Optional[str] = None

    # Redis
    REDIS_HOST: str
    REDIS_PORT: str

    # Flower
    ENABLE_FLOWER: bool = False
    FLOWER_PORT: int = 5555
    FLOWER_USER: str
    FLOWER_PASSWORD: str
    FLOWER_URL: Optional[str] = None

    # Traefik
    DOMAIN_NAME: Optional[str] = None
    ACME_EMAIL: Optional[str] = None

    # Environment
    ENVIRONMENT: str = "development"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()