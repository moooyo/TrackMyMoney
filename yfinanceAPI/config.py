"""Configuration management for Market Service"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # Server settings (仅本地访问，供后端代理)
    host: str = "127.0.0.1"
    port: int = 5000
    debug: bool = True

    # API settings
    cache_ttl: int = 60  # Cache time-to-live in seconds
    request_timeout: int = 30  # Request timeout in seconds

    # CORS settings (仅允许本地后端访问)
    cors_origins: list = ["http://127.0.0.1:8080", "http://localhost:8080"]

    class Config:
        env_prefix = "MARKET_"
        case_sensitive = False


settings = Settings()
