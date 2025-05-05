import axios from 'axios';

// Get the API URL from environment variables
const API_URL = import.meta.env?.VITE_API_URL || 'https://wellsapi.onrender.com';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: allows cookies to be sent with requests
});

// Request interceptor to handle auth
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;