/**
 * PlayerQuestionDisplay Organism - Battle.Net Quiz Platform
 *
 * Displays the current question with timer, image, and text.
 * Handles visibility states and placeholder content.
 * Used in the PlayerSessionPage.
 */

import React from 'react';
import { Trans } from '@lingui/react/macro';
import { Icon, ImageLightbox } from '../../atoms';
import styles from './PlayerQuestionDisplay.module.css';

/** Question data for display */
export interface DisplayQuestion {
	id?: string;
	text?: string;
	question?: string;
	image?: string;
	imageData?: string;
	imageUrl?: string;
	type?: string;
}

export interface PlayerQuestionDisplayProps {
	/** Current question data */
	question: DisplayQuestion | null | undefined;
	/** Whether question text is visible */
	questionVisible: boolean;
	/** Whether question image is visible */
	imageVisible: boolean;
	/** Game status (playing, finished, etc.) */
	gameStatus?: string;
	/** Timer remaining seconds */
	timerSeconds?: number;
	/** Whether timer is running */
	timerRunning?: boolean;
}

/**
 * Question display component with timer and image support
 */
export const PlayerQuestionDisplay: React.FC<PlayerQuestionDisplayProps> = ({ question, questionVisible, imageVisible, gameStatus, timerSeconds, timerRunning }) => {
	const hasQuestion = questionVisible && !!question;
	const isTimerUrgent = (timerSeconds ?? 0) <= 5;
	const showTimer = timerRunning && timerSeconds !== undefined && timerSeconds > 0;

	// Get the image source
	const imageSource = question?.image || question?.imageData || question?.imageUrl;
	const showImage = imageVisible && !!imageSource;

	// Get the question text
	const questionText = question?.question ?? question?.text;

	return (
		<div className={`${styles.container} ${hasQuestion ? styles.hasQuestion : ''}`} data-status={gameStatus}>
			{/* Timer */}
			{showTimer && (
				<div className={`${styles.timer} ${isTimerUrgent ? styles.timerUrgent : ''}`} role="timer" aria-live="polite">
					<span className={styles.timerValue}>{timerSeconds}</span>
					<span className={styles.timerUnit}>s</span>
				</div>
			)}

			{/* Content */}
			{!question ? (
				<div className={styles.placeholder}>
					{gameStatus === 'finished' ? (
						<div className={styles.finishedMessage}>
							<Icon name="trophy" size="2xl" color="warning" />
							<Trans id="player.gameFinished">Spiel beendet!</Trans>
						</div>
					) : (
						<Icon name="clock" size="xl" color="neutral" />
					)}
				</div>
			) : (
				<div className={styles.content}>
					{/* Question Image with Lightbox */}
					{showImage && <ImageLightbox src={imageSource!} alt="Question" className={styles.imageContainer} imageClassName={styles.image} />}

					{/* Question Text */}
					{questionVisible ? (
						<h1 className={styles.questionText}>{questionText ?? <Trans id="player.answerPrompt">Beantworte die Frage!</Trans>}</h1>
					) : (
						<div className={styles.placeholder}>
							<Icon name="clock" size="xl" color="neutral" />
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default PlayerQuestionDisplay;
