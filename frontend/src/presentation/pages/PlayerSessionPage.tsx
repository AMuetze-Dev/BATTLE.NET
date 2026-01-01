/**
 * Player Session Page - Battle.Net Quiz Platform
 *
 * Thin presentation layer for quiz participation.
 * All logic is extracted to usePlayerSession hook.
 * Uses organism components and CSS Modules.
 *
 * @module pages/PlayerSessionPage
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans } from '@lingui/react/macro';
import { Button } from '../atoms';
import { PlayerHeader, PlayerQuestionDisplay, PlayerSidebar, AnswerArea } from '../organisms';
import { TeamSelection, TeamLeaderboard } from '../molecules';
import { usePlayerSession } from '../../hooks/usePlayerSession';
import { useTeam } from '../../hooks/useTeam';
import { useMediaPreloader } from '../../hooks/useMediaPreloader';
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
		isTeamMode,
		socket,
		// Actions
		handleAnswerChange,
		handleSubmitAnswer,
		handleBuzzerPress,
		handleLeave,
	} = usePlayerSession();

	// Team management hook - now with gameState for real-time sync
	const {
		teams,
		currentTeamId,
		currentTeam,
		isActivePlayer,
		loading: teamLoading,
		error: teamError,
		joinTeam,
		refreshTeams,
	} = useTeam({
		sessionId: sessionId ?? null,
		playerId: playerId ? parseInt(playerId) : null,
		enabled: isTeamMode,
		gameState: gameState,
	});

	// Local state for team selection
	const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
	const [joiningTeam, setJoiningTeam] = useState(false);

	// Audio player reference for synchronized playback
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Preload all media files in background
	const preloadProgress = useMediaPreloader(gameState?.questions || [], !!gameState && !loading);

	// Handle team join confirmation
	const handleConfirmTeam = useCallback(async () => {
		if (!selectedTeamId) return;
		setJoiningTeam(true);
		const success = await joinTeam(selectedTeamId);
		setJoiningTeam(false);
		if (!success) {
			// Error is handled by useTeam hook
		}
	}, [selectedTeamId, joinTeam]);

	// Listen for audio control events from moderator
	useEffect(() => {
		if (!socket) return;

		const handleAudioControl = (data: { action: string; audio_src: string; current_time: number }) => {
			const { action, audio_src, current_time } = data;

			// Create or reuse audio element
			if (!audioRef.current || audioRef.current.src !== audio_src) {
				if (audioRef.current) {
					audioRef.current.pause();
				}
				audioRef.current = new Audio(audio_src);
			}

			const audio = audioRef.current;

			// Handle action
			if (action === 'play') {
				audio.currentTime = current_time;
				audio.play().catch((err) => console.error('Audio play failed:', err));
			} else if (action === 'pause') {
				audio.pause();
			} else if (action === 'stop') {
				audio.pause();
				audio.currentTime = 0;
			}
		};

		socket.on('audio_control', handleAudioControl);

		return () => {
			socket.off('audio_control', handleAudioControl);
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
		};
	}, [socket]);

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

	// Team selection state (only show if team mode and no team selected)
	if (isTeamMode && !currentTeamId && teams.length > 0) {
		return (
			<TeamSelection
				teams={teams.map((t) => ({
					id: t.id,
					name: t.name,
					color: t.color,
					memberCount: t.memberCount,
					connectedCount: t.connectedCount,
				}))}
				selectedTeamId={selectedTeamId}
				sessionId={sessionId ?? ''}
				playerName={player.name}
				loading={joiningTeam}
				error={teamError}
				onSelectTeam={setSelectedTeamId}
				onConfirm={handleConfirmTeam}
				onBack={handleLeave}
			/>
		);
	}

	// Main render
	return (
		<div className={styles.container}>
			<div className={styles.mainArea}>
				<PlayerHeader sessionId={sessionId ?? ''} score={currentScore} isConnected={isConnected} onLeave={handleLeave} teamName={currentTeam?.name} teamColor={currentTeam?.color} />

				<PlayerQuestionDisplay question={currentQuestion} questionVisible={questionVisible} imageVisible={imageVisible} gameStatus={gameState?.status} timerSeconds={gameState?.timer} timerRunning={gameState?.timer_running} isActivePlayer={isTeamMode ? isActivePlayer : undefined} />

				<AnswerArea
					question={currentQuestion}
					value={answer}
					gameStatus={gameState?.status}
					isLocked={isInputLocked || (isTeamMode && !isActivePlayer && currentQuestion?.type !== 'buzzer')}
					hasSubmitted={hasAnswered}
					buzzerWinner={buzzerWinner}
					currentPlayerId={parseInt(playerId ?? '-1')}
					onChange={handleAnswerChange}
					onSubmit={handleSubmitAnswer}
					onBuzzerPress={handleBuzzerPress}
				/>
			</div>

			<PlayerSidebar
				score={currentScore}
				playerName={player.name}
				playerId={player.id}
				leaderboard={leaderboardEntries}
				isTeamMode={isTeamMode}
				currentTeamId={currentTeamId}
				teamLeaderboard={
					isTeamMode
						? teams.map((t, i) => ({
								teamId: t.id,
								teamName: t.name,
								teamColor: t.color,
								score: t.score,
								rank: i + 1,
								memberCount: t.memberCount,
								connectedCount: t.connectedCount,
						  }))
						: undefined
				}
			/>

			{/* Media preload progress bar */}
			{!preloadProgress.isComplete && preloadProgress.total > 0 && (
				<div className={styles.preloadBar}>
					<div className={styles.preloadProgress} style={{ width: `${preloadProgress.percentage}%` }} />
					<span className={styles.preloadText}>
						<Trans>Medien laden...</Trans> {preloadProgress.loaded}/{preloadProgress.total} ({preloadProgress.percentage}%)
					</span>
				</div>
			)}
		</div>
	);
};
