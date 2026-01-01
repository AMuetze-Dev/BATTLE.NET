/**
 * Player Session Page - Battle.Net Quiz Platform
 *
 * Thin presentation layer for quiz participation.
 * All logic is extracted to usePlayerSession hook.
 * Uses organism components and CSS Modules.
 *
 * @module pages/PlayerSessionPage
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans } from '@lingui/react/macro';
import { Button } from '../atoms';
import { PlayerHeader, PlayerQuestionDisplay, PlayerSidebar, AnswerArea } from '../organisms';
import { usePlayerSession } from '../../hooks/usePlayerSession';
import styles from './PlayerSessionPage.module.css';

export const PlayerSessionPage: React.FC = () => {
	const navigate = useNavigate();

	// All logic extracted to custom hook
	const {
		// State
		sessionId,
		playerId,
		player,
		gameState,
		answer,
		hasAnswered,
		loading,
		error,
		isConnected,
		currentScore,
		leaderboardEntries,
		currentQuestion,
		questionVisible,
		imageVisible,
		isInputLocked,
		buzzerWinner,
		// Actions
		handleAnswerChange,
		handleSubmitAnswer,
		handleBuzzerPress,
		handleLeave,
	} = usePlayerSession();

	// Loading state
	if (loading) {
		return (
			<div className={styles.loadingContainer}>
				<div className={styles.loadingSpinner} />
				<span className={styles.loadingText}>
					<Trans id="common.loading">Laden...</Trans>
				</span>
			</div>
		);
	}

	// Error state
	if (error || !player) {
		return (
			<div className={styles.errorContainer}>
				<span className={styles.errorIcon}>⚠️</span>
				<h2 className={styles.errorTitle}>
					<Trans id="common.error">Fehler</Trans>
				</h2>
				<p className={styles.errorMessage}>{error || <Trans id="player.error.notFound">Spieler nicht gefunden</Trans>}</p>
				<Button onClick={() => navigate('/')}>
					<Trans id="common.back">Zurück</Trans>
				</Button>
			</div>
		);
	}

	// Main render
	return (
		<div className={styles.container}>
			<div className={styles.mainArea}>
				<PlayerHeader sessionId={sessionId ?? ''} score={currentScore} isConnected={isConnected} onLeave={handleLeave} />

				<PlayerQuestionDisplay question={currentQuestion} questionVisible={questionVisible} imageVisible={imageVisible} gameStatus={gameState?.status} timerSeconds={gameState?.timer} timerRunning={gameState?.timer_running} />

				<AnswerArea
					question={currentQuestion}
					value={answer}
					gameStatus={gameState?.status}
					isLocked={isInputLocked}
					hasSubmitted={hasAnswered}
					buzzerWinner={buzzerWinner}
					currentPlayerId={parseInt(playerId ?? '-1')}
					onChange={handleAnswerChange}
					onSubmit={handleSubmitAnswer}
					onBuzzerPress={handleBuzzerPress}
				/>
			</div>

			<PlayerSidebar score={currentScore} playerName={player.name} playerId={player.id} leaderboard={leaderboardEntries} />
		</div>
	);
};
