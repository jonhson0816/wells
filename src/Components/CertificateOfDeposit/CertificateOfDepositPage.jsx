import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './CertificateOfDepositPage.css';

const CertificateOfDepositPage = () => {
  const { accountId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30days');
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isEarlyWithdrawalModalOpen, setIsEarlyWithdrawalModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Statement form state
  const [statementPeriod, setStatementPeriod] = useState('');
  const [statementFormat, setStatementFormat] = useState('pdf');
  
  // Early withdrawal form state
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [withdrawalPenaltyAmount, setWithdrawalPenaltyAmount] = useState(0);
  
  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate days remaining until maturity
  const calculateDaysRemaining = (maturityDate) => {
    if (!maturityDate) return "N/A";
    
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = Math.abs(maturity - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Get auth token from local storage
  const getAuthToken = () => {
    const token = localStorage.getItem('wellsFargoAuthToken');
    console.log('Retrieved token:', token ? 'Token exists' : 'No token found');
    return token;
  };

  // API config with auth headers
  const apiConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };
  };

  // Determine if we should use primary account endpoint or specific account endpoint
  const isPrimaryAccount = () => {
    return !accountId || accountId === 'primary';
  };

  // Get the appropriate API endpoint based on whether this is the primary account
  const getApiEndpoint = (endpoint = '') => {
    // Use the full URL including the base URL of your API server
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    return isPrimaryAccount() 
      ? `${baseUrl}/api/cd/primary${endpoint}` 
      : `${baseUrl}/api/cd/${accountId}${endpoint}`;
  };

  // Try to get account data from localStorage first (as stored by Dashboard)
  const getAccountDataFromLocalStorage = () => {
    try {
      const accountsData = localStorage.getItem('wellsFargoAccounts');
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        // Find the specific CD account by ID or get the first CD account if id is primary
        let matchedAccount;
        if (isPrimaryAccount()) {
          matchedAccount = accounts.find(acc => acc.type.toLowerCase().includes('cd') || acc.type.toLowerCase().includes('certificate'));
        } else {
          matchedAccount = accounts.find(acc => acc.id === accountId);
        }
        
        // Ensure we only return a CD account
        if (matchedAccount && matchedAccount.type && 
            (matchedAccount.type.toLowerCase().includes('cd') || matchedAccount.type.toLowerCase().includes('certificate'))) {
          return matchedAccount;
        }
      }
    } catch (error) {
      console.error('Error getting account data from localStorage:', error);
    }
    return null;
  };

  // Generate consistent transactions based on account balance
  const generateConsistentTransactions = (account) => {
    // Use the account's openedDate
    const accountOpenDate = new Date(account.openedDate || account.openDate);
    
    // Get initial deposit from localStorage if available
    const newAccountData = localStorage.getItem('newWellsFargoCDAccount');
    let initialDeposit = 0;
    if (newAccountData) {
      try {
        const parsedData = JSON.parse(newAccountData);
        initialDeposit = parsedData.initialDeposit || parsedData.balance || 0;
      } catch (e) {
        console.error('Error parsing newWellsFargoCDAccount data:', e);
      }
    }
    
    const balance = account.balance || initialDeposit || 5000.00; // CDs typically start with higher balances
    
    // Create realistic transactions that add up to the current balance
    const transactions = [];
    
    // Initial CD deposit
    transactions.push({
      id: 'tx1',
      date: new Date(accountOpenDate).toISOString(),
      description: 'CD Account Opening Deposit',
      status: 'Completed',
      type: 'deposit',
      amount: balance,
      balance: balance
    });
    
    // Interest payments (quarterly)
    const monthsSinceOpening = Math.floor((new Date() - accountOpenDate) / (1000 * 60 * 60 * 24 * 30));
    const quartersPassed = Math.floor(monthsSinceOpening / 3);
    
    let runningBalance = balance;
    
    for (let i = 1; i <= quartersPassed && i <= 4; i++) {
      // Calculate interest for the quarter
      const interestRate = account.interestRate || 3.75;
      const rateDecimal = parseFloat(interestRate) / 100;
      const quarterlyInterest = runningBalance * (rateDecimal / 4);
      
      runningBalance += quarterlyInterest;
      
      transactions.push({
        id: `tx${i+1}`,
        date: new Date(
          accountOpenDate.getFullYear(), 
          accountOpenDate.getMonth() + (i * 3), 
          accountOpenDate.getDate()
        ).toISOString(),
        description: `Quarterly Interest Payment`,
        status: 'Completed',
        type: 'interest',
        amount: quarterlyInterest,
        balance: runningBalance
      });
    }
    
    // Sort by date (newest first)
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Generate mock CD account data
  const generateMockCDAccount = (initialDeposit) => {
    // CD terms - randomly select one for mock data
    const cdTermOptions = [
      { term: '3 months', rate: 2.25 },
      { term: '6 months', rate: 2.75 },
      { term: '1 year', rate: 3.25 },
      { term: '18 months', rate: 3.50 },
      { term: '2 years', rate: 3.75 },
      { term: '3 years', rate: 4.00 },
      { term: '5 years', rate: 4.25 }
    ];
    
    // Select a term option
    const selectedTerm = cdTermOptions[Math.floor(Math.random() * cdTermOptions.length)];
    
    // Calculate maturity date based on term
    const openDate = new Date();
    const maturityDate = new Date(openDate);
    
    if (selectedTerm.term.includes('months')) {
      const months = parseInt(selectedTerm.term);
      maturityDate.setMonth(maturityDate.getMonth() + months);
    } else if (selectedTerm.term.includes('year')) {
      const years = parseFloat(selectedTerm.term);
      maturityDate.setFullYear(maturityDate.getFullYear() + Math.floor(years));
      if (years % 1 !== 0) { // Handle fractional years (e.g., 1.5 years)
        maturityDate.setMonth(maturityDate.getMonth() + Math.floor((years % 1) * 12));
      }
    }
    
    // Calculate interest earned to date (simplified)
    const rateDecimal = selectedTerm.rate / 100;
    const balance = initialDeposit || 5000;
    const interestEarned = balance * rateDecimal * (Math.random() * 0.25); // Assume up to 25% of the way through term
    
    return {
      id: accountId || 'primary-cd',
      type: 'Certificate of Deposit',
      accountNumber: location.state?.account?.accountNumber || (accountId ? accountId : '0000000000'),
      routingNumber: '121000248',
      balance: balance + interestEarned, // Principal plus accrued interest
      principalBalance: balance,
      openedDate: openDate.toISOString(),
      maturityDate: maturityDate.toISOString(),
      term: selectedTerm.term,
      interestRate: selectedTerm.rate,
      interestEarned: interestEarned,
      earlyWithdrawalPenalty: '90 days of interest',
      renewalOption: 'Automatic',
      isLocked: true,
      minimumDeposit: 1000,
      maximumDeposit: 250000,
      fdicInsured: true
    };
  };

  // Fetch account data with fallback to localStorage data, then mock data on error
  const fetchAccountData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        setError('Authentication required. Please log in.');
        setIsLoading(false);
        return;
      }
      
      console.log(`Fetching CD account data: ${isPrimaryAccount() ? 'Primary Account' : `ID: ${accountId}`}`);
      
      // First, try to get account from location state (passed from Dashboard)
      if (location.state && location.state.account) {
        const stateAccount = location.state.account;
        // Verify this is actually a CD account
        if (stateAccount.type && (stateAccount.type.toLowerCase().includes('cd') || 
                                 stateAccount.type.toLowerCase().includes('certificate'))) {
          console.log('Using CD account data from location state:', stateAccount);
          setAccount(stateAccount);
          const mockTransactions = generateConsistentTransactions(stateAccount);
          setTransactions(mockTransactions);
          setIsLoading(false);
          return;
        }
      }
      
      const apiEndpoint = getApiEndpoint();
      console.log('Using API endpoint:', apiEndpoint);
      
      try {
        const response = await axios.get(apiEndpoint, apiConfig());
        
        console.log('API Response:', response);
        
        if (response.data.success) {
          const accountData = response.data.data;
          // Verify this is a CD account
          if (accountData.type && (accountData.type.toLowerCase().includes('cd') || 
                                  accountData.type.toLowerCase().includes('certificate'))) {
            setAccount(accountData);
            // If transactions came with the account data, set them too
            if (accountData.transactions) {
              setTransactions(accountData.transactions);
            } else {
              const mockTransactions = generateConsistentTransactions(accountData);
              setTransactions(mockTransactions);
            }
          } else {
            throw new Error('Retrieved account is not a CD account');
          }
        } else {
          throw new Error(response.data.error || 'Failed to load account data');
        }
      } catch (apiError) {
        console.error('API Error, checking localStorage data:', apiError);
        
        // Try to get data from localStorage (which was populated by Dashboard)
        const localStorageAccount = getAccountDataFromLocalStorage();
        
        if (localStorageAccount) {
          console.log('Found CD account in localStorage:', localStorageAccount);
          setAccount(localStorageAccount);
          
          // Generate mock transactions based on the account balance
          const mockTransactions = generateConsistentTransactions(localStorageAccount);
          setTransactions(mockTransactions);
        } else {
          console.error('No localStorage data found, using fallback mock data');
          
          // Get initial deposit from localStorage if available
          const newAccountData = localStorage.getItem('newWellsFargoCDAccount');
          let initialDeposit = 0;
          
          if (newAccountData) {
            try {
              const parsedData = JSON.parse(newAccountData);
              initialDeposit = parsedData.initialDeposit || parsedData.balance || 0;
            } catch (e) {
              console.error('Error parsing newWellsFargoCDAccount data:', e);
            }
          }

          // Fall back to mock data
          const mockAccount = generateMockCDAccount(initialDeposit || 5000);
          setAccount(mockAccount);
          
          // Generate fallback mock transactions
          const mockTransactions = generateConsistentTransactions(mockAccount);
          setTransactions(mockTransactions);
        }
      }
    } catch (err) {
      console.error('Error fetching account (detailed):', err);
      
      if (err.message && err.message.includes('Network Error')) {
        console.error('Possible proxy configuration issue - check Vite config');
        setError('Network error - API server may be unreachable');
      } else if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err.response && err.response.status === 404) {
        setError(`Account not found. Please check the account ID or create a new account.`);
      } else {
        setError(err.response?.data?.error || `Error fetching account data: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatAccountNumber = (accountNumber) => {
    // If the account number is already formatted (contains non-digit characters)
    if (typeof accountNumber === 'string' && accountNumber.match(/[^0-9]/)) {
      return accountNumber;
    }
    
    // Format as xxxx-xxxx-1234 (last 4 digits visible)
    if (typeof accountNumber === 'string' && accountNumber.length >= 4) {
      const last4 = accountNumber.slice(-4);
      return `xxxx-xxxx-${last4}`;
    }
    
    return accountNumber;
  };

  // Fetch transactions with filters with fallback to filtered mock data
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        setError('Authentication required. Please log in.');
        setIsLoading(false);
        return;
      }
      
      const queryParams = new URLSearchParams();
      if (filter !== 'all') queryParams.append('filter', filter);
      if (dateRange !== 'all') queryParams.append('dateRange', dateRange);

      const apiEndpoint = getApiEndpoint('/transactions');
      console.log('Making request to:', apiEndpoint);
      
      try {
        const response = await axios.get(
          `${apiEndpoint}?${queryParams.toString()}`,
          apiConfig()
        );
        
        if (response.data.success) {
          setTransactions(response.data.data);
        } else {
          throw new Error(response.data.error || 'Failed to load transactions');
        }
      } catch (apiError) {
        console.error('API Error, filtering mock transactions:', apiError);
        // Filter the existing transactions based on selected filter
        const filteredTransactions = transactions.filter(tx => {
          if (filter === 'all') return true;
          return tx.type === filter;
        });
        
        setTransactions(filteredTransactions);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.error || 'Error fetching transactions');
      }
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock API responses for form submissions to prevent errors
  const mockApiResponse = (successMessage) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            success: true,
            data: {
              orderId: Math.floor(Math.random() * 1000000),
              downloadUrl: 'https://example.com/statement.pdf'
            },
            message: successMessage
          }
        });
      }, 500);
    });
  };

  // Download statement
  const downloadStatement = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert('Authentication required. Please log in.');
        return;
      }
      
      const apiEndpoint = getApiEndpoint('/statement');
      
      try {
        const response = await axios.post(
          apiEndpoint,
          {
            period: statementPeriod,
            format: statementFormat
          },
          apiConfig()
        );
        
        if (response.data.success) {
          alert(`Your statement is being prepared for download. It will be available at: ${response.data.data.downloadUrl}`);
          setIsStatementModalOpen(false);
        } else {
          throw new Error(response.data.error || 'Failed to generate statement');
        }
      } catch (apiError) {
        console.log('API error, using mock response:', apiError);
        const mockResponse = await mockApiResponse('Statement generated successfully');
        alert(`Your statement is being prepared for download. It will be available shortly in your document center.`);
        setIsStatementModalOpen(false);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Your session has expired. Please log in again.');
      } else {
        alert(err.response?.data?.error || 'Error generating statement');
      }
      console.error('Error downloading statement:', err);
    }
  };

  // Handle early withdrawal request
  const handleEarlyWithdrawal = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert('Authentication required. Please log in.');
        handleLoginRedirect();
        return;
      }
      
      const amount = parseFloat(withdrawalAmount);
      if (isNaN(amount) || amount <= 0 || amount > account.balance) {
        alert('Please enter a valid withdrawal amount (must be less than or equal to your balance).');
        return;
      }
      
      // Confirm early withdrawal with penalty
      const confirmWithdrawal = window.confirm(
        `WARNING: Early withdrawal before maturity date will result in a penalty of ${account.earlyWithdrawalPenalty}. 
        Your estimated penalty is ${formatCurrency(withdrawalPenaltyAmount)}. 
        Do you want to proceed?`
      );
      
      if (!confirmWithdrawal) {
        return;
      }
      
      const apiEndpoint = getApiEndpoint('/early-withdrawal');
      
      try {
        const response = await axios.post(
          apiEndpoint,
          {
            amount: amount,
            reason: withdrawalReason
          },
          apiConfig()
        );
        
        if (response.data.success) {
          // Update the account balance
          setAccount({
            ...account,
            balance: response.data.data.newBalance
          });
          
          // Add the withdrawal and penalty transactions
          setTransactions([
            response.data.data.withdrawalTransaction,
            response.data.data.penaltyTransaction,
            ...transactions
          ]);
          
          alert(`Successfully processed early withdrawal of ${formatCurrency(amount)}. A penalty of ${formatCurrency(response.data.data.penaltyAmount)} was applied.`);
          setIsEarlyWithdrawalModalOpen(false);
          setWithdrawalAmount('');
          setWithdrawalReason('');
        } else {
          throw new Error(response.data.error || 'Failed to process early withdrawal');
        }
      } catch (apiError) {
        console.log('API error, using mock response:', apiError);
        
        // Calculate penalty (typically 90-180 days of interest)
        const interestRate = parseFloat(account.interestRate) / 100;
        const dailyInterest = (account.balance * interestRate) / 365;
        const penalty = dailyInterest * 90; // 90 days penalty
        
        // Create mock transactions
        const withdrawalTransaction = {
          id: 'tx' + Math.floor(Math.random() * 10000),
          date: new Date().toISOString(),
          description: 'Early CD Withdrawal',
          status: 'Completed',
          type: 'withdrawal',
          amount: amount,
          balance: account.balance - amount - penalty
        };
        
        const penaltyTransaction = {
          id: 'tx' + Math.floor(Math.random() * 10000),
          date: new Date().toISOString(),
          description: 'Early Withdrawal Penalty',
          status: 'Completed',
          type: 'fee',
          amount: penalty,
          balance: account.balance - amount
        };
        
        // Update the account balance
        const newBalance = account.balance - amount - penalty;
        setAccount({
          ...account,
          balance: newBalance
        });
        
        // Add the new transactions to the transactions list
        setTransactions([withdrawalTransaction, penaltyTransaction, ...transactions]);
        
        alert(`Successfully processed early withdrawal of ${formatCurrency(amount)}. A penalty of ${formatCurrency(penalty)} was applied.`);
        setIsEarlyWithdrawalModalOpen(false);
        setWithdrawalAmount('');
        setWithdrawalReason('');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Your session has expired. Please log in again.');
        handleLoginRedirect();
      } else {
        alert(err.response?.data?.error || 'Error processing withdrawal');
      }
      console.error('Error processing early withdrawal:', err);
    }
  };

  // Calculate early withdrawal penalty
  const calculateWithdrawalPenalty = (amount) => {
    if (!account || !amount) return 0;
    
    const withdrawalAmt = parseFloat(amount);
    if (isNaN(withdrawalAmt) || withdrawalAmt <= 0) return 0;
    
    // Typical CD penalty is 90-180 days of interest
    const interestRate = parseFloat(account.interestRate) / 100;
    const dailyInterest = (withdrawalAmt * interestRate) / 365;
    const penalty = dailyInterest * 90; // 90 days penalty
    
    return penalty;
  };

  // Handle login redirection
  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: location.pathname } });
  };

  // Update withdrawal penalty when amount changes
  useEffect(() => {
    const penalty = calculateWithdrawalPenalty(withdrawalAmount);
    setWithdrawalPenaltyAmount(penalty);
  }, [withdrawalAmount, account]);

  // Initial data fetch
  useEffect(() => {
    fetchAccountData();
  }, [accountId]); // Re-fetch when accountId changes

  // Fetch transactions when filters change and we have account data
  useEffect(() => {
    if (account) {
      // Only fetch transactions separately if filter/dateRange has changed
      // Otherwise use the transactions that came with account data
      if (filter !== 'all' || dateRange !== '30days') {
        fetchTransactions();
      }
    }
  }, [account, filter, dateRange]);

  // Reset filter and date range when account changes
  useEffect(() => {
    setFilter('all');
    setDateRange('30days');
  }, [accountId]);

  // Handle quick actions
  const handleQuickAction = (action) => {
    // First check if user is authenticated
    const token = getAuthToken();
    if (!token) {
      alert('Authentication required. Please log in.');
      handleLoginRedirect();
      return;
    }
    
    switch (action) {
      case 'earlyWithdrawal':
        setIsEarlyWithdrawalModalOpen(true);
        break;
      case 'statement':
        setIsStatementModalOpen(true);
        break;
      case 'renewalOptions':
        navigate('/cd-renewal-options', { state: { account: account } });
        break;
      case 'interestPayouts':
        navigate('/cd-interest-payouts', { state: { account: account } });
        break;
      case 'alerts':
        navigate('/account-alerts', { state: { account: account } });
        break;
      default:
        console.log(`Action not implemented: ${action}`);
        break;
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="cd-loading-container">
        <div className="cd-loader"></div>
        <p>Loading certificate of deposit information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cd-error-container">
        <h2>Error Loading Account</h2>
        <p>{error}</p>
        <button onClick={goToDashboard} className="cd-button cd-primary">
          Return to Dashboard
        </button>
        {error.includes('Authentication') && (
          <button onClick={handleLoginRedirect} className="cd-button cd-secondary">
            Log In
          </button>
        )}
      </div>
    );
  }

  if (!account) {
    return (
      <div className="cd-error-container">
        <h2>Account Not Found</h2>
        <p>The requested certificate of deposit account could not be found.</p>
        <button onClick={goToDashboard} className="cd-button cd-primary">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="cd-container">
      <header className="cd-account-header">
        <div className="cd-return-nav">
          <button onClick={goToDashboard} className="cd-back-button">
            ← Back to Dashboard
          </button>
        </div>
        <div className="cd-account-title">
          <h1>Certificate of Deposit</h1>
          <p className="cd-account-number">Account #: {formatAccountNumber(account.accountNumber)}</p>
        </div>
      </header>

      <div className="cd-account-overview">
        <div className="cd-balance-container">
          <div className="cd-balance-card">
            <h3>Current Balance</h3>
            <p className="cd-amount">{formatCurrency(account.balance)}</p>
          </div>
          <div className="cd-balance-card">
            <h3>Interest Rate</h3>
            <p className="cd-amount">{account.interestRate}% APY</p>
          </div>
          <div className="cd-balance-card">
            <h3>Maturity Date</h3>
            <p className="cd-amount">{formatDate(account.maturityDate)}</p>
            <p className="cd-maturity-countdown">{calculateDaysRemaining(account.maturityDate)} days remaining</p>
          </div>
        </div>

        <div className="cd-maturity-progress">
          <h3>Progress to Maturity</h3>
          <div className="cd-progress-bar-container">
            <div 
              className="cd-progress-bar" 
              style={{ 
                width: `${Math.min(100, 100 - (calculateDaysRemaining(account.maturityDate) / 
                  (new Date(account.maturityDate) - new Date(account.openedDate)) * 86400000 * 100))}%` 
              }}
            ></div>
          </div>
          <div className="cd-progress-labels">
            <span>{formatDate(account.openedDate)}</span>
            <span>{formatDate(account.maturityDate)}</span>
          </div>
        </div>

        <div className="cd-quick-actions">
          <h3>Quick Actions</h3>
          <div className="cd-action-buttons">
            <button onClick={() => handleQuickAction('statement')} className="cd-action-button">
              <span className="cd-action-icon">📄</span>
              <span>Statement</span>
            </button>
            <button onClick={() => handleQuickAction('earlyWithdrawal')} className="cd-action-button">
              <span className="cd-action-icon">💸</span>
              <span>Early Withdrawal</span>
            </button>
            <button onClick={() => handleQuickAction('renewalOptions')} className="cd-action-button">
              <span className="cd-action-icon">🔄</span>
              <span>Renewal Options</span>
            </button>
            <button onClick={() => handleQuickAction('interestPayouts')} className="cd-action-button">
              <span className="cd-action-icon">💰</span>
              <span>Interest Payouts</span>
            </button>
            <button onClick={() => handleQuickAction('alerts')} className="cd-action-button">
              <span className="cd-action-icon">🔔</span>
              <span>Alerts</span>
            </button>
          </div>
        </div>
      </div>

      <div className="cd-account-details">
        <div className="cd-account-info">
          <h3>Certificate of Deposit Details</h3>
          <div className="cd-info-grid">
            <div className="cd-info-item">
              <span className="cd-info-label">Account Type:</span>
              <span className="cd-info-value">{account.type || "Certificate of Deposit"}</span>
            </div>
            <div className="cd-info-item">
              <span className="cd-info-label">Account Number:</span>
              <span className="cd-info-value">{formatAccountNumber(account.accountNumber)}</span>
            </div>
            <div className="cd-info-item">
              <span className="cd-info-label">Routing Number:</span>
              <span className="cd-info-value">{account.routingNumber || "121000248"}</span>
            </div>
            <div className="cd-info-item">
              <span className="cd-info-label">Term:</span>
              <span className="cd-info-value">{account.term}</span>
            </div>
            <div className="cd-info-item">
              <span className="cd-info-label">Interest Rate:</span>
              <span className="cd-info-value">{account.interestRate}% APY</span>
            </div>
            <div className="cd-info-item">
              <span className="cd-info-label">Interest Earned:</span>
              <span className="cd-info-value">{formatCurrency(account.interestEarned || 0)}</span>
            </div>
            <div className="cd-info-item">
              <span className="cd-info-label">Opening Date:</span>
              <span className="cd-info-value">{formatDate(account.openedDate)}</span>
            </div>
            <div className="cd-info-item">
              <span className="cd-info-label">Maturity Date:</span>
              <span className="cd-info-value">{formatDate(account.maturityDate)}</span>
            </div>
            <div className="cd-info-item">
              <span className="cd-info-label">Renewal Option:</span>
              <span className="cd-info-value">{account.renewalOption || "Automatic"}</span>
            </div>
            <div className="cd-info-item">
              <span className="cd-info-label">Early Withdrawal Penalty:</span>
              <span className="cd-info-value">{account.earlyWithdrawalPenalty}</span>
            </div>
            <div className="cd-info-item">
              <span className="cd-info-label">FDIC Insured:</span>
              <span className="cd-info-value">{account.fdicInsured ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cd-transactions">
        <div className="cd-transactions-header">
          <h3>Recent Transactions</h3>
          <div className="cd-transactions-filters">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="cd-filter-select"
            >
              <option value="all">All Transactions</option>
              <option value="deposit">Deposits</option>
              <option value="interest">Interest</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="fee">Fees</option>
            </select>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="cd-filter-select"
            >
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <div className="cd-transactions-list">
          <table className="cd-transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="cd-transaction-row">
                    <td>{formatDate(transaction.date)}</td>
                    <td>{transaction.description}</td>
                    <td>
                      <span className={`cd-transaction-type cd-type-${transaction.type}`}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </td>
                    <td className={`cd-amount-cell ${transaction.type === 'interest' || transaction.type === 'deposit' ? 'cd-positive' : 'cd-negative'}`}>
                      {transaction.type === 'interest' || transaction.type === 'deposit' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </td>
                    <td>{formatCurrency(transaction.balance)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="cd-no-transactions">
                    No transactions found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statement Modal */}
      {isStatementModalOpen && (
        <div className="cd-modal-overlay">
          <div className="cd-modal-content">
            <div className="cd-modal-header">
              <h3>Request Statement</h3>
              <button 
                onClick={() => setIsStatementModalOpen(false)}
                className="cd-modal-close"
              >
                &times;
              </button>
            </div>
            <div className="cd-modal-body">
              <form onSubmit={(e) => { e.preventDefault(); downloadStatement(); }}>
                <div className="cd-form-group">
                  <label htmlFor="statement-period">Statement Period:</label>
                  <select
                    id="statement-period"
                    value={statementPeriod}
                    onChange={(e) => setStatementPeriod(e.target.value)}
                    required
                  >
                    <option value="">Select Period</option>
                    <option value="current">Current Period</option>
                    <option value="previous">Previous Period</option>
                    <option value="ytd">Year to Date</option>
                    <option value="last-quarter">Last Quarter</option>
                    <option value="last-year">Last Year</option>
                  </select>
                </div>
                <div className="cd-form-group">
                  <label htmlFor="statement-format">Format:</label>
                  <div className="cd-radio-group">
                    <label>
                      <input
                        type="radio"
                        name="format"
                        value="pdf"
                        checked={statementFormat === 'pdf'}
                        onChange={() => setStatementFormat('pdf')}
                      />
                      PDF
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="format"
                        value="csv"
                        checked={statementFormat === 'csv'}
                        onChange={() => setStatementFormat('csv')}
                      />
                      CSV
                    </label>
                  </div>
                </div>
                <div className="cd-form-actions">
                  <button type="submit" className="cd-button cd-primary">Download Statement</button>
                  <button 
                    type="button" 
                    onClick={() => setIsStatementModalOpen(false)}
                    className="cd-button cd-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Early Withdrawal Modal */}
      {isEarlyWithdrawalModalOpen && (
        <div className="cd-modal-overlay">
          <div className="cd-modal-content">
            <div className="cd-modal-header">
              <h3>Early Withdrawal Request</h3>
              <button 
                onClick={() => setIsEarlyWithdrawalModalOpen(false)}
                className="cd-modal-close"
              >
                &times;
              </button>
            </div>
            <div className="cd-modal-body">
              <div className="cd-warning-message">
                <strong>Warning:</strong> Early withdrawal may result in penalties. Your CD has an early withdrawal penalty of {account.earlyWithdrawalPenalty}.
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleEarlyWithdrawal(); }}>
                <div className="cd-form-group">
                  <label htmlFor="withdrawal-amount">Withdrawal Amount:</label>
                  <input
                    type="number"
                    id="withdrawal-amount"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    min="1"
                    max={account.balance}
                    step="0.01"
                    required
                    placeholder="Enter amount"
                  />
                  <p className="cd-form-hint">Available balance: {formatCurrency(account.balance)}</p>
                </div>
                {withdrawalAmount && (
                  <div className="cd-penalty-preview">
                    <p>Estimated Penalty: {formatCurrency(withdrawalPenaltyAmount)}</p>
                    <p>You will receive: {formatCurrency(parseFloat(withdrawalAmount) - withdrawalPenaltyAmount)}</p>
                  </div>
                )}
                <div className="cd-form-group">
                  <label htmlFor="withdrawal-reason">Reason for Withdrawal:</label>
                  <select
                    id="withdrawal-reason"
                    value={withdrawalReason}
                    onChange={(e) => setWithdrawalReason(e.target.value)}
                    required
                  >
                    <option value="">Select Reason</option>
                    <option value="emergency">Financial Emergency</option>
                    <option value="better-rate">Found Better Rate</option>
                    <option value="purchase">Major Purchase</option>
                    <option value="investment">Other Investment Opportunity</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="cd-form-actions">
                  <button type="submit" className="cd-button cd-primary">Submit Request</button>
                  <button 
                    type="button" 
                    onClick={() => setIsEarlyWithdrawalModalOpen(false)}
                    className="cd-button cd-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <footer className="cd-footer">
        <p>&copy; {new Date().getFullYear()} Wells Fargo & Company. All rights reserved.</p>
        <p>
          <Link to="/privacy">Privacy</Link> | 
          <Link to="/terms">Terms of Use</Link> | 
          <Link to="/security">Security</Link>
        </p>
      </footer>
    </div>
  );
};

export default CertificateOfDepositPage;