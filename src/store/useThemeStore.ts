import { create } from 'zustand';
import type { ThemeState } from '../types';

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  const storedTheme = localStorage.getItem('theme');
  return storedTheme === 'dark' ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeState>((set) => {
  const initialTheme = getInitialTheme();

  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }

  return {
    theme: initialTheme,
    setTheme: (theme: 'light' | 'dark') => {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
      set({ theme });
    },
  };
});