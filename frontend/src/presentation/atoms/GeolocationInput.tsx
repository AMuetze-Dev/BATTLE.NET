/**
 * GeolocationInput - Atomic component for geolocation-based questions
 *
 * Players mark a location on an image or map.
 * Supports both image-based and map-based modes.
 */
import React, { useState, useCallback, useRef } from 'react';
import { Trans } from '@lingui/react/macro';
import styles from './GeolocationInput.module.css';

export interface GeoCoordinates {
	x: number; // 0-100 percentage for image mode, longitude for map mode
	y: number; // 0-100 percentage for image mode, latitude for map mode
}

export interface GeolocationInputProps {
	/** Current value as JSON string: {x: number, y: number} */
	value: string;
	/** Called when location changes */
	onChange: (value: string) => void;
	/** Mode: 'image' for clicking on an image, 'map' for real map (future) */
	mode: 'image' | 'map';
	/** Image URL for image mode */
	imageUrl?: string;
	/** Whether input is locked */
	locked?: boolean;
}

export const GeolocationInput: React.FC<GeolocationInputProps> = ({ value, onChange, mode, imageUrl, locked = false }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [imageLoaded, setImageLoaded] = useState(false);

	// Parse current coordinates
	const coordinates: GeoCoordinates | null = React.useMemo(() => {
		try {
			return value ? JSON.parse(value) : null;
		} catch {
			return null;
		}
	}, [value]);

	// Handle click on map/image to set marker
	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (locked || !containerRef.current) return;

			const rect = containerRef.current.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 100;
			const y = ((e.clientY - rect.top) / rect.height) * 100;

			// Clamp values between 0 and 100
			const clampedX = Math.max(0, Math.min(100, x));
			const clampedY = Math.max(0, Math.min(100, y));

			onChange(JSON.stringify({ x: clampedX, y: clampedY }));
		},
		[locked, onChange]
	);

	// Clear the marker
	const handleClear = useCallback(() => {
		if (!locked) {
			onChange('');
		}
	}, [locked, onChange]);

	// Format coordinate for display
	const formatCoord = (val: number): string => {
		return val.toFixed(1);
	};

	return (
		<div className={styles.container}>
			{/* Instructions */}
			<div className={styles.instructions}>
				<Trans>Klicke auf die Stelle, die du markieren möchtest</Trans>
			</div>

			{/* Map/Image container */}
			<div
				ref={containerRef}
				className={`${styles.mapContainer} ${locked ? styles.locked : ''}`}
				onClick={handleClick}
				role="button"
				tabIndex={locked ? -1 : 0}
				aria-label="Click to place marker"
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						// Place marker at center on keyboard activation
						if (!locked) {
							onChange(JSON.stringify({ x: 50, y: 50 }));
						}
					}
				}}
			>
				{mode === 'image' && imageUrl ? (
					<>
						<img src={imageUrl} alt="Location selection area" className={styles.mapImage} onLoad={() => setImageLoaded(true)} />
						{!imageLoaded && (
							<div className={styles.mapPlaceholder}>
								<span className={styles.icon}>🖼️</span>
								<span>
									<Trans>Bild wird geladen...</Trans>
								</span>
							</div>
						)}
					</>
				) : mode === 'map' ? (
					<div className={styles.mapPlaceholder}>
						<span className={styles.icon}>🗺️</span>
						<span>
							<Trans>Kartenansicht</Trans>
						</span>
						<span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
							<Trans>Interaktive Karte in Entwicklung</Trans>
						</span>
					</div>
				) : (
					<div className={styles.mapPlaceholder}>
						<span className={styles.icon}>📍</span>
						<span>
							<Trans>Kein Bild verfügbar</Trans>
						</span>
					</div>
				)}

				{/* Marker */}
				{coordinates && (
					<div
						className={styles.marker}
						style={{
							left: `${coordinates.x}%`,
							top: `${coordinates.y}%`,
						}}
					>
						<span className={styles.markerIcon}>📍</span>
					</div>
				)}

				{/* Crosshair helper when no marker is placed */}
				{!coordinates && !locked && <div className={styles.crosshair} />}
			</div>

			{/* Controls */}
			<div className={styles.controls}>
				{/* Coordinates display */}
				{coordinates && (
					<div className={styles.coordinates}>
						<span className={styles.coordLabel}>X:</span>
						<span className={styles.coordValue}>{formatCoord(coordinates.x)}%</span>
						<span className={styles.coordLabel}>Y:</span>
						<span className={styles.coordValue}>{formatCoord(coordinates.y)}%</span>
					</div>
				)}

				{/* Clear button */}
				{coordinates && !locked && (
					<button type="button" className={styles.clearButton} onClick={handleClear}>
						✕ <Trans>Markierung entfernen</Trans>
					</button>
				)}
			</div>
		</div>
	);
};

export default GeolocationInput;
