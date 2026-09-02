import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000/api';
    }
  }
  return '/api';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept responses to handle Vercel SPA fallback
apiClient.interceptors.response.use(
  (response) => {
    // If we receive an HTML response (e.g. from Vercel's index.html rewrite) when expecting JSON
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<')) {
      const error = new Error('Received HTML instead of JSON API response');
      error.isVercelHtmlFallback = true;
      error.response = { status: 404 }; // Mock a 404 so our catch blocks treat it as unreachable API
      return Promise.reject(error);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
