/**
 * useGameState Hook - Battle.Net Quiz Platform
 * 
 * Central hook for accessing and managing game state.
 * Provides reactive access to game state with selector support.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  GameState, 
  GameStatus,
  QuestionDTO,
  PlayerGameState,
  LeaderboardEntry,
  BuzzerWinner,
  createEmptyGameState,
  isGameActive,
  canSubmitAnswer,
  canPressBuzzer,
  getConnectedPlayerCount,
  getAnsweredPlayerCount,
} from '../types';

/** Selector function type for extracting specific state */
type GameStateSelector<T> = (state: GameState) => T;

/** Game state with computed properties */
export interface GameStateWithComputed extends GameState {
  // Computed properties
  isActive: boolean;
  canAnswer: boolean;
  canBuzz: boolean;
  connectedCount: number;
  answeredCount: number;
  progressPercent: number;
}

/** Type alias for hook return type */
export type UseGameStateReturn = GameStateWithComputed;

/**
 * Hook to manage game state with reactive updates
 */
export const useGameState = (initialSessionId: string = '') => {
  const [gameState, setGameState] = useState<GameState>(() => 
    createEmptyGameState(initialSessionId)
  );
  
  /**
   * Update game state from WebSocket event
   */
  const updateFromEvent = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);
  
  /**
   * Reset game state
   */
  const reset = useCallback((sessionId?: string) => {
    setGameState(createEmptyGameState(sessionId || initialSessionId));
  }, [initialSessionId]);
  
  /**
   * Update specific player state
   */
  const updatePlayer = useCallback((playerId: number, updates: Partial<PlayerGameState>) => {
    setGameState(prev => {
      const key = String(playerId);
      const existingPlayer = prev.players[key];
      if (!existingPlayer) return prev;
      
      return {
        ...prev,
        players: {
          ...prev.players,
          [key]: { ...existingPlayer, ...updates },
        },
      };
    });
  }, []);
  
  /**
   * Set current question
   */
  const setCurrentQuestion = useCallback((
    question: QuestionDTO | null, 
    index: number = -1
  ) => {
    setGameState(prev => ({
      ...prev,
      current_question: question,
      current_question_index: index,
      question_visible: false,
      image_visible: false,
    }));
  }, []);
  
  /**
   * Set question visibility
   */
  const setQuestionVisible = useCallback((visible: boolean) => {
    setGameState(prev => ({
      ...prev,
      question_visible: visible,
    }));
  }, []);
  
  /**
   * Set image visibility
   */
  const setImageVisible = useCallback((visible: boolean) => {
    setGameState(prev => ({
      ...prev,
      image_visible: visible,
    }));
  }, []);
  
  /**
   * Set input locked state
   */
  const setInputLocked = useCallback((locked: boolean) => {
    setGameState(prev => ({
      ...prev,
      input_locked: locked,
    }));
  }, []);
  
  /**
   * Set timer state
   */
  const setTimer = useCallback((value: number, running: boolean = true) => {
    setGameState(prev => ({
      ...prev,
      timer: value,
      timer_running: running,
    }));
  }, []);
  
  /**
   * Set buzzer winner
   */
  const setBuzzerWinner = useCallback((winner: BuzzerWinner | null) => {
    setGameState(prev => ({
      ...prev,
      buzzer_winner: winner,
    }));
  }, []);
  
  /**
   * Set game status
   */
  const setStatus = useCallback((status: GameStatus) => {
    setGameState(prev => ({
      ...prev,
      status,
    }));
  }, []);
  
  // Computed properties
  const computed = useMemo((): GameStateWithComputed => ({
    ...gameState,
    isActive: isGameActive(gameState),
    canAnswer: canSubmitAnswer(gameState),
    canBuzz: canPressBuzzer(gameState),
    connectedCount: getConnectedPlayerCount(gameState),
    answeredCount: getAnsweredPlayerCount(gameState),
    progressPercent: gameState.timer_duration > 0 
      ? ((gameState.timer_duration - gameState.timer) / gameState.timer_duration) * 100
      : 0,
  }), [gameState]);
  
  return {
    // State
    gameState: computed,
    
    // Raw state access
    rawState: gameState,
    
    // Setters
    updateFromEvent,
    reset,
    updatePlayer,
    setCurrentQuestion,
    setQuestionVisible,
    setImageVisible,
    setInputLocked,
    setTimer,
    setBuzzerWinner,
    setStatus,
    
    // Convenience getters
    currentQuestion: gameState.current_question,
    currentQuestionIndex: gameState.current_question_index,
    players: gameState.players,
    leaderboard: gameState.leaderboard,
    status: gameState.status,
    isPlaying: gameState.status === 'playing',
    isWaiting: gameState.status === 'waiting',
    isFinished: gameState.status === 'finished',
  };
};

/**
 * Selector hook for specific game state properties
 * Reduces re-renders by only updating when selected value changes
 */
export const useGameStateSelector = <T>(
  gameState: GameState,
  selector: GameStateSelector<T>
): T => {
  return useMemo(() => selector(gameState), [gameState, selector]);
};

export default useGameState;
