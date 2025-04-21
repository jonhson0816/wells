import axios from 'axios';

// Always use the Render URL in production (when deployed to Vercel)
// Use relative URL in development for proxy
const API_URL = window.location.hostname === 'localhost' 
  ? '/api' // Local development using Vite proxy
  : 'https://wellsapi.onrender.com/api'; // Production URL

// Create API client instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authentication interceptor
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.baseURL + (config.url || ''));
    
    const token = localStorage.getItem('wellsFargoAuthToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;