/**
 * Player Session Page - Optimized fullscreen view for quiz participation
 * Uses AnswerInput molecule for DRY input handling
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Trans } from '@lingui/react/macro';
import { Button, ConnectionStatus } from '../atoms';
import { Leaderboard, AnswerInput } from '../molecules';
import { api, Player, LeaderboardEntry } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { GameState } from '../../services/websocket';
import { colors, spacing, typography, borderRadius } from '../../theme';

const fadeIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`;

// Fullscreen container
const FullscreenContainer = styled.div`
	position: fixed;
	inset: 0;
	display: grid;
	grid-template-columns: 1fr 280px;
	background: ${colors.background};
	animation: ${fadeIn} 0.3s ease-out;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr 240px;
	}

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		grid-template-rows: auto 1fr auto auto;
	}
`;

// Main area for question and input
const MainArea = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow: hidden;
`;

// Header bar
const HeaderBar = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: ${spacing.sm} ${spacing.lg};
	background: ${colors.surface};
	border-bottom: 1px solid ${colors.border.light};
	flex-shrink: 0;
	gap: ${spacing.sm};

	@media (max-width: 480px) {
		padding: ${spacing.xs} ${spacing.sm};
	}
`;

const SessionInfo = styled.div`
	display: flex;
	align-items: center;
	gap: ${spacing.md};
`;

const SessionCode = styled.span`
	font-size: ${typography.fontSize.lg};
	font-weight: ${typography.fontWeight.bold};
	color: ${colors.text.primary};
`;

const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	gap: ${spacing.md};
`;

// Question display area
const QuestionArea = styled.div<{ $hasQuestion: boolean }>`
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding: ${spacing.xl};
	text-align: center;
	background: ${({ $hasQuestion }) => ($hasQuestion ? `linear-gradient(180deg, ${colors.primary[50]} 0%, ${colors.surface} 100%)` : colors.surface)};
	min-height: 0;
	overflow: auto;

	@media (max-width: 768px) {
		padding: ${spacing.md};
		min-height: 200px;
	}

	@media (max-width: 480px) {
		padding: ${spacing.sm};
	}
`;

const QuestionPlaceholder = styled.div`
	color: ${colors.text.secondary};
	font-size: ${typography.fontSize.md};
	padding: ${spacing.md};
`;

const QuestionContent = styled.div`
	max-width: 800px;
	width: 100%;
`;

const TimerDisplay = styled.div<{ $urgent: boolean }>`
	font-size: ${typography.fontSize['4xl']};
	font-weight: ${typography.fontWeight.bold};
	color: ${({ $urgent }) => ($urgent ? colors.error[600] : colors.primary[600])};
	margin-bottom: ${spacing.lg};

	@media (max-width: 480px) {
		font-size: ${typography.fontSize['2xl']};
		margin-bottom: ${spacing.sm};
	}
`;

const QuestionImageContainer = styled.div`
	width: 100%;
	max-width: 600px;
	padding: ${spacing.md};
	background: ${colors.surface};
	border: 2px solid ${colors.border.light};
	border-radius: ${borderRadius.lg};
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	margin-bottom: ${spacing.md};

	@media (max-width: 768px) {
		max-width: 500px;
		padding: ${spacing.sm};
	}

	@media (max-width: 480px) {
		max-width: 100%;
		padding: ${spacing.xs};
	}
`;

const QuestionImage = styled.img`
	width: 100%;
	height: auto;
	max-height: 300px;
	object-fit: contain;
	border-radius: ${borderRadius.md};
	display: block;

	@media (max-width: 768px) {
		max-height: 250px;
	}

	@media (max-width: 480px) {
		max-height: 200px;
	}
`;

const QuestionText = styled.h1`
	font-size: ${typography.fontSize['3xl']};
	font-weight: ${typography.fontWeight.bold};
	color: ${colors.text.primary};
	margin: 0;
	line-height: 1.4;

	@media (max-width: 768px) {
		font-size: ${typography.fontSize['2xl']};
	}

	@media (max-width: 480px) {
		font-size: ${typography.fontSize.xl};
	}
`;

// Input/Buzzer area
const InputArea = styled.div`
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: ${spacing.xl};
	background: ${colors.surface};
	border-top: 2px solid ${colors.border.light};
	min-height: 180px;

	@media (max-width: 768px) {
		padding: ${spacing.md};
		min-height: 150px;
	}

	@media (max-width: 480px) {
		padding: ${spacing.sm};
		min-height: 120px;
	}
`;

// Sidebar
const Sidebar = styled.div`
	display: flex;
	flex-direction: column;
	background: ${colors.surface};
	border-left: 1px solid ${colors.border.light};
	height: 100%;
	overflow: hidden;

	@media (max-width: 768px) {
		border-left: none;
		border-top: 1px solid ${colors.border.light};
		height: auto;
		max-height: 40vh;
	}
`;

// Mobile score badge - shows in header on mobile
const MobileScore = styled.div`
	display: none;
	align-items: center;
	gap: ${spacing.xs};
	padding: ${spacing.xs} ${spacing.sm};
	background: ${colors.primary[50]};
	border-radius: ${borderRadius.md};
	font-weight: ${typography.fontWeight.bold};
	color: ${colors.primary[600]};

	@media (max-width: 768px) {
		display: flex;
	}
`;

const SidebarHeader = styled.div`
	padding: ${spacing.md};
	background: ${colors.primary[50]};
	border-bottom: 1px solid ${colors.border.light};
	text-align: center;
`;

const PlayerScore = styled.div`
	font-size: ${typography.fontSize['3xl']};
	font-weight: ${typography.fontWeight.bold};
	color: ${colors.primary[600]};

	@media (max-width: 768px) {
		font-size: ${typography.fontSize['2xl']};
	}
`;

const PlayerLabel = styled.div`
	font-size: ${typography.fontSize.sm};
	color: ${colors.text.secondary};
`;

const LeaderboardContainer = styled.div`
	flex: 1;
	overflow: auto;
	padding: ${spacing.sm};
`;

const LoadingContainer = styled.div`
	position: fixed;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${colors.background};
`;

const ErrorContainer = styled.div`
	position: fixed;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: ${spacing.md};
	background: ${colors.background};
`;

export const PlayerSessionPage: React.FC = () => {
	const { sessionId } = useParams<{ sessionId: string }>();
	const navigate = useNavigate();
	const playerId = localStorage.getItem(`player_id_${sessionId}`);

	const [player, setPlayer] = useState<Player | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [answer, setAnswer] = useState('');
	const [hasAnswered, setHasAnswered] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const {
		joinSession: wsJoinSession,
		updateAnswer: wsUpdateAnswer,
		submitAnswer,
		pressBuzzer,
		isConnected,
	} = useWebSocket({
		onConnected: () => {
			if (sessionId && playerId && player) {
				wsJoinSession(sessionId, parseInt(playerId), player.name, false);
			}
		},
		onGameStateUpdated: (data) => {
			setGameState(data.game_state);
			// Sync answered status from server
			const myPlayerData = data.game_state.players?.[playerId ?? ''];
			if (myPlayerData) {
				setHasAnswered(myPlayerData.answered ?? false);
			}
		},
		onBuzzerPressed: (data) => {
			console.log('Buzzer pressed:', data);
		},
	});

	// Load initial player data
	useEffect(() => {
		const loadPlayer = async () => {
			if (!sessionId || !playerId) {
				navigate('/');
				return;
			}

			try {
				const data = await api.players.get(sessionId, parseInt(playerId));
				setPlayer(data);
				localStorage.setItem(`player_name_${sessionId}`, data.name);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Failed to load player';
				setError(message);
			} finally {
				setLoading(false);
			}
		};

		loadPlayer();
	}, [sessionId, playerId, navigate]);

	// Reconnect when connection established
	useEffect(() => {
		if (isConnected && sessionId && playerId && player) {
			wsJoinSession(sessionId, parseInt(playerId), player.name, false);
		}
	}, [isConnected, sessionId, playerId, player, wsJoinSession]);

	// Reset answer when question changes
	useEffect(() => {
		const questionId = gameState?.current_question?.id;
		if (questionId) {
			setAnswer('');
			setHasAnswered(false);
		}
	}, [gameState?.current_question?.id]);

	// Current player score
	const currentScore = useMemo(() => {
		if (gameState && playerId && gameState.players[String(playerId)]) {
			return gameState.players[String(playerId)].score;
		}
		return player?.score ?? 0;
	}, [gameState, playerId, player]);

	// Leaderboard with current player highlighted
	const leaderboardEntries: LeaderboardEntry[] = useMemo(() => {
		if (!gameState?.leaderboard) return [];
		return gameState.leaderboard.map((entry, index) => ({
			player_id: entry.player_id,
			player_name: entry.name,
			score: entry.score,
			rank: index + 1,
		}));
	}, [gameState]);

	// Buzzer handler - only works for buzzer questions
	const handleBuzzerPress = useCallback(() => {
		if (!sessionId || !playerId || !player) return;
		if (gameState?.input_locked || gameState?.buzzer_winner) return;

		// Only allow buzzing on buzzer questions
		const questionType = gameState?.current_question?.type?.toLowerCase().replace(/-/g, '_');
		if (questionType !== 'buzzer') return;

		const questionId = gameState?.current_question?.id ?? 'buzzer';
		pressBuzzer(sessionId, questionId, parseInt(playerId), player.name);
	}, [sessionId, playerId, player, gameState, pressBuzzer]);

	// Keyboard handler for spacebar buzzer - only for buzzer questions
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Spacebar triggers buzzer (but not when typing in input)
			// Only for buzzer questions
			const questionType = gameState?.current_question?.type?.toLowerCase().replace(/-/g, '_');
			if (e.code === 'Space' && e.target === document.body && questionType === 'buzzer') {
				e.preventDefault();
				handleBuzzerPress();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [handleBuzzerPress, gameState]);

	const handleAnswerChange = (newAnswer: string) => {
		setAnswer(newAnswer);
		// Send live update to moderator
		if (sessionId && playerId) {
			wsUpdateAnswer(sessionId, parseInt(playerId), newAnswer);
		}
	};

	const handleSubmitAnswer = () => {
		if (!sessionId || !playerId || !gameState?.current_question) return;

		if (hasAnswered) {
			// Withdraw submission
			submitAnswer(sessionId, gameState.current_question.id ?? 'q1', parseInt(playerId), answer, 0, false);
			setHasAnswered(false);
		} else {
			// Submit answer
			submitAnswer(sessionId, gameState.current_question.id ?? 'q1', parseInt(playerId), answer, 0, true);
			setHasAnswered(true);
		}
	};

	const handleLeave = () => {
		if (window.confirm('Session verlassen?')) {
			localStorage.removeItem(`player_id_${sessionId}`);
			localStorage.removeItem(`player_name_${sessionId}`);
			navigate('/');
		}
	};

	if (loading) {
		return (
			<LoadingContainer>
				<Trans id="common.loading">Laden...</Trans>
			</LoadingContainer>
		);
	}

	if (error || !player) {
		return (
			<ErrorContainer>
				<h2>
					<Trans id="common.error">Fehler</Trans>
				</h2>
				<p>{error || <Trans id="player.error.notFound">Spieler nicht gefunden</Trans>}</p>
				<Button onClick={() => navigate('/')}>
					<Trans id="common.back">Zurück</Trans>
				</Button>
			</ErrorContainer>
		);
	}

	const currentQuestion = gameState?.current_question;
	const questionVisible = gameState?.question_visible ?? false;
	const isInputLocked = gameState?.input_locked ?? true;
	const buzzerWinner = gameState?.buzzer_winner;

	return (
		<FullscreenContainer>
			<MainArea>
				<HeaderBar>
					<SessionInfo>
						<SessionCode>#{sessionId}</SessionCode>
						<MobileScore>🏆 {currentScore}</MobileScore>
					</SessionInfo>
					<HeaderActions>
						<ConnectionStatus connected={isConnected} />
						<Button variant="outline" size="sm" onClick={handleLeave}>
							<Trans id="player.actions.leave">Verlassen</Trans>
						</Button>
					</HeaderActions>
				</HeaderBar>

				{/* Question display area */}
				<QuestionArea $hasQuestion={questionVisible && !!currentQuestion}>
					{/* Timer always visible when running */}
					{gameState?.timer_running && gameState?.timer !== undefined && gameState.timer > 0 && <TimerDisplay $urgent={gameState.timer <= 5}>{gameState.timer}s</TimerDisplay>}

					{!currentQuestion ? (
						<QuestionPlaceholder>{gameState?.status === 'finished' ? <Trans id="player.gameFinished">🏆 Spiel beendet!</Trans> : '⏳'}</QuestionPlaceholder>
					) : (
						<QuestionContent>
							{/* Image can be shown independently of question visibility */}
							{gameState?.image_visible && (currentQuestion.image || currentQuestion.imageData || currentQuestion.imageUrl) && (
								<QuestionImageContainer>
									<QuestionImage src={currentQuestion.image || currentQuestion.imageData || currentQuestion.imageUrl} alt="Question" loading="lazy" />
								</QuestionImageContainer>
							)}
							{/* Question text only shown when question is visible */}
							{questionVisible ? <QuestionText>{currentQuestion.question ?? currentQuestion.text ?? <Trans id="player.answerPrompt">Beantworte die Frage!</Trans>}</QuestionText> : <QuestionPlaceholder>⏳</QuestionPlaceholder>}
						</QuestionContent>
					)}
				</QuestionArea>

				<InputArea>
					{gameState?.status !== 'playing' ? (
						<QuestionPlaceholder>⏳</QuestionPlaceholder>
					) : (
						<AnswerInput question={currentQuestion} value={answer} onChange={handleAnswerChange} onSubmit={handleSubmitAnswer} onBuzzerPress={handleBuzzerPress} locked={isInputLocked} submitted={hasAnswered} buzzerWinner={buzzerWinner} currentPlayerId={parseInt(playerId ?? '-1')} />
					)}
				</InputArea>
			</MainArea>

			<Sidebar>
				<SidebarHeader>
					<PlayerLabel>
						<Trans id="player.yourScore">Deine Punkte</Trans>
					</PlayerLabel>
					<PlayerScore>{currentScore}</PlayerScore>
				</SidebarHeader>
				<LeaderboardContainer>
					<Leaderboard entries={leaderboardEntries} highlightPlayerId={player.id} />
				</LeaderboardContainer>
			</Sidebar>
		</FullscreenContainer>
	);
};
