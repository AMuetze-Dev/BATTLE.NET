/**
 * Theme Service - Light/Dark Mode Management
 * 
 * Handles theme persistence, system preference detection, and theme switching.
 * Pure service with no React dependencies for portability.
 */

export type Theme = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'battlenet-theme';

/**
 * Get the current theme preference from storage
 */
export const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored;
  }
  return 'auto';
};

/**
 * Get the system's preferred color scheme
 */
export const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

/**
 * Resolve 'auto' theme to actual light/dark
 */
export const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme === 'auto') {
    return getSystemTheme();
  }
  return theme;
};

/**
 * Apply theme to document
 */
export const applyTheme = (theme: Theme): void => {
  if (typeof document === 'undefined') return;
  
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute('data-theme', theme === 'auto' ? 'auto' : resolved);
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      resolved === 'dark' ? '#18181b' : '#ffffff'
    );
  }
};

/**
 * Store and apply theme preference
 */
export const setTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
};

/**
 * Toggle between light and dark (skipping auto)
 */
export const toggleTheme = (): Theme => {
  const current = getStoredTheme();
  const resolved = resolveTheme(current);
  const newTheme: Theme = resolved === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
};

/**
 * Initialize theme on app start
 */
export const initializeTheme = (): void => {
  if (typeof window === 'undefined') return;
  
  const theme = getStoredTheme();
  applyTheme(theme);
  
  // Listen for system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const currentTheme = getStoredTheme();
    if (currentTheme === 'auto') {
      applyTheme('auto');
    }
  });
};

/**
 * ThemeService object for convenience
 */
export const ThemeService = {
  getStored: getStoredTheme,
  getSystem: getSystemTheme,
  resolve: resolveTheme,
  apply: applyTheme,
  set: setTheme,
  toggle: toggleTheme,
  initialize: initializeTheme,
};

export default ThemeService;
