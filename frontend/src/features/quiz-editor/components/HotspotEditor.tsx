/**
 * Hotspot Question Editor
 */
import React from 'react';
import type { EditorHotspotQuestion, QuestionEditorProps } from '../types/editor.types';
import styles from './QuestionEditor.module.css';

type Props = QuestionEditorProps<EditorHotspotQuestion>;

export const HotspotEditor: React.FC<Props> = ({ question, onChange }) => {
	const handleImageClick = (e: React.MouseEvent<HTMLImageElement>): void => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		onChange('hotspotX', Math.max(0, Math.min(100, x)));
		onChange('hotspotY', Math.max(0, Math.min(100, y)));
	};

	const hasImage = question.imageData || question.imageUrl;

	if (!hasImage) {
		return (
			<div className={styles.formGroup}>
				<div className={styles.hotspotWarning}>⚠️ Bitte lade zuerst ein Bild hoch, um die korrekte Position zu markieren.</div>
			</div>
		);
	}

	return (
		<>
			<div className={styles.formGroup}>
				<label>Korrekte Position markieren (Klicke auf das Bild)</label>
				<div className={styles.hotspotEditorContainer}>
					<div className={styles.hotspotImageWrapper}>
						<img className={styles.hotspotEditorImage} src={question.imageData || question.imageUrl} alt="Hotspot Bild" onClick={handleImageClick} />
						{question.hotspotX !== undefined && question.hotspotY !== undefined && (
							<div
								className={styles.hotspotMarker}
								style={{
									left: `${question.hotspotX}%`,
									top: `${question.hotspotY}%`,
								}}
							/>
						)}
					</div>
				</div>
				<div className={styles.hotspotCoords}>
					Position: X = {question.hotspotX?.toFixed(1)}%, Y = {question.hotspotY?.toFixed(1)}%
				</div>
			</div>
			<div className={styles.formGroup}>
				<label>Optionen</label>
				<div className={styles.checkboxRow}>
					<input type="checkbox" checked={question.hotspotAllowZoom} onChange={(e) => onChange('hotspotAllowZoom', e.target.checked)} id="allowZoom" />
					<label htmlFor="allowZoom">Zoom erlauben (Spieler können das Bild vergrößern)</label>
				</div>
			</div>
		</>
	);
};
