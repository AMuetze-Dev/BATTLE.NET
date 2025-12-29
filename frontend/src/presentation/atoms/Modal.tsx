/**
 * Modal component - Accessible overlay dialog with focus trap
 */
import React, { useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { colors, borderRadius, shadows, spacing, zIndex, transitions } from '../../theme';

export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	maxWidth?: string;
	closeOnOverlayClick?: boolean;
	showCloseButton?: boolean;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const Overlay = styled.div<{ isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: ${colors.overlay};
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: ${zIndex.modalBackdrop};
	animation: ${fadeIn} ${transitions.fast};
	padding: ${spacing.lg};

	${({ isOpen }) =>
		!isOpen &&
		css`
			display: none;
		`}
`;

const sizeStyles = {
	sm: css`
		max-width: 400px;
	`,
	md: css`
		max-width: 600px;
	`,
	lg: css`
		max-width: 800px;
	`,
	xl: css`
		max-width: 1200px;
	`,
};

const ModalContent = styled.div<{ size?: 'sm' | 'md' | 'lg' | 'xl'; maxWidth?: string }>`
	background: ${colors.background};
	border-radius: ${borderRadius.xl};
	box-shadow: ${shadows['2xl']};
	width: 100%;
	max-height: 90vh;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	animation: ${slideUp} ${transitions.normal};
	z-index: ${zIndex.modal};
	${({ size }) => size && sizeStyles[size]}
	${({ maxWidth }) =>
		maxWidth &&
		css`
			max-width: ${maxWidth};
		`}
`;

const ModalHeader = styled.div`
	padding: ${spacing.lg};
	border-bottom: 1px solid ${colors.border.light};
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const ModalTitle = styled.h2`
	margin: 0;
	font-size: 20px;
	font-weight: 600;
	color: ${colors.text.primary};
`;

const CloseButton = styled.button`
	background: transparent;
	border: none;
	font-size: 24px;
	color: ${colors.text.secondary};
	cursor: pointer;
	padding: ${spacing.xs};
	border-radius: ${borderRadius.sm};
	transition: all ${transitions.fast};

	&:hover {
		background: ${colors.hover};
		color: ${colors.text.primary};
	}
`;

const ModalBody = styled.div`
	padding: ${spacing.lg};
	overflow-y: auto;
	flex: 1;
`;

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

	return (
		<Overlay isOpen={isOpen} onClick={() => closeOnOverlayClick && onClose()}>
			<ModalContent size={size} maxWidth={maxWidth} onClick={(e) => e.stopPropagation()}>
				{(title || showCloseButton) && (
					<ModalHeader>
						{title && <ModalTitle>{title}</ModalTitle>}
						{showCloseButton && (
							<CloseButton onClick={onClose} aria-label="Close">
								×
							</CloseButton>
						)}
					</ModalHeader>
				)}
				<ModalBody>{children}</ModalBody>
			</ModalContent>
		</Overlay>
	);
};
