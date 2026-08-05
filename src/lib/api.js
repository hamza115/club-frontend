import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '';

    if (status === 401) {
      // Only force logout if it's genuinely a token problem, not a permissions issue
      const isTokenError =
        message.toLowerCase().includes('token') ||
        message.toLowerCase().includes('not authorized') ||
        message.toLowerCase().includes('no token');

      if (isTokenError) {
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    // 403 = role denied — do NOT log out, just reject the promise
    return Promise.reject(error);
  },
);

export default api;
