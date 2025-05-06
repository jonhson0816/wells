import axios from 'axios';

const API_CONFIG = {
  baseURL: import.meta.env.MODE === 'development' 
    ? '/api' 
    : 'https://wellsapi.onrender.com/api'
};

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add secure token handling
api.interceptors.request.use(
  (config) => {
    // Get token from secure storage
    const getSecureToken = () => {
      try {
        const encrypted = sessionStorage.getItem('secure_authToken');
        if (!encrypted) return null;
        
        return decodeURIComponent(atob(encrypted));
      } catch (e) {
        console.error('Error getting secure token:', e);
        return null;
      }
    };
    
    // Get token from secure storage
    const token = getSecureToken();
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;