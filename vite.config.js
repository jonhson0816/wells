import axios from 'axios';

// Determine the base URL based on environment
const isDevelopment = import.meta.env.DEV;
const API_URL = isDevelopment
  ? '/api' // This will use the Vite proxy in development
  : 'https://wellsapi.onrender.com/api'; // Direct URL in production

// Create a single API client instance to be used throughout the app
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    // Log the request URL for debugging
    console.log('Making request to:', config.baseURL + config.url);
    
    const token = localStorage.getItem('wellsFargoAuthToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Export the base URL and API instance
export const apiBaseUrl = API_URL;
export default api;