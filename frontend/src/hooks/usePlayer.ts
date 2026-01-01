/**
 * usePlayer Hook - Battle.Net Quiz Platform
 * 
 * Hook for managing player state and interactions.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Player, 
  PlayerGameState, 
  LeaderboardEntry,
} from '../types';
import { playerService } from '../services/player';
import { api } from '../services/api';

/** Player hook options */
export interface UsePlayerOptions {
  sessionId: string;
  autoLoad?: boolean;
}

/** Player hook return type */
export interface UsePlayerReturn {
  // State
  player: Player | null;
  gameState: PlayerGameState | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadPlayer: (playerId: number) => Promise<void>;
  updateAnswer: (answer: string) => void;
  submitAnswer: () => void;
  withdrawAnswer: () => void;
  
  // Computed
  isConnected: boolean;
  hasAnswered: boolean;
  currentRank: number | null;
}

/**
 * Hook for managing current player state
 */
export const usePlayer = (options: UsePlayerOptions): UsePlayerReturn => {
  const { sessionId, autoLoad = true } = options;
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<PlayerGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  
  /**
   * Load player from API
   */
  const loadPlayer = useCallback(async (playerId: number) => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.players.get(sessionId, playerId);
      setPlayer(data);
      setGameState(playerService.createGameState(data));
      playerService.storePlayerName(sessionId, data.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load player';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);
  
  /**
   * Auto-load player on mount
   */
  useEffect(() => {
    if (!autoLoad || !sessionId) return;
    
    const storedPlayerId = playerService.getStoredPlayerId(sessionId);
    if (storedPlayerId) {
      loadPlayer(storedPlayerId);
    } else {
      setLoading(false);
    }
  }, [autoLoad, sessionId, loadPlayer]);
  
  /**
   * Update current answer (live update)
   */
  const updateAnswer = useCallback((answer: string) => {
    setCurrentAnswer(answer);
  }, []);
  
  /**
   * Submit answer
   */
  const submitAnswer = useCallback(() => {
    setHasAnswered(true);
  }, []);
  
  /**
   * Withdraw answer
   */
  const withdrawAnswer = useCallback(() => {
    setHasAnswered(false);
  }, []);
  
  /**
   * Sync game state from WebSocket updates
   */
  const syncFromGameState = useCallback((
    players: Record<string, PlayerGameState>
  ) => {
    if (!player) return;
    
    const myState = playerService.findById(players, player.id);
    if (myState) {
      setGameState(myState);
      setHasAnswered(myState.answered);
    }
  }, [player]);
  
  // Computed values
  const isConnected = player?.connected ?? false;
  const currentRank = useMemo(() => {
    if (!gameState) return null;
    // Rank would need full player list - return null for now
    return null;
  }, [gameState]);
  
  return {
    player,
    gameState,
    loading,
    error,
    loadPlayer,
    updateAnswer,
    submitAnswer,
    withdrawAnswer,
    isConnected,
    hasAnswered,
    currentRank,
  };
};

/**
 * Hook for leaderboard data
 */
export const useLeaderboard = (
  players: Record<string, PlayerGameState>,
  currentPlayerId?: number
): LeaderboardEntry[] => {
  return useMemo(() => {
    const entries = playerService.toLeaderboard(Object.values(players));
    
    // Mark current player
    if (currentPlayerId !== undefined) {
      return entries.map(entry => ({
        ...entry,
        is_current_player: entry.player_id === currentPlayerId,
      }));
    }
    
    return entries;
  }, [players, currentPlayerId]);
};

/**
 * Hook for player score with animation support
 */
export const usePlayerScore = (
  playerId: number,
  players: Record<string, PlayerGameState>
): { score: number; previousScore: number; isIncreasing: boolean } => {
  const [previousScore, setPreviousScore] = useState(0);
  
  const currentScore = useMemo(() => {
    const player = players[String(playerId)];
    return player?.score ?? 0;
  }, [players, playerId]);
  
  useEffect(() => {
    if (currentScore !== previousScore) {
      // Delay updating previous score for animation
      const timer = setTimeout(() => {
        setPreviousScore(currentScore);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentScore, previousScore]);
  
  return {
    score: currentScore,
    previousScore,
    isIncreasing: currentScore > previousScore,
  };
};

export default usePlayer;
