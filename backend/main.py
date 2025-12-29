""" 
FastAPI application entrypoint with Socket.IO integration
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.routing import Mount
import socketio
import sys
import traceback

from app.core.config import settings
from app.core.logging import get_logger, setup_logging
from app.core.exceptions import (
    BaseAPIException,
    api_exception_handler,
    general_exception_handler
)

# Setup logging first
setup_logging(debug=settings.debug)

logger = get_logger(__name__)


def global_exception_hook(exc_type, exc_value, exc_traceback):
    """Catch all uncaught exceptions and log them."""
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    
    logger.critical(
        "UNCAUGHT EXCEPTION",
        exc_info=(exc_type, exc_value, exc_traceback)
    )

# Install global exception handler
sys.excepthook = global_exception_hook

# Import Socket.IO app first
from app.socketio_app import sio, socket_app

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    debug=settings.debug
)

# Register exception handlers
app.add_exception_handler(BaseAPIException, api_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Request/Response logging middleware
# This middleware should NOT process WebSocket connections
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests and responses (skip WebSocket)."""
    logger.debug(f"Incoming: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.debug(f"Response: {request.method} {request.url.path} - Status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(
            f"Request handler error: {request.method} {request.url.path}",
            exc_info=True,
            extra={'method': request.method, 'path': request.url.path}
        )
        raise

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Import routers
from app.api import sessions, players, quizzes

# Import models to register them with Base.metadata
from app.models import models  # noqa: F401

# Import database functions after models
from app.core.database import init_db, close_db

# Include routers
app.include_router(sessions.router)
app.include_router(players.router)
app.include_router(quizzes.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    logger.info("="*80)
    logger.info("STARTING QUIZ PLATFORM BACKEND")
    logger.info(f"App Name: {settings.app_name}")
    logger.info(f"Version: {settings.version}")
    logger.info(f"Debug Mode: {settings.debug}")
    logger.info(f"Database: {settings.database_url}")
    logger.info("="*80)
    
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database initialized successfully!")
    
    logger.info("="*80)
    logger.info("BACKEND READY")
    logger.info("="*80)


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown."""
    logger.info("="*80)
    logger.info("SHUTTING DOWN BACKEND")
    logger.info("="*80)
    logger.info("Closing database connections...")
    await close_db()
    logger.info("Database connections closed.")
    logger.info("Shutdown complete.")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "app": settings.app_name,
        "version": settings.version,
        "status": "ok",
        "websocket": "/socket.io/"
    }


@app.get("/health")
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.version
    }


# Wrap FastAPI with Socket.IO AFTER all routes and event handlers are registered
# Socket.IO will handle WebSocket connections at /socket.io/
# All other requests are passed through to FastAPI
app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='/socket.io/')


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
