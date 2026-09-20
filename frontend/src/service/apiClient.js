import axios from 'axios';

// In development Vite proxies /api to the backend (see vite.config.js), so the default needs no CORS.
// Set VITE_API_BASE_URL (e.g. https://api.example.com/api) when the frontend is hosted separately.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Fired when the backend rejects the stored token; AuthProvider reacts by logging the user out.
export const UNAUTHORIZED_EVENT = 'agrolink:unauthorized';

// No default Content-Type: axios sends JSON for plain objects, and the browser sets the multipart boundary for
// FormData. Forcing application/json broke file uploads (the backend answered 415).
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    // A wrong password on /auth/* is a 401 too, but it is not an expired session.
    if (error.response?.status === 401 && localStorage.getItem('token') && !url.startsWith('/auth/')) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
