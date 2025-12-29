/**
 * Toast Notification System
 *
 * Provides user feedback for actions with different severity levels
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiX, FiCheck, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import { colors } from '../theme';

// Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}

interface ToastContextValue {
	showToast: (message: string, type?: ToastType, duration?: number) => void;
	success: (message: string, duration?: number) => void;
	error: (message: string, duration?: number) => void;
	warning: (message: string, duration?: number) => void;
	info: (message: string, duration?: number) => void;
}

// Context
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within ToastProvider');
	}
	return context;
};

// Provider
interface ToastProviderProps {
	children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const showToast = useCallback(
		(message: string, type: ToastType = 'info', duration: number = 5000) => {
			const id = `toast-${Date.now()}-${Math.random()}`;
			const toast: Toast = { id, type, message, duration };

			setToasts((prev) => [...prev, toast]);

			if (duration > 0) {
				setTimeout(() => removeToast(id), duration);
			}
		},
		[removeToast]
	);

	const success = useCallback(
		(message: string, duration?: number) => {
			showToast(message, 'success', duration);
		},
		[showToast]
	);

	const error = useCallback(
		(message: string, duration?: number) => {
			showToast(message, 'error', duration);
		},
		[showToast]
	);

	const warning = useCallback(
		(message: string, duration?: number) => {
			showToast(message, 'warning', duration);
		},
		[showToast]
	);

	const info = useCallback(
		(message: string, duration?: number) => {
			showToast(message, 'info', duration);
		},
		[showToast]
	);

	return (
		<ToastContext.Provider value={{ showToast, success, error, warning, info }}>
			{children}
			<ToastContainer>
				{toasts.map((toast) => (
					<ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
				))}
			</ToastContainer>
		</ToastContext.Provider>
	);
};

// Toast Item Component
interface ToastItemProps {
	toast: Toast;
	onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
	const getIcon = () => {
		switch (toast.type) {
			case 'success':
				return <FiCheck />;
			case 'error':
				return <FiAlertCircle />;
			case 'warning':
				return <FiAlertTriangle />;
			case 'info':
				return <FiInfo />;
			default:
				return <FiInfo />;
		}
	};

	return (
		<StyledToast $type={toast.type} role="alert" aria-live="polite">
			<ToastIcon $type={toast.type}>{getIcon()}</ToastIcon>
			<ToastMessage>{toast.message}</ToastMessage>
			<CloseButton onClick={onClose} aria-label="Close notification" type="button">
				<FiX />
			</CloseButton>
		</StyledToast>
	);
};

// Animations
const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

// Styled Components
const ToastContainer = styled.div`
	position: fixed;
	top: 20px;
	right: 20px;
	z-index: 9999;
	display: flex;
	flex-direction: column;
	gap: 12px;
	pointer-events: none;
	max-width: 400px;
	width: 100%;

	@media (max-width: 768px) {
		top: 10px;
		right: 10px;
		left: 10px;
		max-width: none;
	}
`;

const StyledToast = styled.div<{ $type: ToastType }>`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 16px;
	background: white;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	border-left: 4px solid
		${(props) => {
			switch (props.$type) {
				case 'success':
					return colors.primary[500];
				case 'error':
					return colors.error[500];
				case 'warning':
					return colors.primary[500];
				case 'info':
					return colors.primary[500];
				default:
					return colors.neutral[500];
			}
		}};
	animation: ${slideIn} 0.3s ease-out;
	pointer-events: auto;
	min-width: 300px;

	@media (max-width: 768px) {
		min-width: unset;
		width: 100%;
	}
`;

const ToastIcon = styled.div<{ $type: ToastType }>`
	flex-shrink: 0;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${(props) => {
		switch (props.$type) {
			case 'success':
				return colors.primary[500];
			case 'error':
				return colors.error[500];
			case 'warning':
				return colors.primary[500];
			case 'info':
				return colors.primary[500];
			default:
				return colors.neutral[500];
		}
	}};

	svg {
		width: 100%;
		height: 100%;
	}
`;

const ToastMessage = styled.p`
	flex: 1;
	margin: 0;
	color: ${colors.neutral[900]};
	font-size: 14px;
	line-height: 1.5;
`;

const CloseButton = styled.button`
	flex-shrink: 0;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: none;
	border: none;
	cursor: pointer;
	color: ${colors.neutral[500]};
	border-radius: 4px;
	transition: all 0.2s;
	padding: 0;

	&:hover {
		background: ${colors.neutral[100]};
		color: ${colors.neutral[700]};
	}

	&:focus-visible {
		outline: 2px solid ${colors.primary[500]};
		outline-offset: 2px;
	}

	svg {
		width: 18px;
		height: 18px;
	}
`;
