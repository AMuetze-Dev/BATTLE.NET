/**
 * API Client for Battle.Net Quiz Platform
 *
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/shared/services/api' instead.
 */

// Re-export everything from the new API modules
export {
	api,
	APIError,
	fetchAPI,
	API_BASE_URL,
	sessionApi,
	playerApi,
	quizApi,
	healthApi,
	type Session,
	type SessionQuestion,
	type QuestionCatalog,
	type LeaderboardEntry,
	type LeaderboardResponse,
	type Player,
	type QuizCatalog,
	type QuizMetadata,
	type QuizSaveRequest,
	type QuizSaveResponse,
	type HealthStatus,
} from '../shared/services/api';
