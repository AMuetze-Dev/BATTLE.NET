/**
 * Text Question Editor
 */
import React from 'react';
import { Trans } from '@lingui/react/macro';
import { Input } from '../../../presentation/atoms/Input';
import type { EditorTextQuestion, QuestionEditorProps } from '../types/editor.types';
import styles from './QuestionEditor.module.css';

type Props = QuestionEditorProps<EditorTextQuestion>;

export const TextEditor: React.FC<Props> = ({ question, onChange }) => {
	return (
		<>
			<div className={styles.formGroup}>
				<label>
					<Trans id="quizEditor.inputType">Eingabetyp</Trans>
				</label>
				<select value={question.textInputType} onChange={(e) => onChange('textInputType', e.target.value as 'text' | 'number')}>
					<option value="text">Text</option>
					<option value="number">
						<Trans id="quizEditor.numbersOnly">Nur Zahlen</Trans>
					</option>
				</select>
			</div>
			<div className={styles.formGroup}>
				<Input label="Korrekte Antwort" type={question.textInputType} value={question.correctAnswerText} onChange={(e) => onChange('correctAnswerText', e.target.value)} placeholder="Gib die korrekte Antwort ein..." fullWidth />
			</div>
		</>
	);
};
