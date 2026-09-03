import api from '../lib/api';
import type { CreateUrlRequest, ShortUrlResponse } from '../types';

export const urlService = {
  createShortUrl: async (payload: CreateUrlRequest): Promise<ShortUrlResponse> => {
    const response = await api.post('/urls', payload);
    return response.data.data;
  },

  getAllUrls: async (): Promise<ShortUrlResponse[]> => {
    const response = await api.get('/urls');
    return response.data.data;
  },

  getUrlStats: async (shortCode: string): Promise<ShortUrlResponse> => {
    const response = await api.get(`/urls/${shortCode}/stats`);
    return response.data.data;
  },

  updateUrl: async (shortCode: string, customAlias: string): Promise<ShortUrlResponse> => {
    const response = await api.put(`/urls/${shortCode}`, { customAlias });
    return response.data.data;
  },

  deleteUrl: async (shortCode: string): Promise<void> => {
    await api.delete(`/urls/${shortCode}`);
  },
};