/**
 * Environment Configuration
 */

// API Base URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// WebSocket URL  
export const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8000';

// App Configuration
export const APP_CONFIG = {
  sessionCodeLength: 6,
  maxPlayerNameLength: 50,
  defaultQuestionTimeout: 30,
  reconnectAttempts: 5,
  reconnectDelay: 3000,
};
