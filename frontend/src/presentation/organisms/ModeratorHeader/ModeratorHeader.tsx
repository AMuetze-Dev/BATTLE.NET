/**
 * ModeratorHeader Organism - Battle.Net Quiz Platform
 *
 * Header component for the moderator session page showing session
 * code, statistics, and connection status.
 */

import React from 'react';
import { Trans } from '@lingui/react/macro';
import { Card, ConnectionStatus } from '../../atoms';
import styles from './ModeratorHeader.module.css';

export interface ModeratorHeaderProps {
	/** Session ID/code */
	sessionId: string;
	/** Number of connected players */
	playerCount: number;
	/** Total number of questions */
	questionCount: number;
	/** Current question index (1-based) */
	currentQuestionIndex: number;
	/** Whether WebSocket is connected */
	isConnected: boolean;
}

/**
 * Header component for moderator session page
 */
export const ModeratorHeader: React.FC<ModeratorHeaderProps> = ({ sessionId, playerCount, questionCount, currentQuestionIndex, isConnected }) => {
	return (
		<header className={styles.header}>
			<div className={styles.sessionCode}>
				<span className={styles.codeLabel}>
					<Trans id="moderator.sessionCode">Session-Code</Trans>
				</span>
				<span className={styles.codeValue}>{sessionId}</span>
			</div>

			<div className={styles.stats}>
				<div className={styles.stat}>
					<span className={styles.statValue}>{playerCount}</span>
					<span className={styles.statLabel}>
						<Trans id="moderator.players">Spieler</Trans>
					</span>
				</div>

				<div className={styles.stat}>
					<span className={styles.statValue}>
						{currentQuestionIndex}/{questionCount}
					</span>
					<span className={styles.statLabel}>
						<Trans id="moderator.questions">Fragen</Trans>
					</span>
				</div>
			</div>

			<div className={styles.status}>
				<ConnectionStatus connected={isConnected} />
			</div>
		</header>
	);
};

export default ModeratorHeader;
