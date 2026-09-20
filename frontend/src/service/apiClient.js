import axios from 'axios';

// In development Vite proxies /api to the backend (see vite.config.js), so the default needs no CORS.
// Set VITE_API_BASE_URL (e.g. https://api.example.com/api) when the frontend is hosted separately.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
