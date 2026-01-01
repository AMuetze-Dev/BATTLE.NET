/**
 * Matching Question Editor
 */
import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Input } from '../../../presentation/atoms/Input';
import { Button } from '../../../presentation/atoms/Button';
import type { EditorMatchingQuestion, EditorMatchingPair, QuestionEditorProps } from '../types/editor.types';
import styles from './QuestionEditor.module.css';

type Props = QuestionEditorProps<EditorMatchingQuestion>;

export const MatchingEditor: React.FC<Props> = ({ question, onChange }) => {
	const pairs = question.matchingPairs;

	const updatePair = (index: number, field: keyof EditorMatchingPair, value: string): void => {
		const newPairs = [...pairs];
		newPairs[index] = { ...newPairs[index], [field]: value };
		onChange('matchingPairs', newPairs);
	};

	const removePair = (index: number): void => {
		const newPairs = pairs.filter((_, i) => i !== index);
		onChange('matchingPairs', newPairs);
	};

	const addPair = (): void => {
		const newPairs = [...pairs, { id: Date.now().toString(), left: '', right: '' }];
		onChange('matchingPairs', newPairs);
	};

	return (
		<div className={styles.formGroup}>
			<label>Paare (linke Seite → rechte Seite)</label>
			<div className={styles.sortingItemsContainer}>
				{pairs.map((pair, index) => (
					<div className={styles.matchingPairRow} key={pair.id || index}>
						<Input value={pair.left} onChange={(e) => updatePair(index, 'left', e.target.value)} placeholder="Begriff" fullWidth />
						<span className={styles.matchingArrow}>→</span>
						<Input value={pair.right} onChange={(e) => updatePair(index, 'right', e.target.value)} placeholder="Zuordnung" fullWidth />
						<button className={`${styles.iconButton} ${styles.iconButtonDanger}`} onClick={() => removePair(index)} title="Entfernen" disabled={pairs.length <= 2}>
							<FiTrash2 />
						</button>
					</div>
				))}
				<Button variant="outline" size="sm" leftIcon={<FiPlus />} onClick={addPair}>
					Paar hinzufügen
				</Button>
			</div>
		</div>
	);
};
