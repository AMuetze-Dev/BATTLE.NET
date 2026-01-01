/**
 * TeamConfigEditor Molecule - Configure teams for team mode
 */
import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Trans } from '@lingui/react/macro';
import { TeamConfig, TeamDefinition } from '../../types/team.types';
import { IconButton } from '../atoms/IconButton';
import styles from './TeamConfigEditor.module.css';

export interface TeamConfigEditorProps {
	config: TeamConfig;
	onUpdateTeam: (teamId: string, field: keyof TeamDefinition, value: string) => void;
	onAddTeam: () => void;
	onRemoveTeam: (teamId: string) => void;
}

export const TeamConfigEditor: React.FC<TeamConfigEditorProps> = ({ config, onUpdateTeam, onAddTeam, onRemoveTeam }) => {
	return (
		<div className={styles.editor}>
			<h3 className={styles.title}>
				<Trans id="quizEditor.teamConfig">Teams konfigurieren</Trans>
			</h3>
			<div className={styles.teamList}>
				{config.teams.map((team, index) => (
					<div key={team.id} className={styles.teamRow}>
						<input type="color" value={team.color} onChange={(e) => onUpdateTeam(team.id, 'color', e.target.value)} className={styles.colorPicker} title="Teamfarbe wählen" />
						<input type="text" value={team.name} onChange={(e) => onUpdateTeam(team.id, 'name', e.target.value)} className={styles.nameInput} placeholder={`Team ${index + 1}`} />
						<IconButton icon={<FiTrash2 size={16} />} onClick={() => onRemoveTeam(team.id)} variant="danger" title="Team entfernen" disabled={config.teams.length <= 2} />
					</div>
				))}
				<button type="button" className={styles.addButton} onClick={onAddTeam}>
					<FiPlus size={16} />
					<Trans id="quizEditor.addTeam">Team hinzufügen</Trans>
				</button>
			</div>
		</div>
	);
};
