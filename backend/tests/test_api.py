"""
Tests for API endpoints
"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.services.session_service import SessionService
from app.services.player_service import PlayerService


@pytest.fixture
async def client(test_db: AsyncSession):
    """Create test client."""
    # Override get_db dependency
    from app.core.database import get_db
    from app.main import app as main_app
    
    async def override_get_db():
        yield test_db
    
    main_app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=main_app),
        base_url="http://test"
    ) as ac:
        yield ac
    
    main_app.dependency_overrides.clear()


class TestSessionEndpoints:
    """Test session API endpoints."""
    
    async def test_create_session(self, client: AsyncClient):
        """Test creating a new session."""
        response = await client.post("/sessions")
        
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "moderator_token" in data
        assert data["status"] == "active"
        assert len(data["id"]) == 6
    
    async def test_get_session(self, client: AsyncClient, test_db: AsyncSession):
        """Test getting session by ID."""
        # Create session
        session = await SessionService.create_session(test_db)
        
        # Get session
        response = await client.get(f"/sessions/{session.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session.id
        assert data["status"] == "active"
    
    async def test_get_nonexistent_session(self, client: AsyncClient):
        """Test getting non-existent session."""
        response = await client.get("/sessions/NOEXIST")
        
        assert response.status_code == 404
    
    async def test_list_active_sessions(self, client: AsyncClient, test_db: AsyncSession):
        """Test listing active sessions."""
        # Create some sessions
        session1 = await SessionService.create_session(test_db)
        session2 = await SessionService.create_session(test_db)
        
        response = await client.get("/sessions")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2
        
        ids = [s["id"] for s in data]
        assert session1.id in ids
        assert session2.id in ids
    
    async def test_end_session_unauthorized(self, client: AsyncClient, test_db: AsyncSession):
        """Test ending session without authorization."""
        session = await SessionService.create_session(test_db)
        
        response = await client.post(f"/sessions/{session.id}/end")
        
        # 422 because missing required header is a validation error
        assert response.status_code == 422
    
    async def test_end_session_authorized(self, client: AsyncClient, test_db: AsyncSession):
        """Test ending session with valid token."""
        session = await SessionService.create_session(test_db)
        
        response = await client.post(
            f"/sessions/{session.id}/end",
            headers={"Authorization": f"Bearer {session.moderator_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["ended_at"] is not None
    
    async def test_update_session_unauthorized(self, client: AsyncClient, test_db: AsyncSession):
        """Test updating session without authorization."""
        session = await SessionService.create_session(test_db)
        
        response = await client.put(
            f"/sessions/{session.id}",
            json={"current_question_id": "q1"}
        )
        
        # 422 because missing required header is a validation error
        assert response.status_code == 422
    
    async def test_get_leaderboard(self, client: AsyncClient, test_db: AsyncSession):
        """Test getting session leaderboard."""
        # Create session
        session = await SessionService.create_session(test_db)
        
        # Create players with scores
        player1 = await PlayerService.create_player(test_db, session.id, "Alice")
        player2 = await PlayerService.create_player(test_db, session.id, "Bob")
        await PlayerService.update_score(test_db, player1.id, 100)
        await PlayerService.update_score(test_db, player2.id, 50)
        
        response = await client.get(f"/sessions/{session.id}/leaderboard")
        
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == session.id
        assert data["total_players"] == 2
        assert len(data["entries"]) == 2
        
        # Check order (highest score first)
        assert data["entries"][0]["player_name"] == "Alice"
        assert data["entries"][0]["score"] == 100
        assert data["entries"][0]["rank"] == 1
        assert data["entries"][1]["player_name"] == "Bob"
        assert data["entries"][1]["score"] == 50
        assert data["entries"][1]["rank"] == 2


class TestPlayerEndpoints:
    """Test player API endpoints."""
    
    async def test_create_player(self, client: AsyncClient, test_db: AsyncSession):
        """Test creating a new player."""
        session = await SessionService.create_session(test_db)
        
        response = await client.post(
            f"/sessions/{session.id}/players",
            json={"name": "TestPlayer"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "TestPlayer"
        assert data["session_id"] == session.id
        assert data["score"] == 0
        assert data["connected"] is True
    
    async def test_create_player_duplicate_name(self, client: AsyncClient, test_db: AsyncSession):
        """Test creating player with duplicate name."""
        session = await SessionService.create_session(test_db)
        
        # Create first player
        await client.post(
            f"/sessions/{session.id}/players",
            json={"name": "Duplicate"}
        )
        
        # Try to create duplicate
        response = await client.post(
            f"/sessions/{session.id}/players",
            json={"name": "Duplicate"}
        )
        
        assert response.status_code == 409
    
    async def test_create_player_invalid_session(self, client: AsyncClient):
        """Test creating player in non-existent session."""
        response = await client.post(
            "/sessions/NOEXIST/players",
            json={"name": "TestPlayer"}
        )
        
        assert response.status_code == 404
    
    async def test_list_players(self, client: AsyncClient, test_db: AsyncSession):
        """Test listing all players in session."""
        session = await SessionService.create_session(test_db)
        
        # Create players
        await PlayerService.create_player(test_db, session.id, "Player1")
        await PlayerService.create_player(test_db, session.id, "Player2")
        
        response = await client.get(f"/sessions/{session.id}/players")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] in ["Player1", "Player2"]
    
    async def test_list_connected_players_only(self, client: AsyncClient, test_db: AsyncSession):
        """Test listing only connected players."""
        session = await SessionService.create_session(test_db)
        
        # Create players
        player1 = await PlayerService.create_player(test_db, session.id, "Connected")
        player2 = await PlayerService.create_player(test_db, session.id, "Disconnected")
        
        # Disconnect one player
        await PlayerService.set_connection_status(test_db, player2.id, False)
        
        response = await client.get(
            f"/sessions/{session.id}/players",
            params={"connected_only": True}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Connected"
    
    async def test_get_player(self, client: AsyncClient, test_db: AsyncSession):
        """Test getting player by ID."""
        session = await SessionService.create_session(test_db)
        player = await PlayerService.create_player(test_db, session.id, "TestPlayer")
        
        response = await client.get(f"/sessions/{session.id}/players/{player.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == player.id
        assert data["name"] == "TestPlayer"
    
    async def test_get_player_wrong_session(self, client: AsyncClient, test_db: AsyncSession):
        """Test getting player with wrong session ID."""
        session1 = await SessionService.create_session(test_db)
        session2 = await SessionService.create_session(test_db)
        player = await PlayerService.create_player(test_db, session1.id, "TestPlayer")
        
        response = await client.get(f"/sessions/{session2.id}/players/{player.id}")
        
        assert response.status_code == 404
    
    async def test_update_player_score(self, client: AsyncClient, test_db: AsyncSession):
        """Test updating player score."""
        session = await SessionService.create_session(test_db)
        player = await PlayerService.create_player(test_db, session.id, "TestPlayer")
        
        response = await client.post(
            f"/sessions/{session.id}/players/{player.id}/score",
            json={"points": 50, "reason": "correct_answer"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 50
    
    async def test_update_connection_status(self, client: AsyncClient, test_db: AsyncSession):
        """Test updating player connection status."""
        session = await SessionService.create_session(test_db)
        player = await PlayerService.create_player(test_db, session.id, "TestPlayer")
        
        # Disconnect
        response = await client.post(
            f"/sessions/{session.id}/players/{player.id}/connection",
            params={"connected": False}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["connected"] is False
    
    async def test_reconnect_player(self, client: AsyncClient, test_db: AsyncSession):
        """Test reconnecting an existing player."""
        session = await SessionService.create_session(test_db)
        player = await PlayerService.create_player(test_db, session.id, "TestPlayer")
        
        # Disconnect
        await PlayerService.set_connection_status(test_db, player.id, False)
        
        # Reconnect
        response = await client.get(
            f"/sessions/{session.id}/players/{player.name}/reconnect"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == player.id
        assert data["connected"] is True
    
    async def test_reconnect_nonexistent_player(self, client: AsyncClient, test_db: AsyncSession):
        """Test reconnecting non-existent player."""
        session = await SessionService.create_session(test_db)
        
        response = await client.get(
            f"/sessions/{session.id}/players/NonExistent/reconnect"
        )
        
        assert response.status_code == 404


class TestHealthEndpoints:
    """Test health check endpoints."""
    
    async def test_root_endpoint(self, client: AsyncClient):
        """Test root endpoint."""
        response = await client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "app" in data
        assert "version" in data
        assert data["status"] == "ok"
    
    async def test_health_check(self, client: AsyncClient):
        """Test health check endpoint."""
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "app" in data
        assert "version" in data
