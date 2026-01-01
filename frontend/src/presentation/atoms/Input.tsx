/**
 * Input Component - Battle.Net Quiz Platform
 *
 * Accessible text input field with validation support.
 * Uses centralized CSS classes from components.css.
 */
import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	/** Input label */
	label?: string;
	/** Error message */
	error?: string;
	/** Helper text shown below input */
	helperText?: string;
	/** Full width mode */
	fullWidth?: boolean;
	/** Icon on the left */
	leftIcon?: React.ReactNode;
	/** Icon on the right */
	rightIcon?: React.ReactNode;
}

/**
 * Input - Accessible text input with label and validation
 */
export const Input: React.FC<InputProps> = ({ label, error, helperText, fullWidth, leftIcon, rightIcon, id, className = '', ...props }) => {
	const generatedId = useId();
	const inputId = id || generatedId;

	const containerStyle: React.CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		gap: 'var(--spacing-1)',
		width: fullWidth ? '100%' : 'auto',
	};

	const wrapperClasses = ['input-group', error && 'input-error'].filter(Boolean).join(' ');

	return (
		<div style={containerStyle}>
			{label && (
				<label htmlFor={inputId} className="input-label">
					{label}
				</label>
			)}
			<div className={wrapperClasses}>
				{leftIcon && <span className="input-icon">{leftIcon}</span>}
				<input id={inputId} className={`input ${className}`} aria-invalid={!!error} aria-describedby={error || helperText ? `${inputId}-helper` : undefined} {...props} />
				{rightIcon && <span className="input-icon">{rightIcon}</span>}
			</div>
			{(error || helperText) && (
				<span id={`${inputId}-helper`} className={`input-helper ${error ? 'input-helper-error' : ''}`}>
					{error || helperText}
				</span>
			)}
		</div>
	);
};
