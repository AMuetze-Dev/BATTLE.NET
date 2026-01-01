/**
 * Health API Service
 *
 * Single Responsibility: Health check API operations.
 */
import { fetchAPI } from './api-client';

export interface HealthStatus {
	app: string;
	version: string;
	status: string;
}

export const healthApi = {
	/**
	 * Check API health status
	 */
	check: async (): Promise<HealthStatus> => {
		return fetchAPI<HealthStatus>('/health');
	},
};
