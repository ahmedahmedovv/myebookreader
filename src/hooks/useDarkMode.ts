import { useState, useEffect } from 'react';

const THEME_STORAGE_KEY = 'darkMode';
const DARK_MODE_CLASS = 'dark-mode';

// Initialize dark mode synchronously before React renders
function initializeDarkMode(): boolean {
  // Check localStorage first
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved !== null) {
    const isDark = saved === 'true';
    // Apply class immediately
    if (isDark) {
      document.documentElement.classList.add(DARK_MODE_CLASS);
    } else {
      document.documentElement.classList.remove(DARK_MODE_CLASS);
    }
    return isDark;
  }
  // Fall back to system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.classList.add(DARK_MODE_CLASS);
  } else {
    document.documentElement.classList.remove(DARK_MODE_CLASS);
  }
  return prefersDark;
}

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(initializeDarkMode);

  useEffect(() => {
    // Apply or remove dark mode class on document root
    if (isDarkMode) {
      document.documentElement.classList.add(DARK_MODE_CLASS);
    } else {
      document.documentElement.classList.remove(DARK_MODE_CLASS);
    }
    
    // Save preference to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return { isDarkMode, toggleDarkMode };
}

