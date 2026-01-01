/**
 * usePlayerSession Hook - Battle.Net Quiz Platform
 * 
 * Custom hook that encapsulates ALL player session logic.
 * Extracts state management, WebSocket handling, and business logic
 * from PlayerSessionPage to follow Single Responsibility Principle.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Player, LeaderboardEntry } from '../services/api';
import { useWebSocket } from './useWebSocket';
import { GameState } from '../services/websocket';

/** Player session state */
export interface PlayerSessionState {
  // Core data
  sessionId: string | undefined;
  playerId: string | null;
  player: Player | null;
  gameState: GameState | null;
  
  // Answer state
  answer: string;
  hasAnswered: boolean;
  
  // UI state
  loading: boolean;
  error: string;
  isConnected: boolean;
  
  // Derived data
  currentScore: number;
  leaderboardEntries: LeaderboardEntry[];
  currentQuestion: GameState['current_question'] | null;
  questionVisible: boolean;
  imageVisible: boolean;
  isInputLocked: boolean;
  buzzerWinner: GameState['buzzer_winner'] | null;
}

/** Player session actions */
export interface PlayerSessionActions {
  handleAnswerChange: (newAnswer: string) => void;
  handleSubmitAnswer: () => void;
  handleBuzzerPress: () => void;
  handleLeave: () => void;
}

/** Hook return type */
export interface UsePlayerSessionReturn extends PlayerSessionState, PlayerSessionActions {}

/**
 * Custom hook for player session management
 * Extracts ALL logic from PlayerSessionPage
 */
export const usePlayerSession = (): UsePlayerSessionReturn => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const playerId = sessionId ? localStorage.getItem(`player_id_${sessionId}`) : null;

  // Core state
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [answer, setAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // WebSocket connection
  const {
    joinSession: wsJoinSession,
    updateAnswer: wsUpdateAnswer,
    submitAnswer,
    pressBuzzer,
    isConnected,
  } = useWebSocket({
    onConnected: () => {
      if (sessionId && playerId && player) {
        wsJoinSession(sessionId, parseInt(playerId), player.name, false);
      }
    },
    onGameStateUpdated: (data) => {
      setGameState(data.game_state);
      // Sync answered status from server
      const myPlayerData = data.game_state.players?.[playerId ?? ''];
      if (myPlayerData) {
        setHasAnswered(myPlayerData.answered ?? false);
      }
    },
    onBuzzerPressed: (data) => {
      console.log('Buzzer pressed:', data);
    },
  });

  // Load initial player data
  useEffect(() => {
    const loadPlayer = async () => {
      if (!sessionId || !playerId) {
        navigate('/');
        return;
      }

      try {
        const data = await api.players.get(sessionId, parseInt(playerId));
        setPlayer(data);
        localStorage.setItem(`player_name_${sessionId}`, data.name);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load player';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadPlayer();
  }, [sessionId, playerId, navigate]);

  // Reconnect when connection established
  useEffect(() => {
    if (isConnected && sessionId && playerId && player) {
      wsJoinSession(sessionId, parseInt(playerId), player.name, false);
    }
  }, [isConnected, sessionId, playerId, player, wsJoinSession]);

  // Reset answer when question changes
  useEffect(() => {
    const questionId = gameState?.current_question?.id;
    if (questionId) {
      setAnswer('');
      setHasAnswered(false);
    }
  }, [gameState?.current_question?.id]);

  // Keyboard handler for spacebar buzzer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const questionType = gameState?.current_question?.type?.toLowerCase().replace(/-/g, '_');
      if (e.code === 'Space' && e.target === document.body && questionType === 'buzzer') {
        e.preventDefault();
        handleBuzzerPress();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  // === Derived state ===
  
  const currentScore = useMemo(() => {
    if (gameState && playerId && gameState.players[String(playerId)]) {
      return gameState.players[String(playerId)].score;
    }
    return player?.score ?? 0;
  }, [gameState, playerId, player]);

  const leaderboardEntries: LeaderboardEntry[] = useMemo(() => {
    if (!gameState?.leaderboard) return [];
    return gameState.leaderboard.map((entry, index) => ({
      player_id: entry.player_id,
      player_name: entry.name,
      score: entry.score,
      rank: index + 1,
    }));
  }, [gameState]);

  const currentQuestion = gameState?.current_question ?? null;
  const questionVisible = gameState?.question_visible ?? false;
  const imageVisible = gameState?.image_visible ?? false;
  const isInputLocked = gameState?.input_locked ?? true;
  const buzzerWinner = gameState?.buzzer_winner ?? null;

  // === Actions ===

  const handleBuzzerPress = useCallback(() => {
    if (!sessionId || !playerId || !player) return;
    if (gameState?.input_locked || gameState?.buzzer_winner) return;

    const questionType = gameState?.current_question?.type?.toLowerCase().replace(/-/g, '_');
    if (questionType !== 'buzzer') return;

    const questionId = gameState?.current_question?.id ?? 'buzzer';
    pressBuzzer(sessionId, questionId, parseInt(playerId), player.name);
  }, [sessionId, playerId, player, gameState, pressBuzzer]);

  const handleAnswerChange = useCallback((newAnswer: string) => {
    setAnswer(newAnswer);
    if (sessionId && playerId) {
      wsUpdateAnswer(sessionId, parseInt(playerId), newAnswer);
    }
  }, [sessionId, playerId, wsUpdateAnswer]);

  const handleSubmitAnswer = useCallback(() => {
    if (!sessionId || !playerId || !gameState?.current_question) return;

    if (hasAnswered) {
      submitAnswer(sessionId, gameState.current_question.id ?? 'q1', parseInt(playerId), answer, 0, false);
      setHasAnswered(false);
    } else {
      submitAnswer(sessionId, gameState.current_question.id ?? 'q1', parseInt(playerId), answer, 0, true);
      setHasAnswered(true);
    }
  }, [sessionId, playerId, gameState, hasAnswered, answer, submitAnswer]);

  const handleLeave = useCallback(() => {
    if (window.confirm('Session verlassen?')) {
      if (sessionId) {
        localStorage.removeItem(`player_id_${sessionId}`);
        localStorage.removeItem(`player_name_${sessionId}`);
      }
      navigate('/');
    }
  }, [sessionId, navigate]);

  return {
    // State
    sessionId,
    playerId,
    player,
    gameState,
    answer,
    hasAnswered,
    loading,
    error,
    isConnected,
    currentScore,
    leaderboardEntries,
    currentQuestion,
    questionVisible,
    imageVisible,
    isInputLocked,
    buzzerWinner,
    
    // Actions
    handleAnswerChange,
    handleSubmitAnswer,
    handleBuzzerPress,
    handleLeave,
  };
};

export default usePlayerSession;
