"""
Socket.IO server for real-time quiz functionality
"""
import socketio
from typing import Dict, Optional
from uuid import UUID
import logging
import asyncio

logger = logging.getLogger(__name__)

# Create AsyncServer instance
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,  # Disabled to prevent large base64 images flooding console
    engineio_logger=False,  # Disabled for production performance
    ping_timeout=60,
    ping_interval=25,
    max_http_buffer_size=10 * 1024 * 1024  # 10MB to support large base64 images
)

# Store active connections: {session_id: {player_id: sid}}
active_connections: Dict[str, Dict[int, str]] = {}

# Store session game state: {session_id: game_state}
session_game_states: Dict[str, dict] = {}

# Store timer tasks: {session_id: asyncio.Task}
timer_tasks: Dict[str, asyncio.Task] = {}


async def timer_countdown(session_id: str):
    """Countdown timer task for a session."""
    try:
        while True:
            await asyncio.sleep(1)
            game_state = get_game_state(session_id)
            
            if not game_state['timer_running']:
                break
            
            if game_state['timer'] > 0:
                game_state['timer'] -= 1
                await broadcast_game_state(session_id)
            else:
                # Timer expired
                game_state['timer_running'] = False
                game_state['input_locked'] = True
                await broadcast_game_state(session_id)
                break
    except asyncio.CancelledError:
        print(f"[Timer] Timer task cancelled for session {session_id}")
    except Exception as e:
        print(f"[Timer] Error in timer countdown for session {session_id}: {e}")


def get_game_state(session_id: str) -> dict:
    """Get or create game state for a session."""
    if session_id not in session_game_states:
        session_game_states[session_id] = {
            'status': 'waiting',  # waiting, playing, paused, ended
            'current_question': None,
            'current_question_index': -1,
            'input_locked': False,  # Default: unlocked for immediate answering
            'buzzer_winner': None,
            'timer': 0,
            'timer_running': False,
            'question_visible': False,  # Question not visible to players yet
            'image_visible': False,  # Image not visible to players yet
            'players': {},  # {player_id: {name, score, connected, answered, locked_in, current_answer, team_id}}
            'leaderboard': [],
            # Team mode fields
            'team_mode': False,
            'teams': {},  # {team_id: {name, color, score, member_ids}}
            'team_leaderboard': [],
            'active_players': {},  # {team_id: player_id} for input questions
        }
    return session_game_states[session_id]


@sio.event
async def connect(sid: str, environ: dict):
    """Handle client connection."""
    logger.info(f"[WebSocket] Client {sid} connected from {environ.get('REMOTE_ADDR', 'unknown')}")
    await sio.emit('connected', {'sid': sid}, room=sid)


@sio.event
async def disconnect(sid: str):
    """Handle client disconnection."""
    print(f"[WebSocket] Client {sid} disconnected")
    
    # Remove from active connections and update game state
    for session_id, players in list(active_connections.items()):
        for player_id, player_sid in list(players.items()):
            if player_sid == sid:
                print(f"[WebSocket] Removing player {player_id} from session {session_id}")
                # player_id is already a string when stored in active_connections
                del active_connections[session_id][player_id]
                
                # Update game state
                game_state = get_game_state(session_id)
                if player_id in game_state['players']:
                    game_state['players'][player_id]['connected'] = False
                    print(f"[WebSocket] Set player {player_id} connected=False in game state")
                
                # Broadcast updated state
                await broadcast_game_state(session_id)
                await sio.emit(
                    'player_disconnected',
                    {'player_id': player_id},
                    room=f"session_{session_id}"
                )
                print(f"[WebSocket] Sent player_disconnected event for player {player_id}")
                break


async def cleanup_old_player_connection(session_id: str, player_id: str):
    """Cleanup old player connection when reconnecting."""
    if session_id in active_connections and player_id in active_connections[session_id]:
        old_sid = active_connections[session_id].get(player_id)
        if old_sid:
            print(f"[WebSocket] Cleaning up old connection for player {player_id}: {old_sid}")
            try:
                await sio.disconnect(old_sid)
            except Exception as e:
                print(f"[WebSocket] Error disconnecting old session: {e}")


async def broadcast_game_state(session_id: str):
    """Broadcast full game state to all clients in session."""
    game_state = get_game_state(session_id)
    
    # Build leaderboard from players
    players_list = [
        {
            'id': pid,
            'name': pdata['name'],
            'score': pdata['score'],
            'connected': pdata['connected'],
            'answered': pdata.get('answered', False),
            'current_answer': pdata.get('current_answer', ''),
            'team_id': pdata.get('team_id'),
        }
        for pid, pdata in game_state['players'].items()
    ]
    players_list.sort(key=lambda x: (-x['score'], x['name']))
    
    # Add ranks
    for i, p in enumerate(players_list):
        p['rank'] = i + 1
    
    game_state['leaderboard'] = players_list
    
    # Build team leaderboard if in team mode
    if game_state.get('team_mode') and game_state.get('teams'):
        team_list = []
        for team_id, team_data in game_state['teams'].items():
            # Calculate connected count
            connected_count = sum(
                1 for p in players_list
                if p.get('team_id') == team_id and p.get('connected')
            )
            team_list.append({
                'team_id': team_id,
                'team_name': team_data['name'],
                'team_color': team_data['color'],
                'score': team_data['score'],
                'member_count': len(team_data.get('member_ids', [])),
                'connected_count': connected_count,
            })
        team_list.sort(key=lambda x: (-x['score'], x['team_name']))
        for i, t in enumerate(team_list):
            t['rank'] = i + 1
        game_state['team_leaderboard'] = team_list
    
    await sio.emit('game_state_updated', {'game_state': game_state}, room=f"session_{session_id}")


@sio.event
async def join_session(sid: str, data: dict):
    """Join a quiz session room."""
    session_id = data.get('session_id')
    player_id = data.get('player_id')
    player_name = data.get('player_name')
    is_moderator = data.get('is_moderator', False)
    
    print(f"[WebSocket] join_session: sid={sid}, session={session_id}, player_id={player_id}, name={player_name}, moderator={is_moderator}")
    
    if not session_id:
        print(f"[WebSocket] ERROR: No session_id provided")
        await sio.emit('error', {'message': 'session_id required'}, room=sid)
        return
    
    # Join session room
    await sio.enter_room(sid, f"session_{session_id}")
    print(f"[WebSocket] {sid} joined room session_{session_id}")
    
    # Track connection
    if session_id not in active_connections:
        active_connections[session_id] = {}
        print(f"[WebSocket] Created new active_connections for session {session_id}")
    
    game_state = get_game_state(session_id)
    
    if player_id and not is_moderator:
        # Convert player_id to string for consistent dictionary keys
        player_id = str(player_id)
        
        # Disconnect old session if player is reconnecting
        old_sid = active_connections[session_id].get(player_id)
        if old_sid and old_sid != sid:
            print(f"[WebSocket] Player {player_id} reconnecting: disconnecting old session {old_sid}")
            await sio.disconnect(old_sid)
        
        active_connections[session_id][player_id] = sid
        print(f"[WebSocket] Registered player {player_id} with sid {sid}")
        print(f"[WebSocket] Active connections for {session_id}: {list(active_connections[session_id].keys())}")
        
        # Add/update player in game state
        if player_id not in game_state['players']:
            print(f"[WebSocket] Adding new player {player_id} to game state")
            game_state['players'][player_id] = {
                'name': player_name or f'Player {player_id}',
                'score': 0,
                'connected': True,
                'answered': False,
                'locked_in': False,
                'current_answer': ''
            }
        else:
            print(f"[WebSocket] Updating existing player {player_id} in game state (connected=True)")
            game_state['players'][player_id]['connected'] = True
            game_state['players'][player_id]['name'] = player_name or game_state['players'][player_id]['name']
            # Initialize current_answer if not present
            if 'current_answer' not in game_state['players'][player_id]:
                game_state['players'][player_id]['current_answer'] = ''
        
        print(f"[WebSocket] Game state players: {list(game_state['players'].keys())}")
        print(f"[WebSocket] Player {player_id} connected status: {game_state['players'][player_id]['connected']}")
    
    # Send current game state to joining client
    await sio.emit('game_state_updated', {'game_state': game_state}, room=sid)
    print(f"[WebSocket] Sent game_state_updated to {sid}")
    
    # Notify others and broadcast updated state
    if player_id and not is_moderator:
        await sio.emit(
            'player_joined',
            {'player_id': player_id, 'player_name': player_name},
            room=f"session_{session_id}",
            skip_sid=sid
        )
        print(f"[WebSocket] Sent player_joined event to session_{session_id}")
        await broadcast_game_state(session_id)
        print(f"[WebSocket] Broadcasted game state to session_{session_id}")
    
    await sio.emit(
        'session_joined',
        {'session_id': session_id, 'player_count': len(game_state['players'])},
        room=sid
    )
    print(f"[WebSocket] Sent session_joined to {sid}, player_count={len(game_state['players'])}")


@sio.event
async def leave_session(sid: str, data: dict):
    """Leave a quiz session room."""
    session_id = data.get('session_id')
    player_id = data.get('player_id')
    
    if not session_id:
        return
    
    # Leave room
    await sio.leave_room(sid, f"session_{session_id}")
    
    # Convert player_id to string for consistent dictionary keys
    if player_id is not None:
        player_id = str(player_id)
    
    # Remove from tracking
    if session_id in active_connections and player_id in active_connections[session_id]:
        del active_connections[session_id][player_id]
    
    # Update game state
    game_state = get_game_state(session_id)
    if player_id in game_state['players']:
        game_state['players'][player_id]['connected'] = False
    
    # Notify others
    await sio.emit(
        'player_left',
        {'player_id': player_id},
        room=f"session_{session_id}"
    )
    await broadcast_game_state(session_id)


@sio.event
async def setup_team_mode(sid: str, data: dict):
    """
    Moderator sets up team mode for the session.
    
    Expects data:
        session_id: str
        teams: list of {id, name, color}
    """
    session_id = data.get('session_id')
    teams = data.get('teams', [])
    
    if not session_id:
        await sio.emit('error', {'message': 'session_id required'}, room=sid)
        return
    
    game_state = get_game_state(session_id)
    game_state['team_mode'] = True
    game_state['teams'] = {
        t['id']: {
            'name': t['name'],
            'color': t['color'],
            'score': 0,
            'member_ids': [],
        }
        for t in teams
    }
    
    await sio.emit('team_mode_enabled', {
        'teams': teams
    }, room=f"session_{session_id}")
    await broadcast_game_state(session_id)


@sio.event
async def player_join_team(sid: str, data: dict):
    """
    Player joins a team.
    
    Expects data:
        session_id: str
        player_id: int/str
        team_id: str
    """
    session_id = data.get('session_id')
    player_id = str(data.get('player_id'))
    team_id = data.get('team_id')
    
    if not session_id or not player_id or not team_id:
        await sio.emit('error', {'message': 'session_id, player_id, and team_id required'}, room=sid)
        return
    
    game_state = get_game_state(session_id)
    
    if not game_state.get('team_mode'):
        await sio.emit('error', {'message': 'Session is not in team mode'}, room=sid)
        return
    
    if team_id not in game_state.get('teams', {}):
        await sio.emit('error', {'message': 'Team not found'}, room=sid)
        return
    
    # Remove from old team if any
    for tid, tdata in game_state['teams'].items():
        if player_id in tdata['member_ids']:
            tdata['member_ids'].remove(player_id)
    
    # Add to new team
    game_state['teams'][team_id]['member_ids'].append(player_id)
    
    # Update player's team_id in player state
    if player_id in game_state['players']:
        game_state['players'][player_id]['team_id'] = team_id
    
    player_name = game_state['players'].get(player_id, {}).get('name', 'Unknown')
    
    await sio.emit('player_joined_team', {
        'player_id': player_id,
        'player_name': player_name,
        'team_id': team_id,
        'team_name': game_state['teams'][team_id]['name'],
    }, room=f"session_{session_id}")
    await broadcast_game_state(session_id)


@sio.event
async def select_active_players(sid: str, data: dict):
    """
    Moderator selects active players for input questions (one per team).
    
    Expects data:
        session_id: str
    
    Returns random selection of one connected player per team.
    """
    import random
    
    session_id = data.get('session_id')
    
    if not session_id:
        await sio.emit('error', {'message': 'session_id required'}, room=sid)
        return
    
    game_state = get_game_state(session_id)
    
    if not game_state.get('team_mode'):
        return
    
    active_players = {}
    
    for team_id, team_data in game_state['teams'].items():
        # Get connected players in this team
        connected_in_team = [
            pid for pid in team_data['member_ids']
            if game_state['players'].get(pid, {}).get('connected')
        ]
        
        if connected_in_team:
            # Randomly select one
            selected = random.choice(connected_in_team)
            active_players[team_id] = selected
    
    game_state['active_players'] = active_players
    
    await sio.emit('active_players_selected', {
        'active_players': active_players
    }, room=f"session_{session_id}")
    await broadcast_game_state(session_id)


@sio.event
async def update_team_score(sid: str, data: dict):
    """
    Moderator updates a team's score.
    
    Expects data:
        session_id: str
        team_id: str
        delta: int
    """
    session_id = data.get('session_id')
    team_id = data.get('team_id')
    delta = data.get('delta', 0)
    
    if not session_id or not team_id:
        await sio.emit('error', {'message': 'session_id and team_id required'}, room=sid)
        return
    
    game_state = get_game_state(session_id)
    
    if team_id in game_state.get('teams', {}):
        game_state['teams'][team_id]['score'] += delta
        # Ensure score doesn't go below 0
        if game_state['teams'][team_id]['score'] < 0:
            game_state['teams'][team_id]['score'] = 0
        
        await sio.emit('team_score_updated', {
            'team_id': team_id,
            'new_score': game_state['teams'][team_id]['score'],
            'delta': delta,
        }, room=f"session_{session_id}")
        await broadcast_game_state(session_id)


@sio.event
async def start_game(sid: str, data: dict):
    """Moderator starts the game."""
    session_id = data.get('session_id')
    questions = data.get('questions', [])
    quiz_title = data.get('quiz_title', 'Quiz')
    
    if not session_id:
        await sio.emit('error', {'message': 'session_id required'}, room=sid)
        return
    
    game_state = get_game_state(session_id)
    game_state['status'] = 'playing'
    game_state['questions'] = questions
    game_state['quiz_title'] = quiz_title
    game_state['current_question_index'] = -1
    game_state['current_question'] = None
    
    # Reset all player answers
    for pid in game_state['players']:
        game_state['players'][pid]['answered'] = False
    
    await sio.emit('game_started', {
        'quiz_title': quiz_title,
        'total_questions': len(questions)
    }, room=f"session_{session_id}")
    await broadcast_game_state(session_id)


@sio.event
async def update_score(sid: str, data: dict):
    """Moderator updates a player's score."""
    session_id = data.get('session_id')
    player_id = data.get('player_id')
    delta = data.get('delta', 0)  # Positive or negative
    
    if not session_id or player_id is None:
        await sio.emit('error', {'message': 'session_id and player_id required'}, room=sid)
        return
    
    # Convert player_id to string for consistent dictionary keys
    player_id = str(player_id)
    
    game_state = get_game_state(session_id)
    if player_id in game_state['players']:
        game_state['players'][player_id]['score'] += delta
        # Ensure score doesn't go below 0
        if game_state['players'][player_id]['score'] < 0:
            game_state['players'][player_id]['score'] = 0
    
    await broadcast_game_state(session_id)


@sio.event
async def set_timer(sid: str, data: dict):
    """Moderator sets and starts the timer."""
    session_id = data.get('session_id')
    seconds = data.get('seconds', 0)
    
    if not session_id:
        return
    
    game_state = get_game_state(session_id)
    game_state['timer'] = seconds
    game_state['timer_running'] = seconds > 0  # Start timer if seconds > 0
        # Cancel existing timer task if any
    if session_id in timer_tasks:
        timer_tasks[session_id].cancel()
        del timer_tasks[session_id]
    
    # Start new timer countdown task if timer > 0
    if seconds > 0:
        timer_tasks[session_id] = asyncio.create_task(timer_countdown(session_id))
        await sio.emit('timer_updated', {'seconds': seconds}, room=f"session_{session_id}")
    await broadcast_game_state(session_id)


@sio.event
async def toggle_input_lock(sid: str, data: dict):
    """Moderator toggles input lock for players."""
    session_id = data.get('session_id')
    locked = data.get('locked', True)
    
    if not session_id:
        return
    
    game_state = get_game_state(session_id)
    game_state['input_locked'] = locked
    game_state['buzzer_winner'] = None if not locked else game_state['buzzer_winner']
    
    await sio.emit('input_lock_changed', {'locked': locked}, room=f"session_{session_id}")
    await broadcast_game_state(session_id)


@sio.event
async def start_question(sid: str, data: dict):
    """Moderator starts a question and broadcasts to all players."""
    session_id = data.get('session_id')
    question_id = data.get('question_id')
    question = data.get('question')
    question_index = data.get('question_index', 0)
    time_limit = data.get('time_limit', 30)
    
    if not session_id or not question_id:
        await sio.emit('error', {'message': 'session_id and question_id required'}, room=sid)
        return
    
    # Update game state
    game_state = get_game_state(session_id)
    game_state['status'] = 'playing'  # Set status to playing when first question starts
    game_state['current_question'] = question
    game_state['current_question_index'] = question_index
    game_state['input_locked'] = False  # Unlock input for answering
    game_state['buzzer_winner'] = None
    game_state['timer'] = time_limit
    game_state['timer_running'] = False  # Don't auto-start timer - wait for manual start
    game_state['question_visible'] = False  # Question not visible to players yet
    
    # Reset answered, locked_in, and current_answer state for all players
    for pid in game_state['players']:
        game_state['players'][pid]['answered'] = False
        game_state['players'][pid]['locked_in'] = False
        game_state['players'][pid]['current_answer'] = ''
    
    # Cancel existing timer task if any
    if session_id in timer_tasks:
        timer_tasks[session_id].cancel()
        del timer_tasks[session_id]
    
    # Broadcast question to all players in session
    await sio.emit(
        'question_started',
        {
            'question_id': question_id,
            'question': question,
            'question_index': question_index,
            'time_limit': time_limit
        },
        room=f"session_{session_id}"
    )
    await broadcast_game_state(session_id)


@sio.event
async def update_answer(sid: str, data: dict):
    """Player updates their answer (live, while typing)."""
    session_id = data.get('session_id')
    player_id = data.get('player_id')
    answer = data.get('answer', '')
    
    if not session_id or player_id is None:
        return
    
    # Convert player_id to string for consistent dictionary keys
    player_id = str(player_id)
    
    # Update game state with current answer
    game_state = get_game_state(session_id)
    if player_id in game_state['players']:
        game_state['players'][player_id]['current_answer'] = answer
    
    # Broadcast live to moderator
    await broadcast_game_state(session_id)


@sio.event
async def submit_answer(sid: str, data: dict):
    """Player submits/withdraws an answer (toggle)."""
    session_id = data.get('session_id')
    question_id = data.get('question_id')
    player_id = data.get('player_id')
    answer = data.get('answer')
    time_taken = data.get('time_taken')
    submitted = data.get('submitted', True)  # Toggle flag
    
    if not all([session_id, question_id, player_id is not None]):
        await sio.emit('error', {'message': 'Missing required fields'}, room=sid)
        return
    
    # Convert player_id to string for consistent dictionary keys
    player_id = str(player_id)
    
    # Update game state
    game_state = get_game_state(session_id)
    if player_id in game_state['players']:
        game_state['players'][player_id]['answered'] = submitted
        if answer is not None:
            game_state['players'][player_id]['current_answer'] = answer
    
    # Acknowledge receipt
    await sio.emit(
        'answer_received',
        {'question_id': question_id, 'player_id': player_id, 'submitted': submitted},
        room=sid
    )
    
    # Notify moderator
    await sio.emit(
        'answer_submitted',
        {
            'question_id': question_id,
            'player_id': player_id,
            'answer': answer,
            'time_taken': time_taken,
            'submitted': submitted
        },
        room=f"session_{session_id}"
    )
    await broadcast_game_state(session_id)


@sio.event
async def lock_in(sid: str, data: dict):
    """Player locks in their answer (signals they are done typing)."""
    session_id = data.get('session_id')
    player_id = data.get('player_id')
    
    if not session_id or player_id is None:
        await sio.emit('error', {'message': 'session_id and player_id required'}, room=sid)
        return
    
    # Convert player_id to string for consistent dictionary keys
    player_id = str(player_id)
    
    game_state = get_game_state(session_id)
    if player_id in game_state['players']:
        game_state['players'][player_id]['locked_in'] = True
    
    # Broadcast updated state to all
    await broadcast_game_state(session_id)


@sio.event
async def buzzer_press(sid: str, data: dict):
    """Player presses buzzer - first one wins. Only allowed for buzzer questions.
    
    In team mode: first player to buzz wins for their entire team.
    """
    session_id = data.get('session_id')
    question_id = data.get('question_id')
    player_id = data.get('player_id')
    player_name = data.get('player_name', 'Unknown')
    client_timestamp = data.get('timestamp')
    
    if not all([session_id, question_id, player_id is not None, client_timestamp]):
        await sio.emit('error', {'message': 'Missing required fields'}, room=sid)
        return
    
    # Convert player_id to string for consistent dictionary keys
    player_id = str(player_id)
    
    # Check if buzzer already pressed
    game_state = get_game_state(session_id)
    
    # Only allow buzzer for buzzer-type questions
    current_question = game_state.get('current_question')
    if current_question:
        question_type = (current_question.get('type') or '').lower().replace('-', '_')
        if question_type != 'buzzer':
            await sio.emit('error', {'message': 'Buzzer only allowed for buzzer questions'}, room=sid)
            return
    
    # If buzzer already won, ignore
    if game_state['buzzer_winner'] is not None:
        await sio.emit('buzzer_already_pressed', {
            'winner': game_state['buzzer_winner']
        }, room=sid)
        return
    
    # Determine team info if in team mode
    team_id = None
    team_name = None
    if game_state.get('team_mode'):
        player_data = game_state['players'].get(player_id, {})
        team_id = player_data.get('team_id')
        if team_id and team_id in game_state.get('teams', {}):
            team_name = game_state['teams'][team_id]['name']
    
    # First buzzer wins - lock input and set winner
    game_state['buzzer_winner'] = {
        'player_id': player_id,
        'player_name': player_name,
        'timestamp': client_timestamp,
        'team_id': team_id,
        'team_name': team_name,
    }
    game_state['input_locked'] = True
    
    # Broadcast buzzer press to all in session
    await sio.emit(
        'buzzer_pressed',
        {
            'question_id': question_id,
            'player_id': player_id,
            'player_name': player_name,
            'timestamp': client_timestamp,
            'team_id': team_id,
            'team_name': team_name,
        },
        room=f"session_{session_id}"
    )
    await broadcast_game_state(session_id)


@sio.event
async def reveal_question(sid: str, data: dict):
    """Moderator toggles question visibility for players."""
    session_id = data.get('session_id')
    visible = data.get('visible')  # Optional: if not provided, toggle
    
    if not session_id:
        await sio.emit('error', {'message': 'session_id required'}, room=sid)
        return
    
    game_state = get_game_state(session_id)
    
    # Toggle if visible not specified, otherwise set to given value
    if visible is None:
        game_state['question_visible'] = not game_state.get('question_visible', False)
    else:
        game_state['question_visible'] = visible
    
    # Broadcast updated state to all
    await broadcast_game_state(session_id)
    
    # Notify players about question visibility change
    if game_state['question_visible']:
        await sio.emit(
            'question_revealed',
            {'question': game_state['current_question']},
            room=f"session_{session_id}"
        )


@sio.event
async def toggle_image_visibility(sid: str, data: dict):
    """Moderator toggles image visibility for players."""
    session_id = data.get('session_id')
    visible = data.get('visible')  # Optional: if not provided, toggle
    
    if not session_id:
        await sio.emit('error', {'message': 'session_id required'}, room=sid)
        return
    
    game_state = get_game_state(session_id)
    
    # Toggle if visible not specified, otherwise set to given value
    if visible is None:
        game_state['image_visible'] = not game_state.get('image_visible', False)
    else:
        game_state['image_visible'] = visible
    
    # Broadcast updated state to all
    await broadcast_game_state(session_id)
    logger.info(f"Image visibility toggled: session={session_id}, visible={game_state['image_visible']}")


@sio.event
async def toggle_buzzer_lock(sid: str, data: dict):
    """Moderator toggles buzzer/input lock state."""
    session_id = data.get('session_id')
    locked = data.get('locked', True)
    
    if not session_id:
        await sio.emit('error', {'message': 'session_id required', 'code': 'MISSING_SESSION_ID'}, room=sid)
        return
    
    if session_id not in session_game_states:
        await sio.emit('error', {'message': 'Session not found', 'code': 'SESSION_NOT_FOUND'}, room=sid)
        return
    
    game_state = get_game_state(session_id)
    game_state['input_locked'] = locked
    
    logger.info(f"Buzzer lock toggled: session={session_id}, locked={locked}")
    await sio.emit('input_lock_changed', {'locked': locked}, room=f"session_{session_id}")
    await broadcast_game_state(session_id)


@sio.event
async def play_audio(sid: str, data: dict):
    """Moderator plays audio for all players."""
    session_id = data.get('session_id')
    action = data.get('action')  # 'play', 'pause', 'stop'
    audio_src = data.get('audio_src')
    current_time = data.get('current_time', 0)
    
    if not session_id:
        await sio.emit('error', {'message': 'session_id required'}, room=sid)
        return
    
    if session_id not in session_game_states:
        await sio.emit('error', {'message': 'Session not found'}, room=sid)
        return
    
    # Broadcast audio control to all players
    await sio.emit('audio_control', {
        'action': action,
        'audio_src': audio_src,
        'current_time': current_time
    }, room=f"session_{session_id}", skip_sid=sid)
    
    logger.info(f"Audio control: session={session_id}, action={action}")


@sio.event
async def award_points_correct(sid: str, data: dict):
    """Award points to buzzer winner (correct answer)."""
    session_id = data.get('session_id')
    player_id = data.get('player_id')
    points = data.get('points', 10)
    
    if not session_id or player_id is None:
        await sio.emit('error', {'message': 'session_id and player_id required', 'code': 'MISSING_PARAMS'}, room=sid)
        return
    
    if session_id not in session_game_states:
        await sio.emit('error', {'message': 'Session not found', 'code': 'SESSION_NOT_FOUND'}, room=sid)
        return
    
    game_state = get_game_state(session_id)
    pid_str = str(player_id)
    
    if pid_str not in game_state['players']:
        await sio.emit('error', {'message': f'Player {player_id} not found in session', 'code': 'PLAYER_NOT_FOUND'}, room=sid)
        return
    
    game_state['players'][pid_str]['score'] += points
    
    # Reset buzzer winner after awarding points
    game_state['buzzer_winner'] = None
    game_state['input_locked'] = False  # Unlock inputs for next question
    
    logger.info(f"Points awarded (correct): session={session_id}, player={pid_str}, points=+{points}")
    await broadcast_game_state(session_id)


@sio.event
async def award_points_wrong(sid: str, data: dict):
    """Award points to all players except buzzer winner (wrong answer)."""
    session_id = data.get('session_id')
    player_id = data.get('player_id')  # The player who answered wrong
    points = data.get('points', 1)
    
    if not session_id or player_id is None:
        await sio.emit('error', {'message': 'session_id and player_id required', 'code': 'MISSING_PARAMS'}, room=sid)
        return
    
    if session_id not in session_game_states:
        await sio.emit('error', {'message': 'Session not found', 'code': 'SESSION_NOT_FOUND'}, room=sid)
        return
    
    game_state = get_game_state(session_id)
    wrong_player_id = str(player_id)
    
    if wrong_player_id not in game_state['players']:
        await sio.emit('error', {'message': f'Player {player_id} not found in session', 'code': 'PLAYER_NOT_FOUND'}, room=sid)
        return
    
    # Award points to everyone except the wrong player
    awarded_count = 0
    for pid in game_state['players']:
        if pid != wrong_player_id:
            game_state['players'][pid]['score'] += points
            awarded_count += 1
    
    # Reset buzzer winner after awarding points
    game_state['buzzer_winner'] = None
    game_state['input_locked'] = False  # Unlock inputs for next question
    
    logger.info(f"Points awarded (wrong): session={session_id}, wrong_player={wrong_player_id}, awarded_to={awarded_count} players, points=+{points} each")
    await broadcast_game_state(session_id)


@sio.event
async def reset_buzzer(sid: str, data: dict):
    """Reset buzzer state without awarding points (e.g., for accidental buzzes)."""
    session_id = data.get('session_id')
    
    if not session_id:
        await sio.emit('error', {'message': 'session_id required', 'code': 'MISSING_SESSION_ID'}, room=sid)
        return
    
    if session_id not in session_game_states:
        await sio.emit('error', {'message': 'Session not found', 'code': 'SESSION_NOT_FOUND'}, room=sid)
        return
    
    game_state = get_game_state(session_id)
    
    # Reset buzzer winner and unlock inputs
    game_state['buzzer_winner'] = None
    game_state['input_locked'] = False
    
    logger.info(f"Buzzer reset: session={session_id}")
    await broadcast_game_state(session_id)


@sio.event
async def end_question(sid: str, data: dict):
    """Moderator ends a question."""
    session_id = data.get('session_id')
    question_id = data.get('question_id')
    correct_answer = data.get('correct_answer')
    
    if not session_id or not question_id:
        await sio.emit('error', {'message': 'session_id and question_id required'}, room=sid)
        return
    
    # Update game state
    game_state = get_game_state(session_id)
    game_state['current_question'] = None
    game_state['input_locked'] = True
    game_state['buzzer_winner'] = None
    game_state['timer_running'] = False
    game_state['question_visible'] = False  # Reset for next question
    
    # Broadcast question end to all players
    await sio.emit(
        'question_ended',
        {
            'question_id': question_id,
            'correct_answer': correct_answer
        },
        room=f"session_{session_id}"
    )
    await broadcast_game_state(session_id)


@sio.event
async def end_game(sid: str, data: dict):
    """Moderator ends the game."""
    session_id = data.get('session_id')
    
    if not session_id:
        return
    
    game_state = get_game_state(session_id)
    game_state['status'] = 'finished'
    game_state['current_question'] = None
    game_state['timer_running'] = False
    
    # Build final leaderboard from player scores
    leaderboard = sorted(
        [{'player_id': pid, 'name': p['name'], 'score': p['score']} 
         for pid, p in game_state['players'].items()],
        key=lambda x: x['score'],
        reverse=True
    )
    game_state['leaderboard'] = leaderboard
    
    await sio.emit('game_ended', {'leaderboard': leaderboard}, room=f"session_{session_id}")
    await broadcast_game_state(session_id)


@sio.event
async def update_leaderboard(sid: str, data: dict):
    """Moderator broadcasts leaderboard update."""
    session_id = data.get('session_id')
    leaderboard = data.get('leaderboard', [])
    
    if not session_id:
        await sio.emit('error', {'message': 'session_id required'}, room=sid)
        return
    
    # Update game state
    game_state = get_game_state(session_id)
    game_state['leaderboard'] = leaderboard
    
    # Broadcast to all in session
    await sio.emit(
        'leaderboard_updated',
        {'leaderboard': leaderboard},
        room=f"session_{session_id}"
    )


@sio.event
async def ping(sid: str, data: dict):
    """Ping/pong for connection keepalive."""
    await sio.emit('pong', data, room=sid)


# Create ASGI app that wraps the Socket.IO server
# This will be mounted at /ws in main.py
# Clients should connect with path='/ws/socket.io'
socket_app = socketio.ASGIApp(
    sio,
    socketio_path='socket.io'  # Relative to mount point /ws -> full path is /ws/socket.io
)
