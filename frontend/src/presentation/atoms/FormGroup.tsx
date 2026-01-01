/**
 * FormGroup Atom - Reusable form group with label
 */
import React from 'react';
import styles from './FormGroup.module.css';

export interface FormGroupProps {
	label?: string;
	children: React.ReactNode;
	className?: string;
	required?: boolean;
}

export const FormGroup: React.FC<FormGroupProps> = ({ label, children, className, required }) => {
	return (
		<div className={`${styles.formGroup} ${className || ''}`}>
			{label && (
				<label className={styles.label}>
					{label}
					{required && <span className={styles.required}>*</span>}
				</label>
			)}
			{children}
		</div>
	);
};
