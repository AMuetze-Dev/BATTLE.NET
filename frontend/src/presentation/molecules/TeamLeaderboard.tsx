/**
 * TeamLeaderboard Component - Battle.Net Quiz Platform
 *
 * Displays team standings with scores, member counts, and visual indicators.
 * Used in team mode to show team competition.
 */
import React from 'react';
import { Trans } from '@lingui/react/macro';
import styles from './TeamLeaderboard.module.css';

export interface TeamLeaderboardEntry {
	teamId: string;
	teamName: string;
	teamColor: string;
	score: number;
	rank: number;
	memberCount: number;
	connectedCount: number;
}

export interface TeamLeaderboardProps {
	/** Team entries sorted by rank */
	entries: TeamLeaderboardEntry[];
	/** Current player's team ID for highlighting */
	currentTeamId?: string | null;
	/** Whether to show expanded view with more details */
	expanded?: boolean;
	/** Title override */
	title?: string;
}

/**
 * TeamLeaderboard - Team standings display
 *
 * Features:
 * - Ranked team list with visual colors
 * - Score display with animations
 * - Current team highlighting
 * - Member count indicators
 */
export const TeamLeaderboard: React.FC<TeamLeaderboardProps> = ({ entries, currentTeamId, expanded = false, title }) => {
	if (entries.length === 0) {
		return (
			<div className={styles.container}>
				<h3 className={styles.title}>{title || <Trans id="teamLeaderboard.title">Team-Rangliste</Trans>}</h3>
				<div className={styles.empty}>
					<Trans id="teamLeaderboard.noTeams">Keine Teams vorhanden</Trans>
				</div>
			</div>
		);
	}

	const maxScore = Math.max(...entries.map((e) => e.score), 1);

	return (
		<div className={styles.container}>
			<h3 className={styles.title}>{title || <Trans id="teamLeaderboard.title">Team-Rangliste</Trans>}</h3>
			<div className={styles.list}>
				{entries.map((entry) => {
					const isCurrentTeam = entry.teamId === currentTeamId;
					const scorePercent = (entry.score / maxScore) * 100;

					return (
						<div
							key={entry.teamId}
							className={`${styles.entry} ${isCurrentTeam ? styles.current : ''}`}
							style={
								{
									'--team-color': entry.teamColor,
									'--score-percent': `${scorePercent}%`,
								} as React.CSSProperties
							}
						>
							<div className={styles.rank}>
								{entry.rank === 1 && '🥇'}
								{entry.rank === 2 && '🥈'}
								{entry.rank === 3 && '🥉'}
								{entry.rank > 3 && `#${entry.rank}`}
							</div>

							<div className={styles.teamInfo}>
								<div className={styles.teamColorDot} />
								<span className={styles.teamName}>{entry.teamName}</span>
								{isCurrentTeam && (
									<span className={styles.yourTeamBadge}>
										<Trans id="teamLeaderboard.yourTeam">Dein Team</Trans>
									</span>
								)}
							</div>

							{expanded && (
								<div className={styles.members}>
									<span className={styles.memberIcon}>👥</span>
									{entry.connectedCount}/{entry.memberCount}
								</div>
							)}

							<div className={styles.scoreContainer}>
								<div className={styles.scoreBar} />
								<span className={styles.score}>{entry.score}</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default TeamLeaderboard;
