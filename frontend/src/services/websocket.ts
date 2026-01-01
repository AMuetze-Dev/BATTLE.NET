/**
 * WebSocket client using Socket.IO
 */
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../config';

// Socket.IO is mounted at /ws in the backend
const WS_BASE_URL = WS_URL;

export interface QuestionData {
  question_id: string;
  question: any;
  question_index?: number;
  time_limit: number;
}

export interface AnswerData {
  question_id: string;
  player_id: number;
  answer: any;
  time_taken: number;
}

export interface BuzzerData {
  question_id: string;
  player_id: number;
  player_name?: string;
  timestamp: number;
}

export interface LeaderboardUpdate {
  leaderboard: Array<{
    player_id: number;
    player_name?: string;
    name?: string;
    score: number;
    rank?: number;
    correct_answers?: number;
    total_answers?: number;
  }>;
}

export interface PlayerListUpdate {
  action: 'joined' | 'left' | 'score_updated' | 'connection_changed';
  player: {
    id: number;
    name: string;
    score: number;
    connected: boolean;
  };
}

export interface GameState {
  status: 'waiting' | 'playing' | 'finished';
  current_question: any | null;
  current_question_index: number;
  input_locked: boolean;
  buzzer_winner: {
    player_id: number;
    player_name: string;
    timestamp: number;
    team_id?: string;
    team_name?: string;
  } | null;
  timer: number;
  timer_running: boolean;
  question_visible: boolean;  // Question visible to players
  image_visible: boolean;  // Image visible to players
  players: Record<string, {
    name: string;
    score: number;
    connected: boolean;
    answered: boolean;
    locked_in?: boolean;
    current_answer?: string;
    team_id?: string;
  }>;
  leaderboard: Array<{
    player_id: number;
    name: string;
    score: number;
  }>;
  quiz_title?: string;
  questions?: any[];
  // Team mode fields
  team_mode?: boolean;
  teams?: Record<string, {
    name: string;
    color: string;
    score: number;
    member_ids: string[];
  }>;
  team_leaderboard?: Array<{
    team_id: string;
    team_name: string;
    team_color: string;
    score: number;
    member_count: number;
    connected_count: number;
  }>;
  active_players?: Record<string, string>;  // team_id -> player_id
}

export type WebSocketEventHandlers = {
  onConnected?: (data: { sid: string }) => void;
  onSessionJoined?: (data: { session_id: string; player_count: number }) => void;
  onPlayerJoined?: (data: { player_id: number; player_name: string }) => void;
  onPlayerLeft?: (data: { player_id: number }) => void;
  onPlayerDisconnected?: (data: { player_id: number }) => void;
  onPlayerListUpdated?: (data: PlayerListUpdate) => void;
  onQuestionStarted?: (data: QuestionData) => void;
  onQuestionRevealed?: (data: { question: any }) => void;
  onAnswerReceived?: (data: { question_id: string; player_id: number }) => void;
  onAnswerSubmitted?: (data: { question_id: string; player_id: number; answer: any; time_taken: number }) => void;
  onBuzzerPressed?: (data: BuzzerData) => void;
  onBuzzerAlreadyPressed?: (data: { winner: { player_id: number; player_name: string } }) => void;
  onQuestionEnded?: (data: { question_id: string; correct_answer?: any }) => void;
  onLeaderboardUpdated?: (data: LeaderboardUpdate) => void;
  onGameStateUpdated?: (data: { game_state: GameState }) => void;
  onGameStarted?: (data: { quiz_title: string; total_questions: number }) => void;
  onGameEnded?: (data: { leaderboard: any[] }) => void;
  onSessionEnded?: (data: { session_id: string; message: string }) => void;
  onTimerUpdated?: (data: { seconds: number }) => void;
  onInputLockChanged?: (data: { locked: boolean }) => void;
  onPong?: (data: { timestamp: number }) => void;
  onError?: (data: { message: string }) => void;
};

export type ConnectionStateHandler = (connected: boolean) => void;

export class WebSocketClient {
  private socket: Socket | null = null;
  private handlers: WebSocketEventHandlers = {};
  private connectionStateHandler: ConnectionStateHandler | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect(handlers: WebSocketEventHandlers = {}): void {
    if (this.socket?.connected) {
      console.warn('WebSocket already connected');
      return;
    }
    
    this.handlers = handlers;
    
    console.log('Connecting to Socket.IO:', WS_BASE_URL, 'with path: /socket.io/');
    
    this.socket = io(WS_BASE_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });
    
    this.setupEventListeners();
  }
  
  setConnectionStateHandler(handler: ConnectionStateHandler | null): void {
    this.connectionStateHandler = handler;
    // Immediately report current state
    if (handler && this.socket) {
      handler(this.socket.connected);
    }
  }
  
  private setupEventListeners(): void {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.connectionStateHandler?.(true);
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.connectionStateHandler?.(false);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.connectionStateHandler?.(false);
    });
    
    // Custom events
    this.socket.on('connected', (data) => {
      this.handlers.onConnected?.(data);
    });
    
    this.socket.on('session_joined', (data) => {
      this.handlers.onSessionJoined?.(data);
    });
    
    this.socket.on('player_joined', (data) => {
      this.handlers.onPlayerJoined?.(data);
    });
    
    this.socket.on('player_left', (data) => {
      this.handlers.onPlayerLeft?.(data);
    });
    
    this.socket.on('player_disconnected', (data) => {
      this.handlers.onPlayerDisconnected?.(data);
    });
    
    this.socket.on('player_list_updated', (data) => {
      this.handlers.onPlayerListUpdated?.(data);
    });
    
    this.socket.on('question_started', (data) => {
      this.handlers.onQuestionStarted?.(data);
    });
    
    this.socket.on('question_revealed', (data) => {
      this.handlers.onQuestionRevealed?.(data);
    });
    
    this.socket.on('answer_received', (data) => {
      this.handlers.onAnswerReceived?.(data);
    });
    
    this.socket.on('answer_submitted', (data) => {
      this.handlers.onAnswerSubmitted?.(data);
    });
    
    this.socket.on('buzzer_pressed', (data) => {
      this.handlers.onBuzzerPressed?.(data);
    });
    
    this.socket.on('buzzer_already_pressed', (data) => {
      this.handlers.onBuzzerAlreadyPressed?.(data);
    });
    
    this.socket.on('question_ended', (data) => {
      this.handlers.onQuestionEnded?.(data);
    });
    
    this.socket.on('leaderboard_updated', (data) => {
      this.handlers.onLeaderboardUpdated?.(data);
    });
    
    this.socket.on('game_state_updated', (data) => {
      this.handlers.onGameStateUpdated?.(data);
    });
    
    this.socket.on('game_started', (data) => {
      this.handlers.onGameStarted?.(data);
    });
    
    this.socket.on('game_ended', (data) => {
      this.handlers.onGameEnded?.(data);
    });
    
    this.socket.on('session_ended', (data) => {
      this.handlers.onSessionEnded?.(data);
    });
    
    this.socket.on('timer_updated', (data) => {
      this.handlers.onTimerUpdated?.(data);
    });
    
    this.socket.on('input_lock_changed', (data) => {
      this.handlers.onInputLockChanged?.(data);
    });
    
    this.socket.on('pong', (data) => {
      this.handlers.onPong?.(data);
    });
    
    this.socket.on('error', (data) => {
      this.handlers.onError?.(data);
    });
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  // Session events
  joinSession(sessionId: string, playerId?: number, playerName?: string, isModerator?: boolean): void {
    this.socket?.emit('join_session', {
      session_id: sessionId,
      player_id: playerId,
      player_name: playerName,
      is_moderator: isModerator,
    });
  }
  
  leaveSession(sessionId: string, playerId?: number): void {
    this.socket?.emit('leave_session', {
      session_id: sessionId,
      player_id: playerId,
    });
  }
  
  // Moderator events
  startGame(sessionId: string, questions: any[], quizTitle: string): void {
    this.socket?.emit('start_game', {
      session_id: sessionId,
      questions,
      quiz_title: quizTitle,
    });
  }
  
  endGame(sessionId: string): void {
    this.socket?.emit('end_game', {
      session_id: sessionId,
    });
  }
  
  startQuestion(
    sessionId: string,
    questionId: string,
    question: any,
    questionIndex: number,
    timeLimit: number
  ): void {
    this.socket?.emit('start_question', {
      session_id: sessionId,
      question_id: questionId,
      question,
      question_index: questionIndex,
      time_limit: timeLimit,
    });
  }
  
  endQuestion(sessionId: string, questionId: string, correctAnswer?: any): void {
    this.socket?.emit('end_question', {
      session_id: sessionId,
      question_id: questionId,
      correct_answer: correctAnswer,
    });
  }
  
  revealQuestion(sessionId: string, visible?: boolean): void {
    this.socket?.emit('reveal_question', {
      session_id: sessionId,
      visible,
    });
  }
  
  toggleImageVisibility(sessionId: string, visible?: boolean): void {
    this.socket?.emit('toggle_image_visibility', {
      session_id: sessionId,
      visible,
    });
  }
  
  toggleBuzzerLock(sessionId: string, locked: boolean): void {
    this.socket?.emit('toggle_buzzer_lock', {
      session_id: sessionId,
      locked,
    });
  }
  
  awardPointsCorrect(sessionId: string, playerId: number, points: number = 10): void {
    this.socket?.emit('award_points_correct', {
      session_id: sessionId,
      player_id: playerId,
      points,
    });
  }
  
  awardPointsWrong(sessionId: string, playerId: number, points: number = 1): void {
    this.socket?.emit('award_points_wrong', {
      session_id: sessionId,
      player_id: playerId,
      points,
    });
  }
  
  resetBuzzer(sessionId: string): void {
    this.socket?.emit('reset_buzzer', {
      session_id: sessionId,
    });
  }
  
  updateScore(sessionId: string, playerId: number, delta: number): void {
    this.socket?.emit('update_score', {
      session_id: sessionId,
      player_id: playerId,
      delta,
    });
  }
  
  setTimer(sessionId: string, seconds: number): void {
    this.socket?.emit('set_timer', {
      session_id: sessionId,
      seconds,
    });
  }
  
  toggleInputLock(sessionId: string, locked: boolean): void {
    this.socket?.emit('toggle_input_lock', {
      session_id: sessionId,
      locked,
    });
  }
  
  updateLeaderboard(sessionId: string, leaderboard: any[]): void {
    this.socket?.emit('update_leaderboard', {
      session_id: sessionId,
      leaderboard,
    });
  }
  
  // Player events
  updateAnswer(
    sessionId: string,
    playerId: number,
    answer: string
  ): void {
    this.socket?.emit('update_answer', {
      session_id: sessionId,
      player_id: playerId,
      answer,
    });
  }

  submitAnswer(
    sessionId: string,
    questionId: string,
    playerId: number,
    answer: any,
    timeTaken: number,
    submitted: boolean = true
  ): void {
    this.socket?.emit('submit_answer', {
      session_id: sessionId,
      question_id: questionId,
      player_id: playerId,
      answer,
      time_taken: timeTaken,
      submitted,
    });
  }
  
  pressBuzzer(
    sessionId: string,
    questionId: string,
    playerId: number,
    playerName: string,
    timestamp: number
  ): void {
    this.socket?.emit('buzzer_press', {
      session_id: sessionId,
      question_id: questionId,
      player_id: playerId,
      player_name: playerName,
      timestamp,
    });
  }
  
  lockIn(sessionId: string, playerId: number): void {
    this.socket?.emit('lock_in', {
      session_id: sessionId,
      player_id: playerId,
    });
  }
  
  // Team events
  setupTeamMode(sessionId: string, teams: Array<{ id: string; name: string; color: string }>): void {
    this.socket?.emit('setup_team_mode', {
      session_id: sessionId,
      teams,
    });
  }
  
  playerJoinTeam(sessionId: string, playerId: number, teamId: string): void {
    this.socket?.emit('player_join_team', {
      session_id: sessionId,
      player_id: playerId,
      team_id: teamId,
    });
  }
  
  selectActivePlayers(sessionId: string): void {
    this.socket?.emit('select_active_players', {
      session_id: sessionId,
    });
  }
  
  updateTeamScore(sessionId: string, teamId: string, delta: number): void {
    this.socket?.emit('update_team_score', {
      session_id: sessionId,
      team_id: teamId,
      delta,
    });
  }
  
  // Utility
  ping(timestamp: number = Date.now()): void {
    this.socket?.emit('ping', { timestamp });
  }
  
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
