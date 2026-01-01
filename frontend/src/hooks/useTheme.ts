/**
 * useTheme Hook - React hook for theme management
 * 
 * Provides reactive theme state and toggle functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Theme, 
  ResolvedTheme, 
  getStoredTheme, 
  resolveTheme, 
  setTheme as setThemeService,
  getSystemTheme 
} from '../services/theme.service';

export interface UseThemeReturn {
  /** Current theme preference ('light' | 'dark' | 'auto') */
  theme: Theme;
  /** Resolved theme value ('light' | 'dark') - useful for conditional rendering */
  resolvedTheme: ResolvedTheme;
  /** Set specific theme */
  setTheme: (theme: Theme) => void;
  /** Toggle between light and dark */
  toggleTheme: () => void;
  /** System preference ('light' | 'dark') */
  systemTheme: ResolvedTheme;
}

export const useTheme = (): UseThemeReturn => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
  
  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Set theme and persist
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setThemeService(newTheme);
  }, []);
  
  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const resolved = resolveTheme(theme);
    const newTheme: Theme = resolved === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);
  
  const resolvedTheme = resolveTheme(theme);
  
  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    systemTheme,
  };
};

export default useTheme;
