/**
 * Image Choice Question Editor
 */
import React from 'react';
import { FiPlus, FiImage, FiTrash2 } from 'react-icons/fi';
import { Input } from '../../../presentation/atoms/Input';
import type { EditorImageChoiceQuestion, EditorImageOption, QuestionEditorProps } from '../types/editor.types';
import styles from './QuestionEditor.module.css';

type Props = QuestionEditorProps<EditorImageChoiceQuestion>;

export const ImageChoiceEditor: React.FC<Props> = ({ question, onChange }) => {
	const options = question.imageOptions;

	const updateOption = (index: number, field: keyof EditorImageOption, value: string | boolean): void => {
		const newOptions = [...options];
		newOptions[index] = { ...newOptions[index], [field]: value };
		onChange('imageOptions', newOptions);
	};

	const removeOption = (index: number): void => {
		const newOptions = options.filter((_, i) => i !== index);
		onChange('imageOptions', newOptions);
	};

	const addOption = (): void => {
		const newOptions = [...options, { id: Date.now().toString(), imageUrl: '', alt: '', correct: false }];
		onChange('imageOptions', newOptions);
	};

	const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>): void => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				updateOption(index, 'imageData', event.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	return (
		<div className={styles.formGroup}>
			<label>Bildoptionen</label>
			<div className={styles.imageOptionsGrid}>
				{options.map((option, index) => (
					<div className={styles.imageOptionCard} key={option.id || index}>
						{option.imageData || option.imageUrl ? (
							<div className={styles.imageOptionPreview}>
								<img src={option.imageData || option.imageUrl} alt={option.alt} />
								<div className={styles.imageOptionOverlay}>
									<button className={`${styles.iconButton} ${styles.iconButtonDanger}`} onClick={() => removeOption(index)}>
										<FiTrash2 />
									</button>
								</div>
							</div>
						) : (
							<button className={styles.imageOptionUpload} onClick={() => document.getElementById(`img-option-${index}`)?.click()}>
								<FiImage size={24} />
								<span>Bild {String.fromCharCode(65 + index)}</span>
							</button>
						)}
						<input id={`img-option-${index}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(index, e)} />
						<div className={styles.imageOptionInputs}>
							<Input value={option.alt} onChange={(e) => updateOption(index, 'alt', e.target.value)} placeholder="Beschreibung" fullWidth />
							<label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
								<input type="checkbox" checked={option.correct} onChange={(e) => updateOption(index, 'correct', e.target.checked)} />
								Korrekt
							</label>
						</div>
					</div>
				))}
				<button className={styles.addImageOptionButton} onClick={addOption}>
					<FiPlus size={24} />
					<span>Option hinzufügen</span>
				</button>
			</div>
			<label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
				<input type="checkbox" checked={question.imageChoiceMultiSelect} onChange={(e) => onChange('imageChoiceMultiSelect', e.target.checked)} />
				Mehrfachauswahl erlauben
			</label>
			{question.imageChoiceMultiSelect && (
				<div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
					<label style={{ fontSize: '14px' }}>Anzahl zu wählender Bilder:</label>
					<input
						type="number"
						min={1}
						max={options.filter((o) => o.correct).length || options.length}
						value={question.requiredSelections ?? (options.filter((o) => o.correct).length || 1)}
						onChange={(e) => onChange('requiredSelections', parseInt(e.target.value) || 1)}
						style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
					/>
					<span style={{ fontSize: '12px', color: '#666' }}>(von {options.filter((o) => o.correct).length} richtigen)</span>
				</div>
			)}
		</div>
	);
};
