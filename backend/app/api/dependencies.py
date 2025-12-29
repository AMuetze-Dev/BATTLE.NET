"""
FastAPI dependencies
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException, Header
from uuid import UUID

from app.core.database import get_db
from app.services.session_service import SessionService
from app.models.models import Session


async def get_session_by_token(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Dependency to get session by moderator token.
    
    Args:
        authorization: Bearer token from header
        db: Database session
        
    Returns:
        Session: Session object
        
    Raises:
        HTTPException: If token is invalid or session not found
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        moderator_token = UUID(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token format")
    
    session = await SessionService.get_session_by_token(db, moderator_token)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session


async def verify_moderator(
    session_id: str,
    authorization: str = Header(..., alias="Authorization"),
    db: AsyncSession = Depends(get_db)
) -> Session:
    """
    Dependency to verify moderator access and return session.
    
    Args:
        session_id: Session ID from path
        authorization: Bearer token from header
        db: Database session
        
    Returns:
        Session: Session object if access granted
        
    Raises:
        HTTPException: If access denied or session not found
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        moderator_token = UUID(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token format")
    
    has_access = await SessionService.verify_moderator_access(
        db, session_id, moderator_token
    )
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Return the session for use in the endpoint
    session = await SessionService.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session
