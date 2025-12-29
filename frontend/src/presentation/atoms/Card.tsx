/**
 * Card component - Container for content sections
 */
import React from 'react';
import styled, { css } from 'styled-components';
import { colors, borderRadius, shadows, spacing } from '../../theme';

export interface CardProps {
	children: React.ReactNode;
	variant?: 'default' | 'outlined' | 'elevated';
	padding?: 'none' | 'sm' | 'md' | 'lg';
	hoverable?: boolean;
	clickable?: boolean;
	onClick?: () => void;
	className?: string;
}

// Transient props for styled-components
interface StyledCardProps {
	$variant?: CardProps['variant'];
	$padding?: CardProps['padding'];
	$hoverable?: boolean;
	$clickable?: boolean;
}

const paddingStyles = {
	none: css`
		padding: 0;
	`,
	sm: css`
		padding: ${spacing.md};
	`,
	md: css`
		padding: ${spacing.lg};
	`,
	lg: css`
		padding: ${spacing.xl};
	`,
};

const variantStyles = {
	default: css`
		background: ${colors.surface};
		border: none;
	`,
	outlined: css`
		background: ${colors.background};
		border: 1px solid ${colors.border.medium};
	`,
	elevated: css`
		background: ${colors.background};
		border: none;
		box-shadow: ${shadows.md};
	`,
};

const StyledCard = styled.div<StyledCardProps>`
	border-radius: ${borderRadius.lg};
	overflow: hidden;

	${({ $padding = 'md' }) => paddingStyles[$padding]}
	${({ $variant = 'default' }) => variantStyles[$variant]}
  
  ${({ $hoverable, $clickable }) =>
		($hoverable || $clickable) &&
		css`
			transition: all 0.2s ease;

			&:hover {
				box-shadow: ${shadows.lg};
				transform: translateY(-2px);
			}
		`}
  
  ${({ $clickable }) =>
		$clickable &&
		css`
			cursor: pointer;

			&:active {
				transform: translateY(0);
				box-shadow: ${shadows.md};
			}
		`}
`;

export const Card: React.FC<CardProps> = ({ children, onClick, variant, padding, hoverable, clickable, className, ...props }) => {
	return (
		<StyledCard onClick={onClick} $variant={variant} $padding={padding} $hoverable={hoverable} $clickable={clickable} className={className} {...props}>
			{children}
		</StyledCard>
	);
};
