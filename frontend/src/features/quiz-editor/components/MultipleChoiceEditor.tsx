/**
 * Multiple Choice Question Editor
 */
import React from 'react';
import { Trans } from '@lingui/react/macro';
import { Input } from '../../../presentation/atoms/Input';
import { Icon } from '../../../presentation/atoms/Icon';
import type { EditorMultipleChoiceQuestion, QuestionEditorProps } from '../types/editor.types';
import styles from './QuestionEditor.module.css';

type Props = QuestionEditorProps<EditorMultipleChoiceQuestion>;

export const MultipleChoiceEditor: React.FC<Props> = ({ question, onChange }) => {
	const updateAnswer = (index: number, text: string): void => {
		const newAnswers = [...question.answers];
		newAnswers[index] = { ...newAnswers[index], text };
		onChange('answers', newAnswers);
	};

	const setCorrectAnswer = (index: number): void => {
		const newAnswers = question.answers.map((answer, i) => ({
			...answer,
			isCorrect: i === index,
		}));
		onChange('answers', newAnswers);
		onChange('correctAnswer', index);
	};

	return (
		<div className={styles.answersSection}>
			<label>
				<Trans id="quizEditor.answersLabel">Antworten (Wähle die korrekte Antwort)</Trans>
			</label>
			{question.answers.map((answer, index) => (
				<div key={answer.id} className={`${styles.answerRow} ${answer.isCorrect ? styles.answerRowCorrect : ''}`}>
					<input type="radio" className={styles.correctRadio} name="correctAnswer" checked={answer.isCorrect} onChange={() => setCorrectAnswer(index)} title="Als korrekte Antwort markieren" />
					<span className={`${styles.correctLabel} ${answer.isCorrect ? styles.correctLabelActive : ''}`}>
						{answer.isCorrect ? (
							<>
								<Icon name="check" size="xs" color="success" /> <Trans id="quizEditor.markedCorrect">Korrekt</Trans>
							</>
						) : (
							<Trans id="quizEditor.answerNumber">Antwort {index + 1}</Trans>
						)}
					</span>
					<Input value={answer.text} onChange={(e) => updateAnswer(index, e.target.value)} placeholder={`Antwort ${index + 1}`} fullWidth />
				</div>
			))}
		</div>
	);
};
