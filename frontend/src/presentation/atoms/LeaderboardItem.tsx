/**
 * LeaderboardItem Atom - Battle.Net Quiz Platform
 *
 * Displays a single player entry in the leaderboard.
 * Reusable across Player and Moderator views.
 *
 * @module atoms/LeaderboardItem
 */

import React from 'react';
import styles from './LeaderboardItem.module.css';

export interface LeaderboardItemProps {
	/** Player's rank position */
	rank: number;
	/** Player's display name */
	name: string;
	/** Current score */
	score: number;
	/** Whether this is the current user (for highlighting) */
	isCurrentUser?: boolean;
	/** Whether the player is connected */
	isConnected?: boolean;
	/** Whether the player has answered the current question */
	hasAnswered?: boolean;
	/** Optional stats display (e.g., "3/5 correct") */
	stats?: string;
	/** Render props for action buttons (moderator controls) */
	actions?: React.ReactNode;
}

/**
 * Single player entry in the leaderboard.
 * Supports highlighting, connection status, and optional moderator actions.
 */
export const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ rank, name, score, isCurrentUser = false, isConnected = true, hasAnswered = false, stats, actions }) => {
	// Determine rank tier for styling
	const rankTier = rank <= 3 ? `rank${rank}` : '';

	const containerClasses = [styles.item, isCurrentUser && styles.currentUser, !isConnected && styles.disconnected, hasAnswered && styles.answered].filter(Boolean).join(' ');

	const rankClasses = [styles.rankBadge, rankTier && styles[rankTier]].filter(Boolean).join(' ');

	return (
		<div className={containerClasses}>
			<div className={rankClasses}>{rank}</div>

			{isConnected !== undefined && <span className={`${styles.statusDot} ${isConnected ? styles.online : styles.offline}`} title={isConnected ? 'Online' : 'Offline'} />}

			<div className={styles.playerInfo}>
				<span className={styles.playerName}>{name}</span>
				{stats && <span className={styles.playerStats}>{stats}</span>}
			</div>

			<div className={styles.score}>
				{score}
				<span className={styles.scoreUnit}>pts</span>
			</div>

			{actions && <div className={styles.actions}>{actions}</div>}
		</div>
	);
};

export default LeaderboardItem;
