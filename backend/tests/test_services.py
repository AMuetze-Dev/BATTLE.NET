"""
Tests for session and player services
"""
import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.session_service import SessionService
from app.services.player_service import PlayerService
from app.models import Session, Player, Event


@pytest.mark.asyncio
class TestSessionService:
    """Test SessionService."""

    async def test_generate_session_id(self):
        """Test session ID generation."""
        session_id = SessionService.generate_session_id()
        
        assert len(session_id) == 6
        assert session_id.isalnum()
        assert session_id.isupper()

    async def test_create_session(self, test_db: AsyncSession):
        """Test session creation."""
        session = await SessionService.create_session(test_db)
        
        assert session.id is not None
        assert len(session.id) == 6
        assert session.status == "active"
        assert session.moderator_token is not None
        assert session.ended_at is None

    async def test_get_session(self, test_db: AsyncSession):
        """Test getting session by ID."""
        created_session = await SessionService.create_session(test_db)
        
        fetched_session = await SessionService.get_session(test_db, created_session.id)
        
        assert fetched_session is not None
        assert fetched_session.id == created_session.id

    async def test_get_nonexistent_session(self, test_db: AsyncSession):
        """Test getting nonexistent session."""
        session = await SessionService.get_session(test_db, "FAKE00")
        
        assert session is None

    async def test_get_session_by_token(self, test_db: AsyncSession):
        """Test getting session by moderator token."""
        created_session = await SessionService.create_session(test_db)
        
        fetched_session = await SessionService.get_session_by_token(
            test_db,
            created_session.moderator_token  # type: ignore
        )
        
        assert fetched_session is not None
        assert fetched_session.id == created_session.id

    async def test_verify_moderator_access_valid(self, test_db: AsyncSession):
        """Test verifying valid moderator access."""
        session = await SessionService.create_session(test_db)
        
        has_access = await SessionService.verify_moderator_access(
            test_db,
            session.id,
            session.moderator_token  # type: ignore
        )
        
        assert has_access is True

    async def test_verify_moderator_access_invalid(self, test_db: AsyncSession):
        """Test verifying invalid moderator access."""
        from uuid import uuid4
        
        session = await SessionService.create_session(test_db)
        
        has_access = await SessionService.verify_moderator_access(
            test_db,
            session.id,
            uuid4()  # Wrong token
        )
        
        assert has_access is False

    async def test_end_session(self, test_db: AsyncSession):
        """Test ending a session."""
        session = await SessionService.create_session(test_db)
        
        # Add players
        player1 = await PlayerService.create_player(test_db, session.id, "Player1")
        player2 = await PlayerService.create_player(test_db, session.id, "Player2")
        
        # End session
        ended_session = await SessionService.end_session(test_db, session.id)
        
        assert ended_session is not None
        assert ended_session.status == "completed"
        assert ended_session.ended_at is not None
        
        # Check players are disconnected
        updated_players = await PlayerService.get_players_in_session(test_db, session.id)
        for player in updated_players:
            assert player.connected is False

    async def test_end_nonexistent_session(self, test_db: AsyncSession):
        """Test ending nonexistent session."""
        result = await SessionService.end_session(test_db, "FAKE00")
        
        assert result is None

    async def test_update_question_catalog(self, test_db: AsyncSession):
        """Test updating question catalog."""
        session = await SessionService.create_session(test_db)
        
        catalog = {"questions": [{"id": "q1", "prompt": "Test?"}]}
        
        updated_session = await SessionService.update_question_catalog(
            test_db,
            session.id,
            catalog
        )
        
        assert updated_session is not None
        assert updated_session.question_catalog == catalog

    async def test_set_current_question(self, test_db: AsyncSession):
        """Test setting current question."""
        session = await SessionService.create_session(test_db)
        
        updated_session = await SessionService.set_current_question(
            test_db,
            session.id,
            "q1"
        )
        
        assert updated_session is not None
        assert updated_session.current_question_id == "q1"

    async def test_cleanup_old_sessions(self, test_db: AsyncSession):
        """Test cleaning up old sessions."""
        # Create old completed session
        old_session = Session(
            id="OLD123",
            status="completed",
            ended_at=datetime.now(timezone.utc) - timedelta(days=35)
        )
        test_db.add(old_session)
        
        # Create recent completed session
        recent_session = Session(
            id="NEW123",
            status="completed",
            ended_at=datetime.now(timezone.utc) - timedelta(days=5)
        )
        test_db.add(recent_session)
        
        await test_db.commit()
        
        # Cleanup (default 30 days)
        deleted_count = await SessionService.cleanup_old_sessions(test_db)
        
        assert deleted_count == 1
        
        # Verify old session is gone
        old = await SessionService.get_session(test_db, "OLD123")
        assert old is None
        
        # Verify recent session still exists
        recent = await SessionService.get_session(test_db, "NEW123")
        assert recent is not None

    async def test_get_active_sessions(self, test_db: AsyncSession):
        """Test getting active sessions."""
        session1 = await SessionService.create_session(test_db)
        session2 = await SessionService.create_session(test_db)
        
        # End one session
        await SessionService.end_session(test_db, session2.id)
        
        active_sessions = await SessionService.get_active_sessions(test_db)
        
        assert len(active_sessions) == 1
        assert active_sessions[0].id == session1.id


@pytest.mark.asyncio
class TestPlayerService:
    """Test PlayerService."""

    async def test_create_player(self, test_db: AsyncSession):
        """Test creating a player."""
        session = await SessionService.create_session(test_db)
        
        player = await PlayerService.create_player(test_db, session.id, "Alice")
        
        assert player.name == "Alice"
        assert player.score == 0
        assert player.connected is True

    async def test_create_duplicate_player(self, test_db: AsyncSession):
        """Test creating player with duplicate name."""
        session = await SessionService.create_session(test_db)
        
        await PlayerService.create_player(test_db, session.id, "Bob")
        
        with pytest.raises(ValueError, match="already exists"):
            await PlayerService.create_player(test_db, session.id, "Bob")

    async def test_get_player_by_name(self, test_db: AsyncSession):
        """Test getting player by name."""
        session = await SessionService.create_session(test_db)
        created_player = await PlayerService.create_player(test_db, session.id, "Charlie")
        
        fetched_player = await PlayerService.get_player_by_name(
            test_db,
            session.id,
            "Charlie"
        )
        
        assert fetched_player is not None
        assert fetched_player.id == created_player.id

    async def test_get_players_in_session(self, test_db: AsyncSession):
        """Test getting all players in session."""
        session = await SessionService.create_session(test_db)
        
        player1 = await PlayerService.create_player(test_db, session.id, "David")
        player2 = await PlayerService.create_player(test_db, session.id, "Eve")
        
        players = await PlayerService.get_players_in_session(test_db, session.id)
        
        assert len(players) == 2
        assert {p.name for p in players} == {"David", "Eve"}

    async def test_get_connected_players_only(self, test_db: AsyncSession):
        """Test getting only connected players."""
        session = await SessionService.create_session(test_db)
        
        player1 = await PlayerService.create_player(test_db, session.id, "Frank")
        player2 = await PlayerService.create_player(test_db, session.id, "Grace")
        
        # Disconnect one player
        await PlayerService.set_connection_status(test_db, player2.id, False)
        
        connected_players = await PlayerService.get_players_in_session(
            test_db,
            session.id,
            connected_only=True
        )
        
        assert len(connected_players) == 1
        assert connected_players[0].name == "Frank"

    async def test_update_score(self, test_db: AsyncSession):
        """Test updating player score."""
        session = await SessionService.create_session(test_db)
        player = await PlayerService.create_player(test_db, session.id, "Henry")
        
        # Add points
        updated_player = await PlayerService.update_score(test_db, player.id, 5)
        
        assert updated_player is not None
        assert updated_player.score == 5
        
        # Add more points
        updated_player = await PlayerService.update_score(test_db, player.id, 3)
        
        assert updated_player is not None
        assert updated_player.score == 8

    async def test_update_score_negative(self, test_db: AsyncSession):
        """Test updating score with negative points."""
        session = await SessionService.create_session(test_db)
        player = await PlayerService.create_player(test_db, session.id, "Iris")
        
        # Add points
        await PlayerService.update_score(test_db, player.id, 10)
        
        # Subtract points
        updated_player = await PlayerService.update_score(test_db, player.id, -3)
        
        assert updated_player is not None
        assert updated_player.score == 7

    async def test_update_score_below_zero(self, test_db: AsyncSession):
        """Test score cannot go below zero."""
        session = await SessionService.create_session(test_db)
        player = await PlayerService.create_player(test_db, session.id, "Jack")
        
        # Try to subtract more than current score
        updated_player = await PlayerService.update_score(test_db, player.id, -10)
        
        assert updated_player is not None
        assert updated_player.score == 0

    async def test_set_connection_status(self, test_db: AsyncSession):
        """Test setting connection status."""
        session = await SessionService.create_session(test_db)
        player = await PlayerService.create_player(test_db, session.id, "Kate")
        
        # Disconnect
        updated_player = await PlayerService.set_connection_status(test_db, player.id, False)
        
        assert updated_player is not None
        assert updated_player.connected is False
        
        # Reconnect
        updated_player = await PlayerService.set_connection_status(test_db, player.id, True)
        
        assert updated_player is not None
        assert updated_player.connected is True

    async def test_reconnect_player(self, test_db: AsyncSession):
        """Test reconnecting player."""
        session = await SessionService.create_session(test_db)
        player = await PlayerService.create_player(test_db, session.id, "Leo")
        
        # Disconnect
        await PlayerService.set_connection_status(test_db, player.id, False)
        
        # Reconnect
        reconnected_player = await PlayerService.reconnect_player(
            test_db,
            session.id,
            "Leo"
        )
        
        assert reconnected_player is not None
        assert reconnected_player.connected is True

    async def test_reconnect_nonexistent_player(self, test_db: AsyncSession):
        """Test reconnecting nonexistent player."""
        session = await SessionService.create_session(test_db)
        
        result = await PlayerService.reconnect_player(test_db, session.id, "Nobody")
        
        assert result is None

    async def test_get_scoreboard(self, test_db: AsyncSession):
        """Test getting scoreboard."""
        session = await SessionService.create_session(test_db)
        
        player1 = await PlayerService.create_player(test_db, session.id, "Mike")
        player2 = await PlayerService.create_player(test_db, session.id, "Nina")
        player3 = await PlayerService.create_player(test_db, session.id, "Oscar")
        
        # Set scores
        await PlayerService.update_score(test_db, player1.id, 10)
        await PlayerService.update_score(test_db, player2.id, 20)
        await PlayerService.update_score(test_db, player3.id, 15)
        
        scoreboard = await PlayerService.get_scoreboard(test_db, session.id)
        
        assert len(scoreboard) == 3
        # Should be sorted by score descending
        assert scoreboard[0]["name"] == "Nina"
        assert scoreboard[0]["score"] == 20
        assert scoreboard[0]["rank"] == 1
        
        assert scoreboard[1]["name"] == "Oscar"
        assert scoreboard[1]["score"] == 15
        assert scoreboard[1]["rank"] == 2
        
        assert scoreboard[2]["name"] == "Mike"
        assert scoreboard[2]["score"] == 10
        assert scoreboard[2]["rank"] == 3
