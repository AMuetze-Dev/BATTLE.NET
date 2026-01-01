/**
 * AnswerArea Organism - Battle.Net Quiz Platform
 *
 * Container for the answer input area that wraps AnswerInput molecule
 * with additional styling and state management.
 */

import React from 'react';
import { Trans } from '@lingui/react/macro';
import { Icon } from '../../atoms';
import { AnswerInput } from '../../molecules';
import styles from './AnswerArea.module.css';

/** Buzzer winner information */
export interface BuzzerWinnerInfo {
	player_id: number;
	player_name: string;
	name?: string;
}

/** Question for answer input */
export interface AnswerQuestion {
	id?: string;
	type?: string;
	options?: string[];
	min?: number;
	max?: number;
	minValue?: number;
	maxValue?: number;
	step?: number;
	unit?: string;
	items?: string[];
	tolerance?: number;
	image?: string;
	imageData?: string;
	imageUrl?: string;
	hotspot?: {
		x: number;
		y: number;
		radius: number;
		shape?: 'circle' | 'rectangle';
		width?: number;
		height?: number;
	};
}

export interface AnswerAreaProps {
	/** Current question data */
	question: AnswerQuestion | null | undefined;
	/** Current answer value */
	value: string;
	/** Game status */
	gameStatus?: string;
	/** Whether input is locked */
	isLocked: boolean;
	/** Whether answer has been submitted */
	hasSubmitted: boolean;
	/** Buzzer winner info */
	buzzerWinner?: BuzzerWinnerInfo | null;
	/** Current player ID */
	currentPlayerId: number;
	/** Callback when answer changes */
	onChange: (value: string) => void;
	/** Callback when answer is submitted */
	onSubmit: () => void;
	/** Callback when buzzer is pressed */
	onBuzzerPress: () => void;
}

/**
 * Answer area component containing the answer input
 */
export const AnswerArea: React.FC<AnswerAreaProps> = ({ question, value, gameStatus, isLocked, hasSubmitted, buzzerWinner, currentPlayerId, onChange, onSubmit, onBuzzerPress }) => {
	const isPlaying = gameStatus === 'playing';

	return (
		<div className={styles.container}>
			{!isPlaying ? (
				<div className={styles.placeholder}>
					<Icon name="clock" size="xl" color="neutral" />
					<span className={styles.waitingText}>
						<Trans id="player.waitingForQuestion">Warte auf die nächste Frage...</Trans>
					</span>
				</div>
			) : (
				<div className={styles.inputWrapper}>
					<AnswerInput question={question} value={value} onChange={onChange} onSubmit={onSubmit} onBuzzerPress={onBuzzerPress} locked={isLocked} submitted={hasSubmitted} buzzerWinner={buzzerWinner} currentPlayerId={currentPlayerId} />
				</div>
			)}
		</div>
	);
};

export default AnswerArea;
