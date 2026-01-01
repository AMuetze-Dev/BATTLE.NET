/**
 * Button Component - Battle.Net Quiz Platform
 *
 * Uses centralized CSS classes from components.css
 * Ensures consistent styling across the entire application.
 */
import React, { memo, forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	/** Visual style variant */
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
	/** Button size */
	size?: 'xs' | 'sm' | 'md' | 'lg';
	/** Full width button */
	fullWidth?: boolean;
	/** Loading state */
	loading?: boolean;
	/** Icon to show on the left */
	leftIcon?: React.ReactNode;
	/** Icon to show on the right */
	rightIcon?: React.ReactNode;
	/** Accessibility label */
	'aria-label'?: string;
}

/**
 * Button - Primary interactive element
 *
 * Uses CSS classes from components.css for consistent styling.
 * Supports all standard button variants and sizes.
 */
export const Button = memo(
	forwardRef<HTMLButtonElement, ButtonProps>(({ children, variant = 'primary', size = 'md', fullWidth = false, loading = false, leftIcon, rightIcon, disabled, className = '', 'aria-label': ariaLabel, ...props }, ref) => {
		// Build CSS class string from props
		const classes = ['btn', `btn-${size}`, `btn-${variant}`, fullWidth && 'btn-full-width', loading && 'btn-loading', className].filter(Boolean).join(' ');

		return (
			<button ref={ref} type="button" className={classes} disabled={disabled || loading} aria-busy={loading} aria-label={ariaLabel} {...props}>
				{leftIcon && <span aria-hidden="true">{leftIcon}</span>}
				{children}
				{rightIcon && <span aria-hidden="true">{rightIcon}</span>}
			</button>
		);
	})
);

Button.displayName = 'Button';
