/**
 * Quiz API Service
 *
 * Single Responsibility: Quiz catalog related API operations.
 */
import { fetchAPI, API_BASE_URL, APIError } from './api-client';

export interface QuizCatalog {
	id: string;
	title: string;
	description: string;
	questions: unknown[];
	question_count?: number;
	image_count?: number;
	created_at: string;
	updated_at: string;
	gameMode?: 'free-for-all' | 'team';
	teamConfig?: {
		enabled: boolean;
		teams: Array<{ id: string; name: string; color: string }>;
	};
}

export interface QuizMetadata {
	id: string;
	title: string;
	description: string;
	question_count: number;
	image_count: number;
	created_at: string;
	updated_at: string;
}

export interface QuizSaveRequest {
	title: string;
	description?: string;
	questions: unknown[];
	quiz_id?: string;
	gameMode?: 'free-for-all' | 'team';
	teamConfig?: unknown;
}

export interface QuizSaveResponse {
	id: string;
	title: string;
	message: string;
}

export const quizApi = {
	/**
	 * List all available quizzes (metadata only)
	 */
	list: async (): Promise<QuizMetadata[]> => {
		return fetchAPI<QuizMetadata[]>('/quizzes');
	},

	/**
	 * Get a complete quiz by ID
	 */
	get: async (quizId: string): Promise<QuizCatalog> => {
		return fetchAPI<QuizCatalog>(`/quizzes/${encodeURIComponent(quizId)}`);
	},

	/**
	 * Create or update a quiz
	 */
	save: async (data: QuizSaveRequest): Promise<QuizSaveResponse> => {
		return fetchAPI<QuizSaveResponse>('/quizzes', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	/**
	 * Update an existing quiz
	 */
	update: async (quizId: string, data: QuizSaveRequest): Promise<QuizSaveResponse> => {
		return fetchAPI<QuizSaveResponse>(`/quizzes/${encodeURIComponent(quizId)}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	},

	/**
	 * Delete a quiz
	 */
	delete: async (quizId: string): Promise<{ message: string }> => {
		return fetchAPI<{ message: string }>(`/quizzes/${encodeURIComponent(quizId)}`, {
			method: 'DELETE',
		});
	},

	/**
	 * Get image URL for a quiz
	 */
	getImageUrl: (quizId: string, imageName: string): string => {
		return `${API_BASE_URL}/quizzes/${encodeURIComponent(quizId)}/images/${encodeURIComponent(imageName)}`;
	},

	/**
	 * Export a quiz as ZIP file (returns download URL)
	 */
	getExportUrl: (quizId: string): string => {
		return `${API_BASE_URL}/quizzes/${encodeURIComponent(quizId)}/export`;
	},

	/**
	 * Import a quiz from ZIP file
	 */
	import: async (file: File): Promise<QuizSaveResponse> => {
		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch(`${API_BASE_URL}/quizzes/import`, {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ detail: 'Import failed' }));
			throw new APIError(response.status, errorData.detail || response.statusText);
		}

		return response.json();
	},
};
