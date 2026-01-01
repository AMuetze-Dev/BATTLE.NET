"""
Team management API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.team_service import TeamService
from app.services.session_service import SessionService
from app.socketio_app import sio
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/sessions/{session_id}/teams", tags=["teams"])


# Schemas
class TeamDefinition(BaseModel):
    """Schema for team definition."""
    id: str
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$")


class TeamCreate(BaseModel):
    """Schema for creating teams."""
    teams: List[TeamDefinition]


class TeamResponse(BaseModel):
    """Schema for team response."""
    id: str
    name: str
    color: str
    score: int
    member_count: int
    connected_count: int


class TeamJoinRequest(BaseModel):
    """Schema for joining a team."""
    player_id: int


class TeamLeaderboardEntry(BaseModel):
    """Schema for team leaderboard entry."""
    team_id: str
    team_name: str
    team_color: str
    score: int
    rank: int
    member_count: int
    connected_count: int


class ActivePlayersResponse(BaseModel):
    """Schema for active players per team."""
    active_players: dict[str, int]  # team_id -> player_id


@router.post("", response_model=List[TeamResponse], status_code=201)
async def create_teams(
    session_id: str,
    team_data: TeamCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create teams for a session.
    
    Args:
        session_id: Session ID
        team_data: Team definitions
        
    Returns:
        List of created teams
    """
    # Verify session exists
    session = await SessionService.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.game_mode != "team":
        raise HTTPException(
            status_code=400,
            detail="Session is not in team mode"
        )
    
    # Create teams
    teams = await TeamService.create_teams_for_session(
        db,
        session_id,
        [t.model_dump() for t in team_data.teams]
    )
    
    # Broadcast team update
    await sio.emit(
        "teams_updated",
        {
            "action": "created",
            "teams": [
                {
                    "id": t.id,
                    "name": t.name,
                    "color": t.color,
                    "score": t.score
                }
                for t in teams
            ]
        },
        room=f"session_{session_id}"
    )
    
    return [
        TeamResponse(
            id=t.id,
            name=t.name,
            color=t.color,
            score=t.score,
            member_count=0,
            connected_count=0
        )
        for t in teams
    ]


@router.get("", response_model=List[TeamResponse])
async def list_teams(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    List all teams in a session.
    
    Args:
        session_id: Session ID
        
    Returns:
        List of teams
    """
    teams = await TeamService.get_teams_for_session(db, session_id)
    leaderboard = await TeamService.get_team_leaderboard(db, session_id)
    
    # Map leaderboard data to teams
    leaderboard_map = {e["team_id"]: e for e in leaderboard}
    
    return [
        TeamResponse(
            id=t.id,
            name=t.name,
            color=t.color,
            score=t.score,
            member_count=leaderboard_map.get(t.id, {}).get("member_count", 0),
            connected_count=leaderboard_map.get(t.id, {}).get("connected_count", 0)
        )
        for t in teams
    ]


@router.post("/{team_id}/join", response_model=TeamResponse)
async def join_team(
    session_id: str,
    team_id: str,
    join_data: TeamJoinRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Join a player to a team.
    
    Args:
        session_id: Session ID
        team_id: Team ID
        join_data: Player ID
        
    Returns:
        Updated team
    """
    # Verify session exists and is in team mode
    session = await SessionService.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.game_mode != "team":
        raise HTTPException(
            status_code=400,
            detail="Session is not in team mode"
        )
    
    # Join team
    team = await TeamService.join_team(db, join_data.player_id, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Get updated team stats
    leaderboard = await TeamService.get_team_leaderboard(db, session_id)
    team_stats = next((e for e in leaderboard if e["team_id"] == team_id), None)
    
    # Broadcast player joined team
    await sio.emit(
        "player_joined_team",
        {
            "player_id": join_data.player_id,
            "team_id": team_id,
            "team_name": team.name,
            "team_color": team.color
        },
        room=f"session_{session_id}"
    )
    
    return TeamResponse(
        id=team.id,
        name=team.name,
        color=team.color,
        score=team.score,
        member_count=team_stats.get("member_count", 0) if team_stats else 0,
        connected_count=team_stats.get("connected_count", 0) if team_stats else 0
    )


@router.post("/{team_id}/leave")
async def leave_team(
    session_id: str,
    team_id: str,
    leave_data: TeamJoinRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a player from a team.
    
    Args:
        session_id: Session ID
        team_id: Team ID
        leave_data: Player ID
        
    Returns:
        Success message
    """
    success = await TeamService.leave_team(db, leave_data.player_id)
    if not success:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Broadcast player left team
    await sio.emit(
        "player_left_team",
        {
            "player_id": leave_data.player_id,
            "team_id": team_id
        },
        room=f"session_{session_id}"
    )
    
    return {"success": True, "message": "Player left team"}


@router.get("/leaderboard", response_model=List[TeamLeaderboardEntry])
async def get_team_leaderboard(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get team leaderboard for a session.
    
    Args:
        session_id: Session ID
        
    Returns:
        Team leaderboard entries
    """
    leaderboard = await TeamService.get_team_leaderboard(db, session_id)
    return [TeamLeaderboardEntry(**entry) for entry in leaderboard]


@router.post("/select-active-players", response_model=ActivePlayersResponse)
async def select_active_players(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Randomly select one active player per team for input questions.
    
    Args:
        session_id: Session ID
        
    Returns:
        Dict mapping team_id to selected player_id
    """
    active_players = await TeamService.select_active_players(db, session_id)
    
    # Broadcast active player selection
    await sio.emit(
        "active_players_selected",
        {"active_players": active_players},
        room=f"session_{session_id}"
    )
    
    return ActivePlayersResponse(active_players=active_players)


@router.post("/{team_id}/score")
async def update_team_score(
    session_id: str,
    team_id: str,
    points: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a team's score.
    
    Args:
        session_id: Session ID
        team_id: Team ID
        points: Points to add (can be negative)
        
    Returns:
        Updated team
    """
    team = await TeamService.update_team_score(db, team_id, points)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Broadcast score update
    await sio.emit(
        "team_score_updated",
        {
            "team_id": team_id,
            "new_score": team.score,
            "delta": points
        },
        room=f"session_{session_id}"
    )
    
    return {
        "id": team.id,
        "name": team.name,
        "score": team.score
    }
