/**
 * ModeratorLeaderboard Organism - Battle.Net Quiz Platform
 *
 * Leaderboard sidebar for moderator with score controls.
 * Uses unified Leaderboard molecule with control actions.
 */

import React from 'react';
import { Leaderboard, LeaderboardEntry } from '../../molecules/Leaderboard';
import styles from './ModeratorLeaderboard.module.css';

/** Player data for leaderboard */
export interface LeaderboardPlayer {
	id: number;
	name: string;
	score: number;
	connected: boolean;
	answered: boolean;
}

export interface ModeratorLeaderboardProps {
	/** List of players */
	players: LeaderboardPlayer[];
	/** Number of connected players */
	connectedCount: number;
	/** Callback for score changes */
	onScoreChange: (playerId: number, delta: number) => void;
}

/**
 * Leaderboard sidebar for moderator.
 * Wraps unified Leaderboard molecule with moderator-specific features.
 */
export const ModeratorLeaderboard: React.FC<ModeratorLeaderboardProps> = ({ players, connectedCount, onScoreChange }) => {
	// Convert players to leaderboard entries format
	const entries: LeaderboardEntry[] = players
		.sort((a, b) => b.score - a.score)
		.map((player, index) => ({
			player_id: player.id,
			player_name: player.name,
			score: player.score,
			rank: index + 1,
			connected: player.connected,
			answered: player.answered,
		}));

	return (
		<div className={styles.container}>
			<Leaderboard entries={entries} connectedCount={connectedCount} onScoreChange={onScoreChange} showConnectionStatus />
		</div>
	);
};

export default ModeratorLeaderboard;
