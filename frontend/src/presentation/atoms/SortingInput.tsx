/**
 * SortingInput - Atomic component for drag-and-drop sorting
 *
 * Players reorder items by dragging them into the correct order.
 * Uses native HTML5 drag-and-drop for broad compatibility.
 */
import React, { useState, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Trans } from '@lingui/react/macro';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface SortingInputProps {
	/** Current value as comma-separated item indices in current order */
	value: string;
	/** Called when order changes */
	onChange: (value: string) => void;
	/** Items to sort (displayed in initial/shuffled order) */
	items: string[];
	/** Whether input is locked */
	locked?: boolean;
}

const shake = keyframes`
	0%, 100% { transform: translateX(0); }
	25% { transform: translateX(-2px); }
	75% { transform: translateX(2px); }
`;

const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: ${spacing.md};
	width: 100%;
	max-width: 500px;
`;

const ItemList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${spacing.sm};
	width: 100%;
`;

const DragItem = styled.div<{
	$isDragging: boolean;
	$isOver: boolean;
	$locked: boolean;
	$position: number;
}>`
	display: flex;
	align-items: center;
	gap: ${spacing.md};
	padding: ${spacing.md} ${spacing.lg};
	background: ${({ $isDragging, $isOver, $locked }) => ($locked ? colors.neutral[100] : $isDragging ? colors.primary[100] : $isOver ? colors.primary[50] : colors.surface)};
	border: 2px solid ${({ $isDragging, $isOver, $locked }) => ($locked ? colors.neutral[300] : $isDragging ? colors.primary[500] : $isOver ? colors.primary[400] : colors.border.light)};
	border-radius: ${borderRadius.lg};
	cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'grab')};
	transition: all 0.2s ease;
	user-select: none;
	touch-action: none;
	opacity: ${({ $isDragging }) => ($isDragging ? 0.8 : 1)};
	transform: ${({ $isDragging }) => ($isDragging ? 'scale(1.02) rotate(1deg)' : 'none')};
	box-shadow: ${({ $isDragging }) => ($isDragging ? '0 8px 20px rgba(0, 0, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.05)')};

	&:hover:not([data-locked='true']) {
		border-color: ${colors.primary[300]};
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	&:active:not([data-locked='true']) {
		cursor: grabbing;
	}

	${({ $isOver }) =>
		$isOver &&
		css`
			animation: ${shake} 0.3s ease-in-out;
		`}
`;

const DragHandle = styled.div<{ $locked: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: ${spacing.xs};
	color: ${({ $locked }) => ($locked ? colors.neutral[400] : colors.primary[400])};
	font-size: ${typography.fontSize.lg};
`;

const PositionBadge = styled.div<{ $locked: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	background: ${({ $locked }) => ($locked ? colors.neutral[300] : colors.primary[500])};
	color: white;
	border-radius: 50%;
	font-weight: ${typography.fontWeight.bold};
	font-size: ${typography.fontSize.sm};
	flex-shrink: 0;
`;

const ItemText = styled.span`
	flex: 1;
	font-size: ${typography.fontSize.md};
	color: ${colors.text.primary};
	word-break: break-word;
`;

const HintText = styled.div`
	font-size: ${typography.fontSize.sm};
	color: ${colors.text.secondary};
	text-align: center;
`;

const MobileButtons = styled.div`
	display: flex;
	gap: ${spacing.xs};
	flex-shrink: 0;

	@media (min-width: 769px) {
		display: none;
	}
`;

const MoveButton = styled.button<{ $locked: boolean }>`
	width: 32px;
	height: 32px;
	border: 1px solid ${colors.border.light};
	border-radius: ${borderRadius.sm};
	background: ${colors.surface};
	color: ${({ $locked }) => ($locked ? colors.neutral[400] : colors.primary[600])};
	cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
	font-size: ${typography.fontSize.md};
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background: ${colors.primary[50]};
		border-color: ${colors.primary[400]};
	}

	&:disabled {
		opacity: 0.3;
	}
`;

export const SortingInput: React.FC<SortingInputProps> = ({ value, onChange, items, locked = false }) => {
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [overIndex, setOverIndex] = useState<number | null>(null);

	// Parse current order from value, or use initial order
	const currentOrder: number[] = value
		? value
				.split(',')
				.map(Number)
				.filter((n) => !isNaN(n))
		: items.map((_, i) => i);

	// Get items in current order
	const orderedItems = currentOrder.map((idx) => ({
		originalIndex: idx,
		text: items[idx] ?? `Item ${idx}`,
	}));

	// Update order
	const updateOrder = useCallback(
		(newOrder: number[]) => {
			onChange(newOrder.join(','));
		},
		[onChange]
	);

	// Drag handlers
	const handleDragStart = (e: React.DragEvent, index: number) => {
		if (locked) {
			e.preventDefault();
			return;
		}
		setDragIndex(index);
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', String(index));
	};

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		if (locked || dragIndex === null) return;
		setOverIndex(index);
	};

	const handleDragLeave = () => {
		setOverIndex(null);
	};

	const handleDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();
		if (locked || dragIndex === null) return;

		const newOrder = [...currentOrder];
		const [removed] = newOrder.splice(dragIndex, 1);
		newOrder.splice(dropIndex, 0, removed);
		updateOrder(newOrder);

		setDragIndex(null);
		setOverIndex(null);
	};

	const handleDragEnd = () => {
		setDragIndex(null);
		setOverIndex(null);
	};

	// Mobile move buttons
	const moveItem = (fromIndex: number, direction: 'up' | 'down') => {
		if (locked) return;
		const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
		if (toIndex < 0 || toIndex >= currentOrder.length) return;

		const newOrder = [...currentOrder];
		[newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];
		updateOrder(newOrder);
	};

	// Touch support for mobile
	const [touchStartY, setTouchStartY] = useState<number | null>(null);
	const [touchIndex, setTouchIndex] = useState<number | null>(null);

	const handleTouchStart = (e: React.TouchEvent, index: number) => {
		if (locked) return;
		setTouchStartY(e.touches[0].clientY);
		setTouchIndex(index);
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		if (touchStartY === null || touchIndex === null) return;
		const touchEndY = e.changedTouches[0].clientY;
		const diff = touchEndY - touchStartY;

		if (Math.abs(diff) > 50) {
			moveItem(touchIndex, diff < 0 ? 'up' : 'down');
		}

		setTouchStartY(null);
		setTouchIndex(null);
	};

	return (
		<Container>
			<ItemList>
				{orderedItems.map((item, index) => (
					<DragItem
						key={item.originalIndex}
						$isDragging={dragIndex === index}
						$isOver={overIndex === index && dragIndex !== index}
						$locked={locked}
						$position={index}
						data-locked={locked}
						draggable={!locked}
						onDragStart={(e) => handleDragStart(e, index)}
						onDragOver={(e) => handleDragOver(e, index)}
						onDragLeave={handleDragLeave}
						onDrop={(e) => handleDrop(e, index)}
						onDragEnd={handleDragEnd}
						onTouchStart={(e) => handleTouchStart(e, index)}
						onTouchEnd={handleTouchEnd}
					>
						<DragHandle $locked={locked}>⋮⋮</DragHandle>
						<PositionBadge $locked={locked}>{index + 1}</PositionBadge>
						<ItemText>{item.text}</ItemText>
						<MobileButtons>
							<MoveButton $locked={locked} disabled={locked || index === 0} onClick={() => moveItem(index, 'up')} title="Nach oben">
								↑
							</MoveButton>
							<MoveButton $locked={locked} disabled={locked || index === orderedItems.length - 1} onClick={() => moveItem(index, 'down')} title="Nach unten">
								↓
							</MoveButton>
						</MobileButtons>
					</DragItem>
				))}
			</ItemList>

			{!locked && (
				<HintText>
					<Trans id="sorting.hint">Ziehe die Elemente in die richtige Reihenfolge</Trans>
				</HintText>
			)}
		</Container>
	);
};
