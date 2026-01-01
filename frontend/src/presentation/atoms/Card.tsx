/**
 * Card Component - Battle.Net Quiz Platform
 *
 * Container for content sections.
 * Uses centralized CSS classes from components.css.
 */
import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Card content */
	children: React.ReactNode;
	/** Visual variant */
	variant?: 'default' | 'outlined' | 'elevated';
	/** Padding size */
	padding?: 'none' | 'sm' | 'md' | 'lg';
	/** Hover effect */
	hoverable?: boolean;
	/** Clickable with pointer cursor */
	clickable?: boolean;
}

const paddingMap: Record<string, string> = {
	none: '',
	sm: 'var(--spacing-2)',
	md: 'var(--spacing-4)',
	lg: 'var(--spacing-6)',
};

/**
 * Card - Container component for sections
 */
export const Card: React.FC<CardProps> = ({ children, variant = 'default', padding = 'md', hoverable = false, clickable = false, className = '', style, ...props }) => {
	const classes = ['card', variant === 'elevated' && 'card-elevated', (hoverable || clickable) && 'card-interactive', className].filter(Boolean).join(' ');

	const combinedStyle: React.CSSProperties = {
		padding: paddingMap[padding] || paddingMap.md,
		cursor: clickable ? 'pointer' : undefined,
		...style,
	};

	return (
		<div className={classes} style={combinedStyle} {...props}>
			{children}
		</div>
	);
};
