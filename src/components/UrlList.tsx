import React, { useEffect, useState, useMemo } from 'react';
import { useUrlStore } from '../store/useUrlStore';
import type { ShortUrlResponse, SortOption } from '../types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import {
  CopyIcon,
  CheckIcon,
  TrashIcon,
  ExternalLinkIcon,
  QrCodeIcon,
  RefreshIcon,
  SearchIcon,
  BarChartIcon,
  CalendarIcon,
  EditIcon,
  CloseIcon,
} from './Icons';
import { copyToClipboard, truncateUrl, formatDate } from '../lib/utils';
import { toast } from '../store/useToastStore';
import { QrModal } from './QrModal';

interface UrlCardProps {
  url: ShortUrlResponse;
  onOpenQr: (url: ShortUrlResponse) => void;
}

const UrlCard: React.FC<UrlCardProps> = ({ url, onOpenQr }) => {
  const { removeUrl, recordClick, updateUrlAlias } = useUrlStore();
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState(url.customAlias || '');
  const [isSavingAlias, setIsSavingAlias] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(url.shortUrl);
    if (ok) {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVisit = () => {
    recordClick(url.shortCode);
    window.open(url.shortUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3500);
      return;
    }
    await removeUrl(url.id, url.shortCode);
    toast.info('Link removed');
  };

  const handleSaveAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = aliasInput.trim();
    if (!clean) return;
    setIsSavingAlias(true);
    try {
      await updateUrlAlias(url.shortCode, clean);
      setIsEditingAlias(false);
      toast.success(`Alias updated to "${clean}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update alias';
      toast.error(msg);
    } finally {
      setIsSavingAlias(false);
    }
  };

  const isExpired = url.expiresAt ? new Date(url.expiresAt).getTime() < Date.now() : false;

  return (
    <Card className="overflow-hidden border-border/70 bg-card/80 transition-all hover:border-border hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          {/* Top row: Short link, clicks, and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary font-mono text-xs font-bold">
                /
              </span>
              <button
                type="button"
                onClick={handleVisit}
                className="text-left font-mono text-sm sm:text-base font-bold text-foreground hover:text-primary hover:underline truncate"
                title={`Visit ${url.shortUrl}`}
              >
                {url.shortUrl}
              </button>
            </div>

            {/* Click count + Expiry badges */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                title={`${url.clicks} total clicks`}
              >
                <BarChartIcon size={13} />
                <span>{url.clicks} {url.clicks === 1 ? 'click' : 'clicks'}</span>
              </div>

              {url.expiresAt && (
                <div
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    isExpired
                      ? 'bg-destructive/15 text-destructive font-semibold'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  title={isExpired ? 'This link has expired' : `Expires: ${formatDate(url.expiresAt)}`}
                >
                  <CalendarIcon size={12} />
                  <span>{isExpired ? 'Expired' : `Exp: ${formatDate(url.expiresAt)}`}</span>
                </div>
              )}
            </div>
          </div>

          {/* Destination URL row */}
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="font-semibold text-foreground/80 shrink-0">Target:</span>
            <a
              href={url.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-foreground hover:underline"
              title={url.originalUrl}
            >
              {truncateUrl(url.originalUrl, 60)}
            </a>
          </div>

          {/* Bottom row: Created date + Quick action buttons */}
          <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
            {isEditingAlias ? (
              <form onSubmit={handleSaveAlias} className="flex items-center gap-1.5 py-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground">/</span>
                <input
                  type="text"
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  placeholder="new-alias"
                  disabled={isSavingAlias}
                  className="h-7 w-32 rounded border border-input bg-background px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingAlias}
                  className="h-7 px-2 text-[11px]"
                >
                  {isSavingAlias ? '...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditingAlias(false);
                    setAliasInput(url.customAlias || '');
                  }}
                  className="h-7 px-1.5 text-muted-foreground hover:text-foreground"
                >
                  <CloseIcon size={12} />
                </Button>
              </form>
            ) : (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span>Created {formatDate(url.createdAt)}</span>
                {url.customAlias ? (
                  <>
                    <span>&bull;</span>
                    <span>Alias:</span>
                    <span className="font-mono font-medium text-foreground">{url.customAlias}</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingAlias(true)}
                      className="text-muted-foreground hover:text-foreground ml-0.5 p-0.5 rounded transition-colors"
                      title="Edit custom alias"
                    >
                      <EditIcon size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingAlias(true)}
                      className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
                    >
                      <EditIcon size={11} />
                      <span>+ Alias</span>
                    </button>
                  </>
                )}
              </span>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              {/* Copy button */}
              <Button
                type="button"
                variant={copied ? 'default' : 'outline'}
                size="sm"
                className={`h-8 px-2.5 text-xs gap-1 font-medium transition-all ${
                  copied ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                }`}
                onClick={handleCopy}
                title="Copy short link"
              >
                {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>

              {/* QR Code button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => onOpenQr(url)}
                title="View QR Code"
              >
                <QrCodeIcon size={13} />
                <span>QR</span>
              </Button>

              {/* Visit Link button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={handleVisit}
                title="Open in new tab"
              >
                <ExternalLinkIcon size={13} />
              </Button>

              {/* Delete button with 2-step confirmation */}
              <Button
                type="button"
                variant={confirmDelete ? 'destructive' : 'ghost'}
                size="sm"
                className={`h-8 px-2 text-xs transition-colors ${
                  confirmDelete
                    ? ''
                    : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                }`}
                onClick={handleDelete}
                title={confirmDelete ? 'Click again to confirm delete' : 'Delete link'}
              >
                <TrashIcon size={13} />
                {confirmDelete && <span className="ml-1 text-[11px]">Confirm?</span>}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const UrlList: React.FC = () => {
  const { urls, loading, searchQuery, sortBy, setSearchQuery, setSortBy, fetchUrls } = useUrlStore();
  const [selectedQrUrl, setSelectedQrUrl] = useState<ShortUrlResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredUrls = useMemo(() => {
    let list = [...urls];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.shortCode.toLowerCase().includes(q) ||
          u.originalUrl.toLowerCase().includes(q) ||
          (u.customAlias && u.customAlias.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'clicks') {
      list.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    }

    return list;
  }, [urls, searchQuery, sortBy]);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUrls();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.info('URLs refreshed');
  };

  return (
    <section className="w-full space-y-4">
      {/* List Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Your Short Links
          </h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {filteredUrls.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="h-9 px-3 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Refresh link stats"
          >
            <RefreshIcon size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden xs:inline">Refresh</span>
          </Button>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-9 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Sort short URLs"
          >
            <option value="newest">Newest First</option>
            <option value="clicks">Most Clicks</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-muted-foreground pointer-events-none">
          <SearchIcon size={15} />
        </span>
        <input
          type="search"
          placeholder="Search by code, alias, or destination URL..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-8 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && filteredUrls.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 rounded-xl border border-border/60 bg-muted/20 animate-pulse p-4"
            />
          ))}
        </div>
      ) : filteredUrls.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border border-dashed border-border/80 p-8 text-center bg-card/30">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
            <SearchIcon size={22} />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery ? 'No matching links found' : 'No short URLs yet'}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `No links matched "${searchQuery}". Try a different keyword.`
              : 'Paste any long link above and click "Shorten URL" to create your first short link!'}
          </p>
          {searchQuery && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="mt-3 h-8 text-xs"
            >
              Clear Search Filter
            </Button>
          )}
        </div>
      ) : (
        /* Render Cards */
        <div className="space-y-3">
          {filteredUrls.map((url) => (
            <UrlCard
              key={url.id}
              url={url}
              onOpenQr={(u) => setSelectedQrUrl(u)}
            />
          ))}
        </div>
      )}

      {/* QR Preview Modal */}
      <QrModal
        url={selectedQrUrl}
        isOpen={Boolean(selectedQrUrl)}
        onClose={() => setSelectedQrUrl(null)}
      />
    </section>
  );
};