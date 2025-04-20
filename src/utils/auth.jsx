// utils/auth.js
export const getAuthToken = () => {
    return localStorage.getItem('wellsFargoAuthToken');
  };
  
  export const setAuthToken = (token) => {
    if (token) {
      localStorage.setItem('wellsFargoAuthToken', token);
    } else {
      localStorage.removeItem('wellsFargoAuthToken');
    }
  };
  
  export const checkTokenExpiration = () => {
    const token = getAuthToken();
    if (!token) return false;
    
    // If using JWT, you can decode and check expiration
    // This is a simplified example
    try {
      // Simple decode (in a real app, use a JWT library)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const { exp } = JSON.parse(jsonPayload);
      
      // Check if token is expired
      return Date.now() >= exp * 1000;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // If there's an error, consider token expired
    }
  };
  
  export const isAuthenticated = () => {
    const token = getAuthToken();
    return !!token && !checkTokenExpiration();
  };
  
  export const logout = () => {
    localStorage.removeItem('wellsFargoAuthToken');
    // Add any other cleanup needed
  };