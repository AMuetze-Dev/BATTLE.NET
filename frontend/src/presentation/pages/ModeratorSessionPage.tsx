/**
 * Moderator Session Page - Gamified Quiz Control Dashboard
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Trans } from '@lingui/react/macro';
import { Button, Card, Modal, ConnectionStatus } from '../atoms';
import { FileUpload } from '../molecules/FileUpload';
import { api, Session } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { GameState } from '../../services/websocket';
import { colors, spacing, typography, borderRadius } from '../../theme';

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
	position: fixed;
	inset: 0;
	display: grid;
	grid-template-columns: 1fr 300px;
	gap: ${spacing.sm};
	animation: ${fadeIn} 0.3s ease-out;
	background: ${colors.background};
	overflow: hidden;

	@media (max-width: 1200px) {
		grid-template-columns: 1fr 260px;
	}

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
		overflow-y: auto;
		overflow-x: hidden;
	}
`;

const MainPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.sm};
	overflow: hidden;
	padding: ${spacing.sm};

	@media (max-width: 768px) {
		padding: ${spacing.xs};
		gap: ${spacing.xs};
	}

	@media (max-width: 1024px) {
		overflow: visible;
	}
`;

const SidePanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.sm};
	background: linear-gradient(180deg, ${colors.neutral[50]} 0%, ${colors.background} 100%);
	border-radius: 12px;
	padding: ${spacing.md};
	border: 1px solid ${colors.border.light};
	overflow-y: auto;

	@media (max-width: 1024px) {
		border-radius: 0;
		border: none;
		border-top: 2px solid ${colors.border.light};
		max-height: 50vh;
		padding: ${spacing.sm};
	}
`;

const SessionHeader = styled(Card)`
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%) !important;
	color: ${colors.text.inverse};
	padding: ${spacing.md} ${spacing.lg};
	flex-shrink: 0;
	gap: ${spacing.md};
	flex-wrap: wrap;

	@media (max-width: 768px) {
		padding: ${spacing.sm} ${spacing.md};
		flex-direction: column;
		align-items: stretch;
		text-align: center;
	}
`;

const SessionCode = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.xs};
`;

const CodeLabel = styled.div`
	font-size: ${typography.fontSize.sm};
	opacity: 0.9;
`;

const CodeValue = styled.div`
	font-size: ${typography.fontSize['3xl']};
	font-weight: ${typography.fontWeight.bold};
	letter-spacing: 6px;
	font-family: ${typography.fontFamily.mono};

	@media (max-width: 480px) {
		font-size: ${typography.fontSize['2xl']};
		letter-spacing: 4px;
	}
`;

const SessionStats = styled.div`
	display: flex;
	gap: ${spacing.xl};

	@media (max-width: 768px) {
		justify-content: center;
		gap: ${spacing.lg};
	}
`;

const StatItem = styled.div`
	text-align: center;
`;

const StatValue = styled.div`
	font-size: ${typography.fontSize['2xl']};
	font-weight: ${typography.fontWeight.bold};
`;

const StatLabel = styled.div`
	font-size: ${typography.fontSize.xs};
	opacity: 0.8;
`;

// Compact control bar - single row with navigation + timer
const ControlBar = styled(Card)`
	display: flex;
	align-items: center;
	gap: ${spacing.md};
	padding: ${spacing.sm} ${spacing.md};
	background: linear-gradient(135deg, ${colors.surface} 0%, ${colors.neutral[50]} 100%);
	border: 1px solid ${colors.border.light};
	border-radius: 12px;
	flex-shrink: 0;
	flex-wrap: wrap;
	justify-content: space-between;

	@media (max-width: 768px) {
		gap: ${spacing.sm};
		padding: ${spacing.xs} ${spacing.sm};
	}
`;

const ControlSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.sm};
	padding: ${spacing.sm};
	background: ${colors.surface};
	border-radius: 8px;
	border: 1px solid ${colors.border.light};
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	transition: box-shadow 0.2s ease, border-color 0.2s ease;
	min-width: 0;

	&:hover {
		border-color: ${colors.primary[200]};
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	@media (max-width: 768px) {
		padding: ${spacing.xs};
	}
`;

const SectionTitle = styled.h3`
	margin: 0;
	font-size: ${typography.fontSize.xs};
	font-weight: ${typography.fontWeight.semibold};
	color: ${colors.primary[700]};
	display: flex;
	align-items: center;
	gap: ${spacing.xs};
	padding-bottom: ${spacing.xs};
	border-bottom: 1px solid ${colors.primary[100]};
`;

const ButtonRow = styled.div`
	display: flex;
	gap: ${spacing.sm};
	flex-wrap: wrap;
	align-items: center;

	@media (max-width: 480px) {
		gap: ${spacing.xs};
		justify-content: center;
	}
`;

const QuestionIndicator = styled.span`
	padding: ${spacing.xs} ${spacing.sm};
	font-size: ${typography.fontSize.xs};
	font-weight: ${typography.fontWeight.medium};
	background: ${colors.primary[50]};
	color: ${colors.primary[700]};
	border-radius: 4px;
	min-width: 80px;
	text-align: center;
	white-space: nowrap;
`;

// New three-part layout for question display
const QuestionContentArea = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: ${spacing.md};
	overflow: hidden;

	@media (max-width: 768px) {
		gap: ${spacing.sm};
	}
`;

// Top section: Question text with controls
const QuestionTopSection = styled(Card)<{ $hasQuestion: boolean }>`
	padding: ${spacing.md};
	background: ${({ $hasQuestion }) => ($hasQuestion ? `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)` : colors.surface)};
	border: 2px solid ${({ $hasQuestion }) => ($hasQuestion ? colors.primary[400] : colors.border.light)};
	flex-shrink: 0;

	@media (max-width: 768px) {
		padding: ${spacing.sm};
	}
`;

const QuestionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${spacing.md};
	margin-bottom: ${spacing.sm};
	flex-wrap: wrap;

	@media (max-width: 480px) {
		flex-direction: column;
		align-items: stretch;
		gap: ${spacing.sm};
	}
`;

// Bottom section: split into two columns
const QuestionBottomSection = styled.div`
	flex: 1;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: ${spacing.md};
	min-height: 0;
	overflow: hidden;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
		grid-template-rows: auto 1fr;
		overflow: visible;
	}
`;

// Left column: Image (if present)
const ImageColumn = styled(Card)`
	display: flex;
	flex-direction: column;
	padding: ${spacing.md};
	overflow: hidden;

	@media (max-width: 768px) {
		padding: ${spacing.sm};
	}
`;

const ImageColumnHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: ${spacing.sm};
	padding-bottom: ${spacing.sm};
	border-bottom: 1px solid ${colors.border.light};
`;

const ImageColumnTitle = styled.h4`
	margin: 0;
	font-size: ${typography.fontSize.sm};
	font-weight: ${typography.fontWeight.semibold};
	color: ${colors.primary[700]};
`;

const ImageWrapper = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
`;

// Right column: Answers
const AnswersColumn = styled(Card)<{ $fullWidth?: boolean }>`
	display: flex;
	flex-direction: column;
	padding: ${spacing.md};
	overflow: hidden;
	${({ $fullWidth }) => $fullWidth && 'grid-column: 1 / -1;'}

	@media (max-width: 768px) {
		padding: ${spacing.sm};
	}
`;

const AnswersColumnHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: ${spacing.sm};
	padding-bottom: ${spacing.sm};
	border-bottom: 1px solid ${colors.border.light};
`;

const AnswersColumnTitle = styled.h4`
	margin: 0;
	font-size: ${typography.fontSize.sm};
	font-weight: ${typography.fontWeight.semibold};
	color: ${colors.primary[700]};
`;

const AnswersScrollArea = styled.div`
	flex: 1;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: ${spacing.sm};
`;

// Placeholder for when no question is active
const QuestionDisplay = styled(Card)<{ $hasQuestion: boolean }>`
	text-align: center;
	padding: ${spacing.lg};
	min-height: 140px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	background: ${colors.surface};
	border: 2px solid ${colors.border.light};
	transition: all 0.3s ease;
	flex-shrink: 0;

	@media (max-width: 768px) {
		padding: ${spacing.md};
		min-height: 120px;
	}

	@media (max-width: 480px) {
		padding: ${spacing.sm};
		min-height: 100px;
	}
`;

const QuestionText = styled.h2`
	font-size: ${typography.fontSize.lg};
	font-weight: ${typography.fontWeight.bold};
	color: ${colors.text.primary};
	margin: 0;
	line-height: 1.4;
	text-align: center;

	@media (max-width: 768px) {
		font-size: ${typography.fontSize.md};
	}
`;

const QuestionMeta = styled.div`
	display: flex;
	gap: ${spacing.sm};
	justify-content: center;
	margin-bottom: ${spacing.sm};
	flex-wrap: wrap;
`;

const MetaTag = styled.span`
	padding: ${spacing.xs} ${spacing.sm};
	background: ${colors.primary[100]};
	color: ${colors.primary[700]};
	border-radius: 4px;
	font-size: ${typography.fontSize.xs};
	font-weight: ${typography.fontWeight.medium};
`;

const NextQuestionPreview = styled.div`
	display: flex;
	align-items: center;
	gap: ${spacing.sm};
	padding: ${spacing.sm} ${spacing.md};
	background: ${colors.neutral[50]};
	border-radius: 6px;
	font-size: ${typography.fontSize.sm};
	color: ${colors.text.secondary};
	margin-top: ${spacing.sm};
`;

const NextQuestionType = styled.span`
	font-weight: ${typography.fontWeight.semibold};
	color: ${colors.primary[600]};
`;

// Image display components
const QuestionImageContainer = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const QuestionImage = styled.img`
	max-width: 100%;
	max-height: 100%;
	object-fit: contain;
	border-radius: ${borderRadius.md};
	display: block;
`;

// Hotspot overlay container - positioned relative to image
const HotspotImageWrapper = styled.div`
	position: relative;
	display: inline-block;
	max-width: 100%;
	max-height: 100%;
`;

const HotspotImage = styled.img`
	max-width: 100%;
	max-height: 100%;
	object-fit: contain;
	border-radius: ${borderRadius.md};
	display: block;
`;

// Player pin marker on hotspot
const PlayerPin = styled.div<{ $x: number; $y: number; $color: string; $isCorrect?: boolean; $highlighted?: boolean; $dimmed?: boolean }>`
	position: absolute;
	left: ${({ $x }) => $x}%;
	top: ${({ $y }) => $y}%;
	transform: translate(-50%, -100%) ${({ $highlighted }) => ($highlighted ? 'scale(1.3)' : 'scale(1)')};
	z-index: ${({ $isCorrect, $highlighted }) => ($highlighted ? 200 : $isCorrect ? 100 : 10)};
	display: flex;
	flex-direction: column;
	align-items: center;
	pointer-events: auto;
	opacity: ${({ $dimmed }) => ($dimmed ? 0.3 : 1)};
	transition: all 0.2s ease;

	&::before {
		content: '';
		width: ${({ $isCorrect, $highlighted }) => ($highlighted ? '28px' : $isCorrect ? '24px' : '20px')};
		height: ${({ $isCorrect, $highlighted }) => ($highlighted ? '28px' : $isCorrect ? '24px' : '20px')};
		background: ${({ $color, $isCorrect }) => ($isCorrect ? colors.success[500] : $color)};
		border: 3px solid white;
		border-radius: 50% 50% 50% 0;
		transform: rotate(-45deg);
		box-shadow: ${({ $highlighted }) => ($highlighted ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.3)')};
	}

	&::after {
		content: '';
		position: absolute;
		bottom: 0;
		width: 6px;
		height: 6px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 50%;
		transform: translateY(4px);
	}
`;

const PinLabel = styled.div<{ $color: string; $isCorrect?: boolean; $highlighted?: boolean }>`
	position: absolute;
	top: ${({ $highlighted }) => ($highlighted ? '-32px' : '-28px')};
	left: 50%;
	transform: translateX(-50%);
	background: ${({ $color, $isCorrect }) => ($isCorrect ? colors.success[600] : $color)};
	color: white;
	padding: ${({ $highlighted }) => ($highlighted ? '4px 10px' : '2px 6px')};
	border-radius: 4px;
	font-size: ${({ $highlighted }) => ($highlighted ? typography.fontSize.sm : typography.fontSize.xs)};
	font-weight: ${typography.fontWeight.semibold};
	white-space: nowrap;
	box-shadow: ${({ $highlighted }) => ($highlighted ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 1px 4px rgba(0, 0, 0, 0.2)')};
	transition: all 0.2s ease;
`;

// Color palette for player pins
const playerPinColors = [
	colors.primary[500],
	'#8b5cf6', // violet
	'#f59e0b', // amber
	'#ec4899', // pink
	'#14b8a6', // teal
	'#f97316', // orange
	'#6366f1', // indigo
	'#84cc16', // lime
];

const CorrectAnswerSection = styled.div`
	padding: ${spacing.md};
	background: linear-gradient(135deg, ${colors.success[50]} 0%, ${colors.success[100]} 100%);
	border: 2px solid ${colors.success[300]};
	border-radius: ${borderRadius.md};

	@media (max-width: 768px) {
		padding: ${spacing.sm};
	}
`;

const CorrectAnswerLabel = styled.div`
	font-size: ${typography.fontSize.xs};
	font-weight: ${typography.fontWeight.semibold};
	color: ${colors.success[700]};
	margin-bottom: ${spacing.xs};
	text-transform: uppercase;
	letter-spacing: 0.5px;
`;

const CorrectAnswerText = styled.div`
	font-size: ${typography.fontSize.lg};
	font-weight: ${typography.fontWeight.semibold};
	color: ${colors.text.primary};
	line-height: 1.5;
	word-break: break-word;
`;

const TimerControl = styled.div`
	display: flex;
	align-items: center;
	gap: ${spacing.sm};
	padding: ${spacing.sm};
	background: ${colors.neutral[50]};
	border-radius: 6px;
	flex-wrap: wrap;
	justify-content: center;

	@media (max-width: 480px) {
		gap: ${spacing.xs};
		padding: ${spacing.xs};
	}
`;

const TimerDisplay = styled.span`
	font-size: ${typography.fontSize.lg};
	font-weight: ${typography.fontWeight.bold};
	font-variant-numeric: tabular-nums;
	min-width: 45px;
	text-align: center;
	color: ${colors.text.primary};
`;

const TimerButton = styled.button`
	width: 28px;
	height: 28px;
	border: none;
	border-radius: 50%;
	background: ${colors.primary[100]};
	color: ${colors.primary[700]};
	font-size: ${typography.fontSize.md};
	font-weight: ${typography.fontWeight.bold};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${colors.primary[200]};
	}

	&:active {
		transform: scale(0.95);
	}

	@media (max-width: 768px) {
		width: 36px;
		height: 36px;
		font-size: ${typography.fontSize.lg};
	}
`;

const QuestionListPanel = styled(Card)<{ $expanded: boolean }>`
	max-height: ${({ $expanded }) => ($expanded ? '200px' : '0')};
	overflow-y: auto;
	transition: max-height 0.3s ease;
	flex-shrink: 0;
	${({ $expanded }) => !$expanded && 'padding: 0; border: none;'}
`;

const QuestionListHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${spacing.sm} ${spacing.md};
	background: ${colors.neutral[50]};
	border-radius: 6px;
	cursor: pointer;
	user-select: none;
	flex-shrink: 0;

	&:hover {
		background: ${colors.neutral[100]};
	}
`;

// Player list styles
const PlayersTitle = styled.h3`
	margin: 0 0 ${spacing.sm} 0;
	font-size: ${typography.fontSize.md};
	font-weight: ${typography.fontWeight.semibold};
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const PlayerCount = styled.span`
	font-size: ${typography.fontSize.sm};
	font-weight: ${typography.fontWeight.normal};
	color: ${colors.text.secondary};
`;

const PlayerList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.xs};
`;

// Compact player card for leaderboard
const PlayerCard = styled.div<{ $connected: boolean; $answered?: boolean }>`
	display: flex;
	align-items: center;
	gap: ${spacing.sm};
	padding: ${spacing.sm} ${spacing.md};
	background: ${({ $connected, $answered }) => ($answered ? colors.success[50] : $connected ? colors.surface : colors.neutral[100])};
	border-radius: 8px;
	border: 1px solid ${({ $answered }) => ($answered ? colors.success[300] : colors.border.light)};
	opacity: ${({ $connected }) => ($connected ? 1 : 0.5)};
	transition: all 0.2s ease;

	&:hover {
		border-color: ${({ $answered }) => ($answered ? colors.success[400] : colors.primary[300])};
	}
`;

// Player Answers Section - separate from leaderboard
const PlayerAnswersSection = styled.div`
	background: ${colors.surface};
	border: 1px solid ${colors.border.light};
	border-radius: 8px;
	padding: ${spacing.md};
	margin-bottom: ${spacing.md};
`;

const AnswersSectionTitle = styled.h4`
	margin: 0 0 ${spacing.sm} 0;
	font-size: ${typography.fontSize.sm};
	font-weight: ${typography.fontWeight.semibold};
	color: ${colors.primary[700]};
	display: flex;
	align-items: center;
	gap: ${spacing.xs};
`;

const AnswersList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.xs};
	max-height: 200px;
	overflow-y: auto;
`;

const AnswerItem = styled.div<{ $answered: boolean; $isHotspotHover?: boolean }>`
	display: flex;
	align-items: flex-start;
	gap: ${spacing.sm};
	padding: ${spacing.sm};
	background: ${({ $answered, $isHotspotHover }) => ($isHotspotHover ? colors.primary[100] : $answered ? colors.primary[50] : colors.neutral[50])};
	border: 1px solid ${({ $answered, $isHotspotHover }) => ($isHotspotHover ? colors.primary[400] : $answered ? colors.primary[200] : colors.border.light)};
	border-radius: 6px;
	font-size: ${typography.fontSize.sm};
	cursor: ${({ $isHotspotHover }) => ($isHotspotHover !== undefined ? 'pointer' : 'default')};
	transition: all 0.15s ease;
`;

const AnswerPlayerName = styled.span`
	font-weight: ${typography.fontWeight.semibold};
	color: ${colors.text.primary};
	min-width: 80px;
	flex-shrink: 0;
`;

const AnswerText = styled.span`
	flex: 1;
	color: ${colors.text.secondary};
	word-break: break-word;
	white-space: pre-wrap;
`;

const AnswerActions = styled.div`
	display: flex;
	gap: ${spacing.xs};
	flex-shrink: 0;
`;

const AnswerActionButton = styled.button<{ $type: 'correct' | 'wrong' }>`
	width: 24px;
	height: 24px;
	border: none;
	border-radius: 4px;
	background: ${({ $type }) => ($type === 'correct' ? colors.primary[100] : colors.error[100])};
	color: ${({ $type }) => ($type === 'correct' ? colors.primary[700] : colors.error[700])};
	font-size: ${typography.fontSize.sm};
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: ${({ $type }) => ($type === 'correct' ? colors.primary[200] : colors.error[200])};
	}
`;

const ConnectionDot = styled.div<{ $connected: boolean }>`
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: ${({ $connected }) => ($connected ? colors.primary[500] : colors.error[500])};
	flex-shrink: 0;
`;

const PlayerInfo = styled.div`
	flex: 1;
	min-width: 0;
`;

const PlayerName = styled.div`
	font-weight: ${typography.fontWeight.medium};
	color: ${colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const PlayerStatus = styled.div`
	font-size: ${typography.fontSize.xs};
	color: ${colors.text.secondary};
`;

const PlayerAnswer = styled.div<{ $hasAnswer: boolean }>`
	font-size: ${typography.fontSize.sm};
	color: ${({ $hasAnswer }) => ($hasAnswer ? colors.primary[700] : colors.text.disabled)};
	background: ${({ $hasAnswer }) => ($hasAnswer ? colors.primary[50] : 'transparent')};
	padding: ${({ $hasAnswer }) => ($hasAnswer ? `${spacing.xs} ${spacing.sm}` : '0')};
	border-radius: ${borderRadius.sm};
	margin-top: ${spacing.xs};
	font-weight: ${({ $hasAnswer }) => ($hasAnswer ? typography.fontWeight.medium : typography.fontWeight.normal)};
	max-width: 150px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const PlayerScore = styled.div`
	font-size: ${typography.fontSize.lg};
	font-weight: ${typography.fontWeight.bold};
	color: ${colors.primary[600]};
	min-width: 50px;
	text-align: right;
`;

const ScoreControls = styled.div`
	display: flex;
	gap: ${spacing.xs};
`;

const ScoreButton = styled.button<{ $type: 'add' | 'subtract' }>`
	width: 28px;
	height: 28px;
	border: none;
	border-radius: 6px;
	background: ${({ $type }) => ($type === 'add' ? colors.primary[100] : colors.error[100])};
	color: ${({ $type }) => ($type === 'add' ? colors.primary[700] : colors.error[700])};
	font-size: ${typography.fontSize.lg};
	font-weight: ${typography.fontWeight.bold};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ $type }) => ($type === 'add' ? colors.primary[200] : colors.error[200])};
	}

	&:active {
		transform: scale(0.9);
	}

	@media (max-width: 768px) {
		width: 36px;
		height: 36px;
		font-size: ${typography.fontSize.xl};
	}
`;

const EmptyPlayers = styled.div`
	text-align: center;
	padding: ${spacing.xl};
	color: ${colors.text.secondary};
`;

// Sorting answer display components
const SortingAnswerList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.xs};
	width: 100%;
`;

const SortingAnswerItem = styled.div<{ $isCorrect: boolean }>`
	display: flex;
	align-items: center;
	gap: ${spacing.xs};
	padding: ${spacing.xs} ${spacing.sm};
	background: ${({ $isCorrect }) => ($isCorrect ? colors.primary[100] : colors.neutral[50])};
	border: 1px solid ${({ $isCorrect }) => ($isCorrect ? colors.primary[300] : colors.border.light)};
	border-radius: ${borderRadius.sm};
	font-size: ${typography.fontSize.xs};
	color: ${colors.text.primary};
`;

const SortingPositionBadge = styled.div<{ $isCorrect: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	background: ${({ $isCorrect }) => ($isCorrect ? colors.primary[500] : colors.neutral[400])};
	color: white;
	border-radius: 50%;
	font-weight: ${typography.fontWeight.bold};
	font-size: ${typography.fontSize.xs};
	flex-shrink: 0;
`;

const SortingItemText = styled.span`
	flex: 1;
	word-break: break-word;
`;

const BuzzerWinnerBadge = styled.div`
	padding: ${spacing.md};
	background: ${colors.primary[100]};
	border: 2px solid ${colors.primary[400]};
	border-radius: 8px;
	text-align: center;
	color: ${colors.primary[800]};
	font-weight: ${typography.fontWeight.bold};
`;

export const ModeratorSessionPage: React.FC = () => {
	const { sessionId } = useParams<{ sessionId: string }>();
	const navigate = useNavigate();
	const moderatorToken = localStorage.getItem(`moderator_token_${sessionId}`);

	const [session, setSession] = useState<Session | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const [showUploadModal, setShowUploadModal] = useState(false);
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState('');

	const [questions, setQuestions] = useState<any[]>([]);
	const [timerValue, setTimerValue] = useState(30);
	const [hoveredPlayerId, setHoveredPlayerId] = useState<number | null>(null);

	const {
		joinSession: wsJoinSession,
		startQuestion,
		endQuestion,
		revealQuestion,
		toggleImageVisibility,
		updateScore,
		setTimer,
		toggleInputLock,
		awardPointsCorrect,
		awardPointsWrong,
		isConnected,
	} = useWebSocket({
		onConnected: () => {
			if (sessionId) {
				wsJoinSession(sessionId, undefined, 'moderator', true);
			}
		},
		onGameStateUpdated: (data) => {
			setGameState(data.game_state);
		},
		onBuzzerPressed: (data) => {
			console.log('Buzzer pressed by:', data.player_name);
		},
		onAnswerSubmitted: (data) => {
			console.log('Answer submitted by player:', data.player_id);
		},
	});

	// Load initial session data
	useEffect(() => {
		const loadSession = async () => {
			if (!sessionId) {
				navigate('/');
				return;
			}

			if (!moderatorToken) {
				navigate('/');
				return;
			}

			try {
				const data = await api.sessions.get(sessionId);
				setSession(data);

				// Load questions from question_catalog if available
				if (data.question_catalog) {
					// The question_catalog is the full quiz object from ZIP storage
					// It may have questions at different paths depending on how it was stored
					let catalogQuestions: any[] = [];

					if (Array.isArray(data.question_catalog.questions)) {
						catalogQuestions = data.question_catalog.questions;
					} else if (data.question_catalog.questions?.questions) {
						catalogQuestions = data.question_catalog.questions.questions;
					}

					setQuestions(catalogQuestions);
				}
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Failed to load session';
				setError(message);
			} finally {
				setLoading(false);
			}
		};

		loadSession();
	}, [sessionId, moderatorToken, navigate]);

	// Derive player list from game state
	const players = useMemo(() => {
		if (!gameState?.players) return [];
		return Object.entries(gameState.players).map(([id, data]) => ({
			id: parseInt(id),
			name: data.name,
			score: data.score,
			connected: data.connected,
			answered: data.answered,
			locked_in: data.locked_in ?? false,
			current_answer: data.current_answer ?? '',
		}));
	}, [gameState]);

	const connectedCount = useMemo(() => players.filter((p) => p.connected).length, [players]);

	const currentQuestion = gameState?.current_question;
	const currentQuestionIndex = gameState?.current_question_index ?? -1;

	// Get the original question from catalog for correct answer display
	// (gameState.current_question may have shuffled sortingItems)
	const originalQuestion = useMemo(() => {
		if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
			return questions[currentQuestionIndex];
		}
		return currentQuestion;
	}, [currentQuestionIndex, questions, currentQuestion]);

	// Get next question info for preview
	const nextQuestion = useMemo(() => {
		const nextIndex = currentQuestionIndex + 1;
		if (nextIndex >= 0 && nextIndex < questions.length) {
			return questions[nextIndex];
		}
		return null;
	}, [currentQuestionIndex, questions]);

	// Shuffle array using Fisher-Yates algorithm
	const shuffleArray = <T,>(array: T[]): T[] => {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	};

	const handleStartQuestion = (index: number) => {
		if (!sessionId || index < 0 || index >= questions.length) return;
		const question = questions[index];

		// Prepare question for players - map properties and handle special types
		const preparedQuestion: Record<string, unknown> = { ...question };

		// Map slider properties for player consumption
		if (question.type === 'slider') {
			preparedQuestion.min = question.sliderMin ?? 0;
			preparedQuestion.max = question.sliderMax ?? 100;
			preparedQuestion.step = question.sliderStep ?? 1;
			preparedQuestion.unit = question.sliderUnit ?? '';
		}

		// Shuffle sorting items for players
		if (question.type === 'sorting' && question.sortingItems) {
			// Shuffle the items and send shuffled version to players
			preparedQuestion.sortingItems = shuffleArray(question.sortingItems);
		}

		// Handle large base64 images - size already handled by backend max_http_buffer_size
		// No console logging to prevent performance issues with large base64 strings

		startQuestion(sessionId, question.id || `q${index}`, preparedQuestion, index, timerValue);
	};

	const handleNextQuestion = () => {
		if (currentQuestionIndex < questions.length - 1) {
			handleStartQuestion(currentQuestionIndex + 1);
		}
	};

	const handlePrevQuestion = () => {
		if (currentQuestionIndex > 0) {
			handleStartQuestion(currentQuestionIndex - 1);
		}
	};

	const handleRevealQuestion = () => {
		if (!sessionId) return;
		revealQuestion(sessionId, !gameState?.question_visible);
	};

	const handleToggleImage = () => {
		if (!sessionId) return;
		toggleImageVisibility(sessionId, !gameState?.image_visible);
	};

	const handleToggleBuzzerLock = () => {
		if (!sessionId) return;
		toggleInputLock(sessionId, !gameState?.input_locked);
	};

	const handleBuzzerCorrect = (playerId: number) => {
		if (!sessionId) return;
		const points = currentQuestion?.points || 10;
		awardPointsCorrect(sessionId, playerId, points);
	};

	const handleBuzzerCorrectAndNext = (playerId: number) => {
		if (!sessionId) return;
		const points = currentQuestion?.points || 10;
		awardPointsCorrect(sessionId, playerId, points);
		// Move to next question after a short delay
		setTimeout(() => {
			if (currentQuestionIndex < questions.length - 1) {
				handleStartQuestion(currentQuestionIndex + 1);
			}
		}, 300);
	};

	const handleBuzzerWrong = (playerId: number) => {
		if (!sessionId) return;
		awardPointsWrong(sessionId, playerId, 1);
	};

	const handleScoreChange = (playerId: number, delta: number) => {
		if (!sessionId) return;
		updateScore(sessionId, playerId, delta);
	};

	const handleTimerChange = (delta: number) => {
		const newValue = Math.max(5, Math.min(300, timerValue + delta));
		setTimerValue(newValue);
	};

	const handleSetTimer = () => {
		if (!sessionId) return;
		setTimer(sessionId, timerValue);
	};

	const handleUpload = async () => {
		if (!uploadFile || !sessionId || !moderatorToken) return;

		setUploading(true);
		setUploadError('');

		try {
			const result = await api.sessions.uploadQuestions(sessionId, moderatorToken, uploadFile);
			alert(`✅ Uploaded! ${result.questions_count} questions`);
			setShowUploadModal(false);
			setUploadFile(null);
			// Reload session to get new questions
			const data = await api.sessions.get(sessionId);
			setSession(data);
			if (data.question_catalog?.questions) {
				const catalogQuestions = data.question_catalog.questions.questions || data.question_catalog.questions;
				setQuestions(Array.isArray(catalogQuestions) ? catalogQuestions : []);
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Upload failed';
			setUploadError(message);
		} finally {
			setUploading(false);
		}
	};

	if (loading) {
		return (
			<PageContainer>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
					<Trans id="common.loading">Laden...</Trans>
				</div>
			</PageContainer>
		);
	}

	if (error || !session) {
		return (
			<PageContainer>
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: spacing.md }}>
					<h2>
						<Trans id="common.error">Fehler</Trans>
					</h2>
					<p>{error || <Trans id="moderator.error.sessionNotFound">Session nicht gefunden</Trans>}</p>
					<Button onClick={() => navigate('/')}>
						<Trans id="common.back">Zurück</Trans>
					</Button>
				</div>
			</PageContainer>
		);
	}

	return (
		<>
			<PageContainer>
				<MainPanel>
					{/* Session Header */}
					<SessionHeader>
						<SessionCode>
							<CodeLabel>Session</CodeLabel>
							<CodeValue>{session.id}</CodeValue>
						</SessionCode>
						<SessionStats>
							<StatItem>
								<StatValue>{connectedCount}</StatValue>
								<StatLabel>
									<Trans id="common.players">Spieler</Trans>
								</StatLabel>
							</StatItem>
							<StatItem>
								<StatValue>{questions.length}</StatValue>
								<StatLabel>
									<Trans id="common.questions">Fragen</Trans>
								</StatLabel>
							</StatItem>
						</SessionStats>
						<div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
							<ConnectionStatus connected={isConnected} />
							<Button variant="outline" size="sm" onClick={() => navigate('/')} style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>
								Exit
							</Button>
						</div>
					</SessionHeader>

					{/* Compact Control Bar - Navigation + Timer in one line */}
					<ControlBar>
						{/* Navigation */}
						<ButtonRow style={{ flex: 1, justifyContent: 'flex-start' }}>
							<Button size="sm" variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex <= 0}>
								←
							</Button>
							<QuestionIndicator>{currentQuestionIndex >= 0 ? `${currentQuestionIndex + 1}/${questions.length}` : '—'}</QuestionIndicator>
							<Button size="sm" variant="outline" onClick={handleNextQuestion} disabled={currentQuestionIndex >= questions.length - 1}>
								→
							</Button>
						</ButtonRow>

						{/* Timer inline */}
						<TimerControl style={{ background: 'transparent', padding: 0 }}>
							<TimerButton onClick={() => handleTimerChange(-5)}>-</TimerButton>
							<TimerDisplay>{timerValue}s</TimerDisplay>
							<TimerButton onClick={() => handleTimerChange(5)}>+</TimerButton>
							<Button size="sm" variant="primary" onClick={handleSetTimer}>
								⏱️
							</Button>
						</TimerControl>
					</ControlBar>

					{/* Current Question Display - Three-part layout */}
					{!currentQuestion ? (
						<QuestionDisplay $hasQuestion={false} variant="elevated" padding="md">
							<h3 style={{ margin: 0, color: colors.text.secondary, fontSize: typography.fontSize.md }}>{questions.length === 0 ? <Trans id="moderator.noQuizLoaded">Kein Quiz geladen</Trans> : <Trans id="moderator.useNavigation">Verwende Navigation oben</Trans>}</h3>
							{nextQuestion && (
								<NextQuestionPreview>
									<Trans>Nächste Frage:</Trans> <NextQuestionType>{nextQuestion.type || 'text'}</NextQuestionType>
									{nextQuestion.section && <span> • {nextQuestion.section}</span>}
									<div style={{ marginTop: spacing.xs, fontSize: typography.fontSize.sm, opacity: 0.8 }}>{nextQuestion.question ?? nextQuestion.text}</div>
								</NextQuestionPreview>
							)}
						</QuestionDisplay>
					) : (
						<QuestionContentArea>
							{/* Top Section: Question with controls */}
							<QuestionTopSection $hasQuestion={true}>
								<QuestionHeader>
									<QuestionMeta>
										<MetaTag>
											{currentQuestionIndex + 1}/{questions.length}
										</MetaTag>
										<MetaTag>{currentQuestion.type}</MetaTag>
										<MetaTag>{currentQuestion.points ?? 10}P</MetaTag>
										{currentQuestion.section && <MetaTag>{currentQuestion.section}</MetaTag>}
									</QuestionMeta>
									<ButtonRow>
										<Button size="sm" variant={gameState?.question_visible ? 'primary' : 'outline'} onClick={handleRevealQuestion}>
											{gameState?.question_visible ? '👁️' : '👁️‍🗨️'}
										</Button>
									</ButtonRow>
								</QuestionHeader>
								<QuestionText>{currentQuestion.question ?? currentQuestion.text}</QuestionText>
							</QuestionTopSection>

							{/* Bottom Section: Image left, Answers right */}
							<QuestionBottomSection>
								{/* Left Column: Image (always shown if present) */}
								{(currentQuestion.image || currentQuestion.imageData || currentQuestion.imageUrl) && (
									<ImageColumn>
										<ImageColumnHeader>
											<ImageColumnTitle>🖼️ Bild</ImageColumnTitle>
											<Button size="sm" variant={gameState?.image_visible ? 'primary' : 'outline'} onClick={handleToggleImage}>
												{gameState?.image_visible ? <Trans id="moderator.controls.imageVisible">Sichtbar</Trans> : <Trans id="moderator.controls.imageHidden">Verborgen</Trans>}
											</Button>
										</ImageColumnHeader>
										<ImageWrapper>
											<QuestionImageContainer>
												{/* For Hotspot questions: show image with player pins */}
												{currentQuestion.type?.toLowerCase().replace(/-/g, '_') === 'hotspot' ? (
													<HotspotImageWrapper>
														<HotspotImage src={currentQuestion.image || currentQuestion.imageData || currentQuestion.imageUrl} alt="Hotspot-Bild" loading="lazy" />

														{/* Correct answer pin (green) */}
														{(() => {
															const q = originalQuestion || currentQuestion;
															const x = q?.correctX ?? q?.hotspotX;
															const y = q?.correctY ?? q?.hotspotY;
															if (x !== undefined && y !== undefined) {
																return (
																	<PlayerPin $x={x} $y={y} $color={colors.success[500]} $isCorrect>
																		<PinLabel $color={colors.success[600]} $isCorrect>
																			✓ Korrekt
																		</PinLabel>
																	</PlayerPin>
																);
															}
															return null;
														})()}

														{/* Player answer pins */}
														{players
															.filter((p) => p.current_answer)
															.map((player, index) => {
																// Parse player answer: "X,Y" format
																const coords = player.current_answer?.split(',');
																if (!coords || coords.length !== 2) return null;
																const x = parseFloat(coords[0]);
																const y = parseFloat(coords[1]);
																if (isNaN(x) || isNaN(y)) return null;
																const pinColor = playerPinColors[index % playerPinColors.length];
																const isHighlighted = hoveredPlayerId === player.id;
																const isDimmed = hoveredPlayerId !== null && hoveredPlayerId !== player.id;
																return (
																	<PlayerPin key={player.id} $x={x} $y={y} $color={pinColor} $highlighted={isHighlighted} $dimmed={isDimmed}>
																		<PinLabel $color={pinColor} $highlighted={isHighlighted}>
																			{player.name}
																		</PinLabel>
																	</PlayerPin>
																);
															})}
													</HotspotImageWrapper>
												) : (
													<QuestionImage src={currentQuestion.image || currentQuestion.imageData || currentQuestion.imageUrl} alt="Frage" loading="lazy" />
												)}
											</QuestionImageContainer>
										</ImageWrapper>
									</ImageColumn>
								)}

								{/* Right Column: Correct Answer + Player Answers */}
								<AnswersColumn $fullWidth={!(currentQuestion.image || currentQuestion.imageData || currentQuestion.imageUrl)}>
									<AnswersColumnHeader>
										<AnswersColumnTitle>
											📝 <Trans id="moderator.answers">Antworten</Trans>
											<span style={{ fontWeight: 'normal', marginLeft: spacing.sm, fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
												{players.filter((p) => p.answered).length}/{players.length}
											</span>
										</AnswersColumnTitle>
										<Button size="sm" variant={gameState?.input_locked ? 'danger' : 'primary'} onClick={handleToggleBuzzerLock}>
											{gameState?.input_locked ? '🔒' : '🔓'}
										</Button>
									</AnswersColumnHeader>

									<AnswersScrollArea>
										{/* Buzzer Winner - shown at top of answers */}
										{gameState?.buzzer_winner && (
											<BuzzerWinnerBadge>
												<div>
													🔔 <strong>{gameState.buzzer_winner.player_name}</strong> hat gebuzzert!
												</div>
												<ButtonRow style={{ marginTop: spacing.sm, justifyContent: 'center', flexWrap: 'wrap' }}>
													<Button size="sm" variant="primary" onClick={() => handleBuzzerCorrect(gameState.buzzer_winner!.player_id)}>
														✓ Richtig (+{currentQuestion?.points || 10}P)
													</Button>
													<Button size="sm" variant="primary" onClick={() => handleBuzzerCorrectAndNext(gameState.buzzer_winner!.player_id)}>
														✓ Weiter
													</Button>
													<Button size="sm" variant="danger" onClick={() => handleBuzzerWrong(gameState.buzzer_winner!.player_id)}>
														✗ Falsch
													</Button>
												</ButtonRow>
											</BuzzerWinnerBadge>
										)}

										{/* Correct Answer Section */}
										<CorrectAnswerSection>
											<CorrectAnswerLabel>
												💡 <Trans id="moderator.correctAnswer">Korrekte Antwort:</Trans>
											</CorrectAnswerLabel>
											<CorrectAnswerText>
												{(() => {
													// Use originalQuestion for correct answers (sortingItems may be shuffled in currentQuestion)
													const q = originalQuestion || currentQuestion;
													const qType = q?.type?.toLowerCase().replace(/-/g, '_');
													if (qType === 'multiple_choice') {
														const correctAnswer = q?.answers?.find((a: any) => a.isCorrect);
														return correctAnswer?.text || '—';
													}
													if (qType === 'true_false') {
														return q?.correctAnswer === 1 ? 'Wahr (True)' : 'Falsch (False)';
													}
													if (qType === 'slider') {
														const value = q?.sliderCorrectValue ?? q?.correctValue ?? q?.answer;
														const unit = q?.sliderUnit || q?.unit || '';
														const min = q?.sliderMin ?? q?.min ?? 0;
														const max = q?.sliderMax ?? q?.max ?? 100;
														return value !== undefined ? `${value}${unit ? ` ${unit}` : ''} (${min} - ${max})` : '—';
													}
													if (qType === 'hotspot') {
														const x = q?.correctX ?? q?.hotspotX;
														const y = q?.correctY ?? q?.hotspotY;
														return x !== undefined && y !== undefined ? `✓ Grüne Markierung im Bild (${x?.toFixed(0)}%, ${y?.toFixed(0)}%)` : '(Hotspot im Bild markiert)';
													}
													if (qType === 'sorting') {
														// Show correct order from original question (not shuffled)
														const items = q?.sortingItems || q?.answers?.map((a: any) => a.text) || [];
														return items.length > 0 ? items.join(' → ') : '(Reihenfolge definiert)';
													}
													return q?.correctAnswerText || q?.answer || '—';
												})()}
											</CorrectAnswerText>
										</CorrectAnswerSection>

										{/* Player Answers - sorted alphabetically */}
										{players
											.filter((p) => p.current_answer)
											.sort((a, b) => a.name.localeCompare(b.name))
											.map((player, index) => {
												const qType = currentQuestion?.type?.toLowerCase().replace(/-/g, '_');
												const isHotspot = qType === 'hotspot';
												const isSorting = qType === 'sorting';

												// For hotspot: show visual marker color reference instead of raw coordinates
												let displayAnswer = player.current_answer;
												if (isHotspot) {
													const coords = player.current_answer?.split(',');
													if (coords && coords.length === 2) {
														displayAnswer = `📍 Markierung im Bild (${parseFloat(coords[0]).toFixed(0)}%, ${parseFloat(coords[1]).toFixed(0)}%)`;
													}
												}

												// For sorting: render as vertical list with color coding
												let sortingAnswerDisplay = null;
												if (isSorting && player.current_answer) {
													// Get the correct order from original question (unshuffled)
													const correctOrder = (originalQuestion || currentQuestion)?.sortingItems || (originalQuestion || currentQuestion)?.answers?.map((a: any) => a.text) || [];

													// Get the shuffled items that were sent to the player
													const shuffledItems = currentQuestion?.sortingItems || currentQuestion?.answers?.map((a: any) => a.text) || [];

													// Parse player answer (indices referring to shuffledItems)
													const playerIndices = player.current_answer
														.split(',')
														.map(Number)
														.filter((n) => !isNaN(n));

													// Decode player's sorted order using shuffled items
													const playerItems = playerIndices.map((idx) => shuffledItems[idx] || `Item ${idx}`);

													// Check correctness for each position by comparing with correct order
													sortingAnswerDisplay = (
														<SortingAnswerList>
															{playerItems.map((item, pos) => {
																const isCorrect = correctOrder[pos] === item;
																return (
																	<SortingAnswerItem key={pos} $isCorrect={isCorrect}>
																		<SortingPositionBadge $isCorrect={isCorrect}>{pos + 1}</SortingPositionBadge>
																		<SortingItemText>{item}</SortingItemText>
																	</SortingAnswerItem>
																);
															})}
														</SortingAnswerList>
													);
												}

												return (
													<AnswerItem key={player.id} $answered={player.answered} $isHotspotHover={isHotspot ? hoveredPlayerId === player.id : undefined} onMouseEnter={isHotspot ? () => setHoveredPlayerId(player.id) : undefined} onMouseLeave={isHotspot ? () => setHoveredPlayerId(null) : undefined}>
														<AnswerPlayerName>
															{isHotspot && (
																<span
																	style={{
																		display: 'inline-block',
																		width: '12px',
																		height: '12px',
																		borderRadius: '50%',
																		background: playerPinColors[index % playerPinColors.length],
																		marginRight: spacing.xs,
																		verticalAlign: 'middle',
																	}}
																/>
															)}
															{player.name}
														</AnswerPlayerName>
														{isSorting ? sortingAnswerDisplay : <AnswerText>{displayAnswer}</AnswerText>}
														<AnswerActions>
															<AnswerActionButton $type="correct" onClick={() => handleScoreChange(player.id, currentQuestion?.points || 10)} title={`+${currentQuestion?.points || 10} Punkte`}>
																✓
															</AnswerActionButton>
														</AnswerActions>
													</AnswerItem>
												);
											})}

										{/* Show message when no player answers yet */}
										{!players.some((p) => p.current_answer) && (
											<div style={{ padding: spacing.md, textAlign: 'center', color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
												<Trans id="moderator.noAnswersYet">Noch keine Spieler-Antworten</Trans>
											</div>
										)}
									</AnswersScrollArea>
								</AnswersColumn>
							</QuestionBottomSection>

							{/* Next Question Preview */}
							{nextQuestion && (
								<NextQuestionPreview>
									<Trans id="moderator.nextQuestion">Nächste Frage:</Trans> <NextQuestionType>{nextQuestion.type || 'text'}</NextQuestionType>
									{nextQuestion.section && <span> • {nextQuestion.section}</span>}
									<div style={{ marginTop: spacing.xs, fontSize: typography.fontSize.sm, opacity: 0.8 }}>{nextQuestion.question ?? nextQuestion.text}</div>
								</NextQuestionPreview>
							)}
						</QuestionContentArea>
					)}
				</MainPanel>

				{/* Side Panel - Leaderboard only */}
				<SidePanel>
					{/* Player Leaderboard */}
					<PlayersTitle>
						👥 <Trans id="moderator.leaderboard">Rangliste</Trans>
						<PlayerCount>
							{connectedCount}/{players.length}
						</PlayerCount>
					</PlayersTitle>

					{players.length === 0 ? (
						<EmptyPlayers>
							<p>
								<Trans id="moderator.noPlayersYet">Keine Spieler bisher.</Trans>
							</p>
							<p>
								<Trans id="moderator.shareSessionCode">Teile den Session-Code!</Trans>
							</p>
						</EmptyPlayers>
					) : (
						<PlayerList>
							{players
								.sort((a, b) => b.score - a.score)
								.map((player, index) => (
									<PlayerCard key={player.id} $connected={player.connected} $answered={player.answered}>
										<span
											style={{
												fontWeight: typography.fontWeight.bold,
												color: index < 3 ? colors.primary[600] : colors.text.secondary,
												minWidth: '20px',
											}}
										>
											{index + 1}.
										</span>
										<ConnectionDot $connected={player.connected} />
										<PlayerInfo>
											<PlayerName>{player.name}</PlayerName>
										</PlayerInfo>
										<PlayerScore>{player.score}</PlayerScore>
										<ScoreControls>
											<ScoreButton $type="subtract" onClick={() => handleScoreChange(player.id, -1)} title="-1">
												−
											</ScoreButton>
											<ScoreButton $type="add" onClick={() => handleScoreChange(player.id, 1)} title="+1">
												+
											</ScoreButton>
										</ScoreControls>
									</PlayerCard>
								))}
						</PlayerList>
					)}
				</SidePanel>
			</PageContainer>

			{/* Upload Modal */}
			<Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Question Catalog" size="md">
				<FileUpload accept=".zip" maxSize={50} onFileSelect={setUploadFile} onUpload={handleUpload} loading={uploading} error={uploadError} />
			</Modal>
		</>
	);
};
