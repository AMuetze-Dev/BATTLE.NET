/**
 * BuzzerButton - Atomic component for buzzer interaction
 */
import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { Trans } from '@lingui/react/macro';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface BuzzerButtonProps {
	onPress: () => void;
	locked?: boolean;
	pressed?: boolean;
}

const pulse = keyframes`
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.02); }
`;

const StyledButton = styled.button<{ $pressed: boolean; $locked: boolean }>`
	width: 100%;
	max-width: 500px;
	height: 80px;
	border-radius: ${borderRadius.lg};
	border: 3px solid ${({ $pressed, $locked }) => ($locked ? colors.neutral[400] : $pressed ? colors.primary[700] : colors.primary[500])};
	font-size: ${typography.fontSize['2xl']};
	font-weight: ${typography.fontWeight.bold};
	color: white;
	cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
	transition: all 0.15s ease;
	background: ${({ $pressed, $locked }) => ($locked ? colors.neutral[400] : $pressed ? colors.primary[700] : `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`)};
	box-shadow: ${({ $locked }) => ($locked ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)')};
	display: flex;
	align-items: center;
	justify-content: center;
	gap: ${spacing.sm};
	touch-action: manipulation;
	-webkit-tap-highlight-color: transparent;

	&:hover:not(:disabled) {
		background: ${({ $locked }) => ($locked ? colors.neutral[400] : `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)`)};
		box-shadow: ${({ $locked }) => ($locked ? 'none' : '0 6px 16px rgba(0, 0, 0, 0.2)')};
	}

	&:active:not(:disabled) {
		transform: translateY(2px);
		box-shadow: ${({ $locked }) => ($locked ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.15)')};
	}

	@media (max-width: 480px) {
		height: 70px;
		font-size: ${typography.fontSize.xl};
		border-width: 2px;
	}

	${({ $pressed }) =>
		$pressed &&
		css`
			animation: ${pulse} 1s ease-in-out infinite;
		`}
`;

const Icon = styled.span`
	font-size: ${typography.fontSize['2xl']};
`;

export const BuzzerButton: React.FC<BuzzerButtonProps> = ({ onPress, locked = false, pressed = false }) => {
	return (
		<StyledButton type="button" onClick={onPress} disabled={locked} $pressed={pressed} $locked={locked} aria-label="Buzzer">
			<Icon>🔔</Icon>
			<Trans id="input.buzzer">BUZZER</Trans>
		</StyledButton>
	);
};
