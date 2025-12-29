/**
 * Main App Component with Routing & Error Boundary
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { I18nProvider } from '@lingui/react';
import { i18n } from './i18n';
import { theme } from './theme';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './presentation/pages/HomePage';
import { ModeratorSessionPage } from './presentation/pages/ModeratorSessionPage';
import { PlayerSessionPage } from './presentation/pages/PlayerSessionPage';
import { QuizEditorPage } from './presentation/pages/QuizEditorPage';
import { QuizSelectionPage } from './presentation/pages/QuizSelectionPage';

const App: React.FC = () => {
	return (
		<ErrorBoundary>
			<I18nProvider i18n={i18n}>
				<ThemeProvider theme={theme}>
					<ToastProvider>
						<BrowserRouter>
							<Routes>
								<Route path="/" element={<HomePage />} />
								<Route path="/editor" element={<QuizEditorPage />} />
								<Route path="/quiz-editor" element={<QuizEditorPage />} />
								<Route path="/quiz-selection/:sessionId" element={<QuizSelectionPage />} />
								<Route path="/moderator/:sessionId" element={<ModeratorSessionPage />} />
								<Route path="/player/:sessionId" element={<PlayerSessionPage />} />
							</Routes>
						</BrowserRouter>
					</ToastProvider>
				</ThemeProvider>
			</I18nProvider>
		</ErrorBoundary>
	);
};

export default App;
