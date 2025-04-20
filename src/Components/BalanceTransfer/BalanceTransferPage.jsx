import { useState, useEffect } from 'react';
import './BalanceTransferPage.css'

const BalanceTransfer = () => {
  // State for form inputs
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [frequency, setFrequency] = useState('once');
  const [scheduleDate, setScheduleDate] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [recentTransfers, setRecentTransfers] = useState([]);

  // Fetch user accounts on component mount
  useEffect(() => {
    // In a real app, you would fetch from your API
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        // Mock API call - replace with actual API call
        setTimeout(() => {
          const mockAccounts = [
            { id: '1', name: 'Everyday Checking', accountNumber: '****1234', balance: 5420.65, type: 'checking' },
            { id: '2', name: 'Way2Save Savings', accountNumber: '****5678', balance: 12500.32, type: 'savings' },
            { id: '3', name: 'Portfolio Checking', accountNumber: '****9012', balance: 8745.19, type: 'checking' },
            { id: '4', name: 'Market Rate Savings', accountNumber: '****3456', balance: 25000.00, type: 'savings' }
          ];
          
          const mockTransfers = [
            { id: '1', from: 'Everyday Checking', to: 'Way2Save Savings', amount: 200.00, date: '2025-03-25', status: 'Completed' },
            { id: '2', from: 'Portfolio Checking', to: 'Market Rate Savings', amount: 500.00, date: '2025-03-20', status: 'Completed' },
            { id: '3', from: 'Everyday Checking', to: 'Portfolio Checking', amount: 150.00, date: '2025-03-15', status: 'Completed' }
          ];
          
          setAccounts(mockAccounts);
          setRecentTransfers(mockTransfers);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Unable to fetch accounts. Please try again later.');
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!fromAccount || !toAccount || !amount) {
      setError('Please fill out all required fields');
      return;
    }
    
    if (fromAccount === toAccount) {
      setError('From and To accounts cannot be the same');
      return;
    }
    
    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    
    // In a real app, you would validate enough balance is available
    const selectedFromAccount = accounts.find(acc => acc.id === fromAccount);
    if (parseFloat(amount) > selectedFromAccount.balance) {
      setError('Insufficient funds for this transfer');
      return;
    }
    
    // Clear any previous errors
    setError(null);
    
    // Show confirmation screen
    setConfirmTransfer(true);
  };

  // Handle confirm transfer
  const handleConfirmTransfer = () => {
    // In a real app, you would make an API call to process the transfer
    setTimeout(() => {
      // Update the account balances (mock)
      const updatedAccounts = accounts.map(acc => {
        if (acc.id === fromAccount) {
          return { ...acc, balance: acc.balance - parseFloat(amount) };
        }
        if (acc.id === toAccount) {
          return { ...acc, balance: acc.balance + parseFloat(amount) };
        }
        return acc;
      });
      
      // Add to recent transfers
      const fromAccountName = accounts.find(acc => acc.id === fromAccount).name;
      const toAccountName = accounts.find(acc => acc.id === toAccount).name;
      
      const newTransfer = {
        id: Date.now().toString(),
        from: fromAccountName,
        to: toAccountName,
        amount: parseFloat(amount),
        date: scheduleDate || new Date().toISOString().split('T')[0],
        status: scheduleDate ? 'Scheduled' : 'Completed'
      };
      
      setRecentTransfers([newTransfer, ...recentTransfers]);
      setAccounts(updatedAccounts);
      setSuccess(true);
      setConfirmTransfer(false);
    }, 1500);
  };

  // Handle another transfer
  const handleAnotherTransfer = () => {
    setFromAccount('');
    setToAccount('');
    setAmount('');
    setMemo('');
    setFrequency('once');
    setScheduleDate('');
    setSuccess(false);
    setConfirmTransfer(false);
  };

  // Handle cancel transfer
  const handleCancelTransfer = () => {
    setConfirmTransfer(false);
  };

  // Render the loading state
  if (loading) {
    return (
      <div className="balance-transfer-page">
        <h1>Balance Transfer</h1>
        <div className="loading-spinner">Loading your accounts...</div>
      </div>
    );
  }

  // Render the success state
  if (success) {
    return (
      <div className="balance-transfer-page">
        <div className="success-container">
          <h1>Transfer Successful</h1>
          <div className="success-icon">✓</div>
          <p>Your transfer of {formatCurrency(parseFloat(amount))} has been {scheduleDate ? 'scheduled' : 'completed'}.</p>
          
          <div className="transfer-details">
            <div className="detail-row">
              <span>From:</span>
              <span>{accounts.find(acc => acc.id === fromAccount).name}</span>
            </div>
            <div className="detail-row">
              <span>To:</span>
              <span>{accounts.find(acc => acc.id === toAccount).name}</span>
            </div>
            <div className="detail-row">
              <span>Amount:</span>
              <span>{formatCurrency(parseFloat(amount))}</span>
            </div>
            {scheduleDate && (
              <div className="detail-row">
                <span>Date:</span>
                <span>{scheduleDate}</span>
              </div>
            )}
            {memo && (
              <div className="detail-row">
                <span>Memo:</span>
                <span>{memo}</span>
              </div>
            )}
            <div className="detail-row">
              <span>Confirmation #:</span>
              <span>WF{Math.floor(Math.random() * 10000000)}</span>
            </div>
          </div>
          
          <button onClick={handleAnotherTransfer} className="primary-button">Make Another Transfer</button>
          <button onClick={() => window.print()} className="secondary-button">Print Confirmation</button>
        </div>
      </div>
    );
  }

  // Render the confirmation state
  if (confirmTransfer) {
    const fromAccountDetails = accounts.find(acc => acc.id === fromAccount);
    const toAccountDetails = accounts.find(acc => acc.id === toAccount);
    
    return (
      <div className="balance-transfer-page">
        <h1>Confirm Transfer</h1>
        
        <div className="confirmation-container">
          <h2>Please review your transfer details</h2>
          
          <div className="confirmation-details">
            <div className="detail-row">
              <span>From:</span>
              <span>{fromAccountDetails.name} ({fromAccountDetails.accountNumber})</span>
            </div>
            <div className="detail-row">
              <span>Available Balance:</span>
              <span>{formatCurrency(fromAccountDetails.balance)}</span>
            </div>
            <div className="detail-row">
              <span>To:</span>
              <span>{toAccountDetails.name} ({toAccountDetails.accountNumber})</span>
            </div>
            <div className="detail-row">
              <span>Amount:</span>
              <span>{formatCurrency(parseFloat(amount))}</span>
            </div>
            {frequency !== 'once' && (
              <div className="detail-row">
                <span>Frequency:</span>
                <span>{frequency.charAt(0).toUpperCase() + frequency.slice(1)}</span>
              </div>
            )}
            {scheduleDate && (
              <div className="detail-row">
                <span>Date:</span>
                <span>{scheduleDate}</span>
              </div>
            )}
            {memo && (
              <div className="detail-row">
                <span>Memo:</span>
                <span>{memo}</span>
              </div>
            )}
          </div>
          
          <div className="confirmation-footer">
            <p>By clicking "Transfer Now" you agree to the <a href="#">Transfer Terms and Conditions</a>.</p>
            <div className="button-group">
              <button onClick={handleConfirmTransfer} className="primary-button">Transfer Now</button>
              <button onClick={handleCancelTransfer} className="secondary-button">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the main form
  return (
    <div className="balance-transfer-page">
      <h1>Transfer Money</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="transfer-form">
        <div className="form-section">
          <h2>Transfer From</h2>
          <div className="form-field">
            <label htmlFor="fromAccount">From Account *</label>
            <select
              id="fromAccount"
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              required
            >
              <option value="">Select account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.accountNumber} - {formatCurrency(account.balance)}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Transfer To</h2>
          <div className="form-field">
            <label htmlFor="toAccount">To Account *</label>
            <select
              id="toAccount"
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              required
            >
              <option value="">Select account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.accountNumber} - {formatCurrency(account.balance)}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Amount</h2>
          <div className="form-field">
            <label htmlFor="amount">Amount *</label>
            <div className="amount-input-container">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Transfer Options</h2>
          <div className="form-field">
            <label htmlFor="frequency">Frequency</label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="once">One time</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div className="form-field">
            <label htmlFor="scheduleDate">When</label>
            <input
              type="date"
              id="scheduleDate"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            {!scheduleDate && <span className="input-help">Leave blank for immediate transfer</span>}
          </div>
          
          <div className="form-field">
            <label htmlFor="memo">Memo (Optional)</label>
            <input
              type="text"
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="e.g., Rent payment"
              maxLength="30"
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="primary-button">Continue</button>
          <button type="button" className="secondary-button" onClick={() => window.history.back()}>Cancel</button>
        </div>
      </form>
      
      <div className="recent-transfers">
        <h2>Recent Transfers</h2>
        {recentTransfers.length > 0 ? (
          <div className="transfers-list">
            {recentTransfers.map(transfer => (
              <div key={transfer.id} className="transfer-item">
                <div className="transfer-info">
                  <div className="transfer-accounts">
                    <span>{transfer.from}</span>
                    <span className="transfer-arrow">→</span>
                    <span>{transfer.to}</span>
                  </div>
                  <div className="transfer-amount">{formatCurrency(transfer.amount)}</div>
                </div>
                <div className="transfer-meta">
                  <span className="transfer-date">{transfer.date}</span>
                  <span className={`transfer-status status-${transfer.status.toLowerCase()}`}>{transfer.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No recent transfers to display.</p>
        )}
      </div>
    </div>
  );
};

export default BalanceTransfer;