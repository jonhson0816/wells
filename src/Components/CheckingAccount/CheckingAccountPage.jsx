import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './CheckingAccountPage.css';

// Security Verification Modal Component
const SecurityVerificationModal = ({ isOpen, onClose, onVerify, targetPath }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    setVerificationCode('');
    setError('');
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!verificationCode.trim()) {
      setError('Please enter a verification code');
      return;
    }
    
    // Check for valid codes (WFBPLC, WFBUSA, WFBAFC, WFBEUR)
    const validCodes = ['WELLS1608!', 'WELLS0923!', 'WELLS1608!', 'WELLS0816!'];
    if (validCodes.includes(verificationCode.trim().toUpperCase())) {
      onVerify(targetPath);
    } else {
      setError('Invalid verification code. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="che004 security-modal-overlay">
      <div className="che004 security-modal">
        <div className="che004 security-modal-header">
          <h3>Verification Required</h3>
          <button className="che004 close-modal" onClick={onClose}>&times;</button>
        </div>
        <div className="che004 security-modal-body">
          <p>To complete this operation, please contact your Bank to obtain your transaction approval code.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="che004 form-group">
              <label htmlFor="transaction-code">Transaction Approval Code</label>
              <input
                type="text"
                id="transaction-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="che004 verification-input"
                placeholder="Enter your code"
              />
              {error && <p className="che004 error-text">{error}</p>}
            </div>
            
            <div className="che004 modal-actions">
              <button type="button" className="che004 cancel-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="che004 verify-btn">Verify</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const CheckingAccountPage = () => {
  const { accountId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30days');
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Statement form state
  const [statementPeriod, setStatementPeriod] = useState('');
  const [statementFormat, setStatementFormat] = useState('pdf');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  
  // Security verification modal state
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);
  const [approvalCode, setApprovalCode] = useState('');
  
  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://wellsapi.onrender.com';
    return isPrimaryAccount() 
      ? `${baseUrl}/api/checking/primary${endpoint}` 
      : `${baseUrl}/checking/${accountId}${endpoint}`;
  };

  // Try to get account data from localStorage first (as stored by Dashboard)
  const getAccountDataFromLocalStorage = () => {
    try {
      const accountsData = localStorage.getItem('wellsFargoAccounts');
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        // Find the specific checking account by ID or get the first checking account if id is primary
        let matchedAccount;
        if (isPrimaryAccount()) {
          matchedAccount = accounts.find(acc => acc.type.toLowerCase().includes('checking'));
        } else {
          matchedAccount = accounts.find(acc => acc.id === accountId);
        }
        return matchedAccount;
      }
    } catch (error) {
      console.error('Error getting account data from localStorage:', error);
    }
    return null;
  };

  // Generate consistent transactions based on account balance
  const generateConsistentTransactions = (account) => {
    // Ensure we have a valid date object
    let accountOpenDate = account.openedDate ? new Date(account.openedDate) : new Date();
    
    // Make sure the date is valid
    if (isNaN(accountOpenDate.getTime())) {
      console.log('Invalid account open date, using current date');
      accountOpenDate = new Date(); // Fallback to current date if invalid
    }
    
    const balance = account.balance || 600000.00;
    
    // Create realistic transactions that add up to the current balance
    const transactions = [];
    
    // Most recent transaction - Current balance
    const currentDate = new Date();
    
    // Calculate dates for transactions (spread over the last few days)
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoDaysAgo = new Date(currentDate);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const threeDaysAgo = new Date(currentDate);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const lastWeek = new Date(currentDate);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    // Initial deposit (gross amount)
    const grossAmount = 1600000.00;
    
    // Tax breakdown - more detailed tax information
    const federalTaxRate = 0.12;
    const stateTaxRate = 0.03;
    const federalTaxAmount = grossAmount * federalTaxRate;
    const stateTaxAmount = grossAmount * stateTaxRate;
    const totalTaxAmount = federalTaxAmount + stateTaxAmount;
    const netAmount = grossAmount - totalTaxAmount;
    
    // Initial deposit transaction
    transactions.push({
      id: 'tx-init-dep',
      date: lastWeek.toISOString(),
      description: 'Initial Capital Investment',
      status: 'Completed',
      type: 'deposit',
      category: 'Deposit',
      amount: grossAmount,
      balance: grossAmount
    });
    
    // Federal tax withholding transaction
    transactions.push({
      id: 'tx-fed-tax',
      date: lastWeek.toISOString(),
      description: 'Federal Tax Withholding (12%)',
      status: 'Completed',
      type: 'fee',
      category: 'Tax',
      amount: federalTaxAmount,
      balance: grossAmount - federalTaxAmount
    });
    
    // State tax withholding transaction
    transactions.push({
      id: 'tx-state-tax',
      date: lastWeek.toISOString(),
      description: 'State Tax Withholding (3%)',
      status: 'Completed',
      type: 'fee',
      category: 'Tax',
      amount: stateTaxAmount,
      balance: netAmount
    });
    
    // Add processing fee
    const processingFee = 250.00;
    transactions.push({
      id: 'tx-proc-fee',
      date: threeDaysAgo.toISOString(),
      description: 'Account Processing Fee',
      status: 'Completed',
      type: 'fee',
      category: 'Fee',
      amount: processingFee,
      balance: netAmount - processingFee
    });
    
    // Add account verification deposit
    const verificationDeposit = 0.01;
    transactions.push({
      id: 'tx-verify',
      date: twoDaysAgo.toISOString(),
      description: 'Account Verification Deposit',
      status: 'Completed',
      type: 'deposit',
      category: 'Verification',
      amount: verificationDeposit,
      balance: netAmount - processingFee + verificationDeposit
    });
    
    // Add welcome bonus
    const welcomeBonus = 250.00;
    transactions.push({
      id: 'tx-bonus',
      date: yesterday.toISOString(),
      description: 'New Account Welcome Bonus',
      status: 'Completed',
      type: 'deposit',
      category: 'Bonus',
      amount: welcomeBonus,
      balance: netAmount - processingFee + verificationDeposit + welcomeBonus
    });
    
    // Sort by date (newest first)
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Generate mock transactions
  const generateMockTransactions = (account) => {
    if (!account) {
      return [];
    }
    
    return generateConsistentTransactions(account);
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
      
      console.log(`Fetching account data: ${isPrimaryAccount() ? 'Primary Account' : `ID: ${accountId}`}`);
      
      const apiEndpoint = getApiEndpoint();
      console.log('Using API endpoint:', apiEndpoint);
      
      try {
        const response = await axios.get(apiEndpoint, apiConfig());
        
        console.log('API Response:', response);
        
        if (response.data.success) {
          setAccount(response.data.data);
          // If transactions came with the account data, set them too
          if (response.data.data.transactions) {
            setTransactions(response.data.data.transactions);
          }
        } else {
          throw new Error(response.data.error || 'Failed to load account data');
        }
      } catch (apiError) {
        console.error('API Error, checking localStorage data:', apiError);
        
        // Try to get data from localStorage (which was populated by Dashboard)
        const localStorageAccount = getAccountDataFromLocalStorage();
        
        if (localStorageAccount) {
          console.log('Found account in localStorage:', localStorageAccount);
          setAccount(localStorageAccount);
          
          // Generate mock transactions based on the account balance
          const mockTransactions = generateMockTransactions(localStorageAccount);
          setTransactions(mockTransactions);
        } else {
          console.error('No localStorage data found, using fallback mock data');
          // Fall back to mock data with the $600,000 balance
          const mockAccount = {
            id: accountId || 'primary-account',
            type: 'Everyday Checking',
            // Use the same account number format that comes from the API/Dashboard
            accountNumber: location.state?.account?.accountNumber || 
              (accountId ? accountId : '0000000000'),
            routingNumber: '121000248',
            balance: 600000.00,
            availableBalance: 600000.00,
            openedDate: '2025-04-01T00:00:00.000Z',
            monthlyFee: 10.00,
            minBalance: 1500.00,
            overdraftProtection: true,
            interestRate: 0.01
          };
          
          setAccount({
            ...mockAccount,
            monthlyFee: '$10.00 (waived)',
            minBalance: '$1,500.00',
            overdraftProtection: 'Enabled - Linked to Savings',
            interestRate: '0.01% APY' 
          });
          
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
      console.log('With headers:', apiConfig().headers);
      
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
              disputeId: Math.floor(Math.random() * 1000000),
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

  const handleDeposit = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert('Authentication required. Please log in.');
        handleLoginRedirect();
        return;
      }
      
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive amount.');
        return;
      }
  
      if (!approvalCode) {
        alert('Transaction Approval Code is required to complete this deposit.');
        return;
      }
      
      const apiEndpoint = getApiEndpoint('/deposit');
      
      try {
        const response = await axios.post(
          apiEndpoint,
          {
            amount: amount,
            description: depositDescription || 'Deposit',
            approvalCode: approvalCode
          },
          apiConfig()
        );
        
        if (response.data.success) {
          // Update the account balance and transactions
          const newBalance = response.data.data.newBalance;
          setAccount({
            ...account,
            balance: newBalance,
            availableBalance: newBalance
          });
          
          // Add the new transaction to the transactions list
          setTransactions([response.data.data.transaction, ...transactions]);
          
          // Update the account in localStorage for Dashboard to access
          updateAccountInLocalStorage(account.id, newBalance);
          
          alert(`Successfully deposited $${amount}`);
          setIsDepositModalOpen(false);
          setDepositAmount('');
          setDepositDescription('');
          setApprovalCode('');
        } else {
          throw new Error(response.data.error || 'Failed to process deposit');
        }
      } catch (apiError) {
        console.log('API error, using mock response:', apiError);
        
        // Calculate new balance
        const newBalance = account.balance + parseFloat(depositAmount);
        
        // Create a mock transaction
        const newTransaction = {
          id: 'tx' + Math.floor(Math.random() * 10000),
          date: new Date().toISOString(),
          description: depositDescription || 'Deposit',
          status: 'Completed',
          type: 'deposit',
          amount: parseFloat(depositAmount),
          balance: newBalance
        };
        
        // Update the account balance in state
        setAccount({
          ...account,
          balance: newBalance,
          availableBalance: newBalance
        });
        
        // Add the new transaction to the transactions list
        setTransactions([newTransaction, ...transactions]);
        
        // Update the account in localStorage for Dashboard to access
        updateAccountInLocalStorage(account.id, newBalance);
        
        alert(`Successfully deposited $${depositAmount}`);
        setIsDepositModalOpen(false);
        setDepositAmount('');
        setDepositDescription('');
        setApprovalCode('');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Your session has expired. Please log in again.');
        handleLoginRedirect();
      } else {
        alert(err.response?.data?.error || 'Error processing deposit');
      }
      console.error('Error depositing money:', err);
    }
  };
  
  // function to update the account in localStorage
  const updateAccountInLocalStorage = (accountId, newBalance) => {
    try {
      // Get current accounts from localStorage
      const storedAccounts = localStorage.getItem('wellsFargoAccounts');
      if (storedAccounts) {
        const accounts = JSON.parse(storedAccounts);
        
        // Find and update the specific account
        const updatedAccounts = accounts.map(acc => {
          if (acc.id === accountId) {
            return {
              ...acc,
              balance: newBalance,
              availableBalance: newBalance
            };
          }
          return acc;
        });
        
        // Store the updated accounts back to localStorage
        localStorage.setItem('wellsFargoAccounts', JSON.stringify(updatedAccounts));
        console.log('Account updated in localStorage with new balance:', newBalance);
      }
    } catch (error) {
      console.error('Error updating account in localStorage:', error);
    }
  };

  // Handle login redirection
  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: location.pathname } });
  };

  // Handler for navigation that requires verification
  const handleSecureNavigation = (path) => {
    setPendingPath(path);
    setSecurityModalOpen(true);
  };

  // Verification successful handler
  const handleVerificationSuccess = (path) => {
    setSecurityModalOpen(false);
    navigate(path);
  };

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
    
    // For all actions, we'll open the security modal
    switch (action) {
      case 'transfer':
        handleSecureNavigation('/transfer-money');
        break;
      case 'pay':
        handleSecureNavigation('/pay-bills');
        break;
      case 'deposit':
        // Open deposit modal directly instead of navigating
        setIsDepositModalOpen(true);
        break;
      case 'withdraw':
        handleSecureNavigation('/withdraw');
        break;
      case 'statement':
        handleSecureNavigation('/account-statements');
        break;
      case 'checks':
        handleSecureNavigation('/order-checks');
        break;
      case 'autopay':
        handleSecureNavigation('/setup-autopay');
        break;
      case 'alerts':
        handleSecureNavigation('/account-alerts');
        break;
      case 'dispute':
        handleSecureNavigation('/dispute-transaction');
        break;
      default:
        console.log(`Action not implemented: ${action}`);
        break;
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  // Function to format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="che004-loading-container">
        <div className="che004-loader"></div>
        <p>Loading checking account information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="che004-error-container">
        <h2>Error Loading Account</h2>
        <p>{error}</p>
        <button onClick={goToDashboard} className="che004-button che004-primary">
          Return to Dashboard
        </button>
        {error.includes('Authentication') && (
          <button onClick={handleLoginRedirect} className="che004-button che004-secondary">
            Log In
          </button>
        )}
      </div>
    );
  }

  if (!account) {
    return (
      <div className="che004-error-container">
        <h2>Account Not Found</h2>
        <p>The requested account could not be found.</p>
        <button onClick={goToDashboard} className="che004-button che004-primary">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="che004-checking-account-page">
      <header className="che004-dashboard-header">
        <div className="che004-header-content">
          <img 
            src="/Images/wells fargo.jpeg" 
            alt="Wells Fargo Logo" 
            className="che004-logo" 
            onClick={goToDashboard}
            style={{ cursor: 'pointer' }}
          />
          <div className="che004-back-button" onClick={goToDashboard}>
            <span className="che004-back-arrow">&#8592;</span> Back to Dashboard
          </div>
        </div>
      </header>

      <main className="che004-account-content">
        <section className="che004-account-overview">
          <div className="che004-account-header">
            <h1>{account.type}</h1>
            <div className="che004-account-number">
              Account #: {formatAccountNumber(account.accountNumber)}
            </div>
          </div>
          
          <div className="che004-balance-container">
            <div className="che004-balance-box">
              <span className="che004-balance-label">Current Balance</span>
              <h2 className="che004-balance-amount">{formatCurrency(account.balance)}</h2>
            </div>
            <div className="che004-balance-box">
              <span className="che004-balance-label">Available Balance</span>
              <h2 className="che004-balance-amount">{formatCurrency(account.availableBalance || account.balance)}</h2>
            </div>
          </div>
          
          <div className="che004-account-details">
            <div className="che004-detail-item">
              <span className="che004-detail-label">Routing Number:</span>
              <span className="che004-detail-value">{account.routingNumber || '121000248'}</span>
            </div>
            <div className="che004-detail-item">
              <span className="che004-detail-label">Monthly Fee:</span>
              <span className="che004-detail-value">{account.monthlyFee}</span>
            </div>
            <div className="che004-detail-item">
              <span className="che004-detail-label">Minimum Balance Required:</span>
              <span className="che004-detail-value">{account.minBalance}</span>
            </div>
            <div className="che004-detail-item">
              <span className="che004-detail-label">Overdraft Protection:</span>
              <span className="che004-detail-value">{account.overdraftProtection}</span>
            </div>
            <div className="che004-detail-item">
              <span className="che004-detail-label">Interest Rate:</span>
              <span className="che004-detail-value">{account.interestRate}</span>
            </div>
          </div>
        </section>
        
        <section className="che004-quick-actions">
          <h2>Quick Actions</h2>
          <div className="che004-action-buttons">
            <button 
              className="che004-action-btn che004-transfer" 
              onClick={() => handleQuickAction('transfer')}
            >
              Transfer Money
            </button>
            <button 
              className="che004-action-btn che004-pay" 
              onClick={() => handleQuickAction('pay')}
            >
              Pay Bills
            </button>
            <button 
              className="che004-action-btn che004-deposit" 
              onClick={() => handleQuickAction('deposit')}
            >
              Deposit Check
            </button>
            <button 
              className="che004-action-btn che004-withdraw" 
              onClick={() => handleQuickAction('withdraw')}
            >
              Withdraw Money
            </button>
            <button 
              className="che004-action-btn che004-statement" 
              onClick={() => setIsStatementModalOpen(true)}
            >
              Get Statements
            </button>
            <button 
              className="che004-action-btn che004-checks" 
              onClick={() => handleQuickAction('checks')}
            >
              Order Checks
            </button>
            <button 
              className="che004-action-btn che004-deposit" 
              onClick={() => handleQuickAction('deposit')}
            >
              Deposit Money
            </button>
          </div>
        </section>
        
        <section className="che004-transactions-section">
          <div className="che004-transactions-header">
            <h2>Recent Transactions</h2>
            <div className="che004-transaction-filters">
              <div className="che004-filter-group">
                <label htmlFor="transaction-filter">Filter:</label>
                <select 
                  id="transaction-filter" 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  className="che004-filter-select"
                >
                  <option value="all">All Transactions</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdrawal">Withdrawals</option>
                  <option value="payment">Payments</option>
                  <option value="transfer">Transfers</option>
                  <option value="fee">Fees</option>
                </select>
              </div>
              
              <div className="che004-filter-group">
                <label htmlFor="date-range-filter">Date Range:</label>
                <select 
                  id="date-range-filter" 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  className="che004-filter-select"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="year">Last Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="che004-transactions-table-container">
            <table className="che004-transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className={`che004-transaction-row che004-${tx.type}`}>
                      <td className="che004-date">{formatDate(tx.date)}</td>
                      <td className="che004-description">{tx.description}</td>
                      <td className="che004-status">{tx.status}</td>
                      <td className={`che004-amount ${tx.type === 'deposit' ? 'che004-deposit' : tx.type === 'fee' ? 'che004-fee' : 'che004-withdrawal'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                      </td>
                      <td className="che004-balance">{formatCurrency(tx.balance)}</td>
                      <td className="che004-actions">
                        <button 
                          className="che004-action-btn che004-small"
                          onClick={() => handleQuickAction('dispute')}
                        >
                          Dispute
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="che004-no-transactions">
                      No transactions found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        
        <section className="che004-account-management">
          <h2>Account Management</h2>
          <div className="che004-management-options">
            <div 
              className="che004-management-option" 
              onClick={() => handleSecureNavigation('/account-settings')}
            >
              <div className="che004-option-icon">⚙️</div>
              <div className="che004-option-content">
                <h3>Account Settings</h3>
                <p>Update your preferences, alerts and linked accounts</p>
              </div>
            </div>
            <div 
              className="che004-management-option" 
              onClick={() => handleSecureNavigation('/setup-autopay')}
            >
              <div className="che004-option-icon">🔄</div>
              <div className="che004-option-content">
                <h3>Automatic Payments</h3>
                <p>Set up recurring payments and transfers</p>
              </div>
            </div>
            <div 
              className="che004-management-option" 
              onClick={() => handleSecureNavigation('/account-alerts')}
            >
              <div className="che004-option-icon">🔔</div>
              <div className="che004-option-content">
                <h3>Account Alerts</h3>
                <p>Manage balance and transaction notifications</p>
              </div>
            </div>
            <div 
              className="che004-management-option" 
              onClick={() => handleQuickAction('statement')}
            >
              <div className="che004-option-icon">📄</div>
              <div className="che004-option-content">
                <h3>Statements & Documents</h3>
                <p>View and download your account statements</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Statement Modal */}
      {isStatementModalOpen && (
        <div className="che004 modal-overlay">
          <div className="che004 modal-content">
            <div className="che004 modal-header">
              <h3>Request Account Statement</h3>
              <button 
                className="che004 close-modal" 
                onClick={() => setIsStatementModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="che004 modal-body">
              <form onSubmit={(e) => { e.preventDefault(); downloadStatement(); }}>
                <div className="che004 form-group">
                  <label htmlFor="statement-period">Statement Period</label>
                  <select 
                    id="statement-period" 
                    value={statementPeriod} 
                    onChange={(e) => setStatementPeriod(e.target.value)}
                    className="che004 form-select"
                    required
                  >
                    <option value="">Select a period</option>
                    <option value="current">Current Month</option>
                    <option value="previous">Previous Month</option>
                    <option value="last3">Last 3 Months</option>
                    <option value="last6">Last 6 Months</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>
                
                <div className="che004 form-group">
                  <label htmlFor="statement-format">Format</label>
                  <div className="che004 radio-options">
                    <label className="che004 radio-label">
                      <input 
                        type="radio" 
                        name="format" 
                        value="pdf" 
                        checked={statementFormat === 'pdf'} 
                        onChange={() => setStatementFormat('pdf')} 
                      />
                      PDF
                    </label>
                    <label className="che004 radio-label">
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
                
                <div className="che004 modal-actions">
                  <button 
                    type="button" 
                    className="che004 button-secondary" 
                    onClick={() => setIsStatementModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="che004 button-primary"
                    disabled={!statementPeriod}
                  >
                    Download Statement
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div className="che004 modal-overlay">
          <div className="che004 modal-content">
            <div className="che004 modal-header">
              <h3>Deposit Money</h3>
              <button 
                className="che004 close-modal" 
                onClick={() => setIsDepositModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="che004 modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleDeposit(); }}>
                <div className="che004 form-group">
                  <label htmlFor="deposit-amount">Amount</label>
                  <div className="che004 input-with-icon">
                    <span className="che004 currency-symbol">$</span>
                    <input 
                      type="number" 
                      id="deposit-amount" 
                      value={depositAmount} 
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="che004 form-input"
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div className="che004 form-group">
                  <label htmlFor="deposit-description">Description (Optional)</label>
                  <input 
                    type="text" 
                    id="deposit-description" 
                    value={depositDescription} 
                    onChange={(e) => setDepositDescription(e.target.value)}
                    className="che004 form-input"
                    placeholder="e.g., Direct Deposit"
                  />
                </div>
                
                <div className="che004 form-group">
                  <label htmlFor="approval-code">Transaction Approval Code<span className="required">*</span></label>
                  <input 
                    type="text" 
                    id="approval-code" 
                    value={approvalCode} 
                    onChange={(e) => setApprovalCode(e.target.value)}
                    className="che004 form-input"
                    placeholder="Enter bank approval code"
                    required
                  />
                  <small className="che004 helper-text">Contact your bank to obtain your transaction approval code.</small>
                </div>
                
                <div className="che004 modal-actions">
                  <button 
                    type="button" 
                    className="che004 button-secondary" 
                    onClick={() => setIsDepositModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="che004 button-primary"
                    disabled={!depositAmount || parseFloat(depositAmount) <= 0 || !approvalCode}
                  >
                    Complete Deposit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Security Verification Modal */}
      <SecurityVerificationModal 
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        onVerify={handleVerificationSuccess}
        targetPath={pendingPath}
      />
      
      <footer className="che004-app-footer">
        <div className="che004-footer-content">
          <div className="che004-footer-links">
            <Link to="/terms">Terms & Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/security">Security Center</Link>
            <Link to="/help">Help & Support</Link>
          </div>
          <div className="che004-copyright">
            © {new Date().getFullYear()} Wells Fargo & Company. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CheckingAccountPage;