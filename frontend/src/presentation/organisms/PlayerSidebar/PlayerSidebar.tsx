/**
 * PlayerSidebar Organism - Battle.Net Quiz Platform
 *
 * Sidebar component displaying player score and leaderboard.
 * Uses unified Leaderboard molecule - no card-in-card design.
 * Supports both individual and team mode leaderboards.
 */

import React from 'react';
import { Trans } from '@lingui/react/macro';
import { Leaderboard, LeaderboardEntry } from '../../molecules/Leaderboard';
import { TeamLeaderboard } from '../../molecules/TeamLeaderboard';
import type { TeamLeaderboardEntry } from '../../../types/team.types';
import styles from './PlayerSidebar.module.css';

export interface PlayerSidebarProps {
	/** Current player's score */
	score: number;
	/** Player name */
	playerName: string;
	/** Current player ID for highlighting */
	playerId: number;
	/** Leaderboard entries */
	leaderboard: LeaderboardEntry[];
	/** Whether score recently increased */
	scoreIncreased?: boolean;
	/** Whether in team mode */
	isTeamMode?: boolean;
	/** Team leaderboard entries (for team mode) */
	teamLeaderboard?: TeamLeaderboardEntry[];
	/** Current player's team ID (for highlighting in team mode) */
	currentTeamId?: string;
}

/**
 * Sidebar component with player score and leaderboard.
 * Clean design without nested cards.
 */
export const PlayerSidebar: React.FC<PlayerSidebarProps> = ({ score, playerName, playerId, leaderboard, scoreIncreased = false, isTeamMode = false, teamLeaderboard = [], currentTeamId }) => {
	return (
		<aside className={styles.sidebar}>
			{/* Score Card */}
			<div className={styles.scoreCard}>
				<div className={styles.playerName}>{playerName}</div>
				<div className={styles.scoreLabel}>
					<Trans id="player.yourScore">Deine Punkte</Trans>
				</div>
				<div className={`${styles.score} ${scoreIncreased ? styles.scoreIncreased : ''}`}>{score}</div>
			</div>

			{/* Leaderboard - show team leaderboard in team mode, otherwise individual */}
			<div className={styles.leaderboardSection}>{isTeamMode && teamLeaderboard.length > 0 ? <TeamLeaderboard entries={teamLeaderboard} currentTeamId={currentTeamId} /> : <Leaderboard entries={leaderboard} highlightPlayerId={playerId} />}</div>
		</aside>
	);
};

export default PlayerSidebar;
