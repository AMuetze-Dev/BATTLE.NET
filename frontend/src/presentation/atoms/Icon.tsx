/**
 * Icon Component - Battle.Net Quiz Platform
 *
 * Centralized icon system using only brand colors.
 * Replaces emoji icons with consistent SVG icons.
 *
 * Usage:
 * <Icon name="check" size="md" color="success" />
 * <Icon name="eye" size="lg" color="primary" />
 */

import React from 'react';

export type IconName =
	| 'eye'
	| 'eye-off'
	| 'lock'
	| 'unlock'
	| 'check'
	| 'x'
	| 'plus'
	| 'minus'
	| 'arrow-left'
	| 'arrow-right'
	| 'arrow-up'
	| 'arrow-down'
	| 'timer'
	| 'clock'
	| 'users'
	| 'user'
	| 'image'
	| 'bell'
	| 'lightbulb'
	| 'edit'
	| 'trash'
	| 'upload'
	| 'download'
	| 'settings'
	| 'refresh'
	| 'play'
	| 'pause'
	| 'stop'
	| 'square'
	| 'skip-forward'
	| 'skip-back'
	| 'volume'
	| 'volume-off'
	| 'wifi'
	| 'wifi-off'
	| 'link'
	| 'external-link'
	| 'copy'
	| 'search'
	| 'filter'
	| 'sort'
	| 'grid'
	| 'list'
	| 'menu'
	| 'more-horizontal'
	| 'more-vertical'
	| 'chevron-left'
	| 'chevron-right'
	| 'chevron-up'
	| 'chevron-down'
	| 'target'
	| 'map-pin'
	| 'flag'
	| 'star'
	| 'heart'
	| 'trophy'
	| 'medal'
	| 'question'
	| 'info'
	| 'alert-circle'
	| 'alert-triangle'
	| 'check-circle'
	| 'x-circle'
	| 'clipboard'
	| 'file'
	| 'folder'
	| 'loader'
	| 'sun'
	| 'moon';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type IconColor = 'inherit' | 'primary' | 'primary-light' | 'primary-dark' | 'success' | 'success-light' | 'warning' | 'warning-light' | 'error' | 'error-light' | 'neutral' | 'muted' | 'inverse';

export interface IconProps {
	/** Icon name */
	name: IconName;
	/** Size of the icon */
	size?: IconSize;
	/** Color variant - uses only brand colors */
	color?: IconColor;
	/** Additional CSS class */
	className?: string;
	/** Accessibility label */
	'aria-label'?: string;
	/** Hide from screen readers */
	'aria-hidden'?: boolean;
}

const sizeMap: Record<IconSize, number> = {
	xs: 12,
	sm: 16,
	md: 20,
	lg: 24,
	xl: 32,
	'2xl': 48,
};

const colorMap: Record<IconColor, string> = {
	inherit: 'currentColor',
	primary: 'var(--color-primary-600)',
	'primary-light': 'var(--color-primary-400)',
	'primary-dark': 'var(--color-primary-800)',
	success: 'var(--color-success-600)',
	'success-light': 'var(--color-success-400)',
	warning: 'var(--color-warning-600)',
	'warning-light': 'var(--color-warning-400)',
	error: 'var(--color-error-600)',
	'error-light': 'var(--color-error-400)',
	neutral: 'var(--color-neutral-500)',
	muted: 'var(--color-text-tertiary)',
	inverse: 'var(--color-text-inverse)',
};

/**
 * SVG path data for each icon
 * All icons use a 24x24 viewBox for consistency
 */
const iconPaths: Record<IconName, string> = {
	// Visibility
	eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z',
	'eye-off': 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22',

	// Lock
	lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4',
	unlock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 019.9-1',

	// Actions
	check: 'M20 6L9 17l-5-5',
	x: 'M18 6L6 18 M6 6l12 12',
	plus: 'M12 5v14 M5 12h14',
	minus: 'M5 12h14',

	// Arrows
	'arrow-left': 'M19 12H5 M12 19l-7-7 7-7',
	'arrow-right': 'M5 12h14 M12 5l7 7-7 7',
	'arrow-up': 'M12 19V5 M5 12l7-7 7 7',
	'arrow-down': 'M12 5v14 M19 12l-7 7-7-7',

	// Time
	timer: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2',
	clock: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2',

	// Users
	users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
	user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',

	// Media
	image: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M21 15l-5-5L5 21',
	bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',

	// Info
	lightbulb: 'M9 21h6 M9 18h6 M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z',

	// Edit
	edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
	trash: 'M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2 M10 11v6 M14 11v6',

	// Files
	upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
	download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',

	// System
	settings:
		'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
	refresh: 'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15',

	// Playback
	play: 'M5 3l14 9-14 9V3z',
	pause: 'M6 4h4v16H6z M14 4h4v16h-4z',
	stop: 'M6 4h12v16H6z',
	square: 'M3 3h18v18H3z',
	'skip-forward': 'M5 4l10 8-10 8V4z M19 5v14',
	'skip-back': 'M19 20L9 12l10-8v16z M5 19V5',

	// Volume
	volume: 'M11 5L6 9H2v6h4l5 4V5z M19.07 4.93a10 10 0 010 14.14 M15.54 8.46a5 5 0 010 7.07',
	'volume-off': 'M11 5L6 9H2v6h4l5 4V5z M23 9l-6 6 M17 9l6 6',

	// Connection
	wifi: 'M5 12.55a11 11 0 0114.08 0 M1.42 9a16 16 0 0121.16 0 M8.53 16.11a6 6 0 016.95 0 M12 20h.01',
	'wifi-off': 'M1 1l22 22 M16.72 11.06A10.94 10.94 0 0119 12.55 M5 12.55a10.94 10.94 0 015.17-2.39 M10.71 5.05A16 16 0 0122.58 9 M1.42 9a15.91 15.91 0 014.7-2.88 M8.53 16.11a6 6 0 016.95 0 M12 20h.01',

	// Links
	link: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
	'external-link': 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6 M15 3h6v6 M10 14L21 3',
	copy: 'M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1',

	// Search/Filter
	search: 'M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.35-4.35',
	filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
	sort: 'M3 6h18 M3 12h12 M3 18h6',

	// Layout
	grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
	list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
	menu: 'M3 12h18 M3 6h18 M3 18h18',
	'more-horizontal': 'M12 13a1 1 0 100-2 1 1 0 000 2z M19 13a1 1 0 100-2 1 1 0 000 2z M5 13a1 1 0 100-2 1 1 0 000 2z',
	'more-vertical': 'M12 13a1 1 0 100-2 1 1 0 000 2z M12 6a1 1 0 100-2 1 1 0 000 2z M12 20a1 1 0 100-2 1 1 0 000 2z',

	// Chevrons
	'chevron-left': 'M15 18l-6-6 6-6',
	'chevron-right': 'M9 18l6-6-6-6',
	'chevron-up': 'M18 15l-6-6-6 6',
	'chevron-down': 'M6 9l6 6 6-6',

	// Location
	target: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 18a6 6 0 100-12 6 6 0 000 12z M12 14a2 2 0 100-4 2 2 0 000 4z',
	'map-pin': 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z',
	flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7',

	// Status
	star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
	heart: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
	trophy: 'M6 9H4.5a2.5 2.5 0 010-5H6 M18 9h1.5a2.5 2.5 0 000-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 1012 0V2z',
	medal: 'M12 2L9 7l-5 1 4 4-1 5 5-3 5 3-1-5 4-4-5-1-4-5z',

	// Info/Alert
	question: 'M12 22a10 10 0 100-20 10 10 0 000 20z M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3 M12 17h.01',
	info: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 16v-4 M12 8h.01',
	'alert-circle': 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 8v4 M12 16h.01',
	'alert-triangle': 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01',
	'check-circle': 'M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3',
	'x-circle': 'M12 22a10 10 0 100-20 10 10 0 000 20z M15 9l-6 6 M9 9l6 6',

	// Files
	clipboard: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2 M8 2h8v4H8V2z',
	file: 'M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z M13 2v7h7',
	folder: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',

	// Loading
	loader: 'M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4 M4.93 19.07l2.83-2.83 M16.24 7.76l2.83-2.83',

	// Theme
	sun: 'M12 17a5 5 0 100-10 5 5 0 000 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42',
	moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
};

/**
 * Icon Component
 *
 * Renders SVG icons with brand-compliant colors.
 * Uses CSS variables for consistent theming.
 */
export const Icon: React.FC<IconProps> = ({ name, size = 'md', color = 'inherit', className = '', 'aria-label': ariaLabel, 'aria-hidden': ariaHidden = !ariaLabel }) => {
	const pixelSize = sizeMap[size];
	const fillColor = colorMap[color];
	const pathData = iconPaths[name];

	if (!pathData) {
		console.warn(`Icon "${name}" not found`);
		return null;
	}

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={pixelSize}
			height={pixelSize}
			viewBox="0 0 24 24"
			fill="none"
			stroke={fillColor}
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={`icon icon-${size} ${className}`.trim()}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
			role={ariaLabel ? 'img' : 'presentation'}
		>
			{pathData.split(' M').map((d, i) => (
				<path key={i} d={i === 0 ? d : `M${d}`} />
			))}
		</svg>
	);
};

/**
 * Helper component for icon buttons with consistent styling
 */
export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
	/** Icon name */
	icon: IconName;
	/** Size of the icon */
	size?: IconSize;
	/** Color variant */
	color?: IconColor;
	/** Accessibility label (required) */
	'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, size = 'md', color = 'inherit', className = '', ...buttonProps }) => (
	<button type="button" className={`btn btn-ghost btn-icon-only ${className}`.trim()} {...buttonProps}>
		<Icon name={icon} size={size} color={color} aria-hidden />
	</button>
);

export default Icon;
