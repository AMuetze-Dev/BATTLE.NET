/**
 * Tooltip Component
 *
 * Contextual help and information on hover
 */
import React, { ReactNode, useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { colors } from '../theme';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
	content: string;
	children: ReactNode;
	placement?: TooltipPlacement;
	delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, placement = 'top', delay = 200 }) => {
	const [isVisible, setIsVisible] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const triggerRef = useRef<HTMLDivElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

	const updatePosition = () => {
		if (!triggerRef.current || !tooltipRef.current) return;

		const triggerRect = triggerRef.current.getBoundingClientRect();
		const tooltipRect = tooltipRef.current.getBoundingClientRect();

		let top = 0;
		let left = 0;

		switch (placement) {
			case 'top':
				top = triggerRect.top - tooltipRect.height - 8;
				left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
				break;
			case 'bottom':
				top = triggerRect.bottom + 8;
				left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
				break;
			case 'left':
				top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
				left = triggerRect.left - tooltipRect.width - 8;
				break;
			case 'right':
				top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
				left = triggerRect.right + 8;
				break;
		}

		setPosition({ top, left });
	};

	const handleMouseEnter = () => {
		timeoutRef.current = setTimeout(() => {
			setIsVisible(true);
			updatePosition();
		}, delay);
	};

	const handleMouseLeave = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		setIsVisible(false);
	};

	useEffect(() => {
		if (isVisible) {
			window.addEventListener('scroll', updatePosition);
			window.addEventListener('resize', updatePosition);
			return () => {
				window.removeEventListener('scroll', updatePosition);
				window.removeEventListener('resize', updatePosition);
			};
		}
	}, [isVisible]);

	return (
		<>
			<TriggerWrapper ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onFocus={handleMouseEnter} onBlur={handleMouseLeave}>
				{children}
			</TriggerWrapper>
			{isVisible && (
				<TooltipContent ref={tooltipRef} $top={position.top} $left={position.left} $placement={placement} role="tooltip">
					{content}
					<Arrow $placement={placement} />
				</TooltipContent>
			)}
		</>
	);
};

const TriggerWrapper = styled.div`
	display: inline-flex;
`;

const TooltipContent = styled.div<{ $top: number; $left: number; $placement: TooltipPlacement }>`
	position: fixed;
	top: ${(props) => props.$top}px;
	left: ${(props) => props.$left}px;
	background: ${colors.neutral[900]};
	color: white;
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 14px;
	line-height: 1.4;
	max-width: 250px;
	word-wrap: break-word;
	z-index: 10000;
	pointer-events: none;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	animation: fadeIn 0.2s ease-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
`;

const Arrow = styled.div<{ $placement: TooltipPlacement }>`
	position: absolute;
	width: 8px;
	height: 8px;
	background: ${colors.neutral[900]};
	transform: rotate(45deg);

	${(props) => {
		switch (props.$placement) {
			case 'top':
				return `bottom: -4px; left: 50%; margin-left: -4px;`;
			case 'bottom':
				return `top: -4px; left: 50%; margin-left: -4px;`;
			case 'left':
				return `right: -4px; top: 50%; margin-top: -4px;`;
			case 'right':
				return `left: -4px; top: 50%; margin-top: -4px;`;
		}
	}}
`;
