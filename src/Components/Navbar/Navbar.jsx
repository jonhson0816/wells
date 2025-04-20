import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../Context/UserContext';
import { useAuth } from '../../Context/AuthContext';
import './Navbar.css';

// Security Verification Modal Component
const SecurityVerificationModal = ({ isOpen, onClose, onVerify, targetPath }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  // Valid verification codes
  const validCodes = ['WFBPLC09!', 'WFBUSA09!', 'WFBAFC09!', 'WFBEUR09!'];

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

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use UserContext to match the same data source as UserProfile
  const { user, setUser } = useUser();
  
  // Also use the Auth context for logout and authentication state
  const { currentUser, logout, loading, isAuthenticated } = useAuth();
  
  // State for security verification modal
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);
  
  // Determine if we're on a protected route
  const isProtectedRoute = location.pathname !== '/' && 
                           !location.pathname.includes('/login') && 
                           !location.pathname.includes('/register');

  useEffect(() => {
  const syncUserData = () => {
    // Try to get the most complete user data from all available sources
    let combinedData = {};
    
    // First check localStorage for the most up-to-date profile data
    try {
      const storedProfile = localStorage.getItem('wellsFargoUserProfile');
      if (storedProfile) {
        combinedData = {...combinedData, ...JSON.parse(storedProfile)};
      } else {
        // Fall back to main user storage if profile-specific storage is empty
        const mainUserData = localStorage.getItem('wellsFargoUser');
        if (mainUserData) {
          combinedData = {...combinedData, ...JSON.parse(mainUserData)};
        }
      }
    } catch (error) {
      console.error('Error loading user data from localStorage:', error);
    }
    
    // Then merge with currentUser data
    if (currentUser && Object.keys(currentUser).length > 0) {
      combinedData = {...combinedData, ...currentUser};
    }
    
    // Then merge with user context data
    if (user && Object.keys(user).length > 0) {
      combinedData = {...combinedData, ...user};
    }
    
    // Only update if we have meaningful data and setUser exists
    if (Object.keys(combinedData).length > 0 && typeof setUser === 'function') {
      setUser(combinedData);
    }
  };
  
  syncUserData();
}, [currentUser, user, setUser]);

  // Redirect to login if not authenticated and trying to access protected route
  useEffect(() => {
    // Check authentication status and redirect if needed - but only after loading completes
    if (!loading && isProtectedRoute && !isAuthenticated()) {
      navigate('/', { state: { showLogin: true } });
    }
  }, [loading, isProtectedRoute, navigate, isAuthenticated]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handler for navigation that requires verification
  const handleSecureNavigation = (path) => {
    setPendingPath(path);
    setSecurityModalOpen(true);
    // Close mobile menu if open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  // Verification successful handler
  const handleVerificationSuccess = (path) => {
    setSecurityModalOpen(false);
    navigate(path);
  };

  const handleNavigation = (path) => {
    // Only navigate if user is authenticated
    if (currentUser && currentUser.id) {
      navigate(path);
    } else {
      // If not authenticated, navigate to login
      navigate('/', { state: { showLogin: true } });
    }
    setIsMobileMenuOpen(false);
  };

  // Handle direct navigation to protected pages
  const navigateToSecurePage = (path) => {
    handleSecureNavigation(path);
  };

  // Handle logo/title click
  const handleLogoClick = () => {
    // Only navigate to dashboard if user is authenticated
    if (currentUser && currentUser.id) {
      navigate('/dashboard');
    } else {
      // If not authenticated, navigate to home
      navigate('/');
    }
  };

  // Handle logout - completely clear user session
  const handleLogout = async () => {
    try {
      // Use AuthContext logout function
      await logout();
      
      // Clear user state in UserContext as well, but preserve minimal structure
      setUser({});
      
      // Navigate to landing page
      navigate('/');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Open login modal directly from navbar
  const handleOpenLogin = (e) => {
    e.preventDefault();
    navigate('/', { state: { showLogin: true } });
    setIsMobileMenuOpen(false);
  };

  // Open register modal directly from navbar
  const handleOpenRegister = (e) => {
    e.preventDefault();
    navigate('/', { state: { showRegister: true } });
    setIsMobileMenuOpen(false);
  };

  // Safe way to get initials
  // Safe way to get initials - prioritize data from all sources
const getUserInitials = () => {
  // Try to get the most complete user data
  const userData = user || currentUser || {};
  
  // If we have localStorage data, prefer that for consistency with profile page
  try {
    const storedProfile = localStorage.getItem('wellsFargoUserProfile');
    if (storedProfile) {
      const profileData = JSON.parse(storedProfile);
      if (profileData.firstName && profileData.lastName) {
        return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();
      }
    }
  } catch (error) {
    console.error('Error accessing localStorage for initials:', error);
  }
  
  // Fall back to context data
  const firstName = userData.firstName || '';
  const lastName = userData.lastName || '';
  
  if (!firstName && !lastName) return 'GU';
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

  // Format phone number
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phoneNumber;
  };

  // If auth is still loading, show a simplified navbar with loading indicator
  if (loading) {
    return (
      <nav className="wells-fargo-navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <div className="dash002 header-content">
              <img
                src="/Images/wells fargo.jpeg"
                alt="Wells Fargo Logo"
                className="dash002 logo"
              />
            </div>
            <span className="navbar-title">Wells Fargo</span>
          </div>
          <div className="loading-indicator">Loading...</div>
        </div>
      </nav>
    );
  }

  // Determine authentication status using both current user and localStorage check
  const userIsAuthenticated = !!(currentUser && currentUser.id) || isAuthenticated();
  

  return (
    <nav className="wells-fargo-navbar">
      <div className="navbar-container">
        {/* Logo and Title - always visible and freely accessible */}
        <div
          className={`navbar-logo ${userIsAuthenticated ? 'clickable' : ''}`}
          onClick={handleLogoClick}
          style={{ cursor: userIsAuthenticated ? 'pointer' : 'default' }}
        >
          <div className="dash002 header-content">
            <img
              src="/Images/wells fargo.jpeg" 
              alt="Wells Fargo Logo" 
              className="dash002 logo"
              style={{ cursor: 'pointer' }}
            />
          </div>
          <span className="navbar-title">Wells Fargo</span>
        </div>
        
        {/* Mobile Menu Toggle */}
        <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        
        {/* Desktop Navigation Links - Conditional based on auth state */}
        <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {userIsAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              {/* Secured links that require verification */}
              <a href="#" onClick={(e) => { e.preventDefault(); navigateToSecurePage('/profile'); }}>Profile</a>
              <a href="#" onClick={(e) => { e.preventDefault(); navigateToSecurePage('/accounts'); }}>Accounts</a>
              <a href="#" onClick={(e) => { e.preventDefault(); navigateToSecurePage('/transfers'); }}>Transfers</a>
              <button className="navbar-logout-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <a href="#" onClick={handleOpenLogin}>Login</a>
              <a href="#" onClick={handleOpenRegister}>Register</a>
            </>
          )}
        </div>
        
        {/* User Profile Section - Only show if logged in - requires verification */}
        {userIsAuthenticated && (
          <div
            className="navbar-user-profile"
            onClick={() => navigateToSecurePage('/profile')}
            style={{ cursor: 'pointer' }}
          >
            {user?.profilePicture || currentUser?.profilePicture ? (
              <img
                src={user?.profilePicture || currentUser?.profilePicture}
                alt="User Profile"
                className="user-profile-image"
              />
            ) : (
              <div className="user-profile-image placeholder-image">
                {getUserInitials()}
              </div>
            )}
            <span className="user-name">
              {user?.firstName || currentUser?.firstName || 'Guest'} {user?.lastName || currentUser?.lastName || ''}
            </span>
          </div>
        )}
      </div>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={toggleMobileMenu}>
          <div
            className="mobile-menu-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile User Profile */}
            {userIsAuthenticated ? (
              <div 
                className="mobile-user-profile" 
                onClick={() => {
                  toggleMobileMenu();
                  navigateToSecurePage('/profile');
                }}
              >
                {currentUser?.profilePicture ? (
                  <img
                    src={currentUser.profilePicture}
                    alt="User Profile"
                    className="mobile-profile-image"
                  />
                ) : (
                  <div className="mobile-placeholder-image">
                    {getUserInitials()}
                  </div>
                )}
                <div className="mobile-user-details">
                  <span className="mobile-user-name">
                    {currentUser?.firstName || 'Guest'} {currentUser?.lastName || ''}
                  </span>
                  <span className="mobile-user-email">
                    {currentUser?.email || 'No email provided'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mobile-guest-profile">
                <div className="mobile-placeholder-image">
                  GU
                </div>
                <div className="mobile-user-details">
                  <span className="mobile-user-name">Guest User</span>
                  <span className="mobile-user-email">
                    Not logged in
                  </span>
                </div>
              </div>
            )}

            {/* Mobile Navigation Links - Conditional based on auth state */}
            <nav className="mobile-nav-links">
              {userIsAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={toggleMobileMenu}>Dashboard</Link>
                  {/* Secured links that require verification */}
                  <a href="#" onClick={() => { 
                    toggleMobileMenu(); 
                    navigateToSecurePage('/profile'); 
                  }}>Profile</a>
                  <a href="#" onClick={() => { 
                    toggleMobileMenu(); 
                    navigateToSecurePage('/accounts'); 
                  }}>Accounts</a>
                  <a href="#" onClick={() => { 
                    toggleMobileMenu(); 
                    navigateToSecurePage('/transfers'); 
                  }}>Transfers</a>
                  <button 
                    className="mobile-logout-btn" 
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a href="#" onClick={handleOpenLogin}>Login</a>
                  <a href="#" onClick={handleOpenRegister}>Register</a>
                </>
              )}
            </nav>

            {/* Close Button */}
            <button 
              className="mobile-menu-close" 
              onClick={toggleMobileMenu}
            >
              Close Menu
            </button>
          </div>
        </div>
      )}

      {/* Security verification modal */}
      <SecurityVerificationModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        onVerify={handleVerificationSuccess}
        targetPath={pendingPath}
      />
    </nav>
  );
};

export default Navbar;