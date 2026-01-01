/**
 * ModeratorPlayerList Organism - Battle.Net Quiz Platform
 *
 * Player list and leaderboard for moderator with score controls.
 */

import React from 'react';
import { Trans } from '@lingui/react/macro';
import { Icon } from '../../atoms';
import styles from './ModeratorPlayerList.module.css';

/** Player data for display */
export interface ModeratorPlayer {
	id: number;
	name: string;
	score: number;
	connected: boolean;
	answer?: string;
	answered?: boolean;
}

export interface ModeratorPlayerListProps {
	/** List of players */
	players: ModeratorPlayer[];
	/** Callback when adding points to a player */
	onAddPoints: (playerId: number, amount: number) => void;
	/** Callback when subtracting points from a player */
	onSubtractPoints: (playerId: number, amount: number) => void;
	/** Currently hovered player ID (for hotspot visualization) */
	hoveredPlayerId?: number | null;
	/** Callback when hovering a player */
	onPlayerHover?: (playerId: number | null) => void;
}

/**
 * Player list component with score controls
 */
export const ModeratorPlayerList: React.FC<ModeratorPlayerListProps> = ({ players, onAddPoints, onSubtractPoints, hoveredPlayerId, onPlayerHover }) => {
	const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
	const connectedCount = players.filter((p) => p.connected).length;

	return (
		<div className={styles.container}>
			<h3 className={styles.title}>
				<Icon name="users" size="sm" />
				<Trans id="moderator.players.title">Spieler</Trans>
				<span className={styles.count}>
					{connectedCount}/{players.length}
				</span>
			</h3>

			{players.length === 0 ? (
				<div className={styles.empty}>
					<Icon name="clock" size="lg" color="neutral" />
					<Trans id="moderator.players.empty">Warte auf Spieler...</Trans>
				</div>
			) : (
				<div className={styles.list}>
					{sortedPlayers.map((player, index) => (
						<div
							key={player.id}
							className={`${styles.playerCard} ${!player.connected ? styles.disconnected : ''} ${player.answered ? styles.answered : ''} ${hoveredPlayerId === player.id ? styles.hovered : ''}`}
							onMouseEnter={() => onPlayerHover?.(player.id)}
							onMouseLeave={() => onPlayerHover?.(null)}
						>
							{/* Rank Badge */}
							<div className={`${styles.rank} ${index === 0 ? styles.gold : index === 1 ? styles.silver : index === 2 ? styles.bronze : ''}`}>{index + 1}</div>

							{/* Player Info */}
							<div className={styles.playerInfo}>
								<div className={styles.playerName}>
									{player.name}
									{player.connected ? <span className={styles.onlineIndicator}>●</span> : <span className={styles.offlineIndicator}>○</span>}
								</div>
								{player.answer && <div className={styles.playerAnswer}>{player.answer}</div>}
							</div>

							{/* Score */}
							<div className={styles.score}>{player.score}</div>

							{/* Score Controls */}
							<div className={styles.scoreControls}>
								<button className={`${styles.scoreButton} ${styles.add}`} onClick={() => onAddPoints(player.id, 100)} title="Add 100 points">
									+
								</button>
								<button className={`${styles.scoreButton} ${styles.subtract}`} onClick={() => onSubtractPoints(player.id, 100)} title="Subtract 100 points">
									−
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default ModeratorPlayerList;
