"""
Session service for database operations
"""
import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Union
from uuid import UUID
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Session as SessionModel, Player, Event
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class SessionService:
    """Service for session-related database operations."""

    @staticmethod
    def generate_session_id() -> str:
        """
        Generate unique 6-character session ID.
        
        Returns:
            str: Session ID (e.g., 'ABC123')
        """
        chars = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(chars) for _ in range(settings.session_id_length))

    @staticmethod
    async def create_session(db: AsyncSession) -> SessionModel:
        """
        Create a new session.
        
        Args:
            db: Database session
            
        Returns:
            SessionModel: Created session
            
        Raises:
            ValueError: If session ID generation fails after retries
        """
        max_retries = 10
        for attempt in range(max_retries):
            session_id = SessionService.generate_session_id()
            
            # Check if ID already exists
            result = await db.execute(
                select(SessionModel).where(SessionModel.id == session_id)
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                session = SessionModel(
                    id=session_id,
                    status="active"
                )
                db.add(session)
                
                # Create event
                event = Event(
                    session_id=session_id,
                    event_type="SESSION_CREATED",
                    actor="system"
                )
                db.add(event)
                
                await db.commit()
                await db.refresh(session)
                
                logger.info(f"Created session: {session_id}")
                return session
        
        raise ValueError("Failed to generate unique session ID")

    @staticmethod
    async def get_session(
        db: AsyncSession,
        session_id: str
    ) -> Optional[SessionModel]:
        """
        Get session by ID.
        
        Args:
            db: Database session
            session_id: Session ID
            
        Returns:
            Optional[SessionModel]: Session or None if not found
        """
        result = await db.execute(
            select(SessionModel).where(SessionModel.id == session_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_session_by_token(
        db: AsyncSession,
        moderator_token: Union[str, UUID]
    ) -> Optional[SessionModel]:
        """
        Get session by moderator token.
        
        Args:
            db: Database session
            moderator_token: Moderator token
            
        Returns:
            Optional[SessionModel]: Session or None if not found
        """
        result = await db.execute(
            select(SessionModel).where(SessionModel.moderator_token == moderator_token)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def verify_moderator_access(
        db: AsyncSession,
        session_id: str,
        moderator_token: Union[str, UUID]
    ) -> bool:
        """
        Verify moderator has access to session.
        
        Args:
            db: Database session
            session_id: Session ID
            moderator_token: Moderator token
            
        Returns:
            bool: True if access granted
        """
        result = await db.execute(
            select(SessionModel).where(
                SessionModel.id == session_id,
                SessionModel.moderator_token == moderator_token
            )
        )
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def end_session(
        db: AsyncSession,
        session_id: str
    ) -> Optional[SessionModel]:
        """
        End a session.
        
        Args:
            db: Database session
            session_id: Session ID
            
        Returns:
            Optional[SessionModel]: Updated session or None if not found
        """
        session = await SessionService.get_session(db, session_id)
        if not session or session.status != "active":
            return None
        
        session.status = "completed"
        session.ended_at = datetime.now(timezone.utc)
        
        # Disconnect all players
        await db.execute(
            update(Player)
            .where(Player.session_id == session_id)
            .values(connected=False)
        )
        
        # Create event
        event = Event(
            session_id=session_id,
            event_type="SESSION_ENDED",
            actor="moderator"
        )
        db.add(event)
        
        await db.commit()
        await db.refresh(session)
        
        logger.info(f"Ended session: {session_id}")
        return session

    @staticmethod
    async def update_question_catalog(
        db: AsyncSession,
        session_id: str,
        catalog: dict
    ) -> Optional[SessionModel]:
        """
        Update session's question catalog.
        
        Args:
            db: Database session
            session_id: Session ID
            catalog: Question catalog as JSON
            
        Returns:
            Optional[SessionModel]: Updated session or None if not found
        """
        session = await SessionService.get_session(db, session_id)
        if not session:
            return None
        
        session.question_catalog = catalog
        await db.commit()
        await db.refresh(session)
        
        logger.info(f"Updated catalog for session: {session_id}")
        return session

    @staticmethod
    async def set_current_question(
        db: AsyncSession,
        session_id: str,
        question_id: Optional[str]
    ) -> Optional[SessionModel]:
        """
        Set current question for session.
        
        Args:
            db: Database session
            session_id: Session ID
            question_id: Question ID or None
            
        Returns:
            Optional[SessionModel]: Updated session or None if not found
        """
        session = await SessionService.get_session(db, session_id)
        if not session:
            return None
        
        session.current_question_id = question_id
        await db.commit()
        await db.refresh(session)
        
        return session

    @staticmethod
    async def cleanup_old_sessions(
        db: AsyncSession,
        days: Optional[int] = None
    ) -> int:
        """
        Delete old completed sessions.
        
        Args:
            db: Database session
            days: Days to keep (default from settings)
            
        Returns:
            int: Number of deleted sessions
        """
        if days is None:
            days = settings.session_cleanup_days
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        result = await db.execute(
            select(SessionModel).where(
                SessionModel.status == "completed",
                SessionModel.ended_at < cutoff_date
            )
        )
        sessions_to_delete = result.scalars().all()
        
        count = len(sessions_to_delete)
        
        for session in sessions_to_delete:
            await db.delete(session)
        
        await db.commit()
        
        logger.info(f"Cleaned up {count} old sessions")
        return count

    @staticmethod
    async def get_active_sessions(
        db: AsyncSession,
        limit: int = 100
    ) -> List[SessionModel]:
        """
        Get all active sessions.
        
        Args:
            db: Database session
            limit: Maximum number of sessions
            
        Returns:
            List[SessionModel]: List of active sessions
        """
        result = await db.execute(
            select(SessionModel)
            .where(SessionModel.status == "active")
            .order_by(SessionModel.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
