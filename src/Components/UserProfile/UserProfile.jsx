import React, { useState, useEffect } from 'react';
import { useUser } from '../../Context/UserContext';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserProfile.css';

// API client setup
const API_URL = import.meta.env?.VITE_API_URL || 'https://wellsapi-1.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wellsFargoAuthToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const UserProfile = () => {
  // Get context hooks
  const userContext = useUser();
  const authContext = useAuth();
  
  // Extract necessary functions and data from contexts
  const { user, updateUser, setError, loading: userLoading } = userContext || {};
  const { currentUser, updateProfile, loading: authLoading, authError } = authContext || {};
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiError, setApiError] = useState(null);
  const navigate = useNavigate();

  // Initialize userData when user or currentUser changes
  useEffect(() => {
    // Use the most complete user data available from either context
    const combinedData = {
      ...user,
      ...(currentUser || {}),
      // Add default values for critical fields that might be used elsewhere
      firstName: user?.firstName || currentUser?.firstName || '',
      lastName: user?.lastName || currentUser?.lastName || '',
      email: user?.email || currentUser?.email || '',
      phoneNumber: user?.phoneNumber || currentUser?.phoneNumber || '',
      profilePicture: user?.profilePicture || currentUser?.profilePicture || '',
      // Ensure we have an ID for authentication checks
      id: user?.id || currentUser?.id || user?._id || currentUser?._id || null
    };
    
    setUserData(combinedData);
    setEditedUser(combinedData);
  }, [user, currentUser]);

  // Fetch profile data from backend on component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Function to fetch profile data from backend
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setApiError(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('wellsFargoAuthToken');
      if (!token) {
        console.log('No auth token found, unable to fetch profile');
        setLoading(false);
        return;
      }
      
      const response = await api.get('/profile');
      
      if (response.data.success) {
        // Merge new data with existing data
        const profileData = response.data.data;
        
        // Format address for display if needed
        let formattedAddress = profileData.address;
        if (typeof formattedAddress === 'object' && formattedAddress !== null) {
          // Format the address object into a string representation for the form
          formattedAddress = formatAddressToString(formattedAddress);
        }
        
        const formattedProfileData = {
          ...profileData,
          address: formattedAddress
        };
        
        setUserData(formattedProfileData);
        setEditedUser(formattedProfileData);
        
        // Update localStorage with fresh data
        localStorage.setItem('wellsFargoUserProfile', JSON.stringify(formattedProfileData));
        
        console.log('Profile data fetched successfully:', formattedProfileData);
      } else {
        console.error('Failed to fetch profile:', response.data.error);
        setApiError(response.data.error || 'Failed to fetch profile data');
        
        // Try loading from localStorage as fallback
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setApiError('Failed to connect to the server. Please try again later.');
      
      // Try loading from localStorage as fallback
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to format address object to string
  const formatAddressToString = (addressObj) => {
    if (!addressObj) return '';
    
    let parts = [];
    if (addressObj.line1) parts.push(addressObj.line1);
    if (addressObj.line2) parts.push(addressObj.line2);
    
    let cityStateZip = '';
    if (addressObj.city) cityStateZip += addressObj.city;
    if (addressObj.state) cityStateZip += cityStateZip ? `, ${addressObj.state}` : addressObj.state;
    if (addressObj.zipCode) cityStateZip += cityStateZip ? ` ${addressObj.zipCode}` : addressObj.zipCode;
    
    if (cityStateZip) parts.push(cityStateZip);
    
    return parts.join(', ');
  };
  
  // Helper function to parse string address to object
  const parseAddressString = (addressString) => {
    if (!addressString) return {};
    
    // Split by commas
    const parts = addressString.split(',').map(part => part.trim());
    
    // Basic parsing logic - can be improved based on your actual format
    const addressObj = {
      line1: parts[0] || '',
      line2: '',
      city: '',
      state: '',
      zipCode: ''
    };
    
    if (parts.length > 1) {
      // Handle city, state, zip
      const lastPart = parts[parts.length - 1];
      const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
      
      if (stateZipMatch) {
        addressObj.state = stateZipMatch[1];
        addressObj.zipCode = stateZipMatch[2];
        addressObj.city = lastPart.replace(stateZipMatch[0], '').trim();
      } else {
        // If no state/zip pattern, assume it's city
        addressObj.city = lastPart;
      }
      
      // If there are middle parts, assume they're either line2 or part of city
      if (parts.length > 2) {
        addressObj.line2 = parts.slice(1, -1).join(', ');
      }
    }
    
    return addressObj;
  };
  
  // Load saved profile data from localStorage
  const loadFromLocalStorage = () => {
    try {
      // Try loading from profile storage first
      const storedUser = localStorage.getItem('wellsFargoUserProfile');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        setEditedUser(parsedUser);
        console.log('Loaded profile from localStorage:', parsedUser);
      } else {
        // Fall back to main user storage
        const mainUserData = localStorage.getItem('wellsFargoUser');
        if (mainUserData) {
          const parsedMainUser = JSON.parse(mainUserData);
          setUserData(parsedMainUser);
          setEditedUser(parsedMainUser);
          console.log('Loaded user from main localStorage:', parsedMainUser);
        }
      }
    } catch (error) {
      console.error('Error loading user data from localStorage:', error);
    }
  };

  // Function to save user data to backend
  const saveUserData = async (updatedUserData) => {
    console.log('Starting save operation with data:', updatedUserData);
    setLoading(true);
    setSaveSuccess(false);
    setApiError(null);
    
    try {
      // Create a clean update object with only the fields we want to update
      const updatePayload = {
        firstName: updatedUserData.firstName,
        lastName: updatedUserData.lastName,
        email: updatedUserData.email,
        phoneNumber: updatedUserData.phoneNumber,
        profilePicture: updatedUserData.profilePicture,
      };
      
      // Handle address format based on what we have
      if (updatedUserData.address) {
        if (typeof updatedUserData.address === 'string') {
          // Convert string address to object format for API
          updatePayload.address = parseAddressString(updatedUserData.address);
        } else {
          // If address is already an object, use it directly
          updatePayload.address = updatedUserData.address;
        }
      }
      
      // If date of birth is provided, include it
      if (updatedUserData.dateOfBirth) {
        updatePayload.dateOfBirth = updatedUserData.dateOfBirth;
      }

      console.log('Update payload prepared:', updatePayload);

      // First try to update via API
      const response = await api.put('/profile', updatePayload);
      
      if (response.data.success) {
        console.log('Profile updated successfully on server:', response.data);
        
        // Get the updated profile from response
        const updatedProfile = response.data.data;
        
        // Format address for display if needed
        let formattedAddress = updatedProfile.address;
        if (typeof formattedAddress === 'object' && formattedAddress !== null) {
          formattedAddress = formatAddressToString(formattedAddress);
        }
        
        const formattedProfileData = {
          ...updatedProfile,
          address: formattedAddress
        };
        
        // Update local state
        setUserData(formattedProfileData);
        
        // Update localStorage
        localStorage.setItem('wellsFargoUserProfile', JSON.stringify(formattedProfileData));
        localStorage.setItem('wellsFargoUser', JSON.stringify(formattedProfileData));
        
        // Also update contexts if functions exist
        if (typeof updateUser === 'function') {
          updateUser(formattedProfileData);
        }
        
        if (typeof updateProfile === 'function') {
          updateProfile(formattedProfileData);
        }
        
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        return true;
      } else {
        throw new Error(response.data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      
      // Set error message
      setApiError(error.response?.data?.error || error.message || 'Failed to update profile. Please try again.');
      
      // Try to update localStorage anyway for resilience
      try {
        const updatedLocalUserData = {
          ...userData,
          ...updatedUserData
        };
        
        localStorage.setItem('wellsFargoUser', JSON.stringify(updatedLocalUserData));
        localStorage.setItem('wellsFargoUserProfile', JSON.stringify(updatedLocalUserData));
        
        // Update local state
        setUserData(updatedLocalUserData);
        
        console.log('Updated localStorage despite API error');
      } catch (localStorageError) {
        console.error('Error updating localStorage:', localStorageError);
      }
      
      return false;
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  };

  // Function to update tab-specific settings
  const updateTabSettings = async (tabName, settingsData) => {
    try {
      setLoading(true);
      setApiError(null);
      
      let endpoint = '';
      
      // Determine which endpoint to use based on tab
      switch(tabName) {
        case 'security':
          endpoint = '/profile/security';
          break;
        case 'preferences':
          endpoint = '/profile/preferences';
          break;
        case 'notifications':
          endpoint = '/profile/notifications';
          break;
        default:
          throw new Error('Invalid tab settings to update');
      }
      
      // Send update request
      const response = await api.put(endpoint, settingsData);
      
      if (response.data.success) {
        console.log(`${tabName} settings updated successfully:`, response.data);
        
        // Update local data
        const updatedProfile = response.data.data;
        setUserData(prev => ({...prev, ...updatedProfile}));
        
        // Update localStorage
        localStorage.setItem('wellsFargoUserProfile', JSON.stringify({...userData, ...updatedProfile}));
        
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        return true;
      } else {
        throw new Error(response.data.error || `Failed to update ${tabName} settings`);
      }
    } catch (error) {
      console.error(`Error updating ${tabName} settings:`, error);
      setApiError(error.response?.data?.error || error.message || `Failed to update ${tabName} settings. Please try again.`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleProfileEdit = (e) => {
    // Prevent default to avoid any form submission
    if (e) e.preventDefault();
    setIsEditing(!isEditing);
    // Make sure we reset editedUser to the current userData when starting to edit
    if (!isEditing) {
      setEditedUser({ ...userData });
    }
  };

  const handleSaveProfile = async (e) => {
    // Prevent form submission which causes page refresh
    if (e) e.preventDefault();
    
    console.log('Save profile clicked with data:', editedUser);
    
    // Validate fields before saving
    if (!editedUser.firstName || !editedUser.lastName || !editedUser.email) {
      setApiError('Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }
    
    // Check if phone is provided and validate it
    if (editedUser.phoneNumber) {
      // Phone validation - make it more flexible to accept various formats
      const cleanedPhone = editedUser.phoneNumber.replace(/\D/g, '');
      if (cleanedPhone.length < 10) {
        setApiError('Please enter a valid phone number with at least 10 digits');
        return;
      }
      // Standardize phone format
      editedUser.phoneNumber = cleanedPhone;
    } else {
      setApiError('Phone number is required');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedUser.email)) {
      setApiError('Please enter a valid email address');
      return;
    }
    
    // Update user in both contexts and localStorage
    const updatedUser = {
      ...editedUser,
      // Preserve important fields
      id: userData.id || editedUser.id || currentUser?.id || user?.id,
      _id: userData._id || editedUser._id || currentUser?._id || user?._id
    };
    
    console.log('Calling saveUserData with:', updatedUser);
    await saveUserData(updatedUser);
  };

  const handleCancelEdit = (e) => {
    // Prevent default to avoid any form submission
    if (e) e.preventDefault();
    setIsEditing(false);
    setEditedUser({ ...userData });
    setApiError(null); // Clear any error messages
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setApiError('Image too large. Please select an image under 5MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedUser(prev => ({
          ...prev,
          profilePicture: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phoneNumber;
  };

  // Format address properly to avoid object rendering error
  const formatAddress = (address) => {
    if (!address) return '';
    
    // If address is an object with address fields
    if (typeof address === 'object' && address !== null) {
      const { line1, line2, city, state, zipCode } = address;
      let formattedAddress = line1 || '';
      if (line2) formattedAddress += `, ${line2}`;
      if (city || state || zipCode) {
        formattedAddress += `, ${city || ''} ${state || ''} ${zipCode || ''}`.trim();
      }
      return formattedAddress;
    }
    
    // If already a string, return as is
    return address;
  };

  // Navigation function
  const navigateTo = (path) => {
    navigate(path);
  };
  
  // Handle security settings update
  const handleSecurityUpdate = async (e) => {
    e.preventDefault();
    
    const twoFactorEnabled = document.getElementById('tfa-toggle').checked;
    
    const securitySettings = {
      twoFactorEnabled
    };
    
    const success = await updateTabSettings('security', securitySettings);
    if (success) {
      // Update local state for immediate UI refresh
      setUserData(prev => ({
        ...prev,
        verificationStatus: {
          ...prev.verificationStatus,
          twoFactorEnabled
        }
      }));
    }
  };
  
  // Handle preferences update
  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    
    const language = document.querySelector('.reg1011-language-select').value;
    const defaultAccount = document.querySelector('.reg1011-account-select').value;
    const statementDelivery = document.querySelector('input[name="statement"]:checked').value;
    
    const preferencesSettings = {
      language,
      defaultAccount,
      statementDelivery
    };
    
    const success = await updateTabSettings('preferences', preferencesSettings);
    if (success) {
      // Update local state
      setUserData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          language,
          defaultAccount,
          statementDelivery
        }
      }));
    }
  };
  
  // Handle notifications update
  const handleNotificationsUpdate = async (e) => {
    e.preventDefault();
    
    const balanceAlerts = document.getElementById('balance-toggle').checked;
    const transactionAlerts = document.getElementById('transaction-toggle').checked;
    const securityAlerts = document.getElementById('security-toggle').checked;
    const emailNotifications = document.getElementById('email-toggle').checked;
    const smsNotifications = document.getElementById('sms-toggle').checked;
    const pushNotifications = document.getElementById('push-toggle').checked;
    
    const notificationSettings = {
      balanceAlerts,
      transactionAlerts,
      securityAlerts,
      emailNotifications,
      smsNotifications,
      pushNotifications
    };
    
    const success = await updateTabSettings('notifications', notificationSettings);
    if (success) {
      // Update local state
      setUserData(prev => ({
        ...prev,
        notificationSettings: {
          ...prev.notificationSettings,
          balanceAlerts,
          transactionAlerts,
          securityAlerts,
          channels: {
            ...prev.notificationSettings?.channels,
            email: emailNotifications,
            sms: smsNotifications,
            push: pushNotifications
          }
        }
      }));
    }
  };
  
  // Handle password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const handlePasswordChange = () => {
    setShowPasswordModal(true);
  };
  
  const closePasswordModal = () => {
    setShowPasswordModal(false);
  };
  
  const submitPasswordChange = async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      setApiError('All password fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setApiError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setApiError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setLoading(true);
      setApiError(null);
      
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        closePasswordModal();
        
        // Update security settings
        setUserData(prev => ({
          ...prev,
          securitySettings: {
            ...prev.securitySettings,
            lastPasswordChange: new Date()
          }
        }));
      } else {
        throw new Error(response.data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setApiError(error.response?.data?.error || error.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg1011-user-profile-container">
      <div className="reg1011-wells-fargo-header">
        <div className="reg1011-dash002 reg1011-header-content">
          <img
            src="/Images/wells fargo.jpeg"
            alt="Wells Fargo Logo"
            className="reg1011-dash002 reg1011-logo"
            onClick={() => navigateTo('/dashboard')}
            style={{ cursor: 'pointer' }}
          />
        </div>
        <h1>My Profile</h1>
      </div>
      
      <div className="reg1011-profile-content">
        <div className="reg1011-profile-navigation">
          <ul>
            <li 
              className={activeTab === 'profile' ? 'reg1011-active' : ''} 
              onClick={() => setActiveTab('profile')}
            >
              <i className="reg1011-profile-icon"></i>
              Personal Info
            </li>
            <li 
              className={activeTab === 'security' ? 'reg1011-active' : ''} 
              onClick={() => setActiveTab('security')}
            >
              <i className="reg1011-security-icon"></i>
              Security Settings
            </li>
            <li 
              className={activeTab === 'preferences' ? 'reg1011-active' : ''} 
              onClick={() => setActiveTab('preferences')}
            >
              <i className="reg1011-preferences-icon"></i>
              Account Preferences
            </li>
            <li 
              className={activeTab === 'notifications' ? 'reg1011-active' : ''} 
              onClick={() => setActiveTab('notifications')}
            >
              <i className="reg1011-notifications-icon"></i>
              Notifications
            </li>
          </ul>
        </div>
        
        <div className="reg1011-profile-details">
          {/* Status message for successful save */}
          {saveSuccess && (
            <div className="reg1011-success-message">
              {activeTab === 'profile' ? 'Profile updated successfully!' : 
               activeTab === 'security' ? 'Security settings updated successfully!' :
               activeTab === 'preferences' ? 'Preferences updated successfully!' :
               'Notification settings updated successfully!'}
            </div>
          )}
          
          {/* Show error message if there's an error */}
          {apiError && (
            <div className="reg1011-error-message">
              {apiError}
            </div>
          )}
          
          {activeTab === 'profile' && (
            <>
              {isEditing ? (
                <div className="reg1011-profile-edit-form">
                  <h2>Edit Profile</h2>
                  {/* Using form element to handle proper submit behavior */}
                  <form onSubmit={handleSaveProfile}>
                    <div className="reg1011-form-grid">
                      <div className="reg1011-profile-picture-section">
                        <div className="reg1011-profile-picture-upload">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                            id="profilePicture"
                            className="reg1011-profile-picture-input"
                          />
                          <label htmlFor="profilePicture" className="reg1011-profile-picture-label">
                            {editedUser.profilePicture ? (
                              <img src={editedUser.profilePicture} alt="Profile" className="reg1011-profile-image" />
                            ) : (
                              <div className="reg1011-placeholder-image">
                                {editedUser.firstName && editedUser.lastName ? 
                                  `${editedUser.firstName[0]}${editedUser.lastName[0]}` : 'UP'}
                              </div>
                            )}
                            <div className="reg1011-upload-overlay">
                              <span>Change Photo</span>
                            </div>
                          </label>
                        </div>
                      </div>
                      
                      <div className="reg1011-edit-form-fields">
                        <div className="reg1011-input-group">
                          <label htmlFor="firstName">First Name *</label>
                          <input
                            id="firstName"
                            type="text"
                            placeholder="First Name"
                            value={editedUser.firstName || ''}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="reg1011-input-group">
                          <label htmlFor="lastName">Last Name *</label>
                          <input
                            id="lastName"
                            type="text"
                            placeholder="Last Name"
                            value={editedUser.lastName || ''}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="reg1011-input-group">
                          <label htmlFor="email">Email Address *</label>
                          <input
                            id="email"
                            type="email"
                            placeholder="Email"
                            value={editedUser.email || ''}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="reg1011-input-group">
                          <label htmlFor="phoneNumber">Phone Number *</label>
                          <input
                            id="phoneNumber"
                            type="tel"
                            placeholder="Phone Number"
                            value={editedUser.phoneNumber || ''}
                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="reg1011-input-group">
                          <label htmlFor="address">Address</label>
                          <input
                            id="address"
                            type="text"
                            placeholder="Address"
                            value={typeof editedUser.address === 'object' ? formatAddress(editedUser.address) : (editedUser.address || '')}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                          />
                        </div>
                        
                        <div className="reg1011-input-group">
                          <label htmlFor="dateOfBirth">Date of Birth</label>
                          <input
                            id="dateOfBirth"
                            type="date"
                            value={editedUser.dateOfBirth || ''}
                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="reg1011-profile-actions">
                      <button 
                        type="submit"
                        className="reg1011-save-button" 
                        disabled={loading || userLoading || authLoading}
                      >
                        {loading || userLoading || authLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        type="button"
                        className="reg1011-cancel-button" 
                        onClick={handleCancelEdit}
                        disabled={loading || userLoading || authLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="reg1011-user-profile-view">
                  <div className="reg1011-profile-header">
                    <div className="reg1011-profile-picture">
                      {userData.profilePicture ? (
                        <img src={userData.profilePicture} alt="Profile" className="reg1011-profile-image" />
                      ) : (
                        <div className="reg1011-placeholder-image">
                          {userData.firstName && userData.lastName ? 
                            `${userData.firstName[0]}${userData.lastName[0]}` : 'UP'}
                        </div>
                      )}
                    </div>
                    <div className="reg1011-user-basic-info">
                      <h2>{userData.firstName || 'User'} {userData.lastName || 'Name'}</h2>
                      <p className="reg1011-user-id">Customer ID: {userData.customerId || '8472910365'}</p>
                      <p className="reg1011-credit-score-display">
                        <span className="reg1011-credit-score-label">Credit Score:</span>
                        <span className="reg1011-credit-score-value">{userData.creditScore || '740'}</span>
                        <span className="reg1011-credit-score-rating">(Good)</span>
                      </p>
                    </div>
                    <button className="reg1011-edit-profile-button" onClick={handleProfileEdit}>
                      <i className="reg1011-edit-icon"></i>
                      Edit Profile
                    </button>
                  </div>
                  
                  <div className="reg1011-profile-details-section">
                  <h3>Personal Information</h3>
                    <div className="reg1011-profile-info-grid">
                      <div className="reg1011-info-item">
                        <span className="reg1011-info-label">Full Name:</span>
                        <span className="reg1011-info-value">{userData.firstName || ''} {userData.lastName || ''}</span>
                      </div>
                      
                      <div className="reg1011-info-item">
                        <span className="reg1011-info-label">Email:</span>
                        <span className="reg1011-info-value">{userData.email || 'Not provided'}</span>
                      </div>
                      
                      <div className="reg1011-info-item">
                        <span className="reg1011-info-label">Phone Number:</span>
                        <span className="reg1011-info-value">{formatPhoneNumber(userData.phoneNumber) || 'Not provided'}</span>
                      </div>
                      
                      <div className="reg1011-info-item">
                        <span className="reg1011-info-label">Address:</span>
                        <span className="reg1011-info-value">
                          {typeof userData.address === 'object' ? formatAddress(userData.address) : (userData.address || 'Not provided')}
                        </span>
                      </div>
                      
                      <div className="reg1011-info-item">
                        <span className="reg1011-info-label">Date of Birth:</span>
                        <span className="reg1011-info-value">
                          {userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                        </span>
                      </div>
                      
                      <div className="reg1011-info-item">
                        <span className="reg1011-info-label">Customer Since:</span>
                        <span className="reg1011-info-value">
                          {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'January 15, 2020'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'security' && (
            <div className="reg1011-security-settings">
              <h2>Security Settings</h2>
              
              <form onSubmit={handleSecurityUpdate}>
                <div className="reg1011-security-section">
                  <h3>Account Security</h3>
                  
                  <div className="reg1011-security-item">
                    <div className="reg1011-security-item-header">
                      <h4>Password</h4>
                      <button 
                        type="button" 
                        className="reg1011-change-password-button"
                        onClick={handlePasswordChange}
                      >
                        Change Password
                      </button>
                    </div>
                    <p className="reg1011-security-item-info">
                      Last changed: {userData.securitySettings?.lastPasswordChange ? 
                        new Date(userData.securitySettings.lastPasswordChange).toLocaleDateString() : 
                        'Not available'}
                    </p>
                  </div>
                  
                  <div className="reg1011-security-item">
                    <div className="reg1011-security-item-header">
                      <h4>Two-Factor Authentication</h4>
                      <div className="reg1011-toggle-switch">
                        <input 
                          type="checkbox" 
                          id="tfa-toggle" 
                          className="reg1011-toggle-input"
                          defaultChecked={userData.verificationStatus?.twoFactorEnabled || false}
                        />
                        <label htmlFor="tfa-toggle" className="reg1011-toggle-label"></label>
                      </div>
                    </div>
                    <p className="reg1011-security-item-info">
                      Enhance your account security with two-factor authentication. 
                      When enabled, you'll need to verify your identity using your phone 
                      when logging in from new devices.
                    </p>
                  </div>
                  
                  <h3>Login History</h3>
                  <div className="reg1011-login-history">
                    <table className="reg1011-login-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Device</th>
                          <th>Location</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{new Date().toLocaleString()}</td>
                          <td>Web Browser (Chrome)</td>
                          <td>San Francisco, CA</td>
                          <td>Success</td>
                        </tr>
                        <tr>
                          <td>{new Date(Date.now() - 86400000).toLocaleString()}</td>
                          <td>Mobile App (iOS)</td>
                          <td>San Francisco, CA</td>
                          <td>Success</td>
                        </tr>
                        <tr>
                          <td>{new Date(Date.now() - 172800000).toLocaleString()}</td>
                          <td>Web Browser (Safari)</td>
                          <td>San Francisco, CA</td>
                          <td>Success</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="reg1011-profile-actions">
                  <button 
                    type="submit"
                    className="reg1011-save-button" 
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Security Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'preferences' && (
            <div className="reg1011-preferences-settings">
              <h2>Account Preferences</h2>
              
              <form onSubmit={handlePreferencesUpdate}>
                <div className="reg1011-preferences-section">
                  <div className="reg1011-preference-item">
                    <label>Language Preference</label>
                    <select 
                      className="reg1011-language-select"
                      defaultValue={userData.preferences?.language || 'en'}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                  
                  <div className="reg1011-preference-item">
                    <label>Default Account</label>
                    <select 
                      className="reg1011-account-select"
                      defaultValue={userData.preferences?.defaultAccount || 'checking'}
                    >
                      <option value="checking">Checking Account</option>
                      <option value="savings">Savings Account</option>
                      <option value="credit">Credit Card</option>
                      <option value="investment">Investment Account</option>
                    </select>
                    <p className="reg1011-preference-description">
                      Select which account should appear first when you log in
                    </p>
                  </div>
                  
                  <div className="reg1011-preference-item">
                    <label>Statement Delivery</label>
                    <div className="reg1011-delivery-options">
                      <div className="reg1011-radio-option">
                        <input 
                          type="radio" 
                          id="paperless" 
                          name="statement" 
                          value="paperless"
                          defaultChecked={userData.preferences?.statementDelivery === 'paperless'}
                        />
                        <label htmlFor="paperless">Paperless (Email)</label>
                      </div>
                      <div className="reg1011-radio-option">
                        <input 
                          type="radio" 
                          id="paper" 
                          name="statement" 
                          value="paper"
                          defaultChecked={userData.preferences?.statementDelivery === 'paper'}
                        />
                        <label htmlFor="paper">Paper Statements</label>
                      </div>
                      <div className="reg1011-radio-option">
                        <input 
                          type="radio" 
                          id="both" 
                          name="statement" 
                          value="both"
                          defaultChecked={userData.preferences?.statementDelivery === 'both'}
                        />
                        <label htmlFor="both">Both</label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="reg1011-profile-actions">
                  <button 
                    type="submit"
                    className="reg1011-save-button" 
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="reg1011-notification-settings">
              <h2>Notification Settings</h2>
              
              <form onSubmit={handleNotificationsUpdate}>
                <div className="reg1011-notification-section">
                  <h3>Alert Types</h3>
                  
                  <div className="reg1011-notification-item">
                    <div className="reg1011-notification-item-header">
                      <h4>Balance Alerts</h4>
                      <div className="reg1011-toggle-switch">
                        <input 
                          type="checkbox" 
                          id="balance-toggle" 
                          className="reg1011-toggle-input"
                          defaultChecked={userData.notificationSettings?.balanceAlerts || false}
                        />
                        <label htmlFor="balance-toggle" className="reg1011-toggle-label"></label>
                      </div>
                    </div>
                    <p className="reg1011-notification-item-info">
                      Receive notifications when your account balance falls below a specified amount
                    </p>
                  </div>
                  
                  <div className="reg1011-notification-item">
                    <div className="reg1011-notification-item-header">
                      <h4>Transaction Alerts</h4>
                      <div className="reg1011-toggle-switch">
                        <input 
                          type="checkbox" 
                          id="transaction-toggle" 
                          className="reg1011-toggle-input"
                          defaultChecked={userData.notificationSettings?.transactionAlerts || false}
                        />
                        <label htmlFor="transaction-toggle" className="reg1011-toggle-label"></label>
                      </div>
                    </div>
                    <p className="reg1011-notification-item-info">
                      Get notified when transactions exceed a certain amount
                    </p>
                  </div>
                  
                  <div className="reg1011-notification-item">
                    <div className="reg1011-notification-item-header">
                      <h4>Security Alerts</h4>
                      <div className="reg1011-toggle-switch">
                        <input 
                          type="checkbox" 
                          id="security-toggle" 
                          className="reg1011-toggle-input"
                          defaultChecked={userData.notificationSettings?.securityAlerts || true}
                        />
                        <label htmlFor="security-toggle" className="reg1011-toggle-label"></label>
                      </div>
                    </div>
                    <p className="reg1011-notification-item-info">
                      Receive alerts about important security events
                    </p>
                  </div>
                  
                  <h3>Delivery Methods</h3>
                  
                  <div className="reg1011-notification-item">
                    <div className="reg1011-notification-item-header">
                      <h4>Email Notifications</h4>
                      <div className="reg1011-toggle-switch">
                        <input 
                          type="checkbox" 
                          id="email-toggle" 
                          className="reg1011-toggle-input"
                          defaultChecked={userData.notificationSettings?.channels?.email || false}
                        />
                        <label htmlFor="email-toggle" className="reg1011-toggle-label"></label>
                      </div>
                    </div>
                    <p className="reg1011-notification-item-info">
                      Send notifications to {userData.email || 'your email'}
                    </p>
                  </div>
                  
                  <div className="reg1011-notification-item">
                    <div className="reg1011-notification-item-header">
                      <h4>SMS Notifications</h4>
                      <div className="reg1011-toggle-switch">
                        <input 
                          type="checkbox" 
                          id="sms-toggle" 
                          className="reg1011-toggle-input"
                          defaultChecked={userData.notificationSettings?.channels?.sms || false}
                        />
                        <label htmlFor="sms-toggle" className="reg1011-toggle-label"></label>
                      </div>
                    </div>
                    <p className="reg1011-notification-item-info">
                      Send text messages to {formatPhoneNumber(userData.phoneNumber) || 'your phone'}
                    </p>
                  </div>
                  
                  <div className="reg1011-notification-item">
                    <div className="reg1011-notification-item-header">
                      <h4>Push Notifications</h4>
                      <div className="reg1011-toggle-switch">
                        <input 
                          type="checkbox" 
                          id="push-toggle" 
                          className="reg1011-toggle-input"
                          defaultChecked={userData.notificationSettings?.channels?.push || false}
                        />
                        <label htmlFor="push-toggle" className="reg1011-toggle-label"></label>
                      </div>
                    </div>
                    <p className="reg1011-notification-item-info">
                      Receive notifications on your mobile device
                    </p>
                  </div>
                </div>
                
                <div className="reg1011-profile-actions">
                  <button 
                    type="submit"
                    className="reg1011-save-button" 
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Notification Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="reg1011-modal-overlay">
          <div className="reg1011-modal">
            <div className="reg1011-modal-header">
              <h3>Change Password</h3>
              <button className="reg1011-modal-close" onClick={closePasswordModal}>×</button>
            </div>
            
            <div className="reg1011-modal-content">
              <form onSubmit={submitPasswordChange}>
                <div className="reg1011-input-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter your current password"
                    required
                  />
                </div>
                
                <div className="reg1011-input-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Enter your new password"
                    required
                  />
                </div>
                
                <div className="reg1011-input-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    required
                  />
                </div>
                
                <div className="reg1011-password-requirements">
                  <p>Password requirements:</p>
                  <ul>
                    <li>At least 8 characters long</li>
                    <li>Include at least one uppercase letter</li>
                    <li>Include at least one number</li>
                    <li>Include at least one special character</li>
                  </ul>
                </div>
                
                <div className="reg1011-modal-actions">
                  <button 
                    type="submit"
                    className="reg1011-save-button" 
                    disabled={loading}
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button 
                    type="button"
                    className="reg1011-cancel-button" 
                    onClick={closePasswordModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;