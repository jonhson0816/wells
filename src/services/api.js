import axios from 'axios';

// Use a consistent API URL across the entire application
const API_URL = 'https://wellsapi.onrender.com/api';

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