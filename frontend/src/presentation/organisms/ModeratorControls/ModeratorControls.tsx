/**
 * ModeratorControls Organism - Battle.Net Quiz Platform
 *
 * Control panel for moderator actions: navigation, timer, visibility toggles.
 * Includes team controls when in team mode.
 */

import React from 'react';
import { Trans } from '@lingui/react/macro';
import { Button, Icon } from '../../atoms';
import styles from './ModeratorControls.module.css';

export interface TeamInfo {
	id: string;
	name: string;
	color: string;
	score: number;
}

export interface ModeratorControlsProps {
	/** Current question index (0-based) */
	currentIndex: number;
	/** Total number of questions */
	totalQuestions: number;
	/** Whether there's a current question active */
	hasActiveQuestion: boolean;
	/** Whether question text is visible to players */
	isQuestionVisible: boolean;
	/** Whether question image is visible to players */
	isImageVisible: boolean;
	/** Whether inputs are locked */
	isInputLocked: boolean;
	/** Current timer value */
	timerValue: number;
	/** Whether timer is running */
	isTimerRunning: boolean;
	/** Game status */
	gameStatus: 'waiting' | 'playing' | 'finished';
	/** Whether in team mode */
	isTeamMode?: boolean;
	/** Teams list (for team mode) */
	teams?: TeamInfo[];
	/** Current question type */
	questionType?: string;

	/** Callbacks */
	onPreviousQuestion: () => void;
	onNextQuestion: () => void;
	onStartQuestion: () => void;
	onEndQuestion: () => void;
	onToggleQuestionVisibility: () => void;
	onToggleImageVisibility: () => void;
	onToggleInputLock: () => void;
	onStartTimer: () => void;
	onStopTimer: () => void;
	onTimerValueChange: (value: number) => void;
	onEndGame: () => void;
	/** Select active players for input questions (team mode) */
	onSelectActivePlayers?: () => void;
	/** Award points to a team */
	onTeamScoreChange?: (teamId: string, delta: number) => void;
}

/**
 * Control panel for moderator session
 */
export const ModeratorControls: React.FC<ModeratorControlsProps> = ({
	currentIndex,
	totalQuestions,
	hasActiveQuestion,
	isQuestionVisible,
	isImageVisible,
	isInputLocked,
	timerValue,
	isTimerRunning,
	gameStatus,
	isTeamMode = false,
	teams = [],
	questionType,
	onPreviousQuestion,
	onNextQuestion,
	onStartQuestion,
	onEndQuestion,
	onToggleQuestionVisibility,
	onToggleImageVisibility,
	onToggleInputLock,
	onStartTimer,
	onStopTimer,
	onTimerValueChange,
	onEndGame,
	onSelectActivePlayers,
	onTeamScoreChange,
}) => {
	const isFirstQuestion = currentIndex <= 0;
	const isLastQuestion = currentIndex >= totalQuestions - 1;
	const isPlaying = gameStatus === 'playing';
	const isFinished = gameStatus === 'finished';
	const isInputQuestion = questionType?.toLowerCase().replace('-', '_') === 'input';

	return (
		<div className={styles.container}>
			{/* Navigation Section */}
			<div className={styles.section}>
				<h3 className={styles.sectionTitle}>
					<Icon name="clipboard" size="sm" />
					<Trans id="moderator.controls.navigation">Navigation</Trans>
				</h3>
				<div className={styles.buttonRow}>
					<Button size="sm" variant="outline" onClick={onPreviousQuestion} disabled={isFirstQuestion || isPlaying}>
						<Icon name="chevron-left" size="xs" /> <Trans id="moderator.controls.previous">Zurück</Trans>
					</Button>

					<span className={styles.questionIndicator}>
						{currentIndex + 1} / {totalQuestions}
					</span>

					<Button size="sm" variant="outline" onClick={onNextQuestion} disabled={isLastQuestion || isPlaying}>
						<Trans id="moderator.controls.next">Weiter</Trans> <Icon name="chevron-right" size="xs" />
					</Button>
				</div>
			</div>

			{/* Question Control Section */}
			<div className={styles.section}>
				<h3 className={styles.sectionTitle}>
					<Icon name="play" size="sm" />
					<Trans id="moderator.controls.question">Frage</Trans>
				</h3>
				<div className={styles.buttonRow}>
					{!hasActiveQuestion ? (
						<Button size="sm" variant="primary" onClick={onStartQuestion} disabled={totalQuestions === 0 || isFinished}>
							<Icon name="play" size="xs" /> <Trans id="moderator.controls.start">Starten</Trans>
						</Button>
					) : (
						<Button size="sm" variant="danger" onClick={onEndQuestion}>
							<Icon name="square" size="xs" /> <Trans id="moderator.controls.end">Beenden</Trans>
						</Button>
					)}
				</div>
			</div>

			{/* Visibility Section */}
			<div className={styles.section}>
				<h3 className={styles.sectionTitle}>
					<Icon name="eye" size="sm" />
					<Trans id="moderator.controls.visibility">Sichtbarkeit</Trans>
				</h3>
				<div className={styles.buttonRow}>
					<Button size="sm" variant={isQuestionVisible ? 'primary' : 'outline'} onClick={onToggleQuestionVisibility} disabled={!hasActiveQuestion}>
						<Icon name={isQuestionVisible ? 'eye' : 'eye-off'} size="xs" /> Frage
					</Button>

					<Button size="sm" variant={isImageVisible ? 'primary' : 'outline'} onClick={onToggleImageVisibility} disabled={!hasActiveQuestion}>
						<Icon name="image" size="xs" /> Bild
					</Button>

					<Button size="sm" variant={!isInputLocked ? 'success' : 'outline'} onClick={onToggleInputLock} disabled={!hasActiveQuestion}>
						<Icon name={isInputLocked ? 'lock' : 'unlock'} size="xs" /> {isInputLocked ? 'Gesperrt' : 'Offen'}
					</Button>
				</div>
			</div>

			{/* Timer Section */}
			<div className={styles.section}>
				<h3 className={styles.sectionTitle}>
					<Icon name="timer" size="sm" />
					<Trans id="moderator.controls.timer">Timer</Trans>
				</h3>
				<div className={styles.timerRow}>
					<input type="number" className={styles.timerInput} value={timerValue} onChange={(e) => onTimerValueChange(parseInt(e.target.value) || 0)} min={5} max={300} disabled={isTimerRunning} />
					<span className={styles.timerUnit}>s</span>

					{!isTimerRunning ? (
						<Button size="sm" variant="primary" onClick={onStartTimer} disabled={!hasActiveQuestion || timerValue <= 0}>
							<Icon name="play" size="xs" /> Start
						</Button>
					) : (
						<Button size="sm" variant="danger" onClick={onStopTimer}>
							<Icon name="square" size="xs" /> Stop
						</Button>
					)}
				</div>
			</div>

			{/* Team Controls Section (only in team mode) */}
			{isTeamMode && (
				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>
						<Icon name="users" size="sm" />
						<Trans id="moderator.controls.teams">Teams</Trans>
					</h3>

					{/* Select active players for input questions */}
					{isInputQuestion && hasActiveQuestion && onSelectActivePlayers && (
						<div className={styles.buttonRow}>
							<Button size="sm" variant="primary" onClick={onSelectActivePlayers}>
								<Icon name="refresh" size="xs" /> <Trans id="moderator.controls.selectActive">Aktive Spieler auswählen</Trans>
							</Button>
						</div>
					)}

					{/* Team score controls */}
					{teams.length > 0 && onTeamScoreChange && (
						<div className={styles.teamScoreGrid}>
							{teams.map((team) => (
								<div key={team.id} className={styles.teamScoreRow}>
									<span className={styles.teamName} style={{ color: team.color }}>
										{team.name}
									</span>
									<span className={styles.teamScore}>{team.score}</span>
									<div className={styles.teamScoreButtons}>
										<Button size="sm" variant="outline" onClick={() => onTeamScoreChange(team.id, -10)} title="-10 Punkte">
											-10
										</Button>
										<Button size="sm" variant="success" onClick={() => onTeamScoreChange(team.id, 10)} title="+10 Punkte">
											+10
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Game Control */}
			<div className={styles.section}>
				<h3 className={styles.sectionTitle}>
					<Icon name="trophy" size="sm" color="warning" />
					<Trans id="moderator.controls.game">Spiel</Trans>
				</h3>
				<div className={styles.buttonRow}>
					<Button size="sm" variant="danger" onClick={onEndGame} disabled={isFinished}>
						<Trans id="moderator.controls.endGame">Spiel beenden</Trans>
					</Button>
				</div>
			</div>
		</div>
	);
};

export default ModeratorControls;
