/**
 * Progress Bar Component
 *
 * Visual progress indicator for multi-step processes
 */
import React from 'react';
import styled from 'styled-components';
import { colors } from '../theme';
import { Icon } from '../presentation/atoms';

interface ProgressBarProps {
	current: number;
	total: number;
	label?: string;
	showPercentage?: boolean;
	variant?: 'default' | 'success' | 'warning' | 'danger';
	size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label, showPercentage = false, variant = 'default', size = 'md' }) => {
	const percentage = Math.min(100, Math.max(0, (current / total) * 100));

	return (
		<Container>
			{(label || showPercentage) && (
				<Header>
					{label && <Label>{label}</Label>}
					{showPercentage && <Percentage>{Math.round(percentage)}%</Percentage>}
				</Header>
			)}
			<Track $size={size}>
				<Fill $percentage={percentage} $variant={variant} role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total} aria-label={label || `Progress: ${current} of ${total}`} />
			</Track>
		</Container>
	);
};

// Step Progress Indicator
export interface Step {
	id: string;
	label: string;
	description?: string;
}

interface StepProgressProps {
	steps: Step[];
	currentStep: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({ steps, currentStep }) => {
	return (
		<StepsContainer role="list" aria-label="Progress steps">
			{steps.map((step, index) => {
				const status = index < currentStep ? 'completed' : index === currentStep ? 'current' : 'upcoming';

				return (
					<StepItem key={step.id} role="listitem">
						<StepIndicator $status={status}>{status === 'completed' ? <Icon name="check" size="xs" /> : index + 1}</StepIndicator>
						<StepContent>
							<StepLabel $status={status}>{step.label}</StepLabel>
							{step.description && <StepDescription>{step.description}</StepDescription>}
						</StepContent>
						{index < steps.length - 1 && <StepConnector $completed={index < currentStep} />}
					</StepItem>
				);
			})}
		</StepsContainer>
	);
};

// Circular Progress
interface CircularProgressProps {
	percentage: number;
	size?: number;
	strokeWidth?: number;
	color?: string;
	label?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ percentage, size = 120, strokeWidth = 8, color = colors.primary[500], label }) => {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (percentage / 100) * circumference;

	return (
		<CircularContainer style={{ width: size, height: size }}>
			<svg width={size} height={size}>
				<circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.neutral[200]} strokeWidth={strokeWidth} fill="none" />
				<circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
			</svg>
			<CircularLabel>{label || `${Math.round(percentage)}%`}</CircularLabel>
		</CircularContainer>
	);
};

// Styled Components
const Container = styled.div`
	width: 100%;
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
`;

const Label = styled.span`
	font-size: 14px;
	font-weight: 500;
	color: ${colors.neutral[700]};
`;

const Percentage = styled.span`
	font-size: 14px;
	font-weight: 600;
	color: ${colors.neutral[900]};
`;

const Track = styled.div<{ $size: 'sm' | 'md' | 'lg' }>`
	width: 100%;
	height: ${(props) => {
		switch (props.$size) {
			case 'sm':
				return '4px';
			case 'md':
				return '8px';
			case 'lg':
				return '12px';
			default:
				return '8px';
		}
	}};
	background: ${colors.neutral[200]};
	border-radius: 999px;
	overflow: hidden;
`;

const Fill = styled.div<{ $percentage: number; $variant: string }>`
	height: 100%;
	width: ${(props) => props.$percentage}%;
	background: ${(props) => {
		switch (props.$variant) {
			case 'success':
				return colors.primary[500];
			case 'warning':
				return colors.primary[500];
			case 'danger':
				return colors.error[500];
			default:
				return colors.primary[500];
		}
	}};
	border-radius: 999px;
	transition: width 0.3s ease, background 0.2s ease;
`;

const StepsContainer = styled.ol`
	display: flex;
	flex-direction: column;
	gap: 24px;
	list-style: none;
	padding: 0;
	margin: 0;
`;

const StepItem = styled.li`
	display: flex;
	align-items: flex-start;
	gap: 16px;
	position: relative;
`;

const StepIndicator = styled.div<{ $status: 'completed' | 'current' | 'upcoming' }>`
	width: 40px;
	height: 40px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 16px;
	flex-shrink: 0;

	${(props) => {
		switch (props.$status) {
			case 'completed':
				return `
          background: ${colors.primary[500]};
          color: white;
        `;
			case 'current':
				return `
          background: ${colors.primary[500]};
          color: white;
          box-shadow: 0 0 0 4px ${colors.primary[100]};
        `;
			case 'upcoming':
				return `
          background: ${colors.neutral[200]};
          color: ${colors.neutral[500]};
        `;
		}
	}}
`;

const StepContent = styled.div`
	flex: 1;
	padding-top: 8px;
`;

const StepLabel = styled.div<{ $status: 'completed' | 'current' | 'upcoming' }>`
	font-size: 16px;
	font-weight: ${(props) => (props.$status === 'current' ? 600 : 500)};
	color: ${(props) => (props.$status === 'upcoming' ? colors.neutral[500] : colors.neutral[900])};
	margin-bottom: 4px;
`;

const StepDescription = styled.div`
	font-size: 14px;
	color: ${colors.neutral[600]};
	line-height: 1.5;
`;

const StepConnector = styled.div<{ $completed: boolean }>`
	position: absolute;
	left: 20px;
	top: 40px;
	width: 2px;
	height: calc(100% + 24px);
	background: ${(props) => (props.$completed ? colors.primary[500] : colors.neutral[200])};
`;

const CircularContainer = styled.div`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
`;

const CircularLabel = styled.div`
	position: absolute;
	font-size: 20px;
	font-weight: 600;
	color: ${colors.neutral[900]};
`;
