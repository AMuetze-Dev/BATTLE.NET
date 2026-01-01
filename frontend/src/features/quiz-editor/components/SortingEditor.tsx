/**
 * Sorting Question Editor
 */
import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Input } from '../../../presentation/atoms/Input';
import { Button } from '../../../presentation/atoms/Button';
import type { EditorSortingQuestion, QuestionEditorProps } from '../types/editor.types';
import styles from './QuestionEditor.module.css';

type Props = QuestionEditorProps<EditorSortingQuestion>;

export const SortingEditor: React.FC<Props> = ({ question, onChange }) => {
	const items = question.sortingItems;

	const updateItem = (index: number, value: string): void => {
		const newItems = [...items];
		newItems[index] = value;
		onChange('sortingItems', newItems);
	};

	const removeItem = (index: number): void => {
		const newItems = items.filter((_, i) => i !== index);
		onChange('sortingItems', newItems.length > 0 ? newItems : ['Element 1']);
	};

	const addItem = (): void => {
		const newItems = [...items, `Element ${items.length + 1}`];
		onChange('sortingItems', newItems);
	};

	return (
		<div className={styles.formGroup}>
			<label>Elemente (in korrekter Reihenfolge)</label>
			<div className={styles.sortingItemsContainer}>
				{items.map((item, index) => (
					<div className={styles.sortingItemRow} key={index}>
						<span className={styles.sortingItemNumber}>{index + 1}.</span>
						<Input value={item} onChange={(e) => updateItem(index, e.target.value)} placeholder={`Element ${index + 1}`} fullWidth />
						<button className={`${styles.iconButton} ${styles.iconButtonDanger}`} onClick={() => removeItem(index)} title="Entfernen" disabled={items.length <= 2}>
							<FiTrash2 />
						</button>
					</div>
				))}
				<Button variant="outline" size="sm" leftIcon={<FiPlus />} onClick={addItem}>
					Element hinzufügen
				</Button>
			</div>
			<p className={styles.sortingHint}>Die Elemente werden den Spielern in zufälliger Reihenfolge angezeigt. Sie müssen sie in die hier definierte korrekte Reihenfolge bringen.</p>
		</div>
	);
};
