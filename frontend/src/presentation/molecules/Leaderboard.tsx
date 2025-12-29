/**
 * Leaderboard component - Display player rankings
 */
import React from 'react';
import styled from 'styled-components';
import { Card } from '../atoms';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface LeaderboardEntry {
	player_id: number;
	player_name: string;
	score: number;
	rank: number;
	correct_answers?: number;
	total_answers?: number;
}

export interface LeaderboardProps {
	entries: LeaderboardEntry[];
	showStats?: boolean;
	highlightPlayerId?: number;
}

const LeaderboardContainer = styled(Card)`
	overflow: hidden;
`;

const Header = styled.div`
	padding: ${spacing.sm} ${spacing.md};
	background: linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%);
	color: ${colors.text.inverse};
`;

const Title = styled.h2`
	margin: 0;
	font-size: ${typography.fontSize.md};
	font-weight: ${typography.fontWeight.bold};
`;

const EntriesList = styled.div`
	padding: ${spacing.xs};
	display: flex;
	flex-direction: column;
	gap: ${spacing.xs};
`;

const EntryRow = styled.div<{ rank: number; highlight?: boolean }>`
	display: grid;
	grid-template-columns: 36px 1fr auto;
	align-items: center;
	gap: ${spacing.sm};
	padding: ${spacing.xs} ${spacing.sm};
	border-radius: ${borderRadius.sm};
	background: ${({ highlight }) => (highlight ? colors.primary[50] : colors.surface)};
	border: 1px solid ${({ highlight }) => (highlight ? colors.primary[300] : 'transparent')};
	transition: all 0.2s ease;

	${({ rank }) =>
		rank === 1 &&
		`
    background: linear-gradient(135deg, ${colors.primary[100]} 0%, ${colors.primary[50]} 100%);
    border-color: ${colors.primary[400]};
  `}

	${({ rank }) =>
		rank === 2 &&
		`
    background: ${colors.neutral[100]};
    border-color: ${colors.neutral[300]};
  `}
  
  ${({ rank }) =>
		rank === 3 &&
		`
    background: ${colors.primary[50]};
    border-color: ${colors.primary[200]};
  `}
  
  &:hover {
		transform: translateX(2px);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
	}
`;

const RankBadge = styled.div<{ rank: number }>`
	width: 28px;
	height: 28px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: ${typography.fontSize.sm};
	font-weight: ${typography.fontWeight.bold};
	background: ${colors.neutral[200]};
	color: ${colors.text.primary};

	${({ rank }) =>
		rank === 1 &&
		`
    background: ${colors.primary[500]};
    color: ${colors.text.inverse};
    box-shadow: 0 2px 6px rgba(14, 165, 233, 0.4);
  `}

	${({ rank }) =>
		rank === 2 &&
		`
    background: ${colors.neutral[400]};
    color: ${colors.text.inverse};
  `}
  
  ${({ rank }) =>
		rank === 3 &&
		`
    background: ${colors.primary[400]};
    color: ${colors.text.inverse};
  `}
`;

const PlayerInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.xs};
`;

const PlayerName = styled.span`
	font-size: ${typography.fontSize.sm};
	font-weight: ${typography.fontWeight.semibold};
	color: ${colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const PlayerStats = styled.span`
	font-size: ${typography.fontSize.xs};
	color: ${colors.text.secondary};
`;

const ScoreBadge = styled.div`
	color: ${colors.primary[600]};
	font-size: ${typography.fontSize.sm};
	font-weight: ${typography.fontWeight.bold};
	white-space: nowrap;
`;

const EmptyState = styled.div`
	padding: ${spacing.md};
	text-align: center;
	color: ${colors.text.secondary};
	font-size: ${typography.fontSize.sm};
`;

const getMedalEmoji = (rank: number): string => {
	switch (rank) {
		case 1:
			return '🥇';
		case 2:
			return '🥈';
		case 3:
			return '🥉';
		default:
			return String(rank);
	}
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, showStats = false, highlightPlayerId }) => {
	if (entries.length === 0) {
		return (
			<LeaderboardContainer variant="outlined" padding="none">
				<Header>
					<Title>🏆 Leaderboard</Title>
				</Header>
				<EmptyState>No players yet. Join to compete!</EmptyState>
			</LeaderboardContainer>
		);
	}

	return (
		<LeaderboardContainer variant="outlined" padding="none">
			<Header>
				<Title>🏆 Leaderboard</Title>
			</Header>
			<EntriesList>
				{entries.map((entry) => (
					<EntryRow key={entry.player_id} rank={entry.rank} highlight={entry.player_id === highlightPlayerId}>
						<RankBadge rank={entry.rank}>{getMedalEmoji(entry.rank)}</RankBadge>
						<PlayerInfo>
							<PlayerName>{entry.player_name}</PlayerName>
							{showStats && entry.correct_answers !== undefined && (
								<PlayerStats>
									{entry.correct_answers}/{entry.total_answers} correct
								</PlayerStats>
							)}
						</PlayerInfo>
						<ScoreBadge>{entry.score} pts</ScoreBadge>
					</EntryRow>
				))}
			</EntriesList>
		</LeaderboardContainer>
	);
};
