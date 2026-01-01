/**
 * AudioInput - Atomic component for audio-based questions
 *
 * Players listen to audio and provide text or multiple choice answer.
 * Supports limited play counts and optional transcript display.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Trans } from '@lingui/react/macro';
import styles from './AudioInput.module.css';

export interface AudioOption {
	id: string;
	text: string;
}

export interface AudioInputProps {
	/** Current answer value */
	value: string;
	/** Called when answer changes */
	onChange: (value: string) => void;
	/** Audio source URL */
	audioUrl: string;
	/** Maximum number of plays allowed (undefined = unlimited) */
	maxPlays?: number;
	/** Optional transcript text */
	transcript?: string;
	/** Answer mode: text input or multiple choice */
	answerMode: 'text' | 'multiple-choice';
	/** Options for multiple choice mode */
	options?: AudioOption[];
	/** Whether input is locked */
	locked?: boolean;
}

export const AudioInput: React.FC<AudioInputProps> = ({ value, onChange, audioUrl, maxPlays, transcript, answerMode, options = [], locked = false }) => {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [playCount, setPlayCount] = useState(0);
	const [progress, setProgress] = useState(0);
	const [showTranscript, setShowTranscript] = useState(false);

	const canPlay = maxPlays === undefined || playCount < maxPlays;
	const playsRemaining = maxPlays !== undefined ? maxPlays - playCount : undefined;

	// Handle play/pause
	const handlePlayPause = useCallback(() => {
		if (!audioRef.current || locked) return;

		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
		} else if (canPlay) {
			audioRef.current.play();
			setIsPlaying(true);
			if (!audioRef.current.currentTime) {
				setPlayCount((prev) => prev + 1);
			}
		}
	}, [isPlaying, canPlay, locked]);

	// Update progress during playback
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const handleTimeUpdate = (): void => {
			setProgress((audio.currentTime / audio.duration) * 100 || 0);
		};

		const handleEnded = (): void => {
			setIsPlaying(false);
			setProgress(0);
		};

		audio.addEventListener('timeupdate', handleTimeUpdate);
		audio.addEventListener('ended', handleEnded);

		return () => {
			audio.removeEventListener('timeupdate', handleTimeUpdate);
			audio.removeEventListener('ended', handleEnded);
		};
	}, []);

	// Handle text input change
	const handleTextChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (!locked) {
				onChange(e.target.value);
			}
		},
		[locked, onChange]
	);

	// Handle option selection
	const handleOptionSelect = useCallback(
		(optionId: string) => {
			if (!locked) {
				onChange(optionId);
			}
		},
		[locked, onChange]
	);

	// Get play count status class
	const getPlayCountClass = (): string => {
		if (playsRemaining === undefined) return '';
		if (playsRemaining === 0) return styles.exhausted;
		if (playsRemaining === 1) return styles.warning;
		return '';
	};

	return (
		<div className={`${styles.container} ${locked ? styles.locked : ''}`}>
			{/* Hidden audio element */}
			<audio ref={audioRef} src={audioUrl} preload="metadata" />

			{/* Audio Player */}
			<div className={styles.audioPlayer}>
				<button type="button" className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`} onClick={handlePlayPause} disabled={locked || (!isPlaying && !canPlay)} aria-label={isPlaying ? 'Pause' : 'Play'}>
					{isPlaying ? '⏸' : '▶'}
				</button>

				{/* Progress bar */}
				<div className={styles.progressBar}>
					<div className={styles.progressFill} style={{ width: `${progress}%` }} />
				</div>

				{/* Play count */}
				{maxPlays !== undefined && (
					<div className={`${styles.playCount} ${getPlayCountClass()}`}>
						<span>
							{playCount}/{maxPlays} <Trans>Wiedergaben</Trans>
						</span>
					</div>
				)}

				{/* Transcript toggle */}
				{transcript && (
					<>
						<button type="button" className={styles.transcriptToggle} onClick={() => setShowTranscript(!showTranscript)}>
							{showTranscript ? <Trans>Transkript ausblenden</Trans> : <Trans>Transkript anzeigen</Trans>}
						</button>

						{showTranscript && <div className={styles.transcript}>{transcript}</div>}
					</>
				)}
			</div>

			{/* Answer Section */}
			<div className={styles.answerSection}>
				<div className={styles.answerLabel}>
					<Trans>Deine Antwort:</Trans>
				</div>

				{answerMode === 'text' ? (
					<input type="text" className={styles.textInput} value={value} onChange={handleTextChange} disabled={locked} placeholder="" autoComplete="off" />
				) : (
					<div className={styles.optionsGrid}>
						{options.map((option, index) => (
							<button key={option.id} type="button" className={`${styles.optionButton} ${value === option.id ? styles.selected : ''}`} onClick={() => handleOptionSelect(option.id)} disabled={locked}>
								<span className={styles.optionIndex}>{String.fromCharCode(65 + index)}</span>
								<span>{option.text}</span>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default AudioInput;
