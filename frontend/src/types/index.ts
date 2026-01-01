/**
 * Central Type Exports - Battle.Net Quiz Platform
 * 
 * Re-exports all types from a single entry point.
 * Import from '@/types' instead of individual files.
 */

// Question types
export type {
  QuestionType,
  NormalizedQuestionType,
  BaseQuestion,
  TextQuestion,
  NumberQuestion,
  SliderQuestion,
  MultipleChoiceOption,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  BuzzerQuestion,
  HotspotQuestion,
  SortingItem,
  SortingQuestion,
  Question,
  QuestionDTO,
  QuestionDisplayState,
} from './question.types';

export {
  isTextQuestion,
  isNumberQuestion,
  isSliderQuestion,
  isMultipleChoiceQuestion,
  isTrueFalseQuestion,
  isBuzzerQuestion,
  isHotspotQuestion,
  isSortingQuestion,
  normalizeQuestionType,
  getQuestionTypeLabel,
  getQuestionTypeIcon,
} from './question.types';

// Player types
export type {
  PlayerAnswerValue,
  Player,
  PlayerGameState,
  PlayerAnswer,
  PlayerScoreUpdate,
  LeaderboardEntry,
  LeaderboardResponse,
  PlayerJoinRequest,
  PlayerJoinResponse,
  BuzzerPressEvent,
  BuzzerWinner,
  PlayerStats,
} from './player.types';

export {
  createEmptyPlayerState,
  calculateRank,
  formatPlayerAnswer,
} from './player.types';

// Session types
export type {
  SessionStatus,
  Session,
  QuestionCatalog,
  SessionCreateRequest,
  SessionCreateResponse,
  SessionJoinInfo,
  SessionStats,
  QuizUploadResult,
  SessionEventType,
  SessionEvent,
} from './session.types';

export {
  isValidSessionId,
  generateSessionId,
  formatSessionDuration,
} from './session.types';

// Game state types
export type {
  GameStatus,
  TimerState,
  GameState,
  GameStateUpdate,
  QuestionStartEvent,
  QuestionEndEvent,
  TimerEvent,
  ScoreUpdateEvent,
} from './game.types';

export {
  createEmptyGameState,
  isGameActive,
  canSubmitAnswer,
  canPressBuzzer,
  getConnectedPlayerCount,
  getAnsweredPlayerCount,
  formatTimer,
  isTimerUrgent,
} from './game.types';

// Team types
export type {
  GameMode,
  TeamConfigType,
  Team,
  TeamMember,
  TeamConfig,
  TeamDefinition,
  TeamJoinRequest,
  TeamGameState,
  TeamState,
  TeamLeaderboardEntry,
} from './team.types';

export {
  TEAM_COLORS,
  DEFAULT_TEAMS,
  createDefaultTeamConfig,
  createTeamDefinition,
  playerNeedsTeamSelection,
  getTeamById,
  calculateTeamScores,
} from './team.types';
