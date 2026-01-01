/**
 * Session API Service
 *
 * Single Responsibility: Session-related API operations.
 */
import { fetchAPI, API_BASE_URL, APIError } from './api-client';

/** Question data structure from session catalog */
export interface SessionQuestion {
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

/** Question catalog that can be attached to a session */
export interface QuestionCatalog {
	questions: SessionQuestion[] | { questions: SessionQuestion[] };
	name?: string;
	description?: string;
}

export interface Session {
	id: string;
	moderator_token: string;
	status: 'active' | 'completed';
	created_at: string;
	ended_at: string | null;
	question_catalog: QuestionCatalog | null;
	current_question_id: string | null;
	metadata_: unknown | null;
}

export interface LeaderboardEntry {
	player_id: number;
	player_name: string;
	score: number;
	rank: number;
	correct_answers?: number;
	total_answers?: number;
}

export interface LeaderboardResponse {
	session_id: string;
	total_players: number;
	entries: LeaderboardEntry[];
}

export const sessionApi = {
	/**
	 * Create a new session
	 */
	create: async (): Promise<Session> => {
		return fetchAPI<Session>('/sessions', {
			method: 'POST',
		});
	},

	/**
	 * Get session by ID
	 */
	get: async (sessionId: string): Promise<Session> => {
		return fetchAPI<Session>(`/sessions/${sessionId}`);
	},

	/**
	 * List all sessions
	 */
	list: async (): Promise<Session[]> => {
		return fetchAPI<Session[]>('/sessions');
	},

	/**
	 * Update session (moderator only)
	 */
	update: async (sessionId: string, moderatorToken: string, data: { current_question_id?: string }): Promise<Session> => {
		return fetchAPI<Session>(`/sessions/${sessionId}`, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${moderatorToken}`,
			},
			body: JSON.stringify(data),
		});
	},

	/**
	 * End session (moderator only)
	 */
	end: async (sessionId: string, moderatorToken: string): Promise<Session> => {
		return fetchAPI<Session>(`/sessions/${sessionId}/end`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${moderatorToken}`,
			},
		});
	},

	/**
	 * Upload questions to session
	 */
	uploadQuestions: async (
		sessionId: string,
		moderatorToken: string,
		file: File
	): Promise<{ message: string; questions_count: number; categories: string[] }> => {
		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/upload-questions`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${moderatorToken}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
			throw new APIError(response.status, errorData.detail || response.statusText);
		}

		return response.json();
	},

	/**
	 * Attach a quiz to session
	 */
	attachQuiz: async (sessionId: string, moderatorToken: string, quizId: string): Promise<Session> => {
		return fetchAPI<Session>(`/sessions/${sessionId}/attach-quiz`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${moderatorToken}`,
			},
			body: JSON.stringify({ quiz_id: quizId }),
		});
	},

	/**
	 * Get session leaderboard
	 */
	getLeaderboard: async (sessionId: string): Promise<LeaderboardResponse> => {
		return fetchAPI<LeaderboardResponse>(`/sessions/${sessionId}/leaderboard`);
	},
};
