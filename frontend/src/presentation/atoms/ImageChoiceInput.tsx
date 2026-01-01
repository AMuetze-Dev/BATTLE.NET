/**
 * ImageChoiceInput - Atomic component for image-based choice questions
 *
 * Players select one or more images as their answer.
 * Supports lazy loading and accessibility features.
 */
import React, { useState, useCallback } from 'react';
import { Trans } from '@lingui/react/macro';
import styles from './ImageChoiceInput.module.css';

export interface ImageOption {
	id: string;
	imageUrl: string;
	alt: string;
}

export interface ImageChoiceInputProps {
	/** Current value: single ID for single-select, comma-separated IDs for multi-select */
	value: string;
	/** Called when selection changes */
	onChange: (value: string) => void;
	/** Available image options */
	options: ImageOption[];
	/** Whether multiple images can be selected */
	multiSelect?: boolean;
	/** Maximum number of selections allowed (for multi-select) */
	maxSelections?: number;
	/** Whether input is locked */
	locked?: boolean;
}

export const ImageChoiceInput: React.FC<ImageChoiceInputProps> = ({ value, onChange, options, multiSelect = false, maxSelections, locked = false }) => {
	const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
	const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

	// Parse selected IDs
	const selectedIds = React.useMemo(() => {
		if (!value) return new Set<string>();
		return new Set(value.split(',').filter(Boolean));
	}, [value]);

	// Handle image selection
	const handleSelect = useCallback(
		(id: string) => {
			if (locked) return;

			if (multiSelect) {
				const newSelected = new Set(selectedIds);
				if (newSelected.has(id)) {
					newSelected.delete(id);
				} else {
					// Check max selections limit
					if (maxSelections && newSelected.size >= maxSelections) {
						return; // Don't allow more selections
					}
					newSelected.add(id);
				}
				onChange(Array.from(newSelected).join(','));
			} else {
				onChange(selectedIds.has(id) ? '' : id);
			}
		},
		[locked, multiSelect, maxSelections, selectedIds, onChange]
	);

	// Handle image load
	const handleImageLoad = useCallback((id: string) => {
		setLoadedImages((prev) => new Set(prev).add(id));
	}, []);

	// Handle image error
	const handleImageError = useCallback((id: string) => {
		setFailedImages((prev) => new Set(prev).add(id));
	}, []);

	// Handle keyboard navigation
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent, id: string) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handleSelect(id);
			}
		},
		[handleSelect]
	);

	return (
		<div className={styles.container}>
			{/* Multi-select hint */}
			{multiSelect && (
				<div className={styles.hint}>
					{maxSelections ? (
						<Trans>
							Wähle genau {maxSelections} Bilder aus ({selectedIds.size}/{maxSelections})
						</Trans>
					) : (
						<Trans>Wähle alle passenden Bilder aus</Trans>
					)}
				</div>
			)}

			{/* Image grid */}
			<div className={styles.grid}>
				{options.map((option, index) => {
					const isSelected = selectedIds.has(option.id);
					const isLoaded = loadedImages.has(option.id);
					const hasFailed = failedImages.has(option.id);

					return (
						<div
							key={option.id}
							className={`${styles.imageCard} ${isSelected ? styles.selected : ''} ${locked ? styles.locked : ''}`}
							onClick={() => handleSelect(option.id)}
							onKeyDown={(e) => handleKeyDown(e, option.id)}
							role="checkbox"
							aria-checked={isSelected}
							aria-disabled={locked}
							aria-label={option.alt}
							tabIndex={locked ? -1 : 0}
						>
							{/* Index badge */}
							<div className={styles.indexBadge}>{String.fromCharCode(65 + index)}</div>

							{/* Image wrapper */}
							<div className={styles.imageWrapper}>
								{hasFailed ? <div className={styles.placeholder}>🖼️</div> : <img src={option.imageUrl} alt={option.alt} className={`${styles.image} ${!isLoaded ? styles.loading : ''}`} onLoad={() => handleImageLoad(option.id)} onError={() => handleImageError(option.id)} loading="lazy" />}
							</div>

							{/* Selection overlay */}
							<div className={styles.selectionOverlay}>
								<div className={styles.checkmark}>✓</div>
							</div>

							{/* Alt text on hover */}
							<div className={styles.altText}>{option.alt}</div>
						</div>
					);
				})}
			</div>

			{/* Selection count for multi-select */}
			{multiSelect && selectedIds.size > 0 && (
				<div className={styles.selectionCount}>
					<span>✓</span>
					<span>
						{selectedIds.size} {selectedIds.size === 1 ? <Trans>Bild ausgewählt</Trans> : <Trans>Bilder ausgewählt</Trans>}
					</span>
				</div>
			)}
		</div>
	);
};

export default ImageChoiceInput;
