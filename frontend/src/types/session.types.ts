/**
 * Session Types - Battle.Net Quiz Platform
 * 
 * Types for session management, lifecycle, and events.
 */

/** Session status */
export type SessionStatus = 'active' | 'completed' | 'cancelled';

/** Session entity from database */
export interface Session {
  id: string;
  moderator_token: string;
  status: SessionStatus;
  created_at: string;
  ended_at: string | null;
  question_catalog: QuestionCatalog | null;
  current_question_id: string | null;
  metadata_: Record<string, unknown> | null;
}

/** Question catalog metadata */
export interface QuestionCatalog {
  id: string;
  title: string;
  description?: string;
  questions: unknown[];
  question_count?: number;
  image_count?: number;
  created_at: string;
  updated_at: string;
}

/** Session creation request */
export interface SessionCreateRequest {
  moderator_name?: string;
}

/** Session creation response */
export interface SessionCreateResponse {
  session_id: string;
  moderator_token: string;
  join_code: string;
  created_at: string;
}

/** Session join info for players */
export interface SessionJoinInfo {
  session_id: string;
  status: SessionStatus;
  player_count: number;
  max_players?: number;
  has_questions: boolean;
}

/** Session statistics */
export interface SessionStats {
  total_players: number;
  connected_players: number;
  total_questions: number;
  answered_questions: number;
  average_score: number;
  highest_score: number;
  duration_minutes: number;
}

/** Quiz upload result */
export interface QuizUploadResult {
  success: boolean;
  questions_count: number;
  images_count: number;
  errors?: string[];
}

/** Session event types */
export type SessionEventType =
  | 'session_created'
  | 'session_ended'
  | 'player_joined'
  | 'player_left'
  | 'question_started'
  | 'question_ended'
  | 'answer_submitted'
  | 'points_awarded'
  | 'buzzer_pressed'
  | 'timer_started'
  | 'timer_stopped';

/** Session event for audit log */
export interface SessionEvent {
  id: string;
  session_id: string;
  event_type: SessionEventType;
  actor: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

/** Validate session ID format (6 alphanumeric characters) */
export const isValidSessionId = (id: string): boolean => {
  return /^[A-Z0-9]{6}$/i.test(id);
};

/** Generate a random session ID */
export const generateSessionId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/** Format session duration */
export const formatSessionDuration = (startTime: string, endTime?: string): string => {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const durationMs = end - start;
  
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
};
