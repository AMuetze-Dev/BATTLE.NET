/**
 * Team Types - Battle.Net Quiz Platform
 *
 * Types for team management, team-based gameplay, and team scoring.
 */

/** Game mode for the quiz session */
export type GameMode = 'free-for-all' | 'team';

/** Team configuration type */
export type TeamConfigType = 'fixed' | 'dynamic';

/** Team entity */
export interface Team {
  id: string;
  name: string;
  color: string;
  members: TeamMember[];
  score: number;
}

/** Team member (player in a team) */
export interface TeamMember {
  playerId: number;
  playerName: string;
  connected: boolean;
  isActivePlayer?: boolean; // For input questions where one player is designated
}

/** Team configuration for quiz setup */
export interface TeamConfig {
  enabled: boolean;
  type: TeamConfigType;
  teams: TeamDefinition[];
  allowPlayerChoice: boolean; // Whether players can choose their team or are auto-assigned
  minPlayersPerTeam?: number;
  maxPlayersPerTeam?: number;
}

/** Team definition (before players join) */
export interface TeamDefinition {
  id: string;
  name: string;
  color: string;
}

/** Team join request from player */
export interface TeamJoinRequest {
  sessionId: string;
  playerId: number;
  teamId: string;
}

/** Team state in game */
export interface TeamGameState {
  teams: Record<string, TeamState>;
  activePlayersPerTeam: Record<string, number>; // teamId -> active player id for input questions
}

/** Individual team state during gameplay */
export interface TeamState {
  id: string;
  name: string;
  color: string;
  score: number;
  memberIds: number[];
  answeredCount: number;
  buzzedBy?: number; // Player ID who buzzed for the team
}

/** Team leaderboard entry */
export interface TeamLeaderboardEntry {
  teamId: string;
  teamName: string;
  teamColor: string;
  score: number;
  rank: number;
  memberCount: number;
  connectedCount: number;
}

/** Predefined team colors */
export const TEAM_COLORS = [
  { id: 'red', name: 'Rot', hex: '#E53935' },
  { id: 'blue', name: 'Blau', hex: '#1E88E5' },
  { id: 'green', name: 'Grün', hex: '#43A047' },
  { id: 'orange', name: 'Orange', hex: '#FB8C00' },
  { id: 'purple', name: 'Lila', hex: '#8E24AA' },
  { id: 'teal', name: 'Türkis', hex: '#00897B' },
  { id: 'pink', name: 'Pink', hex: '#D81B60' },
  { id: 'amber', name: 'Bernstein', hex: '#FFB300' },
] as const;

/** Default team definitions */
export const DEFAULT_TEAMS: TeamDefinition[] = [
  { id: 'team-1', name: 'Team Rot', color: '#E53935' },
  { id: 'team-2', name: 'Team Blau', color: '#1E88E5' },
];

/** Create default team config */
export const createDefaultTeamConfig = (): TeamConfig => ({
  enabled: false,
  type: 'fixed',
  teams: [...DEFAULT_TEAMS],
  allowPlayerChoice: true,
  minPlayersPerTeam: 1,
  maxPlayersPerTeam: undefined,
});

/** Generate a new team with a unique ID */
export const createTeamDefinition = (index: number): TeamDefinition => {
  const color = TEAM_COLORS[index % TEAM_COLORS.length];
  return {
    id: `team-${Date.now()}-${index}`,
    name: `Team ${color.name}`,
    color: color.hex,
  };
};

/** Check if a player needs to select a team */
export const playerNeedsTeamSelection = (
  teamConfig: TeamConfig | null,
  playerTeamId: string | null
): boolean => {
  if (!teamConfig?.enabled) return false;
  return playerTeamId === null;
};

/** Get team by ID */
export const getTeamById = (
  teams: TeamDefinition[],
  teamId: string
): TeamDefinition | undefined => {
  return teams.find((t) => t.id === teamId);
};

/** Calculate team scores from member scores */
export const calculateTeamScores = (
  teams: TeamDefinition[],
  players: Array<{ teamId?: string; score: number }>
): Record<string, number> => {
  const scores: Record<string, number> = {};
  
  for (const team of teams) {
    scores[team.id] = players
      .filter((p) => p.teamId === team.id)
      .reduce((sum, p) => sum + p.score, 0);
  }
  
  return scores;
};
