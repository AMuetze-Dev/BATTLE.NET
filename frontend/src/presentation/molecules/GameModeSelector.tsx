/**
 * GameModeSelector Molecule - Select game mode (Free-for-All vs Team)
 */
import React from 'react';
import { Trans } from '@lingui/react/macro';
import { Icon } from '../atoms/Icon';
import { GameMode } from '../../types/team.types';
import styles from './GameModeSelector.module.css';

export interface GameModeSelectorProps {
	value: GameMode;
	onChange: (mode: GameMode) => void;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({ value, onChange }) => {
	return (
		<div className={styles.selector}>
			<button type="button" className={`${styles.option} ${value === 'free-for-all' ? styles.active : ''}`} onClick={() => onChange('free-for-all')}>
				<Icon name="user" size="lg" />
				<span className={styles.label}>
					<Trans id="quizEditor.freeForAll">Alle gegen Alle</Trans>
				</span>
				<span className={styles.description}>
					<Trans id="quizEditor.freeForAllDesc">Jeder Spieler spielt für sich selbst</Trans>
				</span>
			</button>
			<button type="button" className={`${styles.option} ${value === 'team' ? styles.active : ''}`} onClick={() => onChange('team')}>
				<Icon name="users" size="lg" />
				<span className={styles.label}>
					<Trans id="quizEditor.teamMode">Teammodus</Trans>
				</span>
				<span className={styles.description}>
					<Trans id="quizEditor.teamModeDesc">Spieler bilden Teams und spielen zusammen</Trans>
				</span>
			</button>
		</div>
	);
};
