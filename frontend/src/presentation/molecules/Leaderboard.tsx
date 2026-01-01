/**
 * Leaderboard Molecule - Battle.Net Quiz Platform
 *
 * Unified leaderboard component using CSS Modules.
 * Supports both Player view (read-only) and Moderator view (with controls).
 *
 * @module molecules/Leaderboard
 */

import React from 'react';
import { Trans } from '@lingui/react/macro';
import { Icon } from '../atoms';
import { LeaderboardItem } from '../atoms/LeaderboardItem';
import styles from './Leaderboard.module.css';

/** Entry data for leaderboard */
export interface LeaderboardEntry {
	player_id: number;
	player_name: string;
	score: number;
	rank: number;
	correct_answers?: number;
	total_answers?: number;
	connected?: boolean;
	answered?: boolean;
}

export interface LeaderboardProps {
	/** List of player entries */
	entries: LeaderboardEntry[];
	/** Show stats (correct/total answers) */
	showStats?: boolean;
	/** Current user's player ID for highlighting */
	highlightPlayerId?: number;
	/** Total connected count (for header display) */
	connectedCount?: number;
	/** Callback for score changes (moderator only) */
	onScoreChange?: (playerId: number, delta: number) => void;
	/** Custom title */
	title?: React.ReactNode;
	/** Whether to show connection status dots */
	showConnectionStatus?: boolean;
}

/**
 * Unified leaderboard component.
 * 
 * Usage in Player view:
 * ```tsx
 * <Leaderboard entries={entries} highlightPlayerId={currentPlayerId} />
 * ```
 * 
 * Usage in Moderator view:
 * ```tsx
 * <Leaderboard 
 *   entries={entries} 
 *   onScoreChange={handleScoreChange}
 *   connectedCount={5}
 *   showConnectionStatus
 * />
 * ```
 */
export const Leaderboard: React.FC<LeaderboardProps> = ({
	entries,
	showStats = false,
	highlightPlayerId,
	connectedCount,
	onScoreChange,
	title,
	showConnectionStatus = false,
}) => {
	const sortedEntries = [...entries].sort((a, b) => b.score - a.score);
	const isModerator = !!onScoreChange;

	// Generate stats string
	const getStats = (entry: LeaderboardEntry): string | undefined => {
		if (!showStats || entry.correct_answers === undefined) return undefined;
		return `${entry.correct_answers}/${entry.total_answers} correct`;
	};

	// Render score control buttons for moderator
	const renderScoreControls = (playerId: number) => {
		if (!onScoreChange) return null;
		
		return (
			<div className={styles.scoreControls}>
				<button
					className={`${styles.scoreButton} ${styles.subtract}`}
					onClick={() => onScoreChange(playerId, -1)}
					title="-1"
				>
					−
				</button>
				<button
					className={`${styles.scoreButton} ${styles.add}`}
					onClick={() => onScoreChange(playerId, 1)}
					title="+1"
				>
					+
				</button>
			</div>
		);
	};

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h3 className={styles.title}>
					<Icon name="trophy" size="sm" color="inverse" />
					{title ?? <Trans id="leaderboard.title">Rangliste</Trans>}
				</h3>
				{connectedCount !== undefined && (
					<span className={styles.playerCount}>
						{connectedCount}/{entries.length}
					</span>
				)}
			</header>

			{sortedEntries.length === 0 ? (
				<div className={styles.empty}>
					<span className={styles.emptyIcon}>👥</span>
					<p className={styles.emptyText}>
						<Trans id="leaderboard.empty">Noch keine Spieler</Trans>
					</p>
					<p className={styles.emptyHint}>
						<Trans id="leaderboard.shareCode">Teile den Session-Code!</Trans>
					</p>
				</div>
			) : (
				<div className={styles.list}>
					{sortedEntries.map((entry, index) => (
						<LeaderboardItem
							key={entry.player_id}
							rank={index + 1}
							name={entry.player_name}
							score={entry.score}
							isCurrentUser={entry.player_id === highlightPlayerId}
							isConnected={showConnectionStatus || isModerator ? entry.connected : undefined}
							hasAnswered={isModerator ? entry.answered : undefined}
							stats={getStats(entry)}
							actions={renderScoreControls(entry.player_id)}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default Leaderboard;
