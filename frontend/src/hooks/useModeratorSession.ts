/**
 * useModeratorSession Hook - Battle.Net Quiz Platform
 * 
 * Custom hook that encapsulates ALL moderator session logic.
 * Extracts state management, WebSocket handling, and business logic
 * from ModeratorSessionPage to follow Single Responsibility Principle.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Session } from '../services/api';
import { useWebSocket } from './useWebSocket';
import { GameState } from '../services/websocket';

/** Question type from catalog */
export interface QuizQuestion {
  id?: string;
  type: string;
  text: string;
  points?: number;
  image?: string;
  options?: string[];
  correctAnswer?: string | number | string[];
  sortingItems?: string[];
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  sliderUnit?: string;
  tolerance?: number;
}

/** Player derived from game state */
export interface ModeratorPlayer {
  id: number;
  name: string;
  score: number;
  connected: boolean;
  answered: boolean;
  locked_in: boolean;
  current_answer: string;
}

/** Moderator session state */
export interface ModeratorSessionState {
  // Core data
  sessionId: string | undefined;
  moderatorToken: string | null;
  session: Session | null;
  gameState: GameState | null;
  
  // Questions
  questions: QuizQuestion[];
  currentQuestion: GameState['current_question'] | null;
  currentQuestionIndex: number;
  originalQuestion: QuizQuestion | null;
  nextQuestion: QuizQuestion | null;
  
  // Players
  players: ModeratorPlayer[];
  connectedCount: number;
  
  // UI state
  loading: boolean;
  error: string;
  isConnected: boolean;
  timerValue: number;
  hoveredPlayerId: number | null;
  
  // Game state shortcuts
  questionVisible: boolean;
  imageVisible: boolean;
  inputLocked: boolean;
  buzzerWinner: GameState['buzzer_winner'] | null;
  timerRunning: boolean;
  currentTimer: number | null;
  
  // Team mode
  isTeamMode: boolean;
  teams: Array<{ id: string; name: string; color: string; score: number; memberCount: number }>;
}

/** Moderator session actions */
export interface ModeratorSessionActions {
  // Question navigation
  handleStartQuestion: (index: number) => void;
  handleNextQuestion: () => void;
  handlePrevQuestion: () => void;
  
  // Question visibility
  handleRevealQuestion: () => void;
  handleToggleImage: () => void;
  handleToggleBuzzerLock: () => void;
  
  // Scoring
  handleScoreChange: (playerId: number, delta: number) => void;
  handleBuzzerCorrect: (playerId: number) => void;
  handleBuzzerCorrectAndNext: (playerId: number) => void;
  handleBuzzerWrong: (playerId: number) => void;
  
  // Timer
  handleTimerChange: (delta: number) => void;
  handleSetTimer: () => void;
  
  // Player hover
  setHoveredPlayerId: (id: number | null) => void;
  
  // Session
  reloadSession: () => Promise<void>;
  
  // Team mode actions
  handleSelectActivePlayers: () => void;
  handleTeamScoreChange: (teamId: string, delta: number) => void;
}

/** Hook return type */
export interface UseModeratorSessionReturn extends ModeratorSessionState, ModeratorSessionActions {}

/** Shuffle array using Fisher-Yates algorithm */
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Custom hook for moderator session management
 * Extracts ALL session logic from ModeratorSessionPage
 */
export const useModeratorSession = (): UseModeratorSessionReturn => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const moderatorToken = sessionId ? localStorage.getItem(`moderator_token_${sessionId}`) : null;

  // Core state
  const [session, setSession] = useState<Session | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Questions state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [timerValue, setTimerValue] = useState(30);
  const [hoveredPlayerId, setHoveredPlayerId] = useState<number | null>(null);

  // WebSocket connection
  const {
    joinSession: wsJoinSession,
    startQuestion,
    endQuestion,
    revealQuestion,
    toggleImageVisibility,
    updateScore,
    setTimer,
    toggleInputLock,
    awardPointsCorrect,
    awardPointsWrong,
    isConnected,
    selectActivePlayers: wsSelectActivePlayers,
    updateTeamScore: wsUpdateTeamScore,
  } = useWebSocket({
    onConnected: () => {
      if (sessionId) {
        wsJoinSession(sessionId, undefined, 'moderator', true);
      }
    },
    onGameStateUpdated: (data) => {
      setGameState(data.game_state);
    },
    onBuzzerPressed: (data) => {
      console.log('Buzzer pressed by:', data.player_name);
    },
    onAnswerSubmitted: (data) => {
      console.log('Answer submitted by player:', data.player_id);
    },
  });

  // Load initial session data
  const loadSession = useCallback(async () => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    if (!moderatorToken) {
      navigate('/');
      return;
    }

    try {
      const data = await api.sessions.get(sessionId);
      setSession(data);

      // Load questions from question_catalog if available
      if (data.question_catalog) {
        let catalogQuestions: QuizQuestion[] = [];

        if (Array.isArray(data.question_catalog.questions)) {
          catalogQuestions = data.question_catalog.questions;
        } else if (data.question_catalog.questions?.questions) {
          catalogQuestions = data.question_catalog.questions.questions;
        }

        setQuestions(catalogQuestions);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load session';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, moderatorToken, navigate]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // === Derived state ===
  
  const players: ModeratorPlayer[] = useMemo(() => {
    if (!gameState?.players) return [];
    return Object.entries(gameState.players).map(([id, data]) => ({
      id: parseInt(id),
      name: data.name,
      score: data.score,
      connected: data.connected,
      answered: data.answered,
      locked_in: data.locked_in ?? false,
      current_answer: data.current_answer ?? '',
    }));
  }, [gameState]);

  const connectedCount = useMemo(() => 
    players.filter((p) => p.connected).length, 
    [players]
  );

  const currentQuestion = gameState?.current_question ?? null;
  const currentQuestionIndex = gameState?.current_question_index ?? -1;

  // Get the original question from catalog for correct answer display
  const originalQuestion = useMemo(() => {
    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      return questions[currentQuestionIndex];
    }
    return currentQuestion as QuizQuestion | null;
  }, [currentQuestionIndex, questions, currentQuestion]);

  // Get next question info for preview
  const nextQuestion = useMemo(() => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= 0 && nextIndex < questions.length) {
      return questions[nextIndex];
    }
    return null;
  }, [currentQuestionIndex, questions]);

  // Game state shortcuts
  const questionVisible = gameState?.question_visible ?? false;
  const imageVisible = gameState?.image_visible ?? false;
  const inputLocked = gameState?.input_locked ?? true;
  const buzzerWinner = gameState?.buzzer_winner ?? null;
  const timerRunning = gameState?.timer_running ?? false;
  const currentTimer = gameState?.timer ?? null;
  
  // Team mode state
  const isTeamMode = gameState?.team_mode ?? false;
  const teams = useMemo(() => {
    if (!gameState?.teams) return [];
    return Object.entries(gameState.teams).map(([id, data]) => ({
      id,
      name: data.name,
      color: data.color,
      score: data.score,
      memberCount: data.member_ids.length,
    }));
  }, [gameState?.teams]);

  // === Actions ===

  const handleStartQuestion = useCallback((index: number) => {
    if (!sessionId || index < 0 || index >= questions.length) return;
    const question = questions[index];

    // Prepare question for players
    const preparedQuestion: Record<string, unknown> = { ...question };

    // Map slider properties for player consumption
    if (question.type === 'slider') {
      preparedQuestion.min = question.sliderMin ?? 0;
      preparedQuestion.max = question.sliderMax ?? 100;
      preparedQuestion.step = question.sliderStep ?? 1;
      preparedQuestion.unit = question.sliderUnit ?? '';
    }

    // Shuffle sorting items for players
    if (question.type === 'sorting' && question.sortingItems) {
      preparedQuestion.sortingItems = shuffleArray(question.sortingItems);
    }

    startQuestion(sessionId, question.id || `q${index}`, preparedQuestion, index, timerValue);
  }, [sessionId, questions, timerValue, startQuestion]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      handleStartQuestion(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, questions.length, handleStartQuestion]);

  const handlePrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      handleStartQuestion(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex, handleStartQuestion]);

  const handleRevealQuestion = useCallback(() => {
    if (!sessionId) return;
    revealQuestion(sessionId, !gameState?.question_visible);
  }, [sessionId, gameState?.question_visible, revealQuestion]);

  const handleToggleImage = useCallback(() => {
    if (!sessionId) return;
    toggleImageVisibility(sessionId, !gameState?.image_visible);
  }, [sessionId, gameState?.image_visible, toggleImageVisibility]);

  const handleToggleBuzzerLock = useCallback(() => {
    if (!sessionId) return;
    toggleInputLock(sessionId, !gameState?.input_locked);
  }, [sessionId, gameState?.input_locked, toggleInputLock]);

  const handleBuzzerCorrect = useCallback((playerId: number) => {
    if (!sessionId) return;
    const points = currentQuestion?.points || 10;
    awardPointsCorrect(sessionId, playerId, points);
  }, [sessionId, currentQuestion?.points, awardPointsCorrect]);

  const handleBuzzerCorrectAndNext = useCallback((playerId: number) => {
    if (!sessionId) return;
    const points = currentQuestion?.points || 10;
    awardPointsCorrect(sessionId, playerId, points);
    // Move to next question after a short delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        handleStartQuestion(currentQuestionIndex + 1);
      }
    }, 300);
  }, [sessionId, currentQuestion?.points, currentQuestionIndex, questions.length, awardPointsCorrect, handleStartQuestion]);

  const handleBuzzerWrong = useCallback((playerId: number) => {
    if (!sessionId) return;
    awardPointsWrong(sessionId, playerId, 1);
  }, [sessionId, awardPointsWrong]);

  const handleScoreChange = useCallback((playerId: number, delta: number) => {
    if (!sessionId) return;
    updateScore(sessionId, playerId, delta);
  }, [sessionId, updateScore]);

  const handleTimerChange = useCallback((delta: number) => {
    const newValue = Math.max(5, Math.min(300, timerValue + delta));
    setTimerValue(newValue);
  }, [timerValue]);

  const handleSetTimer = useCallback(() => {
    if (!sessionId) return;
    setTimer(sessionId, timerValue);
  }, [sessionId, timerValue, setTimer]);

  const reloadSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await api.sessions.get(sessionId);
      setSession(data);
      if (data.question_catalog?.questions) {
        const catalogQuestions = data.question_catalog.questions.questions || data.question_catalog.questions;
        setQuestions(Array.isArray(catalogQuestions) ? catalogQuestions : []);
      }
    } catch (err) {
      console.error('Failed to reload session:', err);
    }
  }, [sessionId]);

  // Team mode actions
  const handleSelectActivePlayers = useCallback(() => {
    if (!sessionId) return;
    wsSelectActivePlayers(sessionId);
  }, [sessionId, wsSelectActivePlayers]);

  const handleTeamScoreChange = useCallback((teamId: string, delta: number) => {
    if (!sessionId) return;
    wsUpdateTeamScore(sessionId, teamId, delta);
  }, [sessionId, wsUpdateTeamScore]);

  return {
    // State
    sessionId,
    moderatorToken,
    session,
    gameState,
    questions,
    currentQuestion,
    currentQuestionIndex,
    originalQuestion,
    nextQuestion,
    players,
    connectedCount,
    loading,
    error,
    isConnected,
    timerValue,
    hoveredPlayerId,
    questionVisible,
    imageVisible,
    inputLocked,
    buzzerWinner,
    timerRunning,
    currentTimer,
    isTeamMode,
    teams,
    
    // Actions
    handleStartQuestion,
    handleNextQuestion,
    handlePrevQuestion,
    handleRevealQuestion,
    handleToggleImage,
    handleToggleBuzzerLock,
    handleScoreChange,
    handleBuzzerCorrect,
    handleBuzzerCorrectAndNext,
    handleBuzzerWrong,
    handleTimerChange,
    handleSetTimer,
    setHoveredPlayerId,
    reloadSession,
    handleSelectActivePlayers,
    handleTeamScoreChange,
  };
};

export default useModeratorSession;
