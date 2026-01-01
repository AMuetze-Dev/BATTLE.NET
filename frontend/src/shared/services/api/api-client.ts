/**
 * API Client - Base HTTP Client
 *
 * Single Responsibility: HTTP request handling and error management.
 * All other API modules depend on this client.
 */
import { API_BASE_URL } from '../../../config';

/**
 * Custom API Error with status code
 */
export class APIError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
		this.name = 'APIError';
	}
}

/**
 * Base fetch function with error handling
 */
export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

/**
 * Base URL for constructing URLs (e.g., for images)
 */
export { API_BASE_URL };
