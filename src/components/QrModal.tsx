import React, { useEffect } from 'react';
import type { ShortUrlResponse } from '../types';
import { Button } from './ui/button';
import { DownloadIcon, ShareIcon, CloseIcon, ExternalLinkIcon } from './Icons';
import { toast } from '../store/useToastStore';
import { copyToClipboard } from '../lib/utils';

interface QrModalProps {
  url: ShortUrlResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({ url, isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !url) return null;

  const handleDownload = async () => {
    try {
      if (url.qrCode.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = url.qrCode;
        link.download = `shortly-qr-${url.shortCode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR Code downloaded!');
        return;
      }

      const response = await fetch(url.qrCode);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `shortly-qr-${url.shortCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('QR Code downloaded!');
    } catch {
      window.open(url.qrCode, '_blank');
      toast.info('QR Code opened in new tab');
    }
  };

  const handleShare = async () => {
    if (navigator?.share) {
      try {
        await navigator.share({
          title: `Short link: ${url.shortUrl}`,
          text: `Scan or visit: ${url.shortUrl}`,
          url: url.shortUrl,
        });
        toast.success('Shared successfully!');
      } catch {
        // User cancelled or unsupported
      }
    } else {
      await copyToClipboard(url.shortUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border/80 bg-card p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <CloseIcon size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <h3 id="qr-modal-title" className="text-lg font-bold text-foreground">
            QR Code
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Scan with any smartphone camera to visit
          </p>

          <div className="mt-5 rounded-xl border border-border/70 bg-white p-3 shadow-inner">
            <img
              src={url.qrCode}
              alt={`QR Code for ${url.shortUrl}`}
              className="h-44 w-44 object-contain"
              loading="lazy"
            />
          </div>

          <div className="mt-4 w-full rounded-lg bg-muted/60 p-2.5">
            <p className="font-mono text-sm font-semibold text-primary truncate">
              {url.shortUrl}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {url.originalUrl}
            </p>
          </div>

          <div className="mt-5 flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex-1 gap-1.5 h-9"
            >
              <DownloadIcon size={15} />
              Download PNG
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex-1 gap-1.5 h-9"
            >
              <ShareIcon size={15} />
              Share
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 px-3"
              asChild
            >
              <a href={url.shortUrl} target="_blank" rel="noopener noreferrer" title="Open Link">
                <ExternalLinkIcon size={15} />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
