/**
 * Player Service - Battle.Net Quiz Platform
 * 
 * Service for player-related operations and state management.
 */

import { 
  Player, 
  PlayerGameState, 
  PlayerAnswer,
  LeaderboardEntry,
  createEmptyPlayerState,
} from '../../types';

/** Player name validation result */
export interface NameValidationResult {
  valid: boolean;
  error?: string;
  sanitized: string;
}

/** Player connection state */
export interface PlayerConnectionState {
  isConnected: boolean;
  lastSeen: number;
  reconnectAttempts: number;
}

/**
 * Player Service - Manages player operations
 */
export class PlayerService {
  private static readonly MIN_NAME_LENGTH = 1;
  private static readonly MAX_NAME_LENGTH = 50;
  private static readonly NAME_PATTERN = /^[a-zA-Z0-9äöüÄÖÜß\s\-_]+$/;
  
  /**
   * Validate and sanitize player name
   */
  validateName(name: string): NameValidationResult {
    const trimmed = name.trim();
    
    if (!trimmed) {
      return { valid: false, error: 'Name darf nicht leer sein', sanitized: '' };
    }
    
    if (trimmed.length < PlayerService.MIN_NAME_LENGTH) {
      return { 
        valid: false, 
        error: `Name muss mindestens ${PlayerService.MIN_NAME_LENGTH} Zeichen haben`, 
        sanitized: trimmed 
      };
    }
    
    if (trimmed.length > PlayerService.MAX_NAME_LENGTH) {
      return { 
        valid: false, 
        error: `Name darf maximal ${PlayerService.MAX_NAME_LENGTH} Zeichen haben`, 
        sanitized: trimmed.substring(0, PlayerService.MAX_NAME_LENGTH) 
      };
    }
    
    if (!PlayerService.NAME_PATTERN.test(trimmed)) {
      return { 
        valid: false, 
        error: 'Name enthält ungültige Zeichen', 
        sanitized: this.sanitizeName(trimmed) 
      };
    }
    
    return { valid: true, sanitized: trimmed };
  }
  
  /**
   * Sanitize player name - remove invalid characters
   */
  sanitizeName(name: string): string {
    return name
      .trim()
      .replace(/[^a-zA-Z0-9äöüÄÖÜß\s\-_]/g, '')
      .substring(0, PlayerService.MAX_NAME_LENGTH);
  }
  
  /**
   * Generate a random player name
   */
  generateRandomName(): string {
    const adjectives = ['Schnell', 'Klug', 'Mutig', 'Flink', 'Stark'];
    const nouns = ['Fuchs', 'Adler', 'Tiger', 'Wolf', 'Löwe'];
    const number = Math.floor(Math.random() * 100);
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adj}er${noun}${number}`;
  }
  
  /**
   * Create player game state from API player
   */
  createGameState(player: Player): PlayerGameState {
    return {
      id: player.id,
      name: player.name,
      score: player.score,
      connected: player.connected,
      answered: false,
      locked_in: false,
      current_answer: '',
    };
  }
  
  /**
   * Create empty player state
   */
  createEmpty(id: number, name: string): PlayerGameState {
    return createEmptyPlayerState(id, name);
  }
  
  /**
   * Sort players by score (descending)
   */
  sortByScore(players: PlayerGameState[]): PlayerGameState[] {
    return [...players].sort((a, b) => b.score - a.score);
  }
  
  /**
   * Convert player states to leaderboard entries
   */
  toLeaderboard(players: PlayerGameState[]): LeaderboardEntry[] {
    return this.sortByScore(players).map((player, index) => ({
      player_id: player.id,
      player_name: player.name,
      score: player.score,
      rank: index + 1,
    }));
  }
  
  /**
   * Find player by ID in game state
   */
  findById(
    players: Record<string, PlayerGameState>, 
    playerId: number
  ): PlayerGameState | undefined {
    return players[String(playerId)];
  }
  
  /**
   * Find player by name in game state
   */
  findByName(
    players: Record<string, PlayerGameState>, 
    name: string
  ): PlayerGameState | undefined {
    const normalized = name.toLowerCase().trim();
    return Object.values(players).find(
      p => p.name.toLowerCase().trim() === normalized
    );
  }
  
  /**
   * Get connected players
   */
  getConnected(players: Record<string, PlayerGameState>): PlayerGameState[] {
    return Object.values(players).filter(p => p.connected);
  }
  
  /**
   * Get players who have answered
   */
  getAnswered(players: Record<string, PlayerGameState>): PlayerGameState[] {
    return Object.values(players).filter(p => p.answered);
  }
  
  /**
   * Calculate player's current rank
   */
  calculateRank(
    playerId: number, 
    players: Record<string, PlayerGameState>
  ): number {
    const sorted = Object.values(players).sort((a, b) => b.score - a.score);
    const index = sorted.findIndex(p => p.id === playerId);
    return index === -1 ? sorted.length : index + 1;
  }
  
  /**
   * Format player answer for display
   */
  formatAnswer(answer: string, questionType: string): string {
    if (!answer) return '—';
    
    // Format based on question type
    switch (questionType.toLowerCase().replace(/-/g, '_')) {
      case 'true_false':
        return answer.toLowerCase() === 'true' ? 'Wahr' : 'Falsch';
      case 'hotspot':
        // Format "x,y" to "(x%, y%)"
        const [x, y] = answer.split(',').map(parseFloat);
        if (!isNaN(x) && !isNaN(y)) {
          return `(${x.toFixed(0)}%, ${y.toFixed(0)}%)`;
        }
        return answer;
      case 'sorting':
        // Show as numbered list
        try {
          const items = JSON.parse(answer);
          if (Array.isArray(items)) {
            return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
          }
        } catch {
          // Not JSON, return as-is
        }
        return answer;
      default:
        return answer;
    }
  }
  
  /**
   * Store player ID in localStorage
   */
  storePlayerId(sessionId: string, playerId: number): void {
    localStorage.setItem(`player_id_${sessionId}`, String(playerId));
  }
  
  /**
   * Get stored player ID from localStorage
   */
  getStoredPlayerId(sessionId: string): number | null {
    const stored = localStorage.getItem(`player_id_${sessionId}`);
    return stored ? parseInt(stored, 10) : null;
  }
  
  /**
   * Store player name in localStorage
   */
  storePlayerName(sessionId: string, name: string): void {
    localStorage.setItem(`player_name_${sessionId}`, name);
  }
  
  /**
   * Get stored player name from localStorage
   */
  getStoredPlayerName(sessionId: string): string | null {
    return localStorage.getItem(`player_name_${sessionId}`);
  }
  
  /**
   * Clear stored player data for a session
   */
  clearStoredPlayer(sessionId: string): void {
    localStorage.removeItem(`player_id_${sessionId}`);
    localStorage.removeItem(`player_name_${sessionId}`);
  }
}

/** Singleton instance */
export const playerService = new PlayerService();

export default PlayerService;
