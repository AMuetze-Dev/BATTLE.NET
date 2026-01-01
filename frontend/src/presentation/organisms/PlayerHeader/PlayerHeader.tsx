/**
 * PlayerHeader Organism - Battle.Net Quiz Platform
 *
 * Header component for the player session page with session info,
 * connection status, theme selector, and mobile score display.
 * Uses brand blue background with white text.
 */

import React from 'react';
import { Trans } from '@lingui/react/macro';
import { Button, ConnectionStatus, Icon, ThemeSelector } from '../../atoms';
import styles from './PlayerHeader.module.css';

export interface PlayerHeaderProps {
	/** Session ID/code */
	sessionId: string;
	/** Current player score */
	score: number;
	/** Whether WebSocket is connected */
	isConnected: boolean;
	/** Callback when leave button is clicked */
	onLeave: () => void;
	/** Optional team info */
	teamName?: string;
	/** Optional team color */
	teamColor?: string;
}

/**
 * Header component for player session page
 */
export const PlayerHeader: React.FC<PlayerHeaderProps> = ({ sessionId, score, isConnected, onLeave, teamName, teamColor }) => {
	return (
		<header className={styles.header}>
			<div className={styles.sessionInfo}>
				<span className={styles.sessionCode}>#{sessionId}</span>
				{teamName && (
					<span className={styles.teamBadge} style={{ backgroundColor: teamColor || 'var(--color-accent)' }}>
						{teamName}
					</span>
				)}
				<div className={styles.mobileScore}>
					<Icon name="trophy" size="sm" color="inverse" />
					<span className={styles.scoreValue}>{score}</span>
				</div>
			</div>

			<div className={styles.actions}>
				<ThemeSelector />
				<ConnectionStatus connected={isConnected} inverted />
				<Button variant="outline" size="sm" onClick={onLeave}>
					<Trans id="player.actions.leave">Verlassen</Trans>
				</Button>
			</div>
		</header>
	);
};

export default PlayerHeader;
