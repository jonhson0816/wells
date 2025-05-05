import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

// Create the auth context
export const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  
  // Check if user is logged in on mount
  useEffect(() => {
    checkUserSession();
  }, []);
  
  // Configure interceptor to handle token expiration
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // If error is 401 Unauthorized, token might be expired
        if (error.response && error.response.status === 401) {
          // Clear auth state
          clearAuthState();
          // Redirect to login
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptor on unmount
    return () => api.interceptors.response.eject(interceptor);
  }, []);
  
  // Check for a user session
  const checkUserSession = async () => {
    try {
      setLoading(true);
      
      // Use a secure approach to get session info from the server
      const response = await api.get('/auth/me');
      
      if (response.data.success) {
        console.log("Session validated successfully");
        setCurrentUser(response.data.data);
        setAuthenticated(true);
      } else {
        console.log("No valid session found");
        clearAuthState();
      }
    } catch (error) {
      console.error("Session check error:", error);
      setAuthError("Unable to verify your session. Please log in again.");
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };
  
  // Clear auth state function for secure logout
  const clearAuthState = () => {
    setCurrentUser(null);
    setAuthenticated(false);
    setAuthError(null);
  };
  
  // Login function - Security improved
  const login = async (username, password) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Clear current session for clean login
      clearAuthState();
      
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
      if (!response.data || !response.data.success) {
        console.error("Invalid response structure");
        throw new Error(response.data?.error || "Unexpected response from server");
      }
      
      // Set user data in state
      setCurrentUser(response.data.user);
      setAuthenticated(true);
      
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

  // Register function - Security improved
  const register = async (userData) => {
    try {
      console.log("Starting registration process");
      setLoading(true);
      setAuthError(null);
      
      // Clear session data for clean registration
      clearAuthState();
      
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
      
      // Log the data being sent (without sensitive info)
      console.log("Sending registration data to server");
      
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
      
      // Set user data in state
      setCurrentUser(response.data.user);
      setAuthenticated(true);
      
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
  
  // Logout function - Security improved
  const logout = async () => {
    try {
      setLoading(true);
      
      // Call backend to invalidate session
      await api.post('/auth/logout');
      
      // Clear auth state
      clearAuthState();
      
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      setAuthError("Logout failed. Please try again.");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Update user profile - Security improved
  const updateProfile = async (updateData) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // For registration, we might not have a current user yet
      if (!authenticated && !updateData.isRegistration) {
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
      setCurrentUser(response.data.data);
      
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
  
  // Password reset functionality - Security improved
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
  
  // Check if a user is authenticated 
  const isAuthenticated = () => {
    return authenticated;
  };
  
  // Get user data - minimal safe version
  const getUserSafeData = () => {
    if (!currentUser) return null;
    
    // Return only non-sensitive user data
    return {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      phone: currentUser.phoneNumber,
      address: {
        line1: currentUser.addressLine1,
        line2: currentUser.addressLine2,
        city: currentUser.city,
        state: currentUser.state,
        zipCode: currentUser.zipCode
      },
      profilePicture: currentUser.profilePicture
    };
  };
  
  // Provide the auth context values
  const value = {
    currentUser: getUserSafeData(), // Only expose non-sensitive data
    loading,
    authError,
    isAuthenticated,
    login,
    logout,
    register,
    updateProfile,
    resetPassword
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