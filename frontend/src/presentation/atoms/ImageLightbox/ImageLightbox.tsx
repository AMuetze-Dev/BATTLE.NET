/**
 * ImageLightbox Atom - Battle.Net Quiz Platform
 *
 * A lightbox component that allows users to view images in fullscreen.
 * Clicking on an image opens it in an overlay for detailed viewing.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ImageLightbox.module.css';

export interface ImageLightboxProps {
	/** Image source URL */
	src: string;
	/** Alt text for the image */
	alt?: string;
	/** Additional class name for the thumbnail container */
	className?: string;
	/** Additional class name for the thumbnail image */
	imageClassName?: string;
	/** Whether to show zoom indicator */
	showZoomIndicator?: boolean;
}

/**
 * Image component with lightbox functionality
 */
export const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, alt = 'Image', className, imageClassName, showZoomIndicator = true }) => {
	const [isOpen, setIsOpen] = useState(false);

	const handleOpen = useCallback(() => {
		setIsOpen(true);
	}, []);

	const handleClose = useCallback(() => {
		setIsOpen(false);
	}, []);

	// Handle escape key
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				handleClose();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		// Prevent body scroll when lightbox is open
		document.body.style.overflow = 'hidden';

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.body.style.overflow = '';
		};
	}, [isOpen, handleClose]);

	return (
		<>
			{/* Thumbnail */}
			<div className={`${styles.thumbnailContainer} ${className ?? ''}`} onClick={handleOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleOpen()} aria-label={`View ${alt} in fullscreen`}>
				<img className={`${styles.thumbnail} ${imageClassName ?? ''}`} src={src} alt={alt} loading="lazy" />
				{showZoomIndicator && (
					<div className={styles.zoomIndicator} aria-hidden="true">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<circle cx="11" cy="11" r="8" />
							<path d="M21 21l-4.35-4.35" />
							<path d="M11 8v6M8 11h6" />
						</svg>
					</div>
				)}
			</div>

			{/* Lightbox Modal */}
			{isOpen &&
				createPortal(
					<div className={styles.overlay} onClick={handleClose} role="dialog" aria-modal="true" aria-label={`Fullscreen view of ${alt}`}>
						<button className={styles.closeButton} onClick={handleClose} aria-label="Close lightbox">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<path d="M18 6L6 18M6 6l12 12" />
							</svg>
						</button>
						<img className={styles.fullImage} src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
					</div>,
					document.body
				)}
		</>
	);
};

export default ImageLightbox;
