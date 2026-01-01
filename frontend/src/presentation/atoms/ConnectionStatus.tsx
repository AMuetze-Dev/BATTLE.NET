/**
 * Connection Status Component - Battle.Net Quiz Platform
 *
 * Unified component for displaying connection status.
 * Uses centralized CSS classes from components.css.
 *
 * Colors:
 * - Primary (Blue) for connected
 * - Error (Red) for disconnected (exceptions only)
 */
import React from 'react';

export interface ConnectionStatusProps {
	/** Connection state */
	connected: boolean;
	/** Show text label */
	showLabel?: boolean;
	/** Use light/inverted colors (for dark/blue backgrounds) */
	inverted?: boolean;
	/** Additional CSS class */
	className?: string;
}

/**
 * ConnectionStatus - Displays connection state with dot indicator
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ connected, showLabel = true, inverted = false, className = '' }) => {
	// Choose badge variant based on inverted mode
	let badgeClass: string;
	if (inverted) {
		badgeClass = connected ? 'badge-light-success' : 'badge-light-error';
	} else {
		badgeClass = connected ? 'badge-primary' : 'badge-error';
	}

	const containerClasses = ['badge', badgeClass, className].filter(Boolean).join(' ');

	const dotClasses = ['connection-dot', connected ? 'connection-dot-connected' : 'connection-dot-disconnected'].join(' ');

	return (
		<span className={containerClasses}>
			<span className={dotClasses} aria-hidden="true" />
			{showLabel && (connected ? 'Verbunden' : 'Getrennt')}
		</span>
	);
};
