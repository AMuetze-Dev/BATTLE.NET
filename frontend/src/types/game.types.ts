/**
 * Game State Types - Battle.Net Quiz Platform
 * 
 * Types for real-time game state, timer, and game events.
 */

import { QuestionDTO } from './question.types';
import { PlayerGameState, BuzzerWinner, LeaderboardEntry } from './player.types';

/** Game status */
export type GameStatus = 
  | 'waiting'     // Waiting for players
  | 'playing'     // Game in progress
  | 'paused'      // Game paused
  | 'finished';   // Game ended

/** Timer state */
export interface TimerState {
  running: boolean;
  value: number;
  duration: number;
  started_at?: number;
}

/** Game state from WebSocket */
export interface GameState {
  status: GameStatus;
  session_id: string;
  
  // Current question
  current_question: QuestionDTO | null;
  current_question_index: number;
  question_visible: boolean;
  image_visible: boolean;
  
  // Timer
  timer_running: boolean;
  timer: number;
  timer_duration: number;
  
  // Input control
  input_locked: boolean;
  
  // Buzzer
  buzzer_winner: BuzzerWinner | null;
  
  // Players (keyed by player ID as string)
  players: Record<string, PlayerGameState>;
  
  // Leaderboard
  leaderboard: LeaderboardEntry[];
}

/** Game state update event */
export interface GameStateUpdate {
  game_state: GameState;
  timestamp: number;
}

/** Question start event */
export interface QuestionStartEvent {
  question_id: string;
  question: QuestionDTO;
  index: number;
  timer_duration: number;
}

/** Question end event */
export interface QuestionEndEvent {
  question_id: string;
  correct_answer?: unknown;
  scores?: Record<string, number>;
}

/** Timer event */
export interface TimerEvent {
  action: 'start' | 'stop' | 'sync';
  value: number;
  duration?: number;
}

/** Score update event */
export interface ScoreUpdateEvent {
  player_id: number;
  player_name: string;
  delta: number;
  new_score: number;
  reason: string;
}

/** Create empty game state */
export const createEmptyGameState = (sessionId: string): GameState => ({
  status: 'waiting',
  session_id: sessionId,
  current_question: null,
  current_question_index: -1,
  question_visible: false,
  image_visible: false,
  timer_running: false,
  timer: 0,
  timer_duration: 30,
  input_locked: true,
  buzzer_winner: null,
  players: {},
  leaderboard: [],
});

/** Check if game is in active play state */
export const isGameActive = (state: GameState): boolean => {
  return state.status === 'playing' && state.current_question !== null;
};

/** Check if answers can be submitted */
export const canSubmitAnswer = (state: GameState): boolean => {
  return (
    state.status === 'playing' &&
    state.current_question !== null &&
    !state.input_locked
  );
};

/** Check if buzzer can be pressed */
export const canPressBuzzer = (state: GameState): boolean => {
  return (
    state.status === 'playing' &&
    state.current_question?.type === 'buzzer' &&
    !state.input_locked &&
    state.buzzer_winner === null
  );
};

/** Get connected player count */
export const getConnectedPlayerCount = (state: GameState): number => {
  return Object.values(state.players).filter(p => p.connected).length;
};

/** Get answered player count */
export const getAnsweredPlayerCount = (state: GameState): number => {
  return Object.values(state.players).filter(p => p.answered).length;
};

/** Format timer display (seconds to MM:SS) */
export const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return `${secs}`;
};

/** Check if timer is urgent (< 5 seconds) */
export const isTimerUrgent = (seconds: number): boolean => {
  return seconds > 0 && seconds <= 5;
};
