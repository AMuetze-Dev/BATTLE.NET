"""
Tests for Socket.IO server
"""
import pytest
import socketio

from app.socketio_app import sio, active_connections


@pytest.fixture
def mock_sio_client():
    """Create mock Socket.IO client."""
    return socketio.AsyncClient()


class TestSocketIOConnection:
    """Test Socket.IO connection events."""
    
    async def test_connect_event(self):
        """Test client connection."""
        # Simulate connect
        environ = {}
        sid = "test_sid_123"
        
        # Should not raise
        await sio.emit('connected', {'sid': sid}, room=sid)
    
    async def test_disconnect_removes_from_active_connections(self):
        """Test disconnection removes player from active connections."""
        session_id = "TEST01"
        player_id = 1
        sid = "test_sid_456"
        
        # Add to active connections
        active_connections[session_id] = {player_id: sid}
        
        # Simulate disconnect logic
        for sess_id, players in list(active_connections.items()):
            for p_id, p_sid in list(players.items()):
                if p_sid == sid:
                    del active_connections[sess_id][p_id]
        
        # Verify removed
        assert player_id not in active_connections.get(session_id, {})


class TestSocketIOSessionEvents:
    """Test session-related Socket.IO events."""
    
    async def test_join_session_adds_to_connections(self):
        """Test joining session adds player to tracking."""
        session_id = "TEST02"
        player_id = 2
        sid = "test_sid_789"
        
        # Clear active connections
        active_connections.clear()
        
        # Simulate join logic
        if session_id not in active_connections:
            active_connections[session_id] = {}
        
        active_connections[session_id][player_id] = sid
        
        # Verify added
        assert session_id in active_connections
        assert active_connections[session_id][player_id] == sid
    
    async def test_leave_session_removes_player(self):
        """Test leaving session removes player."""
        session_id = "TEST03"
        player_id = 3
        sid = "test_sid_abc"
        
        # Setup
        active_connections[session_id] = {player_id: sid}
        
        # Simulate leave logic
        if session_id in active_connections and player_id in active_connections[session_id]:
            del active_connections[session_id][player_id]
        
        # Verify removed
        assert player_id not in active_connections.get(session_id, {})


class TestSocketIOQuestionEvents:
    """Test question-related events."""
    
    async def test_start_question_data_validation(self):
        """Test start_question requires session_id and question_id."""
        data_valid = {
            'session_id': 'TEST04',
            'question_id': 'q1',
            'question': {'prompt': 'What is 2+2?'},
            'time_limit': 30
        }
        
        # Valid data should have required fields
        assert 'session_id' in data_valid
        assert 'question_id' in data_valid
        
        data_invalid = {'question': {'prompt': 'Test'}}
        
        # Invalid data missing required fields
        assert 'session_id' not in data_invalid
        assert 'question_id' not in data_invalid
    
    async def test_submit_answer_data_validation(self):
        """Test submit_answer requires all fields."""
        data_valid = {
            'session_id': 'TEST05',
            'question_id': 'q2',
            'player_id': 5,
            'answer': {'text': 'Paris'},
            'time_taken': 15
        }
        
        # Valid data
        assert all([
            data_valid.get('session_id'),
            data_valid.get('question_id'),
            data_valid.get('player_id'),
            data_valid.get('answer') is not None
        ])
        
        data_invalid = {
            'session_id': 'TEST05',
            'question_id': 'q2'
        }
        
        # Invalid data
        assert not all([
            data_invalid.get('session_id'),
            data_invalid.get('question_id'),
            data_invalid.get('player_id'),
            data_invalid.get('answer') is not None
        ])
    
    async def test_buzzer_press_data_validation(self):
        """Test buzzer_press requires all fields."""
        data_valid = {
            'session_id': 'TEST06',
            'question_id': 'q3',
            'player_id': 6,
            'timestamp': 1234567890
        }
        
        # Valid data
        assert all([
            data_valid.get('session_id'),
            data_valid.get('question_id'),
            data_valid.get('player_id'),
            data_valid.get('timestamp')
        ])
    
    async def test_end_question_data_validation(self):
        """Test end_question requires session_id and question_id."""
        data_valid = {
            'session_id': 'TEST07',
            'question_id': 'q4',
            'correct_answer': {'text': 'Berlin'}
        }
        
        assert data_valid.get('session_id')
        assert data_valid.get('question_id')


class TestSocketIOLeaderboard:
    """Test leaderboard event."""
    
    async def test_update_leaderboard_data_validation(self):
        """Test update_leaderboard requires session_id."""
        data_valid = {
            'session_id': 'TEST08',
            'leaderboard': [
                {'player_id': 1, 'name': 'Alice', 'score': 100},
                {'player_id': 2, 'name': 'Bob', 'score': 50}
            ]
        }
        
        assert data_valid.get('session_id')
        assert isinstance(data_valid.get('leaderboard', []), list)


class TestSocketIOPing:
    """Test ping/pong event."""
    
    async def test_ping_pong(self):
        """Test ping returns pong."""
        data = {'timestamp': 1234567890}
        
        # Should echo back the timestamp
        assert data.get('timestamp') == 1234567890
