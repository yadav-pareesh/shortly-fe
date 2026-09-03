import { create } from 'zustand';
import type { ShortUrlResponse } from '../types';
import { urlService } from '../services/urlService';
import { getApiErrorMessage } from '../lib/api';

interface UrlState {
  urls: ShortUrlResponse[];
  loading: boolean;
  error: string | null;
  setUrls: (urls: ShortUrlResponse[]) => void;
  addUrl: (url: ShortUrlResponse) => void;
  removeUrl: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchUrls: () => Promise<void>;
}

export const useUrlStore = create<UrlState>((set) => ({
  urls: [],
  loading: false,
  error: null,
  setUrls: (urls) => set({ urls }),
  addUrl: (url) => set((state) => ({ urls: [url, ...state.urls] })),
  removeUrl: (id) => set((state) => ({ urls: state.urls.filter((u) => u.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  fetchUrls: async () => {
    set({ loading: true, error: null });
    try {
      const urls = await urlService.getAllUrls();
      set({ urls });
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Unable to load your URLs right now.') });
    } finally {
      set({ loading: false });
    }
  },
}));