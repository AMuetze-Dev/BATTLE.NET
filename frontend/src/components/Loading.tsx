/**
 * Loading Spinner Component
 *
 * Reusable loading indicator with different sizes and variants
 */
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { colors } from '../theme';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'white' | 'neutral';

interface SpinnerProps {
	size?: SpinnerSize;
	variant?: SpinnerVariant;
	label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', variant = 'primary', label = 'Loading...' }) => {
	return (
		<SpinnerWrapper role="status" aria-label={label}>
			<StyledSpinner $size={size} $variant={variant} />
			<VisuallyHidden>{label}</VisuallyHidden>
		</SpinnerWrapper>
	);
};

// Full page loading overlay
interface LoadingOverlayProps {
	message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Loading...' }) => {
	return (
		<Overlay>
			<OverlayContent>
				<Spinner size="xl" variant="white" label={message} />
				{message && <LoadingMessage>{message}</LoadingMessage>}
			</OverlayContent>
		</Overlay>
	);
};

// Skeleton loader for content placeholders
interface SkeletonProps {
	width?: string;
	height?: string;
	variant?: 'text' | 'circular' | 'rectangular';
	animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = '20px', variant = 'text', animation = 'pulse' }) => {
	return <StyledSkeleton $width={width} $height={height} $variant={variant} $animation={animation} />;
};

// Inline loader for buttons and small spaces
interface InlineLoaderProps {
	size?: SpinnerSize;
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({ size = 'sm' }) => {
	return (
		<InlineLoaderWrapper>
			<Spinner size={size} variant="primary" />
		</InlineLoaderWrapper>
	);
};

// Animations
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const wave = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

// Styled Components
const SpinnerWrapper = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
`;

const getSizeValue = (size: SpinnerSize): string => {
	switch (size) {
		case 'sm':
			return '16px';
		case 'md':
			return '24px';
		case 'lg':
			return '40px';
		case 'xl':
			return '60px';
		default:
			return '24px';
	}
};

const getColorValue = (variant: SpinnerVariant): string => {
	switch (variant) {
		case 'primary':
			return colors.primary[500];
		case 'white':
			return '#ffffff';
		case 'neutral':
			return colors.neutral[500];
		default:
			return colors.primary[500];
	}
};

const StyledSpinner = styled.div<{ $size: SpinnerSize; $variant: SpinnerVariant }>`
	width: ${(props) => getSizeValue(props.$size)};
	height: ${(props) => getSizeValue(props.$size)};
	border: 3px solid rgba(0, 0, 0, 0.1);
	border-top-color: ${(props) => getColorValue(props.$variant)};
	border-radius: 50%;
	animation: ${spin} 0.8s linear infinite;
`;

const VisuallyHidden = styled.span`
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
`;

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9998;
`;

const OverlayContent = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
`;

const LoadingMessage = styled.p`
	color: white;
	font-size: 18px;
	font-weight: 500;
	margin: 0;
	text-align: center;
`;

const StyledSkeleton = styled.div<{
	$width: string;
	$height: string;
	$variant: 'text' | 'circular' | 'rectangular';
	$animation: 'pulse' | 'wave' | 'none';
}>`
	width: ${(props) => props.$width};
	height: ${(props) => props.$height};
	background: ${colors.neutral[200]};
	border-radius: ${(props) => {
		switch (props.$variant) {
			case 'circular':
				return '50%';
			case 'text':
				return '4px';
			case 'rectangular':
				return '8px';
			default:
				return '4px';
		}
	}};
	position: relative;
	overflow: hidden;

	${(props) =>
		props.$animation === 'pulse' &&
		`
    animation: ${pulse} 1.5s ease-in-out infinite;
  `}

	${(props) =>
		props.$animation === 'wave' &&
		`
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
      );
      animation: ${wave} 1.5s ease-in-out infinite;
    }
  `}
`;

const InlineLoaderWrapper = styled.span`
	display: inline-flex;
	vertical-align: middle;
	margin: 0 8px;
`;
