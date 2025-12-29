/**
 * Button component - Primary interactive element with full accessibility support
 */
import React, { memo, forwardRef } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { colors, borderRadius, shadows, transitions, spacing } from '../../theme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
	size?: 'sm' | 'md' | 'lg';
	fullWidth?: boolean;
	loading?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	'aria-label'?: string;
}

// Transient props interface for styled-components
interface StyledButtonProps {
	$variant?: ButtonProps['variant'];
	$size?: ButtonProps['size'];
	$fullWidth?: boolean;
	$loading?: boolean;
}

const sizeStyles = {
	sm: css`
		padding: ${spacing.xs} ${spacing.md};
		font-size: 14px;
		height: 32px;
	`,
	md: css`
		padding: ${spacing.sm} ${spacing.lg};
		font-size: 16px;
		height: 40px;
	`,
	lg: css`
		padding: ${spacing.md} ${spacing.xl};
		font-size: 18px;
		height: 48px;
	`,
};

const variantStyles = {
	primary: css`
		background: ${colors.primary[600]};
		color: ${colors.text.inverse};
		border: none;

		&:hover:not(:disabled) {
			background: ${colors.primary[700]};
			box-shadow: ${shadows.md};
		}

		&:active:not(:disabled) {
			background: ${colors.primary[800]};
		}
	`,
	secondary: css`
		background: ${colors.primary[500]};
		color: ${colors.text.inverse};
		border: none;

		&:hover:not(:disabled) {
			background: ${colors.primary[600]};
			box-shadow: ${shadows.md};
		}

		&:active:not(:disabled) {
			background: ${colors.primary[700]};
		}
	`,
	outline: css`
		background: transparent;
		color: ${colors.primary[600]};
		border: 2px solid ${colors.primary[600]};

		&:hover:not(:disabled) {
			background: ${colors.primary[50]};
			border-color: ${colors.primary[700]};
			color: ${colors.primary[700]};
		}

		&:active:not(:disabled) {
			background: ${colors.primary[100]};
		}
	`,
	ghost: css`
		background: transparent;
		color: ${colors.text.primary};
		border: none;

		&:hover:not(:disabled) {
			background: ${colors.hover};
		}

		&:active:not(:disabled) {
			background: ${colors.active};
		}
	`,
	danger: css`
		background: ${colors.error[600]};
		color: ${colors.text.inverse};
		border: none;

		&:hover:not(:disabled) {
			background: ${colors.error[700]};
			box-shadow: ${shadows.md};
		}

		&:active:not(:disabled) {
			background: ${colors.error[800]};
		}
	`,
	success: css`
		background: ${colors.success[600]};
		color: ${colors.text.inverse};
		border: none;

		&:hover:not(:disabled) {
			background: ${colors.success[700]};
			box-shadow: ${shadows.md};
		}

		&:active:not(:disabled) {
			background: ${colors.success[800]};
		}
	`,
};

const spin = keyframes`
	to {
		transform: rotate(360deg);
	}
`;

const StyledButton = styled.button<StyledButtonProps>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: ${spacing.sm};
	border-radius: ${borderRadius.md};
	font-weight: 500;
	cursor: pointer;
	transition: all ${transitions.fast};
	outline: none;
	position: relative;

	${({ $size = 'md' }) => sizeStyles[$size]}
	${({ $variant = 'primary' }) => variantStyles[$variant]}
  
  ${({ $fullWidth }) =>
		$fullWidth &&
		css`
			width: 100%;
		`}
  
  &:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&:focus-visible {
		box-shadow: 0 0 0 3px ${colors.primary[200]};
	}

	${({ $loading }) =>
		$loading &&
		css`
			color: transparent;
			pointer-events: none;

			&::after {
				content: '';
				position: absolute;
				width: 16px;
				height: 16px;
				border: 2px solid transparent;
				border-top-color: currentColor;
				border-radius: 50%;
				animation: ${spin} 0.6s linear infinite;
			}
		`}
`;

export const Button = memo(
	forwardRef<HTMLButtonElement, ButtonProps>(({ children, leftIcon, rightIcon, loading, disabled, variant, size, fullWidth, 'aria-label': ariaLabel, ...props }, ref) => {
		return (
			<StyledButton ref={ref} disabled={disabled || loading} aria-busy={loading} aria-label={ariaLabel} $variant={variant} $size={size} $fullWidth={fullWidth} $loading={loading} {...props}>
				{leftIcon && <span aria-hidden="true">{leftIcon}</span>}
				{children}
				{rightIcon && <span aria-hidden="true">{rightIcon}</span>}
			</StyledButton>
		);
	})
);

Button.displayName = 'Button';
