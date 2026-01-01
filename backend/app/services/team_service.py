"""
Team Service for Battle.Net Quiz Platform

Handles team management operations including creation, membership, and scoring.
"""
import random
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Session, Player
from app.models.team_models import Team, TeamMember
from app.core.logging import get_logger

logger = get_logger(__name__)


class TeamService:
    """
    Service for team-related operations.
    
    Provides methods for:
    - Creating and managing teams
    - Player team membership
    - Team scoring
    - Active player selection for input questions
    """
    
    @staticmethod
    async def create_teams_for_session(
        db: AsyncSession,
        session_id: str,
        team_definitions: List[dict]
    ) -> List[Team]:
        """
        Create teams for a session based on definitions.
        
        Parameters:
            db: Database session
            session_id: Session ID
            team_definitions: List of team definition dicts with id, name, color
            
        Returns:
            List of created Team objects
        """
        teams = []
        for index, definition in enumerate(team_definitions):
            team = Team(
                id=definition.get("id", f"team-{index + 1}"),
                session_id=session_id,
                name=definition.get("name", f"Team {index + 1}"),
                color=definition.get("color", "#1E88E5"),
                order_index=index,
                score=0
            )
            db.add(team)
            teams.append(team)
        
        await db.commit()
        
        for team in teams:
            await db.refresh(team)
        
        logger.info(
            f"Created {len(teams)} teams for session {session_id}",
            extra={"session_id": session_id}
        )
        
        return teams
    
    @staticmethod
    async def get_teams_for_session(
        db: AsyncSession,
        session_id: str
    ) -> List[Team]:
        """
        Get all teams for a session.
        
        Parameters:
            db: Database session
            session_id: Session ID
            
        Returns:
            List of Team objects
        """
        result = await db.execute(
            select(Team)
            .where(Team.session_id == session_id)
            .options(selectinload(Team.members))
            .order_by(Team.order_index)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_team_by_id(
        db: AsyncSession,
        team_id: str
    ) -> Optional[Team]:
        """
        Get a team by ID.
        
        Parameters:
            db: Database session
            team_id: Team ID
            
        Returns:
            Team object or None
        """
        result = await db.execute(
            select(Team)
            .where(Team.id == team_id)
            .options(selectinload(Team.members))
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def join_team(
        db: AsyncSession,
        player_id: int,
        team_id: str
    ) -> Optional[Team]:
        """
        Add a player to a team.
        
        Parameters:
            db: Database session
            player_id: Player ID
            team_id: Team ID
            
        Returns:
            Team object if successful, None if team not found
        """
        # Get the team
        team = await TeamService.get_team_by_id(db, team_id)
        if not team:
            return None
        
        # Update player's team_id
        result = await db.execute(
            select(Player).where(Player.id == player_id)
        )
        player = result.scalar_one_or_none()
        if not player:
            return None
        
        player.team_id = team_id
        
        # Create team member record
        member = TeamMember(
            team_id=team_id,
            player_id=player_id,
            is_active_player=False
        )
        db.add(member)
        
        await db.commit()
        
        logger.info(
            f"Player {player_id} joined team {team_id}",
            extra={"player_id": player_id, "team_id": team_id}
        )
        
        return team
    
    @staticmethod
    async def leave_team(
        db: AsyncSession,
        player_id: int
    ) -> bool:
        """
        Remove a player from their team.
        
        Parameters:
            db: Database session
            player_id: Player ID
            
        Returns:
            True if successful
        """
        # Update player's team_id
        result = await db.execute(
            select(Player).where(Player.id == player_id)
        )
        player = result.scalar_one_or_none()
        if not player:
            return False
        
        player.team_id = None
        
        # Remove team member record
        result = await db.execute(
            select(TeamMember).where(TeamMember.player_id == player_id)
        )
        member = result.scalar_one_or_none()
        if member:
            await db.delete(member)
        
        await db.commit()
        
        logger.info(
            f"Player {player_id} left their team",
            extra={"player_id": player_id}
        )
        
        return True
    
    @staticmethod
    async def get_player_team(
        db: AsyncSession,
        player_id: int
    ) -> Optional[Team]:
        """
        Get the team a player belongs to.
        
        Parameters:
            db: Database session
            player_id: Player ID
            
        Returns:
            Team object or None
        """
        result = await db.execute(
            select(Player).where(Player.id == player_id)
        )
        player = result.scalar_one_or_none()
        if not player or not player.team_id:
            return None
        
        return await TeamService.get_team_by_id(db, player.team_id)
    
    @staticmethod
    async def update_team_score(
        db: AsyncSession,
        team_id: str,
        points: int
    ) -> Optional[Team]:
        """
        Update a team's score.
        
        Parameters:
            db: Database session
            team_id: Team ID
            points: Points to add (can be negative)
            
        Returns:
            Updated Team object or None
        """
        team = await TeamService.get_team_by_id(db, team_id)
        if not team:
            return None
        
        team.score = max(0, team.score + points)
        await db.commit()
        await db.refresh(team)
        
        logger.info(
            f"Team {team_id} score updated by {points} to {team.score}",
            extra={"team_id": team_id, "points": points}
        )
        
        return team
    
    @staticmethod
    async def select_active_players(
        db: AsyncSession,
        session_id: str
    ) -> dict[str, int]:
        """
        Randomly select one active player per team for input questions.
        
        Parameters:
            db: Database session
            session_id: Session ID
            
        Returns:
            Dict mapping team_id -> selected player_id
        """
        teams = await TeamService.get_teams_for_session(db, session_id)
        active_players: dict[str, int] = {}
        
        for team in teams:
            # Get connected players in this team
            result = await db.execute(
                select(Player)
                .where(Player.team_id == team.id)
                .where(Player.connected == True)
            )
            connected_players = list(result.scalars().all())
            
            if connected_players:
                # Randomly select one player
                selected = random.choice(connected_players)
                active_players[team.id] = selected.id
                
                # Update team member records
                for member in team.members:
                    member.is_active_player = (member.player_id == selected.id)
        
        await db.commit()
        
        logger.info(
            f"Selected active players for session {session_id}: {active_players}",
            extra={"session_id": session_id}
        )
        
        return active_players
    
    @staticmethod
    async def get_team_leaderboard(
        db: AsyncSession,
        session_id: str
    ) -> List[dict]:
        """
        Get team leaderboard for a session.
        
        Parameters:
            db: Database session
            session_id: Session ID
            
        Returns:
            List of team leaderboard entries
        """
        teams = await TeamService.get_teams_for_session(db, session_id)
        
        # Build leaderboard entries
        entries = []
        for team in teams:
            # Count connected members
            result = await db.execute(
                select(Player)
                .where(Player.team_id == team.id)
            )
            members = list(result.scalars().all())
            connected_count = sum(1 for m in members if m.connected)
            
            entries.append({
                "team_id": team.id,
                "team_name": team.name,
                "team_color": team.color,
                "score": team.score,
                "member_count": len(members),
                "connected_count": connected_count
            })
        
        # Sort by score descending
        entries.sort(key=lambda x: x["score"], reverse=True)
        
        # Add ranks
        for i, entry in enumerate(entries):
            entry["rank"] = i + 1
        
        return entries
    
    @staticmethod
    async def delete_teams_for_session(
        db: AsyncSession,
        session_id: str
    ) -> int:
        """
        Delete all teams for a session.
        
        Parameters:
            db: Database session
            session_id: Session ID
            
        Returns:
            Number of teams deleted
        """
        teams = await TeamService.get_teams_for_session(db, session_id)
        count = len(teams)
        
        for team in teams:
            await db.delete(team)
        
        await db.commit()
        
        logger.info(
            f"Deleted {count} teams for session {session_id}",
            extra={"session_id": session_id}
        )
        
        return count
