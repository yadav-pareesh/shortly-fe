import React, { useState } from 'react';
import { useUrlStore } from '../store/useUrlStore';
import { urlService } from '../services/urlService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { CreateUrlRequest, ShortUrlResponse } from '../types';
import { getApiErrorMessage } from '../lib/api';
import { normalizeUrl, isValidUrl, copyToClipboard } from '../lib/utils';
import { toast } from '../store/useToastStore';
import {
  LinkIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  ShareIcon,
  ExternalLinkIcon,
  CalendarIcon,
  SparklesIcon,
} from './Icons';

type FieldErrors = Partial<Record<'originalUrl' | 'customAlias' | 'expiresAt', string>>;

export const CreateUrlForm: React.FC = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [createdUrl, setCreatedUrl] = useState<ShortUrlResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const { addUrl } = useUrlStore();

  const handlePaste = async () => {
    if (navigator?.clipboard?.readText) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          setOriginalUrl(text.trim());
          if (fieldErrors.originalUrl) {
            setFieldErrors((prev) => ({ ...prev, originalUrl: undefined }));
          }
          toast.info('Pasted from clipboard');
        }
      } catch {
        // User denied clipboard access or not in secure context
      }
    }
  };

  const setExpiryPreset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    // Format for datetime-local
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setExpiresAt(formatted);
    if (fieldErrors.expiresAt) {
      setFieldErrors((prev) => ({ ...prev, expiresAt: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors: FieldErrors = {};

    const cleanUrl = originalUrl.trim();
    if (!cleanUrl) {
      nextErrors.originalUrl = 'Please enter a URL to shorten.';
    } else if (!isValidUrl(cleanUrl)) {
      nextErrors.originalUrl = 'Please enter a valid URL (e.g. example.com or https://example.com).';
    }

    const cleanAlias = customAlias.trim();
    if (cleanAlias && !/^[a-zA-Z0-9_-]+$/.test(cleanAlias)) {
      nextErrors.customAlias = 'Only letters, numbers, hyphens, and underscores are allowed.';
    }

    if (expiresAt) {
      const expiryTime = new Date(expiresAt).getTime();
      if (isNaN(expiryTime) || expiryTime <= Date.now()) {
        nextErrors.expiresAt = 'Expiration date must be in the future.';
      }
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const payload: CreateUrlRequest = {
        originalUrl: normalizeUrl(cleanUrl),
        ...(cleanAlias ? { customAlias: cleanAlias } : {}),
        ...(expiresAt ? { expiresAt } : {}),
      };

      const result = await urlService.createShortUrl(payload);
      addUrl(result.data);
      setCreatedUrl(result.data);
      setOriginalUrl('');
      setCustomAlias('');
      setExpiresAt('');
      setShowAdvanced(false);
      toast.success('Short link generated!');
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Failed to create short URL. Please try again.');
      if (msg.toLowerCase().includes('alias')) {
        setFieldErrors({ customAlias: msg });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdUrl) return;
    const ok = await copyToClipboard(createdUrl.shortUrl);
    if (ok) {
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadQr = async () => {
    if (!createdUrl) return;
    try {
      if (createdUrl.qrCode.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = createdUrl.qrCode;
        link.download = `shortly-${createdUrl.shortCode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR Code downloaded!');
        return;
      }

      const response = await fetch(createdUrl.qrCode);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `shortly-${createdUrl.shortCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('QR Code downloaded!');
    } catch {
      window.open(createdUrl.qrCode, '_blank');
      toast.info('QR Code opened in new tab');
    }
  };

  const handleShare = async () => {
    if (!createdUrl) return;
    if (navigator?.share) {
      try {
        await navigator.share({
          title: `Short URL: ${createdUrl.shortUrl}`,
          text: `Check out this link: ${createdUrl.shortUrl}`,
          url: createdUrl.shortUrl,
        });
        toast.success('Shared successfully!');
      } catch {
        // User dismissed
      }
    } else {
      await handleCopy();
    }
  };

  const handleReset = () => {
    setCreatedUrl(null);
    setCopied(false);
    setError(null);
    setFieldErrors({});
  };

  return (
    <div className="w-full">
      {createdUrl ? (
        /* Result Success Card */
        <div className="w-full animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckIcon size={14} /> Link Created Successfully
            </span>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm">
            {/* Short URL Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-xl border border-border/70 bg-muted/30 p-2.5 sm:p-3">
              <a
                href={createdUrl.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-base sm:text-lg font-bold text-primary truncate hover:underline px-1"
              >
                {createdUrl.shortUrl}
              </a>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant={copied ? 'default' : 'secondary'}
                  className={`h-9 px-3.5 transition-all font-medium ${
                    copied ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                  }`}
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <CheckIcon size={14} className="mr-1.5" /> Copied
                    </>
                  ) : (
                    <>
                      <CopyIcon size={14} className="mr-1.5" /> Copy
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a
                    href={createdUrl.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open short link"
                  >
                    <ExternalLinkIcon size={14} />
                  </a>
                </Button>
              </div>
            </div>

            {/* Details + QR section */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* QR Preview */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/50 bg-muted/10 text-center">
                <div className="rounded-lg border border-border/70 bg-white p-2 shadow-xs">
                  <img
                    src={createdUrl.qrCode}
                    alt="QR Code"
                    className="h-24 w-24 object-contain"
                  />
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2 gap-1"
                    onClick={handleDownloadQr}
                  >
                    <DownloadIcon size={12} /> PNG
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2 gap-1"
                    onClick={handleShare}
                  >
                    <ShareIcon size={12} /> Share
                  </Button>
                </div>
              </div>

              {/* Destination Meta */}
              <div className="sm:col-span-2 flex flex-col justify-center space-y-2.5 text-xs sm:text-sm text-left px-1">
                <div>
                  <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Destination
                  </span>
                  <a
                    href={createdUrl.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-2 break-all font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {createdUrl.originalUrl}
                  </a>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">Created: </span>
                    {new Date(createdUrl.createdAt).toLocaleDateString()}
                  </div>
                  {createdUrl.expiresAt && (
                    <div>
                      <span className="font-semibold text-foreground">Expires: </span>
                      {new Date(createdUrl.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                  {createdUrl.customAlias && (
                    <div>
                      <span className="font-semibold text-foreground">Alias: </span>
                      <span className="font-mono">{createdUrl.customAlias}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground"
            >
              Shorten another link &rarr;
            </Button>
          </div>
        </div>
      ) : (
        /* Shorten Input Form */
        <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left">
          {/* Main Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="originalUrl"
              className="flex items-center justify-between text-xs sm:text-sm font-semibold text-foreground"
            >
              <span>Destination URL</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Paste any web address
              </span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-muted-foreground pointer-events-none">
                <LinkIcon size={18} />
              </span>
              <Input
                id="originalUrl"
                name="originalUrl"
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="https://example.com/very/long/destination/url"
                value={originalUrl}
                onChange={(e) => {
                  setOriginalUrl(e.target.value);
                  if (fieldErrors.originalUrl) {
                    setFieldErrors((prev) => ({ ...prev, originalUrl: undefined }));
                  }
                  if (error) setError(null);
                }}
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.originalUrl)}
                aria-describedby={fieldErrors.originalUrl ? 'url-error' : undefined}
                className={`h-12 pl-10 pr-20 text-sm sm:text-base bg-background transition-all ${
                  fieldErrors.originalUrl
                    ? 'border-destructive focus-visible:ring-destructive'
                    : 'focus-visible:ring-primary'
                }`}
              />
              <div className="absolute right-2 flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePaste}
                  disabled={loading}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  title="Paste from clipboard"
                >
                  Paste
                </Button>
              </div>
            </div>
            {fieldErrors.originalUrl && (
              <p id="url-error" role="alert" className="text-xs text-destructive mt-1 font-medium">
                {fieldErrors.originalUrl}
              </p>
            )}
          </div>

          {/* Advanced toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors"
            >
              <SparklesIcon size={13} />
              <span>{showAdvanced ? 'Hide advanced options' : 'Customize alias & expiration date'}</span>
              <span className="text-muted-foreground">({showAdvanced ? '−' : '+'})</span>
            </button>
          </div>

          {/* Advanced options container */}
          {showAdvanced && (
            <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Custom Alias */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="customAlias"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Custom Alias <span className="font-normal text-muted-foreground">(Optional)</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-medium text-muted-foreground select-none">
                      /
                    </span>
                    <Input
                      id="customAlias"
                      name="customAlias"
                      type="text"
                      placeholder="my-custom-link"
                      value={customAlias}
                      onChange={(e) => {
                        setCustomAlias(e.target.value);
                        if (fieldErrors.customAlias) {
                          setFieldErrors((prev) => ({ ...prev, customAlias: undefined }));
                        }
                      }}
                      disabled={loading}
                      aria-invalid={Boolean(fieldErrors.customAlias)}
                      aria-describedby={fieldErrors.customAlias ? 'alias-error' : undefined}
                      className={`h-10 pl-6 text-xs sm:text-sm bg-background ${
                        fieldErrors.customAlias ? 'border-destructive' : ''
                      }`}
                    />
                  </div>
                  {fieldErrors.customAlias ? (
                    <p id="alias-error" role="alert" className="text-xs text-destructive">
                      {fieldErrors.customAlias}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Letters, numbers, hyphens only.
                    </p>
                  )}
                </div>

                {/* Expiration Date */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="expiresAt"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Expiration Date <span className="font-normal text-muted-foreground">(Optional)</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-muted-foreground pointer-events-none">
                      <CalendarIcon size={14} />
                    </span>
                    <Input
                      id="expiresAt"
                      name="expiresAt"
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      value={expiresAt}
                      onChange={(e) => {
                        setExpiresAt(e.target.value);
                        if (fieldErrors.expiresAt) {
                          setFieldErrors((prev) => ({ ...prev, expiresAt: undefined }));
                        }
                      }}
                      disabled={loading}
                      aria-invalid={Boolean(fieldErrors.expiresAt)}
                      aria-describedby={fieldErrors.expiresAt ? 'expiry-error' : undefined}
                      className={`h-10 pl-9 text-xs sm:text-sm bg-background ${
                        fieldErrors.expiresAt ? 'border-destructive' : ''
                      }`}
                    />
                  </div>
                  {fieldErrors.expiresAt && (
                    <p id="expiry-error" role="alert" className="text-xs text-destructive">
                      {fieldErrors.expiresAt}
                    </p>
                  )}

                  {/* Expiry Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-muted-foreground">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setExpiryPreset(1)}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium hover:bg-muted/80 text-foreground transition-colors"
                    >
                      +24h
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpiryPreset(7)}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium hover:bg-muted/80 text-foreground transition-colors"
                    >
                      +7d
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpiryPreset(30)}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium hover:bg-muted/80 text-foreground transition-colors"
                    >
                      +30d
                    </button>
                    {expiresAt && (
                      <button
                        type="button"
                        onClick={() => setExpiresAt('')}
                        className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form-level Error Message */}
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive"
            >
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action */}
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full text-sm sm:text-base font-semibold shadow-md transition-all active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-current"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Shortening URL...
              </span>
            ) : (
              'Shorten URL'
            )}
          </Button>
        </form>
      )}
    </div>
  );
};