import { useEffect, useState } from 'react';
import { useUrlStore } from '../store/useUrlStore';
import { urlService } from '../services/urlService';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import type { ShortUrlResponse } from '../types';

interface UrlItemProps {
  url: ShortUrlResponse;
}

const UrlItem = ({ url }: UrlItemProps) => {
  const { removeUrl } = useUrlStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await urlService.deleteUrl(url.shortCode);
      removeUrl(url.id);
    } catch (error) {
      console.error('Failed to delete URL', error);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Short URL</p>
              <a
                href={url.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {url.shortUrl}
              </a>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Original URL</p>
              <a
                href={url.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all text-sm"
              >
                {url.originalUrl}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center py-2 bg-muted rounded-md">
            <div>
              <p className="text-xs text-muted-foreground">Clicks</p>
              <p className="font-semibold">{url.clicks}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-semibold text-sm">{new Date(url.createdAt).toLocaleDateString()}</p>
            </div>
            {url.customAlias && (
              <div>
                <p className="text-xs text-muted-foreground">Alias</p>
                <p className="font-semibold text-sm">{url.customAlias}</p>
              </div>
            )}
          </div>

          {url.qrCode && (
            <div className="flex justify-center">
              <img src={url.qrCode} alt="QR Code" className="w-24 h-24" />
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="flex-1">
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const UrlList = () => {
  const { urls, loading, fetchUrls } = useUrlStore();

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  if (loading && urls.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Loading URLs...
        </CardContent>
      </Card>
    );
  }

  if (urls.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No short URLs yet. Create one to get started!
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Your Short URLs</h2>
      {urls.map((url) => (
        <UrlItem key={url.id} url={url} />
      ))}
    </div>
  );
};