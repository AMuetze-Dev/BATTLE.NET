/**
 * IconButton Atom - Reusable icon button component
 */
import React from 'react';
import styles from './IconButton.module.css';

export interface IconButtonProps {
	icon: React.ReactNode;
	onClick?: () => void;
	variant?: 'default' | 'primary' | 'danger' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
	disabled?: boolean;
	title?: string;
	className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, variant = 'default', size = 'md', disabled = false, title, className }) => {
	return (
		<button className={`${styles.iconButton} ${styles[variant]} ${styles[size]} ${className || ''}`} onClick={onClick} disabled={disabled} title={title} type="button">
			{icon}
		</button>
	);
};
