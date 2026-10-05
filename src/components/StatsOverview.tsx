import React from 'react';
import { useUrlStore } from '../store/useUrlStore';
import { LinkIcon, BarChartIcon, ZapIcon } from './Icons';

export const StatsOverview: React.FC = () => {
  const { urls } = useUrlStore();

  if (urls.length === 0) return null;

  const totalClicks = urls.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  const now = Date.now();
  const activeLinks = urls.filter(
    (u) => !u.expiresAt || new Date(u.expiresAt).getTime() > now
  ).length;

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full">
      {/* Metric 1 */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 rounded-xl border border-border/60 bg-card/60 p-3 sm:p-4 text-center sm:text-left backdrop-blur-xs">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <LinkIcon size={18} />
        </div>
        <div>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
            {urls.length}
          </p>
          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">
            Total Links
          </p>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 rounded-xl border border-border/60 bg-card/60 p-3 sm:p-4 text-center sm:text-left backdrop-blur-xs">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <BarChartIcon size={18} />
        </div>
        <div>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
            {totalClicks.toLocaleString()}
          </p>
          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">
            Total Clicks
          </p>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 rounded-xl border border-border/60 bg-card/60 p-3 sm:p-4 text-center sm:text-left backdrop-blur-xs">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <ZapIcon size={18} />
        </div>
        <div>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
            {activeLinks}
          </p>
          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">
            Active Now
          </p>
        </div>
      </div>
    </div>
  );
};
