/**
 * ThemeSelector Atom - Battle.Net Quiz Platform
 *
 * Allows users to select color themes (background, contrast, accent).
 * Changes are applied immediately via CSS custom properties.
 *
 * @module atoms/ThemeSelector
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trans } from '@lingui/react/macro';
import { Icon, IconButton } from './Icon';
import styles from './ThemeSelector.module.css';

/** Available color themes */
export type ColorTheme = 'ocean' | 'sunset' | 'forest' | 'royal' | 'cherry' | 'midnight' | 'golden';

/** Available brightness modes */
export type BrightnessMode = 'light' | 'dark';

/** Theme configuration */
export interface ThemeConfig {
	colorTheme: ColorTheme;
	brightnessMode: BrightnessMode;
}

/** Theme metadata for display */
interface ThemeInfo {
	id: ColorTheme;
	name: string;
	color: string;
	description: string;
}

const COLOR_THEMES: ThemeInfo[] = [
	{ id: 'ocean', name: 'Ocean Blue', color: '#0ea5e9', description: 'Frisch und modern' },
	{ id: 'sunset', name: 'Sunset Orange', color: '#f97316', description: 'Warm und energetisch' },
	{ id: 'forest', name: 'Forest Green', color: '#22c55e', description: 'Natürlich und beruhigend' },
	{ id: 'royal', name: 'Royal Purple', color: '#a855f7', description: 'Elegant und kreativ' },
	{ id: 'cherry', name: 'Cherry Red', color: '#f43f5e', description: 'Mutig und leidenschaftlich' },
	{ id: 'midnight', name: 'Midnight Teal', color: '#14b8a6', description: 'Ruhig und professionell' },
	{ id: 'golden', name: 'Golden Amber', color: '#f59e0b', description: 'Premium und warm' },
];

const BRIGHTNESS_MODES: Array<{ id: BrightnessMode; name: string; icon: 'sun' | 'moon' }> = [
	{ id: 'light', name: 'Hell', icon: 'sun' },
	{ id: 'dark', name: 'Dunkel', icon: 'moon' },
];

const STORAGE_KEY = 'battle-net-theme';

/** Get initial theme from localStorage or detect system preference */
const getInitialTheme = (): ThemeConfig => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Migrate from auto to actual theme based on system
			if (parsed.brightnessMode === 'auto') {
				parsed.brightnessMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
			}
			return parsed;
		}
	} catch {
		// Ignore errors
	}
	// Detect system preference on first visit
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	return { colorTheme: 'ocean', brightnessMode: prefersDark ? 'dark' : 'light' };
};

/** Apply theme to document */
const applyTheme = (config: ThemeConfig): void => {
	document.documentElement.setAttribute('data-color-theme', config.colorTheme);
	document.documentElement.setAttribute('data-theme', config.brightnessMode);
};

export interface ThemeSelectorProps {
	/** Optional callback when theme changes */
	onThemeChange?: (config: ThemeConfig) => void;
}

/**
 * Floating theme selector button with dropdown.
 * Persists selection to localStorage and applies immediately.
 */
export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onThemeChange }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [config, setConfig] = useState<ThemeConfig>(getInitialTheme);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Apply theme on mount and changes
	useEffect(() => {
		applyTheme(config);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		onThemeChange?.(config);
	}, [config, onThemeChange]);

	// Close dropdown on outside click
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	const handleColorChange = useCallback((colorTheme: ColorTheme) => {
		setConfig((prev) => ({ ...prev, colorTheme }));
	}, []);

	const handleBrightnessChange = useCallback((brightnessMode: BrightnessMode) => {
		setConfig((prev) => ({ ...prev, brightnessMode }));
	}, []);

	const currentTheme = COLOR_THEMES.find((t) => t.id === config.colorTheme);

	return (
		<div className={styles.container} ref={dropdownRef}>
			<button className={styles.trigger} onClick={() => setIsOpen(!isOpen)} title="Farbthema ändern" aria-label="Farbthema ändern" aria-expanded={isOpen}>
				<span className={styles.colorPreview} style={{ backgroundColor: currentTheme?.color }} />
				<Icon name="chevron-down" size="xs" />
			</button>

			{isOpen && (
				<div className={styles.dropdown}>
					{/* Brightness Mode Selection */}
					<div className={styles.section}>
						<div className={styles.sectionTitle}>
							<Trans id="theme.brightness">Helligkeit</Trans>
						</div>
						<div className={styles.brightnessOptions}>
							{BRIGHTNESS_MODES.map((mode) => (
								<button key={mode.id} className={`${styles.brightnessButton} ${config.brightnessMode === mode.id ? styles.active : ''}`} onClick={() => handleBrightnessChange(mode.id)} title={mode.name}>
									<Icon name={mode.icon} size="sm" />
									<span>{mode.name}</span>
								</button>
							))}
						</div>
					</div>

					{/* Color Theme Selection */}
					<div className={styles.section}>
						<div className={styles.sectionTitle}>
							<Trans id="theme.accent">Akzentfarbe</Trans>
						</div>
						<div className={styles.colorGrid}>
							{COLOR_THEMES.map((theme) => (
								<button key={theme.id} className={`${styles.colorButton} ${config.colorTheme === theme.id ? styles.active : ''}`} onClick={() => handleColorChange(theme.id)} title={`${theme.name} - ${theme.description}`} aria-label={theme.name}>
									<span className={styles.colorSwatch} style={{ backgroundColor: theme.color }} />
									{config.colorTheme === theme.id && <Icon name="check" size="xs" className={styles.checkIcon} />}
								</button>
							))}
						</div>
					</div>

					{/* Current theme info */}
					<div className={styles.currentInfo}>
						<span className={styles.themeName}>{currentTheme?.name}</span>
						<span className={styles.themeDesc}>{currentTheme?.description}</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default ThemeSelector;
