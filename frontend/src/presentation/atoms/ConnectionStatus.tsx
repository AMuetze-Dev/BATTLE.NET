/**
 * Connection Status Component
 * Unified component for displaying connection/disconnection status
 * Blue for connected, Red for disconnected (exceptions only)
 */
import React from 'react';
import styled from 'styled-components';
import { colors, spacing, typography } from '../../theme';

interface ConnectionStatusProps {
	connected: boolean;
	className?: string;
}

const StatusContainer = styled.div<{ $connected: boolean }>`
	display: flex;
	align-items: center;
	gap: ${spacing.sm};
	padding: ${spacing.sm} ${spacing.md};
	border-radius: 20px;
	background: ${({ $connected }) => ($connected ? colors.primary[50] : colors.error[50])};
	color: ${({ $connected }) => ($connected ? colors.primary[700] : colors.error[700])};
	font-size: ${typography.fontSize.sm};
	font-weight: ${typography.fontWeight.medium};
	transition: all 0.2s ease;
`;

const StatusDot = styled.span<{ $connected: boolean }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${({ $connected }) => ($connected ? colors.primary[500] : colors.error[500])};
	animation: ${({ $connected }) => ($connected ? 'none' : 'pulse 2s infinite')};

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
`;

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ connected, className }) => {
	return (
		<StatusContainer $connected={connected} className={className}>
			<StatusDot $connected={connected} />
			{connected ? 'Verbunden' : 'Getrennt'}
		</StatusContainer>
	);
};
