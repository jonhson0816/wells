import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WithdrawRetirement.css';

const WithdrawRetirement = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [withdrawalType, setWithdrawalType] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [taxWithholding, setTaxWithholding] = useState('yes');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState({});

  // Mock account data
  const retirementAccounts = [
    { id: '1', name: '401(k) Retirement Plan', number: '****4567', balance: 125000.00 },
    { id: '2', name: 'IRA Account', number: '****8901', balance: 78500.00 },
    { id: '3', name: 'Roth IRA', number: '****2345', balance: 45000.00 }
  ];

  const withdrawalReasons = [
    { id: 'retirement', label: 'Retirement' },
    { id: 'hardship', label: 'Financial Hardship' },
    { id: 'education', label: 'Education Expenses' },
    { id: 'medical', label: 'Medical Expenses' },
    { id: 'firstHome', label: 'First Home Purchase' },
    { id: 'other', label: 'Other Qualified Reason' }
  ];

  const withdrawalTypes = [
    { id: 'lumpSum', label: 'Lump Sum' },
    { id: 'partial', label: 'Partial Withdrawal' },
    { id: 'installment', label: 'Installment Payments' }
  ];

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!accountNumber) {
      newErrors.accountNumber = 'Please select an account';
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else {
      const selectedAccount = retirementAccounts.find(acc => acc.id === accountNumber);
      if (selectedAccount && parseFloat(amount) > selectedAccount.balance) {
        newErrors.amount = 'Amount exceeds available balance';
      }
    }
    
    if (!withdrawalType) {
      newErrors.withdrawalType = 'Please select a withdrawal type';
    }
    
    if (!reason) {
      newErrors.reason = 'Please select a reason for withdrawal';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        setShowConfirmation(true);
      }, 1500);
    }
  };

  const handleNewRequest = () => {
    setAmount('');
    setReason('');
    setWithdrawalType('');
    setAccountNumber('');
    setTaxWithholding('yes');
    setShowConfirmation(false);
    setErrors({});
  };

  return (
    <div className="wfr-withdraw-retirement-container">
      <header className="che004-account-page-header">
        <div className="che004-back-button" onClick={goToDashboard}>
          <span className="che004-back-arrow">&#8592;</span> Back to Accounts
        </div>
        <div className="che004-wells-fargo-branding">
          <div className="che004-logo-container">
            <img src="/Images/wells fargo.jpeg" alt="Wells Fargo Logo" className="che004-wf-logo" />
          </div>
        </div>
      </header>

      <main className="wfr-main-content">
        {!showConfirmation ? (
          <>
            <div className="wfr-page-title">
              <h1>Withdraw From Retirement Account</h1>
              <p className="wfr-subtitle">Request to withdraw funds from your retirement account</p>
            </div>
            
            <div className="wfr-info-banner">
              <div className="wfr-info-icon">i</div>
              <p>Important: Early withdrawals from retirement accounts may be subject to taxes and penalties. Please consult with a tax advisor before proceeding.</p>
            </div>
            
            <form className="wfr-withdrawal-form" onSubmit={handleSubmit}>
              <div className="wfr-form-section">
                <h2>Select Account</h2>
                <div className="wfr-account-selector">
                  {retirementAccounts.map((account) => (
                    <div 
                      key={account.id} 
                      className={`wfr-account-option ${accountNumber === account.id ? 'wfr-selected' : ''}`}
                      onClick={() => setAccountNumber(account.id)}
                    >
                      <div className="wfr-account-info">
                        <h3>{account.name}</h3>
                        <p className="wfr-account-number">Account: {account.number}</p>
                      </div>
                      <div className="wfr-account-balance">
                        <p className="wfr-balance-label">Available Balance</p>
                        <p className="wfr-balance-amount">${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      {accountNumber === account.id && <div className="wfr-checkmark">✓</div>}
                    </div>
                  ))}
                  {errors.accountNumber && <p className="wfr-error-message">{errors.accountNumber}</p>}
                </div>
              </div>
              
              <div className="wfr-form-section">
                <h2>Withdrawal Details</h2>
                
                <div className="wfr-form-group">
                  <label htmlFor="withdrawalType">Type of Withdrawal</label>
                  <select 
                    id="withdrawalType" 
                    value={withdrawalType} 
                    onChange={(e) => setWithdrawalType(e.target.value)}
                    className={errors.withdrawalType ? 'wfr-error' : ''}
                  >
                    <option value="">Select Withdrawal Type</option>
                    {withdrawalTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  {errors.withdrawalType && <p className="wfr-error-message">{errors.withdrawalType}</p>}
                </div>
                
                <div className="wfr-form-group">
                  <label htmlFor="amount">Withdrawal Amount ($)</label>
                  <input 
                    type="text" 
                    id="amount" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className={errors.amount ? 'wfr-error' : ''}
                  />
                  {errors.amount && <p className="wfr-error-message">{errors.amount}</p>}
                </div>
                
                <div className="wfr-form-group">
                  <label htmlFor="reason">Reason for Withdrawal</label>
                  <select 
                    id="reason" 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    className={errors.reason ? 'wfr-error' : ''}
                  >
                    <option value="">Select Reason</option>
                    {withdrawalReasons.map((reasonOption) => (
                      <option key={reasonOption.id} value={reasonOption.id}>{reasonOption.label}</option>
                    ))}
                  </select>
                  {errors.reason && <p className="wfr-error-message">{errors.reason}</p>}
                </div>
                
                <div className="wfr-form-group">
                  <label>Federal Tax Withholding</label>
                  <div className="wfr-radio-group">
                    <label className="wfr-radio-label">
                      <input 
                        type="radio" 
                        name="taxWithholding" 
                        value="yes" 
                        checked={taxWithholding === 'yes'} 
                        onChange={() => setTaxWithholding('yes')} 
                      />
                      Withhold federal taxes (default 20%)
                    </label>
                    <label className="wfr-radio-label">
                      <input 
                        type="radio" 
                        name="taxWithholding" 
                        value="no" 
                        checked={taxWithholding === 'no'} 
                        onChange={() => setTaxWithholding('no')} 
                      />
                      Do not withhold federal taxes (not recommended)
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="wfr-disclaimer">
                <p>By submitting this request, you acknowledge that you understand the potential tax implications and penalties associated with retirement account withdrawals.</p>
              </div>
              
              <div className="wfr-form-actions">
                <button type="button" className="wfr-secondary-button" onClick={goToDashboard}>Cancel</button>
                <button type="submit" className="wfr-primary-button" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Submit Withdrawal Request'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="wfr-confirmation">
            <div className="wfr-confirmation-icon">✓</div>
            <h2>Withdrawal Request Submitted</h2>
            <p>Your request to withdraw ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from your retirement account has been submitted successfully.</p>
            <div className="wfr-confirmation-details">
              <div className="wfr-confirmation-row">
                <span>Request ID:</span>
                <span>WDR-{Math.floor(Math.random() * 1000000)}</span>
              </div>
              <div className="wfr-confirmation-row">
                <span>Account:</span>
                <span>{retirementAccounts.find(acc => acc.id === accountNumber)?.name}</span>
              </div>
              <div className="wfr-confirmation-row">
                <span>Amount:</span>
                <span>${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="wfr-confirmation-row">
                <span>Withdrawal Type:</span>
                <span>{withdrawalTypes.find(type => type.id === withdrawalType)?.label}</span>
              </div>
              <div className="wfr-confirmation-row">
                <span>Tax Withholding:</span>
                <span>{taxWithholding === 'yes' ? 'Yes (20%)' : 'No'}</span>
              </div>
            </div>
            <p className="wfr-follow-up">Your request will be reviewed and processed within 3-5 business days. You will receive an email confirmation once processing is complete.</p>
            <div className="wfr-confirmation-actions">
              <button onClick={handleNewRequest} className="wfr-secondary-button">Submit Another Request</button>
              <button onClick={goToDashboard} className="wfr-primary-button">Return to Dashboard</button>
            </div>
          </div>
        )}
      </main>
      
      <footer className="wfr-footer">
        <p>&copy; {new Date().getFullYear()} Wells Fargo Bank, N.A. All rights reserved.</p>
        <div className="wfr-footer-links">
          <a href="#">Privacy</a>
          <a href="#">Security</a>
          <a href="#">Terms of Use</a>
          <a href="#">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default WithdrawRetirement;