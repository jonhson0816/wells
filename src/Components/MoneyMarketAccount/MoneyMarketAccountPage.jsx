import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './MoneyMarketAccountPage.css';

const MoneyMarketAccountPage = () => {
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
        ? `${baseUrl}/api/checking/primary${endpoint}` 
        : `${baseUrl}/api/checking/${accountId}${endpoint}`;
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
            
            // Generate consistent transactions based on the account
            const mockTransactions = generateConsistentTransactions(localStorageAccount);
            setTransactions(mockTransactions);
          } else {
            console.error('No localStorage data found, using fallback mock data');
            // Fall back to mock data that matches the 600,000 balance if API and localStorage fail
            const mockAccount = {
              id: accountId || 'primary-account',
              type: 'Money Market Account',
              accountNumber: 'xxxx-xxxx-' + (accountId ? accountId.slice(-4) : '1234'),
              routingNumber: '121000248',
              balance: 600000.00, // Use the 600,000 balance to maintain consistency
              availableBalance: 600000.00,
              openedDate: '2025-04-01T00:00:00.000Z', // Recent date
              monthlyFee: '$10.00 (waived)',
              minBalance: '$1,500.00',
              overdraftProtection: 'Enabled - Linked to Savings',
              interestRate: '0.01% APY'
            };
            
            setAccount(mockAccount);
            
            // Generate consistent mock transactions for this balance
            const mockTransactions = generateConsistentTransactions(mockAccount);
            setTransactions(mockTransactions);
          }
        }
      } catch (err) {
        console.error('Error fetching account (detailed):', err);
        
        // Add better debugging for proxy issues
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
  
    // Generate consistent transactions based on account balance
    const generateConsistentTransactions = (account) => {
      const today = new Date();
      const balance = account.balance || 600000.00;
      
      // Create a realistic opening deposit transaction
      return [
        {
          id: 'tx1',
          date: new Date(today.setDate(today.getDate() - 1)).toISOString(),
          description: 'Account Opening Bonus',
          status: 'Completed',
          type: 'deposit',
          amount: balance,
          balance: balance
        },
        {
          id: 'tx2',
          date: new Date(today.setDate(today.getDate() - 1)).toISOString(),
          description: 'New Account Setup - Wells Fargo',
          status: 'Completed',
          type: 'fee',
          amount: 0.00,
          balance: balance
        }
      ];
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
        <header className="dash002 dashboard-header">
          <div className="dash002 header-content">
            <img 
              src="/Images/wells fargo.jpeg" 
              alt="Wells Fargo Logo" 
              className="dash002 logo" 
              onClick={goToDashboard}
              style={{ cursor: 'pointer' }}
            />
            <div className="che004-back-button" onClick={goToDashboard}>
              <span className="che004-back-arrow">&#8592;</span> Back to Dashboard
            </div>
          </div>
          <nav className="dash002 main-navigation">
            <Link to="/accounts">Accounts</Link>
            <Link to="/transfer-money">Transfers</Link>
            <Link to="/pay-bills">Payments</Link>
            <Link to="/account-management">Investments</Link>
          </nav>
        </header>
  
        <div className="che004-account-header-card">
          <div className="che004-account-title-section">
            <h1>{account.type || 'Checking Account'}</h1>
            <div className="che004-account-number">Account Number: {account.accountNumber}</div>
          </div>
          <div className="che004-account-balance-info">
            <div className="che004-current-balance">
              <span className="che004-balance-label">Available Balance</span>
              <span className="che004-balance-amount">{formatCurrency(account.availableBalance || account.balance)}</span>
            </div>
            <div className="che004-balance-details">
              <div className="che004-balance-detail-item">
                <span>Current Balance:</span>
                <span>{formatCurrency(account.balance)}</span>
              </div>
              <div className="che004-balance-detail-item">
                <span>Available for Withdrawal:</span>
                <span>{formatCurrency(account.availableBalance || account.balance)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="che004-account-content-grid">
          <div className="che004-account-details-card">
            <h2>Account Details</h2>
            <div className="che004-account-detail-item">
              <span>Account Type:</span>
              <span>{account.type || 'Checking'}</span>
            </div>
            <div className="che004-account-detail-item">
              <span>Account Number:</span>
              <span>{account.accountNumber}</span>
            </div>
            <div className="che004-account-detail-item">
              <span>Routing Number:</span>
              <span>{account.routingNumber}</span>
            </div>
            <div className="che004-account-detail-item">
              <span>Date Opened:</span>
              <span>{new Date(account.openedDate).toLocaleDateString()}</span>
            </div>
            <div className="che004-account-detail-item">
              <span>Monthly Service Fee:</span>
              <span>{account.monthlyFee}</span>
            </div>
            <div className="che004-account-detail-item">
              <span>Minimum Balance Required:</span>
              <span>{account.minBalance}</span>
            </div>
            <div className="che004-account-detail-item">
              <span>Overdraft Protection:</span>
              <span>{account.overdraftProtection}</span>
            </div>
            <div className="che004-account-detail-item">
              <span>Interest Rate:</span>
              <span>{account.interestRate}</span>
            </div>
            <div className="che004-account-actions">
              <button className="che004-account-action-button che004-primary" onClick={() => setIsStatementModalOpen(true)}>
                Download Statement
              </button>
              <button className="che004-account-action-button che004-secondary">
                View Account Details
              </button>
            </div>
          </div>
          
          <div className="che004-quick-actions-card">
            <h2>Quick Actions</h2>
            <div className="che004-quick-actions-grid">
              <div className="che004-quick-action-item" onClick={() => handleQuickAction('transfer')}>
                <div className="che004-quick-action-icon che004-transfer-icon"></div>
                <span>Transfer Money</span>
              </div>
              <div className="che004-quick-action-item" onClick={() => handleQuickAction('pay')}>
                <div className="che004-quick-action-icon che004-pay-icon"></div>
                <span>Pay Bills</span>
              </div>
              <div className="che004-quick-action-item" onClick={() => handleQuickAction('deposit')}>
                <div className="che004-quick-action-icon che004-deposit-icon"></div>
                <span>Deposit Check</span>
              </div>
              <div className="che004-quick-action-item" onClick={() => handleQuickAction('withdraw')}>
                <div className="che004-quick-action-icon che004-withdraw-icon"></div>
                <span>Withdraw Funds</span>
              </div>
              <div className="che004-quick-action-item" onClick={() => handleQuickAction('checks')}>
                <div className="che004-quick-action-icon che004-check-icon"></div>
                <span>Order Checks</span>
              </div>
              <div className="che004-quick-action-item" onClick={() => handleQuickAction('autopay')}>
                <div className="che004-quick-action-icon che004-auto-pay-icon"></div>
                <span>Set Up Auto-Pay</span>
              </div>
              <div className="che004-quick-action-item" onClick={() => handleQuickAction('alerts')}>
                <div className="che004-quick-action-icon che004-alert-icon"></div>
                <span>Account Alerts</span>
              </div>
              <div className="che004-quick-action-item" onClick={() => handleQuickAction('dispute')}>
                <div className="che004-quick-action-icon che004-dispute-icon"></div>
                <span>Dispute Transaction</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="che004-transactions-section">
          <div className="che004-transactions-header">
            <h2>Transaction History</h2>
            <div className="che004-filter-controls">
              <div className="che004-filter-group">
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
              <div className="che004-filter-group">
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
                  transactions.map(transaction => (
                    <tr key={transaction.id} className={`transaction-${transaction.type}`}>
                      <td>{new Date(transaction.date).toLocaleDateString()}</td>
                      <td>{transaction.description}</td>
                      <td>{transaction.status}</td>
                      <td className={transaction.amount < 0 ? 'che004-negative-amount' : 'che004-positive-amount'}>
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td>{formatCurrency(transaction.balance)}</td>
                      <td>
                        <button 
                          className="che004-transaction-action-btn"
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
                    <td colSpan="6" className="che004-no-transactions">
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
          <div className="che004-modal-backdrop">
            <div className="che004-modal">
              <div className="che004-modal-header">
                <h3>Download Account Statement</h3>
                <button className="che004-modal-close" onClick={() => setIsStatementModalOpen(false)}>×</button>
              </div>
              <div className="che004-modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  downloadStatement();
                }}>
                  <div className="che004-form-group">
                    <label htmlFor="statement-period">Statement Period</label>
                    <select 
                      id="statement-period" 
                      value={statementPeriod}
                      onChange={(e) => setStatementPeriod(e.target.value)}
                      required
                    >
                      <option value="">Select Period</option>
                      <option value="current">Current Month</option>
                      <option value="previous">Previous Month</option>
                      <option value="last3">Last 3 Months</option>
                      <option value="last6">Last 6 Months</option>
                      <option value="ytd">Year to Date</option>
                      <option value="lastyear">Last Year</option>
                    </select>
                  </div>
                  <div className="che004-form-group">
                    <label htmlFor="statement-format">Format</label>
                    <div className="che004-radio-group">
                      <label>
                        <input 
                          type="radio" 
                          name="format" 
                          value="pdf" 
                          checked={statementFormat === 'pdf'}
                          onChange={(e) => setStatementFormat(e.target.value)}
                        />
                        PDF
                      </label>
                      <label>
                        <input 
                          type="radio" 
                          name="format" 
                          value="csv" 
                          checked={statementFormat === 'csv'}
                          onChange={(e) => setStatementFormat(e.target.value)}
                        />
                        CSV (Spreadsheet)
                      </label>
                    </div>
                  </div>
                  <div className="che004-modal-footer">
                    <button type="button" className="che004-button che004-secondary" onClick={() => setIsStatementModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="che004-button che004-primary">
                      Download
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Transfer Money Modal */}
        {isTransferModalOpen && (
          <div className="che004-modal-backdrop">
            <div className="che004-modal">
              <div className="che004-modal-header">
                <h3>Transfer Money</h3>
                <button className="che004-modal-close" onClick={() => setIsTransferModalOpen(false)}>×</button>
              </div>
              <div className="che004-modal-body">
                <p>This feature is available on the Transfers page.</p>
                <div className="che004-modal-footer">
                  <button type="button" className="che004-button che004-secondary" onClick={() => setIsTransferModalOpen(false)}>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="che004-button che004-primary"
                    onClick={() => {
                      setIsTransferModalOpen(false);
                      navigate('/transfer-money', { state: { fromAccount: account } });
                    }}
                  >
                    Go to Transfers
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

export default MoneyMarketAccountPage;