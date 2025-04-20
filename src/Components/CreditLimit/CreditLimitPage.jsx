import React, { useState, useEffect } from 'react';
import './CreditLimitPage.css'

// Main CreditLimit component
const CreditLimit = () => {
  // State management for user's credit information
  const [creditInfo, setCreditInfo] = useState({
    currentLimit: 5000,
    availableCredit: 3250,
    accountNumber: 'XXXX-XXXX-XXXX-4321',
    lastReviewDate: '12/15/2024',
    creditScore: 725,
    accountStatus: 'Good Standing'
  });

  // State for increase request form
  const [increaseRequest, setIncreaseRequest] = useState({
    requestedAmount: '',
    reason: '',
    income: '',
    expenses: '',
    isSubmitting: false
  });

  // State for displaying different sections
  const [activeSection, setActiveSection] = useState('overview');
  const [showHistory, setShowHistory] = useState(false);
  const [notification, setNotification] = useState(null);

  // Mock transaction history data
  const [limitHistory, setLimitHistory] = useState([
    {
      id: 1,
      date: '10/05/2024',
      type: 'Automatic Increase',
      oldLimit: 4500,
      newLimit: 5000,
      status: 'Approved'
    },
    {
      id: 2,
      date: '04/15/2024',
      type: 'Customer Request',
      oldLimit: 3500,
      newLimit: 4500,
      status: 'Approved'
    },
    {
      id: 3,
      date: '01/10/2024',
      type: 'Customer Request',
      oldLimit: 3500,
      newLimit: 5000,
      status: 'Declined'
    }
  ]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setIncreaseRequest({
      ...increaseRequest,
      [name]: value
    });
  };

  // Handle form submission for credit increase
  const handleSubmitRequest = (e) => {
    e.preventDefault();
    setIncreaseRequest({ ...increaseRequest, isSubmitting: true });

    // Simulate API call with timeout
    setTimeout(() => {
      // Add to history (this would be from API in real implementation)
      const newHistoryItem = {
        id: limitHistory.length + 1,
        date: new Date().toLocaleDateString(),
        type: 'Customer Request',
        oldLimit: creditInfo.currentLimit,
        newLimit: parseFloat(increaseRequest.requestedAmount),
        status: 'Pending Review'
      };

      setLimitHistory([newHistoryItem, ...limitHistory]);
      
      // Reset form
      setIncreaseRequest({
        requestedAmount: '',
        reason: '',
        income: '',
        expenses: '',
        isSubmitting: false
      });

      // Show confirmation message
      setNotification({
        type: 'success',
        message: 'Your credit limit increase request has been submitted successfully and is pending review.'
      });

      // Switch to overview section
      setActiveSection('overview');
      
      // Auto-dismiss notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }, 1500);
  };

  // Handle canceling request form
  const handleCancelRequest = () => {
    setIncreaseRequest({
      requestedAmount: '',
      reason: '',
      income: '',
      expenses: '',
      isSubmitting: false
    });
    setActiveSection('overview');
  };

  // Component for the overview section
  const OverviewSection = () => (
    <div className="credit-limit-overview">
      <h2>Credit Limit Overview</h2>
      <div className="credit-info-container">
        <div className="credit-info-item">
          <span>Account Number:</span>
          <strong>{creditInfo.accountNumber}</strong>
        </div>
        <div className="credit-info-item">
          <span>Current Credit Limit:</span>
          <strong>${creditInfo.currentLimit.toLocaleString()}</strong>
        </div>
        <div className="credit-info-item">
          <span>Available Credit:</span>
          <strong>${creditInfo.availableCredit.toLocaleString()}</strong>
        </div>
        <div className="credit-info-item">
          <span>Last Review Date:</span>
          <strong>{creditInfo.lastReviewDate}</strong>
        </div>
        <div className="credit-info-item">
          <span>Account Status:</span>
          <strong>{creditInfo.accountStatus}</strong>
        </div>
      </div>
      
      <div className="credit-limit-actions">
        <button 
          onClick={() => setActiveSection('requestIncrease')}
          className="primary-button"
        >
          Request Credit Limit Increase
        </button>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="secondary-button"
        >
          {showHistory ? 'Hide History' : 'View Limit History'}
        </button>
      </div>

      {showHistory && <LimitHistorySection />}
    </div>
  );

  // Component for the limit history section
  const LimitHistorySection = () => (
    <div className="limit-history-section">
      <h3>Credit Limit History</h3>
      {limitHistory.length > 0 ? (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Previous Limit</th>
                <th>New Limit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {limitHistory.map(item => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>{item.type}</td>
                  <td>${item.oldLimit.toLocaleString()}</td>
                  <td>${item.newLimit.toLocaleString()}</td>
                  <td>
                    <span className={`status-${item.status.toLowerCase().replace(' ', '-')}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No credit limit changes in your history.</p>
      )}
    </div>
  );

  // Component for the request increase form
  const RequestIncreaseSection = () => (
    <div className="request-increase-section">
      <h2>Request Credit Limit Increase</h2>
      <p className="form-intro">
        Please provide the following information to help us evaluate your request.
        All information provided will be kept confidential and secure.
      </p>
      
      <form onSubmit={handleSubmitRequest}>
        <div className="form-group">
          <label htmlFor="requestedAmount">Requested Credit Limit ($):</label>
          <input
            type="number"
            id="requestedAmount"
            name="requestedAmount"
            value={increaseRequest.requestedAmount}
            onChange={handleInputChange}
            min={creditInfo.currentLimit + 500}
            step="100"
            required
            placeholder="Enter amount"
          />
          <small>Minimum request: ${(creditInfo.currentLimit + 500).toLocaleString()}</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="reason">Primary Reason for Increase:</label>
          <select
            id="reason"
            name="reason"
            value={increaseRequest.reason}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a reason</option>
            <option value="large_purchase">Planning a large purchase</option>
            <option value="credit_building">Building credit history</option>
            <option value="debt_consolidation">Debt consolidation</option>
            <option value="emergency_fund">Emergency fund</option>
            <option value="business_expenses">Business expenses</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="income">Annual Income ($):</label>
          <input
            type="number"
            id="income"
            name="income"
            value={increaseRequest.income}
            onChange={handleInputChange}
            min="0"
            step="1000"
            required
            placeholder="Enter annual income"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="expenses">Monthly Expenses ($):</label>
          <input
            type="number"
            id="expenses"
            name="expenses"
            value={increaseRequest.expenses}
            onChange={handleInputChange}
            min="0"
            step="100"
            required
            placeholder="Enter monthly expenses"
          />
        </div>
        
        <div className="form-disclaimer">
          <p>
            By submitting this request, you authorize Wells Fargo to review your credit report
            and account history to determine eligibility. This will not affect your credit score.
          </p>
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={increaseRequest.isSubmitting}
          >
            {increaseRequest.isSubmitting ? 'Processing...' : 'Submit Request'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleCancelRequest}
            disabled={increaseRequest.isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  // Component for displaying notifications
  const Notification = ({ type, message }) => (
    <div className={`notification notification-${type}`}>
      {message}
    </div>
  );

  return (
    <div className="credit-limit-container">
      <div className="credit-limit-header">
        <h1>Credit Limit Management</h1>
        <p>Manage and review your credit limit options</p>
      </div>
      
      {notification && (
        <Notification type={notification.type} message={notification.message} />
      )}
      
      {activeSection === 'overview' && <OverviewSection />}
      {activeSection === 'requestIncrease' && <RequestIncreaseSection />}
    </div>
  );
};

export default CreditLimit;