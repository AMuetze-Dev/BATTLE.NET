import React, { ReactNode } from 'react';
import styles from './ActionCard.module.css';

export interface ActionCardProps {
	title: React.ReactNode;
	icon?: ReactNode;
	onClick?: () => void;
	children?: ReactNode;
	className?: string;
	disabled?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({ title, icon, onClick, children, className = '', disabled = false }) => (
	<div className={[styles.actionCard, className, disabled ? styles.disabled : '', onClick ? styles.clickable : ''].join(' ')} onClick={disabled ? undefined : onClick} tabIndex={onClick && !disabled ? 0 : undefined} role={onClick && !disabled ? 'button' : undefined} aria-disabled={disabled}>
		{icon && <div className={styles.icon}>{icon}</div>}
		<div className={styles.content}>
			<div className={styles.title}>{title}</div>
			{children && <div className={styles.children}>{children}</div>}
		</div>
	</div>
);

export default ActionCard;
