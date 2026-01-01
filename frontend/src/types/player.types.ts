/**
 * Player Types - Battle.Net Quiz Platform
 * 
 * Types for player state, answers, and leaderboard entries.
 */

/** Player answer value - varies by question type */
export type PlayerAnswerValue = 
  | string                    // text, number as string
  | number                    // slider value
  | boolean                   // true-false
  | string[]                  // multiple-choice, sorting
  | { x: number; y: number }; // hotspot coordinates

/** Player entity from database */
export interface Player {
  id: number;
  session_id: string;
  name: string;
  score: number;
  connected: boolean;
  joined_at: string;
  last_seen: string;
}

/** Player state during gameplay */
export interface PlayerGameState {
  id: number;
  name: string;
  score: number;
  connected: boolean;
  answered: boolean;
  locked_in: boolean;
  current_answer: string;
}

/** Player answer submission */
export interface PlayerAnswer {
  player_id: number;
  player_name: string;
  question_id: string;
  answer: PlayerAnswerValue;
  submitted_at: number;
  is_final: boolean;
}

/** Player score update */
export interface PlayerScoreUpdate {
  player_id: number;
  player_name: string;
  score_delta: number;
  new_score: number;
  reason: string;
}

/** Leaderboard entry */
export interface LeaderboardEntry {
  player_id: number;
  player_name: string;
  score: number;
  rank: number;
  correct_answers?: number;
  total_answers?: number;
  is_current_player?: boolean;
}

/** Leaderboard response from API */
export interface LeaderboardResponse {
  session_id: string;
  total_players: number;
  entries: LeaderboardEntry[];
}

/** Player join request */
export interface PlayerJoinRequest {
  session_id: string;
  name: string;
}

/** Player join response */
export interface PlayerJoinResponse {
  player_id: number;
  name: string;
  session_id: string;
  success: boolean;
  message?: string;
}

/** Buzzer press event */
export interface BuzzerPressEvent {
  player_id: number;
  player_name: string;
  question_id: string;
  timestamp: number;
}

/** Buzzer winner announcement */
export interface BuzzerWinner {
  player_id: number;
  player_name: string;
  reaction_time_ms: number;
}

/** Player statistics */
export interface PlayerStats {
  total_answers: number;
  correct_answers: number;
  accuracy_percentage: number;
  average_response_time_ms: number;
  buzzer_wins: number;
}

/** Create empty player state */
export const createEmptyPlayerState = (
  id: number,
  name: string
): PlayerGameState => ({
  id,
  name,
  score: 0,
  connected: true,
  answered: false,
  locked_in: false,
  current_answer: '',
});

/** Calculate player rank from score and other players */
export const calculateRank = (
  playerScore: number,
  allScores: number[]
): number => {
  const sorted = [...allScores].sort((a, b) => b - a);
  return sorted.indexOf(playerScore) + 1;
};

/** Format player answer for display */
export const formatPlayerAnswer = (
  answer: PlayerAnswerValue,
  questionType: string
): string => {
  if (answer === null || answer === undefined) return '—';
  
  if (typeof answer === 'boolean') {
    return answer ? 'Wahr' : 'Falsch';
  }
  
  if (Array.isArray(answer)) {
    return answer.join(', ');
  }
  
  if (typeof answer === 'object' && 'x' in answer && 'y' in answer) {
    return `(${answer.x.toFixed(1)}, ${answer.y.toFixed(1)})`;
  }
  
  return String(answer);
};
