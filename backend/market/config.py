"""Configuration management for Market Service"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # Server settings
    host: str = "0.0.0.0"
    port: int = 5000
    debug: bool = True

    # API settings
    cache_ttl: int = 60  # Cache time-to-live in seconds
    request_timeout: int = 30  # Request timeout in seconds

    # CORS settings
    cors_origins: list = ["*"]

    class Config:
        env_prefix = "MARKET_"
        case_sensitive = False


settings = Settings()
