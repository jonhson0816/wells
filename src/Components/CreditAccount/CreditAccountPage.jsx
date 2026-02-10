import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './CreditAccountPage.css';

const CreditAccountPage = () => {
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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  
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
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://wellsapi-1.onrender.com';
    return isPrimaryAccount() 
      ? `${baseUrl}/api/credit-accounts/primary${endpoint}` 
      : `${baseUrl}/api/credit-accounts/${accountId}${endpoint}`;
  };

  // Modified function to get account data from localStorage 
  const getAccountDataFromLocalStorage = () => {
    try {
      const accountsData = localStorage.getItem('wellsFargoAccounts');
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        // Find the specific credit account by ID or get the first credit account if id is primary
        let matchedAccount;
        if (isPrimaryAccount()) {
          matchedAccount = accounts.find(acc => acc.type.toLowerCase().includes('credit'));
        } else {
          matchedAccount = accounts.find(acc => acc.id === accountId && acc.type.toLowerCase().includes('credit'));
          
          // If we didn't find a credit account with the ID, check if the ID exists with any account type
          if (!matchedAccount) {
            const anyAccount = accounts.find(acc => acc.id === accountId);
            if (anyAccount) {
              console.log('Found account but not a credit account:', anyAccount.type);
            }
          }
        }
        
        if (matchedAccount) {
          console.log('Found credit account in localStorage:', matchedAccount);
        } else {
          console.log('No credit account found in localStorage with ID:', accountId);
          console.log('Available accounts:', accounts.map(a => ({ id: a.id, type: a.type })));
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
    if (!account) return [];
    
    // Use the account's openedDate instead of today
    const accountOpenDate = new Date(account.openedDate || account.openDate || new Date());
    
    // Get credit-specific balance info
    const creditLimit = account.creditLimit || 5000;
    const balance = account.balance || -500; // Credit accounts typically have negative balances when you owe money
    
    // Create realistic transactions that add up to the current balance
    const transactions = [];
    
    // Credit account transactions are different from checking
    transactions.push({
      id: 'tx1',
      date: new Date().toISOString(),
      description: 'Amazon.com Purchase',
      status: 'Completed',
      type: 'purchase',
      amount: -45.67, // Negative for credit card purchases
      balance: balance
    });
    
    transactions.push({
      id: 'tx2',
      date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
      description: 'Nike Online Store',
      status: 'Completed',
      type: 'purchase',
      amount: -129.50,
      balance: balance + 45.67
    });
    
    transactions.push({
      id: 'tx3',
      date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
      description: 'Payment - Thank You',
      status: 'Completed',
      type: 'payment',
      amount: 350.00,
      balance: balance + 45.67 + 129.50
    });
    
    transactions.push({
      id: 'tx4',
      date: new Date(new Date().setDate(new Date().getDate() - 18)).toISOString(),
      description: 'Walmart',
      status: 'Completed',
      type: 'purchase',
      amount: -87.32,
      balance: balance + 45.67 + 129.50 - 350.00
    });
    
    transactions.push({
      id: 'tx5',
      date: new Date(new Date().setDate(new Date().getDate() - 22)).toISOString(),
      description: 'Shell Gas Station',
      status: 'Completed',
      type: 'purchase',
      amount: -43.19,
      balance: balance + 45.67 + 129.50 - 350.00 + 87.32
    });
    
    // Sort by date (newest first)
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Fetch account data with fallback to localStorage data, then mock data on error
  const fetchAccountData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check for authentication
      const token = getAuthToken();
      if (!token) {
        setError('Authentication required. Please log in.');
        setIsLoading(false);
        return;
      }
      
      console.log(`Fetching credit account data: ${isPrimaryAccount() ? 'Primary Account' : `ID: ${accountId}`}`);
      
      const apiEndpoint = getApiEndpoint();
      console.log('Using API endpoint:', apiEndpoint);
      
      const response = await axios.get(apiEndpoint, apiConfig());
      
      if (response.data.success) {
        setAccount(response.data.data);
        // If transactions came with the account data, set them
        if (response.data.data.transactions) {
          setTransactions(response.data.data.transactions);
        } else {
          // Otherwise fetch transactions separately
          fetchTransactions();
        }
      } else {
        throw new Error(response.data.error || 'Failed to load account data');
      }
    } catch (err) {
      console.error('Error fetching account:', err);
      
      if (err.message && err.message.includes('Network Error')) {
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

    const apiEndpoint = getApiEndpoint('/transactions');
    console.log('Fetching transactions from:', apiEndpoint);
    
    const response = await axios.get(
      `${apiEndpoint}?${queryParams.toString()}`,
      apiConfig()
    );
    
    if (response.data.success) {
      setTransactions(response.data.data);
    } else {
      throw new Error(response.data.error || 'Failed to load transactions');
    }
  } catch (err) {
    console.error('Error fetching transactions:', err);
    
    if (err.response && err.response.status === 401) {
      setError('Your session has expired. Please log in again.');
    } else {
      setError(err.response?.data?.error || 'Error fetching transactions');
    }
  } finally {
    setIsLoading(false);
  }
};

  // Generate statement
const generateStatement = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      alert('Authentication required. Please log in.');
      return;
    }
    
    if (!statementPeriod) {
      alert('Please select a statement period.');
      return;
    }
    
    const apiEndpoint = getApiEndpoint('/statement');
    
    const response = await axios.post(
      apiEndpoint,
      {
        period: statementPeriod,
        format: statementFormat
      },
      apiConfig()
    );
    
    if (response.data.success) {
      alert(`Your statement is being prepared. ${response.data.data.downloadUrl ? 
        `It will be available at: ${response.data.data.downloadUrl}` : 
        'It will be available shortly in your document center.'}`);
      setIsStatementModalOpen(false);
    } else {
      throw new Error(response.data.error || 'Failed to generate statement');
    }
  } catch (err) {
    console.error('Error generating statement:', err);
    
    if (err.response && err.response.status === 401) {
      alert('Your session has expired. Please log in again.');
    } else {
      alert(err.response?.data?.error || 'Error generating statement');
    }
  }
};

  // Handle payment submission
const handlePayment = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      alert('Authentication required. Please log in.');
      handleLoginRedirect();
      return;
    }
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    
    const apiEndpoint = getApiEndpoint('/payment');
    
    const response = await axios.post(
      apiEndpoint,
      {
        amount: amount,
        description: paymentDescription || 'Payment'
      },
      apiConfig()
    );
    
    if (response.data.success) {
      // Update the account balance and transactions with the response data
      setAccount({
        ...account,
        balance: response.data.data.newBalance,
        availableCredit: account.creditLimit - Math.abs(response.data.data.newBalance)
      });
      
      // Add the new transaction to the transactions list
      setTransactions([response.data.data.transaction, ...transactions]);
      
      alert(`Successfully processed payment of ${formatCurrency(amount)}`);
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentDescription('');
    } else {
      throw new Error(response.data.error || 'Failed to process payment');
    }
  } catch (err) {
    console.error('Error processing payment:', err);
    
    if (err.response && err.response.status === 401) {
      alert('Your session has expired. Please log in again.');
      handleLoginRedirect();
    } else {
      alert(err.response?.data?.error || 'Error processing payment');
    }
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
      case 'transfer':
        navigate('/transfer-money', { state: { fromAccount: account } });
        break;
      case 'pay':
        navigate('/pay-bills', { state: { fromAccount: account } });
        break;
      case 'dispute':
        navigate('/dispute-transaction', { state: { account: account, transactions: transactions } });
        break;
      case 'statement':
        setIsStatementModalOpen(true);
        break;
      case 'makePayment':
        setIsPaymentModalOpen(true);
        break;
      case 'autopay':
        navigate('/setup-autopay', { state: { account: account } });
        break;
      case 'alerts':
        navigate('/account-alerts', { state: { account: account } });
        break;
      case 'creditLimit':
        navigate('/credit-limit-increase', { state: { account: account } });
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
      <div className="che004-loading-container">
        <div className="che004-loader"></div>
        <p>Loading credit account information...</p>
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
        <p>The requested credit account could not be found.</p>
        <button onClick={goToDashboard} className="che004-button che004-primary">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Credit account specific UI
  return (
    <div className="che004-account-page">
      <div className="che004-breadcrumb">
        <button onClick={goToDashboard} className="che004-link-button">Dashboard</button> {'>'}
        <span> Credit Account</span>
      </div>
      
      <div className="che004-account-header">
        <h1>
          {account.nickname || 'Credit Account'}
          {account.isPrimary && <span className="che004-badge che004-primary-badge">Primary</span>}
        </h1>
        <div className="che004-account-number">
          <p><strong>Account:</strong> {formatAccountNumber(account.accountNumber)}</p>
        </div>
      </div>
      
      <div className="che004-account-summary">
        <div className="che004-summary-item che004-balance">
          <span className="che004-label">Current Balance</span>
          <span className="che004-value che004-balance-value">
            {formatCurrency(Math.abs(account.balance))}
            <span className="che004-suffix">{account.balance <= 0 ? ' owed' : ' credit'}</span>
          </span>
        </div>
        <div className="che004-summary-item">
          <span className="che004-label">Available Credit</span>
          <span className="che004-value">{formatCurrency(account.availableCredit || (account.creditLimit - Math.abs(account.balance)))}</span>
        </div>
        <div className="che004-summary-item">
          <span className="che004-label">Credit Limit</span>
          <span className="che004-value">{formatCurrency(account.creditLimit)}</span>
        </div>
        <div className="che004-summary-item">
          <span className="che004-label">Minimum Payment</span>
          <span className="che004-value">{
            typeof account.minimumPayment === 'string' 
              ? account.minimumPayment 
              : formatCurrency(account.minimumPayment || 25)
          }</span>
        </div>
        <div className="che004-summary-item">
          <span className="che004-label">Due Date</span>
          <span className="che004-value">
            {account.dueDate 
              ? new Date(account.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              : 'N/A'}
          </span>
        </div>
        <div className="che004-summary-item">
          <span className="che004-label">Reward Points</span>
          <span className="che004-value">{account.rewardPoints || 0}</span>
        </div>
      </div>
      
      <div className="che004-quick-actions">
        <button onClick={() => handleQuickAction('makePayment')} className="che004-action-button">
          <span className="che004-action-icon">💵</span>
          <span>Make Payment</span>
        </button>
        <button onClick={() => handleQuickAction('statement')} className="che004-action-button">
          <span className="che004-action-icon">📄</span>
          <span>Statement</span>
        </button>
        <button onClick={() => handleQuickAction('creditLimit')} className="che004-action-button">
          <span className="che004-action-icon">⬆️</span>
          <span>Credit Limit</span>
        </button>
        <button onClick={() => handleQuickAction('dispute')} className="che004-action-button">
          <span className="che004-action-icon">⚠️</span>
          <span>Dispute</span>
        </button>
        <button onClick={() => handleQuickAction('autopay')} className="che004-action-button">
          <span className="che004-action-icon">🔄</span>
          <span>AutoPay</span>
        </button>
        <button onClick={() => handleQuickAction('alerts')} className="che004-action-button">
          <span className="che004-action-icon">🔔</span>
          <span>Alerts</span>
        </button>
      </div>
      
      <div className="che004-transactions-container">
        <div className="che004-transactions-header">
          <h2>Transactions</h2>
          <div className="che004-filters">
            <div className="che004-filter-group">
              <label htmlFor="filter">Type:</label>
              <select 
                id="filter" 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="che004-select"
              >
                <option value="all">All Transactions</option>
                <option value="purchase">Purchases</option>
                <option value="payment">Payments</option>
                <option value="fee">Fees</option>
                <option value="interest">Interest</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="che004-filter-group">
              <label htmlFor="dateRange">Period:</label>
              <select 
                id="dateRange" 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="che004-select"
              >
                <option value="30days">Last 30 Days</option>
                <option value="60days">Last 60 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>
        
        {transactions.length === 0 ? (
          <div className="che004-no-transactions">
            <p>No transactions found for the selected filters.</p>
          </div>
        ) : (
          <div className="che004-transactions-list">
            <table className="che004-transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={transaction.id || index} className="che004-transaction-row">
                    <td>
                      {new Date(transaction.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td>{transaction.description}</td>
                    <td>
                      <span className={`che004-transaction-type che004-type-${transaction.type}`}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </td>
                    <td className={`che004-amount ${transaction.amount >= 0 ? 'che004-positive' : 'che004-negative'}`}>
                      {formatCurrency(Math.abs(transaction.amount))}
                    </td>
                    <td>
                      <span className={`che004-status che004-status-${transaction.status.toLowerCase()}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Statement Modal */}
      {isStatementModalOpen && (
        <div className="che004-modal-overlay">
          <div className="che004-modal">
            <div className="che004-modal-header">
              <h3>Generate Statement</h3>
              <button 
                onClick={() => setIsStatementModalOpen(false)}
                className="che004-close-button"
              >
                &times;
              </button>
            </div>
            <div className="che004-modal-body">
              <div className="che004-form-group">
                <label htmlFor="statement-period">Statement Period:</label>
                <select
                  id="statement-period"
                  value={statementPeriod}
                  onChange={(e) => setStatementPeriod(e.target.value)}
                  className="che004-select"
                  required
                >
                  <option value="">Select Period</option>
                  <option value="current">Current Period</option>
                  <option value="previous">Previous Period</option>
                  <option value="last3months">Last 3 Months</option>
                  <option value="lastyear">Last Year</option>
                </select>
              </div>
              <div className="che004-form-group">
                <label htmlFor="statement-format">Format:</label>
                <select
                  id="statement-format"
                  value={statementFormat}
                  onChange={(e) => setStatementFormat(e.target.value)}
                  className="che004-select"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>
            <div className="che004-modal-footer">
              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="che004-button che004-secondary"
              >
                Cancel
              </button>
              <button
                onClick={generateStatement}
                className="che004-button che004-primary"
                disabled={!statementPeriod}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Make Payment Modal */}
      {isPaymentModalOpen && (
        <div className="che004-modal-overlay">
          <div className="che004-modal">
            <div className="che004-modal-header">
              <h3>Make Payment</h3>
              <button 
                className="che004-close-button" 
                onClick={() => setIsPaymentModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="che004-modal-body">
              <div className="che004-form-group">
                <label htmlFor="payment-amount">Payment Amount ($)</label>
                <input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="che004-input"
                  placeholder="Enter amount"
                />
              </div>
              <div className="che004-form-group">
                <label htmlFor="payment-description">Description (Optional)</label>
                <input
                  id="payment-description"
                  type="text"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="che004-input"
                  placeholder="e.g., Monthly Payment"
                />
              </div>
              <div className="che004-form-actions">
                <button
                  className="che004-button che004-primary"
                  onClick={handlePayment}
                  disabled={!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0}
                >
                  Make Payment
                </button>
                <button
                  className="che004-button che004-secondary"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="che004-account-footer">
        <p>
          <Link to="/financial-tools">Financial Tools</Link> | 
          <Link to="/support">Contact Support</Link> | 
          <Link to="/faqs">FAQs</Link>
        </p>
        <p className="che004-disclaimer">
          For security reasons, please log out when you are done accessing your accounts.
          Always monitor your account for suspicious activity and report any unauthorized transactions.
        </p>
      </div>
    </div>
  );
};

export default CreditAccountPage;