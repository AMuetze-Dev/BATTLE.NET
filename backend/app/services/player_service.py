"""
Player service for database operations
"""
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Player, Event
from app.core.logging import get_logger

logger = get_logger(__name__)


class PlayerService:
    """Service for player-related database operations."""

    @staticmethod
    async def create_player(
        db: AsyncSession,
        session_id: str,
        name: str
    ) -> Player:
        """
        Create a new player.
        
        Args:
            db: Database session
            session_id: Session ID
            name: Player name
            
        Returns:
            Player: Created player
            
        Raises:
            ValueError: If player name already exists in session
        """
        # Check if name exists
        existing = await PlayerService.get_player_by_name(db, session_id, name)
        if existing:
            raise ValueError(f"Player name '{name}' already exists in session")
        
        player = Player(
            session_id=session_id,
            name=name.strip(),
            score=0,
            connected=True
        )
        db.add(player)
        
        # Create event
        event = Event(
            session_id=session_id,
            event_type="PLAYER_CONNECTED",
            actor=name,
            payload={"timestamp": datetime.now(timezone.utc).isoformat()}
        )
        db.add(event)
        
        await db.commit()
        await db.refresh(player)
        
        logger.info(f"Player '{name}' joined session {session_id}")
        return player

    @staticmethod
    async def get_player(
        db: AsyncSession,
        player_id: int
    ) -> Optional[Player]:
        """
        Get player by ID.
        
        Args:
            db: Database session
            player_id: Player ID
            
        Returns:
            Optional[Player]: Player or None if not found
        """
        result = await db.execute(
            select(Player).where(Player.id == player_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_player_by_name(
        db: AsyncSession,
        session_id: str,
        name: str
    ) -> Optional[Player]:
        """
        Get player by name in session.
        
        Args:
            db: Database session
            session_id: Session ID
            name: Player name
            
        Returns:
            Optional[Player]: Player or None if not found
        """
        result = await db.execute(
            select(Player).where(
                Player.session_id == session_id,
                Player.name == name.strip()
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_players_in_session(
        db: AsyncSession,
        session_id: str,
        connected_only: bool = False
    ) -> List[Player]:
        """
        Get all players in session.
        
        Args:
            db: Database session
            session_id: Session ID
            connected_only: Only return connected players
            
        Returns:
            List[Player]: List of players
        """
        query = select(Player).where(Player.session_id == session_id)
        
        if connected_only:
            query = query.where(Player.connected == True)
        
        query = query.order_by(Player.score.desc(), Player.joined_at.asc())
        
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_score(
        db: AsyncSession,
        player_id: int,
        points: int,
        reason: str = "answer"
    ) -> Optional[Player]:
        """
        Update player score.
        
        Args:
            db: Database session
            player_id: Player ID
            points: Points to add (can be negative)
            reason: Reason for score change
            
        Returns:
            Optional[Player]: Updated player or None if not found
        """
        player = await PlayerService.get_player(db, player_id)
        if not player:
            return None
        
        old_score = player.score
        player.score = max(0, player.score + points)  # Score can't go below 0
        player.last_seen = datetime.now(timezone.utc)
        
        # Create event
        event = Event(
            session_id=player.session_id,
            event_type="POINTS_AWARDED",
            actor=player.name,
            payload={
                "old_score": old_score,
                "new_score": player.score,
                "points": points,
                "reason": reason
            }
        )
        db.add(event)
        
        await db.commit()
        await db.refresh(player)
        
        logger.info(f"Updated score for '{player.name}': {old_score} -> {player.score} ({points:+d})")
        return player

    @staticmethod
    async def set_connection_status(
        db: AsyncSession,
        player_id: int,
        connected: bool
    ) -> Optional[Player]:
        """
        Set player connection status.
        
        Args:
            db: Database session
            player_id: Player ID
            connected: Connection status
            
        Returns:
            Optional[Player]: Updated player or None if not found
        """
        player = await PlayerService.get_player(db, player_id)
        if not player:
            return None
        
        player.connected = connected
        player.last_seen = datetime.now(timezone.utc)
        
        # Create event
        event = Event(
            session_id=player.session_id,
            event_type="PLAYER_DISCONNECTED" if not connected else "PLAYER_RECONNECTED",
            actor=player.name,
            payload={"timestamp": datetime.now(timezone.utc).isoformat()}
        )
        db.add(event)
        
        await db.commit()
        await db.refresh(player)
        
        status = "connected" if connected else "disconnected"
        logger.info(f"Player '{player.name}' {status}")
        return player

    @staticmethod
    async def reconnect_player(
        db: AsyncSession,
        session_id: str,
        name: str
    ) -> Optional[Player]:
        """
        Reconnect existing player and ensure only one active connection.
        
        Args:
            db: Database session
            session_id: Session ID
            name: Player name
            
        Returns:
            Optional[Player]: Reconnected player or None if not found
        """
        logger.info(f"Reconnecting player '{name}' to session {session_id}")
        
        player = await PlayerService.get_player_by_name(db, session_id, name)
        if not player:
            logger.warning(f"Player '{name}' not found in session {session_id}")
            return None
        
        logger.info(f"Found player {player.id} ('{name}'), setting as connected")
        
        # Set player as connected
        player = await PlayerService.set_connection_status(db, player.id, True)
        
        # Trigger WebSocket cleanup through socket.io event
        # This will be handled by the socketio disconnect handler
        from app.socketio_app import cleanup_old_player_connection
        await cleanup_old_player_connection(session_id, str(player.id))
        
        return player

    @staticmethod
    async def update_last_seen(
        db: AsyncSession,
        player_id: int
    ) -> Optional[Player]:
        """
        Update player's last_seen timestamp.
        
        Args:
            db: Database session
            player_id: Player ID
            
        Returns:
            Optional[Player]: Updated player or None if not found
        """
        player = await PlayerService.get_player(db, player_id)
        if not player:
            return None
        
        player.last_seen = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(player)
        
        return player

    @staticmethod
    async def get_scoreboard(
        db: AsyncSession,
        session_id: str
    ) -> List[dict]:
        """
        Get scoreboard for session.
        
        Args:
            db: Database session
            session_id: Session ID
            
        Returns:
            List[dict]: Scoreboard data sorted by score
        """
        players = await PlayerService.get_players_in_session(db, session_id)
        
        return [
            {
                "name": player.name,
                "score": player.score,
                "connected": player.connected,
                "rank": idx + 1
            }
            for idx, player in enumerate(players)
        ]
