/**
 * NumberInput - Atomic component for numeric answer input with +/- buttons
 */
import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface NumberInputProps {
	value: string;
	onChange: (value: string) => void;
	locked?: boolean;
	min?: number;
	max?: number;
	step?: number;
	placeholder?: string;
}

const Container = styled.div`
	display: flex;
	align-items: center;
	gap: ${spacing.sm};
	width: 100%;
	max-width: 500px;
`;

const StepButton = styled.button<{ $locked: boolean }>`
	width: 48px;
	height: 48px;
	border: 2px solid ${({ $locked }) => ($locked ? colors.border.light : colors.primary[400])};
	border-radius: ${borderRadius.md};
	background: ${({ $locked }) => ($locked ? colors.neutral[100] : colors.primary[50])};
	color: ${({ $locked }) => ($locked ? colors.text.disabled : colors.primary[600])};
	font-size: ${typography.fontSize['2xl']};
	font-weight: ${typography.fontWeight.bold};
	cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
	transition: all 0.2s ease;
	flex-shrink: 0;

	&:hover:not(:disabled) {
		background: ${({ $locked }) => ($locked ? colors.neutral[100] : colors.primary[100])};
		border-color: ${({ $locked }) => ($locked ? colors.border.light : colors.primary[500])};
	}

	&:active:not(:disabled) {
		transform: scale(0.95);
	}
`;

const StyledInput = styled.input<{ $locked: boolean }>`
	flex: 1;
	padding: ${spacing.md} ${spacing.lg};
	font-size: ${typography.fontSize['2xl']};
	font-weight: ${typography.fontWeight.semibold};
	border: 2px solid ${({ $locked }) => ($locked ? colors.border.light : colors.primary[400])};
	border-radius: ${borderRadius.lg};
	text-align: center;
	background: ${({ $locked }) => ($locked ? colors.neutral[100] : colors.surface)};
	color: ${({ $locked }) => ($locked ? colors.text.secondary : colors.text.primary)};
	cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'text')};
	transition: all 0.2s ease;
	-moz-appearance: textfield;

	&::-webkit-outer-spin-button,
	&::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	&:focus {
		outline: none;
		border-color: ${({ $locked }) => ($locked ? colors.border.light : colors.primary[600])};
		box-shadow: ${({ $locked }) => ($locked ? 'none' : `0 0 0 3px ${colors.primary[100]}`)};
	}
`;

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(({ value, onChange, locked = false, min, max, step = 1, placeholder }, ref) => {
	const numValue = parseFloat(value) || 0;

	const handleStep = (delta: number) => {
		if (locked) return;
		let newValue = numValue + delta;
		if (min !== undefined) newValue = Math.max(min, newValue);
		if (max !== undefined) newValue = Math.min(max, newValue);
		onChange(String(newValue));
	};

	return (
		<Container>
			<StepButton type="button" onClick={() => handleStep(-step)} disabled={locked || (min !== undefined && numValue <= min)} $locked={locked} aria-label="Decrease">
				−
			</StepButton>
			<StyledInput ref={ref} type="number" value={value} onChange={(e) => onChange(e.target.value)} $locked={locked} disabled={locked} min={min} max={max} step={step} placeholder={placeholder} />
			<StepButton type="button" onClick={() => handleStep(step)} disabled={locked || (max !== undefined && numValue >= max)} $locked={locked} aria-label="Increase">
				+
			</StepButton>
		</Container>
	);
});

NumberInput.displayName = 'NumberInput';
