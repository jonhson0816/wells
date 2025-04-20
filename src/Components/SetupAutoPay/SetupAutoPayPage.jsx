import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import axios from 'axios';
import './SetupAutoPayPage.css';

// Date formatting utility function
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Currency formatting utility function
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Payment frequency formatting utility
const formatFrequency = (frequency, customFrequency) => {
  const frequencyMap = {
    'weekly': 'Weekly',
    'biweekly': 'Every 2 weeks',
    'monthly': 'Monthly',
    'bimonthly': 'Every 2 months',
    'quarterly': 'Quarterly',
    'semiannually': 'Every 6 months',
    'annually': 'Yearly',
    'custom': `Every ${customFrequency || '?'} days`
  };
  
  return frequencyMap[frequency] || frequency;
};

// Main AutoPay Component
const AutoPay = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('current');
  const [autopaySettings, setAutopaySettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewAutopayForm, setShowNewAutopayForm] = useState(false);
  const [payees, setPayees] = useState({ billPayees: [], transferPayees: [] });
  const [selectedAutopay, setSelectedAutopay] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [userAccounts, setUserAccounts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // New AutoPay Form State
  const [formData, setFormData] = useState({
    payFromAccount: '',
    sourceAccountNumber: '',
    payeeType: 'bill',
    selectedPayee: '',
    payeeName: '',
    payeeAccountNumber: '',
    paymentType: 'fixed',
    paymentAmount: '',
    frequency: 'monthly',
    customFrequency: '',
    startDate: '',
    endCondition: 'never',
    endDate: '',
    numOccurrences: '',
    notifications: {
      email: true,
      reminder: true,
      textForFailure: false
    }
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  // API client with auth headers 
  const getApiClient = () => {
    const token = localStorage.getItem('wellsFargoAuthToken');
    // Extract just the token part if it's stored with a prefix
    const actualToken = token.includes(':') ? token.split(':')[1].trim() : token;
    
    const API_URL = import.meta.env?.VITE_API_URL || 'https://wellsapi.onrender.com';
    
    return axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${actualToken}`
      }
    });
  };
  
  // Fetch autopay settings on component mount
useEffect(() => {
  const fetchAutopayData = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const api = getApiClient();
      
      console.log('Fetching autopay settings...'); // Debug log
      const response = await api.get('/autopay');
      
      console.log('Autopay API response:', response.data); // Debug log
      
      if (response.data && response.data.success) {
        setAutopaySettings(response.data.data || []);
        console.log('Set autopay settings:', response.data.data); // Debug log
      } else {
        console.error('API returned unsuccessful response:', response.data);
        throw new Error(response.data?.error || 'Failed to fetch autopay settings');
      }
    } catch (err) {
      console.error('Error fetching autopay settings:', err);
      setError(err.message || 'Failed to load autopay settings');
      // Initialize with empty array to prevent undefined errors
      setAutopaySettings([]);
    } finally {
      setLoading(false);
    }
  };
  
  fetchAutopayData();
  
  // Re-fetch data when authentication status changes
  return () => {
    // Cleanup if needed
  };
}, [navigate, isAuthenticated, currentUser?.id]);

  
  // Fetch payees when opening new autopay form
const fetchPayees = async () => {
  try {
    setLoading(true);
    const api = getApiClient();
    
    // Fetch payees
    const payeesResponse = await api.get('/autopay/payees');
    
    if (payeesResponse.data.success) {
      console.log("Payees loaded:", payeesResponse.data.data);
      setPayees(payeesResponse.data.data);
    } else {
      throw new Error(payeesResponse.data.error || 'Failed to fetch payees');
    }
    
    // Fetch accounts if not already available
    const accountsResponse = await api.get('/dashboard');
    
    if (accountsResponse.data.success && accountsResponse.data.data.accounts) {
      console.log("Accounts loaded:", accountsResponse.data.data.accounts);
      setUserAccounts(accountsResponse.data.data.accounts);
      
      // If there are accounts, set the default source account
      if (accountsResponse.data.data.accounts.length > 0) {
        const defaultAccount = accountsResponse.data.data.accounts.find(
          account => !account.type.toLowerCase().includes('credit')
        ) || accountsResponse.data.data.accounts[0];
        
        setFormData(prev => ({
          ...prev,
          payFromAccount: defaultAccount.id || defaultAccount._id,
          sourceAccountNumber: defaultAccount.accountNumber
        }));
      }
    }
  } catch (err) {
    console.error('Error fetching data:', err);
    setError(err.message || 'Failed to load data');
  } finally {
    setLoading(false);
  }
};

const handleEditAutopay = (autopay) => {
  // Set form to editing mode
  setIsEditing(true);
  setEditId(autopay._id);
  
  // Populate form with autopay data
  setFormData({
    payFromAccount: autopay.sourceAccount,
    sourceAccountNumber: autopay.sourceAccountNumber,
    payeeType: autopay.payeeType,
    selectedPayee: autopay.payeeId,
    payeeName: autopay.payeeName,
    payeeAccountNumber: autopay.payeeAccountNumber,
    paymentType: autopay.paymentType,
    paymentAmount: autopay.amount?.toString() || '',
    frequency: autopay.frequency,
    customFrequency: autopay.customFrequency?.days?.toString() || '',
    startDate: autopay.startDate ? new Date(autopay.startDate).toISOString().split('T')[0] : '',
    endCondition: autopay.endCondition,
    endDate: autopay.endDate ? new Date(autopay.endDate).toISOString().split('T')[0] : '',
    numOccurrences: autopay.occurrences?.toString() || '',
    notifications: {
      email: autopay.notifications?.email ?? true,
      reminder: autopay.notifications?.reminder ?? true,
      textForFailure: autopay.notifications?.textForFailure ?? false
    }
  });
  
  // Show the form
  setShowNewAutopayForm(true);
  
  // Fetch payees if needed
  if (payees.billPayees.length === 0 || payees.transferPayees.length === 0) {
    fetchPayees();
  }
};

  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('notifications.')) {
      const notificationKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationKey]: checked
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Clear related errors when field is modified
      if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: '' }));
      }
      
      // Special handling for source account change
      if (name === 'payFromAccount') {
        const selectedAccount = payees.transferPayees.find(account => account.id === value);
        if (selectedAccount) {
          setFormData(prev => ({
            ...prev,
            sourceAccountNumber: selectedAccount.accountNum
          }));
        }
      }
      
      // Special handling for payee type change
      if (name === 'payeeType') {
        setFormData(prev => ({
          ...prev,
          selectedPayee: ''
        }));
      }
      
      // Special handling for payee selection
      // Special handling for source account change
      if (name === 'payFromAccount') {
        const selectedAccount = userAccounts.find(
          account => (account.id === value || account._id === value)
        );
        if (selectedAccount) {
          setFormData(prev => ({
            ...prev,
            sourceAccountNumber: selectedAccount.accountNumber
          }));
        }
      }

      // Special handling for payee selection
      if (name === 'selectedPayee') {
        let selectedPayeeObject;
        
        if (formData.payeeType === 'bill') {
          selectedPayeeObject = payees.billPayees.find(payee => payee.id === value);
          if (selectedPayeeObject) {
            setFormData(prev => ({
              ...prev,
              payeeName: selectedPayeeObject.name,
              payeeAccountNumber: selectedPayeeObject.accountNum
            }));
          }
        } else if (formData.payeeType === 'transfer') {
          selectedPayeeObject = userAccounts.find(
            account => (account.id === value || account._id === value)
          );
          if (selectedPayeeObject) {
            setFormData(prev => ({
              ...prev,
              payeeName: selectedPayeeObject.name || selectedPayeeObject.type,
              payeeAccountNumber: selectedPayeeObject.accountNumber
            }));
          }
        }
      }
      
      // Handle frequency change 
      if (name === 'frequency' && value !== 'custom') {
        setFormData(prev => ({
          ...prev,
          customFrequency: ''
        }));
      }
      
      // Handle end condition change
      if (name === 'endCondition') {
        if (value === 'never') {
          setFormData(prev => ({
            ...prev,
            endDate: '',
            numOccurrences: ''
          }));
        } else if (value === 'date') {
          setFormData(prev => ({
            ...prev,
            numOccurrences: ''
          }));
        } else if (value === 'occurrences') {
          setFormData(prev => ({
            ...prev,
            endDate: ''
          }));
        }
      }
    }
  };
  
  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!formData.payFromAccount) {
      errors.payFromAccount = 'Please select a source account';
    }
    
    if (!formData.selectedPayee) {
      errors.selectedPayee = 'Please select a payee';
    }
    
    if (formData.paymentType === 'fixed' && (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0)) {
      errors.paymentAmount = 'Please enter a valid payment amount';
    }
    
    if (!formData.frequency) {
      errors.frequency = 'Please select a payment frequency';
    }
    
    if (formData.frequency === 'custom' && (!formData.customFrequency || parseInt(formData.customFrequency) <= 0)) {
      errors.customFrequency = 'Please enter a valid number of days';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Please select a start date';
    }
    
    if (formData.endCondition === 'date' && !formData.endDate) {
      errors.endDate = 'Please select an end date';
    }
    
    if (formData.endCondition === 'occurrences' && 
        (!formData.numOccurrences || parseInt(formData.numOccurrences) <= 0)) {
      errors.numOccurrences = 'Please enter a valid number of payments';
    }
    
    if (formData.endCondition === 'date' && formData.startDate && formData.endDate &&
        new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = 'End date must be after start date';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const formatDateForSubmission = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString();
  };
  
  // Handle form submission for creating new autopay
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      const api = getApiClient();
      
      // Find the selected account to ensure we have all its details
      const selectedAccount = userAccounts.find(
        account => (account.id === formData.payFromAccount || account._id === formData.payFromAccount)
      );
      
      if (!selectedAccount) {
        throw new Error('Selected account not found in available accounts');
      }
      
      // Create a submission data object with the ACTUAL account ID
      const submissionData = {
        ...formData,
        payFromAccount: selectedAccount._id || selectedAccount.id,
        sourceAccountNumber: selectedAccount.accountNumber
      };
      
      let response;
      
      // Different API calls for create vs update
      if (isEditing && editId) {
        console.log('Updating autopay:', editId);
        response = await api.put(`/autopay/${editId}`, submissionData);
      } else {
        console.log('Creating new autopay');
        response = await api.post('/autopay', submissionData);
      }
      
      if (response.data.success) {
        // Handle the response data
        const autopayData = response.data.data;
        
        if (isEditing) {
          // Update existing autopay in the list
          setAutopaySettings(prev => 
            prev.map(autopay => autopay._id === editId ? autopayData : autopay)
          );
        } else {
          // Add new autopay to the list
          setAutopaySettings(prev => [...prev, autopayData]);
        }
        
        // Reset form and state
        setShowNewAutopayForm(false);
        setIsEditing(false);
        setEditId(null);
        
        // Reset form data
        setFormData({
          payFromAccount: '',
          sourceAccountNumber: '',
          payeeType: 'bill',
          selectedPayee: '',
          payeeName: '',
          payeeAccountNumber: '',
          paymentType: 'fixed',
          paymentAmount: '',
          frequency: 'monthly',
          customFrequency: '',
          startDate: '',
          endCondition: 'never',
          endDate: '',
          numOccurrences: '',
          notifications: {
            email: true,
            reminder: true,
            textForFailure: false
          }
        });
      } else {
        throw new Error(response.data.error || `Failed to ${isEditing ? 'update' : 'create'} autopay`);
      }
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} autopay:`, err);
      
      if (err.response && err.response.data) {
        console.error('Server error details:', err.response.data);
        setError(err.response.data.error || 'Server error occurred');
      } else {
        setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} autopay`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle update autopay status
  const handleUpdateStatus = async (autopayId, newStatus) => {
    try {
      setLoading(true);
      const api = getApiClient();
      const response = await api.put(`/autopay/${autopayId}`, { status: newStatus });
      
      if (response.data.success) {
        // Update the autopay in the list
        setAutopaySettings(prev => 
          prev.map(autopay => 
            autopay._id === autopayId ? response.data.data : autopay
          )
        );
      } else {
        throw new Error(response.data.error || 'Failed to update autopay status');
      }
    } catch (err) {
      console.error('Error updating autopay status:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update autopay status');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete autopay
  const handleDeleteAutopay = async () => {
    if (!selectedAutopay) return;
    
    try {
      setLoading(true);
      const api = getApiClient();
      const response = await api.delete(`/autopay/${selectedAutopay._id}`);
      
      if (response.data.success) {
        // Remove the autopay from the list
        setAutopaySettings(prev => 
          prev.filter(autopay => autopay._id !== selectedAutopay._id)
        );
        setShowConfirmDelete(false);
        setSelectedAutopay(null);
      } else {
        throw new Error(response.data.error || 'Failed to delete autopay');
      }
    } catch (err) {
      console.error('Error deleting autopay:', err);
      setError(err.response?.data?.error || err.message || 'Failed to delete autopay');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter autopays based on active tab
  const getFilteredAutopays = () => {
    if (activeTab === 'current') {
      return autopaySettings.filter(autopay => 
        autopay.status === 'active' || autopay.status === 'paused'
      );
    } else if (activeTab === 'completed') {
      return autopaySettings.filter(autopay => 
        autopay.status === 'completed'
      );
    } else if (activeTab === 'cancelled') {
      return autopaySettings.filter(autopay => 
        autopay.status === 'cancelled'
      );
    } else {
      return autopaySettings;
    }
  };
  
  // Filtered autopays based on active tab
  const filteredAutopays = getFilteredAutopays();

  useEffect(() => {
    console.log("Current accounts:", userAccounts);
    console.log("Current payees:", payees);
  }, [userAccounts, payees]);
  
  return (
    <div className="autopay-container">
      <header className="autopay-header">
        <div className="header-content">
          <img 
            src="/Images/wells fargo.jpeg" 
            alt="Wells Fargo Logo" 
            className="logo" 
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer' }}
          />
          <h1>Automatic Payments</h1>
        </div>
      </header>

      <main className="autopay-content">
        {/* Error message display */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        
        {/* AutoPay Overview Section */}
        <section className="autopay-overview">
          <div className="autopay-header-actions">
            <h2>Your Automatic Payments</h2>
            <button
              className="primary-button"
              onClick={() => {
                setShowNewAutopayForm(true);
                fetchPayees();
              }}
              disabled={loading}
            >
              Set Up New Automatic Payment
            </button>
          </div>
          
          <div className="autopay-tabs">
            <button
              className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
              onClick={() => setActiveTab('current')}
            >
              Current
            </button>
            <button
              className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </button>
            <button
              className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
              onClick={() => setActiveTab('cancelled')}
            >
              Cancelled
            </button>
            <button
              className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
          </div>
          
          {loading ? (
            <div className="loading">Loading automatic payments...</div>
          ) : filteredAutopays.length === 0 ? (
            <div className="no-autopays">
              <p>
                {activeTab === 'current' 
                  ? "You don't have any active automatic payments." 
                  : activeTab === 'completed'
                  ? "You don't have any completed automatic payments."
                  : activeTab === 'cancelled'
                  ? "You don't have any cancelled automatic payments."
                  : "You don't have any automatic payments."}
              </p>
              <button
                className="primary-button"
                onClick={() => {
                  setShowNewAutopayForm(true);
                  fetchPayees();
                }}
              >
                Set Up Your First Automatic Payment
              </button>
            </div>
          ) : (
            <div className="autopay-list">
              {filteredAutopays.map(autopay => (
                <div 
                  key={autopay._id} 
                  className={`autopay-item status-${autopay.status}`}
                >
                  <div className="autopay-item-header">
                    <div className="autopay-payee">
                      <h3>{autopay.payeeName}</h3>
                      <span className="autopay-account">
                        Account ending in {autopay.payeeAccountNumber.slice(-4)}
                      </span>
                    </div>
                    <div className="autopay-status">
                      <span className={`status-badge ${autopay.status}`}>
                        {autopay.status.charAt(0).toUpperCase() + autopay.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="autopay-item-details">
                    <div className="detail-column">
                      <div className="detail-item">
                        <span className="detail-label">Amount</span>
                        <span className="detail-value">
                          {autopay.paymentType === 'fixed' 
                            ? formatCurrency(autopay.amount)
                            : autopay.paymentType === 'minimum'
                            ? 'Minimum Payment'
                            : autopay.paymentType === 'statement'
                            ? 'Statement Balance'
                            : 'Full Balance'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Frequency</span>
                        <span className="detail-value">
                          {formatFrequency(autopay.frequency, autopay.customFrequency)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="detail-column">
                      <div className="detail-item">
                        <span className="detail-label">From Account</span>
                        <span className="detail-value">
                          Account ending in {autopay.sourceAccountNumber.slice(-4)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Next Payment</span>
                        <span className="detail-value">
                          {autopay.status === 'active' 
                            ? formatDate(autopay.nextPaymentDate)
                            : '-'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="detail-column">
                      <div className="detail-item">
                        <span className="detail-label">End Condition</span>
                        <span className="detail-value">
                          {autopay.endCondition === 'never' 
                            ? 'No end date'
                            : autopay.endCondition === 'date'
                            ? `Until ${formatDate(autopay.endDate)}`
                            : `${autopay.remainingOccurrences || 0} of ${autopay.occurrences} payments remaining`}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Last Payment</span>
                        <span className="detail-value">
                          {autopay.lastPaymentDate 
                            ? `${formatDate(autopay.lastPaymentDate)} (${formatCurrency(autopay.lastPaymentAmount)})`
                            : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="autopay-actions">
                    {autopay.status === 'active' && (
                      <button 
                        className="action-button pause"
                        onClick={() => handleUpdateStatus(autopay._id, 'paused')}
                      >
                        Pause
                      </button>
                    )}
                    {autopay.status === 'paused' && (
                      <button 
                        className="action-button resume"
                        onClick={() => handleUpdateStatus(autopay._id, 'active')}
                      >
                        Resume
                      </button>
                    )}
                    {(autopay.status === 'active' || autopay.status === 'paused') && (
                      <button 
                        onClick={() => handleEditAutopay(autopay)}
                        className="edit-btn"
                      >
                          Edit
                      </button>
                    )}
                    {(autopay.status === 'active' || autopay.status === 'paused') && (
                      <button 
                        className="action-button cancel"
                        onClick={() => {
                          setSelectedAutopay(autopay);
                          setShowConfirmDelete(true);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button 
                      className="action-button details"
                      onClick={() => navigate(`/autopay/details/${autopay._id}`, { state: { autopay } })}
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* New AutoPay Form Modal */}
        {showNewAutopayForm && (
          <div className="modal-overlay">
            <div className="modal-content autopay-form-modal">
              <div className="modal-header">
                <h2>{isEditing ? 'Edit Automatic Payment' : 'Set Up New Automatic Payment'}</h2>
                <button 
                  className="close-button"
                  onClick={() => setShowNewAutopayForm(false)}
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="autopay-form">

                {/* Source Account Selection */}
              <div className="form-section">
                <h3>Pay From</h3>
                <div className={`form-group ${formErrors.payFromAccount ? 'error' : ''}`}>
                  <label htmlFor="payFromAccount">Select Account</label>
                  <select
                    id="payFromAccount"
                    name="payFromAccount"
                    value={formData.payFromAccount}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Select an account</option>
                    {userAccounts && userAccounts.length > 0 ? (
                      userAccounts
                        .filter(account => !account.type.toLowerCase().includes('credit'))
                        .map(account => (
                          <option key={account.id || account._id} value={account.id || account._id}>
                            {account.name || account.type} - {account.accountNumber} ({formatCurrency(account.balance)})
                          </option>
                        ))
                    ) : (
                      <option value="" disabled>Loading accounts...</option>
                    )}
                  </select>

                  {formErrors.payFromAccount && (
                    <div className="error-message">{formErrors.payFromAccount}</div>
                  )}
                </div>
              </div>
                
                {/* Payee Selection */}
                <div className="form-section">
                  <h3>Pay To</h3>
                  <div className="form-group">
                    <label htmlFor="payeeType">Payee Type</label>
                    <div className="radio-group">
                      <div className="radio-option">
                        <input
                          type="radio"
                          id="payeeTypeBill"
                          name="payeeType"
                          value="bill"
                          checked={formData.payeeType === 'bill'}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <label htmlFor="payeeTypeBill">Bill Payment</label>
                      </div>
                      <div className="radio-option">
                        <input
                          type="radio"
                          id="payeeTypeTransfer"
                          name="payeeType"
                          value="transfer"
                          checked={formData.payeeType === 'transfer'}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <label htmlFor="payeeTypeTransfer">Wells Fargo Account</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`form-group ${formErrors.selectedPayee ? 'error' : ''}`}>
                    <label htmlFor="selectedPayee">Select Payee</label>
                    <select
                      id="selectedPayee"
                      name="selectedPayee"
                      value={formData.selectedPayee}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select a payee</option>
                      {formData.payeeType === 'bill' ? (
                        payees && payees.billPayees && payees.billPayees.length > 0 ? (
                          payees.billPayees.map(payee => (
                            <option key={payee.id} value={payee.id}>
                              {payee.name} - {payee.accountNum}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>Loading bill payees...</option>
                        )
                      ) : (
                        userAccounts && userAccounts.length > 0 ? (
                          userAccounts
                            .filter(account => (account.id !== formData.payFromAccount && 
                                              (account.id || account._id) !== formData.payFromAccount))
                            .map(account => (
                              <option key={account.id || account._id} value={account.id || account._id}>
                                {account.name || account.type} - {account.accountNumber}
                              </option>
                            ))
                        ) : (
                          <option value="" disabled>Loading accounts...</option>
                        )
                      )}
                    </select>
                    {formErrors.selectedPayee && (
                      <div className="error-message">{formErrors.selectedPayee}</div>
                    )}
                  </div>
                </div>
                
                {/* Payment Details */}
                <div className="form-section">
                  <h3>Payment Details</h3>
                  <div className="form-group">
                    <label htmlFor="paymentType">Payment Type</label>
                    <div className="radio-group">
                      <div className="radio-option">
                        <input
                          type="radio"
                          id="paymentTypeFixed"
                          name="paymentType"
                          value="fixed"
                          checked={formData.paymentType === 'fixed'}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <label htmlFor="paymentTypeFixed">Fixed Amount</label>
                      </div>
                      
                      {formData.payeeType === 'transfer' && (
                        <>
                          <div className="radio-option">
                            <input
                              type="radio"
                              id="paymentTypeMinimum"
                              name="paymentType"
                              value="minimum"
                              checked={formData.paymentType === 'minimum'}
                              onChange={handleChange}
                              disabled={loading}
                            />
                            <label htmlFor="paymentTypeMinimum">Minimum Payment</label>
                          </div>
                          <div className="radio-option">
                            <input
                              type="radio"
                              id="paymentTypeStatement"
                              name="paymentType"
                              value="statement"
                              checked={formData.paymentType === 'statement'}
                              onChange={handleChange}
                              disabled={loading}
                            />
                            <label htmlFor="paymentTypeStatement">Statement Balance</label>
                          </div>
                          <div className="radio-option">
                            <input
                              type="radio"
                              id="paymentTypeFull"
                              name="paymentType"
                              value="full"
                              checked={formData.paymentType === 'full'}
                              onChange={handleChange}
                              disabled={loading}
                            />
                            <label htmlFor="paymentTypeFull">Full Balance</label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {formData.paymentType === 'fixed' && (
                    <div className={`form-group ${formErrors.paymentAmount ? 'error' : ''}`}>
                      <label htmlFor="paymentAmount">Payment Amount ($)</label>
                      <input
                        type="number"
                        id="paymentAmount"
                        name="paymentAmount"
                        value={formData.paymentAmount}
                        onChange={handleChange}
                        min="0.01"
                        step="0.01"
                        placeholder="Enter amount"
                        disabled={loading}
                      />
                      {formErrors.paymentAmount && (
                        <div className="error-message">{formErrors.paymentAmount}</div>
                      )}
                    </div>
                  )}
                  
                  <div className={`form-group ${formErrors.frequency ? 'error' : ''}`}>
                    <label htmlFor="frequency">Payment Frequency</label>
                    <select
                      id="frequency"
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select frequency</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 weeks</option>
                      <option value="monthly">Monthly</option>
                      <option value="bimonthly">Every 2 months</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="semiannually">Every 6 months</option>
                      <option value="annually">Yearly</option>
                      <option value="custom">Custom</option>
                    </select>
                    {formErrors.frequency && (
                      <div className="error-message">{formErrors.frequency}</div>
                    )}
                  </div>
                  
                  {formData.frequency === 'custom' && (
  <div className={`form-group ${formErrors.customFrequency ? 'error' : ''}`}>
    <label htmlFor="customFrequency">Every X Days</label>
    <input
      type="number"
      id="customFrequency"
      name="customFrequency"
      value={formData.customFrequency}
      onChange={handleChange}
      min="1"
      placeholder="Enter number of days"
      disabled={loading}
    />
    {formErrors.customFrequency && (
      <div className="error-message">{formErrors.customFrequency}</div>
    )}
  </div>
)}

<div className={`form-group ${formErrors.startDate ? 'error' : ''}`}>
  <label htmlFor="startDate">Start Date</label>
  <input
    type="date"
    id="startDate"
    name="startDate"
    value={formData.startDate}
    onChange={handleChange}
    min={new Date().toISOString().split('T')[0]}
    disabled={loading}
  />
  {formErrors.startDate && (
    <div className="error-message">{formErrors.startDate}</div>
  )}
</div>

<div className="form-group">
  <label htmlFor="endCondition">End Condition</label>
  <div className="radio-group">
    <div className="radio-option">
      <input
        type="radio"
        id="endConditionNever"
        name="endCondition"
        value="never"
        checked={formData.endCondition === 'never'}
        onChange={handleChange}
        disabled={loading}
      />
      <label htmlFor="endConditionNever">No End Date</label>
    </div>
    <div className="radio-option">
      <input
        type="radio"
        id="endConditionDate"
        name="endCondition"
        value="date"
        checked={formData.endCondition === 'date'}
        onChange={handleChange}
        disabled={loading}
      />
      <label htmlFor="endConditionDate">End on Specific Date</label>
    </div>
    <div className="radio-option">
      <input
        type="radio"
        id="endConditionOccurrences"
        name="endCondition"
        value="occurrences"
        checked={formData.endCondition === 'occurrences'}
        onChange={handleChange}
        disabled={loading}
      />
      <label htmlFor="endConditionOccurrences">After Number of Payments</label>
    </div>
  </div>
</div>

{formData.endCondition === 'date' && (
  <div className={`form-group ${formErrors.endDate ? 'error' : ''}`}>
    <label htmlFor="endDate">End Date</label>
    <input
      type="date"
      id="endDate"
      name="endDate"
      value={formData.endDate}
      onChange={handleChange}
      min={formData.startDate || new Date().toISOString().split('T')[0]}
      disabled={loading}
    />
    {formErrors.endDate && (
      <div className="error-message">{formErrors.endDate}</div>
    )}
  </div>
)}

{formData.endCondition === 'occurrences' && (
  <div className={`form-group ${formErrors.numOccurrences ? 'error' : ''}`}>
    <label htmlFor="numOccurrences">Number of Payments</label>
    <input
      type="number"
      id="numOccurrences"
      name="numOccurrences"
      value={formData.numOccurrences}
      onChange={handleChange}
      min="1"
      placeholder="Enter number of payments"
      disabled={loading}
    />
    {formErrors.numOccurrences && (
      <div className="error-message">{formErrors.numOccurrences}</div>
    )}
  </div>
)}
</div>

{/* Notification Preferences */}
<div className="form-section">
  <h3>Notification Preferences</h3>
  <div className="form-group">
    <div className="checkbox-option">
      <input
        type="checkbox"
        id="notificationsEmail"
        name="notifications.email"
        checked={formData.notifications.email}
        onChange={handleChange}
        disabled={loading}
      />
      <label htmlFor="notificationsEmail">
        Email notification when payment is sent
      </label>
    </div>
    <div className="checkbox-option">
      <input
        type="checkbox"
        id="notificationsReminder"
        name="notifications.reminder"
        checked={formData.notifications.reminder}
        onChange={handleChange}
        disabled={loading}
      />
      <label htmlFor="notificationsReminder">
        Reminder notification 3 days before payment
      </label>
    </div>
    <div className="checkbox-option">
      <input
        type="checkbox"
        id="notificationsTextForFailure"
        name="notifications.textForFailure"
        checked={formData.notifications.textForFailure}
        onChange={handleChange}
        disabled={loading}
      />
      <label htmlFor="notificationsTextForFailure">
        Text message if payment fails
      </label>
    </div>
  </div>
</div>

<div className="form-actions">
  <button
    type="button"
    className="secondary-button"
    onClick={() => setShowNewAutopayForm(false)}
    disabled={loading}
  >
    Cancel
  </button>
  <button
    type="submit"
    className="primary-button"
    disabled={loading}
  >
    {loading ? 'Setting Up...' : 'Set Up Automatic Payment'}
  </button>
</div>
</form>
</div>
</div>
)}

{/* Confirm Delete Modal */}
{showConfirmDelete && (
  <div className="modal-overlay">
    <div className="modal-content confirm-modal">
      <div className="modal-header">
        <h2>Cancel Automatic Payment</h2>
        <button 
          className="close-button"
          onClick={() => {
            setShowConfirmDelete(false);
            setSelectedAutopay(null);
          }}
        >
          &times;
        </button>
      </div>
      
      <div className="modal-body">
        <p>Are you sure you want to cancel the automatic payments to 
          <strong> {selectedAutopay?.payeeName}</strong>?</p>
        <p>This action cannot be undone.</p>
      </div>
      
      <div className="modal-actions">
        <button
          className="secondary-button"
          onClick={() => {
            setShowConfirmDelete(false);
            setSelectedAutopay(null);
          }}
          disabled={loading}
        >
          Keep Automatic Payment
        </button>
        <button
          className="danger-button"
          onClick={handleDeleteAutopay}
          disabled={loading}
        >
          {loading ? 'Canceling...' : 'Yes, Cancel Automatic Payment'}
        </button>
      </div>
    </div>
  </div>
)}
</main>

<footer className="autopay-footer">
  <div className="f001-footer-links">
    <a href="/privacy">Privacy</a>
    <a href="/security">Security</a>
    <a href="/terms">Terms of Use</a>
    <a href="/help">Help</a>
  </div>
  <div className="c001-copyright">
    &copy; {new Date().getFullYear()} Wells Fargo Bank, N.A. All rights reserved.
  </div>
</footer>
</div>
);
};

export default AutoPay;