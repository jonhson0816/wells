import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

// Create secure storage utility
const SecureStorage = {
  encrypt: (data) => {
    if (!data) return null;
    const stringData = typeof data === 'object' ? JSON.stringify(data) : String(data);
    return btoa(encodeURIComponent(stringData));
  },
  
  decrypt: (encryptedData) => {
    if (!encryptedData) return null;
    try {
      const decrypted = decodeURIComponent(atob(encryptedData));
      return decrypted.startsWith('{') ? JSON.parse(decrypted) : decrypted;
    } catch (e) {
      console.error('Decryption error:', e);
      return null;
    }
  },
  
  setItem: (key, value) => {
    const encryptedValue = SecureStorage.encrypt(value);
    sessionStorage.setItem(`secure_${key}`, encryptedValue);
  },
  
  getItem: (key) => {
    const encryptedValue = sessionStorage.getItem(`secure_${key}`);
    return SecureStorage.decrypt(encryptedValue);
  },
  
  removeItem: (key) => {
    sessionStorage.removeItem(`secure_${key}`);
  },
  
  clear: () => {
    // Only clear secure items
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('secure_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
};

// Create the auth context
export const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // Check if user is logged in on mount
  useEffect(() => {
    checkUserSession();
  }, []);
  
  // Check for a user session
  const checkUserSession = async () => {
    try {
      setLoading(true);
      
      // Check if we have a token
      const token = SecureStorage.getItem('authToken');
      
      if (!token) {
        console.log("No auth token found during session check");
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      
      console.log("Auth token found, checking for local user data");
      
      // First try to get user data from secure storage to avoid unnecessary API calls
      const storedUser = SecureStorage.getItem('userData');
      if (storedUser) {
        try {
          console.log("Found stored user data");
          
          // Set current user from storage first to avoid loading state
          setCurrentUser(storedUser);
          
          // Then validate token with backend in the background
          await validateTokenWithBackend(token);
        } catch (parseError) {
          console.error("Error parsing stored user data:", parseError);
          // Continue to backend validation if parsing fails
          await validateTokenWithBackend(token);
        }
      } else {
        // If we don't have valid stored user data, validate with backend
        await validateTokenWithBackend(token);
      }
    } catch (error) {
      console.error("Session check error:", error);
      setAuthError("Unable to verify your session. Please log in again.");
      clearUserData();
    } finally {
      setLoading(false);
    }
  };
  
  // Separate function to validate token with backend
  const validateTokenWithBackend = async (token) => {
    try {
      console.log("Validating token with backend");
      
      // Set token in API headers for request
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Validate token with backend
      const response = await api.get('/auth/me');
      
      if (response.data.success) {
        console.log("Token validated successfully");
        setCurrentUser(response.data.data);
        
        // Update stored user data with fresh data from server
        SecureStorage.setItem('userData', response.data.data);
      } else {
        console.log("Token validation failed:", response.data);
        clearUserData();
      }
    } catch (error) {
      console.error("Token validation error:", error);
      clearUserData();
    }
  };

  // Clear user data function to ensure proper user isolation
  const clearUserData = () => {
    // Remove token from API headers
    delete api.defaults.headers.common['Authorization'];
    
    // Clear all user-related data from storage
    SecureStorage.clear();
    
    // Also clear any legacy non-secure storage items
    localStorage.removeItem('wellsFargoUser');
    localStorage.removeItem('wellsFargoUserData');
    localStorage.removeItem('wellsFargoAuthToken');
    localStorage.removeItem('wellsFargoAccounts');
    sessionStorage.removeItem('wellsFargoUserData');
    sessionStorage.removeItem('wellsFargoSession');
    
    // Reset context state
    setCurrentUser(null);
    setAuthError(null);
  };
  
  // Login function - FIXED
  const login = async (username, password) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Clear current session for clean login
      setCurrentUser(null);
      SecureStorage.clear();
      
      // Validate inputs
      if (!username || !password) {
        throw new Error("Username and password are required");
      }
      
      // Send login request to backend
      const response = await api.post('/auth/login', {
        username,
        password
      });
      
      console.log("Login response received");
      
      // Check if the response structure matches what we expect
      if (!response.data || !response.data.token || !response.data.user) {
        console.error("Invalid response structure");
        throw new Error("Unexpected response from server");
      }
      
      // Store token and user data in secure storage
      const { token, user } = response.data;
      SecureStorage.setItem('authToken', token);
      SecureStorage.setItem('userData', user);
      
      // Set token in API headers for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.error || error.message || "Login failed. Please check your credentials.";
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to format phone number
  const formatPhoneNumber = (phoneNumber) => {
    // Remove all non-digit characters
    return phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
  };

  // Register function - FIXED
  const register = async (userData) => {
    try {
      console.log("Starting registration");
      setLoading(true);
      setAuthError(null);
      
      // Clear session data for clean registration
      setCurrentUser(null);
      SecureStorage.clear();
      
      // Validate required fields
      if (!userData.username || !userData.password || !userData.email || 
          !userData.firstName || !userData.lastName || !userData.phoneNumber ||
          !userData.dateOfBirth || !userData.ssn || !userData.addressLine1 || 
          !userData.city || !userData.state || !userData.zipCode ||
          !userData.securityQuestion || !userData.securityAnswer) {
        throw new Error("All required fields must be completed");
      }
      
      // Create a new object with all fields including explicit name field
      const formattedUserData = {
        ...userData,
        phoneNumber: formatPhoneNumber(userData.phoneNumber),
        name: `${userData.firstName} ${userData.lastName}`
      };
      
      // Validate phone number format after formatting
      if (formattedUserData.phoneNumber.replace(/\D/g, '').length !== 10) {
        throw new Error("Please provide a valid 10-digit phone number");
      }
      
      // Send registration request to backend
      const response = await api.post('/auth/register', formattedUserData);
      
      console.log("Registration response received");
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Registration failed");
      }
      
      // Store token and user data in secure storage
      const { token, user } = response.data;
      SecureStorage.setItem('authToken', token);
      SecureStorage.setItem('userData', user);
      
      // Set token in API headers for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || error.message || "Registration failed. Please try again.";
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // No need to call backend for logout as JWT is stateless
      // Just clear all local data
      clearUserData();
      
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      setAuthError("Logout failed. Please try again.");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Update user profile
  const updateProfile = async (updateData) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // For registration, we might not have a current user yet
      if (!currentUser && !updateData.isRegistration) {
        throw new Error("No user logged in");
      }
      
      // Format phone number if it exists in the update data
      const formattedUpdateData = { ...updateData };
      if (formattedUpdateData.phoneNumber) {
        formattedUpdateData.phoneNumber = formatPhoneNumber(formattedUpdateData.phoneNumber);
        
        // Validate phone number format after formatting
        if (formattedUpdateData.phoneNumber.length !== 10) {
          throw new Error("Please provide a valid 10-digit phone number");
        }
      }
      
      // Send update request to backend
      const response = await api.put('/auth/updateprofile', formattedUpdateData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Profile update failed");
      }
      
      // Update stored user data
      const updatedUser = response.data.data;
      SecureStorage.setItem('userData', updatedUser);
      
      setCurrentUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error("Profile update error:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to update profile. Please try again.";
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Password reset functionality
  const resetPassword = async (username, securityAnswer) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      if (!username) {
        throw new Error("Username is required");
      }
      
      // First, request a password reset
      let response = await api.post('/auth/forgotpassword', { username });
      
      // If security answer is provided, validate and reset password
      if (securityAnswer && response.data.resetToken) {
        // This part would typically be in a separate form/flow after email verification
        // But for demo purposes, we're combining the steps
        response = await api.put(`/auth/resetpassword/${response.data.resetToken}`, {
          securityAnswer,
          password: 'NewTemp123!' // In a real app, user would choose this
        });
        
        if (!response.data.success) {
          throw new Error(response.data.error || "Password reset failed");
        }
        
        return { 
          success: true, 
          message: "Your password has been reset. Please log in with your new password." 
        };
      }
      
      // Return success message for the initial request
      return { 
        success: true, 
        message: response.data.message || "Password reset instructions have been sent to your email." 
      };
    } catch (error) {
      console.error("Password reset error:", error);
      const errorMessage = error.response?.data?.error || error.message || "Password reset failed. Please try again.";
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Store account data securely
  const storeAccounts = (accounts) => {
    if (accounts) {
      SecureStorage.setItem('accounts', accounts);
    }
  };
  
  // Get stored accounts
  const getAccounts = () => {
    return SecureStorage.getItem('accounts');
  };
  
  // Check if a user is authenticated (has valid token and user data)
  const isAuthenticated = () => {
    const token = SecureStorage.getItem('authToken');
    const userData = SecureStorage.getItem('userData');
    
    return !!(token && userData);
  };
  
  // Modified remember username function to use secure storage
  const rememberUsername = (username) => {
    if (username) {
      SecureStorage.setItem('rememberedUsername', username);
    } else {
      SecureStorage.removeItem('rememberedUsername');
    }
  };
  
  // Get remembered username
  const getRememberedUsername = () => {
    return SecureStorage.getItem('rememberedUsername');
  };
  
  // Provide the auth context values
  const value = {
    currentUser,
    loading,
    authError,
    isAuthenticated,
    login,
    logout,
    register,
    updateProfile,
    resetPassword,
    clearUserData,
    storeAccounts,
    getAccounts,
    rememberUsername,
    getRememberedUsername
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};