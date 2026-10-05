import { create } from 'zustand';
import type { ThemeState } from '../types';

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeToDom = (theme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const initialTheme = getInitialTheme();
applyThemeToDom(initialTheme);

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem('theme', theme);
    applyThemeToDom(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const current = get().theme;
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    applyThemeToDom(nextTheme);
    set({ theme: nextTheme });
  },
}));