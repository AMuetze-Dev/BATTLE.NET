/**
 * Hooks Index - Battle.Net Quiz Platform
 * 
 * Central export for all custom hooks.
 */

// Theme
export { useTheme } from './useTheme';
export type { UseThemeReturn } from './useTheme';

// Game State
export { useGameState, useGameStateSelector } from './useGameState';
export type { UseGameStateReturn } from './useGameState';

// Player
export { usePlayer, useLeaderboard, usePlayerScore } from './usePlayer';
export type { 
  UsePlayerOptions, 
  UsePlayerReturn,
} from './usePlayer';

// Timer
export { useTimer, useSyncedTimer, formatTime, getTimerUrgency } from './useTimer';
export type { 
  TimerState, 
  UseTimerOptions, 
  UseTimerReturn,
} from './useTimer';

// Buzzer
export { useBuzzer, formatReactionTime, getBuzzerStateClass } from './useBuzzer';
export type { 
  BuzzerState, 
  UseBuzzerOptions, 
  UseBuzzerReturn,
} from './useBuzzer';

// Session Hooks
export { usePlayerSession } from './usePlayerSession';
export type { 
  PlayerSessionState, 
  PlayerSessionActions, 
  UsePlayerSessionReturn,
} from './usePlayerSession';

export { useModeratorSession } from './useModeratorSession';
export type { 
  QuizQuestion,
  ModeratorPlayer,
  ModeratorSessionState, 
  ModeratorSessionActions, 
  UseModeratorSessionReturn,
} from './useModeratorSession';

export { useQuizUpload } from './useQuizUpload';
export type { 
  QuizUploadState, 
  QuizUploadActions, 
  UseQuizUploadReturn,
  UseQuizUploadOptions,
} from './useQuizUpload';

// Common hooks (existing utilities)
export {
  useLocalStorage,
  useDebounce,
  useIsMounted,
  useInterval,
  usePrevious,
  useAsync,
  useWindowSize,
  useMediaQuery,
  useFocusTrap,
} from './useCommon';
export { useWebSocket } from './useWebSocket';
