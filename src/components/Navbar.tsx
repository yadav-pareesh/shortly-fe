import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { LinkIcon } from './Icons';
import { useUrlStore } from '../store/useUrlStore';

export const Navbar: React.FC = () => {
  const { urls, isOffline } = useUrlStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/20">
            <LinkIcon size={20} className="rotate-45" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
                Shortly
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                PRO
              </span>
            </div>
            <span className="hidden sm:block text-[11px] text-muted-foreground font-medium -mt-0.5">
              Smart URL Shortener
            </span>
          </div>
        </div>

        {/* Right side tools */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Mode Pill */}
          <div
            className={`hidden xs:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
              isOffline
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
            title={
              isOffline
                ? 'Running with local storage persistence'
                : 'Connected to backend API'
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                isOffline ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            <span>{isOffline ? 'Local Mode' : 'Live API'}</span>
          </div>

          {/* Links counter badge */}
          {urls.length > 0 && (
            <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground font-medium bg-muted/60 px-2.5 py-1 rounded-full">
              <span>{urls.length}</span>
              <span>{urls.length === 1 ? 'link' : 'links'}</span>
            </div>
          )}

          {/* Theme Switcher */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
