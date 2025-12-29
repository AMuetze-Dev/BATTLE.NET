"""
Backend Application Configuration & Utilities
"""
import logging
import sys
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application Settings"""
    
    # Application
    app_name: str = "Battle.Net Quiz Platform"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database
    database_url: str = "sqlite:///./quiz_platform.db"
    db_echo: bool = False
    
    # Security
    cors_origins: list[str] = ["http://localhost:3000"]
    moderator_token_length: int = 32
    session_id_length: int = 6
    
    # WebSocket
    ws_ping_interval: int = 25
    ws_ping_timeout: int = 60
    
    # File Upload
    max_upload_size: int = 50 * 1024 * 1024  # 50 MB
    allowed_upload_extensions: list[str] = [".zip"]
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore"
    }


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


def setup_logging(settings: Optional[Settings] = None) -> None:
    """Configure application logging"""
    if settings is None:
        settings = get_settings()
    
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format=settings.log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Set specific loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.db_echo else logging.WARNING
    )
    
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured with level: {settings.log_level}")


# Initialize logger for this module
logger = logging.getLogger(__name__)
