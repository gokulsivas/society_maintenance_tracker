import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for attaching auth token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth expiration handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      // Dispatch custom event so AuthContext can update state without hard reload
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/**
 * Format error message from API response cleanly
 */
export function getErrorMessage(error, defaultMsg = 'An unexpected error occurred.') {
  if (!error) return defaultMsg;
  if (typeof error === 'string') return error;

  const detail = error.response?.data?.detail;
  if (detail) {
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg || `${d.loc?.join('.')} is invalid`).join(', ');
    }
    if (typeof detail === 'object') return JSON.stringify(detail);
  }
  return error.message || defaultMsg;
}

/**
 * Check if error is due to an intentional request abortion/cancellation
 */
export function isRequestCanceled(error) {
  return axios.isCancel(error) || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED';
}

export default apiClient;
