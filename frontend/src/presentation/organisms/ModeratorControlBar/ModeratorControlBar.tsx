/**
 * ModeratorControlBar Organism - Battle.Net Quiz Platform
 *
 * Navigation and timer controls for the moderator.
 */

import React from 'react';
import { Button, Icon } from '../../atoms';
import styles from './ModeratorControlBar.module.css';

export interface ModeratorControlBarProps {
	/** Current question index (0-based, -1 if no question) */
	currentIndex: number;
	/** Total number of questions */
	totalQuestions: number;
	/** Current timer value in seconds */
	timerValue: number;
	/** Previous question handler */
	onPrev: () => void;
	/** Next question handler */
	onNext: () => void;
	/** Timer adjustment handler */
	onTimerChange: (delta: number) => void;
	/** Set timer handler */
	onSetTimer: () => void;
}

/**
 * ModeratorControlBar provides navigation and timer controls
 */
export const ModeratorControlBar: React.FC<ModeratorControlBarProps> = ({ currentIndex, totalQuestions, timerValue, onPrev, onNext, onTimerChange, onSetTimer }) => (
	<div className={styles.controlBar}>
		{/* Navigation Controls */}
		<div className={styles.navigation}>
			<Button size="sm" variant="outline" onClick={onPrev} disabled={currentIndex <= 0} aria-label="Previous question">
				←
			</Button>
			<span className={styles.indicator}>{currentIndex >= 0 ? `${currentIndex + 1}/${totalQuestions}` : '—'}</span>
			<Button size="sm" variant="outline" onClick={onNext} disabled={currentIndex >= totalQuestions - 1} aria-label="Next question">
				→
			</Button>
		</div>

		{/* Timer Controls */}
		<div className={styles.timerControl}>
			<button className={styles.timerButton} onClick={() => onTimerChange(-5)} aria-label="Decrease timer">
				−
			</button>
			<span className={styles.timerDisplay}>{timerValue}s</span>
			<button className={styles.timerButton} onClick={() => onTimerChange(5)} aria-label="Increase timer">
				+
			</button>
			<Button size="sm" variant="primary" onClick={onSetTimer}>
				<Icon name="timer" size="sm" />
			</Button>
		</div>
	</div>
);

export default ModeratorControlBar;
