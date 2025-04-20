import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ContributeRetirementPage.css';

const ContributeRetirement = () => {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('one-time');
  const [startDate, setStartDate] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Sample retirement accounts data
  const retirementAccounts = [
    { id: '1', name: '401(k) Retirement Plan', balance: '$145,320.45', number: '****7890' },
    { id: '2', name: 'Traditional IRA', balance: '$68,742.10', number: '****5432' },
    { id: '3', name: 'Roth IRA', balance: '$42,918.75', number: '****9876' }
  ];

  // Sample source accounts data
  const sourceAccounts = [
    { id: '101', name: 'Everyday Checking', balance: '$4,520.32', number: '****1234' },
    { id: '102', name: 'Way2Save Savings', balance: '$12,650.75', number: '****5678' }
  ];

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    // Here you would typically make an API call to process the contribution
    alert('Contribution scheduled successfully!');
    navigate('/dashboard');
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    
    // Remove non-numeric characters except decimal point
    let numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      numericValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Format with dollar sign and commas
    let formattedValue = numericValue;
    if (numericValue !== '') {
      const numeric = parseFloat(numericValue);
      if (!isNaN(numeric)) {
        formattedValue = '$' + numeric.toLocaleString('en-US', {
          minimumFractionDigits: parts.length > 1 ? 2 : 0,
          maximumFractionDigits: 2
        });
      }
    }
    
    return formattedValue;
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/[$,]/g, '');
    setAmount(rawValue);
  };

  return (
    <div className="che004-contribute-retirement-container">
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

      <main className="che004-contribute-retirement-main">
        <h1 className="che004-page-title">Contribute to Retirement</h1>
        
        {!showConfirmation ? (
          <form className="che004-contribution-form" onSubmit={handleSubmit}>
            <section className="che004-form-section">
              <h2 className="che004-section-title">Select Retirement Account</h2>
              <div className="che004-accounts-container">
                {retirementAccounts.map(account => (
                  <div 
                    key={account.id}
                    className={`che004-account-card ${selectedAccount === account.id ? 'che004-selected' : ''}`}
                    onClick={() => setSelectedAccount(account.id)}
                  >
                    <div className="che004-account-info">
                      <h3 className="che004-account-name">{account.name}</h3>
                      <p className="che004-account-number">Account: {account.number}</p>
                      <p className="che004-account-balance">Balance: {account.balance}</p>
                    </div>
                    <div className="che004-select-indicator"></div>
                  </div>
                ))}
              </div>
            </section>

            <section className="che004-form-section">
              <h2 className="che004-section-title">Contribution Details</h2>
              
              <div className="che004-form-group">
                <label htmlFor="amount" className="che004-form-label">Contribution Amount</label>
                <div className="che004-amount-input-container">
                  <input
                    type="text"
                    id="amount"
                    value={formatCurrency(amount)}
                    onChange={handleAmountChange}
                    className="che004-form-input che004-amount-input"
                    placeholder="$0.00"
                    required
                  />
                </div>
              </div>
              
              <div className="che004-form-group">
                <label className="che004-form-label">Frequency</label>
                <div className="che004-radio-group">
                  <div className="che004-radio-option">
                    <input
                      type="radio"
                      id="one-time"
                      name="frequency"
                      value="one-time"
                      checked={frequency === 'one-time'}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="che004-radio-input"
                    />
                    <label htmlFor="one-time" className="che004-radio-label">One-time</label>
                  </div>
                  
                  <div className="che004-radio-option">
                    <input
                      type="radio"
                      id="monthly"
                      name="frequency"
                      value="monthly"
                      checked={frequency === 'monthly'}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="che004-radio-input"
                    />
                    <label htmlFor="monthly" className="che004-radio-label">Monthly</label>
                  </div>
                  
                  <div className="che004-radio-option">
                    <input
                      type="radio"
                      id="quarterly"
                      name="frequency"
                      value="quarterly"
                      checked={frequency === 'quarterly'}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="che004-radio-input"
                    />
                    <label htmlFor="quarterly" className="che004-radio-label">Quarterly</label>
                  </div>
                </div>
              </div>
              
              <div className="che004-form-group">
                <label htmlFor="start-date" className="che004-form-label">Start Date</label>
                <input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="che004-form-input"
                  required
                />
              </div>
            </section>
            
            <section className="che004-form-section">
              <h2 className="che004-section-title">Source of Funds</h2>
              <div className="che004-accounts-container">
                {sourceAccounts.map(account => (
                  <div 
                    key={account.id}
                    className="che004-account-card"
                  >
                    <div className="che004-account-info">
                      <h3 className="che004-account-name">{account.name}</h3>
                      <p className="che004-account-number">Account: {account.number}</p>
                      <p className="che004-account-balance">Available: {account.balance}</p>
                    </div>
                    <div className="che004-radio-option">
                      <input
                        type="radio"
                        id={`source-${account.id}`}
                        name="source-account"
                        value={account.id}
                        className="che004-radio-input"
                      />
                      <label htmlFor={`source-${account.id}`} className="che004-select-source"></label>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            <div className="che004-form-actions">
              <button type="button" className="che004-button che004-button-secondary" onClick={goToDashboard}>
                Cancel
              </button>
              <button type="submit" className="che004-button che004-button-primary">
                Continue
              </button>
            </div>
          </form>
        ) : (
          <div className="che004-confirmation-section">
            <h2 className="che004-section-title">Confirm Your Contribution</h2>
            
            <div className="che004-confirmation-details">
              <div className="che004-confirmation-row">
                <span className="che004-confirmation-label">Retirement Account:</span>
                <span className="che004-confirmation-value">
                  {retirementAccounts.find(a => a.id === selectedAccount)?.name}
                </span>
              </div>
              
              <div className="che004-confirmation-row">
                <span className="che004-confirmation-label">Contribution Amount:</span>
                <span className="che004-confirmation-value">{formatCurrency(amount)}</span>
              </div>
              
              <div className="che004-confirmation-row">
                <span className="che004-confirmation-label">Frequency:</span>
                <span className="che004-confirmation-value">
                  {frequency === 'one-time' ? 'One-time' : 
                   frequency === 'monthly' ? 'Monthly' : 'Quarterly'}
                </span>
              </div>
              
              <div className="che004-confirmation-row">
                <span className="che004-confirmation-label">Start Date:</span>
                <span className="che004-confirmation-value">{startDate}</span>
              </div>
            </div>
            
            <div className="che004-form-actions">
              <button 
                type="button" 
                className="che004-button che004-button-secondary"
                onClick={() => setShowConfirmation(false)}
              >
                Back
              </button>
              <button 
                type="button" 
                className="che004-button che004-button-primary"
                onClick={handleConfirm}
              >
                Confirm Contribution
              </button>
            </div>
          </div>
        )}
      </main>
      
      <footer className="che004-page-footer">
        <p>© 2025 Wells Fargo Bank, N.A. All rights reserved.</p>
        <div className="che004-footer-links">
          <a href="#privacy" className="che004-footer-link">Privacy</a>
          <a href="#security" className="che004-footer-link">Security</a>
          <a href="#terms" className="che004-footer-link">Terms & Conditions</a>
        </div>
      </footer>
    </div>
  );
};

export default ContributeRetirement;