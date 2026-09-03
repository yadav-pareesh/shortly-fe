import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  const axiosError = error as {
    response?: {
      status?: number;
      data?: {
        error?: string;
        message?: string;
        data?: Array<{ msg?: string; message?: string }> | unknown;
      };
    };
    code?: string;
    message?: string;
  };

  const responseData = axiosError?.response?.data;
  const validationErrors = Array.isArray(responseData?.data) ? responseData.data : [];

  const validationMessage = validationErrors
    .map((item) => (typeof item === 'object' && item !== null ? item.msg ?? item.message : undefined))
    .filter((message): message is string => Boolean(message))
    .join(' ');

  if (validationMessage) {
    return validationMessage;
  }

  if (typeof responseData?.error === 'string' && responseData.error.trim()) {
    return responseData.error;
  }

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message;
  }

  if (axiosError?.code === 'ERR_NETWORK') {
    return 'Unable to reach the server. Please check your internet connection and try again.';
  }

  if (axiosError?.code === 'ECONNABORTED') {
    return 'The request took too long. Please try again.';
  }

  if (axiosError?.response?.status === 400) {
    return 'Please check your details and try again.';
  }

  if (axiosError?.response?.status === 401) {
    return 'Your session has expired. Please refresh and try again.';
  }

  if (axiosError?.response?.status === 404) {
    return 'The requested page was not found.';
  }

  if (axiosError?.response?.status === 429) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (axiosError?.response?.status === 500) {
    return 'Something went wrong on our side. Please try again in a few moments.';
  }

  if (typeof axiosError?.message === 'string' && axiosError.message.trim()) {
    return axiosError.message;
  }

  return fallback;
};

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);

export default api;