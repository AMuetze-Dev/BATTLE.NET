/**
 * TeamSelection Component - Battle.Net Quiz Platform
 *
 * Allows players to select a team when joining a team-mode session.
 * Displays available teams with member counts and colors.
 */
import React, { useState, useCallback } from 'react';
import { Trans } from '@lingui/react/macro';
import styles from './TeamSelection.module.css';

export interface TeamOption {
	id: string;
	name: string;
	color: string;
	memberCount: number;
	connectedCount: number;
	maxPlayers?: number;
}

export interface TeamSelectionProps {
	/** Available teams to choose from */
	teams: TeamOption[];
	/** Currently selected team ID */
	selectedTeamId?: string | null;
	/** Session ID for display */
	sessionId: string;
	/** Player name for display */
	playerName: string;
	/** Loading state during team join */
	loading?: boolean;
	/** Error message if join failed */
	error?: string | null;
	/** Called when player selects a team */
	onSelectTeam: (teamId: string) => void;
	/** Called when player confirms team selection */
	onConfirm: () => void;
	/** Called when player wants to go back */
	onBack?: () => void;
}

/**
 * TeamSelection - Team chooser for players
 *
 * Features:
 * - Visual team cards with colors
 * - Member count display
 * - Highlights selected team
 * - Responsive grid layout
 */
export const TeamSelection: React.FC<TeamSelectionProps> = ({ teams, selectedTeamId, sessionId, playerName, loading = false, error = null, onSelectTeam, onConfirm, onBack }) => {
	const handleTeamClick = useCallback(
		(teamId: string) => {
			if (!loading) {
				onSelectTeam(teamId);
			}
		},
		[loading, onSelectTeam]
	);

	const selectedTeam = teams.find((t) => t.id === selectedTeamId);

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h1 className={styles.title}>
					<Trans id="teamSelection.title">Wähle dein Team</Trans>
				</h1>
				<p className={styles.subtitle}>
					<Trans id="teamSelection.subtitle">Hallo {playerName}! Wähle ein Team, um dem Quiz beizutreten.</Trans>
				</p>
				<span className={styles.sessionBadge}>Session: {sessionId}</span>
			</header>

			{error && (
				<div className={styles.error} role="alert">
					{error}
				</div>
			)}

			<div className={styles.teamsGrid}>
				{teams.map((team) => {
					const isSelected = team.id === selectedTeamId;
					const isFull = team.maxPlayers !== undefined && team.memberCount >= team.maxPlayers;

					return (
						<button
							key={team.id}
							className={`${styles.teamCard} ${isSelected ? styles.selected : ''} ${isFull ? styles.full : ''}`}
							style={
								{
									'--team-color': team.color,
									'--team-color-light': `${team.color}22`,
								} as React.CSSProperties
							}
							onClick={() => !isFull && handleTeamClick(team.id)}
							disabled={loading || isFull}
							aria-pressed={isSelected}
						>
							<div className={styles.teamColorBand} />
							<div className={styles.teamContent}>
								<span className={styles.teamName}>{team.name}</span>
								<span className={styles.teamMembers}>
									<span className={styles.memberIcon}>👥</span>
									{team.connectedCount}/{team.memberCount}
									{team.maxPlayers && ` (max ${team.maxPlayers})`}
									<Trans id="teamSelection.players"> Spieler</Trans>
								</span>
								{isFull && (
									<span className={styles.fullBadge}>
										<Trans id="teamSelection.full">Voll</Trans>
									</span>
								)}
								{isSelected && !isFull && (
									<span className={styles.selectedBadge}>
										<Trans id="teamSelection.selected">Ausgewählt</Trans>
									</span>
								)}
							</div>
						</button>
					);
				})}
			</div>

			<footer className={styles.footer}>
				{onBack && (
					<button className={styles.backButton} onClick={onBack} disabled={loading}>
						<Trans id="common.back">Zurück</Trans>
					</button>
				)}
				<button
					className={styles.confirmButton}
					onClick={onConfirm}
					disabled={!selectedTeamId || loading}
					style={
						{
							'--confirm-color': selectedTeam?.color || 'var(--color-primary)',
						} as React.CSSProperties
					}
				>
					{loading ? (
						<span className={styles.spinner} />
					) : (
						<>
							<Trans id="teamSelection.joinTeam">Team beitreten</Trans>
							{selectedTeam && `: ${selectedTeam.name}`}
						</>
					)}
				</button>
			</footer>
		</div>
	);
};

export default TeamSelection;
