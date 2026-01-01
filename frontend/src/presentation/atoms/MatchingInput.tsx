/**
 * MatchingInput - Atomic component for matching/pairing questions
 *
 * Players drag right-side items to drop zones next to left items.
 * Supports both drag & drop and click-based interaction for accessibility.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Trans } from '@lingui/react/macro';
import styles from './MatchingInput.module.css';

export interface MatchingPair {
	leftId: string;
	leftText: string;
	rightId: string;
	rightText: string;
}

export interface MatchingInputProps {
	/** Current value as JSON string of matched pairs: [{left: "id", right: "id"}, ...] */
	value: string;
	/** Called when matching changes */
	onChange: (value: string) => void;
	/** Available pairs to match */
	pairs: MatchingPair[];
	/** Whether input is locked */
	locked?: boolean;
}

interface MatchedPair {
	left: string;
	right: string;
}

interface DragState {
	itemId: string;
	itemText: string;
	currentX: number;
	currentY: number;
}

export const MatchingInput: React.FC<MatchingInputProps> = ({ value, onChange, pairs, locked = false }) => {
	const [dragState, setDragState] = useState<DragState | null>(null);
	const [hoveredDropZone, setHoveredDropZone] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Parse current matched pairs
	const matchedPairs: MatchedPair[] = React.useMemo(() => {
		try {
			return JSON.parse(value || '[]');
		} catch {
			return [];
		}
	}, [value]);

	// Get IDs that are already matched
	const matchedLeftIds = new Set(matchedPairs.map((p) => p.left));
	const matchedRightIds = new Set(matchedPairs.map((p) => p.right));

	// Prepare left and right items
	const leftItems = pairs.map((p) => ({ id: p.leftId, text: p.leftText }));
	const rightItems = pairs.map((p) => ({ id: p.rightId, text: p.rightText }));

	// Available right items (not yet matched)
	const availableRightItems = rightItems.filter((item) => !matchedRightIds.has(item.id));

	// Get matched right item for a left item
	const getMatchedRight = (leftId: string): (typeof rightItems)[0] | undefined => {
		const match = matchedPairs.find((p) => p.left === leftId);
		if (match) {
			return rightItems.find((r) => r.id === match.right);
		}
		return undefined;
	};

	// Handle drag start (mouse)
	const handleMouseDown = useCallback(
		(e: React.MouseEvent, item: (typeof rightItems)[0]) => {
			if (locked) return;
			e.preventDefault();
			setDragState({
				itemId: item.id,
				itemText: item.text,
				currentX: e.clientX,
				currentY: e.clientY,
			});
		},
		[locked]
	);

	// Handle drag start (touch)
	const handleTouchStart = useCallback(
		(e: React.TouchEvent, item: (typeof rightItems)[0]) => {
			if (locked) return;
			const touch = e.touches[0];
			setDragState({
				itemId: item.id,
				itemText: item.text,
				currentX: touch.clientX,
				currentY: touch.clientY,
			});
		},
		[locked]
	);

	// Handle drag move and end
	useEffect(() => {
		if (!dragState) return;

		const checkDropZone = (x: number, y: number): string | null => {
			const dropZones = document.querySelectorAll('[data-dropzone]');
			let foundZone: string | null = null;
			dropZones.forEach((zone) => {
				const rect = zone.getBoundingClientRect();
				if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
					foundZone = zone.getAttribute('data-dropzone');
				}
			});
			return foundZone;
		};

		const handleMouseMove = (e: MouseEvent): void => {
			setDragState((prev) => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null));
			setHoveredDropZone(checkDropZone(e.clientX, e.clientY));
		};

		const handleTouchMove = (e: TouchEvent): void => {
			e.preventDefault();
			const touch = e.touches[0];
			setDragState((prev) => (prev ? { ...prev, currentX: touch.clientX, currentY: touch.clientY } : null));
			setHoveredDropZone(checkDropZone(touch.clientX, touch.clientY));
		};

		const handleEnd = (): void => {
			if (dragState && hoveredDropZone && !matchedLeftIds.has(hoveredDropZone)) {
				const newPairs = [...matchedPairs, { left: hoveredDropZone, right: dragState.itemId }];
				onChange(JSON.stringify(newPairs));
			}
			setDragState(null);
			setHoveredDropZone(null);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleEnd);
		document.addEventListener('touchmove', handleTouchMove, { passive: false });
		document.addEventListener('touchend', handleEnd);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleEnd);
			document.removeEventListener('touchmove', handleTouchMove);
			document.removeEventListener('touchend', handleEnd);
		};
	}, [dragState, hoveredDropZone, matchedLeftIds, matchedPairs, onChange]);

	// Remove a matched pair
	const handleRemovePair = useCallback(
		(leftId: string) => {
			if (locked) return;
			const newPairs = matchedPairs.filter((p) => p.left !== leftId);
			onChange(JSON.stringify(newPairs));
		},
		[locked, matchedPairs, onChange]
	);

	return (
		<div className={styles.container} ref={containerRef}>
			<div className={styles.instructions}>
				<Trans>Ziehe die Begriffe rechts zu den passenden Feldern links</Trans>
			</div>

			<div className={styles.matchingArea}>
				{/* Left column with drop zones */}
				<div className={styles.leftColumn}>
					<div className={styles.columnLabel}>
						<Trans>Begriff</Trans>
					</div>
					{leftItems.map((item, index) => {
						const matchedRight = getMatchedRight(item.id);
						const isHovered = hoveredDropZone === item.id && !matchedRight;

						return (
							<div key={item.id} className={styles.leftRow}>
								<div className={`${styles.leftItem} ${matchedRight ? styles.matched : ''}`}>
									<span className={styles.itemIndex}>{index + 1}</span>
									<span className={styles.itemText}>{item.text}</span>
								</div>
								<span className={styles.arrow}>→</span>
								<div className={`${styles.dropZone} ${matchedRight ? styles.filled : ''} ${isHovered ? styles.hovered : ''} ${locked ? styles.locked : ''}`} data-dropzone={item.id}>
									{matchedRight ? (
										<div className={styles.droppedItem}>
											<span>{matchedRight.text}</span>
											{!locked && (
												<button type="button" className={styles.removeButton} onClick={() => handleRemovePair(item.id)} aria-label="Zuordnung entfernen">
													✕
												</button>
											)}
										</div>
									) : (
										<span className={styles.dropPlaceholder}>
											<Trans>Hierher ziehen</Trans>
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>

				{/* Right column with draggable items */}
				<div className={styles.rightColumn}>
					<div className={styles.columnLabel}>
						<Trans>Verfügbare Begriffe</Trans>
					</div>
					<div className={styles.availableItems}>
						{availableRightItems.map((item) => (
							<div
								key={item.id}
								className={`${styles.draggableItem} ${locked ? styles.locked : ''} ${dragState?.itemId === item.id ? styles.dragging : ''}`}
								onMouseDown={(e) => handleMouseDown(e, item)}
								onTouchStart={(e) => handleTouchStart(e, item)}
								role="button"
								tabIndex={locked ? -1 : 0}
								aria-label={`${item.text} - zum Zuordnen ziehen`}
							>
								<span className={styles.itemIndex}>{String.fromCharCode(65 + rightItems.indexOf(item))}</span>
								<span className={styles.itemText}>{item.text}</span>
								<span className={styles.dragHandle}>⠿</span>
							</div>
						))}
						{availableRightItems.length === 0 && matchedPairs.length > 0 && (
							<div className={styles.allMatched}>
								<Trans>Alle Begriffe zugeordnet!</Trans> ✓
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Drag preview */}
			{dragState && (
				<div
					className={styles.dragPreview}
					style={{
						left: dragState.currentX,
						top: dragState.currentY,
					}}
				>
					{dragState.itemText}
				</div>
			)}

			{/* Summary */}
			<div className={styles.summary}>
				<Trans>Zugeordnet</Trans>: {matchedPairs.length}/{leftItems.length}
			</div>
		</div>
	);
};

export default MatchingInput;
