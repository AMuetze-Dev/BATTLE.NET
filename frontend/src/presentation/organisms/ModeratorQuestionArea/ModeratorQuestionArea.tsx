/**
 * ModeratorQuestionArea Organism - Battle.Net Quiz Platform
 *
 * Main question display area for moderator with question text,
 * image display, and answer management.
 */

import React, { useState, useRef } from 'react';
import { Trans } from '@lingui/react/macro';
import { Button, Icon } from '../../atoms';
import styles from './ModeratorQuestionArea.module.css';

/** Player data for answer display */
export interface AnswerPlayer {
	id: number;
	name: string;
	score: number;
	connected: boolean;
	answered: boolean;
	current_answer: string;
}

/** Buzzer winner info */
export interface BuzzerWinnerData {
	player_id: number;
	player_name: string;
}

export interface ModeratorQuestionAreaProps {
	/** Current question object */
	currentQuestion: any;
	/** Original question (unshuffled) for correct answers */
	originalQuestion: any;
	/** Current question index (0-based) */
	currentQuestionIndex: number;
	/** Total number of questions */
	questionsCount: number;
	/** Next question for preview */
	nextQuestion: any;
	/** Whether question is visible to players */
	questionVisible: boolean;
	/** Whether image is visible to players */
	imageVisible: boolean;
	/** Whether inputs are locked */
	inputLocked: boolean;
	/** Buzzer winner info */
	buzzerWinner: BuzzerWinnerData | null;
	/** Players list */
	players: AnswerPlayer[];
	/** Currently hovered player ID */
	hoveredPlayerId: number | null;
	/** Session ID for socket events */
	sessionId?: string;
	/** Socket instance for audio sync */
	socket?: any;

	/** Callbacks */
	onReveal: () => void;
	onToggleImage: () => void;
	onToggleLock: () => void;
	onBuzzerCorrect: (playerId: number) => void;
	onBuzzerCorrectAndNext: (playerId: number) => void;
	onBuzzerWrong: (playerId: number) => void;
	onScoreChange: (playerId: number, delta: number) => void;
	setHoveredPlayerId: (id: number | null) => void;
}

// Color palette for player pins
const PLAYER_PIN_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

/** Audio Player for moderator to play question audio */
interface AudioPlayerProps {
	audioSrc: string;
	sessionId: string | undefined;
	socket: any;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioSrc, sessionId, socket }) => {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	const togglePlay = (): void => {
		if (audioRef.current) {
			if (isPlaying) {
				audioRef.current.pause();
				// Broadcast pause to players
				if (socket && sessionId) {
					socket.emit('play_audio', {
						session_id: sessionId,
						action: 'pause',
						audio_src: audioSrc,
						current_time: audioRef.current.currentTime,
					});
				}
			} else {
				audioRef.current.play();
				// Broadcast play to players
				if (socket && sessionId) {
					socket.emit('play_audio', {
						session_id: sessionId,
						action: 'play',
						audio_src: audioSrc,
						current_time: audioRef.current.currentTime,
					});
				}
			}
			setIsPlaying(!isPlaying);
		}
	};

	const handleTimeUpdate = (): void => {
		if (audioRef.current) {
			setCurrentTime(audioRef.current.currentTime);
		}
	};

	const handleLoadedMetadata = (): void => {
		if (audioRef.current) {
			setDuration(audioRef.current.duration);
		}
	};

	const handleEnded = (): void => {
		setIsPlaying(false);
		setCurrentTime(0);
		// Broadcast stop to players
		if (socket && sessionId) {
			socket.emit('play_audio', {
				session_id: sessionId,
				action: 'stop',
				audio_src: audioSrc,
				current_time: 0,
			});
		}
	};

	const formatTime = (time: number): string => {
		const mins = Math.floor(time / 60);
		const secs = Math.floor(time % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const handleSeek = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const newTime = parseFloat(e.target.value);
		if (audioRef.current) {
			audioRef.current.currentTime = newTime;
			setCurrentTime(newTime);
		}
	};

	return (
		<div className={styles.audioPlayer}>
			<audio ref={audioRef} src={audioSrc} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded} />
			<Button size="sm" variant={isPlaying ? 'danger' : 'primary'} onClick={togglePlay}>
				<Icon name={isPlaying ? 'stop' : 'volume'} size="sm" />
				{isPlaying ? 'Stopp' : 'Abspielen'}
			</Button>
			<input type="range" min={0} max={duration || 100} value={currentTime} onChange={handleSeek} className={styles.audioSeekbar} />
			<span className={styles.audioTime}>
				{formatTime(currentTime)} / {formatTime(duration)}
			</span>
		</div>
	);
};

/** Image Lightbox for viewing enlarged images */
interface ImageLightboxProps {
	src: string;
	alt: string;
	onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, alt, onClose }) => (
	<div className={styles.lightboxOverlay} onClick={onClose}>
		<div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
			<img src={src} alt={alt} className={styles.lightboxImage} />
			<button className={styles.lightboxClose} onClick={onClose}>
				✕
			</button>
		</div>
	</div>
);

/**
 * Main question area for moderator session
 */
export const ModeratorQuestionArea: React.FC<ModeratorQuestionAreaProps> = ({
	currentQuestion,
	originalQuestion,
	currentQuestionIndex,
	questionsCount,
	nextQuestion,
	questionVisible,
	imageVisible,
	inputLocked,
	buzzerWinner,
	players,
	hoveredPlayerId,
	sessionId,
	socket,
	onReveal,
	onToggleImage,
	onToggleLock,
	onBuzzerCorrect,
	onBuzzerCorrectAndNext,
	onBuzzerWrong,
	onScoreChange,
	setHoveredPlayerId,
}) => {
	const hasImage = currentQuestion.image || currentQuestion.imageData || currentQuestion.imageUrl;
	const hasAudio = currentQuestion.audioUrl || currentQuestion.audioData;
	const qType = currentQuestion.type?.toLowerCase().replace(/-/g, '_');
	const isHotspot = qType === 'hotspot';
	const isSorting = qType === 'sorting';

	return (
		<div className={styles.container}>
			{/* Top Section: Question with controls */}
			<div className={styles.questionTop}>
				<QuestionHeader currentQuestionIndex={currentQuestionIndex} questionsCount={questionsCount} currentQuestion={currentQuestion} questionVisible={questionVisible} onReveal={onReveal} />
				<h2 className={styles.questionText}>{currentQuestion.question ?? currentQuestion.text}</h2>
				{/* Audio Player */}
				{hasAudio && <AudioPlayer audioSrc={currentQuestion.audioData || currentQuestion.audioUrl} sessionId={sessionId} socket={socket} />}
			</div>

			{/* Bottom Section: Image and Answers */}
			<div className={styles.questionBottom}>
				{/* Left Column: Image */}
				{hasImage && <ImageColumn currentQuestion={currentQuestion} originalQuestion={originalQuestion} players={players} isHotspot={isHotspot} imageVisible={imageVisible} hoveredPlayerId={hoveredPlayerId} onToggleImage={onToggleImage} />}

				{/* Right Column: Answers */}
				<AnswersColumn
					currentQuestion={currentQuestion}
					originalQuestion={originalQuestion}
					players={players}
					isHotspot={isHotspot}
					isSorting={isSorting}
					inputLocked={inputLocked}
					buzzerWinner={buzzerWinner}
					hoveredPlayerId={hoveredPlayerId}
					fullWidth={!hasImage}
					onToggleLock={onToggleLock}
					onBuzzerCorrect={onBuzzerCorrect}
					onBuzzerCorrectAndNext={onBuzzerCorrectAndNext}
					onBuzzerWrong={onBuzzerWrong}
					onScoreChange={onScoreChange}
					setHoveredPlayerId={setHoveredPlayerId}
				/>
			</div>

			{/* Next Question Preview */}
			{nextQuestion && <NextQuestionPreview nextQuestion={nextQuestion} />}
		</div>
	);
};

// === Sub-Components ===

interface QuestionHeaderProps {
	currentQuestionIndex: number;
	questionsCount: number;
	currentQuestion: any;
	questionVisible: boolean;
	onReveal: () => void;
}

const QuestionHeader: React.FC<QuestionHeaderProps> = ({ currentQuestionIndex, questionsCount, currentQuestion, questionVisible, onReveal }) => (
	<div className={styles.questionHeader}>
		<div className={styles.questionMeta}>
			<span className={styles.metaTag}>
				{currentQuestionIndex + 1}/{questionsCount}
			</span>
			<span className={styles.metaTag}>{currentQuestion.type}</span>
			<span className={styles.metaTag}>{currentQuestion.points ?? 10}P</span>
			{currentQuestion.section && <span className={styles.metaTag}>{currentQuestion.section}</span>}
		</div>
		<div className={styles.buttonRow}>
			<Button size="sm" variant={questionVisible ? 'primary' : 'outline'} onClick={onReveal}>
				<Icon name={questionVisible ? 'eye' : 'eye-off'} size="sm" />
			</Button>
		</div>
	</div>
);

interface ImageColumnProps {
	currentQuestion: any;
	originalQuestion: any;
	players: AnswerPlayer[];
	isHotspot: boolean;
	imageVisible: boolean;
	hoveredPlayerId: number | null;
	onToggleImage: () => void;
}

const ImageColumn: React.FC<ImageColumnProps> = ({ currentQuestion, originalQuestion, players, isHotspot, imageVisible, hoveredPlayerId, onToggleImage }) => {
	const imageSrc = currentQuestion.image || currentQuestion.imageData || currentQuestion.imageUrl;

	return (
		<div className={styles.imageColumn}>
			<div className={styles.columnHeader}>
				<h4 className={styles.columnTitle}>
					<Icon name="image" size="sm" /> Bild
				</h4>
				<Button size="sm" variant={imageVisible ? 'primary' : 'outline'} onClick={onToggleImage}>
					{imageVisible ? <Trans id="moderator.controls.imageVisible">Sichtbar</Trans> : <Trans id="moderator.controls.imageHidden">Verborgen</Trans>}
				</Button>
			</div>
			<div className={styles.imageWrapper}>
				{isHotspot ? <HotspotImage imageSrc={imageSrc} originalQuestion={originalQuestion} currentQuestion={currentQuestion} players={players} hoveredPlayerId={hoveredPlayerId} /> : <img className={styles.questionImage} src={imageSrc} alt="Frage" loading="lazy" />}
			</div>
		</div>
	);
};

interface HotspotImageProps {
	imageSrc: string;
	originalQuestion: any;
	currentQuestion: any;
	players: AnswerPlayer[];
	hoveredPlayerId: number | null;
}

const HotspotImage: React.FC<HotspotImageProps> = ({ imageSrc, originalQuestion, currentQuestion, players, hoveredPlayerId }) => {
	const q = originalQuestion || currentQuestion;
	const correctX = q?.correctX ?? q?.hotspotX;
	const correctY = q?.correctY ?? q?.hotspotY;

	return (
		<div className={styles.hotspotWrapper}>
			<img className={styles.hotspotImage} src={imageSrc} alt="Hotspot-Bild" loading="lazy" />

			{/* Correct answer pin */}
			{correctX !== undefined && correctY !== undefined && (
				<div className={`${styles.pin} ${styles.correctPin}`} style={{ left: `${correctX}%`, top: `${correctY}%` }}>
					<div className={styles.pinLabel} style={{ background: '#16a34a' }}>
						<Icon name="check" size="xs" /> Korrekt
					</div>
				</div>
			)}

			{/* Player pins */}
			{players
				.filter((p) => p.current_answer)
				.map((player, index) => {
					const coords = player.current_answer?.split(',');
					if (!coords || coords.length !== 2) return null;
					const x = parseFloat(coords[0]);
					const y = parseFloat(coords[1]);
					if (isNaN(x) || isNaN(y)) return null;

					const color = PLAYER_PIN_COLORS[index % PLAYER_PIN_COLORS.length];
					const isHighlighted = hoveredPlayerId === player.id;
					const isDimmed = hoveredPlayerId !== null && hoveredPlayerId !== player.id;

					return (
						<div key={player.id} className={`${styles.pin} ${isHighlighted ? styles.highlighted : ''} ${isDimmed ? styles.dimmed : ''}`} style={{ left: `${x}%`, top: `${y}%`, ['--pin-color' as any]: color }}>
							<div className={`${styles.pinLabel} ${isHighlighted ? styles.highlighted : ''}`} style={{ background: color }}>
								{player.name}
							</div>
						</div>
					);
				})}
		</div>
	);
};

interface AnswersColumnProps {
	currentQuestion: any;
	originalQuestion: any;
	players: AnswerPlayer[];
	isHotspot: boolean;
	isSorting: boolean;
	inputLocked: boolean;
	buzzerWinner: BuzzerWinnerData | null;
	hoveredPlayerId: number | null;
	fullWidth: boolean;
	onToggleLock: () => void;
	onBuzzerCorrect: (id: number) => void;
	onBuzzerCorrectAndNext: (id: number) => void;
	onBuzzerWrong: (id: number) => void;
	onScoreChange: (id: number, delta: number) => void;
	setHoveredPlayerId: (id: number | null) => void;
}

const AnswersColumn: React.FC<AnswersColumnProps> = ({ currentQuestion, originalQuestion, players, isHotspot, isSorting, inputLocked, buzzerWinner, hoveredPlayerId, fullWidth, onToggleLock, onBuzzerCorrect, onBuzzerCorrectAndNext, onBuzzerWrong, onScoreChange, setHoveredPlayerId }) => (
	<div className={`${styles.answersColumn} ${fullWidth ? styles.fullWidth : ''}`}>
		<div className={styles.columnHeader}>
			<h4 className={styles.columnTitle}>
				<Icon name="clipboard" size="sm" /> <Trans id="moderator.answers">Antworten</Trans>
				<span className={styles.answerCount}>
					{players.filter((p) => p.answered).length}/{players.length}
				</span>
			</h4>
			<Button size="sm" variant={inputLocked ? 'danger' : 'primary'} onClick={onToggleLock}>
				<Icon name={inputLocked ? 'lock' : 'unlock'} size="sm" />
			</Button>
		</div>

		<div className={styles.answersScroll}>
			{/* Buzzer Winner */}
			{buzzerWinner && <BuzzerWinnerBadge buzzerWinner={buzzerWinner} points={currentQuestion?.points || 10} onCorrect={onBuzzerCorrect} onCorrectAndNext={onBuzzerCorrectAndNext} onWrong={onBuzzerWrong} />}

			{/* Correct Answer */}
			<CorrectAnswerDisplay question={originalQuestion || currentQuestion} />

			{/* Player Answers */}
			<PlayerAnswersList players={players} currentQuestion={currentQuestion} originalQuestion={originalQuestion} isHotspot={isHotspot} isSorting={isSorting} hoveredPlayerId={hoveredPlayerId} setHoveredPlayerId={setHoveredPlayerId} onScoreChange={onScoreChange} />
		</div>
	</div>
);

interface BuzzerWinnerBadgeProps {
	buzzerWinner: BuzzerWinnerData;
	points: number;
	onCorrect: (id: number) => void;
	onCorrectAndNext: (id: number) => void;
	onWrong: (id: number) => void;
}

const BuzzerWinnerBadge: React.FC<BuzzerWinnerBadgeProps> = ({ buzzerWinner, points, onCorrect, onCorrectAndNext, onWrong }) => (
	<div className={styles.buzzerWinner}>
		<div>
			<Icon name="bell" size="sm" color="warning" /> <strong>{buzzerWinner.player_name}</strong> hat gebuzzert!
		</div>
		<div className={styles.buttonRow}>
			<Button size="sm" variant="primary" onClick={() => onCorrect(buzzerWinner.player_id)}>
				<Icon name="check" size="xs" /> Richtig (+{points}P)
			</Button>
			<Button size="sm" variant="primary" onClick={() => onCorrectAndNext(buzzerWinner.player_id)}>
				<Icon name="check" size="xs" /> Weiter
			</Button>
			<Button size="sm" variant="danger" onClick={() => onWrong(buzzerWinner.player_id)}>
				<Icon name="x" size="xs" /> Falsch
			</Button>
		</div>
	</div>
);

interface CorrectAnswerDisplayProps {
	question: any;
}

const CorrectAnswerDisplay: React.FC<CorrectAnswerDisplayProps> = ({ question }) => {
	const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

	const getCorrectAnswer = (): React.ReactNode => {
		const qType = question?.type?.toLowerCase().replace(/-/g, '_');

		if (qType === 'multiple_choice') {
			return question?.answers?.find((a: any) => a.isCorrect)?.text || '—';
		}
		if (qType === 'true_false') {
			return question?.correctAnswer === 1 ? 'Wahr (True)' : 'Falsch (False)';
		}
		if (qType === 'slider') {
			const value = question?.sliderCorrectValue ?? question?.correctValue ?? question?.answer;
			const unit = question?.sliderUnit || question?.unit || '';
			const min = question?.sliderMin ?? question?.min ?? 0;
			const max = question?.sliderMax ?? question?.max ?? 100;
			return value !== undefined ? `${value}${unit ? ` ${unit}` : ''} (${min} - ${max})` : '—';
		}
		if (qType === 'hotspot') {
			const x = question?.correctX ?? question?.hotspotX;
			const y = question?.correctY ?? question?.hotspotY;
			return x !== undefined && y !== undefined ? `Grüne Markierung (Abweichung: 0/10000 = perfekt)` : '(Hotspot im Bild markiert)';
		}
		if (qType === 'sorting') {
			const items = question?.sortingItems || question?.answers?.map((a: any) => a.text) || [];
			return items.length > 0 ? items.join(' → ') : '(Reihenfolge definiert)';
		}
		if (qType === 'matching') {
			const pairs = question?.matchingPairs || [];
			if (pairs.length > 0) {
				return (
					<div className={styles.sortingList}>
						{pairs.map((pair: any, index: number) => (
							<div key={index} className={styles.sortingItem}>
								<span>{pair.left}</span>
								<span> → </span>
								<span>{pair.right}</span>
							</div>
						))}
					</div>
				);
			}
			return '(Paarzuordnung definiert)';
		}
		if (qType === 'image_choice') {
			const imageOptions = question?.imageOptions || [];
			// Find correct images - could be single correct index OR multiple with correct:true
			const correctImages = imageOptions.filter((opt: any, idx: number) => opt.correct === true || idx === question?.correctImageIndex || String(idx) === String(question?.correctAnswer));

			if (correctImages.length > 0) {
				return (
					<div className={styles.imageChoiceAnswer}>
						{correctImages.map((img: any, idx: number) => {
							const imgSrc = img.imageData || img.imageUrl;
							const imgAlt = img.alt || img.label || `Option ${idx + 1}`;
							return (
								<div key={img.id || idx} className={`${styles.imageChoiceItem} ${styles.clickable}`} onClick={() => setLightboxImage({ src: imgSrc, alt: imgAlt })} title="Klicken zum Vergrößern">
									<img src={imgSrc} alt={imgAlt} className={styles.imageChoiceThumb} />
									<span>{imgAlt}</span>
									<Icon name="search" size="xs" className={styles.zoomIcon} />
								</div>
							);
						})}
					</div>
				);
			}
			return '(Korrektes Bild nicht definiert)';
		}
		return question?.correctAnswerText || question?.answer || '—';
	};

	return (
		<>
			<div className={styles.correctAnswer}>
				<div className={styles.correctAnswerLabel}>
					<Icon name="lightbulb" size="sm" color="success" /> <Trans id="moderator.correctAnswer">Korrekte Antwort:</Trans>
				</div>
				<div className={styles.correctAnswerText}>{getCorrectAnswer()}</div>
			</div>
			{lightboxImage && <ImageLightbox src={lightboxImage.src} alt={lightboxImage.alt} onClose={() => setLightboxImage(null)} />}
		</>
	);
};

interface PlayerAnswersListProps {
	players: AnswerPlayer[];
	currentQuestion: any;
	originalQuestion: any;
	isHotspot: boolean;
	isSorting: boolean;
	hoveredPlayerId: number | null;
	setHoveredPlayerId: (id: number | null) => void;
	onScoreChange: (id: number, delta: number) => void;
}

const PlayerAnswersList: React.FC<PlayerAnswersListProps> = ({ players, currentQuestion, originalQuestion, isHotspot, isSorting, hoveredPlayerId, setHoveredPlayerId, onScoreChange }) => {
	const playersWithAnswers = players.filter((p) => p.current_answer).sort((a, b) => a.name.localeCompare(b.name));

	if (playersWithAnswers.length === 0) {
		return (
			<div className={styles.noAnswers}>
				<Trans id="moderator.noAnswersYet">Noch keine Spieler-Antworten</Trans>
			</div>
		);
	}

	return (
		<>
			{playersWithAnswers.map((player, index) => (
				<PlayerAnswerItem
					key={player.id}
					player={player}
					index={index}
					currentQuestion={currentQuestion}
					originalQuestion={originalQuestion}
					isHotspot={isHotspot}
					isSorting={isSorting}
					isHovered={hoveredPlayerId === player.id}
					onHover={isHotspot ? setHoveredPlayerId : undefined}
					onScoreChange={onScoreChange}
				/>
			))}
		</>
	);
};

interface PlayerAnswerItemProps {
	player: AnswerPlayer;
	index: number;
	currentQuestion: any;
	originalQuestion: any;
	isHotspot: boolean;
	isSorting: boolean;
	isHovered: boolean;
	onHover?: (id: number | null) => void;
	onScoreChange: (id: number, delta: number) => void;
}

const PlayerAnswerItem: React.FC<PlayerAnswerItemProps> = ({ player, index, currentQuestion, originalQuestion, isHotspot, isSorting, isHovered, onHover, onScoreChange }) => {
	const qType = currentQuestion?.type?.toLowerCase().replace(/-/g, '_');
	const isMatching = qType === 'matching';
	const isSlider = qType === 'slider';
	const isImageChoice = qType === 'image_choice';
	let displayAnswer = player.current_answer;

	// Slider: Show value with difference to correct answer
	if (isSlider && player.current_answer) {
		const playerValue = parseFloat(player.current_answer);
		const correctValue = (originalQuestion || currentQuestion)?.sliderCorrectValue ?? (originalQuestion || currentQuestion)?.correctValue;
		const unit = (originalQuestion || currentQuestion)?.sliderUnit || '';
		if (!isNaN(playerValue) && correctValue !== undefined) {
			const difference = Math.abs(playerValue - correctValue);
			const sign = playerValue > correctValue ? '+' : '-';
			displayAnswer = `${playerValue}${unit ? ` ${unit}` : ''} (${sign}${difference.toFixed(1)}${unit ? ` ${unit}` : ''})`;
		} else {
			displayAnswer = `${playerValue}${unit ? ` ${unit}` : ''}`;
		}
	}

	// Hotspot: Calculate deviation as score (0-10000)
	if (isHotspot && player.current_answer) {
		const coords = player.current_answer?.split(',');
		if (coords && coords.length === 2) {
			const playerX = parseFloat(coords[0]);
			const playerY = parseFloat(coords[1]);
			const correctX = (originalQuestion || currentQuestion)?.hotspotX ?? (originalQuestion || currentQuestion)?.correctX;
			const correctY = (originalQuestion || currentQuestion)?.hotspotY ?? (originalQuestion || currentQuestion)?.correctY;

			if (!isNaN(playerX) && !isNaN(playerY) && correctX !== undefined && correctY !== undefined) {
				const deltaX = Math.abs(playerX - correctX);
				const deltaY = Math.abs(playerY - correctY);
				const deviation = Math.round(deltaX * deltaY);
				displayAnswer = `Abweichung: ${deviation}/10000`;
			} else {
				displayAnswer = 'Koordinaten ungültig';
			}
		}
	}

	// Sorting: Display sorted items with correctness indicators
	let sortingDisplay = null;
	if (isSorting && player.current_answer) {
		const correctOrder = (originalQuestion || currentQuestion)?.sortingItems || [];
		const shuffledItems = currentQuestion?.sortingItems || [];
		const playerIndices = player.current_answer
			.split(',')
			.map(Number)
			.filter((n) => !isNaN(n));
		const playerItems = playerIndices.map((idx) => shuffledItems[idx] || `Item ${idx}`);

		sortingDisplay = (
			<div className={styles.sortingList}>
				{playerItems.map((item, pos) => {
					const isCorrect = correctOrder[pos] === item;
					return (
						<div key={pos} className={`${styles.sortingItem} ${isCorrect ? styles.correct : ''}`}>
							<span className={`${styles.sortingBadge} ${isCorrect ? styles.correct : ''}`}>{pos + 1}</span>
							<span>{item}</span>
						</div>
					);
				})}
			</div>
		);
	}

	// Matching: Display matching pairs with correctness indicators
	let matchingDisplay = null;
	if (isMatching && player.current_answer) {
		const correctPairs = (originalQuestion || currentQuestion)?.matchingPairs || [];
		const shuffledPairs = currentQuestion?.matchingPairs || [];

		// Try to parse as JSON first (new format from MatchingInput)
		let playerMatches: Array<{ left: string; right: string }> = [];
		try {
			playerMatches = JSON.parse(player.current_answer);
		} catch {
			// Fallback to old comma-separated format
			const playerIndices = player.current_answer
				.split(',')
				.map(Number)
				.filter((n: number) => !isNaN(n));
			playerMatches = shuffledPairs.map((pair: any, pos: number) => ({
				left: pair.leftId || pair.id || String(pos),
				right: shuffledPairs[playerIndices[pos]]?.rightId || shuffledPairs[playerIndices[pos]]?.id || String(playerIndices[pos]),
			}));
		}

		matchingDisplay = (
			<div className={styles.sortingList}>
				{shuffledPairs.map((pair: any, pos: number) => {
					// Find player's selected right value for this left
					const leftId = pair.leftId || pair.id || String(pos);
					const leftText = pair.leftText || pair.left || `Item ${pos + 1}`;
					const playerMatch = playerMatches.find((m: any) => m.left === leftId);
					const selectedRightId = playerMatch?.right;
					const selectedRightPair = shuffledPairs.find((p: any) => (p.rightId || p.id) === selectedRightId);
					const selectedRightText = selectedRightPair?.rightText || selectedRightPair?.right || '—';

					// Find correct right value for this left
					const correctPair = correctPairs.find((cp: any) => (cp.leftId || cp.id) === leftId || cp.left === leftText);
					const correctRightText = correctPair?.rightText || correctPair?.right;
					const isCorrect = selectedRightText === correctRightText;

					return (
						<div key={pos} className={`${styles.sortingItem} ${isCorrect ? styles.correct : ''}`}>
							<span>{leftText}</span>
							<span> → </span>
							<span>{selectedRightText}</span>
						</div>
					);
				})}
			</div>
		);
	}

	// Image-Choice: Display selected image
	let imageChoiceDisplay = null;
	if (isImageChoice && player.current_answer) {
		const imageOptions = currentQuestion?.imageOptions || [];

		// Parse answer - can be comma-separated IDs, single ID, or JSON array
		let selectedIds: string[] = [];
		try {
			const parsed = JSON.parse(player.current_answer);
			if (Array.isArray(parsed)) {
				selectedIds = parsed.map(String);
			} else {
				selectedIds = [String(parsed)];
			}
		} catch {
			// Not JSON - try comma-separated or single value
			selectedIds = player.current_answer
				.split(',')
				.map((id) => id.trim())
				.filter(Boolean);
		}

		if (selectedIds.length > 0) {
			// Convert IDs to letters (A, B, C, etc.)
			const letters = selectedIds
				.map((id) => {
					const index = imageOptions.findIndex((opt: any) => opt.id === id || String(imageOptions.indexOf(opt)) === id);
					return index >= 0 ? String.fromCharCode(65 + index) : null;
				})
				.filter(Boolean)
				.join(', ');

			imageChoiceDisplay = <span className={styles.answerText}>{letters || player.current_answer}</span>;
		} else {
			imageChoiceDisplay = <span className={styles.answerText}>—</span>;
		}
	}

	return (
		<div className={`${styles.answerItem} ${player.answered ? styles.answered : ''} ${isHovered ? styles.hovered : ''}`} onMouseEnter={onHover ? () => onHover(player.id) : undefined} onMouseLeave={onHover ? () => onHover(null) : undefined}>
			<span className={styles.answerPlayerName}>
				{isHotspot && <span className={styles.colorDot} style={{ background: PLAYER_PIN_COLORS[index % PLAYER_PIN_COLORS.length] }} />}
				{player.name}
			</span>
			{isSorting ? sortingDisplay : isMatching ? matchingDisplay : isImageChoice ? imageChoiceDisplay : <span className={styles.answerText}>{displayAnswer}</span>}
			<div className={styles.answerActions}>
				<button className={styles.correctBtn} onClick={() => onScoreChange(player.id, currentQuestion?.points || 10)} title={`+${currentQuestion?.points || 10} Punkte`}>
					<Icon name="check" size="xs" />
				</button>
			</div>
		</div>
	);
};

interface NextQuestionPreviewProps {
	nextQuestion: any;
}

const NextQuestionPreview: React.FC<NextQuestionPreviewProps> = ({ nextQuestion }) => (
	<div className={styles.nextPreview}>
		<Trans id="moderator.nextQuestion">Nächste Frage:</Trans> <span className={styles.nextType}>{nextQuestion.type || 'text'}</span>
		{nextQuestion.section && <span> • {nextQuestion.section}</span>}
		<div className={styles.nextText}>{nextQuestion.question ?? nextQuestion.text}</div>
	</div>
);

export default ModeratorQuestionArea;
