/**
 * Buzzer Question Editor
 */
import React from 'react';
import { Input } from '../../../presentation/atoms/Input';
import type { EditorBuzzerQuestion, QuestionEditorProps } from '../types/editor.types';
import styles from './QuestionEditor.module.css';

type Props = QuestionEditorProps<EditorBuzzerQuestion>;

export const BuzzerEditor: React.FC<Props> = ({ question, onChange }) => {
	return (
		<div className={styles.formGroup}>
			<Input label="Korrekte Antwort" value={question.correctAnswerText ?? ''} onChange={(e) => onChange('correctAnswerText', e.target.value)} placeholder="Gib die korrekte Antwort ein..." fullWidth />
		</div>
	);
};
