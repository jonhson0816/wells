import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './AccountDetailPage.css'; // Make sure to create this CSS file

// Utility function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Account Types Constants
const ACCOUNT_TYPES = {
  CHECKING: 'Checking Account',
  SAVINGS: 'Savings Account', 
  CREDIT: 'Credit Account',
  RETIREMENT: 'Retirement Account'
};

const AccountDetailPage = () => {
  const { accountId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('last30Days');
  
  // Get account data from location state or fetch it based on accountId
  useEffect(() => {
    // First check if account is passed in location state
    if (location.state && location.state.account) {
      setAccount(location.state.account);
    } else if (accountId) {
      // In a real app, you would fetch the account data from an API
      // For this example, we'll use dummy data
      const mockAccount = {
        id: accountId,
        type: ACCOUNT_TYPES.CHECKING,
        accountNumber: '****5678',
        balance: 45678.92,
        creditLimit: 0
      };
      setAccount(mockAccount);
    }
  }, [accountId, location.state]);
  
  // Generate mock transaction history
  useEffect(() => {
    if (account) {
      const transactions = [
        { 
          id: 1, 
          date: '2024-03-15', 
          description: 'Online Purchase - Amazon', 
          amount: -125.50, 
          type: 'Debit' 
        },
        { 
          id: 2, 
          date: '2024-03-14', 
          description: 'Salary Deposit', 
          amount: 5000.00, 
          type: 'Credit' 
        },
        { 
          id: 3, 
          date: '2024-03-12', 
          description: 'Grocery Store', 
          amount: -87.25, 
          type: 'Debit' 
        },
        { 
          id: 4, 
          date: '2024-03-10', 
          description: 'Mobile Check Deposit', 
          amount: 750.00, 
          type: 'Credit' 
        }
      ];
      setTransactionHistory(transactions);
    }
  }, [account]);

  // Handle actions
  const handleTransfer = () => {
    navigate('/transfers', { state: { fromAccount: account } });
  };

  const handleWithdraw = () => {
    // Show withdrawal modal or navigate to withdrawal page
    console.log('Withdraw from account:', account);
  };

  const handleDeposit = () => {
    // Navigate to deposit page
    console.log('Deposit to account:', account);
  };

  // If no account is found, show a loading or error state
  if (!account) {
    return (
      <div className="account-detail-container">
        <div className="account-loading">Loading account details...</div>
      </div>
    );
  }

  return (
    <div className="account-detail-container">
      <section className="account-summary">
        <div className="account-header">
          <h1>{account.type}</h1>
          <p className="account-number">{account.accountNumber}</p>
        </div>
        
        <div className="account-balance">
          {account.type === ACCOUNT_TYPES.CREDIT ? (
            <>
              <p>Available Credit</p>
              <h2>{formatCurrency(account.creditLimit + account.balance)}</h2>
              <p className="balance-details">
                Credit Limit: {formatCurrency(account.creditLimit)}
                <br />
                Current Balance: {formatCurrency(Math.abs(account.balance))}
              </p>
            </>
          ) : (
            <>
              <p>Current Balance</p>
              <h2>{formatCurrency(account.balance)}</h2>
            </>
          )}
        </div>

        <div className="quick-actions">
          <button 
            className="action-btn transfer" 
            onClick={handleTransfer}
          >
            Transfer
          </button>
          <button 
            className="action-btn withdraw" 
            onClick={handleWithdraw}
          >
            Withdraw
          </button>
          {account.type !== ACCOUNT_TYPES.CREDIT && (
            <button 
              className="action-btn deposit" 
              onClick={handleDeposit}
            >
              Deposit
            </button>
          )}
        </div>
      </section>

      <section className="transaction-history">
        <div className="transactions-header">
          <h2>Transaction History</h2>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="last30Days">Last 30 Days</option>
            <option value="last3Months">Last 3 Months</option>
            <option value="thisYear">This Year</option>
          </select>
        </div>

        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactionHistory.map(transaction => (
              <tr 
                key={transaction.id} 
                className={transaction.type === 'Credit' ? 'credit-transaction' : 'debit-transaction'}
              >
                <td>{transaction.date}</td>
                <td>{transaction.description}</td>
                <td>{formatCurrency(transaction.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AccountDetailPage;