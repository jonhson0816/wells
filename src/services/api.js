import axios from 'axios';

// Always use the Render URL in production (when deployed to Vercel)
// Use relative URL in development for proxy
const API_URL = import.meta.env.MODE === 'development' 
  ? '/api' // Local development using Vite proxy
  : 'https://wellsapi.onrender.com/api'; // Production URL

console.log('API URL configured as:', API_URL);

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

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging
    console.error('API Error:', error.response || error.message);
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear invalid authentication data
      localStorage.removeItem('wellsFargoAuthToken');
      localStorage.removeItem('wellsFargoUser');
      
      // Redirect to login page if needed
      // window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default api;