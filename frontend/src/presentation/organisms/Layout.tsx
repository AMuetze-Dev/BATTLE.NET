/**
 * Main layout component
 */
import React from 'react';
import styled from 'styled-components';
import { colors, spacing } from '../../theme';

export interface LayoutProps {
	children: React.ReactNode;
	header?: React.ReactNode;
	footer?: React.ReactNode;
}

const LayoutContainer = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background: var(--color-bg, #fafafa);
`;

const Header = styled.header`
	background: var(--color-surface, #fff);
	border-bottom: 1px solid var(--color-border, #e4e4e7);
	padding: ${spacing.lg} ${spacing.xl};
	position: sticky;
	top: 0;
	z-index: 100;
`;

const Main = styled.main`
	flex: 1;
	padding: ${spacing.xl};
	max-width: 1400px;
	width: 100%;
	margin: 0 auto;
`;

const Footer = styled.footer`
	background: var(--color-surface, #fff);
	border-top: 1px solid var(--color-border, #e4e4e7);
	padding: ${spacing.lg} ${spacing.xl};
	text-align: center;
	color: var(--color-text-secondary, #52525b);
	font-size: 14px;
`;

export const Layout: React.FC<LayoutProps> = ({ children, header, footer }) => {
	return (
		<LayoutContainer>
			{header && <Header>{header}</Header>}
			<Main>{children}</Main>
			{footer && <Footer>{footer}</Footer>}
		</LayoutContainer>
	);
};
