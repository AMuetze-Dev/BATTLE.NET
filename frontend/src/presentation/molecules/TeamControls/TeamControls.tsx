/**
 * TeamControls Molecule - Battle.Net Quiz Platform
 *
 * Team controls for moderator in team mode.
 * Allows score adjustments and active player selection.
 */

import React from 'react';
import { Trans } from '@lingui/react/macro';
import { Button, Icon } from '../../atoms';
import styles from './TeamControls.module.css';

export interface TeamInfo {
	id: string;
	name: string;
	color: string;
	score: number;
	memberCount: number;
}

export interface TeamControlsProps {
	/** List of teams */
	teams: TeamInfo[];
	/** Current question type */
	questionType?: string;
	/** Whether there's an active question */
	hasActiveQuestion: boolean;
	/** Handler for selecting active players */
	onSelectActivePlayers: () => void;
	/** Handler for team score changes */
	onTeamScoreChange: (teamId: string, delta: number) => void;
}

/**
 * TeamControls provides team management for moderators
 */
export const TeamControls: React.FC<TeamControlsProps> = ({ teams, questionType, hasActiveQuestion, onSelectActivePlayers, onTeamScoreChange }) => {
	const isInputQuestion = questionType?.toLowerCase().replace('-', '_') === 'input';

	return (
		<div className={styles.container}>
			<h3 className={styles.title}>
				<Icon name="users" size="sm" />
				<Trans id="moderator.teamControls.title">Team-Steuerung</Trans>
			</h3>

			{/* Active player selection for input questions */}
			{isInputQuestion && hasActiveQuestion && (
				<div className={styles.actionRow}>
					<Button size="sm" variant="primary" onClick={onSelectActivePlayers}>
						<Icon name="refresh" size="xs" />
						<Trans id="moderator.teamControls.selectActive">Aktive Spieler würfeln</Trans>
					</Button>
				</div>
			)}

			{/* Team score controls */}
			<div className={styles.teamList}>
				{teams.map((team) => (
					<div key={team.id} className={styles.teamRow}>
						<div className={styles.teamInfo}>
							<span className={styles.teamColor} style={{ backgroundColor: team.color }} />
							<span className={styles.teamName}>{team.name}</span>
							<span className={styles.memberCount}>({team.memberCount})</span>
						</div>
						<div className={styles.scoreSection}>
							<span className={styles.score}>{team.score}</span>
							<div className={styles.scoreButtons}>
								<Button size="sm" variant="outline" onClick={() => onTeamScoreChange(team.id, -10)} title="-10 Punkte">
									−10
								</Button>
								<Button size="sm" variant="success" onClick={() => onTeamScoreChange(team.id, 10)} title="+10 Punkte">
									+10
								</Button>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default TeamControls;
