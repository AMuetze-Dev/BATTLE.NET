"""
Logging configuration for Battle.Net Backend
"""
import logging
import sys
import os
import re
from pathlib import Path
from typing import Any
from datetime import datetime
from logging.handlers import RotatingFileHandler

# Log directory
LOG_DIR = Path(os.getenv("LOG_DIR", "logs"))


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for different log levels."""
    
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors."""
        log_color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{log_color}{record.levelname}{self.RESET}"
        return super().format(record)


class PlainFormatter(logging.Formatter):
    """Formatter that strips ANSI color codes for file output."""
    
    ANSI_ESCAPE = re.compile(r'\x1b\[[0-9;]*m|\[\d+m')
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record and strip ANSI codes."""
        message = super().format(record)
        # Remove ANSI color codes
        return self.ANSI_ESCAPE.sub('', message)


def setup_logging(debug: bool = False) -> None:
    """
    Setup application logging with console and file handlers.
    
    Args:
        debug: Enable debug logging
    """
    level = logging.DEBUG if debug else logging.INFO
    
    # Ensure log directory exists
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    
    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_formatter = ColoredFormatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    console_handler.setFormatter(console_formatter)
    
    # File handler for all logs (rotating, max 10MB, keep 5 backups)
    # Use PlainFormatter to strip ANSI codes
    file_handler = RotatingFileHandler(
        LOG_DIR / "app.log",
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setLevel(logging.DEBUG)  # Log everything to file
    file_formatter = PlainFormatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler.setFormatter(file_formatter)
    
    # Error file handler (only errors and above) with detailed information
    error_file_handler = RotatingFileHandler(
        LOG_DIR / "error.log",
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8"
    )
    error_file_handler.setLevel(logging.ERROR)
    error_formatter = PlainFormatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s\nFile: %(pathname)s:%(lineno)d\nFunction: %(funcName)s\nMessage: %(message)s\n" + "="*80 + "\n",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    error_file_handler.setFormatter(error_formatter)
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)  # Capture everything at root level
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_file_handler)
    
    # Log startup message
    root_logger.info(f"Logging initialized. Log files in: {LOG_DIR.absolute()}")
    
    # Configure third-party loggers to reduce noise but keep errors
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    
    # SQLAlchemy - reduce noise from color codes
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
    
    # Socket.IO
    logging.getLogger("socketio").setLevel(logging.INFO)
    logging.getLogger("engineio").setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    """
    Get logger instance for module.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        logging.Logger: Logger instance
    """
    return logging.getLogger(name)
