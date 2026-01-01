/**
 * Slider Question Editor
 */
import React from 'react';
import { Input } from '../../../presentation/atoms/Input';
import type { EditorSliderQuestion, QuestionEditorProps } from '../types/editor.types';
import styles from './QuestionEditor.module.css';

type Props = QuestionEditorProps<EditorSliderQuestion>;

export const SliderEditor: React.FC<Props> = ({ question, onChange }) => {
	return (
		<>
			<div className={styles.formRow}>
				<div className={styles.formGroup}>
					<Input label="Minimum" type="number" value={question.sliderMin} onChange={(e) => onChange('sliderMin', parseFloat(e.target.value) || 0)} fullWidth />
				</div>
				<div className={styles.formGroup}>
					<Input label="Maximum" type="number" value={question.sliderMax} onChange={(e) => onChange('sliderMax', parseFloat(e.target.value) || 100)} fullWidth />
				</div>
			</div>
			<div className={styles.formRow}>
				<div className={styles.formGroup}>
					<Input label="Schrittweite" type="number" value={question.sliderStep} onChange={(e) => onChange('sliderStep', parseFloat(e.target.value) || 1)} placeholder="z.B. 0.1, 0.5, 1" fullWidth />
				</div>
				<div className={styles.formGroup}>
					<Input label="Einheit (optional)" type="text" value={question.sliderUnit ?? ''} onChange={(e) => onChange('sliderUnit', e.target.value)} placeholder="z.B. km, Jahre, €" fullWidth />
				</div>
			</div>
			<div className={styles.formGroup}>
				<Input label="Korrekte Antwort" type="number" value={question.sliderCorrectValue} onChange={(e) => onChange('sliderCorrectValue', parseFloat(e.target.value) || 0)} fullWidth />
				<div className={styles.sliderPreview}>
					<span className={styles.sliderPreviewLabel}>Vorschau:</span>
					<span className={styles.sliderPreviewValue}>
						{question.sliderCorrectValue}
						{question.sliderUnit ? ` ${question.sliderUnit}` : ''}
					</span>
					<span className={styles.sliderPreviewRange}>
						(von {question.sliderMin} bis {question.sliderMax})
					</span>
				</div>
			</div>
		</>
	);
};
