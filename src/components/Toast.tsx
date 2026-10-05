import React from 'react';
import { useToastStore } from '../store/useToastStore';
import { CheckIcon, CloseIcon } from './Icons';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-card/95 text-card-foreground shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                toast.type === 'error'
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <CheckIcon size={13} />
            </span>
            <p className="text-xs sm:text-sm font-medium leading-snug">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
            aria-label="Dismiss toast"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
