import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './TransferMoneyPage.css';

const TransferMoneyPage = () => {
  const navigate = useNavigate();
  
  // Form states
  const [transferType, setTransferType] = useState('internal');
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [emailReceipt, setEmailReceipt] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [transferDate, setTransferDate] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [transferFrequency, setTransferFrequency] = useState('once');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  
  // External account details
  const [externalAccount, setExternalAccount] = useState({
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    accountHolderName: '',
    saveRecipient: false,
    recipientNickname: ''
  });
  
  // Wire transfer details
  const [wireTransfer, setWireTransfer] = useState({
    bankName: '',
    routingNumber: '',
    swiftCode: '',
    accountNumber: '',
    accountHolderName: '',
    accountHolderAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    saveRecipient: false,
    recipientNickname: ''
  });
  
  // UI states
  const [showBankSearch, setShowBankSearch] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [bankSearchResults, setBankSearchResults] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [transferId, setTransferId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Data states
  const [userAccounts, setUserAccounts] = useState([]);
  const [savedRecipients, setSavedRecipients] = useState([]);
  const [banks, setBanks] = useState([]);
  const [transferFee, setTransferFee] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch user accounts and other data on component mount
  useEffect(() => {
    fetchUserAccounts();
    fetchSavedRecipients();
    fetchBanks();
  }, []);

  // Helper function to get token from local storage
  const getAuthToken = () => {
    // Check for token with the Wells Fargo specific key
    const wellsFargoToken = localStorage.getItem('wellsFargoAuthToken');
    if (wellsFargoToken) {
      return wellsFargoToken;
    }
    
    // Fallback to the standard key
    const standardToken = localStorage.getItem('authToken');
    if (standardToken) {
      return standardToken;
    }
    
    // Check cookies
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token' || name === 'wellsFargoAuthToken') {
        return value;
      }
    }
    
    // Check session storage
    return sessionStorage.getItem('wellsFargoAuthToken') || sessionStorage.getItem('authToken');
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Fetch user accounts from API
  const fetchUserAccounts = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        navigate('/login');
        return;
      }

      const response = await axios.get('/api/transfers/accounts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Fix: Check the response structure and handle it properly
      let accounts = [];
      if (response && response.data) {
        if (response.data.data && response.data.data.accounts) {
          accounts = response.data.data.accounts;
        } else if (response.data.accounts) {
          accounts = response.data.accounts;
        } else if (Array.isArray(response.data.data)) {
          accounts = response.data.data;
        }
      }
      
      // Ensure accounts is always an array
      accounts = Array.isArray(accounts) ? accounts : [];
      
      setUserAccounts(accounts);
      
      // Set default from account if accounts exist
      if (accounts.length > 0) {
        setFromAccount(accounts[0]._id);
        // Set default to account if at least 2 accounts exist
        if (accounts.length > 1) {
          setToAccount(accounts[1]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
      
      // Use mock data for demonstration if needed
      const mockAccounts = [
        {
          _id: 'acc1',
          accountNumber: '12345678901',
          accountType: 'Checking',
          accountName: 'Primary Checking',
          balance: 5430.42
        },
        {
          _id: 'acc2',
          accountNumber: '12345678902',
          accountType: 'Savings',
          accountName: 'High-Yield Savings',
          balance: 12500.00
        }
      ];
      
      setUserAccounts(mockAccounts);
      setFromAccount('acc1');
      setToAccount('acc2');
    }
  };

  // Fetch saved recipients from API
  const fetchSavedRecipients = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await axios.get('/api/transfers/recipients', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Make sure we handle the response data properly
      const recipients = response.data && response.data.data ? response.data.data : [];
      setSavedRecipients(Array.isArray(recipients) ? recipients : []);
    } catch (error) {
      console.error('Error fetching saved recipients:', error);
      
      // Use mock data for demonstration if needed
      const mockRecipients = [
        {
          _id: 'rec1',
          nickname: 'John Smith (Chase)',
          accountNumber: '****5678',
          accountType: 'Checking',
          bankName: 'Chase Bank',
          routingNumber: '123456789'
        },
        {
          _id: 'rec2',
          nickname: 'Sarah Jones (Bank of America)',
          accountNumber: '****9012',
          accountType: 'Savings',
          bankName: 'Bank of America',
          routingNumber: '987654321'
        }
      ];
      
      setSavedRecipients(mockRecipients);
    }
  };

  // Fetch banks from API
  useEffect(() => {
    // Function to fetch all banks
    const fetchBanks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/transfers/banks');
        const data = await response.json();
        
        if (data.success) {
          setBanks(data.data);
        } else {
          console.error('Failed to fetch banks:', data.error);
        }
      } catch (error) {
        console.error('Error fetching banks:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchBanks();
  }, []);

  // Search for banks
  const searchBanks = (query) => {
    if (!query || query.length < 3 || !Array.isArray(banks)) {
      setBankSearchResults([]);
      return;
    }
    
    const filteredBanks = banks.filter(bank => 
      bank && bank.name && bank.name.toLowerCase().includes(query.toLowerCase())
    );
    
    setBankSearchResults(filteredBanks);
  };

  // Handle bank search input change
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      searchBanks(bankSearchQuery);
    }, 300);
    
    return () => clearTimeout(delaySearch);
  }, [bankSearchQuery, banks]);

  // Select a bank from search results
  const selectBank = (bank) => {
    if (!bank) return;
    
    if (transferType === 'external') {
      setExternalAccount({
        ...externalAccount,
        bankName: bank.name,
        routingNumber: bank.routingNumber
      });
    } else if (transferType === 'wire') {
      setWireTransfer({
        ...wireTransfer,
        bankName: bank.name,
        routingNumber: bank.routingNumber
      });
    }
    setShowBankSearch(false);
  };

  // Select a saved recipient
  const selectSavedRecipient = (recipient) => {
    if (!recipient) return;
    
    if (transferType === 'external') {
      setExternalAccount({
        bankName: recipient.bankName || '',
        routingNumber: recipient.routingNumber || '',
        accountNumber: (recipient.accountNumber || '').replace('****', ''),
        accountType: recipient.accountType ? recipient.accountType.toLowerCase() : 'checking',
        accountHolderName: recipient.accountHolderName || '',
        saveRecipient: false,
        recipientNickname: recipient.nickname || ''
      });
    } else if (transferType === 'wire') {
      setWireTransfer({
        bankName: recipient.bankName || '',
        routingNumber: recipient.routingNumber || '',
        swiftCode: recipient.swiftCode || '',
        accountNumber: (recipient.accountNumber || '').replace('****', ''),
        accountHolderName: recipient.accountHolderName || '',
        accountHolderAddress: recipient.accountHolderAddress || wireTransfer.accountHolderAddress,
        saveRecipient: false,
        recipientNickname: recipient.nickname || ''
      });
    }
  };

  // Update transfer fee when type changes
  useEffect(() => {
    setTransferFee(transferType === 'wire' ? 30.00 : 0);
  }, [transferType]);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    // Amount validation
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else {
      const fromAcc = userAccounts.find(acc => acc._id === fromAccount);
      if (fromAcc && parseFloat(amount) > fromAcc.balance) {
        newErrors.amount = 'Insufficient funds';
      }
    }
    
    // Date validation
    if (transferDate === 'custom' && !customDate) {
      newErrors.customDate = 'Please select a date';
    }
    
    // Recurring transfer validation
    if (transferFrequency !== 'once' && !recurringEndDate) {
      newErrors.recurringEndDate = 'Please select an end date';
    }
    
    // Email validation if receipt is requested
    if (emailReceipt && (!emailAddress || !/\S+@\S+\.\S+/.test(emailAddress))) {
      newErrors.emailAddress = 'Please enter a valid email address';
    }
    
    // External account validation
    if (transferType === 'external') {
      if (!externalAccount.bankName) {
        newErrors.bankName = 'Bank name is required';
      }
      
      if (!externalAccount.routingNumber || !/^\d{9}$/.test(externalAccount.routingNumber)) {
        newErrors.routingNumber = 'Valid 9-digit routing number is required';
      }
      
      if (!externalAccount.accountNumber) {
        newErrors.accountNumber = 'Account number is required';
      }
      
      if (!externalAccount.accountHolderName) {
        newErrors.accountHolderName = 'Account holder name is required';
      }
    }
    
    // Wire transfer validation
    if (transferType === 'wire') {
      if (!wireTransfer.bankName) {
        newErrors.wireBankName = 'Bank name is required';
      }
      
      if (!wireTransfer.routingNumber || !/^\d{9}$/.test(wireTransfer.routingNumber)) {
        newErrors.wireRoutingNumber = 'Valid 9-digit routing number is required';
      }
      
      if (!wireTransfer.accountNumber) {
        newErrors.wireAccountNumber = 'Account number is required';
      }
      
      if (!wireTransfer.accountHolderName) {
        newErrors.wireAccountHolderName = 'Account holder name is required';
      }
      
      if (!wireTransfer.accountHolderAddress.street) {
        newErrors.street = 'Street address is required';
      }
      
      if (!wireTransfer.accountHolderAddress.city) {
        newErrors.city = 'City is required';
      }
      
      if (!wireTransfer.accountHolderAddress.state) {
        newErrors.state = 'State is required';
      }
      
      if (!wireTransfer.accountHolderAddress.zipCode) {
        newErrors.zipCode = 'ZIP code is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setShowConfirmation(true);
    } else {
      // Scroll to first error
      const firstError = document.querySelector('.tran008-error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Navigate back
  const goBack = () => {
    if (showConfirmation) {
      setShowConfirmation(false);
    } else {
      navigate('/dashboard');
    }
  };

  // Navigate to dashboard
  const goToDashboard = () => {
    navigate('/dashboard');
  };

  // Set up another transfer
  const setUpAnotherTransfer = () => {
    // Reset form state
    setTransferType('internal');
    setFromAccount(userAccounts.length > 0 ? userAccounts[0]._id : '');
    setToAccount(userAccounts.length > 1 ? userAccounts[1]._id : '');
    setAmount('');
    setMemo('');
    setEmailReceipt(false);
    setEmailAddress('');
    setTransferDate('today');
    setCustomDate('');
    setTransferFrequency('once');
    setRecurringEndDate('');
    setShowConfirmation(false);
    setTransferComplete(false);
    setVerificationRequired(false);
    setVerificationCode('');
    setErrors({});
    setExternalAccount({
      bankName: '',
      routingNumber: '',
      accountNumber: '',
      accountType: 'checking',
      accountHolderName: '',
      saveRecipient: false,
      recipientNickname: ''
    });
    setWireTransfer({
      bankName: '',
      routingNumber: '',
      swiftCode: '',
      accountNumber: '',
      accountHolderName: '',
      accountHolderAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      saveRecipient: false,
      recipientNickname: ''
    });
  };

  // Execute the transfer
  const executeTransfer = async () => {
    setIsLoading(true);
    
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        navigate('/login');
        return;
      }
      
      // Calculate the actual transfer date based on selection
      let actualTransferDate;
      if (transferDate === 'today') {
        actualTransferDate = new Date();
      } else if (transferDate === 'tomorrow') {
        actualTransferDate = new Date();
        actualTransferDate.setDate(actualTransferDate.getDate() + 1);
      } else {
        actualTransferDate = new Date(customDate);
      }
      
      // Format date as ISO string
      const formattedDate = actualTransferDate.toISOString();
      
      // Prepare transfer data
      const transferData = {
        transferType,
        fromAccount,
        amount,
        memo: memo || undefined,
        emailReceipt,
        emailAddress: emailReceipt ? emailAddress : undefined,
        transferDate: formattedDate,
        transferFrequency,
        recurringEndDate: recurringEndDate ? new Date(recurringEndDate).toISOString() : undefined
      };
      
      // Add specific data based on transfer type
      if (transferType === 'internal') {
        transferData.toAccount = toAccount;
      } else if (transferType === 'external') {
        transferData.externalAccount = {
          bankName: externalAccount.bankName,
          routingNumber: externalAccount.routingNumber,
          accountNumber: externalAccount.accountNumber,
          accountType: externalAccount.accountType,
          accountHolderName: externalAccount.accountHolderName,
          saveRecipient: externalAccount.saveRecipient,
          recipientNickname: externalAccount.recipientNickname
        };
      } else if (transferType === 'wire') {
        transferData.wireTransfer = {
          bankName: wireTransfer.bankName,
          routingNumber: wireTransfer.routingNumber,
          swiftCode: wireTransfer.swiftCode,
          accountNumber: wireTransfer.accountNumber,
          accountHolderName: wireTransfer.accountHolderName,
          accountHolderAddress: wireTransfer.accountHolderAddress,
          saveRecipient: wireTransfer.saveRecipient,
          recipientNickname: wireTransfer.recipientNickname
        };
      }
      
      // Make API call to create transfer
      const response = await axios.post('/api/transfers/transfer', transferData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Handle response
      if (response.data.success) {
        setTransferId(response.data.data.transferId);
        setConfirmationNumber(response.data.data.confirmationNumber);
        
        // Check if verification is required
        if (response.data.data.status === 'awaiting_verification') {
          setVerificationRequired(true);
        } else {
          setTransferComplete(true);
        }
        
        // Update account balances in UI (in a real app, you'd refetch data)
        const updatedAccounts = userAccounts.map(account => {
          if (account._id === fromAccount) {
            const totalDeduction = parseFloat(amount) + (transferType === 'wire' ? transferFee : 0);
            return {
              ...account,
              balance: account.balance - totalDeduction
            };
          }
          if (transferType === 'internal' && account._id === toAccount) {
            return {
              ...account,
              balance: account.balance + parseFloat(amount)
            };
          }
          return account;
        });
        
        setUserAccounts(updatedAccounts);
      }
      
    } catch (error) {
      console.error('Error executing transfer:', error);
      
      setErrors({
        ...errors,
        submit: error.response?.data?.error || 'An error occurred while processing your transfer. Please try again.'
      });
      
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Verify transfer with verification code
  const verifyTransfer = async () => {
    if (!verificationCode) {
      setErrors({
        ...errors,
        verificationCode: 'Please enter the verification code'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        navigate('/login');
        return;
      }
      
      const response = await axios.post('/api/transfers/verify', 
        {
          transferId,
          verificationCode
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setVerificationRequired(false);
        setTransferComplete(true);
        setConfirmationNumber(response.data.data.confirmationNumber);
      }
      
    } catch (error) {
      console.error('Error verifying transfer:', error);
      
      setErrors({
        ...errors,
        verificationCode: error.response?.data?.error || 'Invalid verification code. Please try again.'
      });
      
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check transfer status
  const checkTransferStatus = async () => {
    try {
      const token = getAuthToken();
      if (!token || !transferId) {
        return;
      }
      
      const response = await axios.get(`/api/transfers/status/${transferId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        if (response.data.data.status === 'completed') {
          setVerificationRequired(false);
          setTransferComplete(true);
        }
      }
      
    } catch (error) {
      console.error('Error checking transfer status:', error);
    }
  };

  // Check status periodically if verification is required
  useEffect(() => {
    if (verificationRequired && transferId) {
      const statusInterval = setInterval(checkTransferStatus, 10000); // Check every 10 seconds
      
      return () => clearInterval(statusInterval);
    }
  }, [verificationRequired, transferId]);


  return (
    <div className="tran008-transfer-page">
      {isLoading && (
        <div className="tran008-loading-overlay">
          <div className="tran008-loading-spinner">
            <div className="tran008-spinner"></div>
            <p>Processing your request...</p>
          </div>
        </div>
      )}
  
      {/* Transfer Completed View */}
      {transferComplete && (
        <div className="tran008-completion-container">
          <div className="tran008-completion-card">
            <div className="tran008-completion-header">
              <div className="tran008-success-icon">✓</div>
              <h2>Transfer Successful</h2>
            </div>
            <div className="tran008-completion-details">
              <p className="tran008-confirmation-number">
                Confirmation Number: <span>{confirmationNumber}</span>
              </p>
              <div className="tran008-transfer-summary">
                <h3>Transfer Summary</h3>
                <div className="tran008-summary-row">
                  <span>Amount:</span>
                  <span className="tran008-amount">{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div className="tran008-summary-row">
                  <span>From Account:</span>
                  <span>{userAccounts.find(acc => acc._id === fromAccount)?.accountName}</span>
                </div>
                
                {transferType === 'internal' && (
                  <div className="tran008-summary-row">
                    <span>To Account:</span>
                    <span>{userAccounts.find(acc => acc._id === toAccount)?.accountName}</span>
                  </div>
                )}
                
                {transferType === 'external' && (
                  <div className="tran008-summary-row">
                    <span>To External Account:</span>
                    <span>{externalAccount.bankName} ****{externalAccount.accountNumber.slice(-4)}</span>
                  </div>
                )}
                
                {transferType === 'wire' && (
                  <div className="tran008-summary-row">
                    <span>To Wire Transfer:</span>
                    <span>{wireTransfer.bankName} ****{wireTransfer.accountNumber.slice(-4)}</span>
                  </div>
                )}
                
                <div className="tran008-summary-row">
                  <span>Transfer Date:</span>
                  <span>
                    {transferDate === 'today' && 'Today'}
                    {transferDate === 'tomorrow' && 'Tomorrow'}
                    {transferDate === 'custom' && new Date(customDate).toLocaleDateString()}
                  </span>
                </div>
                
                {transferFrequency !== 'once' && (
                  <>
                    <div className="tran008-summary-row">
                      <span>Frequency:</span>
                      <span>
                        {transferFrequency === 'weekly' && 'Weekly'}
                        {transferFrequency === 'biweekly' && 'Every 2 Weeks'}
                        {transferFrequency === 'monthly' && 'Monthly'}
                      </span>
                    </div>
                    <div className="tran008-summary-row">
                      <span>Until:</span>
                      <span>{new Date(recurringEndDate).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
                
                {memo && (
                  <div className="tran008-summary-row">
                    <span>Memo:</span>
                    <span>{memo}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="tran008-completion-actions">
              <button className="tran008-primary-button" onClick={setUpAnotherTransfer}>
                Set Up Another Transfer
              </button>
              <button className="tran008-secondary-button" onClick={goToDashboard}>
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
  
      {/* Verification Required View */}
      {verificationRequired && (
        <div className="tran008-verification-container">
          <div className="tran008-verification-card">
            <h2>Verification Required</h2>
            <p>
              To complete this transfer, please contact your Bank to obtain your 
              transaction approval code.
            </p>
            <div className="tran008-verification-form">
              <div className="tran008-form-group">
                <label htmlFor="verificationCode">Transaction Approval Code</label>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className={errors.verificationCode ? 'tran008-input-error' : ''}
                />
                {errors.verificationCode && (
                  <div className="tran008-error-message">{errors.verificationCode}</div>
                )}
              </div>
              <div className="tran008-verification-actions">
                <button
                  className="tran008-primary-button"
                  onClick={verifyTransfer}
                  disabled={isLoading}
                >
                  Verify
                </button>
                <button className="tran008-secondary-button" onClick={goToDashboard}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        
      {/* Confirmation View */}
      {showConfirmation && !verificationRequired && !transferComplete && (
        <div className="tran008-confirmation-container">
          <div className="tran008-confirmation-card">
            <h2>Confirm Transfer Details</h2>
            <div className="tran008-confirmation-details">
              <div className="tran008-summary-row">
                <span>Amount:</span>
                <span className="tran008-amount">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="tran008-summary-row">
                <span>From Account:</span>
                <span>{userAccounts.find(acc => acc._id === fromAccount)?.accountName}</span>
              </div>
              
              {transferType === 'internal' && (
                <div className="tran008-summary-row">
                  <span>To Account:</span>
                  <span>{userAccounts.find(acc => acc._id === toAccount)?.accountName}</span>
                </div>
              )}
              
              {transferType === 'external' && (
                <>
                  <div className="tran008-summary-row">
                    <span>To Bank:</span>
                    <span>{externalAccount.bankName}</span>
                  </div>
                  <div className="tran008-summary-row">
                    <span>To Account:</span>
                    <span>****{externalAccount.accountNumber.slice(-4)}</span>
                  </div>
                  <div className="tran008-summary-row">
                    <span>Account Holder:</span>
                    <span>{externalAccount.accountHolderName}</span>
                  </div>
                </>
              )}
              
              {transferType === 'wire' && (
                <>
                  <div className="tran008-summary-row">
                    <span>To Bank:</span>
                    <span>{wireTransfer.bankName}</span>
                  </div>
                  <div className="tran008-summary-row">
                    <span>To Account:</span>
                    <span>****{wireTransfer.accountNumber.slice(-4)}</span>
                  </div>
                  <div className="tran008-summary-row">
                    <span>Account Holder:</span>
                    <span>{wireTransfer.accountHolderName}</span>
                  </div>
                  <div className="tran008-summary-row">
                    <span>Fee:</span>
                    <span>{formatCurrency(transferFee)}</span>
                  </div>
                  <div className="tran008-summary-row">
                    <span>Total:</span>
                    <span>{formatCurrency(parseFloat(amount) + transferFee)}</span>
                  </div>
                </>
              )}
              
              <div className="tran008-summary-row">
                <span>Transfer Date:</span>
                <span>
                  {transferDate === 'today' && 'Today'}
                  {transferDate === 'tomorrow' && 'Tomorrow'}
                  {transferDate === 'custom' && new Date(customDate).toLocaleDateString()}
                </span>
              </div>
              
              {transferFrequency !== 'once' && (
                <>
                  <div className="tran008-summary-row">
                    <span>Frequency:</span>
                    <span>
                      {transferFrequency === 'weekly' && 'Weekly'}
                      {transferFrequency === 'biweekly' && 'Every 2 Weeks'}
                      {transferFrequency === 'monthly' && 'Monthly'}
                    </span>
                  </div>
                  <div className="tran008-summary-row">
                    <span>Until:</span>
                    <span>{new Date(recurringEndDate).toLocaleDateString()}</span>
                  </div>
                </>
              )}
              
              {memo && (
                <div className="tran008-summary-row">
                  <span>Memo:</span>
                  <span>{memo}</span>
                </div>
              )}
            </div>
            
            {errors.submit && (
              <div className="tran008-error-message tran008-submit-error">{errors.submit}</div>
            )}
            
            <div className="tran008-confirmation-actions">
              <button 
                className="tran008-primary-button" 
                onClick={executeTransfer} 
                disabled={isLoading}
              >
                Confirm and Transfer
              </button>
              <button className="tran008-secondary-button" onClick={goBack}>
                Edit Transfer
              </button>
            </div>
          </div>
        </div>
      )}
  
      {/* Main Transfer Form */}
      {!showConfirmation && !verificationRequired && !transferComplete && (
        <div className="tran008-form-container">
          <h1>Transfer Money</h1>
          
          <form onSubmit={handleSubmit} className="tran008-transfer-form">
            {/* Transfer Type Selection */}
            <div className="tran008-form-section tran008-transfer-type-section">
              <h2>Transfer Type</h2>
              <div className="tran008-transfer-type-options">
                <label className={`tran008-transfer-type-option ${transferType === 'internal' ? 'tran008-selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="transferType" 
                    value="internal" 
                    checked={transferType === 'internal'}
                    onChange={() => setTransferType('internal')}
                  />
                  <span className="tran008-option-label">Between My Accounts</span>
                </label>
                
                <label className={`tran008-transfer-type-option ${transferType === 'external' ? 'tran008-selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="transferType" 
                    value="external" 
                    checked={transferType === 'external'}
                    onChange={() => setTransferType('external')}
                  />
                  <span className="tran008-option-label">To External Account</span>
                </label>
                
                <label className={`tran008-transfer-type-option ${transferType === 'wire' ? 'tran008-selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="transferType" 
                    value="wire" 
                    checked={transferType === 'wire'}
                    onChange={() => setTransferType('wire')}
                  />
                  <span className="tran008-option-label">Wire Transfer</span>
                </label>
              </div>
            </div>
            
            {/* From Account Selection */}
            <div className="tran008-form-section">
              <h2>Transfer From</h2>
              <div className="tran008-account-selection">
                {userAccounts.map(account => (
                  <label 
                    key={account._id} 
                    className={`tran008-account-option ${fromAccount === account._id ? 'tran008-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="fromAccount"
                      value={account._id}
                      checked={fromAccount === account._id}
                      onChange={() => setFromAccount(account._id)}
                    />
                    <div className="tran008-account-details">
                      <div className="tran008-account-name">{account.accountName}</div>
                      <div className="tran008-account-number">
                        {account.accountType} ••••{account.accountNumber.slice(-4)}
                      </div>
                      <div className="tran008-account-balance">
                        Balance: {formatCurrency(account.balance)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {/* To Account Selection - Internal */}
            {transferType === 'internal' && (
              <div className="tran008-form-section">
                <h2>Transfer To</h2>
                <div className="tran008-account-selection">
                  {userAccounts
                    .filter(account => account._id !== fromAccount)
                    .map(account => (
                      <label 
                        key={account._id} 
                        className={`tran008-account-option ${toAccount === account._id ? 'tran008-selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="toAccount"
                          value={account._id}
                          checked={toAccount === account._id}
                          onChange={() => setToAccount(account._id)}
                        />
                        <div className="tran008-account-details">
                          <div className="tran008-account-name">{account.accountName}</div>
                          <div className="tran008-account-number">
                            {account.accountType} ••••{account.accountNumber.slice(-4)}
                          </div>
                          <div className="tran008-account-balance">
                            Balance: {formatCurrency(account.balance)}
                          </div>
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            )}
            
            {/* External Account Details */}
            {transferType === 'external' && (
              <div className="tran008-form-section">
                <h2>External Account Details</h2>
                
                {savedRecipients.length > 0 && (
                  <div className="tran008-saved-recipients">
                    <h3>Saved Recipients</h3>
                    <div className="tran008-recipient-list">
                      {savedRecipients.map(recipient => (
                        <div 
                          key={recipient._id}
                          className="tran008-recipient-item"
                          onClick={() => selectSavedRecipient(recipient)}
                        >
                          <div className="tran008-recipient-name">{recipient.nickname}</div>
                          <div className="tran008-recipient-account">
                            {recipient.accountType} ••••{recipient.accountNumber.slice(-4)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="tran008-external-account-form">
                  {/* Bank Dropdown Replacement */}
                  <div className="tran008-form-group">
                    <label htmlFor="bankName">Bank Name</label>
                    <select
                      id="bankName"
                      value={externalAccount.bankName}
                      onChange={(e) => {
                        const selectedBank = banks.find(bank => bank.name === e.target.value);
                        setExternalAccount({
                          ...externalAccount,
                          bankName: e.target.value,
                          routingNumber: selectedBank ? selectedBank.routingNumber : ''
                        });
                      }}
                      className={errors.bankName ? 'tran008-input-error' : ''}
                    >
                      <option value="">Select a bank</option>
                      {banks.map(bank => (
                        <option key={bank._id || bank.id} value={bank.name}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                    {errors.bankName && <div className="tran008-error-message">{errors.bankName}</div>}
                  </div>
                  
                  <div className="tran008-form-group">
                    <label htmlFor="routingNumber">Routing Number</label>
                    <input
                      type="text"
                      id="routingNumber"
                      value={externalAccount.routingNumber}
                      onChange={(e) => setExternalAccount({...externalAccount, routingNumber: e.target.value})}
                      maxLength={9}
                      className={errors.routingNumber ? 'tran008-input-error' : ''}
                    />
                    {errors.routingNumber && <div className="tran008-error-message">{errors.routingNumber}</div>}
                  </div>
                  
                  <div className="tran008-form-group">
                    <label htmlFor="accountNumber">Account Number</label>
                    <input
                      type="text"
                      id="accountNumber"
                      value={externalAccount.accountNumber}
                      onChange={(e) => setExternalAccount({...externalAccount, accountNumber: e.target.value})}
                      className={errors.accountNumber ? 'tran008-input-error' : ''}
                    />
                    {errors.accountNumber && <div className="tran008-error-message">{errors.accountNumber}</div>}
                  </div>
                  
                  <div className="tran008-form-group">
                    <label>Account Type</label>
                    <div className="tran008-radio-group">
                      <label>
                        <input
                          type="radio"
                          name="accountType"
                          value="checking"
                          checked={externalAccount.accountType === 'checking'}
                          onChange={() => setExternalAccount({...externalAccount, accountType: 'checking'})}
                        />
                        Checking
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="accountType"
                          value="savings"
                          checked={externalAccount.accountType === 'savings'}
                          onChange={() => setExternalAccount({...externalAccount, accountType: 'savings'})}
                        />
                        Savings
                      </label>
                    </div>
                  </div>
                  
                  <div className="tran008-form-group">
                    <label htmlFor="accountHolderName">Account Holder Name</label>
                    <input
                      type="text"
                      id="accountHolderName"
                      value={externalAccount.accountHolderName}
                      onChange={(e) => setExternalAccount({...externalAccount, accountHolderName: e.target.value})}
                      className={errors.accountHolderName ? 'tran008-input-error' : ''}
                    />
                    {errors.accountHolderName && <div className="tran008-error-message">{errors.accountHolderName}</div>}
                  </div>
                  
                  <div className="tran008-form-group tran008-checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={externalAccount.saveRecipient}
                        onChange={() => setExternalAccount({...externalAccount, saveRecipient: !externalAccount.saveRecipient})}
                      />
                      Save this recipient for future transfers
                    </label>
                  </div>
                  
                  {externalAccount.saveRecipient && (
                    <div className="tran008-form-group">
                      <label htmlFor="recipientNickname">Recipient Nickname</label>
                      <input
                        type="text"
                        id="recipientNickname"
                        value={externalAccount.recipientNickname}
                        onChange={(e) => setExternalAccount({...externalAccount, recipientNickname: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Wire Transfer Details */}
            {transferType === 'wire' && (
              <div className="tran008-form-section">
                <h2>Wire Transfer Details</h2>
                <div className="tran008-wire-fee-notice">
                  Note: A {formatCurrency(transferFee)} fee will be applied for wire transfers.
                </div>
                
                {savedRecipients.length > 0 && (
                  <div className="tran008-saved-recipients">
                    <h3>Saved Recipients</h3>
                    <div className="tran008-recipient-list">
                      {savedRecipients.map(recipient => (
                        <div 
                          key={recipient._id}
                          className="tran008-recipient-item"
                          onClick={() => selectSavedRecipient(recipient)}
                        >
                          <div className="tran008-recipient-name">{recipient.nickname}</div>
                          <div className="tran008-recipient-account">
                            {recipient.accountType || 'Wire'} ••••{recipient.accountNumber.slice(-4)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="tran008-wire-transfer-form">
                  {/* Bank Dropdown for Wire Transfer */}
                  <div className="tran008-form-group">
                    <label htmlFor="wireBankName">Bank Name</label>
                    <select
                      id="wireBankName"
                      value={wireTransfer.bankName}
                      onChange={(e) => {
                        const selectedBank = banks.find(bank => bank.name === e.target.value);
                        setWireTransfer({
                          ...wireTransfer,
                          bankName: e.target.value,
                          routingNumber: selectedBank ? selectedBank.routingNumber : ''
                        });
                      }}
                      className={errors.wireBankName ? 'tran008-input-error' : ''}
                    >
                      <option value="">Select a bank</option>
                      {banks.map(bank => (
                        <option key={bank.id} value={bank.name}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                    {errors.wireBankName && <div className="tran008-error-message">{errors.wireBankName}</div>}
                  </div>
                  
                  <div className="tran008-form-group">
                    <label htmlFor="wireRoutingNumber">Routing Number / ABA</label>
                    <input
                      type="text"
                      id="wireRoutingNumber"
                      value={wireTransfer.routingNumber}
                      onChange={(e) => setWireTransfer({...wireTransfer, routingNumber: e.target.value})}
                      maxLength={9}
                      className={errors.wireRoutingNumber ? 'tran008-input-error' : ''}
                    />
                    {errors.wireRoutingNumber && <div className="tran008-error-message">{errors.wireRoutingNumber}</div>}
                  </div>
                  
                  <div className="tran008-form-group">
                    <label htmlFor="swiftCode">SWIFT Code (International)</label>
                    <input
                      type="text"
                      id="swiftCode"
                      value={wireTransfer.swiftCode}
                      onChange={(e) => setWireTransfer({...wireTransfer, swiftCode: e.target.value})}
                    />
                  </div>
                  
                  <div className="tran008-form-group">
                    <label htmlFor="wireAccountNumber">Account Number</label>
                    <input
                      type="text"
                      id="wireAccountNumber"
                      value={wireTransfer.accountNumber}
                      onChange={(e) => setWireTransfer({...wireTransfer, accountNumber: e.target.value})}
                      className={errors.wireAccountNumber ? 'tran008-input-error' : ''}
                    />
                    {errors.wireAccountNumber && <div className="tran008-error-message">{errors.wireAccountNumber}</div>}
                  </div>
                  
                  <div className="tran008-form-group">
                    <label htmlFor="wireAccountHolderName">Account Holder Name</label>
                    <input
                      type="text"
                      id="wireAccountHolderName"
                      value={wireTransfer.accountHolderName}
                      onChange={(e) => setWireTransfer({...wireTransfer, accountHolderName: e.target.value})}
                      className={errors.wireAccountHolderName ? 'tran008-input-error' : ''}
                    />
                    {errors.wireAccountHolderName && <div className="tran008-error-message">{errors.wireAccountHolderName}</div>}
                  </div>
                  
                  <h3>Account Holder Address</h3>
                  
                  <div className="tran008-form-group">
                    <label htmlFor="street">Street Address</label>
                    <input
                      type="text"
                      id="street"
                      value={wireTransfer.accountHolderAddress.street}
                      onChange={(e) => setWireTransfer({
                        ...wireTransfer, 
                        accountHolderAddress: {
                          ...wireTransfer.accountHolderAddress,
                          street: e.target.value
                        }
                      })}
                      className={errors.street ? 'tran008-input-error' : ''}
                    />
                    {errors.street && <div className="tran008-error-message">{errors.street}</div>}
                  </div>
                  
                  <div className="tran008-form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      value={wireTransfer.accountHolderAddress.city}
                      onChange={(e) => setWireTransfer({
                        ...wireTransfer, 
                        accountHolderAddress: {
                          ...wireTransfer.accountHolderAddress,
                          city: e.target.value
                        }
                      })}
                      className={errors.city ? 'tran008-input-error' : ''}
                    />
                    {errors.city && <div className="tran008-error-message">{errors.city}</div>}
                  </div>
                  
                  <div className="tran008-form-row">
                    <div className="tran008-form-group">
                      <label htmlFor="state">State / Province</label>
                      <input
                        type="text"
                        id="state"
                        value={wireTransfer.accountHolderAddress.state}
                        onChange={(e) => setWireTransfer({
                          ...wireTransfer, 
                          accountHolderAddress: {
                            ...wireTransfer.accountHolderAddress,
                            state: e.target.value
                          }
                        })}
                        className={errors.state ? 'tran008-input-error' : ''}
                      />
                      {errors.state && <div className="tran008-error-message">{errors.state}</div>}
                    </div>
                    
                    <div className="tran008-form-group">
                      <label htmlFor="zipCode">Zip / Postal Code</label>
                      <input
                        type="text"
                        id="zipCode"
                        value={wireTransfer.accountHolderAddress.zipCode}
                        onChange={(e) => setWireTransfer({
                          ...wireTransfer, 
                          accountHolderAddress: {
                            ...wireTransfer.accountHolderAddress,
                            zipCode: e.target.value
                          }
                        })}
                        className={errors.zipCode ? 'tran008-input-error' : ''}
                      />
                      {errors.zipCode && <div className="tran008-error-message">{errors.zipCode}</div>}
                    </div>
                  </div>
                  
                  <div className="tran008-form-group tran008-checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={wireTransfer.saveRecipient}
                        onChange={() => setWireTransfer({...wireTransfer, saveRecipient: !wireTransfer.saveRecipient})}
                      />
                      Save this recipient for future transfers
                    </label>
                  </div>
                  
                  {wireTransfer.saveRecipient && (
                    <div className="tran008-form-group">
                      <label htmlFor="wireRecipientNickname">Recipient Nickname</label>
                      <input
                        type="text"
                        id="wireRecipientNickname"
                        value={wireTransfer.recipientNickname}
                        onChange={(e) => setWireTransfer({...wireTransfer, recipientNickname: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Amount and Details */}
            <div className="tran008-form-section">
              <h2>Amount and Details</h2>
              
              <div className="tran008-form-group">
                <label htmlFor="amount">Amount</label>
                <div className="tran008-amount-input">
                  <span className="tran008-currency-symbol">$</span>
                  <input
                    type="text"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={errors.amount ? 'tran008-input-error' : ''}
                  />
                </div>
                {errors.amount && <div className="tran008-error-message">{errors.amount}</div>}
              </div>
              
              <div className="tran008-form-group">
                <label htmlFor="memo">Memo / Note (Optional)</label>
                <input
                  type="text"
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="What's this for?"
                />
              </div>
              
              <div className="tran008-form-group tran008-checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={emailReceipt}
                    onChange={() => setEmailReceipt(!emailReceipt)}
                  />
                  Email receipt
                </label>
              </div>
              
              {emailReceipt && (
                <div className="tran008-form-group">
                  <label htmlFor="emailAddress">Email Address</label>
                  <input
                    type="email"
                    id="emailAddress"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                  className={errors.emailAddress ? 'tran008-input-error' : ''}
                />
                {errors.emailAddress && <div className="tran008-error-message">{errors.emailAddress}</div>}
              </div>
            )}
          </div>
          
          {/* Transfer Schedule */}
          <div className="tran008-form-section">
            <h2>Transfer Schedule</h2>
            
            <div className="tran008-form-group">
              <label>When would you like to transfer?</label>
              <div className="tran008-radio-group tran008-date-options">
                <label>
                  <input
                    type="radio"
                    name="transferDate"
                    value="today"
                    checked={transferDate === 'today'}
                    onChange={() => setTransferDate('today')}
                  />
                  Today
                </label>
                <label>
                  <input
                    type="radio"
                    name="transferDate"
                    value="tomorrow"
                    checked={transferDate === 'tomorrow'}
                    onChange={() => setTransferDate('tomorrow')}
                  />
                  Tomorrow
                </label>
                <label>
                  <input
                    type="radio"
                    name="transferDate"
                    value="custom"
                    checked={transferDate === 'custom'}
                    onChange={() => setTransferDate('custom')}
                  />
                  Custom Date
                </label>
              </div>
            </div>
            
            {transferDate === 'custom' && (
              <div className="tran008-form-group">
                <label htmlFor="customDate">Select Date</label>
                <input
                  type="date"
                  id="customDate"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.customDate ? 'tran008-input-error' : ''}
                />
                {errors.customDate && <div className="tran008-error-message">{errors.customDate}</div>}
              </div>
            )}
            
            <div className="tran008-form-group">
              <label>How often would you like to make this transfer?</label>
              <div className="tran008-radio-group tran008-frequency-options">
                <label>
                  <input
                    type="radio"
                    name="transferFrequency"
                    value="once"
                    checked={transferFrequency === 'once'}
                    onChange={() => setTransferFrequency('once')}
                  />
                  One Time
                </label>
                <label>
                  <input
                    type="radio"
                    name="transferFrequency"
                    value="weekly"
                    checked={transferFrequency === 'weekly'}
                    onChange={() => setTransferFrequency('weekly')}
                  />
                  Weekly
                </label>
                <label>
                  <input
                    type="radio"
                    name="transferFrequency"
                    value="biweekly"
                    checked={transferFrequency === 'biweekly'}
                    onChange={() => setTransferFrequency('biweekly')}
                  />
                  Every 2 Weeks
                </label>
                <label>
                  <input
                    type="radio"
                    name="transferFrequency"
                    value="monthly"
                    checked={transferFrequency === 'monthly'}
                    onChange={() => setTransferFrequency('monthly')}
                  />
                  Monthly
                </label>
              </div>
            </div>
            
            {transferFrequency !== 'once' && (
              <div className="tran008-form-group">
                <label htmlFor="recurringEndDate">End Date</label>
                <input
                  type="date"
                  id="recurringEndDate"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.recurringEndDate ? 'tran008-input-error' : ''}
                />
                {errors.recurringEndDate && <div className="tran008-error-message">{errors.recurringEndDate}</div>}
              </div>
            )}
          </div>
          
          {/* Form Actions */}
          <div className="tran008-form-actions">
            <button type="submit" className="tran008-primary-button">
              Continue
            </button>
            <button type="button" className="tran008-secondary-button" onClick={goBack}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    )}
  </div>
);

};

export default TransferMoneyPage;