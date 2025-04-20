import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './RolloverRetirementPage.css';

const RolloverRetirementPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [account, setAccount] = useState(location.state?.account || null);
  const [fromAccount, setFromAccount] = useState('external');
  const [accountDetails, setAccountDetails] = useState({
    provider: '',
    accountNumber: '',
    accountType: 'traditional',
    estimatedValue: '',
    rolloverAmount: '',
    rolloverType: 'full'
  });
  const [distributions, setDistributions] = useState({
    withholding: '0',
    distributionMethod: 'check'
  });
  const [investmentStrategy, setInvestmentStrategy] = useState('default');
  const [customAllocation, setCustomAllocation] = useState([
    { fund: 'S&P 500 Index Fund', allocation: 40 },
    { fund: 'Total Bond Market Fund', allocation: 30 },
    { fund: 'International Stock Fund', allocation: 20 },
    { fund: 'Cash Reserve', allocation: 10 }
  ]);
  const [currentStep, setCurrentStep] = useState(1);
  const [agreements, setAgreements] = useState({
    termsAndConditions: false,
    transferAuthorization: false,
    taxWithholding: false
  });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  // Load account data if not provided in location state
  useEffect(() => {
    if (!account && location.state?.toAccount) {
      setAccount(location.state.toAccount);
    } else if (!account) {
      // Mock account data for development
      setAccount({
        id: 'ret001',
        type: 'Retirement Account',
        balance: 125000.00,
        accountNumber: '****7890',
        routingNumber: '121000248',
        openedDate: '03/15/2015',
        interestRate: 'Variable',
        ownerName: 'John Doe',
        monthlyFee: '$0.00',
        minBalance: '$0.00',
        taxStatus: 'Tax-Advantaged',
        retirementType: '401(k)',
        employerMatch: '50% up to 6% of salary',
        vestingSchedule: '100% Vested'
      });
    }
  }, [account, location.state]);

  const formatCurrency = (amount) => {
    if (!amount) return '';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  const handleInputChange = (e, stateSetter, stateObject) => {
    const { name, value } = e.target;
    stateSetter({
      ...stateObject,
      [name]: value
    });
    
    // Clear any errors for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setAgreements({
      ...agreements,
      [name]: checked
    });
    
    // Clear any errors for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!accountDetails.provider.trim()) {
        newErrors.provider = 'Provider name is required';
      }
      if (!accountDetails.accountNumber.trim()) {
        newErrors.accountNumber = 'Account number is required';
      } else if (!/^\d{6,17}$/.test(accountDetails.accountNumber.trim())) {
        newErrors.accountNumber = 'Please enter a valid account number (6-17 digits)';
      }
      if (!accountDetails.estimatedValue.trim()) {
        newErrors.estimatedValue = 'Estimated value is required';
      } else if (isNaN(parseFloat(accountDetails.estimatedValue))) {
        newErrors.estimatedValue = 'Please enter a valid amount';
      }
    } else if (step === 2) {
      if (accountDetails.rolloverType === 'partial' && !accountDetails.rolloverAmount.trim()) {
        newErrors.rolloverAmount = 'Rollover amount is required for partial rollovers';
      } else if (accountDetails.rolloverType === 'partial' && 
                (isNaN(parseFloat(accountDetails.rolloverAmount)) || 
                parseFloat(accountDetails.rolloverAmount) <= 0)) {
        newErrors.rolloverAmount = 'Please enter a valid amount greater than zero';
      }
      
      if (distributions.withholding && 
          (isNaN(parseInt(distributions.withholding)) || 
          parseInt(distributions.withholding) < 0 || 
          parseInt(distributions.withholding) > 100)) {
        newErrors.withholding = 'Please enter a valid percentage between 0 and 100';
      }
    } else if (step === 3) {
      if (investmentStrategy === 'custom') {
        const totalAllocation = customAllocation.reduce((sum, item) => sum + (parseInt(item.allocation) || 0), 0);
        if (totalAllocation !== 100) {
          newErrors.customAllocation = 'Total allocation must equal 100%';
        }
      }
    } else if (step === 4) {
      if (!agreements.termsAndConditions) {
        newErrors.termsAndConditions = 'You must agree to the terms and conditions';
      }
      if (!agreements.transferAuthorization) {
        newErrors.transferAuthorization = 'You must authorize the transfer';
      }
      if (!agreements.taxWithholding) {
        newErrors.taxWithholding = 'You must acknowledge the tax withholding notice';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        setIsReviewModalOpen(true);
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = () => {
    // In a real app, this would send data to an API
    setIsSubmitted(true);
    setIsReviewModalOpen(false);
    
    // Simulate processing time for demo
    setTimeout(() => {
      navigate('/dashboard', { 
        state: { 
          message: 'Your rollover request has been submitted successfully!' 
        } 
      });
    }, 3000);
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  // Content for each step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="rol000-step-content">
            <h3>Step 1: Source Account Information</h3>
            
            <div className="rol000-form-section">
              <div className="rol000-form-group">
                <label>Rollover From:</label>
                <div className="rol000-radio-options">
                  <label className="rol000-radio-label">
                    <input 
                      type="radio" 
                      name="fromAccount" 
                      value="external" 
                      checked={fromAccount === 'external'} 
                      onChange={() => setFromAccount('external')} 
                    />
                    External Retirement Account
                  </label>
                  <label className="rol000-radio-label">
                    <input 
                      type="radio" 
                      name="fromAccount" 
                      value="employer" 
                      checked={fromAccount === 'employer'} 
                      onChange={() => setFromAccount('employer')} 
                    />
                    Employer-Sponsored Plan
                  </label>
                </div>
              </div>
              
              <div className="rol000-form-group">
                <label>Financial Institution / Provider Name:</label>
                <input 
                  type="text" 
                  name="provider" 
                  value={accountDetails.provider} 
                  onChange={(e) => handleInputChange(e, setAccountDetails, accountDetails)} 
                  placeholder="Enter institution name"
                  className={errors.provider ? 'rol000-input-error' : ''}
                />
                {errors.provider && <div className="rol000-error-message">{errors.provider}</div>}
              </div>
              
              <div className="rol000-form-group">
                <label>Account Number:</label>
                <input 
                  type="text" 
                  name="accountNumber" 
                  value={accountDetails.accountNumber} 
                  onChange={(e) => handleInputChange(e, setAccountDetails, accountDetails)} 
                  placeholder="Enter account number"
                  className={errors.accountNumber ? 'rol000-input-error' : ''}
                />
                {errors.accountNumber && <div className="rol000-error-message">{errors.accountNumber}</div>}
              </div>
              
              <div className="rol000-form-group">
                <label>Account Type:</label>
                <select 
                  name="accountType" 
                  value={accountDetails.accountType} 
                  onChange={(e) => handleInputChange(e, setAccountDetails, accountDetails)}
                >
                  <option value="traditional">Traditional IRA</option>
                  <option value="roth">Roth IRA</option>
                  <option value="401k">401(k)</option>
                  <option value="403b">403(b)</option>
                  <option value="457">457 Plan</option>
                  <option value="tsp">Thrift Savings Plan (TSP)</option>
                  <option value="sep">SEP IRA</option>
                  <option value="simple">SIMPLE IRA</option>
                </select>
              </div>
              
              <div className="rol000-form-group">
                <label>Estimated Account Value:</label>
                <div className="rol000-currency-input">
                  <span className="rol000-currency-symbol">$</span>
                  <input 
                    type="text" 
                    name="estimatedValue" 
                    value={accountDetails.estimatedValue} 
                    onChange={(e) => handleInputChange(e, setAccountDetails, accountDetails)} 
                    placeholder="0.00"
                    className={errors.estimatedValue ? 'rol000-input-error' : ''}
                  />
                </div>
                {errors.estimatedValue && <div className="rol000-error-message">{errors.estimatedValue}</div>}
              </div>
            </div>
            
            <div className="rol000-info-box">
              <h4>Important Information</h4>
              <p>Initiating a rollover does not close your existing account. Contact your current provider if you wish to close the account after the rollover is complete.</p>
              <p>For 401(k) rollovers: If you're still employed by the company sponsoring the 401(k), you may not be eligible for a rollover. Check with your plan administrator.</p>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="rol000-step-content">
            <h3>Step 2: Rollover Options</h3>
            
            <div className="rol000-form-section">
              <div className="rol000-form-group">
                <label>Rollover Type:</label>
                <div className="rol000-radio-options">
                  <label className="rol000-radio-label">
                    <input 
                      type="radio" 
                      name="rolloverType" 
                      value="full" 
                      checked={accountDetails.rolloverType === 'full'} 
                      onChange={(e) => handleInputChange(e, setAccountDetails, accountDetails)} 
                    />
                    Full Rollover ({formatCurrency(accountDetails.estimatedValue)})
                  </label>
                  <label className="rol000-radio-label">
                    <input 
                      type="radio" 
                      name="rolloverType" 
                      value="partial" 
                      checked={accountDetails.rolloverType === 'partial'} 
                      onChange={(e) => handleInputChange(e, setAccountDetails, accountDetails)} 
                    />
                    Partial Rollover
                  </label>
                </div>
              </div>
              
              {accountDetails.rolloverType === 'partial' && (
                <div className="rol000-form-group">
                  <label>Rollover Amount:</label>
                  <div className="rol000-currency-input">
                    <span className="rol000-currency-symbol">$</span>
                    <input 
                      type="text" 
                      name="rolloverAmount" 
                      value={accountDetails.rolloverAmount} 
                      onChange={(e) => handleInputChange(e, setAccountDetails, accountDetails)} 
                      placeholder="0.00"
                      className={errors.rolloverAmount ? 'rol000-input-error' : ''}
                    />
                  </div>
                  {errors.rolloverAmount && <div className="rol000-error-message">{errors.rolloverAmount}</div>}
                </div>
              )}
              
              <div className="rol000-form-group">
                <label>Tax Withholding (0-100%):</label>
                <div className="rol000-percentage-input">
                  <input 
                    type="text" 
                    name="withholding" 
                    value={distributions.withholding} 
                    onChange={(e) => handleInputChange(e, setDistributions, distributions)} 
                    placeholder="0"
                    className={errors.withholding ? 'rol000-input-error' : ''}
                  />
                  <span className="rol000-percentage-symbol">%</span>
                </div>
                {errors.withholding && <div className="rol000-error-message">{errors.withholding}</div>}
                <p className="rol000-input-note">Recommended: 10% for federal taxes (may vary based on your tax situation)</p>
              </div>
              
              <div className="rol000-form-group">
                <label>Distribution Method:</label>
                <select 
                  name="distributionMethod" 
                  value={distributions.distributionMethod} 
                  onChange={(e) => handleInputChange(e, setDistributions, distributions)}
                >
                  <option value="check">Check</option>
                  <option value="direct">Direct Transfer</option>
                  <option value="wire">Wire Transfer</option>
                </select>
              </div>
            </div>
            
            <div className="rol000-info-box rol000-warning">
              <h4>Tax Information</h4>
              <p>A direct rollover to another qualified retirement plan or IRA will not be subject to federal income tax withholding.</p>
              <p>If you choose to receive the distribution yourself (indirect rollover), 20% mandatory federal income tax withholding will apply.</p>
              <p>You have 60 days from the date you receive a distribution to roll it over to another qualified plan to avoid potential taxes and penalties.</p>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="rol000-step-content">
            <h3>Step 3: Investment Strategy</h3>
            
            <div className="rol000-form-section">
              <div className="rol000-form-group">
                <label>Choose an Investment Strategy:</label>
                <div className="rol000-radio-options">
                  <label className="rol000-radio-label">
                    <input 
                      type="radio" 
                      name="investmentStrategy" 
                      value="default" 
                      checked={investmentStrategy === 'default'} 
                      onChange={(e) => setInvestmentStrategy(e.target.value)}
                    />
                    Use Default Allocation (Target Date Fund)
                  </label>
                  <label className="rol000-radio-label">
                    <input 
                      type="radio" 
                      name="investmentStrategy" 
                      value="match" 
                      checked={investmentStrategy === 'match'} 
                      onChange={(e) => setInvestmentStrategy(e.target.value)}
                    />
                    Match Current Account Allocation
                  </label>
                  <label className="rol000-radio-label">
                    <input 
                      type="radio" 
                      name="investmentStrategy" 
                      value="custom" 
                      checked={investmentStrategy === 'custom'} 
                      onChange={(e) => setInvestmentStrategy(e.target.value)}
                    />
                    Custom Allocation
                  </label>
                </div>
              </div>
              
              {investmentStrategy === 'default' && (
                <div className="rol000-investment-option">
                  <h4>Target Date Fund</h4>
                  <p>Based on your expected retirement date, we recommend:</p>
                  <div className="rol000-recommended-fund">
                    <strong>Wells Fargo Target 2045 Fund (WFGTF)</strong>
                    <p>This fund automatically adjusts its asset allocation to become more conservative as you approach retirement.</p>
                    <div className="rol000-fund-chart">
                      <div className="rol000-fund-chart-item rol000-stocks" style={{ width: '70%' }}>Stocks: 70%</div>
                      <div className="rol000-fund-chart-item rol000-bonds" style={{ width: '25%' }}>Bonds: 25%</div>
                      <div className="rol000-fund-chart-item rol000-cash" style={{ width: '5%' }}>Cash: 5%</div>
                    </div>
                    <p className="rol000-expense-ratio">Expense Ratio: 0.75%</p>
                  </div>
                </div>
              )}
              
              {investmentStrategy === 'match' && (
                <div className="rol000-investment-option">
                  <h4>Current Account Allocation</h4>
                  <p>Your rollover funds will be invested according to your current allocation:</p>
                  <div className="rol000-allocation-chart">
                    <div className="rol000-allocation-chart-item rol000-stocks" style={{ width: '60%' }}>Stocks: 60%</div>
                    <div className="rol000-allocation-chart-item rol000-bonds" style={{ width: '30%' }}>Bonds: 30%</div>
                    <div className="rol000-allocation-chart-item rol000-cash" style={{ width: '10%' }}>Cash: 10%</div>
                  </div>
                </div>
              )}
              
              {investmentStrategy === 'custom' && (
                <div className="rol000-investment-option">
                  <h4>Custom Allocation</h4>
                  <p>Specify how you would like your rollover funds to be invested:</p>
                  
                  {errors.customAllocation && (
                    <div className="rol000-error-message rol000-allocation-error">{errors.customAllocation}</div>
                  )}
                  
                  <div className="rol000-custom-allocation">
                    {customAllocation.map((item, index) => (
                      <div key={index} className="rol000-allocation-item">
                        <div className="rol000-fund-name">{item.fund}</div>
                        <div className="rol000-allocation-input">
                          <input 
                            type="text" 
                            value={item.allocation} 
                            onChange={(e) => {
                              const newAllocation = [...customAllocation];
                              newAllocation[index].allocation = parseInt(e.target.value) || 0;
                              setCustomAllocation(newAllocation);
                            }} 
                          />
                          <span className="rol000-percentage-symbol">%</span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="rol000-allocation-total">
                      <span>Total:</span>
                      <span className={
                        customAllocation.reduce((sum, item) => sum + (parseInt(item.allocation) || 0), 0) === 100 
                          ? 'rol000-valid-total' 
                          : 'rol000-invalid-total'
                      }>
                        {customAllocation.reduce((sum, item) => sum + (parseInt(item.allocation) || 0), 0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="rol000-info-box">
              <h4>Investment Information</h4>
              <p>Past performance is not a guarantee of future results. Investment returns and principal value will fluctuate, and shares may be worth more or less than original cost when redeemed.</p>
              <p>Diversification and asset allocation do not ensure a profit or protect against loss.</p>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="rol000-step-content">
            <h3>Step 4: Review and Confirm</h3>
            
            <div className="rol000-review-section">
              <h4>Source Account</h4>
              <div className="rol000-review-item">
                <span className="rol000-review-label">Financial Institution:</span>
                <span className="rol000-review-value">{accountDetails.provider}</span>
              </div>
              <div className="rol000-review-item">
                <span className="rol000-review-label">Account Type:</span>
                <span className="rol000-review-value">
                  {(() => {
                    switch(accountDetails.accountType) {
                      case 'traditional': return 'Traditional IRA';
                      case 'roth': return 'Roth IRA';
                      case '401k': return '401(k)';
                      case '403b': return '403(b)';
                      case '457': return '457 Plan';
                      case 'tsp': return 'Thrift Savings Plan';
                      case 'sep': return 'SEP IRA';
                      case 'simple': return 'SIMPLE IRA';
                      default: return accountDetails.accountType;
                    }
                  })()}
                </span>
              </div>
              <div className="rol000-review-item">
                <span className="rol000-review-label">Account Number:</span>
                <span className="rol000-review-value">
                  {accountDetails.accountNumber.replace(/^(\d{4})(\d+)(\d{4})$/, function(match, p1, p2, p3) {
                    return p1 + '*'.repeat(p2.length) + p3;
                  })}
                </span>
              </div>
              
              <h4>Rollover Details</h4>
              <div className="rol000-review-item">
                <span className="rol000-review-label">Rollover Type:</span>
                <span className="rol000-review-value">
                  {accountDetails.rolloverType === 'full' ? 'Full Rollover' : 'Partial Rollover'}
                </span>
              </div>
              <div className="rol000-review-item">
                <span className="rol000-review-label">Rollover Amount:</span>
                <span className="rol000-review-value">
                  {accountDetails.rolloverType === 'full' 
                    ? formatCurrency(accountDetails.estimatedValue) 
                    : formatCurrency(accountDetails.rolloverAmount)}
                </span>
              </div>
              <div className="rol000-review-item">
                <span className="rol000-review-label">Tax Withholding:</span>
                <span className="rol000-review-value">{distributions.withholding}%</span>
              </div>
              <div className="rol000-review-item">
                <span className="rol000-review-label">Distribution Method:</span>
                <span className="rol000-review-value">
                  {(() => {
                    switch(distributions.distributionMethod) {
                      case 'check': return 'Check';
                      case 'direct': return 'Direct Transfer';
                      case 'wire': return 'Wire Transfer';
                      default: return distributions.distributionMethod;
                    }
                  })()}
                </span>
              </div>
              
              <h4>Investment Strategy</h4>
              <div className="rol000-review-item">
                <span className="rol000-review-label">Selected Strategy:</span>
                <span className="rol000-review-value">
                  {(() => {
                    switch(investmentStrategy) {
                      case 'default': return 'Target Date Fund (Wells Fargo Target 2045 Fund)';
                      case 'match': return 'Match Current Account Allocation';
                      case 'custom': return 'Custom Allocation';
                      default: return investmentStrategy;
                    }
                  })()}
                </span>
              </div>
              
              <h4>Destination Account</h4>
              <div className="rol000-review-item">
                <span className="rol000-review-label">Account Type:</span>
                <span className="rol000-review-value">{account?.retirementType || '401(k)'}</span>
              </div>
              <div className="rol000-review-item">
                <span className="rol000-review-label">Account Number:</span>
                <span className="rol000-review-value">{account?.accountNumber || '****7890'}</span>
              </div>
            </div>
            
            <div className="rol000-agreements-section">
              <div className="rol000-agreement-item">
                <label className={errors.termsAndConditions ? 'rol000-label-error' : ''}>
                  <input 
                    type="checkbox" 
                    name="termsAndConditions" 
                    checked={agreements.termsAndConditions} 
                    onChange={handleCheckboxChange} 
                  />
                  I have read and agree to the terms and conditions of the rollover, including any applicable fees and processing times.
                </label>
                {errors.termsAndConditions && <div className="rol000-error-message">{errors.termsAndConditions}</div>}
              </div>
              
              <div className="rol000-agreement-item">
                <label className={errors.transferAuthorization ? 'rol000-label-error' : ''}>
                  <input 
                    type="checkbox" 
                    name="transferAuthorization" 
                    checked={agreements.transferAuthorization} 
                    onChange={handleCheckboxChange} 
                  />
                  I authorize the transfer of assets as indicated above and certify that all information provided is accurate and complete.
                </label>
                {errors.transferAuthorization && <div className="rol000-error-message">{errors.transferAuthorization}</div>}
              </div>
              
              <div className="rol000-agreement-item">
                <label className={errors.taxWithholding ? 'rol000-label-error' : ''}>
                  <input 
                    type="checkbox" 
                    name="taxWithholding" 
                    checked={agreements.taxWithholding} 
                    onChange={handleCheckboxChange} 
                  />
                  I understand the tax implications of this rollover, including potential penalties for early withdrawals and required tax withholding if applicable.
                </label>
                {errors.taxWithholding && <div className="rol000-error-message">{errors.taxWithholding}</div>}
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (!account && !isSubmitted) {
    return (
      <div className="rol000-loading-container">
        <div className="rol000-loader"></div>
        <p>Loading account information...</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="rol000-submitted-container">
        <div className="rol000-success-checkmark"></div>
        <h2>Your Rollover Request Has Been Submitted</h2>
        <p>Request ID: ROL-{Math.floor(Math.random() * 10000000)}</p>
        <p>Submission Date: {new Date().toLocaleDateString()}</p>
        <p>We are processing your request. This typically takes 2-3 business days to complete.</p>
        <p>You will receive an email confirmation once the rollover has been initiated.</p>
        <p>Redirecting to your account dashboard...</p>
      </div>
    );
  }

  return (
    <div className="rol000-rollover-page">
      <header className="rol000-account-page-header">
        <div className="rol000-back-button" onClick={goToDashboard}>
          <span className="rol000-back-arrow">&#8592;</span> Back to Accounts
        </div>
        <div className="rol000-wells-fargo-branding">
          <div className="rol000-logo-container">
            <img src="/Images/wells fargo.jpeg" alt="Wells Fargo Logo" className="rol000-wf-logo" />
          </div>
        </div>
      </header>

      <div className="rol000-main-content">
        <div className="rol000-page-title">
          <h1>Retirement Account Rollover</h1>
          <p>Transfer funds from another retirement account to your Wells Fargo retirement account.</p>
        </div>
        
        <div className="rol000-progress-tracker">
          <div className={`rol000-progress-step ${currentStep >= 1 ? 'rol000-active' : ''} ${currentStep > 1 ? 'rol000-completed' : ''}`}>
            <div className="rol000-step-number">1</div>
            <div className="rol000-step-label">Source Account</div>
          </div>
          <div className="rol000-progress-line"></div>
          <div className={`rol000-progress-step ${currentStep >= 2 ? 'rol000-active' : ''} ${currentStep > 2 ? 'rol000-completed' : ''}`}>
            <div className="rol000-step-number">2</div>
            <div className="rol000-step-label">Rollover Options</div>
          </div>
          <div className="rol000-progress-line"></div>
          <div className={`rol000-progress-step ${currentStep >= 3 ? 'rol000-active' : ''} ${currentStep > 3 ? 'rol000-completed' : ''}`}>
            <div className="rol000-step-number">3</div>
            <div className="rol000-step-label">Investment Strategy</div>
          </div>
          <div className="rol000-progress-line"></div>
          <div className={`rol000-progress-step ${currentStep >= 4 ? 'rol000-active' : ''} ${currentStep > 4 ? 'rol000-completed' : ''}`}>
            <div className="rol000-step-number">4</div>
            <div className="rol000-step-label">Review & Confirm</div>
          </div>
        </div>
        
        <div className="rol000-form-container">
          {renderStepContent()}
          
          <div className="rol000-navigation-buttons">
            <button 
              className="rol000-secondary-button" 
              onClick={goToPreviousStep}
            >
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </button>
            <button 
              className="rol000-primary-button" 
              onClick={goToNextStep}
            >
              {currentStep === 4 ? 'Submit' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
      
      {isReviewModalOpen && (
        <div className="rol000-modal-overlay">
          <div className="rol000-modal-content">
            <h2>Confirm Rollover Request</h2>
            <p>You are about to initiate a rollover request with the following details:</p>
            
            <div className="rol000-modal-details">
              <div className="rol000-modal-detail-item">
                <span>From:</span>
                <span>{accountDetails.provider} ({
                  accountDetails.accountType === 'traditional' ? 'Traditional IRA' : 
                  accountDetails.accountType === 'roth' ? 'Roth IRA' : 
                  accountDetails.accountType === '401k' ? '401(k)' : 
                  accountDetails.accountType
                })</span>
              </div>
              <div className="rol000-modal-detail-item">
                <span>To:</span>
                <span>Wells Fargo {account?.retirementType || '401(k)'}</span>
              </div>
              <div className="rol000-modal-detail-item">
                <span>Amount:</span>
                <span>
                  {accountDetails.rolloverType === 'full' 
                    ? formatCurrency(accountDetails.estimatedValue) 
                    : formatCurrency(accountDetails.rolloverAmount)}
                </span>
              </div>
              <div className="rol000-modal-detail-item">
                <span>Investment Strategy:</span>
                <span>
                  {investmentStrategy === 'default' ? 'Target Date Fund' : 
                   investmentStrategy === 'match' ? 'Match Current Allocation' : 
                   'Custom Allocation'}
                </span>
              </div>
            </div>
            
            <p className="rol000-modal-note">This process typically takes 2-3 business days to complete once we receive all required information.</p>
            
            <div className="rol000-modal-buttons">
              <button 
                className="rol000-secondary-button" 
                onClick={() => setIsReviewModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="rol000-primary-button" 
                onClick={handleSubmit}
              >
                Confirm and Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolloverRetirementPage;