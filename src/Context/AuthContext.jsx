import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

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
      
      // Only check if we have a token
      const token = getAuthToken();
      
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      
      // Always validate with backend
      await validateTokenWithBackend();
    } catch (error) {
      setAuthError("Unable to verify your session. Please log in again.");
      clearUserData();
    } finally {
      setLoading(false);
    }
  };
  
  // Get auth token from memory-only HttpOnly cookie via API
  const getAuthToken = () => {
    // We no longer access token directly from sessionStorage
    // This is now just a flag to know if we should attempt validation
    return sessionStorage.getItem('wf_auth_session') === 'true';
  };
  
  // Separate function to validate token with backend
  const validateTokenWithBackend = async () => {
    try {
      // Token is sent automatically via HttpOnly cookie
      const response = await api.get('/auth/me');
      
      if (response.data.success) {
        // Store minimal user data in memory only
        setCurrentUser(response.data.data);
      } else {
        clearUserData();
      }
    } catch (error) {
      clearUserData();
    }
  };

  // Clear user data function to ensure proper user isolation
  const clearUserData = () => {
    // Only remove the session flag
    sessionStorage.removeItem('wf_auth_session');
    
    // Reset context state
    setCurrentUser(null);
    setAuthError(null);
    
    // Clear the HttpOnly cookie via API
    api.post('/auth/clear-cookie').catch(() => {
      // Silent catch - even if this fails, we've removed local references
    });
  };
  
  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Clear current session for clean login
      setCurrentUser(null);
      sessionStorage.removeItem('wf_auth_session');
      
      // Validate inputs
      if (!username || !password) {
        throw new Error("Username and password are required");
      }
      
      // Send login request to backend - token will be set as HttpOnly cookie
      const response = await api.post('/auth/login', {
        username,
        password
      });
      
      // Check if the response structure matches what we expect
      if (!response.data || !response.data.success || !response.data.user) {
        throw new Error("Unexpected response from server");
      }
      
      // Only set a flag that we're authenticated, not the actual token
      sessionStorage.setItem('wf_auth_session', 'true');
      
      // Store user data in memory only
      setCurrentUser(response.data.user);
      return { success: true };
    } catch (error) {
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

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Clear session data for clean registration
      setCurrentUser(null);
      sessionStorage.removeItem('wf_auth_session');
      
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
      
      // Send registration request to backend - token will be set as HttpOnly cookie
      const response = await api.post('/auth/register', formattedUserData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Registration failed");
      }
      
      // Only set a flag that we're authenticated, not the actual token or user data
      sessionStorage.setItem('wf_auth_session', 'true');
      
      // Store user data in memory only
      setCurrentUser(response.data.user);
      return { success: true };
    } catch (error) {
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
      
      // Call backend to clear the HttpOnly cookie
      await api.post('/auth/logout');
      
      // Clear all local data
      clearUserData();
      
      return { success: true };
    } catch (error) {
      setAuthError("Logout failed. Please try again.");
      // Still clear local data even if the API call fails
      clearUserData();
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
      
      // Update user data in memory only
      setCurrentUser(response.data.data);
      return { success: true };
    } catch (error) {
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
      const errorMessage = error.response?.data?.error || error.message || "Password reset failed. Please try again.";
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Check if a user is authenticated
  const isAuthenticated = () => {
    // Check if we have an active session flag and current user in memory
    return sessionStorage.getItem('wf_auth_session') === 'true' && currentUser !== null;
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
    clearUserData
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