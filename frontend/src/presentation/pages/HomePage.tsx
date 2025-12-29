/**
 * Home page - Landing page for Battle.Net Quiz Platform
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Trans } from '@lingui/react/macro';
import { Button, Card, Input, Modal } from '../atoms';
import { Layout } from '../organisms/Layout';
import { useToast } from '../../components/Toast';
import { api, QuizMetadata } from '../../services/api';
import { colors, spacing, typography } from '../../theme';
import { FiEdit, FiPlay, FiUsers, FiCheck } from 'react-icons/fi';

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing['2xl']};
	padding: ${spacing['2xl']} 0;
`;

const Hero = styled.div`
	text-align: center;
	padding: ${spacing['3xl']} 0;
`;

const Title = styled.h1`
	font-size: ${typography.fontSize['5xl']};
	font-weight: ${typography.fontWeight.bold};
	color: ${colors.primary[700]};
	margin: 0 0 ${spacing.md} 0;
`;

const Subtitle = styled.p`
	font-size: ${typography.fontSize.xl};
	color: ${colors.text.secondary};
	margin: 0;
`;

const ActionsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: ${spacing.xl};
	margin-top: ${spacing['2xl']};
`;

const ActionCard = styled(Card)`
	text-align: center;
	cursor: pointer;
	transition: all 0.3s ease;
	display: flex;
	flex-direction: column;
	align-items: center;

	&:hover {
		transform: translateY(-8px);
		box-shadow: 0 12px 24px rgba(14, 165, 233, 0.15);
	}
`;

const ActionIcon = styled.div`
	margin-bottom: ${spacing.lg};
`;

const ActionTitle = styled.h3`
	font-size: ${typography.fontSize['2xl']};
	font-weight: ${typography.fontWeight.semibold};
	color: ${colors.text.primary};
	margin: 0 0 ${spacing.md} 0;
`;

const ActionDescription = styled.p`
	color: ${colors.text.secondary};
	margin: 0 0 ${spacing.lg} 0;
	flex-grow: 1;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.md};
`;

const QuizList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.sm};
	max-height: 300px;
	overflow-y: auto;
	margin: ${spacing.md} 0;
`;

const QuizItem = styled.div<{ $selected: boolean }>`
	display: flex;
	align-items: center;
	gap: ${spacing.md};
	padding: ${spacing.md};
	background: ${({ $selected }) => ($selected ? colors.primary[50] : colors.surface)};
	border: 2px solid ${({ $selected }) => ($selected ? colors.primary[500] : colors.border.light)};
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: ${colors.primary[300]};
		background: ${({ $selected }) => ($selected ? colors.primary[100] : colors.neutral[50])};
	}
`;

const QuizItemContent = styled.div`
	flex: 1;
`;

const QuizItemTitle = styled.div`
	font-weight: ${typography.fontWeight.semibold};
	color: ${colors.text.primary};
`;

const QuizItemMeta = styled.div`
	font-size: ${typography.fontSize.sm};
	color: ${colors.text.secondary};
`;

const QuizCheckmark = styled.div<{ $visible: boolean }>`
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: ${({ $visible }) => ($visible ? colors.primary[500] : colors.neutral[200])};
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${colors.text.inverse};
	flex-shrink: 0;
`;

const EmptyQuizMessage = styled.div`
	text-align: center;
	padding: ${spacing.xl};
	color: ${colors.text.secondary};
`;

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
`;

const Logo = styled.div`
	font-size: ${typography.fontSize['2xl']};
	font-weight: ${typography.fontWeight.bold};
	color: ${colors.primary[600]};
`;

export const HomePage: React.FC = () => {
	const navigate = useNavigate();
	const toast = useToast();
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showJoinModal, setShowJoinModal] = useState(false);
	const [sessionCode, setSessionCode] = useState('');
	const [playerName, setPlayerName] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Quiz selection state
	const [quizzes, setQuizzes] = useState<QuizMetadata[]>([]);
	const [selectedQuiz, setSelectedQuiz] = useState<QuizMetadata | null>(null);
	const [loadingQuizzes, setLoadingQuizzes] = useState(false);

	const loadQuizzes = async () => {
		setLoadingQuizzes(true);
		try {
			const data = await api.quizzes.list();
			setQuizzes(data);
		} catch (err: unknown) {
			console.error('Failed to load quizzes:', err);
			toast.error('Fehler beim Laden der Quizze');
		} finally {
			setLoadingQuizzes(false);
		}
	};

	// Load quizzes when create modal opens
	useEffect(() => {
		if (showCreateModal) {
			loadQuizzes();
		}
	}, [showCreateModal]);

	const getQuestionCount = (quiz: QuizMetadata): number => {
		return quiz.question_count || 0;
	};

	const handleCreateSession = async () => {
		if (!selectedQuiz) {
			toast.warning('Bitte wähle ein Quiz aus');
			return;
		}

		setLoading(true);
		setError('');

		try {
			// Create session
			const session = await api.sessions.create();
			localStorage.setItem(`moderator_token_${session.id}`, session.moderator_token);

			// Attach selected quiz to session
			await api.sessions.attachQuiz(session.id, session.moderator_token, selectedQuiz.id);

			setShowCreateModal(false);
			setSelectedQuiz(null);
			toast.success('Session mit Quiz erstellt!');
			navigate(`/moderator/${session.id}`);
		} catch (err: any) {
			const errorMsg = err.message || 'Fehler beim Erstellen der Session';
			setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	const handleJoinSession = async () => {
		if (!sessionCode.trim() || !playerName.trim()) {
			const msg = 'Bitte Session-Code und Name eingeben';
			setError(msg);
			toast.warning(msg);
			return;
		}

		setLoading(true);
		setError('');

		try {
			const player = await api.players.create(sessionCode, playerName);
			localStorage.setItem(`player_id_${sessionCode}`, player.id.toString());
			localStorage.setItem(`player_name_${sessionCode}`, playerName);
			setShowJoinModal(false);
			toast.success('Erfolgreich beigetreten!');
			navigate(`/player/${sessionCode}`);
		} catch (err: any) {
			// Check if player already exists (409 Conflict)
			if (err.status === 409) {
				// Ask user if they want to reconnect
				const confirmReconnect = window.confirm(`Ein Spieler mit dem Namen "${playerName}" ist bereits in dieser Session. Möchtest du dich als dieser Spieler wieder verbinden?`);

				if (confirmReconnect) {
					try {
						const player = await api.players.reconnect(sessionCode, playerName);
						localStorage.setItem(`player_id_${sessionCode}`, player.id.toString());
						localStorage.setItem(`player_name_${sessionCode}`, playerName);
						setShowJoinModal(false);
						toast.success('Erfolgreich wiederverbunden!');
						navigate(`/player/${sessionCode}`);
					} catch (reconnectErr: any) {
						const reconnectMsg = reconnectErr.message || 'Fehler beim Wiederverbinden';
						setError(reconnectMsg);
						toast.error(reconnectMsg);
					}
				}
			} else {
				const errorMsg = err.message || 'Fehler beim Beitreten';
				setError(errorMsg);
				toast.error(errorMsg);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Layout
			header={
				<HeaderContent>
					<Logo>Battle.Net Quiz</Logo>
					<Button variant="outline" size="sm" onClick={() => navigate('/editor')}>
						<Trans id="quizEditor.title">Quiz-Editor</Trans>
					</Button>
				</HeaderContent>
			}
			footer="© 2025 Battle.Net Quiz Platform"
		>
			<Container>
				<Hero>
					<Title>
						<Trans id="home.title">Battle.Net Quiz Platform</Trans>
					</Title>
					<Subtitle>
						<Trans id="home.subtitle">Interaktive Quiz-Plattform für Echtzeit-Multiplayer-Lernerfahrungen</Trans>
					</Subtitle>
				</Hero>

				<ActionsGrid>
					<ActionCard variant="elevated" padding="lg" hoverable clickable onClick={() => navigate('/editor')}>
						<ActionIcon>
							<FiEdit size={48} color={colors.primary[500]} />
						</ActionIcon>
						<ActionTitle>
							📝 <Trans id="home.createQuiz">Quiz erstellen</Trans>
						</ActionTitle>
						<ActionDescription>
							<Trans id="home.createQuizDesc">Erstelle deinen eigenen Fragenkatalog mit dem intuitiven Editor</Trans>
						</ActionDescription>
						<Button variant="primary" fullWidth>
							<Trans id="home.toEditor">Zum Editor</Trans>
						</Button>
					</ActionCard>

					<ActionCard variant="elevated" padding="lg" hoverable clickable onClick={() => setShowCreateModal(true)}>
						<ActionIcon>
							<FiPlay size={48} color={colors.primary[500]} />
						</ActionIcon>
						<ActionTitle>
							🎮 <Trans id="home.startSession">Session starten</Trans>
						</ActionTitle>
						<ActionDescription>
							<Trans id="home.startSessionDesc">Starte eine neue Quiz-Session und lade Spieler ein</Trans>
						</ActionDescription>
						<Button variant="primary" fullWidth>
							<Trans id="home.createSession">Session erstellen</Trans>
						</Button>
					</ActionCard>

					<ActionCard variant="elevated" padding="lg" hoverable clickable onClick={() => setShowJoinModal(true)}>
						<ActionIcon>
							<FiUsers size={48} color={colors.primary[500]} />
						</ActionIcon>
						<ActionTitle>
							🎯 <Trans id="home.joinSession">Session beitreten</Trans>
						</ActionTitle>
						<ActionDescription>
							<Trans id="home.joinSessionDesc">Gib einen Session-Code ein um mitzuspielen</Trans>
						</ActionDescription>
						<Button variant="secondary" fullWidth>
							<Trans id="home.join">Beitreten</Trans>
						</Button>
					</ActionCard>
				</ActionsGrid>
			</Container>

			<Modal
				isOpen={showCreateModal}
				onClose={() => {
					setShowCreateModal(false);
					setSelectedQuiz(null);
				}}
				title="Quiz-Session erstellen"
				size="md"
			>
				<FormGroup>
					<p style={{ color: colors.text.secondary, margin: 0 }}>Wähle ein Quiz für deine Session. Spieler können mit dem Session-Code beitreten.</p>

					{loadingQuizzes ? (
						<EmptyQuizMessage>Lade Quizze...</EmptyQuizMessage>
					) : quizzes.length === 0 ? (
						<EmptyQuizMessage>
							<p>Keine Quizze vorhanden.</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setShowCreateModal(false);
									navigate('/editor');
								}}
							>
								Quiz erstellen
							</Button>
						</EmptyQuizMessage>
					) : (
						<QuizList>
							{quizzes.map((quiz) => (
								<QuizItem key={quiz.id} $selected={selectedQuiz?.id === quiz.id} onClick={() => setSelectedQuiz(quiz)}>
									<QuizCheckmark $visible={selectedQuiz?.id === quiz.id}>{selectedQuiz?.id === quiz.id && <FiCheck size={14} />}</QuizCheckmark>
									<QuizItemContent>
										<QuizItemTitle>{quiz.title}</QuizItemTitle>
										<QuizItemMeta>
											{getQuestionCount(quiz)} Fragen • {new Date(quiz.created_at).toLocaleDateString('de-DE')}
										</QuizItemMeta>
									</QuizItemContent>
								</QuizItem>
							))}
						</QuizList>
					)}

					{error && <p style={{ color: colors.error[600], margin: 0 }}>{error}</p>}

					<Button variant="primary" fullWidth onClick={handleCreateSession} disabled={loading || !selectedQuiz || loadingQuizzes}>
						{loading ? 'Wird erstellt...' : selectedQuiz ? `Session mit "${selectedQuiz.title}" starten` : 'Quiz auswählen'}
					</Button>
				</FormGroup>
			</Modal>

			<Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Quiz-Session beitreten" size="sm">
				<FormGroup>
					<Input label="Session-Code" placeholder="Session-Code eingeben" value={sessionCode} onChange={(e) => setSessionCode(e.target.value.toUpperCase())} fullWidth />
					<Input label="Dein Name" placeholder="Name eingeben" value={playerName} onChange={(e) => setPlayerName(e.target.value)} fullWidth />
					{error && <p style={{ color: colors.error[600], marginTop: spacing.sm }}>{error}</p>}
					<Button variant="primary" fullWidth disabled={!sessionCode || !playerName || loading} onClick={handleJoinSession}>
						{loading ? 'Beitreten...' : 'Beitreten'}
					</Button>
				</FormGroup>
			</Modal>
		</Layout>
	);
};
