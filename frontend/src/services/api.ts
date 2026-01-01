/**
 * API Client for Battle.Net Quiz Platform
 */
import { API_BASE_URL } from '../config';

export interface Session {
  id: string;
  moderator_token: string;
  status: 'active' | 'completed';
  created_at: string;
  ended_at: string | null;
  question_catalog: any | null;
  current_question_id: string | null;
  metadata_: any | null;
}

export interface Player {
  id: number;
  session_id: string;
  name: string;
  score: number;
  connected: boolean;
  joined_at: string;
  last_seen: string;
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

export interface QuizCatalog {
  id: string;
  title: string;
  description: string;
  questions: any[];
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
  questions: any[];
  quiz_id?: string;  // For updates
}

export interface QuizSaveResponse {
  id: string;
  title: string;
  message: string;
}

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new APIError(response.status, errorData.detail || response.statusText);
  }
  
  return response.json();
}

export const api = {
  // Session endpoints
  sessions: {
    create: async (): Promise<Session> => {
      return fetchAPI<Session>('/sessions', {
        method: 'POST',
      });
    },
    
    get: async (sessionId: string): Promise<Session> => {
      return fetchAPI<Session>(`/sessions/${sessionId}`);
    },
    
    list: async (): Promise<Session[]> => {
      return fetchAPI<Session[]>('/sessions');
    },
    
    update: async (
      sessionId: string,
      moderatorToken: string,
      data: { current_question_id?: string }
    ): Promise<Session> => {
      return fetchAPI<Session>(`/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${moderatorToken}`,
        },
        body: JSON.stringify(data),
      });
    },
    
    end: async (sessionId: string, moderatorToken: string): Promise<Session> => {
      return fetchAPI<Session>(`/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${moderatorToken}`,
        },
      });
    },
    
    uploadQuestions: async (
      sessionId: string,
      moderatorToken: string,
      file: File
    ): Promise<{ message: string; questions_count: number; categories: string[] }> => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionId}/upload-questions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${moderatorToken}`,
          },
          body: formData,
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new APIError(response.status, errorData.detail || response.statusText);
      }
      
      return response.json();
    },

    attachQuiz: async (
      sessionId: string,
      moderatorToken: string,
      quizId: string
    ): Promise<Session> => {
      return fetchAPI<Session>(`/sessions/${sessionId}/attach-quiz`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${moderatorToken}`,
        },
        body: JSON.stringify({ quiz_id: quizId }),
      });
    },
    
    getLeaderboard: async (sessionId: string): Promise<LeaderboardResponse> => {
      return fetchAPI<LeaderboardResponse>(`/sessions/${sessionId}/leaderboard`);
    },
  },
  
  // Player endpoints
  players: {
    create: async (sessionId: string, name: string): Promise<Player> => {
      return fetchAPI<Player>(`/sessions/${sessionId}/players`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    },
    
    list: async (sessionId: string, connectedOnly = false): Promise<Player[]> => {
      const query = connectedOnly ? '?connected_only=true' : '';
      return fetchAPI<Player[]>(`/sessions/${sessionId}/players${query}`);
    },
    
    get: async (sessionId: string, playerId: number): Promise<Player> => {
      return fetchAPI<Player>(`/sessions/${sessionId}/players/${playerId}`);
    },
    
    updateScore: async (
      sessionId: string,
      playerId: number,
      points: number,
      reason?: string
    ): Promise<Player> => {
      return fetchAPI<Player>(`/sessions/${sessionId}/players/${playerId}/score`, {
        method: 'POST',
        body: JSON.stringify({ points, reason }),
      });
    },
    
    updateConnection: async (
      sessionId: string,
      playerId: number,
      connected: boolean
    ): Promise<Player> => {
      return fetchAPI<Player>(
        `/sessions/${sessionId}/players/${playerId}/connection?connected=${connected}`,
        { method: 'POST' }
      );
    },
    
    reconnect: async (sessionId: string, playerName: string): Promise<Player> => {
      return fetchAPI<Player>(`/sessions/${sessionId}/players/${playerName}/reconnect`);
    },
  },
  
  // Health endpoints
  health: {
    check: async (): Promise<{ app: string; version: string; status: string }> => {
      return fetchAPI('/health');
    },
  },

  // Quiz Catalog endpoints (ZIP-based storage)
  quizzes: {
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
  },
};
