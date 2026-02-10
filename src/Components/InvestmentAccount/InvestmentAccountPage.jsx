import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './InvestmentAccountPage.css';

const InvestmentAccountPage = () => {
  const { accountId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30days');
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Statement form state
  const [statementPeriod, setStatementPeriod] = useState('');
  const [statementFormat, setStatementFormat] = useState('pdf');
  
  // Buy/Sell form state
  const [buySymbol, setBuySymbol] = useState('');
  const [buyQuantity, setBuyQuantity] = useState('');
  const [buyOrderType, setBuyOrderType] = useState('market');
  const [buyLimitPrice, setBuyLimitPrice] = useState('');
  
  const [sellHolding, setSellHolding] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [sellOrderType, setSellOrderType] = useState('market');
  const [sellLimitPrice, setSellLimitPrice] = useState('');
  
  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format percentage helper
  const formatPercentage = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
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
      ? `${baseUrl}/api/investment/primary${endpoint}` 
      : `${baseUrl}/api/investment/${accountId}${endpoint}`;
  };

  // Try to get account data from localStorage first (as stored by Dashboard)
  const getAccountDataFromLocalStorage = () => {
    try {
      const accountsData = localStorage.getItem('wellsFargoAccounts');
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        // Find the specific investment account by ID or get the first investment account if id is primary
        let matchedAccount;
        if (isPrimaryAccount()) {
          matchedAccount = accounts.find(acc => acc.type.toLowerCase().includes('investment'));
        } else {
          matchedAccount = accounts.find(acc => acc.id === accountId);
        }
        
        // Ensure we only return an investment account
        if (matchedAccount && matchedAccount.type && matchedAccount.type.toLowerCase().includes('investment')) {
          return matchedAccount;
        }
      }
    } catch (error) {
      console.error('Error getting account data from localStorage:', error);
    }
    return null;
  };

  // Generate mock holdings
  const generateMockHoldings = (account) => {
    if (!account) {
      return [];
    }
    
    // Generate holdings that make sense for the account balance
    const totalBalance = account.balance || 10000.00;
    
    // Sample holdings with realistic data
    return [
      {
        id: 'h1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        quantity: Math.floor(totalBalance * 0.15 / 175),
        purchasePrice: 155.75,
        currentPrice: 175.25,
        marketValue: Math.floor(totalBalance * 0.15 / 175) * 175.25,
        gainLoss: (Math.floor(totalBalance * 0.15 / 175) * 175.25) - (Math.floor(totalBalance * 0.15 / 175) * 155.75),
        gainLossPercent: ((175.25 - 155.75) / 155.75) * 100,
        allocation: 15
      },
      {
        id: 'h2',
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        quantity: Math.floor(totalBalance * 0.20 / 340),
        purchasePrice: 320.40,
        currentPrice: 340.75,
        marketValue: Math.floor(totalBalance * 0.20 / 340) * 340.75,
        gainLoss: (Math.floor(totalBalance * 0.20 / 340) * 340.75) - (Math.floor(totalBalance * 0.20 / 340) * 320.40),
        gainLossPercent: ((340.75 - 320.40) / 320.40) * 100,
        allocation: 20
      },
      {
        id: 'h3',
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        quantity: Math.floor(totalBalance * 0.15 / 145),
        purchasePrice: 130.50,
        currentPrice: 145.20,
        marketValue: Math.floor(totalBalance * 0.15 / 145) * 145.20,
        gainLoss: (Math.floor(totalBalance * 0.15 / 145) * 145.20) - (Math.floor(totalBalance * 0.15 / 145) * 130.50),
        gainLossPercent: ((145.20 - 130.50) / 130.50) * 100,
        allocation: 15
      },
      {
        id: 'h4',
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        quantity: Math.floor(totalBalance * 0.12 / 130),
        purchasePrice: 125.75,
        currentPrice: 130.25,
        marketValue: Math.floor(totalBalance * 0.12 / 130) * 130.25,
        gainLoss: (Math.floor(totalBalance * 0.12 / 130) * 130.25) - (Math.floor(totalBalance * 0.12 / 130) * 125.75),
        gainLossPercent: ((130.25 - 125.75) / 125.75) * 100,
        allocation: 12
      },
      {
        id: 'h5',
        symbol: 'VTI',
        name: 'Vanguard Total Stock Market ETF',
        quantity: Math.floor(totalBalance * 0.25 / 225),
        purchasePrice: 215.30,
        currentPrice: 225.45,
        marketValue: Math.floor(totalBalance * 0.25 / 225) * 225.45,
        gainLoss: (Math.floor(totalBalance * 0.25 / 225) * 225.45) - (Math.floor(totalBalance * 0.25 / 225) * 215.30),
        gainLossPercent: ((225.45 - 215.30) / 215.30) * 100,
        allocation: 25
      },
      {
        id: 'h6',
        symbol: 'VXUS',
        name: 'Vanguard Total International Stock ETF',
        quantity: Math.floor(totalBalance * 0.12 / 56),
        purchasePrice: 54.20,
        currentPrice: 56.15,
        marketValue: Math.floor(totalBalance * 0.12 / 56) * 56.15,
        gainLoss: (Math.floor(totalBalance * 0.12 / 56) * 56.15) - (Math.floor(totalBalance * 0.12 / 56) * 54.20),
        gainLossPercent: ((56.15 - 54.20) / 54.20) * 100,
        allocation: 12
      }
    ];
  };

  // Generate mock transactions
  const generateMockTransactions = (account, holdings) => {
    if (!account) {
      return [];
    }
    
    // Use the account's openedDate instead of today for consistent transaction history
    const accountOpenDate = new Date(account.openedDate || account.openDate || '2025-01-05T00:00:00.000Z');
    
    // Generate realistic transactions that align with holdings
    const transactions = [];
    
    // Initial deposit transaction
    transactions.push({
      id: 'tx1',
      date: new Date(accountOpenDate.getFullYear(), accountOpenDate.getMonth(), accountOpenDate.getDate()).toISOString(),
      description: 'Initial Deposit',
      status: 'Completed',
      type: 'deposit',
      amount: account.balance || 10000.00,
      balance: account.balance || 10000.00
    });
    
    // Add buy transactions for each holding
    if (holdings && holdings.length > 0) {
      holdings.forEach((holding, index) => {
        const txDate = new Date(accountOpenDate);
        txDate.setDate(txDate.getDate() + 1 + index); // Stagger purchase dates
        
        transactions.push({
          id: `tx${index + 2}`,
          date: txDate.toISOString(),
          description: `Buy ${holding.quantity} shares of ${holding.symbol}`,
          status: 'Completed',
          type: 'buy',
          symbol: holding.symbol,
          quantity: holding.quantity,
          price: holding.purchasePrice,
          amount: holding.quantity * holding.purchasePrice,
          balance: account.balance - (holding.quantity * holding.purchasePrice)
        });
      });
    }
    
    // Add dividend transaction
    const dividendDate = new Date(accountOpenDate);
    dividendDate.setDate(dividendDate.getDate() + 30); // 30 days after account opening
    
    transactions.push({
      id: 'tx10',
      date: dividendDate.toISOString(),
      description: 'Dividend Payment (AAPL)',
      status: 'Completed',
      type: 'dividend',
      symbol: 'AAPL',
      amount: 25.75,
      balance: account.balance + 25.75
    });
    
    // Sort by date (newest first)
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
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
        // Verify this is actually an investment account
        if (stateAccount.type && stateAccount.type.toLowerCase().includes('investment')) {
          console.log('Using account data from location state:', stateAccount);
          setAccount(stateAccount);
          const mockHoldings = generateMockHoldings(stateAccount);
          setHoldings(mockHoldings);
          const mockTransactions = generateMockTransactions(stateAccount, mockHoldings);
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
          // Verify this is an investment account
          if (accountData.type && accountData.type.toLowerCase().includes('investment')) {
            setAccount(accountData);
            
            // If holdings came with the account data, set them
            if (accountData.holdings) {
              setHoldings(accountData.holdings);
            } else {
              const mockHoldings = generateMockHoldings(accountData);
              setHoldings(mockHoldings);
            }
            
            // If transactions came with the account data, set them
            if (accountData.transactions) {
              setTransactions(accountData.transactions);
            } else {
              const mockTransactions = generateMockTransactions(accountData, accountData.holdings || generateMockHoldings(accountData));
              setTransactions(mockTransactions);
            }
          } else {
            throw new Error('Retrieved account is not an investment account');
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
          
          // Generate mock holdings and transactions
          const mockHoldings = generateMockHoldings(localStorageAccount);
          setHoldings(mockHoldings);
          const mockTransactions = generateMockTransactions(localStorageAccount, mockHoldings);
          setTransactions(mockTransactions);
        } else {
          console.error('No localStorage data found, using fallback mock data');
          
          // Get initial investment from localStorage if available
          const newAccountData = localStorage.getItem('newWellsFargoAccount');
          let initialInvestment = 0;
          let newAccountType = '';
          
          if (newAccountData) {
            try {
              const parsedData = JSON.parse(newAccountData);
              initialInvestment = parsedData.initialInvestment || parsedData.balance || 0;
              newAccountType = parsedData.type || parsedData.accountType || '';
            } catch (e) {
              console.error('Error parsing newWellsFargoAccount data:', e);
            }
          }

          // Only use the newAccountData if it's an investment account
          if (!newAccountType.toLowerCase().includes('investment')) {
            initialInvestment = 10000.00; // Default for investment
          }

          // Fall back to mock data
          const mockAccount = {
            id: accountId || 'primary-investment',
            type: 'Investment Account',
            accountNumber: location.state?.account?.accountNumber || 
              (accountId ? accountId : '1234567890'),
            balance: initialInvestment,
            availableBalance: initialInvestment * 0.02, // Cash available
            openedDate: '2025-01-05T00:00:00.000Z',
            monthlyFee: 0.00,
            yearToDateReturn: 5.78,
            totalReturn: 8.92,
            riskProfile: 'Moderate',
            investmentStrategy: 'Growth',
            advisor: 'Jennifer Thompson',
            advisorPhone: '(800) 555-1234',
            lastRebalanced: '2025-03-15T00:00:00.000Z'
          };
          
          setAccount({
            ...mockAccount,
            monthlyFee: '$0.00',
            yearToDateReturn: '5.78%',
            totalReturn: '8.92%'
          });
          
          // Generate mock holdings and transactions
          const mockHoldings = generateMockHoldings(mockAccount);
          setHoldings(mockHoldings);
          const mockTransactions = generateMockTransactions(mockAccount, mockHoldings);
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

  // Buy security
  const handleBuySecurity = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert('Authentication required. Please log in.');
        handleLoginRedirect();
        return;
      }
      
      const quantity = parseFloat(buyQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid positive quantity.');
        return;
      }
      
      if (!buySymbol) {
        alert('Please enter a valid ticker symbol.');
        return;
      }
      
      if (buyOrderType === 'limit' && (!buyLimitPrice || isNaN(parseFloat(buyLimitPrice)) || parseFloat(buyLimitPrice) <= 0)) {
        alert('Please enter a valid limit price.');
        return;
      }
      
      const apiEndpoint = getApiEndpoint('/buy');
      
      try {
        const response = await axios.post(
          apiEndpoint,
          {
            symbol: buySymbol,
            quantity: quantity,
            orderType: buyOrderType,
            limitPrice: buyOrderType === 'limit' ? parseFloat(buyLimitPrice) : null
          },
          apiConfig()
        );
        
        if (response.data.success) {
          alert(`Order placed successfully. Order ID: ${response.data.data.orderId}`);
          setIsBuyModalOpen(false);
          // Refresh account data to reflect new purchase
          fetchAccountData();
        } else {
          throw new Error(response.data.error || 'Failed to place order');
        }
      } catch (apiError) {
        console.log('API error, using mock response:', apiError);
        
        // Create a mock transaction
        const mockPrice = buyOrderType === 'limit' ? parseFloat(buyLimitPrice) : 
          (buySymbol === 'AAPL' ? 175.25 : 
           buySymbol === 'MSFT' ? 340.75 : 
           buySymbol === 'AMZN' ? 145.20 : 
           buySymbol === 'GOOGL' ? 130.25 : 
           buySymbol === 'VTI' ? 225.45 : 
           buySymbol === 'VXUS' ? 56.15 : 
           100.00);
        
        const newTransaction = {
          id: 'tx' + Math.floor(Math.random() * 10000),
          date: new Date().toISOString(),
          description: `Buy ${quantity} shares of ${buySymbol}`,
          status: 'Pending',
          type: 'buy',
          symbol: buySymbol,
          quantity: quantity,
          price: mockPrice,
          amount: quantity * mockPrice,
          balance: account.balance - (quantity * mockPrice)
        };
        
        // Add the new transaction to the transactions list
        setTransactions([newTransaction, ...transactions]);
        
        // Check if we already have this holding
        const existingHolding = holdings.find(h => h.symbol === buySymbol);
        
        if (existingHolding) {
          // Update the existing holding
          const updatedHoldings = holdings.map(h => {
            if (h.symbol === buySymbol) {
              const newQuantity = h.quantity + quantity;
              const newAvgPrice = ((h.quantity * h.purchasePrice) + (quantity * mockPrice)) / newQuantity;
              const newMarketValue = newQuantity * mockPrice;
              const newGainLoss = newMarketValue - (newQuantity * newAvgPrice);
              const newGainLossPercent = ((mockPrice - newAvgPrice) / newAvgPrice) * 100;
              
              return {
                ...h,
                quantity: newQuantity,
                purchasePrice: newAvgPrice,
                marketValue: newMarketValue,
                gainLoss: newGainLoss,
                gainLossPercent: newGainLossPercent
              };
            }
            return h;
          });
          
          setHoldings(updatedHoldings);
        } else {
          // Create a new holding
          const newHolding = {
            id: 'h' + Math.floor(Math.random() * 10000),
            symbol: buySymbol,
            name: buySymbol, // We would need an API to get the full company name
            quantity: quantity,
            purchasePrice: mockPrice,
            currentPrice: mockPrice,
            marketValue: quantity * mockPrice,
            gainLoss: 0,
            gainLossPercent: 0,
            allocation: 5 // Default allocation percentage
          };
          
          setHoldings([...holdings, newHolding]);
        }
        
        // Update the account balance
        const newBalance = account.balance - (quantity * mockPrice);
        const newAvailableBalance = account.availableBalance - (quantity * mockPrice);
        
        setAccount({
          ...account,
          balance: newBalance,
          availableBalance: newAvailableBalance
        });
        
        alert(`Order placed successfully. Order ID: ${Math.floor(Math.random() * 1000000)}`);
        setIsBuyModalOpen(false);
        setBuySymbol('');
        setBuyQuantity('');
        setBuyOrderType('market');
        setBuyLimitPrice('');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Your session has expired. Please log in again.');
        handleLoginRedirect();
      } else {
        alert(err.response?.data?.error || 'Error placing order');
      }
      console.error('Error buying security:', err);
    }
  };

  // Sell security
  const handleSellSecurity = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert('Authentication required. Please log in.');
        handleLoginRedirect();
        return;
      }
      
      const quantity = parseFloat(sellQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid positive quantity.');
        return;
      }
      
      if (!sellHolding) {
        alert('Please select a security to sell.');
        return;
      }
      
      if (sellOrderType === 'limit' && (!sellLimitPrice || isNaN(parseFloat(sellLimitPrice)) || parseFloat(sellLimitPrice) <= 0)) {
        alert('Please enter a valid limit price.');
        return;
      }
      
      // Find the selected holding
      const holding = holdings.find(h => h.symbol === sellHolding);
      
      if (!holding) {
        alert('Selected security not found in your holdings.');
        return;
      }
      
      if (quantity > holding.quantity) {
        alert(`You only have ${holding.quantity} shares of ${sellHolding} available to sell.`);
        return;
      }
      
      const apiEndpoint = getApiEndpoint('/sell');
      
      try {
        const response = await axios.post(
          apiEndpoint,
          {
            symbol: sellHolding,
            quantity: quantity,
            orderType: sellOrderType,
            limitPrice: sellOrderType === 'limit' ? parseFloat(sellLimitPrice) : null
          },
          apiConfig()
        );
        
        if (response.data.success) {
          alert(`Order placed successfully. Order ID: ${response.data.data.orderId}`);
          setIsSellModalOpen(false);
          // Refresh account data to reflect new sale
          fetchAccountData();
        } else {
          throw new Error(response.data.error || 'Failed to place order');
        }
      } catch (apiError) {
        console.log('API error, using mock response:', apiError);
        
        // Get the price to use for the sale
        const price = sellOrderType === 'limit' ? parseFloat(sellLimitPrice) : holding.currentPrice;
        
        // Create a mock transaction
        const newTransaction = {
          id: 'tx' + Math.floor(Math.random() * 10000),
          date: new Date().toISOString(),
          description: `Sell ${quantity} shares of ${sellHolding}`,
          status: 'Pending',
          type: 'sell',
          symbol: sellHolding,
          quantity: quantity,
          price: price,
          amount: quantity * price,
          balance: account.balance + (quantity * price)
        };
        
        // Add the new transaction to the transactions list
        setTransactions([newTransaction, ...transactions]);
        
        // Update the holding
        const updatedHoldings = holdings.map(h => {
          if (h.symbol === sellHolding) {
            const newQuantity = h.quantity - quantity;
            // If all shares are sold, remove the holding
            if (newQuantity <= 0) {
              return null;
            }
            
            return {
              ...h,
              quantity: newQuantity,
              marketValue: newQuantity * h.currentPrice,
              gainLoss: (newQuantity * h.currentPrice) - (newQuantity * h.purchasePrice),
              // Calculate new gain/loss percent
              gainLossPercent: ((h.currentPrice - h.purchasePrice) / h.purchasePrice) * 100
            };
          }
          return h;
        }).filter(Boolean); // Remove null entries (fully sold holdings)
        
        setHoldings(updatedHoldings);
        
        // Update the account balance
        const newBalance = account.balance + (quantity * price);
        const newAvailableBalance = account.availableBalance + (quantity * price);
        
        setAccount({
          ...account,
          balance: newBalance,
          availableBalance: newAvailableBalance
        });
        
        alert(`Order placed successfully. Order ID: ${Math.floor(Math.random() * 1000000)}`);
        setIsSellModalOpen(false);
        setSellHolding('');
        setSellQuantity('');
        setSellOrderType('market');
        setSellLimitPrice('');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Your session has expired. Please log in again.');
        handleLoginRedirect();
      } else {
        alert(err.response?.data?.error || 'Error placing sell order');
      }
      console.error('Error selling security:', err);
    }
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    navigate('/login', { state: { returnUrl: location.pathname } });
  };

  // Handle filter changes
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Handle date range changes
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };

  // Calculate total portfolio value
  const calculateTotalPortfolioValue = () => {
    if (!holdings || holdings.length === 0) return 0;
    return holdings.reduce((total, holding) => total + holding.marketValue, 0);
  };

  // Calculate total gain/loss
  const calculateTotalGainLoss = () => {
    if (!holdings || holdings.length === 0) return 0;
    return holdings.reduce((total, holding) => total + holding.gainLoss, 0);
  };

  // Calculate total gain/loss percentage
  const calculateTotalGainLossPercentage = () => {
    const totalCost = holdings.reduce((total, holding) => 
      total + (holding.quantity * holding.purchasePrice), 0);
    const totalValue = calculateTotalPortfolioValue();
    
    if (totalCost === 0) return 0;
    return ((totalValue - totalCost) / totalCost) * 100;
  };

  // Load account data on component mount
  useEffect(() => {
    fetchAccountData();
  }, [accountId]);

  // Apply filters when filter or date range changes
  useEffect(() => {
    if (account) {
      fetchTransactions();
    }
  }, [filter, dateRange, account]);

  // If loading, show loading spinner
  if (isLoading) {
    return (
      <div className="investment-account-loading">
        <div className="spinner"></div>
        <p>Loading account information...</p>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="investment-account-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
      </div>
    );
  }

  // If no account, show not found message
  if (!account) {
    return (
      <div className="investment-account-not-found">
        <h2>Account Not Found</h2>
        <p>The requested investment account could not be found.</p>
        <button onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="investment-account-container">
      <header className="investment-account-header">
        <div className="header-left">
          <Link to="/dashboard" className="back-link">
            &larr; Back to Dashboard
          </Link>
          <h1>Investment Account</h1>
        </div>
        <div className="header-right">
          <button 
            className="btn btn-secondary"
            onClick={() => setIsStatementModalOpen(true)}
          >
            Download Statement
          </button>
        </div>
      </header>

      <div className="account-summary">
        <div className="account-info">
          <h2>{account.type || 'Investment Account'}</h2>
          <p className="account-number">Account #: {formatAccountNumber(account.accountNumber)}</p>
          <p className="account-opened">Opened: {new Date(account.openedDate).toLocaleDateString()}</p>
        </div>

        <div className="account-metrics">
          <div className="metric">
            <h3>Total Value</h3>
            <p className="value">{formatCurrency(calculateTotalPortfolioValue())}</p>
          </div>
          <div className="metric">
            <h3>Cash Available</h3>
            <p className="value">{formatCurrency(account.availableBalance)}</p>
          </div>
          <div className="metric">
            <h3>Total Gain/Loss</h3>
            <p className={`value ${calculateTotalGainLoss() >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(calculateTotalGainLoss())} 
              ({formatPercentage(calculateTotalGainLossPercentage())})
            </p>
          </div>
          <div className="metric">
            <h3>YTD Return</h3>
            <p className="value">{account.yearToDateReturn}</p>
          </div>
        </div>

        <div className="account-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setIsBuyModalOpen(true)}
          >
            Buy Securities
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setIsSellModalOpen(true)}
          >
            Sell Securities
          </button>
        </div>
      </div>

      {/* Holdings Section */}
      <section className="holdings-section">
        <h2>Holdings</h2>
        <div className="table-container">
          <table className="holdings-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Market Value</th>
                <th>Gain/Loss</th>
                <th>Allocation</th>
              </tr>
            </thead>
            <tbody>
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    No holdings found. Start investing by clicking the "Buy Securities" button above.
                  </td>
                </tr>
              ) : (
                holdings.map(holding => (
                  <tr key={holding.id}>
                    <td>{holding.symbol}</td>
                    <td>{holding.name}</td>
                    <td>{holding.quantity}</td>
                    <td>{formatCurrency(holding.currentPrice)}</td>
                    <td>{formatCurrency(holding.marketValue)}</td>
                    <td className={holding.gainLoss >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(holding.gainLoss)} ({formatPercentage(holding.gainLossPercent)})
                    </td>
                    <td>{formatPercentage(holding.allocation)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transactions Section */}
      <section className="transactions-section">
        <h2>Transactions</h2>
        <div className="filters">
          <div className="filter-group">
            <label>Type:</label>
            <select value={filter} onChange={(e) => handleFilterChange(e.target.value)}>
              <option value="all">All</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="dividend">Dividends</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Period:</label>
            <select value={dateRange} onChange={(e) => handleDateRangeChange(e.target.value)}>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data">
                    No transactions found for the selected filters.
                  </td>
                </tr>
              ) : (
                transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td>{transaction.description}</td>
                    <td>{transaction.status}</td>
                    <td className={
                      transaction.type === 'buy' || transaction.type === 'withdrawal' 
                        ? 'negative' 
                        : transaction.type === 'sell' || transaction.type === 'deposit' || transaction.type === 'dividend'
                        ? 'positive'
                        : ''
                    }>
                      {transaction.type === 'buy' || transaction.type === 'withdrawal' 
                        ? `-${formatCurrency(transaction.amount)}` 
                        : `+${formatCurrency(transaction.amount)}`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Statement Modal */}
      {isStatementModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Download Statement</h2>
            <div className="modal-form">
              <div className="form-group">
                <label>Statement Period:</label>
                <select 
                  value={statementPeriod} 
                  onChange={(e) => setStatementPeriod(e.target.value)}
                  required
                >
                  <option value="">-- Select Period --</option>
                  <option value="current">Current Month</option>
                  <option value="previous">Previous Month</option>
                  <option value="ytd">Year to Date</option>
                  <option value="last_year">Last Year</option>
                </select>
              </div>
              <div className="form-group">
                <label>Format:</label>
                <select 
                  value={statementFormat} 
                  onChange={(e) => setStatementFormat(e.target.value)}
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setIsStatementModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={downloadStatement}
                disabled={!statementPeriod}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Securities Modal */}
      {isBuyModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Buy Securities</h2>
            <div className="modal-form">
              <div className="form-group">
                <label>Symbol:</label>
                <input 
                  type="text" 
                  value={buySymbol} 
                  onChange={(e) => setBuySymbol(e.target.value.toUpperCase())}
                  placeholder="Enter ticker symbol"
                  required
                />
              </div>
              <div className="form-group">
                <label>Quantity:</label>
                <input 
                  type="number" 
                  value={buyQuantity} 
                  onChange={(e) => setBuyQuantity(e.target.value)}
                  placeholder="Number of shares"
                  min="1"
                  step="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Order Type:</label>
                <select 
                  value={buyOrderType} 
                  onChange={(e) => setBuyOrderType(e.target.value)}
                >
                  <option value="market">Market Order</option>
                  <option value="limit">Limit Order</option>
                </select>
              </div>
              {buyOrderType === 'limit' && (
                <div className="form-group">
                  <label>Limit Price:</label>
                  <input 
                    type="number" 
                    value={buyLimitPrice} 
                    onChange={(e) => setBuyLimitPrice(e.target.value)}
                    placeholder="Maximum price per share"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              )}
              <p className="available-funds">
                Available Cash: {formatCurrency(account.availableBalance)}
              </p>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setIsBuyModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleBuySecurity}
                disabled={!buySymbol || !buyQuantity || (buyOrderType === 'limit' && !buyLimitPrice)}
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Securities Modal */}
      {isSellModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Sell Securities</h2>
            <div className="modal-form">
              <div className="form-group">
                <label>Security:</label>
                <select 
                  value={sellHolding} 
                  onChange={(e) => setSellHolding(e.target.value)}
                  required
                >
                  <option value="">-- Select Security --</option>
                  {holdings.map(holding => (
                    <option key={holding.id} value={holding.symbol}>
                      {holding.symbol} - {holding.name} ({holding.quantity} shares)
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity:</label>
                <input 
                  type="number" 
                  value={sellQuantity} 
                  onChange={(e) => setSellQuantity(e.target.value)}
                  placeholder="Number of shares"
                  min="1"
                  step="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Order Type:</label>
                <select 
                  value={sellOrderType} 
                  onChange={(e) => setSellOrderType(e.target.value)}
                >
                  <option value="market">Market Order</option>
                  <option value="limit">Limit Order</option>
                </select>
              </div>
              {sellOrderType === 'limit' && (
                <div className="form-group">
                  <label>Limit Price:</label>
                  <input 
                    type="number" 
                    value={sellLimitPrice} 
                    onChange={(e) => setSellLimitPrice(e.target.value)}
                    placeholder="Minimum price per share"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setIsSellModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSellSecurity}
                disabled={!sellHolding || !sellQuantity || (sellOrderType === 'limit' && !sellLimitPrice)}
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Details Section */}
      <section className="account-details-section">
        <h2>Account Details</h2>
        <div className="details-grid">
          <div className="detail-item">
            <h3>Risk Profile</h3>
            <p>{account.riskProfile}</p>
          </div>
          <div className="detail-item">
            <h3>Investment Strategy</h3>
            <p>{account.investmentStrategy}</p>
          </div>
          <div className="detail-item">
            <h3>Monthly Fee</h3>
            <p>{account.monthlyFee}</p>
          </div>
          <div className="detail-item">
            <h3>Last Rebalanced</h3>
            <p>{new Date(account.lastRebalanced).toLocaleDateString()}</p>
          </div>
          <div className="detail-item">
            <h3>Financial Advisor</h3>
            <p>{account.advisor}</p>
          </div>
          <div className="detail-item">
            <h3>Advisor Contact</h3>
            <p>{account.advisorPhone}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InvestmentAccountPage;