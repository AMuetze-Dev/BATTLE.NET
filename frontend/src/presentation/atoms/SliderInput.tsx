/**
 * SliderInput - Atomic component for numeric range/slider input
 */
import React from 'react';
import styled from 'styled-components';
import { colors, spacing, typography } from '../../theme';

export interface SliderInputProps {
	value: string;
	onChange: (value: string) => void;
	min?: number;
	max?: number;
	step?: number;
	locked?: boolean;
	/** Optional unit to display (e.g., "km", "Jahre", "Millionen") */
	unit?: string;
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: ${spacing.md};
	width: 100%;
	max-width: 500px;
`;

const ValueDisplay = styled.div<{ $locked: boolean }>`
	font-size: ${typography.fontSize['4xl']};
	font-weight: ${typography.fontWeight.bold};
	color: ${({ $locked }) => ($locked ? colors.text.secondary : colors.primary[600])};
	min-width: 100px;
	text-align: center;
`;

const SliderTrack = styled.input<{ $locked: boolean }>`
	width: 100%;
	height: 8px;
	-webkit-appearance: none;
	appearance: none;
	border-radius: 4px;
	background: ${({ $locked }) => ($locked ? colors.neutral[200] : colors.primary[100])};
	outline: none;
	cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
	transition: background 0.2s ease;

	&::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: ${({ $locked }) => ($locked ? colors.neutral[400] : colors.primary[600])};
		cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'grab')};
		border: 3px solid white;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
		transition: all 0.2s ease;
	}

	&::-webkit-slider-thumb:hover {
		transform: ${({ $locked }) => ($locked ? 'none' : 'scale(1.1)')};
		background: ${({ $locked }) => ($locked ? colors.neutral[400] : colors.primary[700])};
	}

	&::-webkit-slider-thumb:active {
		cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'grabbing')};
	}

	&::-moz-range-thumb {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: ${({ $locked }) => ($locked ? colors.neutral[400] : colors.primary[600])};
		cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'grab')};
		border: 3px solid white;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}
`;

const Labels = styled.div`
	display: flex;
	justify-content: space-between;
	width: 100%;
	font-size: ${typography.fontSize.sm};
	color: ${colors.text.secondary};
`;

const UnitLabel = styled.span`
	font-size: ${typography.fontSize.lg};
	color: ${colors.text.secondary};
	margin-left: ${spacing.xs};
`;

export const SliderInput: React.FC<SliderInputProps> = ({ value, onChange, min = 0, max = 100, step = 1, locked = false, unit }) => {
	const displayValue = value || String(min);

	return (
		<Container>
			<ValueDisplay $locked={locked}>
				{displayValue}
				{unit && <UnitLabel>{unit}</UnitLabel>}
			</ValueDisplay>
			<SliderTrack type="range" min={min} max={max} step={step} value={displayValue} onChange={(e) => onChange(e.target.value)} $locked={locked} disabled={locked} />
			<Labels>
				<span>
					{min}
					{unit ? ` ${unit}` : ''}
				</span>
				<span>
					{max}
					{unit ? ` ${unit}` : ''}
				</span>
			</Labels>
		</Container>
	);
};
