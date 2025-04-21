import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

// Create the UserContext
export const UserContext = createContext();

// UserProvider Component
export const UserProvider = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('wellsFargoAuthToken') ? true : false;
  });
  
  // Token state
  const [token, setToken] = useState(() => {
    return localStorage.getItem('wellsFargoAuthToken') || null;
  });

  // User state with localStorage persistence
  const [user, setUser] = useState(() => {
    // Try to load user from localStorage on initial load
    const savedUser = localStorage.getItem('wellsFargoUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
 
  // Accounts state
  const [accounts, setAccounts] = useState([]);
  
  // Available account types (from backend)
  const [availableAccountTypes, setAvailableAccountTypes] = useState([
    {
      type: 'Checking Account',
      description: 'Everyday banking with easy access to your money',
      features: ['No minimum opening deposit', 'Mobile and online banking', '24/7 account access'],
      icon: '💳',
      minDeposit: 25
    },
    {
      type: 'Savings Account',
      description: 'Build your savings with competitive interest rates',
      features: ['Earn interest on your balance', 'Automatic savings options', 'FDIC insured up to $250,000'],
      icon: '💰',
      minDeposit: 100
    },
    {
      type: 'Credit Account',
      description: 'Flexible spending with rewards on every purchase',
      features: ['Cash back rewards', 'No annual fee', 'Fraud protection'],
      icon: '💲',
      minDeposit: 0
    },
    {
      type: 'Retirement Account',
      description: 'Save for your future with tax advantages',
      features: ['Traditional and Roth IRA options', 'Investment choices', 'Retirement planning tools'],
      icon: '🏦',
      minDeposit: 500
    },
    {
      type: 'Investment Account',
      description: 'Grow your wealth through market investments',
      features: ['Stock and ETF trading', 'Portfolio management', 'Investment research tools'],
      icon: '📈',
      minDeposit: 1000
    },
    {
      type: 'Certificate of Deposit',
      description: 'Guaranteed returns with fixed interest rates',
      features: ['Higher interest than savings', 'Terms from 3 months to 5 years', 'FDIC insured'],
      icon: '🔒',
      minDeposit: 1000
    },
    {
      type: 'Money Market Account',
      description: 'Competitive rates with check-writing privileges',
      features: ['Higher interest than checking', 'Limited check writing', 'FDIC insured'],
      icon: '💵',
      minDeposit: 2500
    },
    {
      type: 'Student Account',
      description: 'Designed for students with special benefits',
      features: ['No monthly fees', 'Online and mobile banking', 'Student-specific perks'],
      icon: '🎓',
      minDeposit: 10
    }
  ]);

  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Error state
  const [error, setError] = useState(null);

  // Update localStorage when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('wellsFargoAuthToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('wellsFargoAuthToken');
      delete api.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
    }
  }, [token]);

  // Load dashboard data when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  // Load dashboard data from API
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard');
      
      if (response.data && response.data.success) {
        setUser(response.data.data.user);
        setAccounts(response.data.data.accounts);
        
        // Save user profile to localStorage using the same key as AuthContext
        localStorage.setItem('wellsFargoUser', JSON.stringify(response.data.data.user));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load your account information. Please try logging in again.');
      
      // If there's a 401 error, the token might be invalid or expired
      if (error.response && error.response.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data && response.data.success) {
        // Save token
        setToken(response.data.token);
        
        // Save user data consistent with AuthContext
        if (response.data.user) {
          localStorage.setItem('wellsFargoUser', JSON.stringify(response.data.user));
          setUser(response.data.user);
        }
        
        // Update auth state
        setIsAuthenticated(true);
        
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data && response.data.success) {
        // Save token
        setToken(response.data.token);
        
        // Save user data consistent with AuthContext
        if (response.data.user) {
          localStorage.setItem('wellsFargoUser', JSON.stringify(response.data.user));
          setUser(response.data.user);
        }
        
        // Update auth state
        setIsAuthenticated(true);
        
        return true;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear token and authenticated state
    setToken(null);
    setIsAuthenticated(false);
    
    // Clear user data
    setUser(null);
    setAccounts([]);

    // Clear local storage - use the same keys as AuthContext
    localStorage.removeItem('wellsFargoAuthToken');
    localStorage.removeItem('wellsFargoUser');
    localStorage.removeItem('wellsFargoUserData');
    localStorage.removeItem('wellsFargoAccounts');
    sessionStorage.removeItem('wellsFargoUserData');
    sessionStorage.removeItem('wellsFargoSession');
  };

  // Function to update the user data
  const updateUser = async (newUserData) => {
    setLoading(true);
    try {
      const response = await api.put('/auth/updateprofile', newUserData);
      
      if (response.data && response.data.success) {
        setUser(prevUser => {
          const updatedUser = { ...prevUser, ...response.data.data.user };
          localStorage.setItem('wellsFargoUser', JSON.stringify(updatedUser));
          return updatedUser;
        });
        return true;
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.error || 'Failed to update profile. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to add a new account
  const addAccount = async (newAccount) => {
    if (!isAuthenticated) {
      setError('You must be logged in to add an account');
      return false;
    }
    
    // If this is being called after an API response, just update the state
    if (newAccount && newAccount._id) {
      setAccounts(prev => [...prev, newAccount]);
      return true;
    }
    
    // Otherwise, we need to make an API call
    setLoading(true);
    try {
      const response = await api.post('/dashboard/account', newAccount);
      
      if (response.data && response.data.success) {
        setAccounts(prev => [...prev, response.data.data.account]);
        return true;
      }
    } catch (error) {
      console.error('Error adding account:', error);
      setError(error.response?.data?.error || 'Failed to add account. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to get account details
  const getAccountDetails = async (accountId) => {
    if (!isAuthenticated || !accountId) {
      return null;
    }
    
    setLoading(true);
    try {
      const response = await api.get(`/dashboard/account/${accountId}`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error getting account details:', error);
      setError(error.response?.data?.error || 'Failed to retrieve account details.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Function to transfer money between accounts
  const transferMoney = async (transferData) => {
    if (!isAuthenticated) {
      setError('You must be logged in to transfer money');
      return false;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/dashboard/transfer', transferData);
      
      if (response.data && response.data.success) {
        // Refresh account data to get updated balances
        await loadDashboardData();
        return response.data.data;
      }
    } catch (error) {
      console.error('Error transferring money:', error);
      setError(error.response?.data?.error || 'Failed to complete transfer. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{
      isAuthenticated,
      token,
      user,
      accounts,
      availableAccountTypes,
      loading,
      error,
      setError,
      login,
      register,
      logout,
      updateUser,
      addAccount,
      getAccountDetails,
      transferMoney,
      loadDashboardData
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for easy context access
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;