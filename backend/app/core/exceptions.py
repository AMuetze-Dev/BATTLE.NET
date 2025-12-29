"""
Custom Exception Classes & Error Handlers
"""
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from starlette.requests import Request


class BaseAPIException(HTTPException):
    """Base exception for API errors"""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        **kwargs
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.extra = kwargs


class SessionNotFoundError(BaseAPIException):
    """Session not found exception"""
    
    def __init__(self, session_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found",
            error_code="SESSION_NOT_FOUND",
            session_id=session_id
        )


class PlayerNotFoundError(BaseAPIException):
    """Player not found exception"""
    
    def __init__(self, player_id: int, session_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player {player_id} not found in session {session_id}",
            error_code="PLAYER_NOT_FOUND",
            player_id=player_id,
            session_id=session_id
        )


class UnauthorizedError(BaseAPIException):
    """Unauthorized access exception"""
    
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="UNAUTHORIZED"
        )


class InvalidTokenError(UnauthorizedError):
    """Invalid token exception"""
    
    def __init__(self):
        super().__init__(detail="Invalid moderator token")
        self.error_code = "INVALID_TOKEN"


class SessionClosedError(BaseAPIException):
    """Session already closed exception"""
    
    def __init__(self, session_id: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session '{session_id}' is already closed",
            error_code="SESSION_CLOSED",
            session_id=session_id
        )


class InvalidQuestionCatalogError(BaseAPIException):
    """Invalid question catalog exception"""
    
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="INVALID_CATALOG"
        )


class PlayerAlreadyExistsError(BaseAPIException):
    """Player name already exists in session"""
    
    def __init__(self, name: str, session_id: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Player name '{name}' already exists in session",
            error_code="PLAYER_EXISTS",
            name=name,
            session_id=session_id
        )


class ValidationError(BaseAPIException):
    """Validation error exception"""
    
    def __init__(self, detail: str, field: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_ERROR",
            field=field
        )


class QuizNotFoundError(BaseAPIException):
    """Quiz not found exception"""
    
    def __init__(self, quiz_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz '{quiz_id}' not found",
            error_code="QUIZ_NOT_FOUND",
            quiz_id=quiz_id
        )


class QuizStorageError(BaseAPIException):
    """Quiz storage error exception"""
    
    def __init__(self, detail: str, quiz_id: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="QUIZ_STORAGE_ERROR",
            quiz_id=quiz_id
        )


async def api_exception_handler(request: Request, exc: BaseAPIException) -> JSONResponse:
    """Custom exception handler for API exceptions"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.warning(
        f"API Exception: {exc.detail}",
        extra={
            'error_code': exc.error_code,
            'status_code': exc.status_code,
            'path': request.url.path,
            'method': request.method
        }
    )
    
    content = {
        "detail": exc.detail,
        "error_code": exc.error_code,
    }
    
    # Add extra fields
    if exc.extra:
        content.update(exc.extra)
    
    return JSONResponse(
        status_code=exc.status_code,
        content=content
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """General exception handler for unhandled exceptions"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.error(
        f"Unhandled Exception: {type(exc).__name__}: {str(exc)}",
        exc_info=True,
        extra={
            'exception_type': type(exc).__name__,
            'path': request.url.path,
            'method': request.method,
            'client': request.client.host if request.client else 'unknown'
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "error_code": "INTERNAL_ERROR",
            "error_type": type(exc).__name__
        }
    )
