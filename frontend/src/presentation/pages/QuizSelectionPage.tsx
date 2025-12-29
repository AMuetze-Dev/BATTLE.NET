/**
 * Quiz Selection Page - Moderator selects a quiz to load into session
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSearch, FiTrash2, FiEdit, FiUpload } from 'react-icons/fi';
import { Trans } from '@lingui/react/macro';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Card } from '../atoms/Card';
import { Layout } from '../organisms/Layout';
import { colors, spacing } from '../../theme';
import { api, QuizMetadata } from '../../services/api';

export const QuizSelectionPage: React.FC = () => {
	const navigate = useNavigate();
	const { sessionId } = useParams<{ sessionId: string }>();
	const [quizzes, setQuizzes] = useState<QuizMetadata[]>([]);
	const [filteredQuizzes, setFilteredQuizzes] = useState<QuizMetadata[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [moderatorToken, setModeratorToken] = useState<string | null>(null);

	useEffect(() => {
		// Get moderator token from localStorage
		const token = localStorage.getItem(`moderator_token_${sessionId}`);
		setModeratorToken(token);

		if (!sessionId || !token) {
			alert('Keine gültige Session oder kein Moderator-Token gefunden');
			navigate('/');
			return;
		}

		loadQuizzes();
	}, [sessionId, navigate]);

	useEffect(() => {
		if (searchTerm.trim() === '') {
			setFilteredQuizzes(quizzes);
		} else {
			const filtered = quizzes.filter((quiz) => quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) || quiz.description?.toLowerCase().includes(searchTerm.toLowerCase()));
			setFilteredQuizzes(filtered);
		}
	}, [searchTerm, quizzes]);

	const loadQuizzes = async () => {
		setIsLoading(true);
		try {
			const loadedQuizzes = await api.quizzes.list();
			setQuizzes(loadedQuizzes);
			setFilteredQuizzes(loadedQuizzes);
		} catch (error: any) {
			console.error('Fehler beim Laden der Quizze:', error);
			alert(`Fehler: ${error.message || 'Quizze konnten nicht geladen werden'}`);
		} finally {
			setIsLoading(false);
		}
	};

	const selectQuiz = async (quiz: QuizMetadata) => {
		if (!sessionId || !moderatorToken) {
			alert('Keine gültige Session gefunden');
			return;
		}

		try {
			await api.sessions.attachQuiz(sessionId, moderatorToken, quiz.id);
			alert(`Quiz "${quiz.title}" wurde der Session hinzugefügt!`);
			navigate(`/moderator/${sessionId}`);
		} catch (error: any) {
			console.error('Fehler beim Anhängen des Quiz:', error);
			alert(`Fehler: ${error.message || 'Quiz konnte nicht angehängt werden'}`);
		}
	};

	const deleteQuiz = async (quizId: string, quizTitle: string) => {
		if (!window.confirm(`Möchten Sie das Quiz "${quizTitle}" wirklich löschen?`)) {
			return;
		}

		try {
			await api.quizzes.delete(quizId);
			alert(`Quiz "${quizTitle}" wurde gelöscht`);
			loadQuizzes();
		} catch (error: any) {
			console.error('Fehler beim Löschen:', error);
			alert(`Fehler: ${error.message || 'Quiz konnte nicht gelöscht werden'}`);
		}
	};

	const getQuestionCount = (quiz: QuizMetadata): number => {
		return quiz.question_count || 0;
	};

	return (
		<Layout
			header={
				<HeaderContent>
					<div>
						<Title>
							<Trans id="quizSelection.title">Quiz auswählen</Trans>
						</Title>
						<Subtitle>
							<Trans id="quizSelection.session">Session:</Trans> {sessionId}
						</Subtitle>
					</div>
					<HeaderActions>
						<Button variant="outline" size="sm" onClick={() => navigate(`/moderator/${sessionId}`)}>
							<Trans id="quizSelection.backToSession">← Zurück zur Session</Trans>
						</Button>
					</HeaderActions>
				</HeaderContent>
			}
		>
			<Container>
				<SearchBar>
					<SearchInput placeholder="Quiz suchen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} leftIcon={<FiSearch />} />
				</SearchBar>

				{isLoading ? (
					<LoadingState>
						<Trans id="quizSelection.loading">Lade Quizze...</Trans>
					</LoadingState>
				) : filteredQuizzes.length === 0 ? (
					<EmptyState>
						<EmptyIcon>📚</EmptyIcon>
						<EmptyTitle>{searchTerm ? <Trans id="quizSelection.noQuizzesFound">Keine Quizze gefunden</Trans> : <Trans id="quizSelection.noQuizzesYet">Noch keine Quizze vorhanden</Trans>}</EmptyTitle>
						<EmptyText>{searchTerm ? <Trans id="quizSelection.tryDifferentSearch">Versuche einen anderen Suchbegriff</Trans> : <Trans id="quizSelection.createQuizzesHint">Erstelle Quizze im Quiz-Editor und wähle sie hier aus</Trans>}</EmptyText>
					</EmptyState>
				) : (
					<QuizGrid>
						{filteredQuizzes.map((quiz) => (
							<QuizCard key={quiz.id}>
								<QuizHeader>
									<QuizTitle>{quiz.title}</QuizTitle>
									<QuizActions>
										<IconButton onClick={() => navigate(`/quiz-editor?id=${quiz.id}`)} title="Bearbeiten">
											<FiEdit />
										</IconButton>
										<IconButton onClick={() => deleteQuiz(quiz.id, quiz.title)} title="Löschen" danger>
											<FiTrash2 />
										</IconButton>
									</QuizActions>
								</QuizHeader>

								{quiz.description && <QuizDescription>{quiz.description}</QuizDescription>}

								<QuizMeta>
									<MetaItem>
										<MetaLabel>
											<Trans id="quizSelection.questionsLabel">Fragen:</Trans>
										</MetaLabel>
										<MetaValue>{getQuestionCount(quiz)}</MetaValue>
									</MetaItem>
									<MetaItem>
										<MetaLabel>
											<Trans id="quizSelection.createdLabel">Erstellt:</Trans>
										</MetaLabel>
										<MetaValue>{new Date(quiz.created_at).toLocaleDateString('de-DE')}</MetaValue>
									</MetaItem>
								</QuizMeta>

								<SelectButton variant="primary" fullWidth leftIcon={<FiUpload />} onClick={() => selectQuiz(quiz)}>
									<Trans id="quizSelection.useQuiz">Quiz verwenden</Trans>
								</SelectButton>
							</QuizCard>
						))}
					</QuizGrid>
				)}
			</Container>
		</Layout>
	);
};

// Styled Components
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: ${spacing.xl};
`;

const HeaderContent = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
`;

const Title = styled.h1`
	font-size: 2rem;
	font-weight: 700;
	color: ${colors.text.primary};
	margin: 0;
`;

const Subtitle = styled.p`
	font-size: 0.875rem;
	color: ${colors.text.secondary};
	margin: ${spacing.xs} 0 0 0;
`;

const HeaderActions = styled.div`
	display: flex;
	gap: ${spacing.md};
`;

const SearchBar = styled.div`
	margin-bottom: ${spacing.xl};
`;

const SearchInput = styled(Input)``;

const QuizGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: ${spacing.lg};
`;

const QuizCard = styled(Card)`
	padding: ${spacing.lg};
	display: flex;
	flex-direction: column;
	gap: ${spacing.md};
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
`;

const QuizHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: ${spacing.md};
`;

const QuizTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${colors.text.primary};
	margin: 0;
	flex: 1;
`;

const QuizActions = styled.div`
	display: flex;
	gap: ${spacing.xs};
`;

const IconButton = styled.button<{ danger?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border: none;
	background: ${(props) => (props.danger ? colors.error[50] : colors.neutral[100])};
	color: ${(props) => (props.danger ? colors.error[600] : colors.text.secondary)};
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${(props) => (props.danger ? colors.error[100] : colors.neutral[200])};
		color: ${(props) => (props.danger ? colors.error[700] : colors.text.primary)};
	}

	svg {
		width: 16px;
		height: 16px;
	}
`;

const QuizDescription = styled.p`
	font-size: 0.875rem;
	color: ${colors.text.secondary};
	margin: 0;
	line-height: 1.5;
`;

const QuizMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.xs};
	padding-top: ${spacing.sm};
	border-top: 1px solid ${colors.neutral[200]};
`;

const MetaItem = styled.div`
	display: flex;
	justify-content: space-between;
	font-size: 0.875rem;
`;

const MetaLabel = styled.span`
	color: ${colors.text.secondary};
`;

const MetaValue = styled.span`
	color: ${colors.text.primary};
	font-weight: 500;
`;

const SelectButton = styled(Button)`
	margin-top: ${spacing.sm};
`;

const EmptyState = styled.div`
	text-align: center;
	padding: ${spacing.xl} ${spacing.lg};
	color: ${colors.text.secondary};
`;

const EmptyIcon = styled.div`
	font-size: 4rem;
	margin-bottom: ${spacing.md};
`;

const EmptyTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${colors.text.primary};
	margin-bottom: ${spacing.sm};
`;

const EmptyText = styled.p`
	font-size: 1rem;
	margin-bottom: ${spacing.lg};
`;

const LoadingState = styled.div`
	text-align: center;
	padding: ${spacing.xl};
	font-size: 1.125rem;
	color: ${colors.text.secondary};
`;
