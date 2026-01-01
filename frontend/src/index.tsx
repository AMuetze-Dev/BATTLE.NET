/**
 * Application Entry Point
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeTheme } from './services/theme.service';
import './styles/theme.css';
import './styles/color-themes.css';
import './styles/global.css';
import './styles/components.css';
import './index.css';

// Initialize theme from localStorage before rendering to prevent flash of wrong theme
initializeTheme();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
