/**
 * TrueFalseInput - Atomic component for true/false answer selection
 */
import React from 'react';
import styled from 'styled-components';
import { Trans } from '@lingui/react/macro';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Icon } from './Icon';

export interface TrueFalseInputProps {
	value: string;
	onChange: (value: string) => void;
	locked?: boolean;
}

const Container = styled.div`
	display: flex;
	gap: ${spacing.lg};
	width: 100%;
	max-width: 500px;

	@media (max-width: 480px) {
		gap: ${spacing.sm};
	}
`;

const OptionButton = styled.button<{ $selected: boolean; $isTrue: boolean; $locked: boolean }>`
	flex: 1;
	padding: ${spacing.lg} ${spacing.xl};
	font-size: ${typography.fontSize.xl};
	font-weight: ${typography.fontWeight.bold};
	border: 3px solid ${({ $selected, $isTrue, $locked }) => ($locked ? colors.neutral[300] : $selected ? ($isTrue ? colors.success[600] : colors.error[600]) : colors.border.light)};
	border-radius: ${borderRadius.lg};
	background: ${({ $selected, $isTrue, $locked }) => ($locked ? colors.neutral[100] : $selected ? ($isTrue ? colors.success[100] : colors.error[100]) : colors.surface)};
	color: ${({ $selected, $isTrue, $locked }) => ($locked ? colors.text.secondary : $selected ? ($isTrue ? colors.success[700] : colors.error[700]) : colors.text.primary)};
	cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: ${spacing.sm};
	touch-action: manipulation;
	-webkit-tap-highlight-color: transparent;

	&:hover:not(:disabled) {
		background: ${({ $isTrue, $locked }) => ($locked ? colors.neutral[100] : $isTrue ? colors.success[50] : colors.error[50])};
		border-color: ${({ $isTrue, $locked }) => ($locked ? colors.neutral[300] : $isTrue ? colors.success[400] : colors.error[400])};
	}

	&:active:not(:disabled) {
		transform: scale(0.98);
	}

	@media (max-width: 480px) {
		padding: ${spacing.md};
		font-size: ${typography.fontSize.lg};
		border-width: 2px;
		min-height: 60px;
	}
`;

export const TrueFalseInput: React.FC<TrueFalseInputProps> = ({ value, onChange, locked = false }) => {
	return (
		<Container>
			<OptionButton type="button" $selected={value === 'true'} $isTrue={true} $locked={locked} disabled={locked} onClick={() => onChange('true')} aria-pressed={value === 'true'}>
				<Icon name="check" size="lg" />
				<Trans id="input.trueOption">Wahr</Trans>
			</OptionButton>
			<OptionButton type="button" $selected={value === 'false'} $isTrue={false} $locked={locked} disabled={locked} onClick={() => onChange('false')} aria-pressed={value === 'false'}>
				<Icon name="x" size="lg" />
				<Trans id="input.falseOption">Falsch</Trans>
			</OptionButton>
		</Container>
	);
};
