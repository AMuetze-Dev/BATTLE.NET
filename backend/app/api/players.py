"""
Player management API endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import PlayerCreate, PlayerResponse, ScoreUpdate
from app.core.database import get_db
from app.services.player_service import PlayerService
from app.services.session_service import SessionService
from app.socketio_app import sio
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/sessions/{session_id}/players", tags=["players"])


@router.post("", response_model=PlayerResponse, status_code=201)
async def create_player(
    session_id: str,
    player_data: PlayerCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new player in a session.
    
    Args:
        session_id: Session ID
        player_data: Player creation data
        
    Returns:
        PlayerResponse: Created player
        
    Raises:
        HTTPException: If session not found or player name already exists
    """
    # Verify session exists and is active
    session = await SessionService.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")
    
    # Check if player name already exists
    existing_player = await PlayerService.get_player_by_name(
        db, session_id, player_data.name
    )
    if existing_player:
        raise HTTPException(
            status_code=409,
            detail="Player name already exists in this session"
        )
    
    # Create player
    player = await PlayerService.create_player(db, session_id, player_data.name)
    
    # Broadcast player joined event via WebSocket
    await sio.emit(
        'player_list_updated',
        {
            'action': 'joined',
            'player': {
                'id': player.id,
                'name': player.name,
                'score': player.score,
                'connected': player.connected
            }
        },
        room=f"session_{session_id}"
    )
    
    return PlayerResponse.model_validate(player)


@router.get("", response_model=List[PlayerResponse])
async def list_players(
    session_id: str,
    connected_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    List all players in a session.
    
    Args:
        session_id: Session ID
        connected_only: Only return connected players
        
    Returns:
        List[PlayerResponse]: List of players
    """
    players = await PlayerService.get_players_in_session(
        db, session_id, connected_only
    )
    return [PlayerResponse.model_validate(p) for p in players]


@router.get("/{player_id}", response_model=PlayerResponse)
async def get_player(
    session_id: str,
    player_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get player details.
    
    Args:
        session_id: Session ID
        player_id: Player ID
        
    Returns:
        PlayerResponse: Player details
        
    Raises:
        HTTPException: If player not found
    """
    player = await PlayerService.get_player(db, player_id)
    
    if not player or player.session_id != session_id:
        raise HTTPException(status_code=404, detail="Player not found")
    
    return PlayerResponse.model_validate(player)


@router.post("/{player_id}/score", response_model=PlayerResponse)
async def update_player_score(
    session_id: str,
    player_id: int,
    score_update: ScoreUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update player score.
    
    Args:
        session_id: Session ID
        player_id: Player ID
        score_update: Score update data
        
    Returns:
        PlayerResponse: Updated player
        
    Raises:
        HTTPException: If player not found
    """
    # Verify player exists and belongs to session
    player = await PlayerService.get_player(db, player_id)
    if not player or player.session_id != session_id:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Update score
    updated_player = await PlayerService.update_score(
        db, player_id, score_update.points, score_update.reason
    )
    
    if not updated_player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Broadcast score update via WebSocket
    await sio.emit(
        'player_list_updated',
        {
            'action': 'score_updated',
            'player': {
                'id': updated_player.id,
                'name': updated_player.name,
                'score': updated_player.score,
                'connected': updated_player.connected
            }
        },
        room=f"session_{session_id}"
    )
    
    return PlayerResponse.model_validate(updated_player)


@router.post("/{player_id}/connection", response_model=PlayerResponse)
async def update_connection_status(
    session_id: str,
    player_id: int,
    connected: bool,
    db: AsyncSession = Depends(get_db)
):
    """
    Update player connection status.
    
    Args:
        session_id: Session ID
        player_id: Player ID
        connected: Connection status
        
    Returns:
        PlayerResponse: Updated player
        
    Raises:
        HTTPException: If player not found
    """
    # Verify player exists and belongs to session
    player = await PlayerService.get_player(db, player_id)
    if not player or player.session_id != session_id:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Update connection status
    updated_player = await PlayerService.set_connection_status(
        db, player_id, connected
    )
    
    if not updated_player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Broadcast connection status update via WebSocket
    await sio.emit(
        'player_list_updated',
        {
            'action': 'connection_changed',
            'player': {
                'id': updated_player.id,
                'name': updated_player.name,
                'score': updated_player.score,
                'connected': updated_player.connected
            }
        },
        room=f"session_{session_id}"
    )
    
    return PlayerResponse.model_validate(updated_player)


@router.get("/{player_name}/reconnect", response_model=PlayerResponse)
async def reconnect_player(
    session_id: str,
    player_name: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Reconnect an existing player.
    
    Args:
        session_id: Session ID
        player_name: Player name
        
    Returns:
        PlayerResponse: Reconnected player
        
    Raises:
        HTTPException: If player not found
    """
    player = await PlayerService.reconnect_player(db, session_id, player_name)
    
    if not player:
        raise HTTPException(
            status_code=404,
            detail="Player not found in this session"
        )
    
    return PlayerResponse.model_validate(player)
