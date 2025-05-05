import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

// Create the context
const AuthContext = createContext();

// Create a hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenExpires, setTokenExpires] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Check if user is authenticated
  const isAuthenticated = () => {
    // Check for user and token expiration
    if (!currentUser) return false;
    
    // If we have expiration time, check if token is still valid
    if (tokenExpires) {
      const now = new Date().getTime();
      return now < tokenExpires;
    }
    
    // Default to true if we have a user but no expiration info
    return true;
  };

  useEffect(() => {
    // Check for user session on component mount
    checkUserSession();
    
    // Set up token refresh interval
    const refreshInterval = setInterval(() => {
      if (isAuthenticated()) {
        refreshToken();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Check user session
  const checkUserSession = async () => {
    try {
      setLoading(true);
      
      // Check if we have auth flag in storage
      const hasSession = localStorage.getItem('auth_session') === 'true';
      
      if (!hasSession) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      
      // Validate session with backend
      const response = await api.get('/auth/me');
      
      if (response.data.success) {
        setCurrentUser(response.data.user);
        
        // Set token expiration time if provided
        if (response.data.expiresAt) {
          setTokenExpires(new Date(response.data.expiresAt).getTime());
        } else {
          // Default token expiration to 1 hour from now
          setTokenExpires(new Date().getTime() + 60 * 60 * 1000);
        }
      } else {
        clearUserData();
      }
    } catch (error) {
      console.error('Session check failed:', error);
      clearUserData();
    } finally {
      setLoading(false);
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      
      if (response.data.success) {
        // Update token expiration time if provided by backend
        if (response.data.expiresAt) {
          setTokenExpires(new Date(response.data.expiresAt).getTime());
        } else {
          // Default token expiration to 1 hour from now if not provided
          setTokenExpires(new Date().getTime() + 60 * 60 * 1000);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Clear user data
  const clearUserData = () => {
    localStorage.removeItem('auth_session');
    setCurrentUser(null);
    setTokenExpires(null);
    setAuthError(null);
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Clear any existing session for clean login
      clearUserData();
      
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        setCurrentUser(response.data.user);
        
        // Set token expiration time if provided
        if (response.data.expiresAt) {
          setTokenExpires(new Date(response.data.expiresAt).getTime());
        } else {
          // Default token expiration to 1 hour from now
          setTokenExpires(new Date().getTime() + 60 * 60 * 1000);
        }
        
        // Store session flag
        localStorage.setItem('auth_session', 'true');
        
        return { success: true };
      } else {
        setAuthError(response.data.error || 'Login failed');
        return { 
          success: false, 
          error: response.data.error || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      setAuthError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Clear any existing session for clean registration
      clearUserData();
      
      // Validate required fields
      if (!userData.email || !userData.password || !userData.name) {
        throw new Error('Required fields are missing');
      }
      
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        setCurrentUser(response.data.user);
        
        // Set token expiration time if provided
        if (response.data.expiresAt) {
          setTokenExpires(new Date(response.data.expiresAt).getTime());
        } else {
          // Default token expiration to 1 hour from now
          setTokenExpires(new Date().getTime() + 60 * 60 * 1000);
        }
        
        // Store session flag
        localStorage.setItem('auth_session', 'true');
        
        return { success: true };
      } else {
        setAuthError(response.data.error || 'Registration failed');
        return { 
          success: false, 
          error: response.data.error || 'Registration failed' 
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      setAuthError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Call backend to invalidate the token
      await api.post('/auth/logout');
      
      // Clear user data
      clearUserData();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still clear user data even if API call fails
      clearUserData();
      
      return { 
        success: false, 
        error: error.message || 'Logout failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updateData) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      const response = await api.put('/auth/update-profile', updateData);
      
      if (response.data.success) {
        // Update user data in state
        setCurrentUser({
          ...currentUser,
          ...response.data.user
        });
        
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Profile update failed';
      setAuthError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Reset password functionality
  const requestPasswordReset = async (email) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const response = await api.post('/auth/forgot-password', { email });
      
      return { 
        success: true, 
        message: response.data.message || 'Password reset instructions sent to your email.' 
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Password reset request failed';
      setAuthError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Reset password with token
  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const response = await api.post('/auth/reset-password', {
        token,
        password: newPassword
      });
      
      return { 
        success: true, 
        message: response.data.message || 'Password has been reset successfully.' 
      };
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Password reset failed';
      setAuthError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Provide the auth context value
  const value = {
    currentUser,
    loading,
    authError,
    isAuthenticated,
    login,
    logout,
    register,
    updateProfile,
    requestPasswordReset,
    resetPassword,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;