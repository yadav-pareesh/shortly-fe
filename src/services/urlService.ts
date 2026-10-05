import api, { getApiErrorMessage } from '../lib/api';
import type { CreateUrlRequest, ShortUrlResponse } from '../types';

const LOCAL_STORAGE_KEY = 'shortly_saved_urls';

// Helper to generate a reliable QR Code URL
const generateQrUrl = (url: string) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}&color=0-0-0&bgcolor=255-255-255&margin=1`;
};

// Initial starter links if empty (for preview/offline mode)
const DEFAULT_DEMO_URLS: ShortUrlResponse[] = [
  {
    id: 'demo-1',
    shortCode: 'react-docs',
    shortUrl: 'https://short.ly/react-docs',
    originalUrl: 'https://react.dev/reference/react',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    expiresAt: null,
    clicks: 142,
    customAlias: 'react-docs',
    qrCode: generateQrUrl('https://short.ly/react-docs'),
  },
  {
    id: 'demo-2',
    shortCode: 'vite-guide',
    shortUrl: 'https://short.ly/vite-guide',
    originalUrl: 'https://vite.dev/guide/',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 24 * 14).toISOString(),
    clicks: 89,
    customAlias: 'vite-guide',
    qrCode: generateQrUrl('https://short.ly/vite-guide'),
  },
  {
    id: 'demo-3',
    shortCode: 'k9x7qm',
    shortUrl: 'https://short.ly/k9x7qm',
    originalUrl: 'https://github.com/features/actions',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    expiresAt: null,
    clicks: 34,
    customAlias: null,
    qrCode: generateQrUrl('https://short.ly/k9x7qm'),
  },
];

const getLocalUrls = (): ShortUrlResponse[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_URLS));
      return DEFAULT_DEMO_URLS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DEMO_URLS;
  }
};

const saveLocalUrls = (urls: ShortUrlResponse[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(urls));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
};

export const urlService = {
  createShortUrl: async (payload: CreateUrlRequest): Promise<{ data: ShortUrlResponse; isOffline: boolean }> => {
    try {
      const response = await api.post('/urls', payload);
      const data: ShortUrlResponse = response.data.data;
      
      // Keep local storage in sync
      const current = getLocalUrls().filter((u) => u.id !== data.id);
      saveLocalUrls([data, ...current]);
      
      return { data, isOffline: false };
    } catch (err: unknown) {
      const axiosError = err as { code?: string; response?: { status?: number } };
      const isNetworkIssue = 
        axiosError?.code === 'ERR_NETWORK' || 
        axiosError?.code === 'ECONNABORTED' ||
        !axiosError?.response;

      if (!isNetworkIssue) {
        throw new Error(getApiErrorMessage(err));
      }

      // Offline / Local storage fallback
      console.info('Backend unreachable, using client-side offline storage for URL creation.');
      const localUrls = getLocalUrls();
      const code = payload.customAlias?.trim() || Math.random().toString(36).substring(2, 8);

      if (payload.customAlias && localUrls.some((u) => u.shortCode.toLowerCase() === payload.customAlias?.toLowerCase())) {
        throw new Error('This custom alias is already in use. Please choose another one.');
      }

      const shortUrl = `${window.location.origin}/${code}`;
      const newUrl: ShortUrlResponse = {
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        shortCode: code,
        shortUrl,
        originalUrl: payload.originalUrl,
        createdAt: new Date().toISOString(),
        expiresAt: payload.expiresAt || null,
        clicks: 0,
        customAlias: payload.customAlias || null,
        qrCode: generateQrUrl(shortUrl),
      };

      saveLocalUrls([newUrl, ...localUrls]);
      return { data: newUrl, isOffline: true };
    }
  },

  getAllUrls: async (): Promise<{ data: ShortUrlResponse[]; isOffline: boolean }> => {
    try {
      const response = await api.get('/urls');
      const data: ShortUrlResponse[] = response.data.data || [];
      if (Array.isArray(data)) {
        saveLocalUrls(data);
      }
      return { data, isOffline: false };
    } catch {
      // Backend not running, use local URLs
      const localData = getLocalUrls();
      return { data: localData, isOffline: true };
    }
  },

  getUrlStats: async (shortCode: string): Promise<ShortUrlResponse> => {
    try {
      const response = await api.get(`/urls/${shortCode}/stats`);
      return response.data.data;
    } catch {
      const localUrls = getLocalUrls();
      const found = localUrls.find((u) => u.shortCode === shortCode);
      if (found) return found;
      throw new Error('URL not found');
    }
  },

  updateUrl: async (shortCode: string, customAlias: string): Promise<ShortUrlResponse> => {
    try {
      const response = await api.put(`/urls/${shortCode}`, { customAlias });
      const updated = response.data.data;
      const localUrls = getLocalUrls().map((u) => (u.shortCode === shortCode ? updated : u));
      saveLocalUrls(localUrls);
      return updated;
    } catch (err) {
      const localUrls = getLocalUrls();
      const index = localUrls.findIndex((u) => u.shortCode === shortCode);
      if (index === -1) throw new Error('URL not found');
      
      const updated: ShortUrlResponse = {
        ...localUrls[index],
        customAlias,
        shortCode: customAlias,
        shortUrl: `${window.location.origin}/${customAlias}`,
      };
      localUrls[index] = updated;
      saveLocalUrls(localUrls);
      return updated;
    }
  },

  recordClick: async (shortCode: string): Promise<void> => {
    try {
      // Try to report to backend if supported
      await api.post(`/urls/${shortCode}/click`).catch(() => {});
    } finally {
      // Always increment in local storage for instant UI responsiveness
      const localUrls = getLocalUrls();
      const updated = localUrls.map((u) => (u.shortCode === shortCode ? { ...u, clicks: u.clicks + 1 } : u));
      saveLocalUrls(updated);
    }
  },

  deleteUrl: async (shortCode: string): Promise<void> => {
    try {
      await api.delete(`/urls/${shortCode}`);
    } catch (e) {
      console.warn('Backend delete failed, removing locally:', e);
    } finally {
      const localUrls = getLocalUrls().filter((u) => u.shortCode !== shortCode);
      saveLocalUrls(localUrls);
    }
  },
};