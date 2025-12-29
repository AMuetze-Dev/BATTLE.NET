"""
Middleware for Request Logging & Performance Monitoring
"""
import time
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests with timing"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Start timer
        start_time = time.time()
        
        # Log request
        logger.info(
            f"→ {request.method} {request.url.path} "
            f"[{request.client.host if request.client else 'unknown'}]"
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            logger.info(
                f"← {request.method} {request.url.path} "
                f"→ {response.status_code} ({duration:.3f}s)"
            )
            
            # Add timing header
            response.headers["X-Process-Time"] = str(duration)
            
            return response
            
        except Exception as exc:
            duration = time.time() - start_time
            
            logger.error(
                f"✗ {request.method} {request.url.path} "
                f"→ ERROR ({duration:.3f}s): {exc}"
            )
            
            raise


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response
