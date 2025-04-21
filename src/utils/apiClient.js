import axios from 'axios';

// Configure API base URL based on environment
const API_URL = import.meta.env.MODE === 'development'
  ? '/api' // Local development using Vite proxy
  : 'https://wellsapi.onrender.com/api'; // Production URL

console.log('API URL configured as:', API_URL);

// Enable debugging for all Axios requests
if (import.meta.env.DEV) {
  axios.interceptors.request.use(request => {
    console.log('Axios debugging enabled - all requests will be logged');
    return request;
  });
}

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