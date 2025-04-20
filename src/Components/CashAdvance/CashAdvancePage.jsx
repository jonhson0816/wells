import React, { useState, useEffect } from 'react';
import './CashAdvancePage.css'

const CashAdvance = () => {
  // State management for the cash advance page
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [availableCreditLimit, setAvailableCreditLimit] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [destinationAccounts, setDestinationAccounts] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [fees, setFees] = useState(0);
  const [apr, setApr] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [interestInfo, setInterestInfo] = useState({});
  const [recentAdvances, setRecentAdvances] = useState([]);

  // Mock data fetch - would be replaced with actual API calls
  useEffect(() => {
    // Simulate API call to fetch eligible credit accounts
    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
        
        // This would be an API call in a real implementation
        // Simulating a response delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        const mockCreditAccounts = [
          { id: 'cc-1234', name: 'Wells Fargo Active Cash®', lastFourDigits: '1234', availableCredit: 5000, apr: 18.99 },
          { id: 'cc-5678', name: 'Wells Fargo Reflect®', lastFourDigits: '5678', availableCredit: 8500, apr: 16.24 },
          { id: 'loc-9012', name: 'Personal Line of Credit', lastFourDigits: '9012', availableCredit: 10000, apr: 12.75 }
        ];
        
        const mockDestinationAccounts = [
          { id: 'chk-2468', name: 'Everyday Checking', lastFourDigits: '2468', balance: 1250.45 },
          { id: 'sav-1357', name: 'Way2Save Savings', lastFourDigits: '1357', balance: 3750.22 }
        ];
        
        const mockRecentAdvances = [
          { id: 'adv-1001', date: '03/25/2025', amount: 1000, account: 'Wells Fargo Active Cash®', status: 'Completed' },
          { id: 'adv-1002', date: '02/15/2025', amount: 500, account: 'Personal Line of Credit', status: 'Completed' }
        ];
        
        setAccounts(mockCreditAccounts);
        setDestinationAccounts(mockDestinationAccounts);
        setRecentAdvances(mockRecentAdvances);
        setIsLoading(false);
      } catch (err) {
        setError('Unable to load your accounts. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchAccounts();
  }, []);

  // Update available credit limit when account is selected
  useEffect(() => {
    if (selectedAccount) {
      const account = accounts.find(acc => acc.id === selectedAccount);
      if (account) {
        setAvailableCreditLimit(account.availableCredit);
        setApr(account.apr);
        
        // Calculate the cash advance fee (typically 3-5% of amount or $10, whichever is greater)
        const feePercentage = 0.05; // 5%
        const minFee = 10;
        
        setInterestInfo({
          feePercentage: feePercentage * 100,
          minFee,
          apr: account.apr
        });
      }
    }
  }, [selectedAccount, accounts]);

  // Calculate fees when advance amount changes
  useEffect(() => {
    if (advanceAmount && !isNaN(advanceAmount)) {
      const amount = parseFloat(advanceAmount);
      const feePercentage = 0.05; // 5%
      const minFee = 10;
      const calculatedFee = Math.max(amount * feePercentage, minFee);
      setFees(calculatedFee);
    } else {
      setFees(0);
    }
  }, [advanceAmount]);

  const handleAccountChange = (e) => {
    setSelectedAccount(e.target.value);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAdvanceAmount(value);
    }
  };

  const handleDestinationChange = (e) => {
    setSelectedDestination(e.target.value);
  };

  const handleProceedToConfirmation = () => {
    // Form validation
    if (!selectedAccount) {
      setError('Please select a source account');
      return;
    }
    
    if (!advanceAmount || parseFloat(advanceAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(advanceAmount) > availableCreditLimit) {
      setError('Amount exceeds your available credit limit');
      return;
    }
    
    if (!selectedDestination) {
      setError('Please select a destination account');
      return;
    }
    
    // Clear any existing errors and proceed to confirmation
    setError('');
    setConfirmationStep(true);
  };

  const handleSubmitCashAdvance = async () => {
    try {
      setIsLoading(true);
      
      // This would be an API call in a real implementation
      // Simulating a response delay and processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a transaction ID (would come from the server in real implementation)
      const mockTransactionId = `ADV-${Date.now().toString().slice(-8)}`;
      setTransactionId(mockTransactionId);
      
      // Update the recent advances list
      const sourceAccount = accounts.find(acc => acc.id === selectedAccount);
      const newAdvance = {
        id: mockTransactionId,
        date: new Date().toLocaleDateString(),
        amount: parseFloat(advanceAmount),
        account: sourceAccount.name,
        status: 'Completed'
      };
      
      setRecentAdvances([newAdvance, ...recentAdvances]);
      setTransactionComplete(true);
      setIsLoading(false);
    } catch (err) {
      setError('Unable to process your cash advance. Please try again later.');
      setIsLoading(false);
    }
  };

  const handleBackToForm = () => {
    setConfirmationStep(false);
  };

  const handleStartNewAdvance = () => {
    // Reset form
    setSelectedAccount('');
    setAdvanceAmount('');
    setSelectedDestination('');
    setConfirmationStep(false);
    setTransactionComplete(false);
    setTransactionId('');
  };

  // Render loading state
  if (isLoading && !confirmationStep && !transactionComplete) {
    return (
      <div className="cash-advance-container">
        <h1>Cash Advance</h1>
        <div className="loading-indicator">
          <p>Loading your account information...</p>
          {/* Loading spinner would go here */}
        </div>
      </div>
    );
  }

  // Render transaction complete state
  if (transactionComplete) {
    const destinationAccount = destinationAccounts.find(acc => acc.id === selectedDestination);
    
    return (
      <div className="cash-advance-container">
        <div className="success-container">
          <h1>Cash Advance Complete</h1>
          <div className="success-icon">
            {/* Success icon would go here */}
          </div>
          <p className="success-message">Your cash advance has been successfully processed!</p>
          
          <div className="transaction-details">
            <h2>Transaction Details</h2>
            <div className="detail-row">
              <span>Transaction ID:</span>
              <span>{transactionId}</span>
            </div>
            <div className="detail-row">
              <span>Amount:</span>
              <span>${parseFloat(advanceAmount).toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span>Fee:</span>
              <span>${fees.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span>Total:</span>
              <span>${(parseFloat(advanceAmount) + fees).toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span>From:</span>
              <span>{accounts.find(acc => acc.id === selectedAccount)?.name}</span>
            </div>
            <div className="detail-row">
              <span>To:</span>
              <span>{destinationAccount?.name}</span>
            </div>
            <div className="detail-row">
              <span>Date:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="transaction-disclaimer">
            <p>Interest will begin accruing immediately at {apr}% APR.</p>
            <p>A record of this transaction has been sent to your secure message center.</p>
          </div>
          
          <div className="action-buttons">
            <button onClick={handleStartNewAdvance}>Request Another Cash Advance</button>
          </div>
        </div>
      </div>
    );
  }

  // Render confirmation step
  if (confirmationStep) {
    const sourceAccount = accounts.find(acc => acc.id === selectedAccount);
    const destinationAccount = destinationAccounts.find(acc => acc.id === selectedDestination);
    const totalAmount = parseFloat(advanceAmount) + fees;
    
    return (
      <div className="cash-advance-container">
        <h1>Confirm Cash Advance</h1>
        
        <div className="confirmation-details">
          <h2>Please review and confirm your cash advance request</h2>
          
          <div className="detail-row">
            <span>Amount:</span>
            <span>${parseFloat(advanceAmount).toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <span>Cash Advance Fee:</span>
            <span>${fees.toFixed(2)}</span>
          </div>
          <div className="detail-row highlight-total">
            <span>Total Amount:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <span>From:</span>
            <span>{sourceAccount?.name} (ending in {sourceAccount?.lastFourDigits})</span>
          </div>
          <div className="detail-row">
            <span>To:</span>
            <span>{destinationAccount?.name} (ending in {destinationAccount?.lastFourDigits})</span>
          </div>
          <div className="detail-row">
            <span>APR:</span>
            <span>{apr}%</span>
          </div>
        </div>
        
        <div className="terms-disclaimer">
          <h3>Important Information</h3>
          <p>By proceeding with this cash advance, you agree to the following:</p>
          <ul>
            <li>Interest will begin accruing immediately at {apr}% APR</li>
            <li>This transaction is subject to a cash advance fee of ${fees.toFixed(2)}</li>
            <li>Cash advances do not have a grace period and may result in higher overall interest charges</li>
            <li>This transaction will reduce your available credit by ${totalAmount.toFixed(2)}</li>
          </ul>
          <div className="terms-acceptance">
            <input type="checkbox" id="terms-agree" required />
            <label htmlFor="terms-agree">I understand and accept these terms</label>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="action-buttons">
          <button onClick={handleBackToForm}>Back</button>
          <button onClick={handleSubmitCashAdvance} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Confirm Cash Advance'}
          </button>
        </div>
      </div>
    );
  }

  // Render main form
  return (
    <div className="cash-advance-container">
      <h1>Request a Cash Advance</h1>
      
      <div className="section-info">
        <p>A cash advance allows you to borrow cash from your credit line and transfer it to your checking or savings account.</p>
        <p className="warning-notice">Important: Cash advances begin accruing interest immediately and may include additional fees.</p>
      </div>
      
      <div className="form-section">
        <h2>1. Select Source</h2>
        <p>Choose the credit account you would like to borrow from:</p>
        
        <div className="form-group">
          <label htmlFor="source-account">Credit Account</label>
          <select 
            id="source-account" 
            value={selectedAccount} 
            onChange={handleAccountChange}
          >
            <option value="">Select an account</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} (ending in {account.lastFourDigits}) - Available: ${account.availableCredit.toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        
        {selectedAccount && (
          <div className="account-details">
            <div className="credit-limit-indicator">
              <span>Available Credit: ${availableCreditLimit.toFixed(2)}</span>
              <span>APR: {apr}%</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="form-section">
        <h2>2. Enter Amount</h2>
        <p>Enter the amount you would like to advance from this account:</p>
        
        <div className="form-group">
          <label htmlFor="advance-amount">Advance Amount</label>
          <div className="input-with-icon">
            <span className="dollar-sign">$</span>
            <input
              type="text"
              id="advance-amount"
              value={advanceAmount}
              onChange={handleAmountChange}
              placeholder="0.00"
              disabled={!selectedAccount}
            />
          </div>
        </div>
        
        {advanceAmount && !isNaN(advanceAmount) && parseFloat(advanceAmount) > 0 && (
          <div className="fee-calculation">
            <div className="fee-detail">
              <span>Cash Advance Fee:</span>
              <span>${fees.toFixed(2)}</span>
            </div>
            <div className="fee-detail total-amount">
              <span>Total Amount (including fee):</span>
              <span>${(parseFloat(advanceAmount) + fees).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="form-section">
        <h2>3. Select Destination</h2>
        <p>Choose where you want the funds to be deposited:</p>
        
        <div className="form-group">
          <label htmlFor="destination-account">Deposit To</label>
          <select 
            id="destination-account" 
            value={selectedDestination} 
            onChange={handleDestinationChange}
            disabled={!selectedAccount || !advanceAmount}
          >
            <option value="">Select an account</option>
            {destinationAccounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} (ending in {account.lastFourDigits}) - Balance: ${account.balance.toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {advanceAmount && selectedAccount && (
        <div className="cost-summary">
          <h3>Cost Summary</h3>
          <p>Taking a cash advance has the following costs:</p>
          <ul>
            <li>One-time fee: {interestInfo.feePercentage}% of advance amount (minimum ${interestInfo.minFee})</li>
            <li>Interest starts accruing immediately at {interestInfo.apr}% APR</li>
            <li>No grace period applies to cash advances</li>
          </ul>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="action-buttons">
        <button 
          onClick={handleProceedToConfirmation}
          disabled={!selectedAccount || !advanceAmount || !selectedDestination}
        >
          Continue
        </button>
      </div>
      
      {recentAdvances.length > 0 && (
        <div className="recent-advances">
          <h2>Recent Cash Advances</h2>
          <div className="advances-table">
            <div className="table-header">
              <div>Date</div>
              <div>Amount</div>
              <div>Account</div>
              <div>Status</div>
            </div>
            {recentAdvances.map(advance => (
              <div key={advance.id} className="table-row">
                <div>{advance.date}</div>
                <div>${advance.amount.toFixed(2)}</div>
                <div>{advance.account}</div>
                <div>{advance.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashAdvance;