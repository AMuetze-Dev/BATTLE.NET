/**
 * Modal Component - Battle.Net Quiz Platform
 *
 * Accessible overlay dialog with focus trap.
 * Uses centralized CSS classes from components.css.
 */
import React, { useEffect } from 'react';
import { Icon } from './Icon';

export interface ModalProps {
	/** Whether the modal is open */
	isOpen: boolean;
	/** Callback to close the modal */
	onClose: () => void;
	/** Modal title */
	title?: string;
	/** Modal content */
	children: React.ReactNode;
	/** Modal size */
	size?: 'sm' | 'md' | 'lg' | 'xl';
	/** Custom max width */
	maxWidth?: string;
	/** Close on overlay click */
	closeOnOverlayClick?: boolean;
	/** Show close button */
	showCloseButton?: boolean;
}

const sizeMap: Record<string, string> = {
	sm: '400px',
	md: '600px',
	lg: '800px',
	xl: '1200px',
};

/**
 * Modal - Accessible overlay dialog
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', maxWidth, closeOnOverlayClick = true, showCloseButton = true }) => {
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEscape);

		// Prevent body scroll when modal is open
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = 'unset';
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const contentStyle: React.CSSProperties = {
		maxWidth: maxWidth || sizeMap[size] || sizeMap.md,
	};

	return (
		<div className="modal-overlay" onClick={() => closeOnOverlayClick && onClose()} role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}>
			<div className="modal-content" style={contentStyle} onClick={(e) => e.stopPropagation()}>
				{(title || showCloseButton) && (
					<div className="modal-header">
						{title && (
							<h2 id="modal-title" className="modal-title">
								{title}
							</h2>
						)}
						{showCloseButton && (
							<button className="modal-close" onClick={onClose} aria-label="Close">
								<Icon name="x" size="md" />
							</button>
						)}
					</div>
				)}
				<div className="modal-body">{children}</div>
			</div>
		</div>
	);
};
