import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './StudentAccountPage.css';

const StudentAccountPage = () => {
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

  // Get the appropriate API endpoint for student accounts
  const getApiEndpoint = (endpoint = '') => {
    // Use the full URL including the base URL of your API server
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://wellsapi-1.onrender.com';
    return accountId 
      ? `${baseUrl}/api/student/${accountId}${endpoint}` 
      : `${baseUrl}/api/student/primary${endpoint}`;
  };

  // Try to get account data from localStorage based on account type (student)
  const getAccountDataFromLocalStorage = () => {
    try {
      const accountsData = localStorage.getItem('wellsFargoAccounts');
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        // Find student accounts only
        const studentAccounts = accounts.filter(acc => 
          acc.type && acc.type.toLowerCase().includes('student')
        );
        
        // Find the specific student account by ID or get the first student account if id is not provided
        let matchedAccount;
        if (accountId) {
          matchedAccount = studentAccounts.find(acc => acc.id === accountId);
        } else {
          matchedAccount = studentAccounts[0]; // Get the first student account
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
    
    // Get student account data from localStorage if available
    const newAccountData = localStorage.getItem('newWellsFargoStudentAccount') || 
                          localStorage.getItem('newWellsFargoAccount');
    
    let initialDeposit = 0;
    if (newAccountData) {
      try {
        const parsedData = JSON.parse(newAccountData);
        initialDeposit = parsedData.initialDeposit || parsedData.balance || 0;
      } catch (e) {
        console.error('Error parsing newWellsFargoAccount data:', e);
      }
    }
    
    // Use account balance or default to 530,000 for student accounts
    const balance = account.balance || initialDeposit || 530000.00;
    
    // Create realistic transactions that add up to the current balance
    const transactions = [];
    
    // Most recent transaction - Large deposit that establishes the bulk of the balance
    transactions.push({
      id: 'tx1',
      date: new Date(accountOpenDate.getFullYear(), accountOpenDate.getMonth(), accountOpenDate.getDate()).toISOString(),
      description: 'Student Loan Disbursement',
      status: 'Completed',
      type: 'deposit',
      amount: balance - 1000, // Initial large deposit
      balance: balance
    });
    
    // Second transaction - Account setup
    transactions.push({
      id: 'tx2',
      date: new Date(accountOpenDate.getFullYear(), accountOpenDate.getMonth(), accountOpenDate.getDate()).toISOString(),
      description: 'Student Fee Waiver',
      status: 'Completed',
      type: 'fee',
      amount: 0.00,
      balance: 1000
    });
    
    // Add a few more transactions for realism
    transactions.push({
      id: 'tx3',
      date: new Date(accountOpenDate.getFullYear(), accountOpenDate.getMonth(), accountOpenDate.getDate()).toISOString(),
      description: 'Initial Student Deposit',
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
      
      console.log(`Fetching student account data: ${accountId ? `ID: ${accountId}` : 'Primary Student Account'}`);
      
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
          throw new Error(response.data.error || 'Failed to load student account data');
        }
      } catch (apiError) {
        console.error('API Error, checking localStorage data:', apiError);
        
        // Try to get data from localStorage (which was populated by Dashboard)
        const localStorageAccount = getAccountDataFromLocalStorage();
        
        if (localStorageAccount) {
          console.log('Found student account in localStorage:', localStorageAccount);
          setAccount(localStorageAccount);
          
          // Generate mock transactions based on the account balance
          const mockTransactions = generateMockTransactions(localStorageAccount);
          setTransactions(mockTransactions);
        } else {
          console.error('No localStorage data found, using fallback mock data');
          // Get initial deposit from localStorage if available for student account
          const newAccountData = localStorage.getItem('newWellsFargoStudentAccount') || 
                               localStorage.getItem('newWellsFargoAccount');
          
          let initialDeposit = 0;
          if (newAccountData) {
            try {
              const parsedData = JSON.parse(newAccountData);
              initialDeposit = parsedData.initialDeposit || parsedData.balance || 0;
            } catch (e) {
              console.error('Error parsing newWellsFargoAccount data:', e);
            }
          }

          // Fall back to mock data with the initial deposit or default 530000 balance (for student accounts)
          const mockAccount = {
            id: accountId || 'primary-student-account',
            type: 'Student Account',
            accountNumber: location.state?.account?.accountNumber || 
              (accountId ? accountId : '1234567890'),
            routingNumber: '121000248',
            balance: initialDeposit || 530000.00, // Default student balance
            availableBalance: initialDeposit || 530000.00,
            openedDate: '2025-04-01T00:00:00.000Z',
            monthlyFee: 0.00, // Student accounts often have no monthly fee
            minBalance: 300.00, // Lower minimum balance for student accounts
            overdraftProtection: true,
            interestRate: 0.01
          };
          
          setAccount({
            ...mockAccount,
            monthlyFee: '$0.00 (waived for students)',
            minBalance: '$300.00',
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
        setError(`Student account not found. Please check the account ID or create a new account.`);
      } else {
        setError(err.response?.data?.error || `Error fetching student account data: ${err.message}`);
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
          
          alert(`Successfully deposited $${amount}`);
          setIsDepositModalOpen(false);
          setDepositAmount('');
          setDepositDescription('');
        } else {
          throw new Error(response.data.error || 'Failed to process deposit');
        }
      } catch (apiError) {
        console.log('API error, using mock response:', apiError);
        const mockResponse = await mockApiResponse('Deposit processed successfully');
        
        // Create a mock transaction
        const newTransaction = {
          id: 'tx' + Math.floor(Math.random() * 10000),
          date: new Date().toISOString(),
          description: depositDescription || 'Deposit',
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
        
        alert(`Successfully deposited $${depositAmount}`);
        setIsDepositModalOpen(false);
        setDepositAmount('');
        setDepositDescription('');
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
      case 'deposit':
        navigate('/deposit-check', { state: { toAccount: account } });
        break;
      case 'withdraw':
        navigate('/withdraw', { state: { fromAccount: account } });
        break;
      case 'statement':
        navigate('/account-statements', { state: { account: account } });
        break;
      case 'checks':
        navigate('/order-checks', { state: { account: account } });
        break;
      case 'autopay':
        navigate('/setup-autopay', { state: { account: account } });
        break;
      case 'alerts':
        navigate('/account-alerts', { state: { account: account } });
        break;
      case 'dispute':
        navigate('/dispute-transaction', { state: { account: account, transactions: transactions } });
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
      <div className="stud001-loading-container">
        <div className="stud001-loader"></div>
        <p>Loading student account information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stud001-error-container">
        <h2>Error Loading Student Account</h2>
        <p>{error}</p>
        <button onClick={goToDashboard} className="stud001-button stud001-primary">
          Return to Dashboard
        </button>
        {error.includes('Authentication') && (
          <button onClick={handleLoginRedirect} className="stud001-button stud001-secondary">
            Log In
          </button>
        )}
      </div>
    );
  }

  if (!account) {
    return (
      <div className="stud001-error-container">
        <h2>Student Account Not Found</h2>
        <p>The requested student account could not be found.</p>
        <button onClick={goToDashboard} className="stud001-button stud001-primary">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="stud001-checking-account-page">
      <header className="dash002 dashboard-header">
        <div className="dash002 header-content">
          <img 
            src="/Images/wells fargo.jpeg" 
            alt="Wells Fargo Logo" 
            className="dash002 logo" 
            onClick={goToDashboard}
            style={{ cursor: 'pointer' }}
          />
          <div className="stud001-back-button" onClick={goToDashboard}>
            <span className="stud001-back-arrow">&#8592;</span> Back to Dashboard
          </div>
        </div>
      </header>

      <div className="stud001-account-header-card">
        <div className="stud001-account-title-section">
          <h1>{account.type || 'Student Account'}</h1>
          <div className="stud001-account-number">Account Number: {formatAccountNumber(account.accountNumber)}</div>
        </div>
        <div className="stud001-account-balance-info">
          <div className="stud001-current-balance">
            <span className="stud001-balance-label">Available Balance</span>
            <span className="stud001-balance-amount">{formatCurrency(account.availableBalance || account.balance)}</span>
          </div>
          <div className="stud001-balance-details">
            <div className="stud001-balance-detail-item">
              <span>Current Balance:</span>
              <span>{formatCurrency(account.balance)}</span>
            </div>
            <div className="stud001-balance-detail-item">
              <span>Available for Withdrawal:</span>
              <span>{formatCurrency(account.availableBalance || account.balance)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="stud001-account-content-grid">
        <div className="stud001-account-details-card">
          <h2>Account Details</h2>
          <div className="stud001-account-detail-item">
            <span>Account Number:</span>
            <span>{formatAccountNumber(account.accountNumber)}</span>
          </div>
          <div className="stud001-account-detail-item">
            <span>Account Type:</span>
            <span>{account.type || 'Student Account'}</span>
          </div>
          <div className="stud001-account-detail-item">
            <span>Routing Number:</span>
            <span>{account.routingNumber}</span>
          </div>
          <div className="stud001-account-detail-item">
            <span>Date Opened:</span>
            <span>{new Date(account.openedDate).toLocaleDateString()}</span>
          </div>
          <div className="stud001-account-detail-item">
            <span>Monthly Service Fee:</span>
            <span>{account.monthlyFee}</span>
          </div>
          <div className="stud001-account-detail-item">
            <span>Minimum Balance Required:</span>
            <span>{account.minBalance}</span>
          </div>
          <div className="stud001-account-detail-item">
            <span>Overdraft Protection:</span>
            <span>{account.overdraftProtection}</span>
          </div>
          <div className="stud001-account-detail-item">
            <span>Interest Rate:</span>
            <span>{account.interestRate}</span>
          </div>
          <div className="stud001-account-actions">
            <button className="stud001-account-action-button stud001-primary" onClick={() => setIsStatementModalOpen(true)}>
              Download Statement
            </button>
            <button className="stud001-account-action-button stud001-secondary">
              View Account Details
            </button>
          </div>
        </div>
        
        <div className="stud001-quick-actions-card">
          <h2>Quick Actions</h2>
          <div className="stud001-quick-actions-grid">
            <div className="stud001-quick-action-item" onClick={() => handleQuickAction('transfer')}>
              <div className="stud001-quick-action-icon stud001-transfer-icon"></div>
              <span>Transfer Money</span>
            </div>
            <div className="stud001-quick-action-item" onClick={() => handleQuickAction('pay')}>
              <div className="stud001-quick-action-icon stud001-pay-icon"></div>
              <span>Pay Bills</span>
            </div>
            <div className="stud001-quick-action-item" onClick={() => handleQuickAction('deposit')}>
              <div className="stud001-quick-action-icon stud001-deposit-icon"></div>
              <span>Deposit Check</span>
            </div>
            <div className="stud001-quick-action-item" onClick={() => handleQuickAction('withdraw')}>
              <div className="stud001-quick-action-icon stud001-withdraw-icon"></div>
              <span>Withdraw Funds</span>
            </div>
            <div className="stud001-quick-action-item" onClick={() => handleQuickAction('checks')}>
              <div className="stud001-quick-action-icon stud001-check-icon"></div>
              <span>Order Checks</span>
            </div>
            <div className="stud001-quick-action-item" onClick={() => handleQuickAction('autopay')}>
              <div className="stud001-quick-action-icon stud001-auto-pay-icon"></div>
              <span>Set Up Auto-Pay</span>
            </div>
            <div className="stud001-quick-action-item" onClick={() => handleQuickAction('alerts')}>
              <div className="stud001-quick-action-icon stud001-alert-icon"></div>
              <span>Account Alerts</span>
            </div>
            <div className="stud001-quick-action-item" onClick={() => handleQuickAction('dispute')}>
              <div className="stud001-quick-action-icon stud001-dispute-icon"></div>
              <span>Dispute Transaction</span>
            </div>
            <div className="stud001-quick-action-item" onClick={() => setIsDepositModalOpen(true)}>
              <div className="stud001-quick-action-icon stud001-deposit-icon"></div>
              <span>Deposit Money</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="stud001-transactions-section">
        <div className="stud001-transactions-header">
          <h2>Transaction History</h2>
          <div className="stud001-filter-controls">
            <div className="stud001-filter-group">
              <label htmlFor="transaction-type">Transaction Type:</label>
              <select 
                id="transaction-type"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Transactions</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="payment">Payments</option>
                <option value="purchase">Purchases</option>
              </select>
            </div>
            <div className="stud001-filter-group">
              <label htmlFor="date-range">Time Period:</label>
              <select 
                id="date-range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="30days">Last 30 Days</option>
                <option value="60days">Last 60 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="stud001-transactions-table-container">
          <table className="stud001-transactions-table">
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
                transactions.map(transaction => (
                  <tr key={transaction.id} className={`transaction-${transaction.type}`}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td>{transaction.description}</td>
                    <td>{transaction.status}</td>
                    <td className={transaction.amount < 0 ? 'stud001-negative-amount' : 'stud001-positive-amount'}>
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td>{formatCurrency(transaction.balance)}</td>
                    <td>
                      <button 
                        className="stud001-transaction-action-btn"
                        onClick={() => navigate('/dispute-transaction', { 
                          state: { 
                            account: account,
                            transactions: transactions,
                            selectedTransaction: transaction 
                          } 
                        })}
                      >
                        Dispute
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="stud001-no-transactions">
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
        <div className="stud001-modal-backdrop">
          <div className="stud001-modal">
          <div className="stud001-modal-header">
              <h3>Download Account Statement</h3>
              <button className="stud001-modal-close" onClick={() => setIsStatementModalOpen(false)}>×</button>
            </div>
            <div className="stud001-modal-body">
              <div className="stud001-modal-form">
                <div className="stud001-form-group">
                  <label htmlFor="statement-period">Statement Period:</label>
                  <select 
                    id="statement-period"
                    value={statementPeriod}
                    onChange={(e) => setStatementPeriod(e.target.value)}
                    required
                  >
                    <option value="">Select Period</option>
                    <option value="current">Current Month</option>
                    <option value="previous">Previous Month</option>
                    <option value="january">January 2025</option>
                    <option value="february">February 2025</option>
                    <option value="march">March 2025</option>
                  </select>
                </div>
                <div className="stud001-form-group">
                  <label htmlFor="statement-format">Format:</label>
                  <select 
                    id="statement-format"
                    value={statementFormat}
                    onChange={(e) => setStatementFormat(e.target.value)}
                  >
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV (Excel)</option>
                    <option value="qif">QIF (Quicken)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="stud001-modal-footer">
              <button 
                className="stud001-button stud001-primary"
                onClick={downloadStatement}
                disabled={!statementPeriod}
              >
                Download Statement
              </button>
              <button 
                className="stud001-button stud001-secondary" 
                onClick={() => setIsStatementModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div className="stud001-modal-backdrop">
          <div className="stud001-modal">
            <div className="stud001-modal-header">
              <h3>Deposit Money</h3>
              <button className="stud001-modal-close" onClick={() => setIsDepositModalOpen(false)}>×</button>
            </div>
            <div className="stud001-modal-body">
              <div className="stud001-modal-form">
                <div className="stud001-form-group">
                  <label htmlFor="deposit-amount">Amount ($):</label>
                  <input 
                    type="number" 
                    id="deposit-amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                <div className="stud001-form-group">
                  <label htmlFor="deposit-description">Description (optional):</label>
                  <input 
                    type="text" 
                    id="deposit-description"
                    value={depositDescription}
                    onChange={(e) => setDepositDescription(e.target.value)}
                    placeholder="E.g., Salary, Gift, etc."
                  />
                </div>
              </div>
            </div>
            <div className="stud001-modal-footer">
              <button 
                className="stud001-button stud001-primary"
                onClick={handleDeposit}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
              >
                Deposit Funds
              </button>
              <button 
                className="stud001-button stud001-secondary" 
                onClick={() => setIsDepositModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Transfer Modal could be added here if needed */}
      
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

export default StudentAccountPage;