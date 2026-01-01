/**
 * Home page - Landing page for Battle.Net Quiz Platform
 * Refactored to use CSS Modules following Atomic Design pattern
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trans } from '@lingui/react/macro';
import { Button, Input, Modal, Icon, ThemeSelector, ParticleBackground, ActionCard } from '../atoms';
import { Layout } from '../organisms/Layout';
import { useToast } from '../../components/Toast';
import { api, QuizMetadata } from '../../services/api';
import { FiEdit, FiPlay, FiUsers, FiCheck } from 'react-icons/fi';
import styles from './HomePage.module.css';

export const HomePage: React.FC = () => {
	const navigate = useNavigate();
	const { inviteCode } = useParams<{ inviteCode?: string }>();
	const toast = useToast();
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showJoinModal, setShowJoinModal] = useState(false);
	const [sessionCode, setSessionCode] = useState('');
	const [playerName, setPlayerName] = useState('');
	const [isInviteLink, setIsInviteLink] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Quiz selection state
	const [quizzes, setQuizzes] = useState<QuizMetadata[]>([]);
	const [selectedQuiz, setSelectedQuiz] = useState<QuizMetadata | null>(null);
	const [loadingQuizzes, setLoadingQuizzes] = useState(false);
	const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);

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

	// Handle invite link - open join modal with prefilled session code
	useEffect(() => {
		if (inviteCode) {
			setSessionCode(inviteCode.toUpperCase());
			setIsInviteLink(true);
			setShowJoinModal(true);
		}
	}, [inviteCode]);

	// Reset invite link state when modal closes
	const handleCloseJoinModal = () => {
		setShowJoinModal(false);
		if (isInviteLink) {
			navigate('/', { replace: true });
			setSessionCode('');
			setIsInviteLink(false);
		}
	};

	const getQuestionCount = (quiz: QuizMetadata): number => {
		return quiz.question_count || 0;
	};

	const handleDeleteQuiz = async (quiz: QuizMetadata, e: React.MouseEvent) => {
		e.stopPropagation();

		const confirmDelete = window.confirm(`Möchtest du das Quiz "${quiz.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`);

		if (!confirmDelete) return;

		setDeletingQuizId(quiz.id);
		try {
			await api.quizzes.delete(quiz.id);
			toast.success(`Quiz "${quiz.title}" wurde gelöscht`);
			await loadQuizzes();
			if (selectedQuiz?.id === quiz.id) {
				setSelectedQuiz(null);
			}
		} catch (err: unknown) {
			console.error('Failed to delete quiz:', err);
			toast.error('Fehler beim Löschen des Quizzes');
		} finally {
			setDeletingQuizId(null);
		}
	};

	const handleEditQuiz = (quiz: QuizMetadata, e: React.MouseEvent) => {
		e.stopPropagation();
		navigate(`/editor?quizId=${encodeURIComponent(quiz.id)}`);
	};

	const handleCreateSession = async () => {
		if (!selectedQuiz) {
			toast.warning('Bitte wähle ein Quiz aus');
			return;
		}

		setLoading(true);
		setError('');

		try {
			const session = await api.sessions.create();
			localStorage.setItem(`moderator_token_${session.id}`, session.moderator_token);
			await api.sessions.attachQuiz(session.id, session.moderator_token, selectedQuiz.id);

			setShowCreateModal(false);
			setSelectedQuiz(null);
			toast.success('Session mit Quiz erstellt!');
			navigate(`/moderator/${session.id}`);
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'Fehler beim Erstellen der Session';
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
		} catch (err: unknown) {
			const apiError = err as { status?: number; message?: string };
			if (apiError.status === 409) {
				const confirmReconnect = window.confirm(`Ein Spieler mit dem Namen "${playerName}" ist bereits in dieser Session. Möchtest du dich als dieser Spieler wieder verbinden?`);

				if (confirmReconnect) {
					try {
						const player = await api.players.reconnect(sessionCode, playerName);
						localStorage.setItem(`player_id_${sessionCode}`, player.id.toString());
						localStorage.setItem(`player_name_${sessionCode}`, playerName);
						setShowJoinModal(false);
						toast.success('Erfolgreich wiederverbunden!');
						navigate(`/player/${sessionCode}`);
					} catch (reconnectErr: unknown) {
						const reconnectMsg = reconnectErr instanceof Error ? reconnectErr.message : 'Fehler beim Wiederverbinden';
						setError(reconnectMsg);
						toast.error(reconnectMsg);
					}
				}
			} else {
				const errorMsg = apiError.message || 'Fehler beim Beitreten';
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
				<div className={styles.headerContent}>
					<div className={styles.logo}>
						<span className={styles.logoIcon}>B</span>
						Battle.Net Quiz
					</div>
					<div className={styles.headerActions}>
						<ThemeSelector />
						<Button variant="outline" size="sm" onClick={() => navigate('/editor')}>
							<Trans id="quizEditor.title">Quiz-Editor</Trans>
						</Button>
					</div>
				</div>
			}
			footer="© 2025 Battle.Net Quiz Platform"
		>
			<div className={styles.pageWrapper}>
				<ParticleBackground />
				<div className={styles.container}>
					<div className={styles.hero}>
						<h1 className={styles.title}>
							<span className={styles.titleHighlight}>
								<Trans id="home.title">Battle.Net Quiz Platform</Trans>
							</span>
						</h1>
						<p className={styles.subtitle}>
							<Trans id="home.subtitle">Interaktive Quiz-Plattform für Echtzeit-Multiplayer-Lernerfahrungen</Trans>
						</p>
					</div>

					<div className={styles.actionsGrid}>
						<ActionCard title={<Trans id="home.createQuiz">Quiz erstellen</Trans>} icon={<FiEdit size={32} />} onClick={() => navigate('/editor')}>
							<p>
								<Trans id="home.createQuizDesc">Erstelle deinen eigenen Fragenkatalog mit dem intuitiven Editor</Trans>
							</p>
							<Button variant="primary" fullWidth className="cardButton">
								<Trans id="home.toEditor">Zum Editor</Trans>
							</Button>
						</ActionCard>

						<ActionCard title={<Trans id="home.startSession">Session starten</Trans>} icon={<FiPlay size={32} />} onClick={() => setShowCreateModal(true)}>
							<p>
								<Trans id="home.startSessionDesc">Starte eine neue Quiz-Session und lade Spieler ein</Trans>
							</p>
							<Button variant="primary" fullWidth className="cardButton">
								<Trans id="home.createSession">Session erstellen</Trans>
							</Button>
						</ActionCard>

						<ActionCard title={<Trans id="home.joinSession">Session beitreten</Trans>} icon={<FiUsers size={32} />} onClick={() => setShowJoinModal(true)}>
							<p>
								<Trans id="home.joinSessionDesc">Gib einen Session-Code ein um mitzuspielen</Trans>
							</p>
							<Button variant="secondary" fullWidth className="cardButton">
								<Trans id="home.join">Beitreten</Trans>
							</Button>
						</ActionCard>
					</div>
				</div>
			</div>

			{/* Create Session Modal */}
			<Modal
				isOpen={showCreateModal}
				onClose={() => {
					setShowCreateModal(false);
					setSelectedQuiz(null);
				}}
				title="Quiz-Session erstellen"
				size="md"
			>
				<div className={styles.formGroup}>
					<p className={styles.formDescription}>Wähle ein Quiz für deine Session. Spieler können mit dem Session-Code beitreten.</p>

					{loadingQuizzes ? (
						<div className={styles.emptyMessage}>Lade Quizze...</div>
					) : quizzes.length === 0 ? (
						<div className={styles.emptyMessage}>
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
						</div>
					) : (
						<div className={styles.quizList}>
							{quizzes.map((quiz) => (
								<div key={quiz.id} className={`${styles.quizItem} ${selectedQuiz?.id === quiz.id ? styles.selected : ''}`} onClick={() => setSelectedQuiz(quiz)} data-testid={`quiz-item-${quiz.id}`}>
									<div className={`${styles.quizCheckmark} ${selectedQuiz?.id === quiz.id ? styles.visible : ''}`}>{selectedQuiz?.id === quiz.id && <FiCheck size={14} />}</div>
									<div className={styles.quizItemContent}>
										<div className={styles.quizItemTitle}>{quiz.title}</div>
										<div className={styles.quizItemMeta}>
											{getQuestionCount(quiz)} Fragen • {new Date(quiz.created_at).toLocaleDateString('de-DE')}
										</div>
									</div>
									<div className={styles.quizActions}>
										<button className={styles.quizActionButton} onClick={(e) => handleEditQuiz(quiz, e)} title="Quiz bearbeiten" aria-label="Quiz bearbeiten">
											<Icon name="edit" size="sm" color="primary" />
										</button>
										<button className={`${styles.quizActionButton} ${styles.delete}`} onClick={(e) => handleDeleteQuiz(quiz, e)} disabled={deletingQuizId === quiz.id} title="Quiz löschen" aria-label="Quiz löschen" data-testid={`delete-quiz-${quiz.id}`}>
											{deletingQuizId === quiz.id ? <Icon name="loader" size="sm" color="error" /> : <Icon name="trash" size="sm" color="error" />}
										</button>
									</div>
								</div>
							))}
						</div>
					)}

					{error && <p className={styles.errorMessage}>{error}</p>}

					<Button variant="primary" fullWidth onClick={handleCreateSession} disabled={loading || !selectedQuiz || loadingQuizzes}>
						{loading ? 'Wird erstellt...' : selectedQuiz ? `Session mit "${selectedQuiz.title}" starten` : 'Quiz auswählen'}
					</Button>
				</div>
			</Modal>

			{/* Join Session Modal */}
			<Modal isOpen={showJoinModal} onClose={handleCloseJoinModal} title={isInviteLink ? 'Du wurdest eingeladen!' : 'Quiz-Session beitreten'} size="sm">
				<div className={styles.formGroup}>
					<Input label="Session-Code" placeholder="Session-Code eingeben" value={sessionCode} onChange={(e) => setSessionCode(e.target.value.toUpperCase())} fullWidth disabled={isInviteLink} />
					<Input label="Dein Name" placeholder="Name eingeben" value={playerName} onChange={(e) => setPlayerName(e.target.value)} fullWidth />
					{error && <p className={`${styles.errorMessage} ${styles.withMargin}`}>{error}</p>}
					<Button variant="primary" fullWidth disabled={!sessionCode || !playerName || loading} onClick={handleJoinSession}>
						{loading ? 'Beitreten...' : 'Beitreten'}
					</Button>
				</div>
			</Modal>
		</Layout>
	);
};
