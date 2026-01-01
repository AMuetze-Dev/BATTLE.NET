/**
 * MatchingInput - Atomic component for matching/pairing questions
 *
 * Players connect pairs by clicking left, then right items.
 * Visual feedback shows selected and matched pairs.
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

export const MatchingInput: React.FC<MatchingInputProps> = ({ value, onChange, pairs, locked = false }) => {
	const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const leftRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	const rightRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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

	// Handle left item click
	const handleLeftClick = useCallback(
		(id: string) => {
			if (locked || matchedLeftIds.has(id)) return;
			setSelectedLeft(selectedLeft === id ? null : id);
		},
		[locked, matchedLeftIds, selectedLeft]
	);

	// Handle right item click
	const handleRightClick = useCallback(
		(id: string) => {
			if (locked || matchedRightIds.has(id) || !selectedLeft) return;

			// Create new match
			const newPairs = [...matchedPairs, { left: selectedLeft, right: id }];
			onChange(JSON.stringify(newPairs));
			setSelectedLeft(null);
		},
		[locked, matchedRightIds, selectedLeft, matchedPairs, onChange]
	);

	// Remove a matched pair
	const handleRemovePair = useCallback(
		(leftId: string) => {
			if (locked) return;
			const newPairs = matchedPairs.filter((p) => p.left !== leftId);
			onChange(JSON.stringify(newPairs));
		},
		[locked, matchedPairs, onChange]
	);

	// Calculate line positions for SVG connections
	const [lines, setLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number; matched: boolean }>>([]);

	useEffect(() => {
		const updateLines = (): void => {
			if (!containerRef.current) return;

			const containerRect = containerRef.current.getBoundingClientRect();
			const newLines: Array<{
				x1: number;
				y1: number;
				x2: number;
				y2: number;
				matched: boolean;
			}> = [];

			matchedPairs.forEach((pair) => {
				const leftEl = leftRefs.current.get(pair.left);
				const rightEl = rightRefs.current.get(pair.right);

				if (leftEl && rightEl) {
					const leftRect = leftEl.getBoundingClientRect();
					const rightRect = rightEl.getBoundingClientRect();

					newLines.push({
						x1: leftRect.right - containerRect.left,
						y1: leftRect.top + leftRect.height / 2 - containerRect.top,
						x2: rightRect.left - containerRect.left,
						y2: rightRect.top + rightRect.height / 2 - containerRect.top,
						matched: true,
					});
				}
			});

			setLines(newLines);
		};

		updateLines();
		window.addEventListener('resize', updateLines);
		return () => window.removeEventListener('resize', updateLines);
	}, [matchedPairs]);

	return (
		<div className={styles.container} ref={containerRef}>
			<div className={styles.matchingArea}>
				{/* Left column */}
				<div className={styles.column}>
					<div className={styles.columnLabel}>
						<Trans>Begriff</Trans>
					</div>
					{leftItems.map((item, index) => {
						const isMatched = matchedLeftIds.has(item.id);
						const isSelected = selectedLeft === item.id;

						return (
							<div
								key={item.id}
								ref={(el) => {
									if (el) leftRefs.current.set(item.id, el);
								}}
								className={`${styles.item} ${isSelected ? styles.selected : ''} ${isMatched ? styles.matched : ''} ${locked ? styles.locked : ''}`}
								onClick={() => handleLeftClick(item.id)}
								role="button"
								tabIndex={locked || isMatched ? -1 : 0}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleLeftClick(item.id);
									}
								}}
								aria-pressed={isSelected}
								aria-disabled={locked || isMatched}
							>
								<span className={styles.itemIndex}>{index + 1}</span>
								<span className={styles.itemText}>{item.text}</span>
							</div>
						);
					})}
				</div>

				{/* SVG Lines */}
				<svg className={styles.linesContainer}>
					{lines.map((line, index) => (
						<line key={index} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} className={`${styles.connectionLine} ${line.matched ? styles.matched : ''}`} />
					))}
				</svg>

				{/* Right column */}
				<div className={styles.column}>
					<div className={styles.columnLabel}>
						<Trans>Zuordnung</Trans>
					</div>
					{rightItems.map((item, index) => {
						const isMatched = matchedRightIds.has(item.id);

						return (
							<div
								key={item.id}
								ref={(el) => {
									if (el) rightRefs.current.set(item.id, el);
								}}
								className={`${styles.item} ${isMatched ? styles.matched : ''} ${locked ? styles.locked : ''}`}
								onClick={() => handleRightClick(item.id)}
								role="button"
								tabIndex={locked || isMatched || !selectedLeft ? -1 : 0}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleRightClick(item.id);
									}
								}}
								aria-disabled={locked || isMatched || !selectedLeft}
							>
								<span className={styles.itemIndex}>{String.fromCharCode(65 + index)}</span>
								<span className={styles.itemText}>{item.text}</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Matched pairs list */}
			{matchedPairs.length > 0 && (
				<div className={styles.pairedList}>
					{matchedPairs.map((pair) => {
						const leftItem = leftItems.find((i) => i.id === pair.left);
						const rightItem = rightItems.find((i) => i.id === pair.right);

						return (
							<div key={pair.left} className={styles.pairedItem}>
								<span>{leftItem?.text}</span>
								<span className={styles.arrow}>→</span>
								<span>{rightItem?.text}</span>
								{!locked && (
									<button type="button" className={styles.removeButton} onClick={() => handleRemovePair(pair.left)} aria-label="Remove pairing">
										✕
									</button>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default MatchingInput;
