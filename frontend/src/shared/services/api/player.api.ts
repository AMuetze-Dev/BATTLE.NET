/**
 * Player API Service
 *
 * Single Responsibility: Player-related API operations.
 */
import { fetchAPI } from './api-client';

export interface Player {
	id: number;
	session_id: string;
	name: string;
	score: number;
	connected: boolean;
	joined_at: string;
	last_seen: string;
}

export const playerApi = {
	/**
	 * Create a new player in session
	 */
	create: async (sessionId: string, name: string): Promise<Player> => {
		return fetchAPI<Player>(`/sessions/${sessionId}/players`, {
			method: 'POST',
			body: JSON.stringify({ name }),
		});
	},

	/**
	 * List players in session
	 */
	list: async (sessionId: string, connectedOnly = false): Promise<Player[]> => {
		const query = connectedOnly ? '?connected_only=true' : '';
		return fetchAPI<Player[]>(`/sessions/${sessionId}/players${query}`);
	},

	/**
	 * Get player by ID
	 */
	get: async (sessionId: string, playerId: number): Promise<Player> => {
		return fetchAPI<Player>(`/sessions/${sessionId}/players/${playerId}`);
	},

	/**
	 * Update player score
	 */
	updateScore: async (sessionId: string, playerId: number, points: number, reason?: string): Promise<Player> => {
		return fetchAPI<Player>(`/sessions/${sessionId}/players/${playerId}/score`, {
			method: 'POST',
			body: JSON.stringify({ points, reason }),
		});
	},

	/**
	 * Update player connection status
	 */
	updateConnection: async (sessionId: string, playerId: number, connected: boolean): Promise<Player> => {
		return fetchAPI<Player>(`/sessions/${sessionId}/players/${playerId}/connection?connected=${connected}`, { method: 'POST' });
	},

	/**
	 * Reconnect player by name
	 */
	reconnect: async (sessionId: string, playerName: string): Promise<Player> => {
		return fetchAPI<Player>(`/sessions/${sessionId}/players/${playerName}/reconnect`);
	},
};
