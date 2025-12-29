/**
 * TextInput - Atomic component for text answer input
 */
import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
	value: string;
	onChange: (value: string) => void;
	locked?: boolean;
	inputType?: 'text' | 'number';
}

const StyledInput = styled.input<{ $locked: boolean }>`
	width: 100%;
	max-width: 500px;
	padding: ${spacing.md} ${spacing.lg};
	font-size: ${typography.fontSize.xl};
	border: 2px solid ${({ $locked }) => ($locked ? colors.border.light : colors.primary[400])};
	border-radius: ${borderRadius.lg};
	text-align: center;
	background: ${({ $locked }) => ($locked ? colors.neutral[100] : colors.surface)};
	color: ${({ $locked }) => ($locked ? colors.text.secondary : colors.text.primary)};
	cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'text')};
	transition: all 0.2s ease;
	-webkit-appearance: none;
	appearance: none;

	&:focus {
		outline: none;
		border-color: ${({ $locked }) => ($locked ? colors.border.light : colors.primary[600])};
		box-shadow: ${({ $locked }) => ($locked ? 'none' : `0 0 0 3px ${colors.primary[100]}`)};
	}

	&::placeholder {
		color: ${colors.text.disabled};
	}

	@media (max-width: 480px) {
		padding: ${spacing.sm} ${spacing.md};
		font-size: ${typography.fontSize.lg};
		min-height: 48px;
	}
`;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(({ value, onChange, locked = false, inputType = 'text', disabled, ...props }, ref) => {
	return <StyledInput ref={ref} type={inputType} value={value} onChange={(e) => onChange(e.target.value)} $locked={locked || !!disabled} disabled={locked || disabled} {...props} />;
});

TextInput.displayName = 'TextInput';
