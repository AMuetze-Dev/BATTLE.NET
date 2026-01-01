/**
 * Moderator Session Page - Battle.Net Quiz Platform
 *
 * Pure presentation layer - assembles organisms only.
 * All logic is extracted to custom hooks.
 *
 * @module pages/ModeratorSessionPage
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans } from '@lingui/react/macro';
import { Button, Modal } from '../atoms';
import { FileUpload, TeamControls } from '../molecules';
import { ModeratorSessionHeader, ModeratorControlBar, ModeratorQuestionArea, ModeratorLeaderboard } from '../organisms';
import { useModeratorSession } from '../../hooks/useModeratorSession';
import { useQuizUpload } from '../../hooks/useQuizUpload';
import styles from './ModeratorSessionPage.module.css';

/**
 * ModeratorSessionPage - Pure assembly of organisms
 *
 * This page only orchestrates:
 * - ModeratorSessionHeader: Session info and exit control
 * - ModeratorControlBar: Navigation and timer controls
 * - ModeratorQuestionArea: Question content with image and answers
 * - ModeratorLeaderboard: Player list with score controls
 */
export const ModeratorSessionPage: React.FC = () => {
	const navigate = useNavigate();

	// Session hook - all session logic
	const {
		sessionId,
		moderatorToken,
		session,
		gameState,
		questions,
		currentQuestion,
		currentQuestionIndex,
		originalQuestion,
		nextQuestion,
		players,
		connectedCount,
		loading,
		error,
		isConnected,
		timerValue,
		hoveredPlayerId,
		buzzerWinner,
		isTeamMode,
		teams,
		handleNextQuestion,
		handlePrevQuestion,
		handleRevealQuestion,
		handleToggleImage,
		handleToggleBuzzerLock,
		handleScoreChange,
		handleBuzzerCorrect,
		handleBuzzerCorrectAndNext,
		handleBuzzerWrong,
		handleTimerChange,
		handleSetTimer,
		setHoveredPlayerId,
		reloadSession,
		handleSelectActivePlayers,
		handleTeamScoreChange,
	} = useModeratorSession();

	// Upload hook - file upload logic
	const { showUploadModal, uploadFile, uploading, uploadError, openUploadModal, closeUploadModal, setUploadFile, handleUpload } = useQuizUpload({
		sessionId,
		moderatorToken,
		onUploadSuccess: (count) => {
			alert(`Uploaded! ${count} questions`);
			reloadSession();
		},
	});

	// Loading state
	if (loading) {
		return (
			<div className={styles.pageContainer}>
				<div className={styles.loadingContainer}>
					<Trans id="common.loading">Laden...</Trans>
				</div>
			</div>
		);
	}

	// Error state
	if (error || !session) {
		return (
			<div className={styles.pageContainer}>
				<div className={styles.errorContainer}>
					<h2 className={styles.errorTitle}>
						<Trans id="common.error">Fehler</Trans>
					</h2>
					<p className={styles.errorMessage}>{error || <Trans id="moderator.error.sessionNotFound">Session nicht gefunden</Trans>}</p>
					<Button onClick={() => navigate('/')}>
						<Trans id="common.back">Zurück</Trans>
					</Button>
				</div>
			</div>
		);
	}

	// Map players to leaderboard format
	const leaderboardPlayers = players.map((p) => ({
		id: p.id,
		name: p.name,
		score: p.score,
		connected: p.connected,
		answered: p.answered,
	}));

	// Map players to question area format
	const questionPlayers = players.map((p) => ({
		id: p.id,
		name: p.name,
		score: p.score,
		connected: p.connected,
		answered: p.answered,
		current_answer: p.current_answer || '',
	}));

	return (
		<>
			<div className={styles.pageContainer}>
				<div className={styles.mainPanel}>
					{/* Session Header Organism */}
					<ModeratorSessionHeader sessionId={session.id} connectedCount={connectedCount} questionsCount={questions.length} isConnected={isConnected} onExit={() => navigate('/')} />

					{/* Control Bar Organism */}
					<ModeratorControlBar currentIndex={currentQuestionIndex} totalQuestions={questions.length} timerValue={timerValue} onPrev={handlePrevQuestion} onNext={handleNextQuestion} onTimerChange={handleTimerChange} onSetTimer={handleSetTimer} />

					{/* Team Controls (only in team mode) */}
					{isTeamMode && teams.length > 0 && <TeamControls teams={teams} questionType={currentQuestion?.type} hasActiveQuestion={!!currentQuestion} onSelectActivePlayers={handleSelectActivePlayers} onTeamScoreChange={handleTeamScoreChange} />}

					{/* Question Area Organism */}
					{!currentQuestion ? (
						<NoQuestionPlaceholder hasQuestions={questions.length > 0} nextQuestion={nextQuestion} />
					) : (
						<ModeratorQuestionArea
							currentQuestion={currentQuestion}
							originalQuestion={originalQuestion}
							currentQuestionIndex={currentQuestionIndex}
							questionsCount={questions.length}
							nextQuestion={nextQuestion}
							questionVisible={gameState?.question_visible ?? false}
							imageVisible={gameState?.image_visible ?? false}
							inputLocked={gameState?.input_locked ?? false}
							buzzerWinner={buzzerWinner}
							players={questionPlayers}
							hoveredPlayerId={hoveredPlayerId}
							onReveal={handleRevealQuestion}
							onToggleImage={handleToggleImage}
							onToggleLock={handleToggleBuzzerLock}
							onBuzzerCorrect={handleBuzzerCorrect}
							onBuzzerCorrectAndNext={handleBuzzerCorrectAndNext}
							onBuzzerWrong={handleBuzzerWrong}
							onScoreChange={handleScoreChange}
							setHoveredPlayerId={setHoveredPlayerId}
						/>
					)}
				</div>

				{/* Leaderboard Sidebar Organism */}
				<ModeratorLeaderboard players={leaderboardPlayers} connectedCount={connectedCount} onScoreChange={handleScoreChange} />
			</div>

			{/* Upload Modal */}
			<Modal isOpen={showUploadModal} onClose={closeUploadModal} title="Upload Question Catalog" size="md">
				<FileUpload accept=".zip" maxSize={50} onFileSelect={setUploadFile} onUpload={handleUpload} loading={uploading} error={uploadError} />
			</Modal>
		</>
	);
};

// Small placeholder component - could be moved to molecules if reused
interface NoQuestionPlaceholderProps {
	hasQuestions: boolean;
	nextQuestion: any;
}

const NoQuestionPlaceholder: React.FC<NoQuestionPlaceholderProps> = ({ hasQuestions, nextQuestion }) => (
	<div className={styles.questionPlaceholder}>
		<h3 className={styles.placeholderTitle}>{!hasQuestions ? <Trans id="moderator.noQuizLoaded">Kein Quiz geladen</Trans> : <Trans id="moderator.useNavigation">Verwende Navigation oben</Trans>}</h3>
		{nextQuestion && (
			<div className={styles.nextQuestionPreview}>
				<Trans>Nächste Frage:</Trans> <span className={styles.nextQuestionType}>{nextQuestion.type || 'text'}</span>
				{nextQuestion.section && <span> • {nextQuestion.section}</span>}
				<div className={styles.nextQuestionText}>{nextQuestion.question ?? nextQuestion.text}</div>
			</div>
		)}
	</div>
);

export default ModeratorSessionPage;
