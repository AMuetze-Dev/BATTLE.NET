/**
 * Input component - Accessible text input field with full validation support
 */
import React from 'react';
import styled from 'styled-components';
import { colors, borderRadius, spacing, transitions } from '../../theme';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	fullWidth?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
}

// Transient props for styled-components
interface StyledContainerProps {
	$fullWidth?: boolean;
}

interface StyledWrapperProps {
	$hasError?: boolean;
}

interface StyledHelperProps {
	$isError?: boolean;
}

const InputContainer = styled.div<StyledContainerProps>`
	display: flex;
	flex-direction: column;
	gap: ${spacing.xs};
	width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
`;

const Label = styled.label`
	font-size: 14px;
	font-weight: 500;
	color: ${colors.text.primary};
`;

const InputWrapper = styled.div<StyledWrapperProps>`
	display: flex;
	align-items: center;
	gap: ${spacing.sm};
	padding: ${spacing.sm} ${spacing.md};
	border: 2px solid ${({ $hasError }) => ($hasError ? colors.error[500] : colors.border.medium)};
	border-radius: ${borderRadius.md};
	background: ${colors.background};
	transition: all ${transitions.fast};

	&:focus-within {
		border-color: ${({ $hasError }) => ($hasError ? colors.error[600] : colors.primary[500])};
		box-shadow: 0 0 0 3px ${({ $hasError }) => ($hasError ? colors.error[100] : colors.primary[100])};
	}

	&:hover:not(:focus-within) {
		border-color: ${({ $hasError }) => ($hasError ? colors.error[600] : colors.border.dark)};
	}
`;

const StyledInput = styled.input`
	flex: 1;
	border: none;
	outline: none;
	background: transparent;
	font-size: 16px;
	color: ${colors.text.primary};

	&::placeholder {
		color: ${colors.text.disabled};
	}

	&:disabled {
		color: ${colors.text.disabled};
		cursor: not-allowed;
	}
`;

const HelperText = styled.span<StyledHelperProps>`
	font-size: 12px;
	color: ${({ $isError }) => ($isError ? colors.error[600] : colors.text.secondary)};
`;

export const Input: React.FC<InputProps> = ({ label, error, helperText, fullWidth, leftIcon, rightIcon, id, ...props }) => {
	const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

	return (
		<InputContainer $fullWidth={fullWidth}>
			{label && <Label htmlFor={inputId}>{label}</Label>}
			<InputWrapper $hasError={!!error}>
				{leftIcon && <span>{leftIcon}</span>}
				<StyledInput id={inputId} {...props} />
				{rightIcon && <span>{rightIcon}</span>}
			</InputWrapper>
			{(error || helperText) && <HelperText $isError={!!error}>{error || helperText}</HelperText>}
		</InputContainer>
	);
};
