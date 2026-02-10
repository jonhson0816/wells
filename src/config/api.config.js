const API_CONFIG = {
    baseURL: import.meta.env.MODE === 'development' 
      ? '/api' 
      : 'https://wellsapi-1.onrender.com/api'
  };
  
  export default API_CONFIG;