/**
 * React hook for WebSocket connection
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { wsClient, WebSocketEventHandlers } from '../services/websocket';

export const useWebSocket = (handlers: WebSocketEventHandlers = {}) => {
  const handlersRef = useRef(handlers);
  const [isConnected, setIsConnected] = useState(false);
  
  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);
  
  // Connect on mount and track connection state
  useEffect(() => {
    const wrappedHandlers: WebSocketEventHandlers = {
      ...handlersRef.current,
      onConnected: (data) => {
        handlersRef.current.onConnected?.(data);
      },
    };
    
    wsClient.connect(wrappedHandlers);
    
    // Set up connection state handler to track connect/disconnect
    wsClient.setConnectionStateHandler((connected) => {
      setIsConnected(connected);
    });
    
    return () => {
      wsClient.setConnectionStateHandler(null);
      wsClient.disconnect();
      setIsConnected(false);
    };
  }, []);
  
  const joinSession = useCallback(
    (sessionId: string, playerId?: number, playerName?: string, isModerator?: boolean) => {
      wsClient.joinSession(sessionId, playerId, playerName, isModerator);
    },
    []
  );
  
  const leaveSession = useCallback((sessionId: string, playerId?: number) => {
    wsClient.leaveSession(sessionId, playerId);
  }, []);
  
  const startGame = useCallback(
    (sessionId: string, questions: any[], quizTitle: string) => {
      wsClient.startGame(sessionId, questions, quizTitle);
    },
    []
  );
  
  const endGame = useCallback((sessionId: string) => {
    wsClient.endGame(sessionId);
  }, []);
  
  const startQuestion = useCallback(
    (sessionId: string, questionId: string, question: any, questionIndex: number, timeLimit: number) => {
      wsClient.startQuestion(sessionId, questionId, question, questionIndex, timeLimit);
    },
    []
  );
  
  const endQuestion = useCallback(
    (sessionId: string, questionId: string, correctAnswer?: any) => {
      wsClient.endQuestion(sessionId, questionId, correctAnswer);
    },
    []
  );
  
  const revealQuestion = useCallback((sessionId: string, visible?: boolean) => {
    wsClient.revealQuestion(sessionId, visible);
  }, []);
  
  const toggleImageVisibility = useCallback((sessionId: string, visible?: boolean) => {
    wsClient.toggleImageVisibility(sessionId, visible);
  }, []);
  
  const updateScore = useCallback(
    (sessionId: string, playerId: number, delta: number) => {
      wsClient.updateScore(sessionId, playerId, delta);
    },
    []
  );
  
  const setTimer = useCallback((sessionId: string, seconds: number) => {
    wsClient.setTimer(sessionId, seconds);
  }, []);
  
  const toggleInputLock = useCallback(
    (sessionId: string, locked: boolean) => {
      wsClient.toggleInputLock(sessionId, locked);
    },
    []
  );
  
  const updateAnswer = useCallback(
    (
      sessionId: string,
      playerId: number,
      answer: string
    ) => {
      wsClient.updateAnswer(sessionId, playerId, answer);
    },
    []
  );

  const submitAnswer = useCallback(
    (
      sessionId: string,
      questionId: string,
      playerId: number,
      answer: any,
      timeTaken: number,
      submitted: boolean = true
    ) => {
      wsClient.submitAnswer(sessionId, questionId, playerId, answer, timeTaken, submitted);
    },
    []
  );
  
  const pressBuzzer = useCallback(
    (sessionId: string, questionId: string, playerId: number, playerName: string) => {
      wsClient.pressBuzzer(sessionId, questionId, playerId, playerName, Date.now());
    },
    []
  );
  
  const lockIn = useCallback(
    (sessionId: string, playerId: number) => {
      wsClient.lockIn(sessionId, playerId);
    },
    []
  );
  
  const updateLeaderboard = useCallback(
    (sessionId: string, leaderboard: any[]) => {
      wsClient.updateLeaderboard(sessionId, leaderboard);
    },
    []
  );
  
  const toggleBuzzerLock = useCallback(
    (sessionId: string, locked: boolean) => {
      wsClient.toggleBuzzerLock(sessionId, locked);
    },
    []
  );
  
  const awardPointsCorrect = useCallback(
    (sessionId: string, playerId: number, points: number = 10) => {
      wsClient.awardPointsCorrect(sessionId, playerId, points);
    },
    []
  );
  
  const awardPointsWrong = useCallback(
    (sessionId: string, playerId: number, points: number = 1) => {
      wsClient.awardPointsWrong(sessionId, playerId, points);
    },
    []
  );
  
  const resetBuzzer = useCallback(
    (sessionId: string) => {
      wsClient.resetBuzzer(sessionId);
    },
    []
  );
  
  // Team mode methods
  const setupTeamMode = useCallback(
    (sessionId: string, teams: Array<{ id: string; name: string; color: string }>) => {
      wsClient.setupTeamMode(sessionId, teams);
    },
    []
  );
  
  const playerJoinTeam = useCallback(
    (sessionId: string, playerId: number, teamId: string) => {
      wsClient.playerJoinTeam(sessionId, playerId, teamId);
    },
    []
  );
  
  const selectActivePlayers = useCallback(
    (sessionId: string) => {
      wsClient.selectActivePlayers(sessionId);
    },
    []
  );
  
  const updateTeamScore = useCallback(
    (sessionId: string, teamId: string, delta: number) => {
      wsClient.updateTeamScore(sessionId, teamId, delta);
    },
    []
  );
  
  return {
    joinSession,
    leaveSession,
    startGame,
    endGame,
    startQuestion,
    endQuestion,
    revealQuestion,
    toggleImageVisibility,
    updateScore,
    setTimer,
    toggleInputLock,
    toggleBuzzerLock,
    awardPointsCorrect,
    awardPointsWrong,
    resetBuzzer,
    updateAnswer,
    submitAnswer,
    pressBuzzer,
    lockIn,
    updateLeaderboard,
    isConnected,
    // Team mode
    setupTeamMode,
    playerJoinTeam,
    selectActivePlayers,
    updateTeamScore,
  };
};
