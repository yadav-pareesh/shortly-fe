import React, { useState } from 'react';
import { useUrlStore } from '../store/useUrlStore';
import { urlService } from '../services/urlService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { CreateUrlRequest } from '../types';
import { getApiErrorMessage } from '../lib/api';

// ============================================================================
// TYPES
// ============================================================================
export interface UrlResponse {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
  expiresAt: string | null;
  clicks: number;
  customAlias: string | null;
  qrCode: string;
}

type FieldErrors = Partial<Record<'originalUrl' | 'customAlias' | 'expiresAt', string>>;

// ============================================================================
// MAIN CONTAINER COMPONENT (Logic & State Management)
// ============================================================================
export const CreateUrlForm: React.FC = () => {
  const [formData, setFormData] = useState<CreateUrlRequest>({ originalUrl: '', customAlias: '', expiresAt: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [createdUrl, setCreatedUrl] = useState<UrlResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  
  const { addUrl } = useUrlStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || undefined }));
    if (name in fieldErrors) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextFieldErrors: FieldErrors = {};

    try {
      const parsedUrl = new URL(formData.originalUrl || '');
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        nextFieldErrors.originalUrl = 'Enter a URL that starts with http:// or https://.';
      }
    } catch {
      nextFieldErrors.originalUrl = 'Enter a valid URL, such as https://example.com.';
    }

    if (formData.customAlias && !/^[a-zA-Z0-9_-]+$/.test(formData.customAlias)) {
      nextFieldErrors.customAlias = 'Use only letters, numbers, hyphens, and underscores.';
    }

    if (formData.expiresAt && new Date(formData.expiresAt).getTime() <= Date.now()) {
      nextFieldErrors.expiresAt = 'Choose a date and time in the future.';
    }

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const payload = {
        originalUrl: formData.originalUrl,
        ...(formData.customAlias ? { customAlias: formData.customAlias } : {}),
        ...(formData.expiresAt ? { expiresAt: formData.expiresAt } : {}),
      };
      const url = await urlService.createShortUrl(payload);
      addUrl(url);
      setCreatedUrl(url);
      setFormData({ originalUrl: '', customAlias: '', expiresAt: '' });
    } catch (err: unknown) {
      const errorMessage = getApiErrorMessage(err, 'Failed to create short URL. Please try again.');
      if (errorMessage.toLowerCase().includes('custom alias')) {
        setFieldErrors({ customAlias: 'This custom alias is already in use. Choose another one.' });
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdUrl) return;
    
    // Safety check for secure contexts (HTTPS)
    if (!navigator?.clipboard) {
      console.warn('Clipboard API is not available in this environment.');
      return;
    }

    try {
      await navigator.clipboard.writeText(createdUrl.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err: unknown) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownloadQr = async () => {
    if (!createdUrl) return;
    try {
      const response = await fetch(createdUrl.qrCode);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${createdUrl.shortCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.warn('CORS or network issue downloading QR, falling back to new tab.', err);
      window.open(createdUrl.qrCode, '_blank');
    }
  };

  const handleShare = async () => {
    if (!createdUrl) return;
    
    if (navigator?.share) {
      try {
        try {
          const response = await fetch(createdUrl.qrCode);
          const blob = await response.blob();
          const file = new File([blob], `qr-${createdUrl.shortCode}.png`, { type: 'image/png' });
          await navigator.share({ title: 'My Short URL QR Code', files: [file] });
          return;
        } catch (fetchErr: unknown) {
          console.log("Could not fetch image for native share, falling back to text link.");
        }
        
        await navigator.share({
          title: 'Check out this link',
          text: 'I shortened this link, check it out:',
          url: createdUrl.shortUrl,
        });
      } catch (err: unknown) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy();
      alert("Link copied to clipboard! Paste it to share.");
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
        <SuccessCard 
          url={createdUrl} 
          copied={copied} 
          onCopy={handleCopy} 
          onDownloadQr={handleDownloadQr} 
          onShare={handleShare} 
          onReset={handleReset} 
        />
      ) : (
        <UrlInputForm 
          formData={formData} 
          loading={loading} 
          error={error} 
          fieldErrors={fieldErrors}
          onChange={handleChange} 
          onSubmit={handleSubmit} 
        />
      )}
    </div>
  );
};

// ============================================================================
// PRESENTER COMPONENT 1: Form UI
// ============================================================================
interface UrlInputFormProps {
  formData: CreateUrlRequest;
  loading: boolean;
  error: string | null;
  fieldErrors: FieldErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const UrlInputForm: React.FC<UrlInputFormProps> = ({ formData, loading, error, fieldErrors, onChange, onSubmit }) => (
  <div className="animate-in fade-in duration-300">
    <div className="mb-4 text-center">
      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
        Create Short URL
      </h2>
    </div>

    <form onSubmit={onSubmit} noValidate className="space-y-4 text-left">
      {/* Original URL */}
      <div className="space-y-1.5">
        <label htmlFor="originalUrl" className="text-sm font-medium leading-none">
          Original URL <span className="text-destructive">*</span>
        </label>
        <Input
          id="originalUrl"
          name="originalUrl"
          type="url"
          placeholder="https://example.com/very/long/url"
          value={formData.originalUrl}
          onChange={onChange}
          required
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.originalUrl)}
          aria-describedby={fieldErrors.originalUrl ? 'originalUrl-error' : undefined}
          className={`h-10 bg-background ${fieldErrors.originalUrl ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        />
        {fieldErrors.originalUrl && <p id="originalUrl-error" role="alert" className="text-xs text-destructive">{fieldErrors.originalUrl}</p>}
      </div>

      {/* Grid Layout for compact vertical spacing on desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Custom Alias */}
        <div className="space-y-1.5">
          <label htmlFor="customAlias" className="text-sm font-medium leading-none">
            Custom Alias <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
          </label>
          <Input
            id="customAlias"
            name="customAlias"
            type="text"
            placeholder="my-link"
            value={formData.customAlias || ''}
            onChange={onChange}
            disabled={loading}
            pattern="[a-zA-Z0-9_-]+"
            aria-invalid={Boolean(fieldErrors.customAlias)}
            aria-describedby={fieldErrors.customAlias ? 'customAlias-error' : undefined}
            className={`h-10 bg-background ${fieldErrors.customAlias ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {fieldErrors.customAlias ? (
            <p id="customAlias-error" role="alert" className="text-xs leading-tight text-destructive">{fieldErrors.customAlias}</p>
          ) : (
            <p className="text-[11px] leading-tight text-muted-foreground">Letters, numbers, hyphens, underscores.</p>
          )}
        </div>

        {/* Expiration Date */}
        <div className="space-y-1.5">
          <label htmlFor="expiresAt" className="text-sm font-medium leading-none">
            Expiration Date <span className="text-destructive">*</span>
          </label>
          <Input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            value={formData.expiresAt || ''}
            onChange={onChange}
            required
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.expiresAt)}
            aria-describedby={fieldErrors.expiresAt ? 'expiresAt-error' : undefined}
            className={`h-10 bg-background ${fieldErrors.expiresAt ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {fieldErrors.expiresAt && <p id="expiresAt-error" role="alert" className="text-xs text-destructive">{fieldErrors.expiresAt}</p>}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-sm text-destructive">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <Button type="submit" className="h-10 w-full font-medium" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : 'Shorten URL'}
        </Button>
      </div>
    </form>
  </div>
);

// ============================================================================
// PRESENTER COMPONENT 2: Success UI
// ============================================================================
interface SuccessCardProps {
  url: UrlResponse;
  copied: boolean;
  onCopy: () => void;
  onDownloadQr: () => void;
  onShare: () => void;
  onReset: () => void;
}

const SuccessCard: React.FC<SuccessCardProps> = ({ url, copied, onCopy, onDownloadQr, onShare, onReset }) => (
  <div className="w-full animate-in fade-in zoom-in-95 duration-300 text-left">
    <div className="mb-4 flex flex-col items-center justify-center space-y-1 text-center">
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">URL Shortened!</h2>
    </div>

    <div className="rounded-xl border bg-card p-4 shadow-sm">
      {/* Shortened URL Row */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-2">
        <a href={url.shortUrl} target="_blank" rel="noopener noreferrer" className="truncate px-2 text-base font-medium text-primary hover:underline">
          {url.shortUrl}
        </a>
        <Button type="button" size="sm" variant={copied ? "default" : "secondary"} className={`h-8 shrink-0 transition-all ${copied ? "bg-green-600 text-white hover:bg-green-700" : ""}`} onClick={onCopy}>
          {copied ? (
            <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5"><polyline points="20 6 9 17 4 12" /></svg> Copied</>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg> Copy</>
          )}
        </Button>
      </div>

      {/* Details & QR Row */}
      <div className="flex items-center gap-4">
        {/* QR Section */}
        <div className="flex shrink-0 flex-col gap-2">
          <div className="rounded-md border bg-white p-1.5 shadow-sm">
            <img src={url.qrCode} alt="QR Code" className="h-20 w-20 object-contain" />
          </div>
          <div className="flex w-full justify-between gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={onDownloadQr} title="Save QR">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={onShare} title="Share QR">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
            </Button>
          </div>
        </div>
        
        {/* URL Meta Section */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 text-[13px]">
          <div>
            <span className="block font-medium text-foreground">Destination:</span>
            <a href={url.originalUrl} target="_blank" rel="noopener noreferrer" className="line-clamp-1 break-all text-muted-foreground hover:text-foreground hover:underline">
              {url.originalUrl}
            </a>
          </div>
          {url.expiresAt && (
            <div>
              <span className="block font-medium text-foreground">Expires:</span>
              <span className="text-muted-foreground">
                {new Date(url.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>

    <div className="mt-4 flex justify-center">
      <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground hover:text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5"><path d="M5 12h14" /><path d="M12 5l-7 7 7 7" /></svg>
        Shorten another URL
      </Button>
    </div>
  </div>
);