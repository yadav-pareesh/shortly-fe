import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  if (typeof error === 'string') return error;

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
    return 'Unable to reach the server. Make sure the backend server is running.';
  }

  if (axiosError?.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }

  if (axiosError?.response?.status === 400) {
    return 'Please check your details and try again.';
  }

  if (axiosError?.response?.status === 404) {
    return 'The requested resource was not found.';
  }

  if (axiosError?.response?.status === 409) {
    return 'This custom alias is already in use. Please pick another one.';
  }

  if (axiosError?.response?.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (axiosError?.response?.status === 500) {
    return 'Internal server error. Please try again shortly.';
  }

  if (typeof axiosError?.message === 'string' && axiosError.message.trim()) {
    return axiosError.message;
  }

  return fallback;
};

export default api;