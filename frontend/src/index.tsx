/**
 * Application Entry Point
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/theme.css';
import './styles/color-themes.css';
import './styles/global.css';
import './styles/components.css';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
