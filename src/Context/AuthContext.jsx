import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import CryptoJS from 'crypto-js';

// Create the auth context
export const AuthContext = createContext();

// Secret key for encryption (in production, use environment variables)
const ENCRYPTION_KEY = 'WELLS_FARGO_SECURE_KEY_2025';

// Helper functions for encryption/decryption
const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

const decryptData = (ciphertext) => {
  if (!ciphertext) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};

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
      const token = localStorage.getItem('wellsFargoAuthToken');
      
      if (!token) {
        console.log("No auth token found during session check");
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      
      console.log("Auth token found, checking for local user data");
      
      // First try to get user data from localStorage to avoid unnecessary API calls
      const encryptedUser = localStorage.getItem('wellsFargoUser');
      if (encryptedUser) {
        try {
          const userData = decryptData(encryptedUser);
          if (userData) {
            console.log("Found stored user data");
            
            // Set current user from storage first to avoid loading state
            setCurrentUser(userData);
            
            // Then validate token with backend in the background
            await validateTokenWithBackend(token);
          } else {
            // If decryption fails, validate with backend
            await validateTokenWithBackend(token);
          }
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
      
      // Set auth header for API call
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Validate token with backend
      const response = await api.get('/auth/me');
      
      if (response.data.success) {
        console.log("Token validated successfully");
        const userData = response.data.data;
        
        // Store user data with sensitive fields removed
        const sanitizedUser = sanitizeUserData(userData);
        
        setCurrentUser(userData);
        
        // Update stored user data with fresh data from server (encrypted)
        localStorage.setItem('wellsFargoUser', encryptData(sanitizedUser));
      } else {
        console.log("Token validation failed:", response.data);
        clearUserData();
      }
    } catch (error) {
      console.error("Token validation error:", error);
      clearUserData();
    }
  };

  // Helper function to remove sensitive data before storing
  const sanitizeUserData = (userData) => {
    // Create a copy without password, SSN, and other sensitive fields
    const { password, securityAnswer, ssn, ...sanitizedData } = userData;
    
    // If there are accounts, sanitize them too
    if (sanitizedData.accounts) {
      sanitizedData.accounts = sanitizedData.accounts.map(account => {
        // Keep only summary account info, not full transaction history
        const { accountNumber, accountName, accountType, balance } = account;
        return { accountNumber, accountName, accountType, balance };
      });
    }
    
    return sanitizedData;
  };

  // Clear user data function to ensure proper user isolation
  const clearUserData = () => {
    // Clear all user-related data from storage
    localStorage.removeItem('wellsFargoUser');
    localStorage.removeItem('wellsFargoUserData');
    localStorage.removeItem('wellsFargoAuthToken');
    localStorage.removeItem('wellsFargoAccounts');
    sessionStorage.removeItem('wellsFargoUserData');
    sessionStorage.removeItem('wellsFargoSession');
    
    // Clear API auth header
    if (api.defaults.headers.common['Authorization']) {
      delete api.defaults.headers.common['Authorization'];
    }
    
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
      sessionStorage.removeItem('wellsFargoUserData');
      sessionStorage.removeItem('wellsFargoSession');
      
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
      
      // Store token and user data
      const { token, user } = response.data;
      
      // Set token for subsequent API calls
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Store token in plain text (as in original code)
      localStorage.setItem('wellsFargoAuthToken', token);
      
      // Store sanitized user data with encryption
      const sanitizedUser = sanitizeUserData(user);
      localStorage.setItem('wellsFargoUser', encryptData(sanitizedUser));
      
      // Also store in session storage as per original code, but encrypted
      sessionStorage.setItem('wellsFargoUserData', encryptData(sanitizedUser));
      
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
      console.log("Starting registration with API base URL:", api.defaults.baseURL);
      setLoading(true);
      setAuthError(null);
      
      // Clear session data for clean registration
      setCurrentUser(null);
      sessionStorage.removeItem('wellsFargoUserData');
      sessionStorage.removeItem('wellsFargoSession');
      localStorage.removeItem('wellsFargoAuthToken');
      
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
      
      // Log the data being sent to confirm name is set
      console.log("Data being sent to server:", {
        ...formattedUserData,
        password: "[REDACTED]",
        ssn: "[REDACTED]",
        securityAnswer: "[REDACTED]"
      });
      
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
      
      // Store token and user data
      const { token, user } = response.data;
      
      // Set token for subsequent API calls
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Store token in plain text (as in original code)
      localStorage.setItem('wellsFargoAuthToken', token);
      
      // Store sanitized user data with encryption
      const sanitizedUser = sanitizeUserData(user);
      localStorage.setItem('wellsFargoUser', encryptData(sanitizedUser));
      
      // Also store in session storage as per original code, but encrypted
      sessionStorage.setItem('wellsFargoUserData', encryptData(sanitizedUser));
      sessionStorage.setItem('wellsFargoSession', 'true');
      
      setCurrentUser(user);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      console.log('Error response:', error.response?.data);
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
      
      // Store sanitized user data with encryption
      const sanitizedUser = sanitizeUserData(updatedUser);
      localStorage.setItem('wellsFargoUser', encryptData(sanitizedUser));
      sessionStorage.setItem('wellsFargoUserData', encryptData(sanitizedUser));
      
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
  
  // Check if a user is authenticated (has valid token and user data)
  const isAuthenticated = () => {
    const token = localStorage.getItem('wellsFargoAuthToken');
    const encryptedUserData = localStorage.getItem('wellsFargoUser');
    
    // Try to decrypt the user data to verify it's valid
    if (token && encryptedUserData) {
      const userData = decryptData(encryptedUserData);
      return !!userData;
    }
    
    return false;
  };
  
  // Securely retrieve account data
  const getAccountData = async () => {
    try {
      const token = localStorage.getItem('wellsFargoAuthToken');
      if (!token) {
        throw new Error("Not authenticated");
      }
      
      // Ensure auth header is set
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch account data from API instead of local storage
      const response = await api.get('/accounts');
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Failed to fetch account data");
      }
    } catch (error) {
      console.error("Error fetching account data:", error);
      throw error;
    }
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
    getAccountData
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