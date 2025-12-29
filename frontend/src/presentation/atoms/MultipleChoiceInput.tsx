/**
 * MultipleChoiceInput - Atomic component for multiple choice answer selection (2x2 grid)
 */
import React from 'react';
import styled from 'styled-components';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface MultipleChoiceInputProps {
	value: string;
	onChange: (value: string) => void;
	options: string[];
	locked?: boolean;
}

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: ${spacing.md};
	width: 100%;
	max-width: 600px;

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
		gap: ${spacing.sm};
	}
`;

// Colors for each option (unified blue/gray style)
const optionColors = [
	{ bg: colors.primary[50], hover: colors.primary[100], border: colors.primary[500] }, // A
	{ bg: colors.neutral[50], hover: colors.neutral[100], border: colors.primary[400] }, // B
	{ bg: colors.primary[50], hover: colors.primary[100], border: colors.primary[500] }, // C
	{ bg: colors.neutral[50], hover: colors.neutral[100], border: colors.primary[400] }, // D
];

const OptionButton = styled.button<{ $selected: boolean; $colorIndex: number; $locked: boolean }>`
	padding: ${spacing.lg};
	font-size: ${typography.fontSize.lg};
	font-weight: ${typography.fontWeight.medium};
	border: 3px solid ${({ $selected, $colorIndex, $locked }) => ($locked ? colors.neutral[300] : $selected ? optionColors[$colorIndex % 4].border : colors.border.light)};
	border-radius: ${borderRadius.lg};
	background: ${({ $selected, $colorIndex, $locked }) => ($locked ? colors.neutral[100] : $selected ? optionColors[$colorIndex % 4].bg : colors.surface)};
	color: ${({ $locked }) => ($locked ? colors.text.secondary : colors.text.primary)};
	cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
	transition: all 0.2s ease;
	text-align: left;
	display: flex;
	align-items: center;
	gap: ${spacing.sm};
	touch-action: manipulation;
	-webkit-tap-highlight-color: transparent;
	min-height: 60px;

	&:hover:not(:disabled) {
		background: ${({ $colorIndex, $locked }) => ($locked ? colors.neutral[100] : optionColors[$colorIndex % 4].hover)};
		transform: ${({ $locked }) => ($locked ? 'none' : 'scale(1.02)')};
		box-shadow: ${({ $locked }) => ($locked ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.1)')};
	}

	&:active:not(:disabled) {
		transform: scale(0.98);
	}

	@media (max-width: 480px) {
		padding: ${spacing.md};
		font-size: ${typography.fontSize.md};
		border-width: 2px;
		min-height: 56px;
	}
`;

const OptionLabel = styled.span<{ $colorIndex: number }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	background: ${({ $colorIndex }) => optionColors[$colorIndex % 4].border};
	color: white;
	border-radius: 50%;
	font-weight: ${typography.fontWeight.bold};
	font-size: ${typography.fontSize.sm};
	flex-shrink: 0;

	@media (max-width: 480px) {
		width: 24px;
		height: 24px;
		font-size: ${typography.fontSize.xs};
	}
`;

const OptionText = styled.span`
	flex: 1;
	word-break: break-word;
`;

export const MultipleChoiceInput: React.FC<MultipleChoiceInputProps> = ({ value, onChange, options, locked = false }) => {
	return (
		<Grid>
			{options.map((option, index) => (
				<OptionButton key={index} type="button" $selected={value === option} $colorIndex={index} $locked={locked} disabled={locked} onClick={() => onChange(option)} aria-pressed={value === option}>
					<OptionLabel $colorIndex={index}>{String.fromCharCode(65 + index)}</OptionLabel>
					<OptionText>{option}</OptionText>
				</OptionButton>
			))}
		</Grid>
	);
};
