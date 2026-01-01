/**
 * True/False Question Editor
 */
import React from 'react';
import { Trans } from '@lingui/react/macro';
import type { EditorTrueFalseQuestion, QuestionEditorProps } from '../types/editor.types';
import styles from './QuestionEditor.module.css';

type Props = QuestionEditorProps<EditorTrueFalseQuestion>;

export const TrueFalseEditor: React.FC<Props> = ({ question, onChange }) => {
	return (
		<div className={styles.formGroup}>
			<label>
				<Trans id="quizEditor.correctAnswer">Korrekte Antwort</Trans>
			</label>
			<div className={styles.trueFalseOptions}>
				<div className={`${styles.trueFalseOption} ${question.correctAnswer === 1 ? styles.trueFalseOptionSelected : ''}`} onClick={() => onChange('correctAnswer', 1)}>
					<input type="radio" checked={question.correctAnswer === 1} readOnly />
					<span>
						<Trans id="quizEditor.trueOption">Wahr (True)</Trans>
					</span>
				</div>
				<div className={`${styles.trueFalseOption} ${question.correctAnswer === 0 ? styles.trueFalseOptionSelected : ''}`} onClick={() => onChange('correctAnswer', 0)}>
					<input type="radio" checked={question.correctAnswer === 0} readOnly />
					<span>
						<Trans id="quizEditor.falseOption">Falsch (False)</Trans>
					</span>
				</div>
			</div>
		</div>
	);
};
