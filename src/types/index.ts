export interface CreateUrlRequest {
  originalUrl: string;
  customAlias?: string;
  expiresAt?: string;
}

export interface ShortUrlResponse {
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

export interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}