import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import './RetirementAccountPage.css';
import axios from 'axios';

const RetirementAccountPage = () => {
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
      ? `${baseUrl}/api/retirement/primary${endpoint}` 
      : `${baseUrl}/api/retirement/${accountId}${endpoint}`;
  };

  // Try to get account data from localStorage first (as stored by Dashboard)
  const getAccountDataFromLocalStorage = () => {
    try {
      const accountsData = localStorage.getItem('wellsFargoAccounts');
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        // Find the specific retirement account by ID or get the first retirement account if id is primary
        let matchedAccount;
        if (isPrimaryAccount()) {
          matchedAccount = accounts.find(acc => acc.type.toLowerCase().includes('retirement'));
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
    // Use the account's openedDate instead of today
    const accountOpenDate = new Date(account.openedDate || account.openDate);
    // Get initial deposit from localStorage if available
    const newAccountData = localStorage.getItem('newWellsFargoAccount');
    let initialDeposit = 0;
    if (newAccountData) {
      try {
        const parsedData = JSON.parse(newAccountData);
        initialDeposit = parsedData.initialDeposit || parsedData.balance || 0;
      } catch (e) {
        console.error('Error parsing newWellsFargoAccount data:', e);
      }
    }
    const balance = account.balance || initialDeposit || 1000.00; // Fallback to 1000 if no value found
    
    // Create realistic transactions that add up to the current balance
    const transactions = [];
    
    // Most recent transaction - Large deposit that establishes the bulk of the balance
    transactions.push({
      id: 'tx1',
      date: new Date(accountOpenDate.getFullYear(), accountOpenDate.getMonth(), accountOpenDate.getDate()).toISOString(),
      description: 'Retirement Portfolio Transfer',
      status: 'Completed',
      type: 'deposit',
      amount: balance - 1000, // Initial large deposit
      balance: balance
    });
    
    // Second transaction - Account setup
    transactions.push({
      id: 'tx2',
      date: new Date(accountOpenDate.getFullYear(), accountOpenDate.getMonth(), accountOpenDate.getDate()).toISOString(),
      description: 'Annual Contribution Limit Notification',
      status: 'Completed',
      type: 'info',
      amount: 0.00,
      balance: balance - (balance - 1000)
    });
    
    // Add a few more transactions for realism
    transactions.push({
      id: 'tx3',
      date: new Date(accountOpenDate.getFullYear(), accountOpenDate.getMonth(), accountOpenDate.getDate()).toISOString(),
      description: 'Initial IRA Contribution',
      status: 'Completed',
      type: 'deposit',
      amount: 1000,
      balance: 1000
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
      
      // First check if the account data was passed via location state
      if (location.state && location.state.account) {
        console.log('Using account data from navigation state:', location.state.account);
        const passedAccount = location.state.account;
        
        // Make sure this is actually a retirement account
        if (passedAccount.type && passedAccount.type.toLowerCase().includes('retirement')) {
          setAccount({
            ...passedAccount,
            // Format any needed display values
            monthlyFee: passedAccount.monthlyFee ? formatCurrency(passedAccount.monthlyFee) + ' (waived)' : '$0.00 (waived)',
            minBalance: passedAccount.minBalance ? formatCurrency(passedAccount.minBalance) : '$0.00',
            interestRate: passedAccount.interestRate ? `${passedAccount.interestRate}% APY` : '0.01% APY'
          });
          
          // Generate mock transactions for this account
          const mockTransactions = generateMockTransactions(passedAccount);
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
          setAccount({
            ...localStorageAccount,
            // Format any display values
            monthlyFee: localStorageAccount.monthlyFee ? formatCurrency(localStorageAccount.monthlyFee) + ' (waived)' : '$0.00 (waived)',
            minBalance: localStorageAccount.minBalance ? formatCurrency(localStorageAccount.minBalance) : '$0.00',
            interestRate: localStorageAccount.interestRate ? `${localStorageAccount.interestRate}% APY` : '0.01% APY'
          });
          
          // Generate mock transactions based on the account balance
          const mockTransactions = generateMockTransactions(localStorageAccount);
          setTransactions(mockTransactions);
        } else {
          console.error('No localStorage data found, using fallback mock data');
          // Get initial deposit from localStorage if available
          const newAccountData = localStorage.getItem('newWellsFargoAccount');
          let initialDeposit = 0;
          if (newAccountData) {
            try {
              const parsedData = JSON.parse(newAccountData);
              initialDeposit = parsedData.initialDeposit || parsedData.balance || 0;
            } catch (e) {
              console.error('Error parsing newWellsFargoAccount data:', e);
            }
          }

          // Fall back to mock data with the initial deposit or default 1000 balance
          const mockAccount = {
            id: accountId || 'primary-retirement',
            type: 'Retirement Account',
            // Use the same account number format that comes from the API/Dashboard
            accountNumber: location.state?.account?.accountNumber || 
              (accountId ? accountId : '0000000000'),
            routingNumber: '121000248',
            balance: initialDeposit || 1000.00,
            availableBalance: initialDeposit || 1000.00,
            openedDate: '2025-04-01T00:00:00.000Z',
            monthlyFee: 0.00,
            minBalance: 0.00,
            contributionLimit: 6500.00,
            interestRate: 0.05
          };
          
          setAccount({
            ...mockAccount,
            monthlyFee: '$0.00 (waived)',
            minBalance: '$0.00',
            contributionLimit: '$6,500.00 annual',
            interestRate: '0.05% APY'
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
      
      const apiEndpoint = getApiEndpoint('/deposit');
      
      try {
        const response = await axios.post(
          apiEndpoint,
          {
            amount: amount,
            description: depositDescription || 'IRA Contribution'
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
          
          alert(`Successfully deposited $${amount}`);
          setIsDepositModalOpen(false);
          setDepositAmount('');
          setDepositDescription('');
        } else {
          throw new Error(response.data.error || 'Failed to process deposit');
        }
      } catch (apiError) {
        console.log('API error, using mock response:', apiError);
        const mockResponse = await mockApiResponse('Contribution processed successfully');
        
        // Create a mock transaction
        const newTransaction = {
          id: 'tx' + Math.floor(Math.random() * 10000),
          date: new Date().toISOString(),
          description: depositDescription || 'IRA Contribution',
          status: 'Completed',
          type: 'deposit',
          amount: parseFloat(depositAmount),
          balance: account.balance + parseFloat(depositAmount)
        };
        
        // Update the account balance
        setAccount({
          ...account,
          balance: account.balance + parseFloat(depositAmount),
          availableBalance: account.balance + parseFloat(depositAmount)
        });
        
        // Add the new transaction to the transactions list
        setTransactions([newTransaction, ...transactions]);
        
        alert(`Successfully contributed $${depositAmount}`);
        setIsDepositModalOpen(false);
        setDepositAmount('');
        setDepositDescription('');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Your session has expired. Please log in again.');
        handleLoginRedirect();
      } else {
        alert(err.response?.data?.error || 'Error processing contribution');
      }
      console.error('Error depositing money:', err);
    }
  };

  // Handle login redirection
  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: location.pathname } });
  };

  // Initial data fetch
  useEffect(() => {
    console.log('RetirementAccountPage mounted');
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
      case 'contribution':
        setIsDepositModalOpen(true);
        break;
      case 'statement':
        setIsStatementModalOpen(true);
        break;
      case 'investment':
        navigate('/retirement-investment-options', { state: { account: account } });
        break;
      case 'distribution':
        navigate('/retirement-distribution', { state: { account: account } });
        break;
      case 'rollover':
        navigate('/retirement-rollover', { state: { account: account } });
        break;
      case 'beneficiary':
        navigate('/manage-beneficiaries', { state: { account: account } });
        break;
      case 'taxes':
        navigate('/tax-information', { state: { account: account } });
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
      <div className="ret010-loading-container">
        <div className="ret010-loader"></div>
        <p>Loading retirement account information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ret010-error-container">
        <h2>Error Loading Account</h2>
        <p>{error}</p>
        <button onClick={goToDashboard} className="ret010-button ret010-primary">
          Return to Dashboard
        </button>
        {error.includes('Authentication') && (
          <button onClick={handleLoginRedirect} className="ret010-button ret010-secondary">
            Log In
          </button>
        )}
      </div>
    );
  }

  if (!account) {
    return (
      <div className="ret010-error-container">
        <h2>Account Not Found</h2>
        <p>The requested retirement account could not be found.</p>
        <button onClick={goToDashboard} className="ret010-button ret010-primary">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="ret010-account-page">
      <header className="ret010-account-header">
        <button onClick={goToDashboard} className="ret010-back-button">
          &larr; Back to Dashboard
        </button>
        <h1>Retirement Account</h1>
      </header>

      <div className="ret010-account-summary">
        <div className="ret010-summary-card">
          <h2>Account Summary</h2>
          <div className="ret010-account-info">
            <div className="ret010-info-row">
              <span className="ret010-info-label">Account Number:</span>
              <span className="ret010-info-value">{formatAccountNumber(account.accountNumber)}</span>
            </div>
            <div className="ret010-info-row">
              <span className="ret010-info-label">Account Type:</span>
              <span className="ret010-info-value">{account.type}</span>
            </div>
            <div className="ret010-info-row">
              <span className="ret010-info-label">Current Balance:</span>
              <span className="ret010-info-value ret010-balance">{formatCurrency(account.balance)}</span>
            </div>
            <div className="ret010-info-row">
              <span className="ret010-info-label">Annual Contribution Limit:</span>
              <span className="ret010-info-value">{account.contributionLimit || '$6,500.00'}</span>
            </div>
            <div className="ret010-info-row">
              <span className="ret010-info-label">Year-to-Date Contributions:</span>
              <span className="ret010-info-value">{formatCurrency(account.ytdContributions || 2500)}</span>
            </div>
            <div className="ret010-info-row">
              <span className="ret010-info-label">Interest Rate:</span>
              <span className="ret010-info-value">{account.interestRate || '0.05% APY'}</span>
            </div>
            <div className="ret010-info-row">
              <span className="ret010-info-label">Opened Date:</span>
              <span className="ret010-info-value">
                {new Date(account.openedDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="ret010-quick-actions">
        <h2>Quick Actions</h2>
        <div className="ret010-action-buttons">
          <button onClick={() => handleQuickAction('contribution')} className="ret010-action-button">
            Make Contribution
          </button>
          <button onClick={() => handleQuickAction('investment')} className="ret010-action-button">
            Investment Options
          </button>
          <button onClick={() => handleQuickAction('statement')} className="ret010-action-button">
            View Statements
          </button>
          <button onClick={() => handleQuickAction('distribution')} className="ret010-action-button">
            Request Distribution
          </button>
          <button onClick={() => handleQuickAction('rollover')} className="ret010-action-button">
            Rollover Options
          </button>
          <button onClick={() => handleQuickAction('beneficiary')} className="ret010-action-button">
            Manage Beneficiaries
          </button>
          <button onClick={() => handleQuickAction('taxes')} className="ret010-action-button">
            Tax Information
          </button>
          <button onClick={() => handleQuickAction('alerts')} className="ret010-action-button">
            Account Alerts
          </button>
        </div>
      </div>

      <div className="ret010-transactions-section">
        <h2>Recent Transactions</h2>
        <div className="ret010-filters">
          <div className="ret010-filter-group">
            <label htmlFor="transaction-filter">Filter:</label>
            <select 
              id="transaction-filter" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="ret010-select"
            >
              <option value="all">All Transactions</option>
              <option value="deposit">Contributions</option>
              <option value="withdrawal">Distributions</option>
              <option value="fee">Fees</option>
              <option value="interest">Interest</option>
            </select>
          </div>
          <div className="ret010-filter-group">
            <label htmlFor="date-range">Date Range:</label>
            <select 
              id="date-range" 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="ret010-select"
            >
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <div className="ret010-transactions">
          <table className="ret010-transactions-table">
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
                  <tr key={transaction.id} className={`ret010-transaction-row ret010-${transaction.type}`}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td>{transaction.description}</td>
                    <td className="ret010-transaction-type">
                      <span className={`ret010-type-badge ret010-${transaction.type}`}>
                        {transaction.type === 'deposit' ? 'Contribution' : 
                         transaction.type === 'withdrawal' ? 'Distribution' : 
                         transaction.type === 'fee' ? 'Fee' : 
                         transaction.type === 'interest' ? 'Interest' : transaction.type}
                      </span>
                    </td>
                    <td className={`ret010-amount ${transaction.type === 'deposit' || transaction.type === 'interest' ? 'ret010-positive' : 'ret010-negative'}`}>
                      {transaction.type === 'deposit' || transaction.type === 'interest' ? '+' : ''}
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td>{formatCurrency(transaction.balance)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="ret010-no-transactions">
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
        <div className="ret010-modal">
          <div className="ret010-modal-content">
            <span className="ret010-close" onClick={() => setIsStatementModalOpen(false)}>&times;</span>
            <h2>Download Statement</h2>
            <div className="ret010-form-group">
              <label htmlFor="statement-period">Statement Period:</label>
              <select 
                id="statement-period" 
                value={statementPeriod} 
                onChange={(e) => setStatementPeriod(e.target.value)}
                className="ret010-select"
              >
                <option value="">Select Period</option>
                <option value="current">Current Month</option>
                <option value="previous">Previous Month</option>
                <option value="q1">Q1 2025</option>
                <option value="q4-2024">Q4 2024</option>
                <option value="q3-2024">Q3 2024</option>
                <option value="q2-2024">Q2 2024</option>
                <option value="annual-2024">Annual 2024</option>
              </select>
            </div>
            <div className="ret010-form-group">
              <label htmlFor="statement-format">Format:</label>
              <select 
                id="statement-format" 
                value={statementFormat} 
                onChange={(e) => setStatementFormat(e.target.value)}
                className="ret010-select"
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div className="ret010-form-buttons">
              <button 
                onClick={() => setIsStatementModalOpen(false)} 
                className="ret010-button ret010-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={downloadStatement} 
                className="ret010-button ret010-primary"
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
        <div className="ret010-modal">
          <div className="ret010-modal-content">
            <span className="ret010-close" onClick={() => setIsDepositModalOpen(false)}>&times;</span>
            <h2>Make IRA Contribution</h2>
            <div className="ret010-form-group">
              <label htmlFor="deposit-amount">Contribution Amount:</label>
              <input
                type="number"
                id="deposit-amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="Enter amount"
                className="ret010-input"
              />
            </div>
            <div className="ret010-form-group">
              <label htmlFor="deposit-description">Description (Optional):</label>
              <input
                type="text"
                id="deposit-description"
                value={depositDescription}
                onChange={(e) => setDepositDescription(e.target.value)}
                placeholder="e.g., Annual Contribution"
                className="ret010-input"
              />
            </div>
            <div className="ret010-contribution-info">
              <p>Annual Contribution Limit: {account.contributionLimit || '$6,500.00'}</p>
              <p>Year-to-Date Contributions: {formatCurrency(account.ytdContributions || 2500)}</p>
              <p>Remaining Contribution Available: {formatCurrency((account.remainingContribution || 4000))}</p>
            </div>
            <div className="ret010-form-buttons">
              <button 
                onClick={() => setIsDepositModalOpen(false)} 
                className="ret010-button ret010-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeposit} 
                className="ret010-button ret010-primary"
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
              >
                Submit Contribution
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

export default RetirementAccountPage;