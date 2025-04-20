import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../Context/UserContext';
import axios from 'axios';
import './OpenNewAccount.css';

const OpenNewAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addAccount, availableAccountTypes = [], token } = useUser();
  
  // Default account types if none provided in context
  const defaultAccountTypes = [
    {
      type: 'Checking Account',
      description: 'Everyday banking with easy access to your money',
      features: ['No minimum opening deposit', 'Mobile and online banking', '24/7 account access'],
      icon: '💳',
      minDeposit: 25,
      pagePath: '/checking-account'
    },
    {
      type: 'Savings Account',
      description: 'Build your savings with competitive interest rates',
      features: ['Earn interest on your balance', 'Automatic savings options', 'FDIC insured up to $250,000'],
      icon: '💰',
      minDeposit: 100,
      pagePath: '/savings-account'
    },
    {
      type: 'Credit Account',
      description: 'Flexible spending with rewards on every purchase',
      features: ['Cash back rewards', 'No annual fee', 'Fraud protection'],
      icon: '💲',
      minDeposit: 0,
      pagePath: '/credit-account'
    },
    {
      type: 'Retirement Account',
      description: 'Save for your future with tax advantages',
      features: ['Traditional and Roth IRA options', 'Investment choices', 'Retirement planning tools'],
      icon: '🏦',
      minDeposit: 500,
      pagePath: '/retirement-account'
    },
    {
      type: 'Investment Account',
      description: 'Grow your wealth through market investments',
      features: ['Stock and ETF trading', 'Portfolio management', 'Investment research tools'],
      icon: '📈',
      minDeposit: 1000,
      pagePath: '/investment-account'
    },
    {
      type: 'Certificate of Deposit',
      description: 'Guaranteed returns with fixed interest rates',
      features: ['Higher interest than savings', 'Terms from 3 months to 5 years', 'FDIC insured'],
      icon: '🔒',
      minDeposit: 1000,
      pagePath: '/cd-account'
    },
    {
      type: 'Money Market Account',
      description: 'Competitive rates with check-writing privileges',
      features: ['Higher interest than checking', 'Limited check writing', 'FDIC insured'],
      icon: '💵',
      minDeposit: 2500,
      pagePath: '/money-market-account'
    },
    {
      type: 'Student Account',
      description: 'Designed for students with special benefits',
      features: ['No monthly fees', 'Online and mobile banking', 'Student-specific perks'],
      icon: '🎓',
      minDeposit: 10,
      pagePath: '/student-account'
    }
  ];

  // Use context account types if available, otherwise use defaults
  const accountTypeDetails = availableAccountTypes.length > 0 
    ? availableAccountTypes.map(type => {
        // Add pagePath to context-provided account types if missing
        if (!type.pagePath) {
          const defaultType = defaultAccountTypes.find(dt => dt.type === type.type);
          return { ...type, pagePath: defaultType ? defaultType.pagePath : `/${type.type.toLowerCase().replace(/\s+/g, '-')}` };
        }
        return type;
      }) 
    : defaultAccountTypes;
  
  // State variables for form data
  const [accountType, setAccountType] = useState('');
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    ssn: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [employmentInfo, setEmploymentInfo] = useState({
    employmentStatus: '',
    employer: '',
    annualIncome: ''
  });
  const [identificationInfo, setIdentificationInfo] = useState({
    idType: '',
    idNumber: '',
    issueDate: '',
    expirationDate: ''
  });
  const [fundingInfo, setFundingInfo] = useState({
    initialDeposit: '',
    fundingSource: ''
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAccountData, setNewAccountData] = useState(null);

  // Check for preselected account type from navigation
  useEffect(() => {
    if (location.state && location.state.preselectedType) {
      setAccountType(location.state.preselectedType);
      setCurrentStep(2);
    }
  }, [location.state]);

  // Get the page path for the selected account type
  const getAccountPagePath = (accountType) => {
    const accountInfo = accountTypeDetails.find(acc => acc.type === accountType);
    return accountInfo ? accountInfo.pagePath : '/dashboard';
  };

  // Navigate to the appropriate account page
  const goToAccountPage = (accountData) => {
    const pagePath = getAccountPagePath(accountType);
    navigate(`${pagePath}/${accountData._id}`, { state: { account: accountData } });
  };

  // Handle account type selection
  const handleAccountTypeSelect = (type) => {
    setAccountType(type);
    setCurrentStep(2);
  };

  // Handle personal info changes
  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo({
      ...personalInfo,
      [name]: value
    });
  };

  // Handle employment info changes
  const handleEmploymentInfoChange = (e) => {
    const { name, value } = e.target;
    setEmploymentInfo({
      ...employmentInfo,
      [name]: value
    });
  };

  // Handle identification info changes
  const handleIdentificationInfoChange = (e) => {
    const { name, value } = e.target;
    setIdentificationInfo({
      ...identificationInfo,
      [name]: value
    });
  };

  // Handle funding info changes
  const handleFundingInfoChange = (e) => {
    const { name, value } = e.target;
    setFundingInfo({
      ...fundingInfo,
      [name]: value
    });
  };

  // Move to next step
  const goToNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
      setErrorMessage('');
    }
  };

  // Go back to previous step
  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
    setErrorMessage('');
  };

  // Get minimum deposit amount for selected account type
  const getMinimumDeposit = () => {
    const selectedAccountDetails = accountTypeDetails.find(acc => acc.type === accountType);
    return selectedAccountDetails ? selectedAccountDetails.minDeposit : 0;
  };

  // Validate current step
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 2: // Personal Info
        if (!personalInfo.firstName || !personalInfo.lastName || !personalInfo.dateOfBirth ||
            !personalInfo.ssn || !personalInfo.email || !personalInfo.phoneNumber ||
            !personalInfo.address || !personalInfo.city || !personalInfo.state || !personalInfo.zipCode) {
          setErrorMessage('Please fill out all required fields');
          return false;
        }
        return true;
      case 3: // Employment Info
        if (!employmentInfo.employmentStatus || 
            (employmentInfo.employmentStatus !== 'Unemployed' && (!employmentInfo.employer || !employmentInfo.annualIncome))) {
          setErrorMessage('Please complete your employment information');
          return false;
        }
        return true;
      case 4: // ID Verification
        if (!identificationInfo.idType || !identificationInfo.idNumber || 
            !identificationInfo.issueDate || !identificationInfo.expirationDate) {
          setErrorMessage('Please provide valid identification information');
          return false;
        }
        return true;
      case 5: // Funding Info
        const minDeposit = getMinimumDeposit();
        if (!fundingInfo.initialDeposit || !fundingInfo.fundingSource) {
          setErrorMessage('Please complete funding information');
          return false;
        }
        if (parseFloat(fundingInfo.initialDeposit) < minDeposit) {
          setErrorMessage(`Minimum deposit for this account type is $${minDeposit}`);
          return false;
        }
        return true;
      case 6: // Review & Submit
        if (!agreeToTerms) {
          setErrorMessage('You must agree to the terms and conditions');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // Submit the form to the backend API
  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      // Get authentication token from localStorage if not provided in context
      const authToken = token || localStorage.getItem('wellsFargoAuthToken');
      
      if (!authToken) {
        setErrorMessage('Authentication token not found. Please log in again.');
        setIsSubmitting(false);
        return;
      }
      
      // Create the request payload based on the backend API requirements
      const payload = {
        accountType: accountType,
        initialDeposit: parseFloat(fundingInfo.initialDeposit),
        personalInfo: {
          firstName: personalInfo.firstName,
          lastName: personalInfo.lastName
        }
      };
      
      // Make sure the API URL matches your backend route - removed process.env reference
      const API_URL = window.ENV_API_URL || '';
      
      // Set up request with Authorization header
      const response = await axios.post(`${API_URL}/api/open-account`, payload, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        // Get account data from response
        const accountData = response.data.data.account;
        
        // Ensure consistent field naming for Dashboard compatibility
        const processedAccountData = {
          ...accountData,
          id: accountData._id || accountData.id || `acc-${Date.now()}`,
          _id: accountData._id || accountData.id || `acc-${Date.now()}`,
          type: accountData.accountType || accountData.type,
          accountType: accountData.accountType || accountData.type,
          balance: parseFloat(accountData.initialDeposit || accountData.balance || 0),
          initialDeposit: parseFloat(accountData.initialDeposit || accountData.balance || 0)
        };
  
        console.log('Saving new account:', processedAccountData);
        
        // Store the processed account in localStorage with both original and processed data
        localStorage.setItem('newWellsFargoAccount', JSON.stringify(processedAccountData));
        
        // Store the new account data
        setNewAccountData(processedAccountData);
        
        // Add account to context if addAccount function exists
        if (typeof addAccount === 'function') {
          addAccount(processedAccountData);
        }
        
        // Move to confirmation step
        setCurrentStep(7);
      } else {
        setErrorMessage('Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Error creating account:', error.response || error);
      
      // Check if there's a specific error message from the server
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('An error occurred while creating your account. Please try again.');
      }
      
      // Create a mock account without process.env references
      const isDevMode = window.ENV_DEV_MODE === 'true' || !window.ENV_API_URL;
      const useMock = window.ENV_USE_MOCK === 'true';
      
      if (isDevMode || useMock) {
        console.log('Using mock account data for development');
        const mockAccountData = createMockAccountData();
  
        // Ensure consistent field naming for Dashboard compatibility
        const processedMockData = {
          ...mockAccountData,
          id: mockAccountData._id || mockAccountData.id || `acc-${Date.now()}`,
          _id: mockAccountData._id || mockAccountData.id || `acc-${Date.now()}`,
          type: mockAccountData.accountType || mockAccountData.type,
          accountType: mockAccountData.accountType || mockAccountData.type
        };
  
        setNewAccountData(processedMockData);
  
        if (typeof addAccount === 'function') {
          addAccount(processedMockData);
        }
  
        // Also store mock account data in localStorage
        localStorage.setItem('newWellsFargoAccount', JSON.stringify(processedMockData));
  
        setCurrentStep(7);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToDashboard = () => {
    // Add a timestamp to force Dashboard useEffect to re-run
    navigate('/dashboard', { state: { refreshTimestamp: Date.now() } });
  };
  
  // Create mock account data for development without backend
  const createMockAccountData = () => {
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const initialDepositAmount = parseFloat(fundingInfo.initialDeposit) || 600000.00;
    
    return {
      _id: `acc-${Date.now()}`,
      id: `acc-${Date.now()}`, // Add both id and _id for consistency
      accountType: accountType,
      type: accountType, // Add both type and accountType for consistency
      initialDeposit: initialDepositAmount,
      balance: initialDepositAmount, // Add balance field for Dashboard compatibility
      accountNumber: accountNumber,
      routingNumber: '121000248',
      openedDate: new Date(),
      status: 'Active', // Change status to Active for immediate visibility
      ownerName: `${personalInfo.firstName} ${personalInfo.lastName}`,
      transactions: [
        {
          date: new Date(),
          description: 'Initial deposit',
          amount: initialDepositAmount,
          type: 'credit',
          category: 'Deposit',
          balance: initialDepositAmount
        }
      ]
    };
  };
  
  // Function to fetch user accounts
  const fetchAccounts = async () => {
    try {
      const authToken = token || localStorage.getItem('wellsFargoAuthToken');
      
      if (!authToken) {
        console.error('Authentication token not found');
        return;
      }
      
      const response = await axios.get('/api/open-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data && response.data.success) {
        // Process accounts if needed
        console.log('User accounts:', response.data.data.accounts);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };
  
  // Render different steps based on currentStep
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderAccountTypeSelection();
      case 2:
        return renderPersonalInformation();
      case 3:
        return renderEmploymentInformation();
      case 4:
        return renderIdentificationVerification();
      case 5:
        return renderFundingInformation();
      case 6:
        return renderReviewAndSubmit();
      case 7:
        return renderConfirmation();
      default:
        return renderAccountTypeSelection();
    }
  };

  // Step 1: Account Type Selection - Updated for dynamic account types
  const renderAccountTypeSelection = () => {
    return (
      <div className="nacc050-step-container nacc050-account-type-selection">
        <h2>Select Account Type</h2>
        <p className="nacc050-step-description">
          Choose the type of account you would like to open with Wells Fargo.
        </p>
        
        <div className="nacc050-account-options">
          {accountTypeDetails.map((accountTypeInfo) => (
            <div 
              key={accountTypeInfo.type}
              className={`nacc050-account-option ${accountType === accountTypeInfo.type ? 'nacc050-selected' : ''}`} 
              onClick={() => handleAccountTypeSelect(accountTypeInfo.type)}
            >
              <div className={`nacc050-account-icon nacc050-${accountTypeInfo.type.toLowerCase().replace(/\s+/g, '-')}-icon`}>
                <i className="nacc050-icon">{accountTypeInfo.icon}</i>
              </div>
              <h3>{accountTypeInfo.type}</h3>
              <p>{accountTypeInfo.description}</p>
              <ul>
                {accountTypeInfo.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Step 2: Personal Information
  const renderPersonalInformation = () => {
    return (
      <div className="nacc050-step-container nacc050-personal-info">
        <h2>Personal Information</h2>
        <p className="nacc050-step-description">
          Please provide your personal information to get started with your new {accountType}.
        </p>
        
        <div className="nacc050-form-grid">
          <div className="nacc050-form-group">
            <label htmlFor="firstName">First Name</label>
            <input 
              type="text" 
              id="firstName" 
              name="firstName" 
              value={personalInfo.firstName} 
              onChange={handlePersonalInfoChange} 
              required 
            />
          </div>
          
          <div className="nacc050-form-group">
            <label htmlFor="lastName">Last Name</label>
            <input 
              type="text" 
              id="lastName" 
              name="lastName" 
              value={personalInfo.lastName} 
              onChange={handlePersonalInfoChange} 
              required 
            />
          </div>
          
          <div className="nacc050-form-group">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input 
              type="date" 
              id="dateOfBirth" 
              name="dateOfBirth" 
              value={personalInfo.dateOfBirth} 
              onChange={handlePersonalInfoChange} 
              required 
            />
          </div>
          
          <div className="nacc050-form-group">
            <label htmlFor="ssn">Social Security Number</label>
            <input 
              type="text" 
              id="ssn" 
              name="ssn" 
              value={personalInfo.ssn} 
              onChange={handlePersonalInfoChange} 
              placeholder="XXX-XX-XXXX" 
              required 
            />
          </div>
          
          <div className="nacc050-form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={personalInfo.email} 
              onChange={handlePersonalInfoChange} 
              required 
            />
          </div>
          
          <div className="nacc050-form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input 
              type="tel" 
              id="phoneNumber" 
              name="phoneNumber" 
              value={personalInfo.phoneNumber} 
              onChange={handlePersonalInfoChange} 
              placeholder="(XXX) XXX-XXXX" 
              required 
            />
          </div>
          
          <div className="nacc050-form-group nacc050-full-width">
            <label htmlFor="address">Street Address</label>
            <input 
              type="text" 
              id="address" 
              name="address" 
              value={personalInfo.address} 
              onChange={handlePersonalInfoChange} 
              required 
            />
          </div>
          
          <div className="nacc050-form-group">
            <label htmlFor="city">City</label>
            <input 
              type="text" 
              id="city" 
              name="city" 
              value={personalInfo.city} 
              onChange={handlePersonalInfoChange} 
              required 
            />
          </div>
          
          <div className="nacc050-form-group">
            <label htmlFor="state">State</label>
            <select 
              id="state" 
              name="state" 
              value={personalInfo.state} 
              onChange={handlePersonalInfoChange} 
              required
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
              <option value="DC">District of Columbia</option>
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
          
          <div className="nacc050-form-group">
            <label htmlFor="zipCode">ZIP Code</label>
            <input 
              type="text" 
              id="zipCode" 
              name="zipCode" 
              value={personalInfo.zipCode} 
              onChange={handlePersonalInfoChange} 
              required 
            />
          </div>
        </div>
        
        {errorMessage && <p className="nacc050-error-message">{errorMessage}</p>}
        
        <div className="nacc050-form-buttons">
          <button type="button" className="nacc050-secondary-button" onClick={goToPreviousStep}>
            Back
          </button>
          <button type="button" className="nacc050-primary-button" onClick={goToNextStep}>
            Continue
          </button>
        </div>
      </div>
    );
  };

  // Step 3: Employment Information
  const renderEmploymentInformation = () => {
    return (
      <div className="nacc050-step-container nacc050-employment-info">
        <h2>Employment Information</h2>
        <p className="nacc050-step-description">
          Please provide your current employment details.
        </p>
        
        <div className="nacc050-form-grid">
          <div className="nacc050-form-group nacc050-full-width">
            <label htmlFor="employmentStatus">Employment Status</label>
            <select 
              id="employmentStatus" 
              name="employmentStatus" 
              value={employmentInfo.employmentStatus} 
              onChange={handleEmploymentInfoChange} 
              required
            >
              <option value="">Select Status</option>
              <option value="Employed">Employed</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Retired">Retired</option>
              <option value="Student">Student</option>
            </select>
          </div>
          
          {employmentInfo.employmentStatus !== 'Unemployed' && employmentInfo.employmentStatus !== '' && (
            <>
              <div className="nacc050-form-group nacc050-full-width">
                <label htmlFor="employer">
                  {employmentInfo.employmentStatus === 'Self-Employed' ? 'Business Name' : 'Employer Name'}
                </label>
                <input 
                  type="text" 
                  id="employer" 
                  name="employer" 
                  value={employmentInfo.employer} 
                  onChange={handleEmploymentInfoChange} 
                  required={employmentInfo.employmentStatus !== 'Unemployed'} 
                />
              </div>
              
              <div className="nacc050-form-group nacc050-full-width">
                <label htmlFor="annualIncome">Annual Income</label>
                <input 
                  type="number" 
                  id="annualIncome" 
                  name="annualIncome" 
                  value={employmentInfo.annualIncome} 
                  onChange={handleEmploymentInfoChange} 
                  placeholder="USD" 
                  required={employmentInfo.employmentStatus !== 'Unemployed'} 
                />
              </div>
            </>
          )}
        </div>
        
        {errorMessage && <p className="nacc050-error-message">{errorMessage}</p>}
        
        <div className="nacc050-form-buttons">
          <button type="button" className="nacc050-secondary-button" onClick={goToPreviousStep}>
            Back
          </button>
          <button type="button" className="nacc050-primary-button" onClick={goToNextStep}>
            Continue
          </button>
        </div>
      </div>
    );
  };

  // Step 4: Identification Verification
  const renderIdentificationVerification = () => {
    return (
      <div className="nacc050-step-container nacc050-id-verification">
        <h2>Identity Verification</h2>
        <p className="nacc050-step-description">
          Federal regulations require us to verify your identity. Please provide one of the following forms of identification.
        </p>
        
        <div className="nacc050-form-grid">
          <div className="nacc050-form-group nacc050-full-width">
            <label htmlFor="idType">Identification Type</label>
            <select 
              id="idType" 
              name="idType" 
              value={identificationInfo.idType} 
              onChange={handleIdentificationInfoChange} 
              required
            >
              <option value="">Select ID Type</option>
              <option value="Driver's License">Driver's License</option>
              <option value="State ID">State ID</option>
              <option value="Passport">Passport</option>
              <option value="Military ID">Military ID</option>
            </select>
          </div>
          
          <div className="nacc050-form-group nacc050-full-width">
            <label htmlFor="idNumber">ID Number</label>
            <input 
              type="text" 
              id="idNumber" 
              name="idNumber" 
              value={identificationInfo.idNumber} 
              onChange={handleIdentificationInfoChange} 
              required 
            />
          </div>
          
          <div className="nacc050-form-group">
            <label htmlFor="issueDate">Issue Date</label>
            <input 
              type="date" 
              id="issueDate" 
              name="issueDate" 
              value={identificationInfo.issueDate} 
              onChange={handleIdentificationInfoChange} 
              required 
            />
          </div>
          
          <div className="nacc050-form-group">
            <label htmlFor="expirationDate">Expiration Date</label>
            <input 
              type="date" 
              id="expirationDate" 
              name="expirationDate" 
              value={identificationInfo.expirationDate} 
              onChange={handleIdentificationInfoChange} 
              required 
            />
          </div>
        </div>
        
        {errorMessage && <p className="nacc050-error-message">{errorMessage}</p>}
        
        <div className="nacc050-form-buttons">
          <button type="button" className="nacc050-secondary-button" onClick={goToPreviousStep}>
            Back
          </button>
          <button type="button" className="nacc050-primary-button" onClick={goToNextStep}>
            Continue
          </button>
        </div>
      </div>
    );
  };

  // Step 5: Funding Information
  const renderFundingInformation = () => {
    const minimumDeposit = getMinimumDeposit();
    
    return (
      <div className="nacc050-step-container nacc050-funding-info">
        <h2>Account Funding</h2>
        <p className="nacc050-step-description">
          Please specify how you would like to fund your new {accountType}.
          {minimumDeposit > 0 && 
            <span className="nacc050-min-deposit-note"> 
              Minimum initial deposit: ${minimumDeposit.toFixed(2)}
            </span>
          }
        </p>
        
        <div className="nacc050-form-grid">
          <div className="nacc050-form-group nacc050-full-width">
            <label htmlFor="initialDeposit">Initial Deposit Amount</label>
            <input 
              type="number" 
              id="initialDeposit" 
              name="initialDeposit" 
              value={fundingInfo.initialDeposit} 
              onChange={handleFundingInfoChange} 
              min={minimumDeposit}
              placeholder={`Minimum $${minimumDeposit.toFixed(2)}`}
              required 
            />
          </div>
          
          <div className="nacc050-form-group nacc050-full-width">
            <label htmlFor="fundingSource">Funding Source</label>
            <select 
              id="fundingSource" 
              name="fundingSource" 
              value={fundingInfo.fundingSource} 
              onChange={handleFundingInfoChange} 
              required
            >
              <option value="">Select Funding Source</option>
              <option value="Existing Account">Existing Wells Fargo Account</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Wire Transfer">Wire Transfer</option>
              <option value="Check">Check</option>
              <option value="Cash">Cash Deposit</option>
            </select>
          </div>
        </div>
        
        {errorMessage && <p className="nacc050-error-message">{errorMessage}</p>}
        
        <div className="nacc050-form-buttons">
          <button type="button" className="nacc050-secondary-button" onClick={goToPreviousStep}>
            Back
          </button>
          <button type="button" className="nacc050-primary-button" onClick={goToNextStep}>
            Continue
          </button>
        </div>
      </div>
    );
  };

  // Step 6: Review And Submit
  const renderReviewAndSubmit = () => {
    const minimumDeposit = getMinimumDeposit();
    
    return (
      <div className="nacc050-step-container nacc050-review-submit">
        <h2>Review and Submit</h2>
        <p className="nacc050-step-description">
          Please review your information before submitting your application for a new {accountType}.
        </p>
        
        <div className="nacc050-review-sections">
          <div className="nacc050-review-section">
            <h3>Account Details</h3>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">Account Type:</span>
              <span className="nacc050-review-value">{accountType}</span>
            </div>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">Initial Deposit:</span>
              <span className="nacc050-review-value">${parseFloat(fundingInfo.initialDeposit).toFixed(2)}</span>
            </div>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">Funding Source:</span>
              <span className="nacc050-review-value">{fundingInfo.fundingSource}</span>
            </div>
          </div>
          
          <div className="nacc050-review-section">
            <h3>Personal Information</h3>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">Name:</span>
              <span className="nacc050-review-value">{personalInfo.firstName} {personalInfo.lastName}</span>
            </div>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">Date of Birth:</span>
              <span className="nacc050-review-value">{personalInfo.dateOfBirth}</span>
            </div>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">SSN:</span>
              <span className="nacc050-review-value">XXX-XX-{personalInfo.ssn.slice(-4)}</span>
            </div>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">Email:</span>
              <span className="nacc050-review-value">{personalInfo.email}</span>
            </div>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">Phone:</span>
              <span className="nacc050-review-value">{personalInfo.phoneNumber}</span>
            </div>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">Address:</span>
              <span className="nacc050-review-value">
                {personalInfo.address}, {personalInfo.city}, {personalInfo.state} {personalInfo.zipCode}
              </span>
            </div>
          </div>
          
          <div className="nacc050-review-section">
            <h3>Employment Information</h3>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">Status:</span>
              <span className="nacc050-review-value">{employmentInfo.employmentStatus}</span>
            </div>
            {employmentInfo.employmentStatus !== 'Unemployed' && (
              <>
                <div className="nacc050-review-item">
                  <span className="nacc050-review-label">
                    {employmentInfo.employmentStatus === 'Self-Employed' ? 'Business:' : 'Employer:'}
                  </span>
                  <span className="nacc050-review-value">{employmentInfo.employer}</span>
                </div>
                <div className="nacc050-review-item">
                  <span className="nacc050-review-label">Annual Income:</span>
                  <span className="nacc050-review-value">${parseFloat(employmentInfo.annualIncome).toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
          
          <div className="nacc050-review-section">
            <h3>Identification</h3>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">ID Type:</span>
              <span className="nacc050-review-value">{identificationInfo.idType}</span>
            </div>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">ID Number:</span>
              <span className="nacc050-review-value">
                {identificationInfo.idNumber.slice(0, 2)}XXXX{identificationInfo.idNumber.slice(-2)}
              </span>
            </div>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">Issue Date:</span>
              <span className="nacc050-review-value">{identificationInfo.issueDate}</span>
            </div>
            <div className="nacc050-review-item">
              <span className="nacc050-review-label">Expiration Date:</span>
              <span className="nacc050-review-value">{identificationInfo.expirationDate}</span>
            </div>
          </div>
        </div>
        
        <div className="nacc050-terms-agreement">
          <label className="nacc050-checkbox-container">
            <input 
              type="checkbox" 
              checked={agreeToTerms} 
              onChange={(e) => setAgreeToTerms(e.target.checked)} 
            />
            <span className="nacc050-checkmark"></span>
            I agree to the <a href="#" className="nacc050-terms-link">Terms and Conditions</a> and <a href="#" className="nacc050-terms-link">Privacy Policy</a>
          </label>
        </div>
        
        {errorMessage && <p className="nacc050-error-message">{errorMessage}</p>}
        
        <div className="nacc050-form-buttons">
          <button type="button" className="nacc050-secondary-button" onClick={goToPreviousStep}>
            Back
          </button>
          <button 
            type="button" 
            className="nacc050-primary-button"
            onClick={handleSubmit}
            disabled={isSubmitting || !agreeToTerms}
          >
            {isSubmitting ? 'Processing...' : 'Open Account'}
          </button>
        </div>
      </div>
    );
  };

  // Step 7: Confirmation
  const renderConfirmation = () => {
    return (
      <div className="nacc050-step-container nacc050-confirmation">
        <div className="nacc050-success-icon">
          <i className="fas fa-check-circle"></i>
        </div>
        
        <h2>Congratulations!</h2>
        <p className="nacc050-confirmation-message">
          Your new {accountType} has been successfully opened.
        </p>
        
        <div className="nacc050-account-details">
          <div className="nacc050-account-detail-item">
            <span className="nacc050-detail-label">Account Number:</span>
            <span className="nacc050-detail-value">{newAccountData?.accountNumber || "********"}</span>
          </div>
          <div className="nacc050-account-detail-item">
            <span className="nacc050-detail-label">Routing Number:</span>
            <span className="nacc050-detail-value">{newAccountData?.routingNumber || "121000248"}</span>
          </div>
          <div className="nacc050-account-detail-item">
            <span className="nacc050-detail-label">Initial Balance:</span>
            <span className="nacc050-detail-value">${parseFloat(fundingInfo.initialDeposit).toFixed(2)}</span>
          </div>
          <div className="nacc050-account-detail-item">
            <span className="nacc050-detail-label">Account Status:</span>
            <span className="nacc050-detail-value">Active</span>
          </div>
        </div>
        
        <div className="nacc050-next-steps">
          <h3>Next Steps</h3>
          <ul>
            <li>Set up online banking access for your new account</li>
            <li>Download our mobile app for convenient banking on the go</li>
            <li>Set up direct deposit for your paycheck</li>
            <li>Explore additional account features and benefits</li>
          </ul>
        </div>
        
        <div className="nacc050-form-buttons">
          <button 
            type="button" 
            className="nacc050-secondary-button" 
            onClick={() => goToAccountPage(newAccountData)}
          >
            View Account Details
          </button>
          <button 
            type="button" 
            className="nacc050-primary-button" 
            onClick={goToDashboard}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  };

  // Progress indicator
  const renderProgressBar = () => {
    const steps = [
      "Account Type",
      "Personal Info",
      "Employment",
      "Identification",
      "Funding",
      "Review",
      "Confirmation"
    ];
    
    return (
      <div className="nacc050-progress-bar">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`nacc050-progress-step ${currentStep >= index + 1 ? 'nacc050-step-active' : ''}`}
          >
            <div className="nacc050-step-number">{index + 1}</div>
            <div className="nacc050-step-name">{step}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="nacc050-open-account-container">
      <h1 className="nacc050-page-title">Open a New Account</h1>
      
      {renderProgressBar()}
      
      <div className="nacc050-form-container">
        {renderStep()}
      </div>
    </div>
  );
};

export default OpenNewAccount;