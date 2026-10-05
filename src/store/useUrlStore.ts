import { create } from 'zustand';
import type { ShortUrlResponse, SortOption } from '../types';
import { urlService } from '../services/urlService';
import { getApiErrorMessage } from '../lib/api';

interface UrlState {
  urls: ShortUrlResponse[];
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  searchQuery: string;
  sortBy: SortOption;
  setUrls: (urls: ShortUrlResponse[]) => void;
  addUrl: (url: ShortUrlResponse) => void;
  removeUrl: (id: string, shortCode?: string) => Promise<void>;
  recordClick: (shortCode: string) => Promise<void>;
  setSearchQuery: (searchQuery: string) => void;
  setSortBy: (sortBy: SortOption) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateUrlAlias: (shortCode: string, newAlias: string) => Promise<ShortUrlResponse>;
  fetchUrls: () => Promise<void>;
}

export const useUrlStore = create<UrlState>((set) => ({
  urls: [],
  loading: false,
  error: null,
  isOffline: false,
  searchQuery: '',
  sortBy: 'newest',

  setUrls: (urls) => set({ urls }),
  addUrl: (url) => set((state) => ({ urls: [url, ...state.urls.filter((u) => u.id !== url.id)] })),
  
  removeUrl: async (id: string, shortCode?: string) => {
    // Optimistic delete
    set((state) => ({ urls: state.urls.filter((u) => u.id !== id) }));
    if (shortCode) {
      try {
        await urlService.deleteUrl(shortCode);
      } catch (e) {
        console.error('Failed to delete on server:', e);
      }
    }
  },

  recordClick: async (shortCode: string) => {
    set((state) => ({
      urls: state.urls.map((u) =>
        u.shortCode === shortCode ? { ...u, clicks: (u.clicks || 0) + 1 } : u
      ),
    }));
    await urlService.recordClick(shortCode);
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  updateUrlAlias: async (shortCode: string, newAlias: string) => {
    const updated = await urlService.updateUrl(shortCode, newAlias);
    set((state) => ({
      urls: state.urls.map((u) => (u.shortCode === shortCode || u.customAlias === shortCode ? updated : u)),
    }));
    return updated;
  },

  fetchUrls: async () => {
    set({ loading: true, error: null });
    try {
      const { data, isOffline } = await urlService.getAllUrls();
      set({ urls: data, isOffline });
    } catch (error) {
      set({
        error: getApiErrorMessage(error, 'Unable to load URLs.'),
        isOffline: true,
      });
    } finally {
      set({ loading: false });
    }
  },
}));