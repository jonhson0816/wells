import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './SavingsAccountPage.css';

const SavingsAccountPage = () => {
  const { accountId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30days');
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Statement form state
  const [statementPeriod, setStatementPeriod] = useState('');
  const [statementFormat, setStatementFormat] = useState('pdf');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  
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
    
    // If this is the primary account, use the primary endpoint
    if (isPrimaryAccount()) {
      return `${baseUrl}/savings/primary${endpoint}`;
    }
    
    // For accounts fetched from real DB, use the MongoDB _id if available
    if (account && account._id) {
      return `${baseUrl}/savings/${account._id}${endpoint}`;
    }
    
    // Otherwise use the accountId from params directly - let the backend handle any prefixes
    return `${baseUrl}/savings/${accountId}${endpoint}`;
  };

  // Try to get account data from localStorage first (as stored by Dashboard)
  const getAccountDataFromLocalStorage = () => {
    try {
      const accountsData = localStorage.getItem('wellsFargoAccounts');
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        // Find the specific savings account by ID or get the first savings account if id is primary
        let matchedAccount;
        if (isPrimaryAccount()) {
          matchedAccount = accounts.find(acc => acc.type.toLowerCase().includes('savings'));
        } else {
          matchedAccount = accounts.find(acc => acc.id === accountId);
        }
        
        // Ensure we only return a savings account
        if (matchedAccount && matchedAccount.type && matchedAccount.type.toLowerCase().includes('savings')) {
          return matchedAccount;
        }
      }
    } catch (error) {
      console.error('Error getting account data from localStorage:', error);
    }
    return null;
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
      
      // First, try to get account from location state (passed from Dashboard)
      if (location.state && location.state.account) {
        const stateAccount = location.state.account;
        // Verify this is actually a savings account
        if (stateAccount.type && stateAccount.type.toLowerCase().includes('savings')) {
          console.log('Using account data from location state:', stateAccount);
          setAccount(stateAccount);
          // Fetch transactions for this account
          fetchTransactions();
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
          // Verify this is a savings account
          if (accountData.type && accountData.type.toLowerCase().includes('savings')) {
            setAccount(accountData);
            // If transactions came with the account data, set them too
            if (accountData.transactions) {
              setTransactions(accountData.transactions);
            } else {
              // Fetch transactions separately if not included in response
              fetchTransactions();
            }
          } else {
            throw new Error('Retrieved account is not a savings account');
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
          fetchTransactions();
        } else {
          throw new Error('No account data found');
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

  // Fetch transactions with filters
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
  
      // Use the base URL from your environment
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://wellsapi.onrender.com';
      
      // Determine the correct endpoint to use

      let effectiveAccountId;

      if (isPrimaryAccount()) {
        console.log('Using primary account endpoint');
        effectiveAccountId = 'primary';
      } else if (account && account.id) {
        console.log(`Using account.id directly: ${account.id}`);
        effectiveAccountId = account.id;
      } else if (accountId) {
        console.log(`Using accountId from params: ${accountId}`);
        effectiveAccountId = accountId;
      } else {
        effectiveAccountId = 'primary';
        console.log('Defaulting to primary account');
      }

      // Remove the duplicate /api in the URL path
      const apiEndpoint = `${baseUrl}/savings/${effectiveAccountId}/transactions`;
      console.log(`Fetching transactions from: ${apiEndpoint}`);
            
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
        console.error('API Error fetching transactions:', apiError);
        
        // If account data exists but no transactions found, set empty array
        if (apiError.response && apiError.response.status === 404 && account) {
          console.log('Account exists but no transactions found, setting empty array');
          setTransactions([]);
          return;
        }
        
        // Fallback to local storage
        const localStorageAccount = getAccountDataFromLocalStorage();
        if (localStorageAccount && localStorageAccount.transactions) {
          console.log('Using transactions from localStorage');
          setTransactions(localStorageAccount.transactions);
          return;
        }
        
        throw apiError; // Re-throw to be caught by outer catch block
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err.response && err.response.status === 404) {
        // Create mock transactions if in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('Creating mock transaction data for development');
          const mockTransactions = createMockTransactions();
          setTransactions(mockTransactions);
          setError(null);
        } else {
          setError('Account not found or no transactions available.');
        }
      } else {
        setError(err.response?.data?.error || err.message || 'Error fetching transactions');
      }
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a helper function to create mock transactions (for development)
  const createMockTransactions = () => {
    const now = new Date();
    const mockTransactions = [];
    const balance = account ? account.balance : 5000;
    
    // Create 5 mock transactions
    for (let i = 0; i < 5; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i * 3); // Space them out by 3 days
      
      const transactionTypes = ['deposit', 'withdrawal', 'interest', 'fee'];
      const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      
      let amount;
      if (type === 'deposit') amount = Math.random() * 1000 + 100;
      else if (type === 'withdrawal') amount = Math.random() * 500 + 50;
      else if (type === 'interest') amount = Math.random() * 10 + 1;
      else amount = Math.random() * 5 + 1; // fee
      
      amount = Math.round(amount * 100) / 100; // Round to 2 decimal places
      
      mockTransactions.push({
        id: `mock-${i}-${Date.now()}`,
        date: date.toISOString(),
        description: type === 'deposit' ? 'Sample Deposit' : 
                   type === 'withdrawal' ? 'Sample Withdrawal' :
                   type === 'interest' ? 'Monthly Interest' : 'Monthly Fee',
        type: type,
        status: 'Completed',
        amount: amount,
        balance: type === 'deposit' || type === 'interest' ? 
                 balance + amount : 
                 balance - amount
      });
    }
    
    return mockTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Download statement
const downloadStatement = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      alert('Authentication required. Please log in.');
      return;
    }
    
    // Get the API endpoint using existing function
    let apiEndpoint = getApiEndpoint('/statement');
    
    console.log(`Attempting to download statement using endpoint: ${apiEndpoint}`);
    
    const response = await axios.post(
      apiEndpoint,
      {
        period: statementPeriod,
        format: statementFormat
      },
      apiConfig()
    );
    
    if (response.data.success) {
      alert(`Your statement is being prepared for download. It will be available soon.`);
      setIsStatementModalOpen(false);
    } else {
      throw new Error(response.data.error || 'Failed to generate statement');
    }
  } catch (err) {
    console.error('Error downloading statement (details):', err);
    
    if (err.response && err.response.status === 401) {
      alert('Your session has expired. Please log in again.');
    } else if (err.response && err.response.status === 404) {
      console.error('Account not found. Details:', err.response.data);
      alert(`Could not find the account. Please try again or select a different account.`);
    } else {
      alert(err.response?.data?.error || 'Error generating statement');
    }
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
      
      // Use the correct account identifier
      let effectiveAccountId;
      
      if (isPrimaryAccount()) {
        effectiveAccountId = 'primary';
      } else if (account && account._id) {
        // Use MongoDB's _id directly if available
        effectiveAccountId = account._id;
      } else if (accountId) {
        // Remove any prefix if present
        effectiveAccountId = accountId.replace(/^acc-/, '');
      } else {
        effectiveAccountId = 'primary';
      }
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://wellsapi.onrender.com';
      const apiEndpoint = `${baseUrl}/savings/${effectiveAccountId}/deposit`;
      
      console.log(`Making deposit to endpoint: ${apiEndpoint}`);
      
      const response = await axios.post(
        apiEndpoint,
        {
          amount: amount,
          description: depositDescription || 'Deposit'
        },
        apiConfig()
      );
      
      if (response.data.success) {
        // Update the account balance and transactions
        setAccount({
          ...account,
          balance: response.data.data.newBalance,
          availableBalance: response.data.data.newBalance
        });
        
        // Add the new transaction to the transactions list
        setTransactions([response.data.data.transaction, ...transactions]);
        
        // Update the account in localStorage to maintain consistency across pages
        updateAccountInLocalStorage(response.data.data.newBalance);
        
        alert(`Successfully deposited $${amount}`);
        setIsDepositModalOpen(false);
        setDepositAmount('');
        setDepositDescription('');
      } else {
        throw new Error(response.data.error || 'Failed to process deposit');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Your session has expired. Please log in again.');
        handleLoginRedirect();
      } else {
        const errorMessage = err.response?.data?.error || 'Error processing deposit';
        console.error('Deposit error details:', err);
        alert(errorMessage);
      }
    }
  };

  // Helper function to update account balance in localStorage
  const updateAccountInLocalStorage = (newBalance) => {
    try {
      const accountsData = localStorage.getItem('wellsFargoAccounts');
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        const updatedAccounts = accounts.map(acc => {
          if ((acc.id === accountId) || 
              (isPrimaryAccount() && acc.type.toLowerCase().includes('savings'))) {
            return { ...acc, balance: newBalance, availableBalance: newBalance };
          }
          return acc;
        });
        
        localStorage.setItem('wellsFargoAccounts', JSON.stringify(updatedAccounts));
        console.log('Updated account balance in localStorage');
      }
    } catch (error) {
      console.error('Error updating account in localStorage:', error);
    }
  };

  // Handle login redirection
  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: location.pathname } });
  };

  // Initial data fetch
  useEffect(() => {
    fetchAccountData();
  }, [accountId]); // Re-fetch when accountId changes

  // Fetch transactions when filters change and we have account data
  useEffect(() => {
    if (account && (filter !== 'all' || dateRange !== '30days')) {
      fetchTransactions();
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
      case 'transfer':
        navigate('/transfer-money', { state: { fromAccount: account } });
        break;
      case 'pay':
        navigate('/pay-bills', { state: { fromAccount: account } });
        break;
      case 'deposit':
        setIsDepositModalOpen(true);
        break;
      case 'withdraw':
        navigate('/withdraw', { state: { fromAccount: account } });
        break;
      case 'statement':
        setIsStatementModalOpen(true);
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
      <div className="sav004-loading-container">
        <div className="sav004-loader"></div>
        <p>Loading savings account information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sav004-error-container">
        <h2>Error Loading Account</h2>
        <p>{error}</p>
        <button onClick={goToDashboard} className="sav004-button sav004-primary">
          Return to Dashboard
        </button>
        {error.includes('Authentication') && (
          <button onClick={handleLoginRedirect} className="sav004-button sav004-secondary">
            Log In
          </button>
        )}
      </div>
    );
  }

  if (!account) {
    return (
      <div className="sav004-error-container">
        <h2>Account Not Found</h2>
        <p>The requested savings account could not be found.</p>
        <button onClick={goToDashboard} className="sav004-button sav004-primary">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="sav004-container">
      <header className="sav004-account-header">
        <div className="sav004-return-nav">
          <button onClick={goToDashboard} className="sav004-back-button">
            ← Back to Dashboard
          </button>
        </div>
        <div className="sav004-account-title">
          <h1>Savings Account</h1>
          <p className="sav004-account-number">Account #: {formatAccountNumber(account.accountNumber)}</p>
        </div>
      </header>

      <div className="sav004-account-overview">
        <div className="sav004-balance-container">
          <div className="sav004-balance-card">
            <h3>Available Balance</h3>
            <p className="sav004-amount">{formatCurrency(account.availableBalance || account.balance)}</p>
          </div>
          <div className="sav004-balance-card">
            <h3>Current Balance</h3>
            <p className="sav004-amount">{formatCurrency(account.balance)}</p>
          </div>
          <div className="sav004-balance-card">
            <h3>Interest Rate</h3>
            <p className="sav004-amount">{account.interestRate || '0.85% APY'}</p>
          </div>
        </div>

        <div className="sav004-quick-actions">
          <h3>Quick Actions</h3>
          <div className="sav004-action-buttons">
            <button onClick={() => handleQuickAction('deposit')} className="sav004-action-button">
              <span className="sav004-action-icon">💰</span>
              <span>Deposit</span>
            </button>
            <button onClick={() => handleQuickAction('withdraw')} className="sav004-action-button">
              <span className="sav004-action-icon">💸</span>
              <span>Withdraw</span>
            </button>
            <button onClick={() => handleQuickAction('transfer')} className="sav004-action-button">
              <span className="sav004-action-icon">↔️</span>
              <span>Transfer</span>
            </button>
            <button onClick={() => handleQuickAction('statement')} className="sav004-action-button">
              <span className="sav004-action-icon">📄</span>
              <span>Statement</span>
            </button>
            <button onClick={() => handleQuickAction('alerts')} className="sav004-action-button">
              <span className="sav004-action-icon">🔔</span>
              <span>Alerts</span>
            </button>
          </div>
        </div>
      </div>

      <div className="sav004-account-details">
        <div className="sav004-account-info">
          <h3>Account Information</h3>
          <div className="sav004-info-grid">
            <div className="sav004-info-item">
              <span className="sav004-info-label">Account Type:</span>
              <span className="sav004-info-value">{account.type || "Savings Account"}</span>
            </div>
            <div className="sav004-info-item">
              <span className="sav004-info-label">Account Number:</span>
              <span className="sav004-info-value">{formatAccountNumber(account.accountNumber)}</span>
            </div>
            <div className="sav004-info-item">
              <span className="sav004-info-label">Routing Number:</span>
              <span className="sav004-info-value">{account.routingNumber || "121000248"}</span>
            </div>
            <div className="sav004-info-item">
              <span className="sav004-info-label">Interest Rate:</span>
              <span className="sav004-info-value">{account.interestRate || "0.85% APY"}</span>
            </div>
            <div className="sav004-info-item">
              <span className="sav004-info-label">Interest Accrued:</span>
              <span className="sav004-info-value">{account.interestAccrued || formatCurrency(account.balance * 0.0085 / 12)}</span>
            </div>
            <div className="sav004-info-item">
              <span className="sav004-info-label">Interest YTD:</span>
              <span className="sav004-info-value">{account.interestYTD || formatCurrency(account.balance * 0.0085 * 3 / 12)}</span>
            </div>
            <div className="sav004-info-item">
              <span className="sav004-info-label">Monthly Fee:</span>
              <span className="sav004-info-value">{account.monthlyFee || "$5.00 (waived with minimum balance)"}</span>
            </div>
            <div className="sav004-info-item">
              <span className="sav004-info-label">Minimum Balance:</span>
              <span className="sav004-info-value">{account.minBalance || "$300.00"}</span>
            </div>
            <div className="sav004-info-item">
              <span className="sav004-info-label">Withdrawals This Month:</span>
              <span className="sav004-info-value">{account.withdrawalsThisMonth || "0"} of 6</span>
            </div>
            <div className="sav004-info-item">
              <span className="sav004-info-label">Opened Date:</span>
              <span className="sav004-info-value">
                {account.openedDate ? new Date(account.openedDate).toLocaleDateString() : "04/01/2025"}
              </span>
            </div>
          </div>
        </div>

        <div className="sav004-transactions">
          <div className="sav004-transactions-header">
            <h3>Recent Transactions</h3>
            <div className="sav004-filters">
              <div className="sav004-filter-group">
                <label htmlFor="transaction-filter">Filter:</label>
                <select 
                  id="transaction-filter" 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Transactions</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdrawal">Withdrawals</option>
                  <option value="interest">Interest</option>
                  <option value="fee">Fees</option>
                </select>
              </div>
              <div className="sav004-filter-group">
                <label htmlFor="date-range-filter">Date Range:</label>
                <select 
                  id="date-range-filter" 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="30days">Last 30 Days</option>
                  <option value="60days">Last 60 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="year">Current Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="sav004-transactions-list">
            {transactions.length === 0 ? (
              <p className="sav004-no-transactions">No transactions found for the selected filters.</p>
            ) : (
              <table className="sav004-transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id || `${transaction.date}-${transaction.amount}-${transaction.type}`}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td>{transaction.description}</td>
                    <td className="sav004-transaction-type">{transaction.type}</td>
                    <td>{transaction.status}</td>
                    <td className={`sav004-amount ${transaction.type === 'deposit' || transaction.type === 'interest' ? 'sav004-positive' : 'sav004-negative'}`}>
                      {transaction.type === 'deposit' || transaction.type === 'interest' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td>{formatCurrency(transaction.balance)}</td>
                  </tr>
                ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Statement Modal */}
      {isStatementModalOpen && (
        <div className="sav004-modal-backdrop">
          <div className="sav004-modal">
            <div className="sav004-modal-header">
              <h3>Download Statement</h3>
              <button className="sav004-close-button" onClick={() => setIsStatementModalOpen(false)}>×</button>
            </div>
            <div className="sav004-modal-body">
              <div className="sav004-form-group">
                <label htmlFor="statement-period">Statement Period:</label>
                <select 
                  id="statement-period" 
                  value={statementPeriod}
                  onChange={(e) => setStatementPeriod(e.target.value)}
                >
                  <option value="">Select Period</option>
                  <option value="current">Current Month</option>
                  <option value="previous">Previous Month</option>
                  <option value="last3">Last 3 Months</option>
                  <option value="ytd">Year to Date</option>
                </select>
              </div>
              <div className="sav004-form-group">
                <label htmlFor="statement-format">Format:</label>
                <select 
                  id="statement-format" 
                  value={statementFormat}
                  onChange={(e) => setStatementFormat(e.target.value)}
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>
            <div className="sav004-modal-footer">
              <button 
                className="sav004-button sav004-secondary"
                onClick={() => setIsStatementModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="sav004-button sav004-primary"
                onClick={downloadStatement}
                disabled={!statementPeriod}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div className="sav004-modal-backdrop">
          <div className="sav004-modal">
            <div className="sav004-modal-header">
              <h3>Make a Deposit</h3>
              <button className="sav004-close-button" onClick={() => setIsDepositModalOpen(false)}>×</button>
            </div>
            <div className="sav004-modal-body">
              <div className="sav004-form-group">
                <label htmlFor="deposit-amount">Amount:</label>
                <input 
                  type="number" 
                  id="deposit-amount" 
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div className="sav004-form-group">
                <label htmlFor="deposit-description">Description (Optional):</label>
                <input 
                  type="text" 
                  id="deposit-description" 
                  value={depositDescription}
                  onChange={(e) => setDepositDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
            </div>
            <div className="sav004-modal-footer">
              <button 
                className="sav004-button sav004-secondary"
                onClick={() => setIsDepositModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="sav004-button sav004-primary"
                onClick={handleDeposit}
                disabled={!depositAmount || isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) <= 0}
              >
                Deposit
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="cre014-account-footer">
        <p>
          <Link to="/financial-tools">Financial Tools</Link> | 
          <Link to="/support">Contact Support</Link> | 
          <Link to="/faqs">FAQs</Link>
        </p>
        <p className="cre014-disclaimer">
          For security reasons, please log out when you are done accessing your accounts.
          Always monitor your account for suspicious activity and report any unauthorized transactions.
        </p>
      </div>
    </div>
  );
};

export default SavingsAccountPage;