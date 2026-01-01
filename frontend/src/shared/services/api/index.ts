/**
 * API Services - Central Export
 *
 * Re-exports all API services for convenient imports.
 * Maintains backward compatibility with the old `api` object.
 */

// Import for backward compatible object
import { sessionApi } from './session.api';
import { playerApi } from './player.api';
import { quizApi } from './quiz.api';
import { healthApi } from './health.api';

// Individual API modules - Re-exports
export { APIError, fetchAPI, API_BASE_URL } from './api-client';
export { sessionApi, type Session, type SessionQuestion, type QuestionCatalog, type LeaderboardEntry, type LeaderboardResponse } from './session.api';
export { playerApi, type Player } from './player.api';
export { quizApi, type QuizCatalog, type QuizMetadata, type QuizSaveRequest, type QuizSaveResponse } from './quiz.api';
export { healthApi, type HealthStatus } from './health.api';

/**
 * Combined API object for backward compatibility
 * @deprecated Use individual API modules (sessionApi, playerApi, quizApi, healthApi) instead
 */
export const api = {
	sessions: sessionApi,
	players: playerApi,
	quizzes: quizApi,
	health: healthApi,
};
