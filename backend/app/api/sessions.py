"""
Session management API endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.socketio_app import sio
from app.api.dependencies import get_session_by_token, verify_moderator
from app.models.models import Session
from app.api.schemas import (
    SessionCreate,
    SessionResponse,
    SessionUpdate,
    LeaderboardResponse,
    LeaderboardEntry
)
from app.core.database import get_db
from app.services.session_service import SessionService
from app.services.player_service import PlayerService
from app.services.zip_validator import ZIPValidator
from app.services.quiz_storage_service import quiz_storage
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/sessions", tags=["sessions"])


class AttachQuizRequest(BaseModel):
    """Request body for attaching a quiz to a session."""
    quiz_id: str


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new quiz session.
    
    Returns:
        SessionResponse: Created session with moderator token
    """
    session = await SessionService.create_session(db)
    return SessionResponse.model_validate(session)


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get session details by ID.
    
    Args:
        session_id: Session ID
        
    Returns:
        SessionResponse: Session details
        
    Raises:
        HTTPException: If session not found
    """
    session = await SessionService.get_session(db, session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionResponse.model_validate(session)


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    session_update: SessionUpdate,
    db: AsyncSession = Depends(get_db),
    _: Session = Depends(verify_moderator)
):
    """
    Update session details (moderator only).
    
    Args:
        session_id: Session ID
        session_update: Update data
        
    Returns:
        SessionResponse: Updated session
        
    Raises:
        HTTPException: If session not found
    """
    session = await SessionService.get_session(db, session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update fields
    if session_update.question_catalog is not None:
        await SessionService.update_question_catalog(
            db, session_id, session_update.question_catalog
        )
    
    if session_update.current_question_id is not None:
        await SessionService.set_current_question(
            db, session_id, session_update.current_question_id
        )
    
    # Refresh session
    session = await SessionService.get_session(db, session_id)
    return SessionResponse.model_validate(session)


@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _: Session = Depends(verify_moderator)
):
    """
    End a quiz session (moderator only).
    Kicks all players from the session.
    
    Args:
        session_id: Session ID
        
    Returns:
        SessionResponse: Ended session
        
    Raises:
        HTTPException: If session not found or already ended
    """
    session = await SessionService.end_session(db, session_id)
    
    if not session:
        raise HTTPException(
            status_code=400,
            detail="Session not found or already ended"
        )
    
    # Kick all players from the session via WebSocket
    await sio.emit(
        'session_ended',
        {'session_id': session_id, 'message': 'Session has been closed by the moderator'},
        room=f"session_{session_id}"
    )
    
    # Disconnect all players in this session
    from app.socketio_app import active_connections
    if session_id in active_connections:
        # Get all player SIDs for this session
        player_sids = list(active_connections[session_id].values())
        for sid in player_sids:
            try:
                await sio.disconnect(sid)
            except Exception as e:
                logger.error(f"Error disconnecting player {sid}: {e}")
        # Clear the session connections
        active_connections[session_id].clear()
    
    return SessionResponse.model_validate(session)


@router.post("/{session_id}/attach-quiz", response_model=SessionResponse)
async def attach_quiz_to_session(
    session_id: str,
    request: AttachQuizRequest,
    db: AsyncSession = Depends(get_db),
    _: Session = Depends(verify_moderator)
):
    """
    Attach a quiz from storage to a session (moderator only).
    
    Args:
        session_id: Session ID
        request: Request with quiz_id
        
    Returns:
        SessionResponse: Updated session with quiz attached
        
    Raises:
        HTTPException: If session or quiz not found
    """
    # Verify session exists
    session = await SessionService.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Load quiz from storage (sync method, no await)
    quiz = quiz_storage.get_quiz(request.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Attach quiz to session
    await SessionService.update_question_catalog(db, session_id, quiz)
    
    # Return updated session
    session = await SessionService.get_session(db, session_id)
    return SessionResponse.model_validate(session)


@router.post("/{session_id}/upload-questions")
async def upload_questions(
    session_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: Session = Depends(verify_moderator)
):
    """
    Upload question catalog ZIP file (moderator only).
    
    Args:
        session_id: Session ID
        file: ZIP file containing questions.xml and media files
        
    Returns:
        dict: Upload result with validation status
        
    Raises:
        HTTPException: If validation fails
    """
    # Save uploaded file temporarily
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name
    
    info = None  # Initialize info before try block
    
    try:
        # Validate and extract ZIP
        validator = ZIPValidator()
        is_valid, info, errors = validator.validate_and_extract(tmp_file_path)
        
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail={"message": "Validation failed", "errors": errors}
            )
        
        # Parse question catalog from XML
        # TODO: Parse XML and convert to JSON format
        # For now, return success
        
        return {
            "message": "Questions uploaded successfully",
            "xml_path": info.get("xml_path") if info else None,
            "media_dir": info.get("media_dir") if info else None
        }
        
    finally:
        # Cleanup temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)
        
        # Cleanup extraction directory if it was temporary
        if info and info.get("cleanup") and info.get("temp_dir"):
            import shutil
            shutil.rmtree(info["temp_dir"], ignore_errors=True)


@router.get("/{session_id}/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get session leaderboard.
    
    Args:
        session_id: Session ID
        
    Returns:
        LeaderboardResponse: Leaderboard with player rankings
        
    Raises:
        HTTPException: If session not found
    """
    # Verify session exists
    session = await SessionService.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get all players ordered by score
    players = await PlayerService.get_players_in_session(db, session_id)
    
    # Build leaderboard
    entries = []
    for rank, player in enumerate(players, start=1):
        entries.append(LeaderboardEntry(
            player_id=player.id,
            player_name=player.name,
            score=player.score,
            rank=rank
        ))
    
    return LeaderboardResponse(
        session_id=session_id,
        entries=entries,
        total_players=len(entries)
    )


@router.get("", response_model=List[SessionResponse])
async def list_active_sessions(
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    List all active sessions.
    
    Args:
        limit: Maximum number of sessions to return
        
    Returns:
        List[SessionResponse]: List of active sessions
    """
    sessions = await SessionService.get_active_sessions(db, limit)
    return [SessionResponse.model_validate(s) for s in sessions]
