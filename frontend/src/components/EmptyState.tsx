/**
 * Empty State Component
 *
 * Display when no content is available
 */
import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { Button } from '../presentation/atoms/Button';
import { colors } from '../theme';

interface EmptyStateProps {
	icon?: ReactNode;
	title: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
	illustration?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actionLabel, onAction, illustration }) => {
	return (
		<Container>
			{illustration ? <Illustration src={illustration} alt="" /> : icon ? <IconWrapper>{icon}</IconWrapper> : null}

			<Title>{title}</Title>

			{description && <Description>{description}</Description>}

			{actionLabel && onAction && (
				<Button onClick={onAction} variant="primary">
					{actionLabel}
				</Button>
			)}
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 64px 24px;
	text-align: center;
	min-height: 400px;
`;

const IconWrapper = styled.div`
	font-size: 64px;
	color: ${colors.neutral[400]};
	margin-bottom: 24px;

	svg {
		width: 64px;
		height: 64px;
	}
`;

const Illustration = styled.img`
	width: 200px;
	height: 200px;
	object-fit: contain;
	margin-bottom: 24px;
	opacity: 0.7;
`;

const Title = styled.h2`
	margin: 0 0 12px 0;
	font-size: 24px;
	font-weight: 600;
	color: ${colors.neutral[900]};
`;

const Description = styled.p`
	margin: 0 0 24px 0;
	font-size: 16px;
	line-height: 1.6;
	color: ${colors.neutral[600]};
	max-width: 500px;
`;
