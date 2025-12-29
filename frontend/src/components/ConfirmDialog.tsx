/**
 * Confirmation Dialog Component
 *
 * Reusable confirmation modal for destructive actions
 */
import React from 'react';
import styled from 'styled-components';
import { Modal } from '../presentation/atoms/Modal';
import { Button } from '../presentation/atoms/Button';
import { colors } from '../theme';
import { FiAlertTriangle } from 'react-icons/fi';

interface ConfirmDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: 'danger' | 'warning' | 'info';
	isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger', isLoading = false }) => {
	const getIconColor = () => {
		switch (variant) {
			case 'danger':
				return colors.error[500];
			case 'warning':
				return colors.primary[500];
			case 'info':
				return colors.primary[500];
			default:
				return colors.error[500];
		}
	};

	const getConfirmVariant = () => {
		switch (variant) {
			case 'danger':
				return 'danger';
			case 'warning':
				return 'secondary';
			case 'info':
				return 'primary';
			default:
				return 'danger';
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="450px">
			<Content>
				<IconWrapper $color={getIconColor()}>
					<FiAlertTriangle size={48} />
				</IconWrapper>
				<Message>{message}</Message>
				<Actions>
					<Button variant="outline" onClick={onClose} disabled={isLoading} fullWidth>
						{cancelText}
					</Button>
					<Button variant={getConfirmVariant() as any} onClick={onConfirm} loading={isLoading} fullWidth>
						{confirmText}
					</Button>
				</Actions>
			</Content>
		</Modal>
	);
};

const Content = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 24px;
	padding: 8px 0;
`;

const IconWrapper = styled.div<{ $color: string }>`
	width: 80px;
	height: 80px;
	border-radius: 50%;
	background: ${(props) => props.$color}15;
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${(props) => props.$color};
`;

const Message = styled.p`
	margin: 0;
	text-align: center;
	font-size: 16px;
	line-height: 1.6;
	color: ${colors.neutral[700]};
`;

const Actions = styled.div`
	display: flex;
	gap: 12px;
	width: 100%;
`;
