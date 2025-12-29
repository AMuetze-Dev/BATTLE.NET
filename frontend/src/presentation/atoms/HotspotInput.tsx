/**
 * HotspotInput - Atomic component for image hotspot selection
 *
 * Players click on an image to mark a point. Supports zoom/pan for precise placement.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { Trans } from '@lingui/react/macro';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface HotspotInputProps {
	/** Current value as "x,y" coordinates (percentage-based 0-100) */
	value: string;
	/** Called when user clicks to set marker */
	onChange: (value: string) => void;
	/** Image source URL */
	imageSrc: string;
	/** Whether input is locked */
	locked?: boolean;
	/** Allow zoom functionality */
	allowZoom?: boolean;
}

interface Point {
	x: number;
	y: number;
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: ${spacing.md};
	width: 100%;
	max-width: 800px;
`;

const ImageContainer = styled.div<{ $locked: boolean; $zoomed: boolean }>`
	position: relative;
	width: 100%;
	border-radius: ${borderRadius.lg};
	overflow: hidden;
	border: 3px solid ${({ $locked }) => ($locked ? colors.neutral[300] : colors.primary[400])};
	cursor: ${({ $locked, $zoomed }) => ($locked ? 'not-allowed' : $zoomed ? 'move' : 'crosshair')};
	background: ${colors.neutral[100]};
	touch-action: ${({ $zoomed }) => ($zoomed ? 'none' : 'auto')};
	user-select: none;
`;

const ImageWrapper = styled.div<{ $scale: number; $translateX: number; $translateY: number }>`
	position: relative;
	transform: scale(${({ $scale }) => $scale}) translate(${({ $translateX }) => $translateX}px, ${({ $translateY }) => $translateY}px);
	transform-origin: center center;
	transition: transform 0.1s ease-out;
`;

const Image = styled.img`
	width: 100%;
	height: auto;
	display: block;
	pointer-events: none;
`;

const Marker = styled.div<{ $x: number; $y: number; $locked: boolean }>`
	position: absolute;
	left: ${({ $x }) => $x}%;
	top: ${({ $y }) => $y}%;
	transform: translate(-50%, -100%);
	pointer-events: none;
	z-index: 10;
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));

	&::before {
		content: '📍';
		font-size: 32px;
		display: block;
	}
`;

const MarkerDot = styled.div<{ $x: number; $y: number }>`
	position: absolute;
	left: ${({ $x }) => $x}%;
	top: ${({ $y }) => $y}%;
	transform: translate(-50%, -50%);
	width: 12px;
	height: 12px;
	background: ${colors.primary[600]};
	border: 2px solid white;
	border-radius: 50%;
	pointer-events: none;
	z-index: 11;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Controls = styled.div`
	display: flex;
	gap: ${spacing.md};
	align-items: center;
	flex-wrap: wrap;
	justify-content: center;
`;

const ZoomButton = styled.button<{ $active?: boolean }>`
	padding: ${spacing.sm} ${spacing.md};
	border: 2px solid ${({ $active }) => ($active ? colors.primary[600] : colors.border.light)};
	border-radius: ${borderRadius.md};
	background: ${({ $active }) => ($active ? colors.primary[100] : colors.surface)};
	color: ${({ $active }) => ($active ? colors.primary[700] : colors.text.primary)};
	font-size: ${typography.fontSize.lg};
	cursor: pointer;
	transition: all 0.2s ease;
	min-width: 44px;
	min-height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover:not(:disabled) {
		background: ${colors.primary[50]};
		border-color: ${colors.primary[400]};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const HintText = styled.div`
	font-size: ${typography.fontSize.sm};
	color: ${colors.text.secondary};
	text-align: center;
`;

const CoordinateDisplay = styled.div<{ $hasValue: boolean }>`
	padding: ${spacing.xs} ${spacing.sm};
	background: ${({ $hasValue }) => ($hasValue ? colors.primary[50] : colors.neutral[100])};
	border-radius: ${borderRadius.sm};
	font-size: ${typography.fontSize.sm};
	color: ${({ $hasValue }) => ($hasValue ? colors.primary[700] : colors.text.secondary)};
	font-family: ${typography.fontFamily.mono};
`;

export const HotspotInput: React.FC<HotspotInputProps> = ({ value, onChange, imageSrc, locked = false, allowZoom = true }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);
	const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });

	// Parse current marker position from value
	const markerPosition: Point | null = value
		? (() => {
				const [x, y] = value.split(',').map(Number);
				return !isNaN(x) && !isNaN(y) ? { x, y } : null;
		  })()
		: null;

	const isZoomed = scale > 1;

	// Handle click to place marker
	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (locked || isDragging) return;

			const rect = containerRef.current?.getBoundingClientRect();
			if (!rect) return;

			// Calculate click position as percentage
			const x = ((e.clientX - rect.left) / rect.width) * 100;
			const y = ((e.clientY - rect.top) / rect.height) * 100;

			// Adjust for zoom and pan
			const adjustedX = (x - 50) / scale + 50 - translate.x / (rect.width / 100);
			const adjustedY = (y - 50) / scale + 50 - translate.y / (rect.height / 100);

			// Clamp to 0-100
			const clampedX = Math.max(0, Math.min(100, adjustedX));
			const clampedY = Math.max(0, Math.min(100, adjustedY));

			onChange(`${clampedX.toFixed(1)},${clampedY.toFixed(1)}`);
		},
		[locked, isDragging, scale, translate, onChange]
	);

	// Zoom controls
	const handleZoomIn = () => {
		setScale((prev) => Math.min(prev + 0.5, 3));
	};

	const handleZoomOut = () => {
		const newScale = Math.max(scale - 0.5, 1);
		setScale(newScale);
		if (newScale === 1) {
			setTranslate({ x: 0, y: 0 });
		}
	};

	const handleResetZoom = () => {
		setScale(1);
		setTranslate({ x: 0, y: 0 });
	};

	// Pan handling when zoomed
	const handleMouseDown = (e: React.MouseEvent) => {
		if (!isZoomed || locked) return;
		setIsDragging(true);
		setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
	};

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging || !isZoomed) return;
			setTranslate({
				x: e.clientX - dragStart.x,
				y: e.clientY - dragStart.y,
			});
		},
		[isDragging, isZoomed, dragStart]
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	useEffect(() => {
		if (isDragging) {
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
			return () => {
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, handleMouseMove, handleMouseUp]);

	// Touch support for mobile zoom
	const handleTouchStart = (e: React.TouchEvent) => {
		if (e.touches.length === 1 && isZoomed && !locked) {
			const touch = e.touches[0];
			setIsDragging(true);
			setDragStart({ x: touch.clientX - translate.x, y: touch.clientY - translate.y });
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (e.touches.length === 1 && isDragging && isZoomed) {
			const touch = e.touches[0];
			setTranslate({
				x: touch.clientX - dragStart.x,
				y: touch.clientY - dragStart.y,
			});
		}
	};

	const handleTouchEnd = () => {
		setIsDragging(false);
	};

	return (
		<Container>
			<ImageContainer ref={containerRef} $locked={locked} $zoomed={isZoomed} onClick={handleClick} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
				<ImageWrapper $scale={scale} $translateX={translate.x} $translateY={translate.y}>
					<Image src={imageSrc} alt="Hotspot image" draggable={false} />
					{markerPosition && (
						<>
							<Marker $x={markerPosition.x} $y={markerPosition.y} $locked={locked} />
							<MarkerDot $x={markerPosition.x} $y={markerPosition.y} />
						</>
					)}
				</ImageWrapper>
			</ImageContainer>

			<Controls>
				{allowZoom && (
					<>
						<ZoomButton onClick={handleZoomOut} disabled={scale <= 1 || locked} title="Verkleinern">
							➖
						</ZoomButton>
						<ZoomButton onClick={handleResetZoom} disabled={scale === 1 || locked} $active={scale === 1} title="Zurücksetzen">
							🔄
						</ZoomButton>
						<ZoomButton onClick={handleZoomIn} disabled={scale >= 3 || locked} title="Vergrößern">
							➕
						</ZoomButton>
					</>
				)}
				<CoordinateDisplay $hasValue={!!markerPosition}>{markerPosition ? `📍 ${markerPosition.x.toFixed(1)}%, ${markerPosition.y.toFixed(1)}%` : <Trans id="hotspot.noMarker">Kein Marker gesetzt</Trans>}</CoordinateDisplay>
			</Controls>

			{!locked && <HintText>{isZoomed ? <Trans id="hotspot.hintZoomed">Ziehen zum Verschieben, Klicken zum Markieren</Trans> : <Trans id="hotspot.hint">Klicke auf das Bild, um einen Punkt zu markieren</Trans>}</HintText>}
		</Container>
	);
};
