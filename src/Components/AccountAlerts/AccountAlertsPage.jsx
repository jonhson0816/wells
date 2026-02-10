import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AccountAlertsPage.css';

const AccountAlertsPage = () => {
  const navigate = useNavigate();
  const [alertSettings, setAlertSettings] = useState({
    balanceAlerts: {
      enabled: true,
      threshold: 500,
      notificationMethod: ['email', 'push']
    },
    transactionAlerts: {
      largeDebits: {
        enabled: true,
        threshold: 200,
        notificationMethod: ['email', 'push', 'text']
      },
      largeCredits: {
        enabled: false,
        threshold: 1000,
        notificationMethod: ['email']
      },
      atmWithdrawals: {
        enabled: true,
        threshold: 0, // Any amount
        notificationMethod: ['push', 'text']
      },
      internationalTransactions: {
        enabled: true,
        threshold: 0, // Any amount
        notificationMethod: ['email', 'push', 'text']
      }
    },
    securityAlerts: {
      loginAttempts: {
        enabled: true,
        notificationMethod: ['email', 'push', 'text']
      },
      passwordChanges: {
        enabled: true,
        notificationMethod: ['email', 'text']
      },
      profileUpdates: {
        enabled: true,
        notificationMethod: ['email']
      }
    },
    statementAlerts: {
      statementAvailable: {
        enabled: true,
        notificationMethod: ['email']
      },
      paymentReminders: {
        enabled: true,
        daysBeforeDue: 3,
        notificationMethod: ['email', 'push']
      }
    }
  });

  const [activeTab, setActiveTab] = useState('balance');
  const [contactInfo, setContactInfo] = useState({
    email: 'johndoe@example.com',
    phone: '(555) 123-4567',
    pushEnabled: true
  });
  const [isEditing, setIsEditing] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = 'https://wellsapi-1.onrender.com';
  
  // Get auth token from localStorage
  const getAuthToken = () => {
    const token = localStorage.getItem('wellsFargoAuthToken');
    if (!token) {
      console.warn('No authentication token found in localStorage');
      // You might want to redirect to login page here
      // navigate('/login');
    }
    return token;
  };

  // Configure axios headers
  const getAxiosConfig = () => {
    return {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      }
    };
  };

  // Fetch user's alert settings from the API
  const fetchUserAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${apiUrl}/account-alerts`,
        getAxiosConfig()
      );
      
      if (response.data && response.data.data) {
        setAlertSettings(response.data.data.alerts);
        setContactInfo({
          email: response.data.data.contactInfo.email,
          phone: response.data.data.contactInfo.phone,
          pushEnabled: response.data.data.contactInfo.pushEnabled
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setErrorMessage('Failed to load your alert settings. Please try again later.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAlerts();
  }, []);

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const goToAccount = () => {
    navigate('/checking-account');
  };

  const handleNotificationMethodChange = (category, alert, method) => {
    setAlertSettings(prevSettings => {
      const newSettings = { ...prevSettings };
      
      if (category === 'balanceAlerts') {
        const currentMethods = [...newSettings[category].notificationMethod];
        if (currentMethods.includes(method)) {
          newSettings[category].notificationMethod = currentMethods.filter(m => m !== method);
        } else {
          newSettings[category].notificationMethod = [...currentMethods, method];
        }
      } else {
        const currentMethods = [...newSettings[category][alert].notificationMethod];
        if (currentMethods.includes(method)) {
          newSettings[category][alert].notificationMethod = currentMethods.filter(m => m !== method);
        } else {
          newSettings[category][alert].notificationMethod = [...currentMethods, method];
        }
      }
      
      return newSettings;
    });
  };

  const handleToggleAlert = (category, alert = null) => {
    setAlertSettings(prevSettings => {
      const newSettings = { ...prevSettings };
      
      if (alert === null) {
        // This is for balanceAlerts which doesn't have a sub-category
        newSettings[category].enabled = !newSettings[category].enabled;
      } else {
        newSettings[category][alert].enabled = !newSettings[category][alert].enabled;
      }
      
      return newSettings;
    });
  };

  const handleThresholdChange = (category, alert, value) => {
    setAlertSettings(prevSettings => {
      const newSettings = { ...prevSettings };
      
      if (alert === null) {
        // This is for balanceAlerts which doesn't have a sub-category
        newSettings[category].threshold = value;
      } else {
        newSettings[category][alert].threshold = value;
      }
      
      return newSettings;
    });
  };

  const handleUpdateContact = (field, value) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save contact information to the backend
  const saveContactInfo = async () => {
    try {
      const response = await axios.put(
        `${apiUrl}/account-alerts/contact`,
        contactInfo,
        getAxiosConfig()
      );
      
      if (response.data && response.data.success) {
        setSuccessMessage('Your contact information has been updated successfully.');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
      setIsEditing(null);
    } catch (error) {
      console.error('Error updating contact info:', error);
      setErrorMessage('Failed to update your contact information. Please try again.');
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
  };

  // Save individual alert category
  const saveAlertCategory = async (category, subcategory = null) => {
    try {
      let endpoint = `${apiUrl}/account-alerts/${category}`;
      let payload;
      
      if (subcategory) {
        endpoint += `/${subcategory}`;
        payload = alertSettings[category][subcategory];
      } else {
        payload = alertSettings[category];
      }

      const response = await axios.put(endpoint, payload, getAxiosConfig());
      
      if (response.data && response.data.success) {
        setSuccessMessage(`Your ${category} alert settings have been updated successfully.`);
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error(`Error updating ${category} alerts:`, error);
      setErrorMessage(`Failed to update your ${category} alert settings. Please try again.`);
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
  };

  // Save all alert settings
  const saveAllChanges = async () => {
    try {
      const response = await axios.put(
        `${apiUrl}/account-alerts`,
        { alertSettings, contactInfo },
        getAxiosConfig()
      );
      
      if (response.data && response.data.success) {
        setSuccessMessage('Your alert preferences have been updated successfully.');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
      setIsEditing(null);
    } catch (error) {
      console.error('Error updating all settings:', error);
      setErrorMessage('Failed to update your alert settings. Please try again.');
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
  };

  // Save changes based on context
  const saveChanges = () => {
    if (isEditing === 'email' || isEditing === 'phone') {
      saveContactInfo();
    } else {
      saveAllChanges();
    }
  };

  const renderBalanceAlerts = () => {
    return (
      <div className="alert-section">
        <div className="alert-item">
          <div className="alert-header">
            <div className="alert-title">
              <h3>Low Balance Alert</h3>
              <p>Get notified when your account balance falls below a specified amount.</p>
            </div>
            <div className="alert-toggle">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={alertSettings.balanceAlerts.enabled}
                  onChange={() => handleToggleAlert('balanceAlerts')}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
          
          {alertSettings.balanceAlerts.enabled && (
            <div className="alert-details">
              <div className="threshold-setting">
                <label>Alert me when balance is below:</label>
                <div className="amount-input-container">
                  <span className="currency-symbol">$</span>
                  <input 
                    type="number" 
                    value={alertSettings.balanceAlerts.threshold}
                    onChange={(e) => handleThresholdChange('balanceAlerts', null, parseInt(e.target.value) || 0)}
                    className="threshold-input"
                  />
                </div>
              </div>
              
              <div className="notification-methods">
                <label>Notification Methods:</label>
                <div className="method-options">
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.balanceAlerts.notificationMethod.includes('email')}
                      onChange={() => handleNotificationMethodChange('balanceAlerts', null, 'email')} 
                    />
                    Email
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.balanceAlerts.notificationMethod.includes('text')}
                      onChange={() => handleNotificationMethodChange('balanceAlerts', null, 'text')} 
                    />
                    Text Message
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.balanceAlerts.notificationMethod.includes('push')}
                      onChange={() => handleNotificationMethodChange('balanceAlerts', null, 'push')} 
                    />
                    Push Notification
                  </label>
                </div>
              </div>
              <div className="save-section">
                <button 
                  className="save-button"
                  onClick={() => saveAlertCategory('balance')}
                >
                  Save Balance Alerts
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTransactionAlerts = () => {
    return (
      <div className="alert-section">
        <div className="alert-item">
          <div className="alert-header">
            <div className="alert-title">
              <h3>Large Debits</h3>
              <p>Get notified when a large withdrawal or payment occurs.</p>
            </div>
            <div className="alert-toggle">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={alertSettings.transactionAlerts.largeDebits.enabled}
                  onChange={() => handleToggleAlert('transactionAlerts', 'largeDebits')}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
          
          {alertSettings.transactionAlerts.largeDebits.enabled && (
            <div className="alert-details">
              <div className="threshold-setting">
                <label>Alert me for transactions over:</label>
                <div className="amount-input-container">
                  <span className="currency-symbol">$</span>
                  <input 
                    type="number" 
                    value={alertSettings.transactionAlerts.largeDebits.threshold}
                    onChange={(e) => handleThresholdChange('transactionAlerts', 'largeDebits', parseInt(e.target.value) || 0)}
                    className="threshold-input"
                  />
                </div>
              </div>
              
              <div className="notification-methods">
                <label>Notification Methods:</label>
                <div className="method-options">
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.transactionAlerts.largeDebits.notificationMethod.includes('email')}
                      onChange={() => handleNotificationMethodChange('transactionAlerts', 'largeDebits', 'email')} 
                    />
                    Email
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.transactionAlerts.largeDebits.notificationMethod.includes('text')}
                      onChange={() => handleNotificationMethodChange('transactionAlerts', 'largeDebits', 'text')} 
                    />
                    Text Message
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.transactionAlerts.largeDebits.notificationMethod.includes('push')}
                      onChange={() => handleNotificationMethodChange('transactionAlerts', 'largeDebits', 'push')} 
                    />
                    Push Notification
                  </label>
                </div>
              </div>
              <div className="save-section">
                <button 
                  className="save-button"
                  onClick={() => saveAlertCategory('transaction', 'largeDebits')}
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="alert-item">
          <div className="alert-header">
            <div className="alert-title">
              <h3>Large Credits</h3>
              <p>Get notified when a large deposit is made to your account.</p>
            </div>
            <div className="alert-toggle">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={alertSettings.transactionAlerts.largeCredits.enabled}
                  onChange={() => handleToggleAlert('transactionAlerts', 'largeCredits')}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
          
          {alertSettings.transactionAlerts.largeCredits.enabled && (
            <div className="alert-details">
              <div className="threshold-setting">
                <label>Alert me for deposits over:</label>
                <div className="amount-input-container">
                  <span className="currency-symbol">$</span>
                  <input 
                    type="number" 
                    value={alertSettings.transactionAlerts.largeCredits.threshold}
                    onChange={(e) => handleThresholdChange('transactionAlerts', 'largeCredits', parseInt(e.target.value) || 0)}
                    className="threshold-input"
                  />
                </div>
              </div>
              
              <div className="notification-methods">
                <label>Notification Methods:</label>
                <div className="method-options">
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.transactionAlerts.largeCredits.notificationMethod.includes('email')}
                      onChange={() => handleNotificationMethodChange('transactionAlerts', 'largeCredits', 'email')} 
                    />
                    Email
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.transactionAlerts.largeCredits.notificationMethod.includes('text')}
                      onChange={() => handleNotificationMethodChange('transactionAlerts', 'largeCredits', 'text')} 
                    />
                    Text Message
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.transactionAlerts.largeCredits.notificationMethod.includes('push')}
                      onChange={() => handleNotificationMethodChange('transactionAlerts', 'largeCredits', 'push')} 
                    />
                    Push Notification
                  </label>
                </div>
              </div>
              <div className="save-section">
                <button 
                  className="save-button"
                  onClick={() => saveAlertCategory('transaction', 'largeCredits')}
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="alert-item">
          <div className="alert-header">
            <div className="alert-title">
              <h3>ATM Withdrawals</h3>
              <p>Get notified when ATM withdrawals occur on your account.</p>
            </div>
            <div className="alert-toggle">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={alertSettings.transactionAlerts.atmWithdrawals.enabled}
                  onChange={() => handleToggleAlert('transactionAlerts', 'atmWithdrawals')}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
          
          {alertSettings.transactionAlerts.atmWithdrawals.enabled && (
            <div className="alert-details">
              <div className="notification-methods">
                <label>Notification Methods:</label>
                <div className="method-options">
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.transactionAlerts.atmWithdrawals.notificationMethod.includes('email')}
                      onChange={() => handleNotificationMethodChange('transactionAlerts', 'atmWithdrawals', 'email')} 
                    />
                    Email
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.transactionAlerts.atmWithdrawals.notificationMethod.includes('text')}
                      onChange={() => handleNotificationMethodChange('transactionAlerts', 'atmWithdrawals', 'text')} 
                    />
                    Text Message
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.transactionAlerts.atmWithdrawals.notificationMethod.includes('push')}
                      onChange={() => handleNotificationMethodChange('transactionAlerts', 'atmWithdrawals', 'push')} 
                    />
                    Push Notification
                  </label>
                </div>
              </div>
              <div className="save-section">
                <button 
                  className="save-button"
                  onClick={() => saveAlertCategory('transaction', 'atmWithdrawals')}
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="alert-item">
          <div className="alert-header">
            <div className="alert-title">
              <h3>International Transactions</h3>
              <p>Get notified when transactions occur outside your country.</p>
            </div>
            <div className="alert-toggle">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={alertSettings.transactionAlerts.internationalTransactions.enabled}
                  onChange={() => handleToggleAlert('transactionAlerts', 'internationalTransactions')}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
          
          {alertSettings.transactionAlerts.internationalTransactions.enabled && (
            <div className="alert-details">
              <div className="notification-methods">
                <label>Notification Methods:</label>
                <div className="method-options">
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.transactionAlerts.internationalTransactions.notificationMethod.includes('email')}
                      onChange={() => handleNotificationMethodChange('transactionAlerts', 'internationalTransactions', 'email')} 
                    />
                    Email
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.transactionAlerts.internationalTransactions.notificationMethod.includes('text')}
                      onChange={() => handleNotificationMethodChange('transactionAlerts', 'internationalTransactions', 'text')} 
                    />
                    Text Message
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.transactionAlerts.internationalTransactions.notificationMethod.includes('push')}
                      onChange={() => handleNotificationMethodChange('transactionAlerts', 'internationalTransactions', 'push')} 
                    />
                    Push Notification
                  </label>
                </div>
              </div>
              <div className="save-section">
                <button 
                  className="save-button"
                  onClick={() => saveAlertCategory('transaction', 'internationalTransactions')}
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSecurityAlerts = () => {
    return (
      <div className="alert-section">
        <div className="alert-item">
          <div className="alert-header">
            <div className="alert-title">
              <h3>Login Attempts</h3>
              <p>Get notified of successful and unsuccessful login attempts.</p>
            </div>
            <div className="alert-toggle">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={alertSettings.securityAlerts.loginAttempts.enabled}
                  onChange={() => handleToggleAlert('securityAlerts', 'loginAttempts')}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
          
          {alertSettings.securityAlerts.loginAttempts.enabled && (
            <div className="alert-details">
              <div className="notification-methods">
                <label>Notification Methods:</label>
                <div className="method-options">
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.securityAlerts.loginAttempts.notificationMethod.includes('email')}
                      onChange={() => handleNotificationMethodChange('securityAlerts', 'loginAttempts', 'email')} 
                    />
                    Email
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.securityAlerts.loginAttempts.notificationMethod.includes('text')}
                      onChange={() => handleNotificationMethodChange('securityAlerts', 'loginAttempts', 'text')} 
                    />
                    Text Message
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.securityAlerts.loginAttempts.notificationMethod.includes('push')}
                      onChange={() => handleNotificationMethodChange('securityAlerts', 'loginAttempts', 'push')} 
                    />
                    Push Notification
                  </label>
                </div>
              </div>
              <div className="save-section">
                <button 
                  className="save-button"
                  onClick={() => saveAlertCategory('security', 'loginAttempts')}
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="alert-item">
          <div className="alert-header">
            <div className="alert-title">
              <h3>Password Changes</h3>
              <p>Get notified when your password is changed or reset.</p>
            </div>
            <div className="alert-toggle">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={alertSettings.securityAlerts.passwordChanges.enabled}
                  onChange={() => handleToggleAlert('securityAlerts', 'passwordChanges')}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
          
          {alertSettings.securityAlerts.passwordChanges.enabled && (
            <div className="alert-details">
              <div className="notification-methods">
                <label>Notification Methods:</label>
                <div className="method-options">
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.securityAlerts.passwordChanges.notificationMethod.includes('email')}
                      onChange={() => handleNotificationMethodChange('securityAlerts', 'passwordChanges', 'email')} 
                    />
                    Email
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.securityAlerts.passwordChanges.notificationMethod.includes('text')}
                      onChange={() => handleNotificationMethodChange('securityAlerts', 'passwordChanges', 'text')} 
                    />
                    Text Message
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.securityAlerts.passwordChanges.notificationMethod.includes('push')}
                      onChange={() => handleNotificationMethodChange('securityAlerts', 'passwordChanges', 'push')} 
                    />
                    Push Notification
                  </label>
                </div>
              </div>
              <div className="save-section">
                <button 
                  className="save-button"
                  onClick={() => saveAlertCategory('security', 'passwordChanges')}
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="alert-item">
          <div className="alert-header">
            <div className="alert-title">
              <h3>Profile Updates</h3>
              <p>Get notified when your profile information is updated.</p>
            </div>
            <div className="alert-toggle">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={alertSettings.securityAlerts.profileUpdates.enabled}
                  onChange={() => handleToggleAlert('securityAlerts', 'profileUpdates')}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
          
          {alertSettings.securityAlerts.profileUpdates.enabled && (
            <div className="alert-details">
              <div className="notification-methods">
                <label>Notification Methods:</label>
                <div className="method-options">
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.securityAlerts.profileUpdates.notificationMethod.includes('email')}
                      onChange={() => handleNotificationMethodChange('securityAlerts', 'profileUpdates', 'email')} 
                    />
                    Email
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.securityAlerts.profileUpdates.notificationMethod.includes('text')}
                      onChange={() => handleNotificationMethodChange('securityAlerts', 'profileUpdates', 'text')} 
                    />
                    Text Message
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.securityAlerts.profileUpdates.notificationMethod.includes('push')}
                      onChange={() => handleNotificationMethodChange('securityAlerts', 'profileUpdates', 'push')} 
                    />
                    Push Notification
                  </label>
                </div>
              </div>
              <div className="save-section">
                <button 
                  className="save-button"
                  onClick={() => saveAlertCategory('security', 'profileUpdates')}
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStatementAlerts = () => {
    return (
      <div className="alert-section">
        <div className="alert-item">
          <div className="alert-header">
            <div className="alert-title">
              <h3>Statement Available</h3>
              <p>Get notified when a new statement is available.</p>
            </div>
            <div className="alert-toggle">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={alertSettings.statementAlerts.statementAvailable.enabled}
                  onChange={() => handleToggleAlert('statementAlerts', 'statementAvailable')}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
          
          {alertSettings.statementAlerts.statementAvailable.enabled && (
            <div className="alert-details">
              <div className="notification-methods">
                <label>Notification Methods:</label>
                <div className="method-options">
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.statementAlerts.statementAvailable.notificationMethod.includes('email')}
                      onChange={() => handleNotificationMethodChange('statementAlerts', 'statementAvailable', 'email')} 
                    />
                    Email
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.statementAlerts.statementAvailable.notificationMethod.includes('text')}
                      onChange={() => handleNotificationMethodChange('statementAlerts', 'statementAvailable', 'text')} 
                    />
                    Text Message
                  </label>
                  <label className="method-checkbox">
                    <input 
                      type="checkbox" 
                      checked={alertSettings.statementAlerts.statementAvailable.notificationMethod.includes('push')}
                      onChange={() => handleNotificationMethodChange('statementAlerts', 'paymentReminders', 'push')} 
                    />
                    Push Notification
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContactInfo = () => {
    return (
      <div className="alert-section contact-info-section">
        <h3>Contact Information for Alerts</h3>
        <p>Make sure your contact information is up-to-date to receive alerts properly.</p>
        
        <div className="contact-info-item">
          <div className="contact-info-header">
            <span>Email Address</span>
            {isEditing === 'email' ? (
              <button className="save-button" onClick={saveChanges}>Save</button>
            ) : (
              <button className="edit-button" onClick={() => setIsEditing('email')}>Edit</button>
            )}
          </div>
          {isEditing === 'email' ? (
            <input 
              type="email" 
              value={contactInfo.email} 
              onChange={(e) => handleUpdateContact('email', e.target.value)}
              className="contact-input" 
            />
          ) : (
            <div className="contact-info-value">{contactInfo.email}</div>
          )}
        </div>
        
        <div className="contact-info-item">
          <div className="contact-info-header">
            <span>Mobile Phone Number</span>
            {isEditing === 'phone' ? (
              <button className="save-button" onClick={saveChanges}>Save</button>
            ) : (
              <button className="edit-button" onClick={() => setIsEditing('phone')}>Edit</button>
            )}
          </div>
          {isEditing === 'phone' ? (
            <input 
              type="tel" 
              value={contactInfo.phone} 
              onChange={(e) => handleUpdateContact('phone', e.target.value)}
              className="contact-input" 
            />
          ) : (
            <div className="contact-info-value">{contactInfo.phone}</div>
          )}
          <p className="contact-note">Standard text message and data rates may apply.</p>
        </div>
        
        <div className="contact-info-item">
          <div className="contact-info-header">
            <span>Push Notifications</span>
          </div>
          <div className="push-toggle">
            <label className="switch">
              <input 
                type="checkbox" 
                checked={contactInfo.pushEnabled}
                onChange={() => handleUpdateContact('pushEnabled', !contactInfo.pushEnabled)}
              />
              <span className="slider round"></span>
            </label>
            <span className="push-status">{contactInfo.pushEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <p className="contact-note">Make sure you have our mobile app installed to receive push notifications.</p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    // This would typically fetch the user's preferences from an API
    // Simulating with the initial state for this demo
  }, []);

  return (
    <div className="account-alerts-page">
      <div className="breadcrumb">
        <span onClick={goToDashboard} className="breadcrumb-link">Dashboard</span>
        <span className="breadcrumb-separator">›</span>
        <span onClick={goToAccount} className="breadcrumb-link">My Account</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">Alerts</span>
      </div>
      
      <div className="page-header">
        <h1>Account Alerts</h1>
        <p>Stay informed about your account activity with customized alerts.</p>
      </div>
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
      <div className="alert-tabs">
        <button 
          className={`tab-button ${activeTab === 'balance' ? 'active' : ''}`}
          onClick={() => setActiveTab('balance')}
        >
          Balance Alerts
        </button>
        <button 
          className={`tab-button ${activeTab === 'transaction' ? 'active' : ''}`}
          onClick={() => setActiveTab('transaction')}
        >
          Transaction Alerts
        </button>
        <button 
          className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security Alerts
        </button>
        <button 
          className={`tab-button ${activeTab === 'statement' ? 'active' : ''}`}
          onClick={() => setActiveTab('statement')}
        >
          Statement & Payment
        </button>
        <button 
          className={`tab-button ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          Contact Info
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'balance' && renderBalanceAlerts()}
        {activeTab === 'transaction' && renderTransactionAlerts()}
        {activeTab === 'security' && renderSecurityAlerts()}
        {activeTab === 'statement' && renderStatementAlerts()}
        {activeTab === 'contact' && renderContactInfo()}
      </div>
      
      <div className="actions">
        <button className="primary-button" onClick={saveChanges}>Save All Changes</button>
        <button className="secondary-button" onClick={goToAccount}>Cancel</button>
      </div>
      
      <div className="help-section">
        <h3>Need Help?</h3>
        <p>For questions about alerts or if you're not receiving alerts as expected, please contact our customer service at 1-800-555-1234.</p>
      </div>
    </div>
  );
};

export default AccountAlertsPage;