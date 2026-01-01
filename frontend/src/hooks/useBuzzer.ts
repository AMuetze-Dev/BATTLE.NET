/**
 * useBuzzer Hook - Battle.Net Quiz Platform
 * 
 * Hook for managing buzzer state and interactions.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { BuzzerWinner } from '../types';

/** Buzzer state */
export interface BuzzerState {
  /** Whether buzzer is enabled */
  isEnabled: boolean;
  /** Whether current player has pressed buzzer */
  hasPressed: boolean;
  /** Whether buzzer is locked (after first press) */
  isLocked: boolean;
  /** The buzzer winner info */
  winner: BuzzerWinner | null;
  /** Whether current player is the winner */
  isWinner: boolean;
  /** Time taken to press (if pressed) */
  reactionTime: number | null;
}

/** Buzzer hook options */
export interface UseBuzzerOptions {
  /** Current player ID */
  playerId?: number;
  /** Callback when buzzer is pressed */
  onPress?: () => void;
  /** Sound on press */
  playSound?: boolean;
}

/** Buzzer hook return type */
export interface UseBuzzerReturn extends BuzzerState {
  /** Press the buzzer */
  press: () => void;
  /** Enable the buzzer */
  enable: () => void;
  /** Disable the buzzer */
  disable: () => void;
  /** Reset the buzzer state */
  reset: () => void;
  /** Set winner from server */
  setWinner: (winner: BuzzerWinner | null) => void;
  /** Lock the buzzer */
  lock: () => void;
}

/**
 * Hook for buzzer functionality
 */
export const useBuzzer = (options: UseBuzzerOptions = {}): UseBuzzerReturn => {
  const { playerId, onPress, playSound = true } = options;
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPressed, setHasPressed] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [winner, setWinner] = useState<BuzzerWinner | null>(null);
  const [pressTime, setPressTime] = useState<number | null>(null);
  
  // Track when buzzer was enabled for reaction time calculation
  const enableTimeRef = useRef<number | null>(null);
  
  // Sound effect ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio
  useEffect(() => {
    if (playSound) {
      audioRef.current = new Audio('/sounds/buzzer.mp3');
      audioRef.current.preload = 'auto';
    }
    return () => {
      audioRef.current = null;
    };
  }, [playSound]);
  
  /**
   * Press the buzzer
   */
  const press = useCallback(() => {
    if (!isEnabled || isLocked || hasPressed) return;
    
    const now = Date.now();
    setHasPressed(true);
    setIsLocked(true);
    
    // Calculate reaction time
    if (enableTimeRef.current) {
      setPressTime(now - enableTimeRef.current);
    }
    
    // Play sound
    if (playSound && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore audio play errors
      });
    }
    
    // Call callback
    if (onPress) {
      onPress();
    }
  }, [isEnabled, isLocked, hasPressed, playSound, onPress]);
  
  /**
   * Enable the buzzer
   */
  const enable = useCallback(() => {
    setIsEnabled(true);
    setIsLocked(false);
    setHasPressed(false);
    setWinner(null);
    enableTimeRef.current = Date.now();
  }, []);
  
  /**
   * Disable the buzzer
   */
  const disable = useCallback(() => {
    setIsEnabled(false);
  }, []);
  
  /**
   * Lock the buzzer (after winner is determined)
   */
  const lock = useCallback(() => {
    setIsLocked(true);
  }, []);
  
  /**
   * Reset the buzzer state
   */
  const reset = useCallback(() => {
    setIsEnabled(false);
    setHasPressed(false);
    setIsLocked(false);
    setWinner(null);
    setPressTime(null);
    enableTimeRef.current = null;
  }, []);
  
  /**
   * Set winner from server
   */
  const setWinnerFromServer = useCallback((newWinner: BuzzerWinner | null) => {
    setWinner(newWinner);
    if (newWinner) {
      setIsLocked(true);
    }
  }, []);
  
  // Computed values
  const isWinner = useMemo(() => {
    if (!winner || playerId === undefined) return false;
    return winner.player_id === playerId;
  }, [winner, playerId]);
  
  const reactionTime = useMemo(() => {
    if (hasPressed && pressTime !== null) {
      return pressTime;
    }
    if (isWinner && winner?.reaction_time_ms) {
      return winner.reaction_time_ms;
    }
    return null;
  }, [hasPressed, pressTime, isWinner, winner]);
  
  return {
    isEnabled,
    hasPressed,
    isLocked,
    winner,
    isWinner,
    reactionTime,
    press,
    enable,
    disable,
    reset,
    setWinner: setWinnerFromServer,
    lock,
  };
};

/**
 * Format reaction time for display
 */
export const formatReactionTime = (ms: number | null): string => {
  if (ms === null) return '-';
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * Get buzzer state class name
 */
export const getBuzzerStateClass = (state: BuzzerState): string => {
  if (state.isWinner) return 'buzzer--winner';
  if (state.hasPressed) return 'buzzer--pressed';
  if (state.isLocked) return 'buzzer--locked';
  if (state.isEnabled) return 'buzzer--enabled';
  return 'buzzer--disabled';
};

export default useBuzzer;
