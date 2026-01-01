/**
 * ModeratorSessionHeader Organism - Battle.Net Quiz Platform
 *
 * Header component for moderator session displaying session info and controls.
 */

import React from 'react';
import { Trans } from '@lingui/react/macro';
import { Button, ConnectionStatus, ThemeSelector } from '../../atoms';
import styles from './ModeratorSessionHeader.module.css';

export interface ModeratorSessionHeaderProps {
	/** Session ID code */
	sessionId: string;
	/** Number of connected players */
	connectedCount: number;
	/** Total number of questions */
	questionsCount: number;
	/** WebSocket connection status */
	isConnected: boolean;
	/** Exit button handler */
	onExit: () => void;
}

/**
 * ModeratorSessionHeader displays session information and exit control
 */
export const ModeratorSessionHeader: React.FC<ModeratorSessionHeaderProps> = ({ sessionId, connectedCount, questionsCount, isConnected, onExit }) => (
	<header className={styles.header}>
		<div className={styles.sessionCode}>
			<div className={styles.codeLabel}>Session</div>
			<div className={styles.codeValue}>{sessionId}</div>
		</div>

		<div className={styles.stats}>
			<div className={styles.statItem}>
				<div className={styles.statValue}>{connectedCount}</div>
				<div className={styles.statLabel}>
					<Trans id="common.players">Spieler</Trans>
				</div>
			</div>
			<div className={styles.statItem}>
				<div className={styles.statValue}>{questionsCount}</div>
				<div className={styles.statLabel}>
					<Trans id="common.questions">Fragen</Trans>
				</div>
			</div>
		</div>

		<div className={styles.actions}>
			<ThemeSelector />
			<ConnectionStatus connected={isConnected} inverted />
			<Button variant="outline" size="sm" onClick={onExit} className={styles.exitButton}>
				Exit
			</Button>
		</div>
	</header>
);

export default ModeratorSessionHeader;
