/**
 * useTimer Hook - Battle.Net Quiz Platform
 * 
 * Hook for managing countdown timer with urgency detection.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/** Timer state */
export interface TimerState {
  /** Remaining time in seconds */
  remaining: number;
  /** Total time in seconds */
  total: number;
  /** Whether timer is running */
  isRunning: boolean;
  /** Whether timer has finished */
  isFinished: boolean;
  /** Whether timer is in urgent state (low time) */
  isUrgent: boolean;
  /** Progress percentage (0-100) */
  progress: number;
}

/** Timer hook options */
export interface UseTimerOptions {
  /** Initial duration in seconds */
  duration?: number;
  /** Auto-start timer */
  autoStart?: boolean;
  /** Threshold for urgent state (seconds) */
  urgentThreshold?: number;
  /** Callback when timer finishes */
  onFinish?: () => void;
  /** Callback on each tick */
  onTick?: (remaining: number) => void;
}

/** Timer hook return type */
export interface UseTimerReturn extends TimerState {
  /** Start the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Reset the timer */
  reset: (newDuration?: number) => void;
  /** Set remaining time directly */
  setRemaining: (time: number) => void;
  /** Formatted time string (MM:SS) */
  formatted: string;
}

/**
 * Hook for countdown timer
 */
export const useTimer = (options: UseTimerOptions = {}): UseTimerReturn => {
  const {
    duration = 0,
    autoStart = false,
    urgentThreshold = 5,
    onFinish,
    onTick,
  } = options;
  
  const [remaining, setRemaining] = useState(duration);
  const [total, setTotal] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  
  // Refs for callbacks to avoid stale closures
  const onFinishRef = useRef(onFinish);
  const onTickRef = useRef(onTick);
  
  useEffect(() => {
    onFinishRef.current = onFinish;
    onTickRef.current = onTick;
  }, [onFinish, onTick]);
  
  // Timer interval
  useEffect(() => {
    if (!isRunning || remaining <= 0) return;
    
    const interval = setInterval(() => {
      setRemaining(prev => {
        const newTime = Math.max(0, prev - 1);
        
        // Call onTick callback
        if (onTickRef.current) {
          onTickRef.current(newTime);
        }
        
        // Check if finished
        if (newTime === 0) {
          setIsRunning(false);
          if (onFinishRef.current) {
            onFinishRef.current();
          }
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, remaining]);
  
  // Computed values
  const isFinished = remaining === 0 && total > 0;
  const isUrgent = remaining > 0 && remaining <= urgentThreshold;
  const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;
  
  const formatted = useMemo(() => {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [remaining]);
  
  // Actions
  const start = useCallback(() => {
    if (remaining > 0) {
      setIsRunning(true);
    }
  }, [remaining]);
  
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);
  
  const reset = useCallback((newDuration?: number) => {
    const duration = newDuration ?? total;
    setRemaining(duration);
    setTotal(duration);
    setIsRunning(false);
  }, [total]);
  
  const setRemainingTime = useCallback((time: number) => {
    setRemaining(Math.max(0, time));
    if (time > total) {
      setTotal(time);
    }
  }, [total]);
  
  return {
    remaining,
    total,
    isRunning,
    isFinished,
    isUrgent,
    progress,
    start,
    pause,
    reset,
    setRemaining: setRemainingTime,
    formatted,
  };
};

/**
 * Hook for syncing timer with WebSocket events
 */
export const useSyncedTimer = (
  serverRemaining: number | null,
  options: Omit<UseTimerOptions, 'duration' | 'autoStart'> = {}
): UseTimerReturn => {
  const timer = useTimer({
    ...options,
    duration: serverRemaining ?? 0,
    autoStart: false,
  });
  
  // Sync with server time
  useEffect(() => {
    if (serverRemaining !== null && serverRemaining > 0) {
      timer.setRemaining(serverRemaining);
      timer.start();
    } else if (serverRemaining === null) {
      timer.pause();
    }
  }, [serverRemaining]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return timer;
};

/**
 * Format seconds to display string
 */
export const formatTime = (seconds: number): string => {
  if (seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calculate timer urgency level
 */
export const getTimerUrgency = (
  remaining: number,
  total: number
): 'normal' | 'warning' | 'urgent' => {
  if (remaining <= 0) return 'normal';
  
  const percentRemaining = (remaining / total) * 100;
  
  if (percentRemaining <= 10 || remaining <= 3) {
    return 'urgent';
  }
  if (percentRemaining <= 25 || remaining <= 10) {
    return 'warning';
  }
  return 'normal';
};

export default useTimer;
