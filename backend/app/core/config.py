"""
Configuration management for Battle.Net Backend
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Application
    debug: bool = False
    app_name: str = "Battle.Net Quiz Platform"
    version: str = "1.0.0"

    # Database
    database_url: str = "sqlite+aiosqlite:///./test.db"

    # CORS
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    # Session
    session_id_length: int = 6
    session_cleanup_days: int = 30

    # Upload
    max_upload_size_mb: int = 50

    # WebSocket
    websocket_ping_interval: int = 25
    websocket_ping_timeout: int = 60

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def max_upload_bytes(self) -> int:
        """Convert MB to bytes."""
        return self.max_upload_size_mb * 1024 * 1024


# Global settings instance
settings = Settings()
