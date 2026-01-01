/**
 * useTeam Hook - Battle.Net Quiz Platform
 *
 * Custom hook for team-related state and operations.
 * Used by players to manage team membership and view team state.
 * Integrates with WebSocket game state for real-time updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { TeamDefinition, TeamConfig } from '../types/team.types';

export interface TeamState {
  id: string;
  name: string;
  color: string;
  score: number;
  memberCount: number;
  connectedCount: number;
}

export interface UseTeamProps {
  sessionId: string | null;
  playerId: number | null;
  enabled?: boolean;
  /** Game state from WebSocket (for real-time updates) */
  gameState?: {
    team_mode?: boolean;
    teams?: Record<string, { name: string; color: string; score: number; member_ids: string[] }>;
    active_players?: Record<string, string>;
  } | null;
}

export interface UseTeamReturn {
  // State
  teams: TeamState[];
  currentTeamId: string | null;
  currentTeam: TeamState | null;
  isActivePlayer: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  joinTeam: (teamId: string) => Promise<boolean>;
  leaveTeam: () => Promise<boolean>;
  refreshTeams: () => Promise<void>;
}

/**
 * Hook for team state management
 *
 * Provides:
 * - Team list with member counts
 * - Current player's team membership
 * - Active player status (for input questions)
 * - Join/leave team actions
 */
export const useTeam = ({
  sessionId,
  playerId,
  enabled = true,
  gameState,
}: UseTeamProps): UseTeamReturn => {
  const [teams, setTeams] = useState<TeamState[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [isActivePlayer, setIsActivePlayer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current team from list
  const currentTeam = teams.find((t) => t.id === currentTeamId) || null;

  // Sync teams from gameState when available
  useEffect(() => {
    if (!enabled || !gameState?.team_mode || !gameState.teams) return;

    const teamsList = Object.entries(gameState.teams).map(([id, data]) => ({
      id,
      name: data.name,
      color: data.color,
      score: data.score,
      memberCount: data.member_ids.length,
      connectedCount: data.member_ids.length, // Could be refined with connection status
    }));

    setTeams(teamsList);

    // Check if player is in a team
    if (playerId) {
      const playerIdStr = String(playerId);
      for (const [teamId, data] of Object.entries(gameState.teams)) {
        if (data.member_ids.includes(playerIdStr)) {
          setCurrentTeamId(teamId);
          break;
        }
      }
    }

    // Check active player status
    if (playerId && currentTeamId && gameState.active_players) {
      const activePlayerId = gameState.active_players[currentTeamId];
      setIsActivePlayer(activePlayerId === String(playerId));
    }
  }, [gameState, playerId, currentTeamId, enabled]);

  // Fetch teams for session (fallback when no gameState)
  const refreshTeams = useCallback(async () => {
    if (!sessionId || !enabled) return;
    // Skip if we have gameState teams
    if (gameState?.teams) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/teams`);
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      setTeams(
        data.map((t: any) => ({
          id: t.id,
          name: t.name,
          color: t.color,
          score: t.score,
          memberCount: t.member_count,
          connectedCount: t.connected_count,
        }))
      );
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Fehler beim Laden der Teams');
    } finally {
      setLoading(false);
    }
  }, [sessionId, enabled, gameState?.teams]);

  // Join a team
  const joinTeam = useCallback(
    async (teamId: string): Promise<boolean> => {
      if (!sessionId || !playerId) return false;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sessions/${sessionId}/teams/${teamId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player_id: playerId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Failed to join team');
        }

        setCurrentTeamId(teamId);
        // Store in localStorage for persistence
        localStorage.setItem(`player_team_${sessionId}`, teamId);
        await refreshTeams();
        return true;
      } catch (err: any) {
        console.error('Error joining team:', err);
        setError(err.message || 'Fehler beim Beitreten des Teams');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [sessionId, playerId, refreshTeams]
  );

  // Leave current team
  const leaveTeam = useCallback(async (): Promise<boolean> => {
    if (!sessionId || !playerId || !currentTeamId) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/teams/${currentTeamId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to leave team');
      }

      setCurrentTeamId(null);
      localStorage.removeItem(`player_team_${sessionId}`);
      await refreshTeams();
      return true;
    } catch (err) {
      console.error('Error leaving team:', err);
      setError('Fehler beim Verlassen des Teams');
      return false;
    } finally {
      setLoading(false);
    }
  }, [sessionId, playerId, currentTeamId, refreshTeams]);

  // Initial load
  useEffect(() => {
    if (sessionId && enabled) {
      // Check localStorage for existing team membership
      const storedTeamId = localStorage.getItem(`player_team_${sessionId}`);
      if (storedTeamId) {
        setCurrentTeamId(storedTeamId);
      }
      refreshTeams();
    }
  }, [sessionId, enabled, refreshTeams]);

  return {
    teams,
    currentTeamId,
    currentTeam,
    isActivePlayer,
    loading,
    error,
    joinTeam,
    leaveTeam,
    refreshTeams,
  };
};

export default useTeam;
