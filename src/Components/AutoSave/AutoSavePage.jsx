import React, { useState } from 'react';
import './AutoSavePage.css'

const AutoSavePage = () => {
  // State for AutoSave settings
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [amount, setAmount] = useState('');
  const [sourceAccount, setSourceAccount] = useState('');
  const [targetAccount, setTargetAccount] = useState('');
  const [savingGoal, setSavingGoal] = useState('');
  const [savingGoalAmount, setSavingGoalAmount] = useState('');
  const [autoSaveRules, setAutoSaveRules] = useState([]);
  const [showAddRuleForm, setShowAddRuleForm] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState('fixed');
  const [newRuleAmount, setNewRuleAmount] = useState('');
  const [newRuleTrigger, setNewRuleTrigger] = useState('');

  // Mock data for accounts
  const mockAccounts = [
    { id: '1', name: 'Everyday Checking', balance: '5,243.87', number: '1234567890' },
    { id: '2', name: 'Way2Save Savings', balance: '12,500.24', number: '0987654321' },
    { id: '3', name: 'Market Rate Savings', balance: '25,100.56', number: '5678901234' }
  ];

  // Mock data for transaction history
  const [autoSaveHistory, setAutoSaveHistory] = useState([
    { 
      id: '1', 
      date: '03/28/2025', 
      amount: '$50.00', 
      from: 'Everyday Checking', 
      to: 'Way2Save Savings',
      description: 'Weekly AutoSave Transfer'
    },
    { 
      id: '2', 
      date: '03/21/2025', 
      amount: '$50.00', 
      from: 'Everyday Checking', 
      to: 'Way2Save Savings',
      description: 'Weekly AutoSave Transfer'
    },
    { 
      id: '3', 
      date: '03/14/2025', 
      amount: '$50.00', 
      from: 'Everyday Checking', 
      to: 'Way2Save Savings',
      description: 'Weekly AutoSave Transfer'
    }
  ]);

  // Handle form submission for primary AutoSave setup
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Here you would integrate with your API to set up the AutoSave feature
    alert('AutoSave settings saved successfully!');
    setIsAutoSaveEnabled(true);
  };

  // Handle adding a new AutoSave rule
  const handleAddRule = (e) => {
    e.preventDefault();
    
    const newRule = {
      id: Date.now().toString(),
      name: newRuleName,
      type: newRuleType,
      amount: newRuleAmount,
      trigger: newRuleTrigger
    };
    
    setAutoSaveRules([...autoSaveRules, newRule]);
    setShowAddRuleForm(false);
    resetRuleForm();
  };

  // Reset the rule form
  const resetRuleForm = () => {
    setNewRuleName('');
    setNewRuleType('fixed');
    setNewRuleAmount('');
    setNewRuleTrigger('');
  };

  // Handle deleting an AutoSave rule
  const handleDeleteRule = (ruleId) => {
    setAutoSaveRules(autoSaveRules.filter(rule => rule.id !== ruleId));
  };

  // Handle pausing AutoSave
  const handleToggleAutoSave = () => {
    setIsAutoSaveEnabled(!isAutoSaveEnabled);
    
    // Here you would integrate with your API to pause/resume AutoSave
    alert(isAutoSaveEnabled ? 'AutoSave paused' : 'AutoSave resumed');
  };

  return (
    <div className="autosave-page">
      <header>
        <h1>AutoSave</h1>
        <p>Set up automatic transfers to reach your savings goals faster</p>
      </header>

      <section className="autosave-summary">
        <div className="autosave-status">
          <h2>AutoSave Status</h2>
          <div>
            <span>Status: {isAutoSaveEnabled ? 'Active' : 'Inactive'}</span>
            <button onClick={handleToggleAutoSave}>
              {isAutoSaveEnabled ? 'Pause AutoSave' : 'Resume AutoSave'}
            </button>
          </div>
        </div>

        {isAutoSaveEnabled && (
          <div className="autosave-current-settings">
            <h3>Current Settings</h3>
            <p>Transferring ${amount} {frequency} from {sourceAccount} to {targetAccount}</p>
            {savingGoal && (
              <div className="saving-goal">
                <h4>Saving Goal: {savingGoal}</h4>
                <p>Target Amount: ${savingGoalAmount}</p>
                {/* Progress bar would go here with your CSS */}
                <div className="progress-bar-container">
                  <div className="progress-bar"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {!isAutoSaveEnabled && (
        <section className="autosave-setup">
          <h2>Set Up AutoSave</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="amount">Amount to save:</label>
              <div className="input-with-prefix">
                <span>$</span>
                <input
                  type="text"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="frequency">Frequency:</label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every two weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sourceAccount">Transfer from:</label>
              <select
                id="sourceAccount"
                value={sourceAccount}
                onChange={(e) => setSourceAccount(e.target.value)}
                required
              >
                <option value="">Select an account</option>
                {mockAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} (${account.balance})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="targetAccount">Transfer to:</label>
              <select
                id="targetAccount"
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value)}
                required
              >
                <option value="">Select an account</option>
                {mockAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} (${account.balance})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="savingGoal">Saving goal (optional):</label>
              <input
                type="text"
                id="savingGoal"
                value={savingGoal}
                onChange={(e) => setSavingGoal(e.target.value)}
                placeholder="e.g., Vacation, Emergency Fund"
              />
            </div>

            {savingGoal && (
              <div className="form-group">
                <label htmlFor="savingGoalAmount">Goal amount:</label>
                <div className="input-with-prefix">
                  <span>$</span>
                  <input
                    type="text"
                    id="savingGoalAmount"
                    value={savingGoalAmount}
                    onChange={(e) => setSavingGoalAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            <button type="submit" className="primary-button">Set Up AutoSave</button>
          </form>
        </section>
      )}

      <section className="autosave-rules">
        <div className="section-header">
          <h2>AutoSave Rules</h2>
          <button 
            onClick={() => setShowAddRuleForm(true)}
            className="secondary-button"
          >
            Add Rule
          </button>
        </div>

        {autoSaveRules.length > 0 ? (
          <ul className="rules-list">
            {autoSaveRules.map(rule => (
              <li key={rule.id} className="rule-item">
                <div className="rule-details">
                  <h4>{rule.name}</h4>
                  <p>
                    {rule.type === 'fixed' 
                      ? `Save $${rule.amount} when ${rule.trigger}` 
                      : `Save ${rule.amount}% when ${rule.trigger}`}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteRule(rule.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No custom rules set up yet. Add rules to automate your savings based on specific events.</p>
        )}

        {showAddRuleForm && (
          <div className="add-rule-form">
            <h3>Create New Rule</h3>
            <form onSubmit={handleAddRule}>
              <div className="form-group">
                <label htmlFor="newRuleName">Rule Name:</label>
                <input
                  type="text"
                  id="newRuleName"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g., Coffee Savings"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newRuleType">Save Type:</label>
                <select
                  id="newRuleType"
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value)}
                  required
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="newRuleAmount">
                  {newRuleType === 'fixed' ? 'Amount:' : 'Percentage:'}
                </label>
                <div className="input-with-prefix">
                  <span>{newRuleType === 'fixed' ? '$' : '%'}</span>
                  <input
                    type="text"
                    id="newRuleAmount"
                    value={newRuleAmount}
                    onChange={(e) => setNewRuleAmount(e.target.value)}
                    placeholder={newRuleType === 'fixed' ? '0.00' : '0'}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="newRuleTrigger">When to save:</label>
                <select
                  id="newRuleTrigger"
                  value={newRuleTrigger}
                  onChange={(e) => setNewRuleTrigger(e.target.value)}
                  required
                >
                  <option value="">Select a trigger</option>
                  <option value="depositing-paycheck">I deposit my paycheck</option>
                  <option value="spending-restaurant">I spend at restaurants</option>
                  <option value="spending-shopping">I spend on shopping</option>
                  <option value="receiving-refund">I receive a refund</option>
                  <option value="account-above">My account is above a certain amount</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button">Save Rule</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddRuleForm(false);
                    resetRuleForm();
                  }}
                  className="secondary-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      <section className="transaction-history">
        <h2>AutoSave Transaction History</h2>
        {autoSaveHistory.length > 0 ? (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>From</th>
                <th>To</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {autoSaveHistory.map(transaction => (
                <tr key={transaction.id}>
                  <td>{transaction.date}</td>
                  <td>{transaction.amount}</td>
                  <td>{transaction.from}</td>
                  <td>{transaction.to}</td>
                  <td>{transaction.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No AutoSave transactions yet.</p>
        )}
      </section>

      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-item">
          <h3>How does AutoSave work?</h3>
          <p>
            AutoSave automatically transfers money from your checking account to your savings 
            account based on the schedule and rules you set up. You can choose the amount, 
            frequency, and accounts.
          </p>
        </div>
        <div className="faq-item">
          <h3>Can I change or pause my AutoSave settings?</h3>
          <p>
            Yes, you can modify or pause your AutoSave settings at any time through this page.
            Changes will take effect immediately.
          </p>
        </div>
        <div className="faq-item">
          <h3>What happens if I don't have enough funds for an AutoSave transfer?</h3>
          <p>
            If there are insufficient funds in your source account, the AutoSave transfer will 
            not process. We'll notify you and try again on the next scheduled date.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AutoSavePage;