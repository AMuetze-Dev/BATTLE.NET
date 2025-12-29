/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';
import { colors, spacing, typography } from '../theme';
import { Button } from '../presentation/atoms';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

const ErrorContainer = styled.div`
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: ${spacing.xl};
	background: ${colors.background};
`;

const ErrorCard = styled.div`
	max-width: 600px;
	width: 100%;
	padding: ${spacing['2xl']};
	background: ${colors.surface};
	border-radius: 12px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	text-align: center;
`;

const ErrorIcon = styled.div`
	font-size: 64px;
	margin-bottom: ${spacing.lg};
`;

const ErrorTitle = styled.h1`
	font-size: ${typography.fontSize['2xl']};
	font-weight: ${typography.fontWeight.bold};
	color: ${colors.error[600]};
	margin-bottom: ${spacing.md};
`;

const ErrorMessage = styled.p`
	color: ${colors.text.secondary};
	margin-bottom: ${spacing.xl};
	line-height: 1.6;
`;

const ErrorDetails = styled.details`
	margin-top: ${spacing.lg};
	text-align: left;
	padding: ${spacing.md};
	background: ${colors.neutral[100]};
	border-radius: 8px;
	font-family: ${typography.fontFamily.mono};
	font-size: ${typography.fontSize.sm};
	color: ${colors.text.secondary};
	cursor: pointer;

	summary {
		font-weight: ${typography.fontWeight.semibold};
		margin-bottom: ${spacing.sm};
	}

	pre {
		margin-top: ${spacing.sm};
		white-space: pre-wrap;
		word-break: break-word;
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: ${spacing.md};
	justify-content: center;
	margin-top: ${spacing.xl};
`;

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<State> {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		// Log error to console in development
		if (process.env.NODE_ENV === 'development') {
			console.error('ErrorBoundary caught an error:', error, errorInfo);
		}

		// In production, you could send this to an error reporting service
		// Example: logErrorToService(error, errorInfo);

		this.setState({
			error,
			errorInfo,
		});
	}

	handleReset = (): void => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	handleReload = (): void => {
		window.location.reload();
	};

	render(): ReactNode {
		const { hasError, error, errorInfo } = this.state;
		const { children, fallback } = this.props;

		if (hasError) {
			if (fallback) {
				return fallback;
			}

			return (
				<ErrorContainer>
					<ErrorCard>
						<ErrorIcon>⚠️</ErrorIcon>
						<ErrorTitle>Oops! Something went wrong</ErrorTitle>
						<ErrorMessage>We're sorry for the inconvenience. The application encountered an unexpected error. Please try reloading the page or contact support if the problem persists.</ErrorMessage>

						<ButtonGroup>
							<Button variant="primary" onClick={this.handleReload}>
								Reload Page
							</Button>
							<Button variant="outline" onClick={this.handleReset}>
								Try Again
							</Button>
						</ButtonGroup>

						{process.env.NODE_ENV === 'development' && error && (
							<ErrorDetails>
								<summary>Error Details (Development Only)</summary>
								<pre>
									<strong>Error:</strong> {error.toString()}
									{'\n\n'}
									<strong>Stack Trace:</strong>
									{'\n'}
									{errorInfo?.componentStack}
								</pre>
							</ErrorDetails>
						)}
					</ErrorCard>
				</ErrorContainer>
			);
		}

		return children;
	}
}
