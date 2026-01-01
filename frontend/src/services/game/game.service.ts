/**
 * Game Service - Battle.Net Quiz Platform
 * 
 * Central service for game state management and game logic.
 * Orchestrates question flow, timer, and player interactions.
 */

import { 
  GameState, 
  GameStatus,
  Question,
  QuestionDTO,
  PlayerGameState,
  LeaderboardEntry,
  BuzzerWinner,
  createEmptyGameState,
} from '../../types';
import { scoringService, ScoringResult } from './scoring.service';

/** Game configuration */
export interface GameConfig {
  defaultTimerDuration: number;
  autoLockAfterAnswer: boolean;
  showCorrectAnswerOnEnd: boolean;
  buzzerTimeout: number;
}

/** Default game configuration */
const DEFAULT_CONFIG: GameConfig = {
  defaultTimerDuration: 30,
  autoLockAfterAnswer: false,
  showCorrectAnswerOnEnd: true,
  buzzerTimeout: 5000,
};

/**
 * Game Service - Manages game state and logic
 */
export class GameService {
  private config: GameConfig;
  
  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Create initial game state for a session
   */
  createInitialState(sessionId: string): GameState {
    return createEmptyGameState(sessionId);
  }
  
  /**
   * Prepare question for player display
   * Handles special transformations like shuffling sorting items
   */
  prepareQuestionForPlayers(question: QuestionDTO): QuestionDTO {
    const prepared = { ...question };
    
    // Map slider properties for consistent naming
    if (question.type === 'slider') {
      prepared.min = question.sliderMin ?? question.min ?? 0;
      prepared.max = question.sliderMax ?? question.max ?? 100;
    }
    
    // Shuffle sorting items
    if (question.type === 'sorting' && question.sortingItems) {
      prepared.sortingItems = this.shuffleArray([...question.sortingItems]);
    }
    
    return prepared;
  }
  
  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * Calculate score for a player's answer
   */
  calculateScore(answer: unknown, question: Question): ScoringResult {
    return scoringService.calculate(answer, question);
  }
  
  /**
   * Build leaderboard from player states
   */
  buildLeaderboard(players: Record<string, PlayerGameState>): LeaderboardEntry[] {
    return Object.values(players)
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        player_id: player.id,
        player_name: player.name,
        score: player.score,
        rank: index + 1,
      }));
  }
  
  /**
   * Determine buzzer winner from press events
   */
  determineBuzzerWinner(
    presses: Array<{ player_id: number; player_name: string; timestamp: number }>
  ): BuzzerWinner | null {
    if (presses.length === 0) return null;
    
    // Sort by timestamp (earliest first)
    const sorted = [...presses].sort((a, b) => a.timestamp - b.timestamp);
    const winner = sorted[0];
    
    // Calculate reaction time (difference from first press)
    const reactionTime = sorted.length > 1 
      ? sorted[1].timestamp - winner.timestamp 
      : 0;
    
    return {
      player_id: winner.player_id,
      player_name: winner.player_name,
      reaction_time_ms: reactionTime,
    };
  }
  
  /**
   * Check if all connected players have answered
   */
  allPlayersAnswered(players: Record<string, PlayerGameState>): boolean {
    const connected = Object.values(players).filter(p => p.connected);
    return connected.every(p => p.answered);
  }
  
  /**
   * Get player count statistics
   */
  getPlayerStats(players: Record<string, PlayerGameState>): {
    total: number;
    connected: number;
    answered: number;
  } {
    const playerList = Object.values(players);
    return {
      total: playerList.length,
      connected: playerList.filter(p => p.connected).length,
      answered: playerList.filter(p => p.answered).length,
    };
  }
  
  /**
   * Format timer display
   */
  formatTimer(seconds: number): string {
    if (seconds < 0) return '0';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return String(secs);
  }
  
  /**
   * Check if timer is in urgent state (< 5 seconds)
   */
  isTimerUrgent(seconds: number): boolean {
    return seconds > 0 && seconds <= 5;
  }
  
  /**
   * Get game status label for display
   */
  getStatusLabel(status: GameStatus): string {
    const labels: Record<GameStatus, string> = {
      waiting: 'Warten auf Spieler',
      playing: 'Spiel läuft',
      paused: 'Pausiert',
      finished: 'Beendet',
    };
    return labels[status] || status;
  }
  
  /**
   * Validate if a question can be started
   */
  canStartQuestion(state: GameState, questionIndex: number, totalQuestions: number): boolean {
    return (
      state.status !== 'finished' &&
      questionIndex >= 0 &&
      questionIndex < totalQuestions
    );
  }
  
  /**
   * Get default timer duration from config
   */
  getDefaultTimerDuration(): number {
    return this.config.defaultTimerDuration;
  }
}

/** Singleton instance */
export const gameService = new GameService();

export default GameService;
