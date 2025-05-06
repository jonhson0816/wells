import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './WithdrawFundsPage.css';
import { toast } from 'react-toastify';

const WithdrawFundsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = import.meta.env?.VITE_API_URL || 'https://wellsapi.onrender.com';
  
  // Get account from navigation state or fetch accounts if not provided
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  // State management
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalType, setWithdrawalType] = useState('atm');
  const [accountFrom, setAccountFrom] = useState('');
  const [note, setNote] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [atmCode, setAtmCode] = useState('');
  const [receiptEmail, setReceiptEmail] = useState('');
  const [sendReceipt, setSendReceipt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickAmounts, setQuickAmounts] = useState([20, 40, 60, 100, 200]);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [allowFingerprint, setAllowFingerprint] = useState(false);
  const [atmLocations, setAtmLocations] = useState([]);
  const [showAtmLocations, setShowAtmLocations] = useState(false);
  const [currentLimits, setCurrentLimits] = useState({
    atm: 500,
    branch: 10000,
    cashAdvance: 3000
  });
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [transactionFee, setTransactionFee] = useState(0);
  const [showFeeWarning, setShowFeeWarning] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);

  // Create API instance with auth headers
  const getApiInstance = () => {
    const token = localStorage.getItem('wellsFargoAuthToken');
    return axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  };

  // Load user accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        
        // If an account was passed via navigation state, use it
        if (location.state?.account) {
          const account = location.state.account;
          setAccounts([account]);
          setAccountFrom(account.id || account._id);
          setSelectedAccount(account);
        } else {
          // Otherwise fetch all user accounts
          const api = getApiInstance();
          const response = await api.get('/api/accounts');
          
          if (response.data?.success) {
            const userAccounts = response.data.data?.accounts || [];
            setAccounts(userAccounts);
            
            // Set default account (first non-credit account if available)
            if (userAccounts.length > 0) {
              const defaultAccount = userAccounts.find(acc => acc && !acc.type?.toLowerCase().includes('credit')) || userAccounts[0];
              if (defaultAccount) {
                setAccountFrom(defaultAccount.id || defaultAccount._id);
                setSelectedAccount(defaultAccount);
              }
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setErrorMessage('Failed to load your accounts. Please try again later.');
        setLoading(false);
        
        // Initialize with mock data for development if API fails
        const mockAccounts = [
          {
            id: 'checking123',
            _id: 'checking123',
            name: 'Everyday Checking',
            number: 'xxxx4567',
            type: 'checking',
            balance: 2546.78
          },
          {
            id: 'savings456',
            _id: 'savings456',
            name: 'Way2Save Savings',
            number: 'xxxx8901',
            type: 'savings',
            balance: 15782.45
          }
        ];
        
        setAccounts(mockAccounts);
        setAccountFrom(mockAccounts[0].id);
        setSelectedAccount(mockAccounts[0]);
      }
    };

    fetchAccounts();
  }, [location.state]);

  // Fetch user's recent withdrawals
  useEffect(() => {
    const fetchRecentWithdrawals = async () => {
      try {
        const api = getApiInstance();
        const response = await api.get('/api/withdrawals/history');
        
        if (response.data?.success) {
          const withdrawals = response.data.data?.withdrawals || [];
          
          // Format withdrawals for display
          const formattedWithdrawals = withdrawals.map(w => ({
            date: new Date(w.date).toLocaleDateString(),
            amount: w.amount,
            type: w.withdrawalType === 'atm' ? 'ATM' : 
                  w.withdrawalType === 'branch' ? 'Branch' : 'Cash Advance',
            location: w.location || 'N/A',
            status: w.status
          }));
          
          setRecentWithdrawals(formattedWithdrawals);
        }
      } catch (error) {
        console.error('Error fetching withdrawal history:', error);
        // Don't show error for this non-critical feature
        
        // Initialize with mock data for development
        const mockWithdrawals = [
          {
            date: new Date().toLocaleDateString(),
            amount: 200,
            type: 'ATM',
            location: 'Main St Branch',
            status: 'Completed'
          },
          {
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            amount: 500,
            type: 'Branch',
            location: 'Downtown Branch',
            status: 'Completed'
          }
        ];
        
        setRecentWithdrawals(mockWithdrawals);
      }
    };

    // Only fetch if user is authenticated
    const token = localStorage.getItem('wellsFargoAuthToken');
    if (token) {
      fetchRecentWithdrawals();
    } else {
      // Set mock data for development
      const mockWithdrawals = [
        {
          date: new Date().toLocaleDateString(),
          amount: 200,
          type: 'ATM',
          location: 'Main St Branch',
          status: 'Completed'
        },
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          amount: 500,
          type: 'Branch',
          location: 'Downtown Branch',
          status: 'Completed'
        }
      ];
      
      setRecentWithdrawals(mockWithdrawals);
    }
  }, []);

  // Update selected account when accountFrom changes
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const account = accounts.find(acc => (acc.id || acc._id) === accountFrom);
      if (account) {
        setSelectedAccount(account);
      }
    }
  }, [accountFrom, accounts]);

  // Fetch nearby ATM locations when requested
  const fetchNearbyATMs = async (latitude, longitude) => {
    try {
      const api = getApiInstance();
      const response = await api.get(`/api/withdrawals/atms/nearby?latitude=${latitude}&longitude=${longitude}`);
      
      if (response.data?.success) {
        setAtmLocations(response.data.data?.atmLocations || []);
        setShowAtmLocations(true);
      }
    } catch (error) {
      console.error('Error fetching ATM locations:', error);
      toast.error('Unable to find nearby ATM locations');
      
      // Mock data for development
      setAtmLocations([
        {
          id: 'atm1',
          name: 'Wells Fargo ATM - Main Branch',
          address: '123 Main St, Anytown, USA',
          distance: '0.5 miles'
        },
        {
          id: 'atm2',
          name: 'Wells Fargo ATM - Shopping Center',
          address: '456 Market Ave, Anytown, USA',
          distance: '1.2 miles'
        }
      ]);
      setShowAtmLocations(true);
    }
  };

  // Calculate fee based on withdrawal type and amount
  useEffect(() => {
    const calculateFee = () => {
      const amount = parseFloat(withdrawalAmount) || 0;
      let fee = 0;

      if (withdrawalType === 'cashAdvance') {
        fee = amount * 0.03; // 3% fee for cash advances
        if (fee < 10) fee = 10; // Minimum $10 fee
      } else if (withdrawalType === 'atm' && selectedAccount && !selectedAccount.type?.toLowerCase().includes('checking')) {
        fee = 2.50; // Fee for non-checking ATM withdrawals
      }

      setTransactionFee(fee);
      setShowFeeWarning(fee > 0);
    };

    calculateFee();
  }, [withdrawalAmount, withdrawalType, selectedAccount]);

  // Form validation
  const validateForm = () => {
    if (!selectedAccount) {
      setErrorMessage('Please select an account.');
      return false;
    }
    
    const amount = parseFloat(withdrawalAmount);
    
    if (!amount || isNaN(amount)) {
      setErrorMessage('Please enter a valid withdrawal amount.');
      return false;
    }
    
    if (amount <= 0) {
      setErrorMessage('Withdrawal amount must be greater than zero.');
      return false;
    }

    if (amount > selectedAccount.balance && !selectedAccount.type?.toLowerCase().includes('credit')) {
      setErrorMessage('Insufficient funds in your account.');
      return false;
    }

    // Validate against withdrawal limits
    if (withdrawalType === 'atm' && amount > currentLimits.atm) {
      setErrorMessage(`ATM withdrawals are limited to $${currentLimits.atm} per day.`);
      return false;
    } else if (withdrawalType === 'branch' && amount > currentLimits.branch) {
      setErrorMessage(`Branch withdrawals are limited to $${currentLimits.branch} without prior notice.`);
      return false;
    } else if (withdrawalType === 'cashAdvance' && amount > currentLimits.cashAdvance) {
      setErrorMessage(`Cash advances are limited to $${currentLimits.cashAdvance} per transaction.`);
      return false;
    }
    
    if (scheduleForLater && (!scheduledDate || !scheduledTime)) {
      setErrorMessage('Please select both date and time for scheduled withdrawal.');
      return false;
    }

    if (withdrawalType === 'cashAdvance' && !agreeToTerms) {
      setErrorMessage('You must agree to the cash advance terms and conditions.');
      return false;
    }

    if (sendReceipt && !receiptEmail) {
      setErrorMessage('Please enter an email address for the receipt.');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  // Handle amount change with proper formatting
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and one decimal point with up to 2 decimal places
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setWithdrawalAmount(value);
      setErrorMessage('');
    }
  };

  // Handle quick amount selection
  const handleQuickAmountSelect = (amount) => {
    setWithdrawalAmount(amount.toString());
    setErrorMessage('');
  };

  // Handle account selection change
  const handleAccountChange = (e) => {
    setAccountFrom(e.target.value);
    setErrorMessage('');
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsConfirmModalOpen(true);
    }
  };

  // Find ATM locations near me using Geolocation API
  const findNearbyAtms = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchNearbyATMs(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Could not access your location. Please enable location services.');
          
          // Mock data for development
          fetchNearbyATMs(37.7749, -122.4194); // Sample coordinates
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
      // Mock data for development
      fetchNearbyATMs(37.7749, -122.4194); // Sample coordinates
    }
  };

  // Confirm the withdrawal with backend
  const confirmWithdrawal = async () => {
    try {
      setLoading(true);
      
      const api = getApiInstance();
      const withdrawalData = {
        accountId: accountFrom,
        accountType: selectedAccount?.type || '',
        withdrawalType,
        amount: parseFloat(withdrawalAmount),
        transactionFee,
        note,
        receiptEmail: sendReceipt ? receiptEmail : '',
        scheduledDate: scheduleForLater ? scheduledDate : null,
        scheduledTime: scheduleForLater ? scheduledTime : null,
        allowFingerprint
      };
      
      try {
        const response = await api.post('/api/withdrawals/withdraw', withdrawalData);
        
        if (response.data?.success) {
          setTransactionResult(response.data.data?.withdrawal);
          
          if (response.data.data?.withdrawal?.atmCode) {
            setAtmCode(response.data.data.withdrawal.atmCode);
          }
          
          setIsConfirmModalOpen(false);
          setIsSuccessModalOpen(true);
          
          // Update the recent withdrawals list with this new withdrawal
          const newWithdrawal = {
            date: new Date().toLocaleDateString(),
            amount: parseFloat(withdrawalAmount),
            type: withdrawalType === 'atm' ? 'ATM' : 
                  withdrawalType === 'branch' ? 'Branch' : 'Cash Advance',
            location: 'Online',
            status: scheduleForLater ? 'Scheduled' : 'Completed'
          };
          setRecentWithdrawals([newWithdrawal, ...recentWithdrawals.slice(0, 9)]);
        } else {
          throw new Error(response.data?.error || 'Failed to process withdrawal');
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        
        // For development: simulate success if API fails
        const mockAtmCode = Math.floor(100000 + Math.random() * 900000).toString();
        setAtmCode(mockAtmCode);
        
        setTransactionResult({
          transactionId: `WF-${Math.floor(Math.random() * 1000000000)}`,
          amount: parseFloat(withdrawalAmount),
          status: scheduleForLater ? 'Scheduled' : 'Completed',
          withdrawalType,
          atmCode: mockAtmCode
        });
        
        setIsConfirmModalOpen(false);
        setIsSuccessModalOpen(true);
        
        // Update the recent withdrawals list with this new withdrawal
        const newWithdrawal = {
          date: new Date().toLocaleDateString(),
          amount: parseFloat(withdrawalAmount),
          type: withdrawalType === 'atm' ? 'ATM' : 
                withdrawalType === 'branch' ? 'Branch' : 'Cash Advance',
          location: 'Online',
          status: scheduleForLater ? 'Scheduled' : 'Completed'
        };
        setRecentWithdrawals([newWithdrawal, ...recentWithdrawals.slice(0, 9)]);
      }
      
    } catch (error) {
      console.error('Withdrawal error:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to process withdrawal. Please try again.');
      setIsConfirmModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Close success modal and navigate back
  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    navigate('/dashboard', { state: { refreshTimestamp: Date.now() } });
  };

  // Navigate back to account page or dashboard
  const goBack = () => {
    if (location.state?.account) {
      const accountType = location.state.account.type?.toLowerCase() || 'account';
      let routeType;
      
      if (accountType.includes('checking')) {
        routeType = 'checking';
      } else if (accountType.includes('savings')) {
        routeType = 'savings';
      } else {
        routeType = accountType.replace(/\s+/g, '-');
      }
      
      navigate(`/accounts/${routeType}/${location.state.account.id || location.state.account._id}`);
    } else {
      navigate('/dashboard');
    }
  };

  // Toggle ATM location display
  const toggleAtmLocations = () => {
    setShowAtmLocations(!showAtmLocations);
  };

  // Print receipt
  const printReceipt = () => {
    window.print();
  };

  // Send receipt via email
  const handleSendReceipt = async () => {
    if (!receiptEmail) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    
    try {
      const api = getApiInstance();
        await api.post('/api/withdrawals/receipt', {
        transactionId: transactionResult?.transactionId || '',
        email: receiptEmail
      });
      
      toast.success('Receipt sent successfully to ' + receiptEmail);
      setErrorMessage('');
    } catch (error) {
      console.error('Error sending receipt:', error);
      toast.error('Failed to send receipt. Please try again.');
    }
  };

  // Loading state display
  if (loading && accounts.length === 0) {
    return (
      <div className="withdraw-funds-page">
        <header className="eit0012-withdraw-funds-header">
          <div className="eit0012-back-button" onClick={goBack}>
            <span className="eit0012-back-arrow">&#8592;</span> Back to Account
          </div>
          <div className="eit0012-wells-fargo-branding">
            <div className="eit0012-logo-container">
              <img src="/Images/wells fargo.jpeg" alt="Wells Fargo Logo" className="eit0012-wf-logo" />
            </div>
          </div>
        </header>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="withdraw-funds-page">
      <header className="eit0012-withdraw-funds-header">
        <div className="eit0012-back-button" onClick={goBack}>
          <span className="eit0012-back-arrow">&#8592;</span> Back to Account
        </div>
        <div className="eit0012-wells-fargo-branding">
          <div className="eit0012-logo-container">
            <img src="/Images/wells fargo.jpeg" alt="Wells Fargo Logo" className="eit0012-wf-logo" />
          </div>
        </div>
      </header>

      <div className="withdraw-funds-content">
        <div className="withdraw-funds-card">
          <h1>Withdraw Funds</h1>
          <p className="withdraw-description">
            Select withdrawal type and enter the amount you'd like to withdraw from your account.
          </p>

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          <form className="withdraw-form" onSubmit={handleSubmit}>
            {/* Account Selection Dropdown */}
            <div className="form-group">
              <label htmlFor="accountFrom">From which account:</label>
              <select
                id="accountFrom"
                className="form-control"
                value={accountFrom}
                onChange={handleAccountChange}
                disabled={loading}
                required
              >
                <option value="" disabled>Select an account</option>
                {accounts && accounts.length > 0 ? (
                  accounts.map((account) => (
                    <option 
                      key={account.id || account._id} 
                      value={account.id || account._id}
                    >
                      {account.name || account.type} - ${account.balance?.toFixed(2)} - {account.number}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No accounts available</option>
                )}
              </select>
              {!accounts || accounts.length === 0 ? (
                <div className="text-danger mt-2">No accounts found. Please add an account first.</div>
              ) : null}
            </div>

            {/* Display selected account details */}
            {selectedAccount && (
              <div className="selected-account-details">
                <p>
                  <strong>{selectedAccount.name || selectedAccount.type}</strong><br />
                  Available balance: <span className="balance">${selectedAccount.balance?.toFixed(2)}</span><br />
                  Account number: {selectedAccount.number}
                </p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="withdrawal-type">Withdrawal Type:</label>
              <select 
                id="withdrawal-type" 
                value={withdrawalType} 
                onChange={(e) => setWithdrawalType(e.target.value)}
                className="form-control"
              >
                <option value="atm">ATM Withdrawal</option>
                <option value="branch">Branch Withdrawal</option>
                <option value="cashAdvance">Cash Advance</option>
              </select>
            </div>

            {withdrawalType === 'atm' && (
              <div className="atm-info-panel">
                <h3>ATM Withdrawal Information</h3>
                <p>Daily ATM withdrawal limit: ${currentLimits.atm.toLocaleString()}</p>
                <p>Available balance: ${selectedAccount ? selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</p>
                <ul className="atm-instructions">
                  <li>Enter the amount you wish to withdraw</li>
                  <li>A one-time code will be generated for your ATM withdrawal</li>
                  <li>The code will be valid for 30 minutes</li>
                  <li>Visit any Wells Fargo ATM and enter the code to receive your cash</li>
                </ul>
                <button type="button" className="link-button" onClick={toggleAtmLocations}>
                  {showAtmLocations ? 'Hide ATM Locations' : 'Show Nearby ATMs'}
                </button>
                <button type="button" className="link-button" onClick={findNearbyAtms}>
                  Find ATMs Near Me
                </button>
                
                {showAtmLocations && (
                  <div className="atm-locations-panel">
                    <h4>Nearby ATM Locations</h4>
                    <ul className="atm-locations-list">
                      {atmLocations.length > 0 ? atmLocations.map(atm => (
                        <li key={atm.id} className="atm-location">
                          <strong>{atm.name}</strong>
                          <p>{atm.address}</p>
                          <p><small>Distance: {atm.distance}</small></p>
                        </li>
                      )) : (
                        <li>No ATM locations found. Please try searching in a different area.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {withdrawalType === 'branch' && (
              <div className="branch-info-panel">
                <h3>Branch Withdrawal Information</h3>
                <p>Enter the amount you wish to withdraw at a branch location</p>
                <p>Available balance: ${selectedAccount ? selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</p>
                <p>Please note:</p>
                <ul className="branch-instructions">
                  <li>You'll need to present a valid ID at the branch</li>
                  <li>For withdrawals over $5,000, please call ahead to ensure availability</li>
                  <li>A withdrawal slip will be generated for you to print</li>
                  <li>Branch hours are Monday-Friday, 9 AM - 5 PM, Saturday 9 AM - 12 PM</li>
                </ul>
                
                <div className="schedule-option">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={scheduleForLater} 
                      onChange={() => setScheduleForLater(!scheduleForLater)} 
                    />
                    Schedule this withdrawal for later
                  </label>
                </div>
                
                {scheduleForLater && (
                  <div className="schedule-details">
                    <div className="form-group">
                      <label htmlFor="scheduled-date">Date:</label>
                      <input 
                        id="scheduled-date"
                        type="date" 
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="form-control"
                        required={scheduleForLater}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="scheduled-time">Time:</label>
                      <input 
                        id="scheduled-time"
                        type="time" 
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="form-control"
                        required={scheduleForLater}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {withdrawalType === 'cashAdvance' && (
              <div className="cash-advance-info-panel">
                <h3>Cash Advance Information</h3>
                <p>Available balance: ${selectedAccount ? selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</p>
                <p>Daily cash advance limit: ${currentLimits.cashAdvance.toLocaleString()}</p>
                <div className="fee-information">
                  <p><strong>Fee Information:</strong></p>
                  <ul>
                    <li>3% of the transaction amount</li>
                    <li>Minimum fee of $10</li>
                    <li>Interest begins accruing immediately</li>
                  </ul>
                </div>
                <div className="terms-checkbox">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={agreeToTerms} 
                      onChange={() => setAgreeToTerms(!agreeToTerms)} 
                      required
                    />
                    I agree to the terms and conditions for cash advances
                  </label>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="withdrawal-amount">Amount to Withdraw:</label>
              <div className="amount-input-container">
                <span className="currency-symbol">$</span>
                <input 
                  id="withdrawal-amount"
                  type="text" 
                  value={withdrawalAmount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="amount-input"
                  required
                />
              </div>
              
              <div className="quick-amounts">
                {quickAmounts.map(amount => (
                  <button 
                    key={amount} 
                    type="button" 
                    className="quick-amount-button"
                    onClick={() => handleQuickAmountSelect(amount)}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {showFeeWarning && (
              <div className="fee-warning">
                <p>This transaction will incur a fee of ${transactionFee.toFixed(2)}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="withdrawal-note">Note (Optional):</label>
              <input 
                id="withdrawal-note"
                type="text" 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for this withdrawal"
                className="form-control"
              />
            </div>

            <div className="receipt-options">
              <label>
                <input 
                  type="checkbox" 
                  checked={sendReceipt} 
                  onChange={() => setSendReceipt(!sendReceipt)} 
                />
                Send receipt via email
              </label>
              
              {sendReceipt && (
                <div className="email-input-group">
                  <input 
                    type="email" 
                    value={receiptEmail}
                    onChange={(e) => setReceiptEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="form-control"
                    required={sendReceipt}
                  />
                </div>
              )}
            </div>

            <div className="recent-withdrawals">
              <h3>Recent Withdrawals</h3>
              <div className="recent-withdrawals-list">
                {recentWithdrawals.length > 0 ? (
                  recentWithdrawals.map((withdrawal, index) => (
                    <div key={index} className="recent-withdrawal-item">
                      <div className="withdrawal-date">{withdrawal.date}</div>
                      <div className="withdrawal-details">
                        <span className="withdrawal-amount">${withdrawal.amount}</span>
                        <span className="withdrawal-type">{withdrawal.type}</span>
                        <span className="withdrawal-location">{withdrawal.location}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No recent withdrawals found.</p>
                )}
              </div>
            </div>

            <div className="biometric-authentication">
            <label>
              <input 
                type="checkbox" 
                checked={allowFingerprint} 
                onChange={() => setAllowFingerprint(!allowFingerprint)} 
              />
              Enable fingerprint verification for this withdrawal
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              {loading ? 'Processing...' : 'Continue'}
            </button>
            <button type="button" className="secondary-button" onClick={goBack}>
              Cancel
            </button>
          </div>
          </form>
          </div>

          {/* Confirmation Modal */}
          {isConfirmModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content confirmation-modal">
                <h2>Confirm Withdrawal</h2>
                <p>Are you sure you want to withdraw ${parseFloat(withdrawalAmount).toFixed(2)} from your {selectedAccount?.name}?</p>
                
                <div className="confirmation-details">
                  <div className="detail-row">
                    <span className="detail-label">Account:</span>
                    <span className="detail-value">{selectedAccount?.name} - {selectedAccount?.number}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Withdrawal Type:</span>
                    <span className="detail-value">
                      {withdrawalType === 'atm' ? 'ATM Withdrawal' : 
                      withdrawalType === 'branch' ? 'Branch Withdrawal' : 'Cash Advance'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value">${parseFloat(withdrawalAmount).toFixed(2)}</span>
                  </div>
                  {transactionFee > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Fee:</span>
                      <span className="detail-value">${transactionFee.toFixed(2)}</span>
                    </div>
                  )}
                  {transactionFee > 0 && (
                    <div className="detail-row total-row">
                      <span className="detail-label">Total:</span>
                      <span className="detail-value">${(parseFloat(withdrawalAmount) + transactionFee).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="modal-actions">
                  <button className="primary-button" onClick={confirmWithdrawal} disabled={loading}>
                    {loading ? 'Processing...' : 'Confirm'}
                  </button>
                  <button className="secondary-button" onClick={() => setIsConfirmModalOpen(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {isSuccessModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content success-modal">
                <h2>Withdrawal Successful</h2>
                
                <div className="success-details">
                  <p className="success-message">
                    {scheduleForLater 
                      ? 'Your withdrawal has been scheduled successfully.' 
                      : 'Your withdrawal has been processed successfully.'}
                  </p>
                  
                  <div className="transaction-details">
                    <div className="detail-row">
                      <span className="detail-label">Transaction ID:</span>
                      <span className="detail-value">{transactionResult?.transactionId || 'WF-' + Math.floor(Math.random() * 1000000000)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Amount:</span>
                      <span className="detail-value">${parseFloat(withdrawalAmount).toFixed(2)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Account:</span>
                      <span className="detail-value">{selectedAccount?.name} - {selectedAccount?.number}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{new Date().toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value status-complete">{scheduleForLater ? 'Scheduled' : 'Complete'}</span>
                    </div>
                  </div>
                  
                  {atmCode && withdrawalType === 'atm' && (
                    <div className="atm-code-container">
                      <h3>Your ATM Withdrawal Code</h3>
                      <div className="atm-code">{atmCode}</div>
                      <p className="code-instructions">
                        Use this code at any Wells Fargo ATM to complete your withdrawal.
                        <br />
                        This code is valid for 30 minutes.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="receipt-actions">
                  <button className="action-button" onClick={printReceipt}>
                    <span className="icon print-icon">🖨️</span> Print Receipt
                  </button>
                  <div className="email-receipt-container">
                    <input 
                      type="email" 
                      value={receiptEmail}
                      onChange={(e) => setReceiptEmail(e.target.value)}
                      placeholder="Email for receipt"
                      className="email-input"
                    />
                    <button className="action-button" onClick={handleSendReceipt}>
                      <span className="icon email-icon">✉️</span> Email Receipt
                    </button>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button className="primary-button" onClick={closeSuccessModal}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
    </div>
  );
};

export default WithdrawFundsPage;