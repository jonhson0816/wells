import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios'; // You'll need to install axios
import './PayBillsPage.css';

// Configure axios with base URL and headers
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add token to requests (assuming you store token in localStorage)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wellsFargoAuthToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const PayBillsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showAddPayeeModal, setShowAddPayeeModal] = useState(false);
  const [showSchedulePaymentModal, setShowSchedulePaymentModal] = useState(false);
  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('checking');
  const [paymentFrequency, setPaymentFrequency] = useState('once');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('date-desc');
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [payeeToDelete, setPayeeToDelete] = useState(null);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [newPayeeData, setNewPayeeData] = useState({
    name: '',
    accountNumber: '',
    address: '',
    phone: '',
    category: '',
    nickname: '',
    website: ''
  });
  
  // State for data from API
  const [accounts, setAccounts] = useState([]);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [payees, setPayees] = useState([]);
  const [payeeCategories, setPayeeCategories] = useState([]);

  // Fetch all necessary data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch accounts, upcoming bills, payees, and recent payments
        const [accountsRes, upcomingBillsRes, paymentsRes, payeesRes] = await Promise.all([
          api.get('/accounts'),
          api.get('/bills/upcoming'),
          api.get('/payments'),
          api.get('/payees')
        ]);

        // Extract unique categories from payees
        const categories = [...new Set(payeesRes.data.data.map(payee => payee.category))];
        
        setAccounts(accountsRes.data.data);
        setUpcomingBills(upcomingBillsRes.data.data);
        setRecentPayments(paymentsRes.data.data);
        setPayees(payeesRes.data.data);
        setPayeeCategories(['All', ...categories]);
        
        // Set default payment method if accounts exist
        if (accountsRes.data.data.length > 0) {
          setPaymentMethod(accountsRes.data.data[0].id);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching data');
        showToast('Error loading data. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Set the default payment date and amount when a bill is selected
  useEffect(() => {
    if (selectedBill) {
      setPaymentAmount(selectedBill.amount.toString());
      setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [selectedBill]);

  // Toast message utility function
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 5000);
  };

  // Handle back navigation
  const goBack = () => {
    navigate(-1);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate days until due
  const calculateDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handle bill payment
  const handlePayBill = (bill) => {
    setSelectedBill(bill);
    setPaymentAmount(bill.amount.toString());
    setShowSchedulePaymentModal(true);
  };

  // Handle autopay management
  const handleManageAutopay = async (billId, currentStatus) => {
    try {
      await api.put(`/bills/${billId}/autopay`, { autopay: !currentStatus });
      
      // Update local state
      setUpcomingBills(upcomingBills.map(bill => {
        if (bill.id === billId) {
          return { ...bill, autopay: !currentStatus };
        }
        return bill;
      }));
      
      showToast(`AutoPay ${!currentStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (err) {
      showToast(`Failed to update AutoPay: ${err.response?.data?.message || 'Unknown error'}`, 'error');
    }
  };

  // Handle reminder management
  const handleManageReminder = async (billId, currentStatus) => {
    try {
      await api.put(`/bills/${billId}/reminder`, { reminderSet: !currentStatus });
      
      // Update local state
      setUpcomingBills(upcomingBills.map(bill => {
        if (bill.id === billId) {
          return { ...bill, reminderSet: !currentStatus };
        }
        return bill;
      }));
      
      showToast(`Reminder ${!currentStatus ? 'set' : 'removed'} successfully!`);
    } catch (err) {
      showToast(`Failed to update reminder: ${err.response?.data?.message || 'Unknown error'}`, 'error');
    }
  };

  // Handle submitting a payment
  const submitPayment = async () => {
    try {
      const paymentData = {
        payeeId: selectedBill.payeeId || selectedBill.id,
        amount: parseFloat(paymentAmount),
        paymentDate: format(new Date(paymentDate), 'yyyy-MM-dd'),
        accountId: paymentMethod,
        frequency: paymentFrequency,
        memo: document.getElementById('payment-memo')?.value || '',
        category: selectedBill.category
      };
      
      let endpoint = '/payments';
      if (paymentFrequency !== 'once') {
        endpoint = '/payments/recurring';
      }
      
      const response = await api.post(endpoint, paymentData);
      
      // Create a new payment object for the UI
      const newPayment = {
        id: response.data.data.id,
        payee: selectedBill.payee,
        date: format(new Date(paymentDate), 'MM/dd/yyyy'),
        amount: parseFloat(paymentAmount),
        status: 'Pending',
        accountUsed: accounts.find(acc => acc.id === paymentMethod)?.name || 'Primary Checking',
        confirmationNumber: response.data.data.confirmationNumber,
        category: selectedBill.category,
        memo: paymentData.memo
      };
      
      setConfirmationNumber(response.data.data.confirmationNumber);
      setRecentPayments([newPayment, ...recentPayments]);
      setShowSchedulePaymentModal(false);
      setShowPaymentConfirmationModal(true);
    } catch (err) {
      showToast(`Failed to schedule payment: ${err.response?.data?.message || 'Unknown error'}`, 'error');
    }
  };

  // Handle payment details view
  const viewPaymentDetails = async (payment) => {
    try {
      // If we need more details than what we already have
      const response = await api.get(`/payments/${payment.id}`);
      setSelectedPayment(response.data.data);
      setShowPaymentDetailsModal(true);
    } catch (err) {
      showToast(`Failed to fetch payment details: ${err.response?.data?.message || 'Unknown error'}`, 'error');
    }
  };

  // Handle adding a new payee
  const handleAddPayee = async () => {
    try {
      const payeeData = {
        name: newPayeeData.name,
        accountNumber: newPayeeData.accountNumber,
        address: newPayeeData.address,
        phone: newPayeeData.phone,
        category: newPayeeData.category,
        nickname: newPayeeData.nickname || newPayeeData.name,
        website: newPayeeData.website
      };
      
      const response = await api.post('/payees', payeeData);
      
      // Add new payee to local state with the ID from the server
      const newPayee = {
        ...response.data.data,
        accountNumber: `****${payeeData.accountNumber.slice(-4)}`
      };
      
      setPayees([...payees, newPayee]);
      
      // Reset form
      setNewPayeeData({
        name: '',
        accountNumber: '',
        address: '',
        phone: '',
        category: '',
        nickname: '',
        website: ''
      });
      
      setShowAddPayeeModal(false);
      showToast('Payee added successfully!');
    } catch (err) {
      showToast(`Failed to add payee: ${err.response?.data?.message || 'Unknown error'}`, 'error');
    }
  };

  // Handle deleting a payee
  const handleDeletePayee = async () => {
    try {
      await api.delete(`/payees/${payeeToDelete.id}`);
      setPayees(payees.filter(payee => payee.id !== payeeToDelete.id));
      setShowDeleteConfirmation(false);
      setPayeeToDelete(null);
      showToast('Payee removed successfully!');
    } catch (err) {
      showToast(`Failed to remove payee: ${err.response?.data?.message || 'Unknown error'}`, 'error');
    }
  };

  // Handle confirming delete action
  const confirmDeletePayee = (payee) => {
    setPayeeToDelete(payee);
    setShowDeleteConfirmation(true);
  };

  // Handle downloading payment receipt
  const downloadReceipt = async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}/receipt`, {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast('Failed to download receipt', 'error');
    }
  };

  // Generate payment report
  const generateReport = async (format) => {
    try {
      const response = await api.get(`/payments/report?format=${format}`, {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast(`Failed to generate ${format.toUpperCase()} report`, 'error');
    }
  };

  // Filter payments based on search and filter
  const filteredPayments = recentPayments.filter(payment => {
    const matchesSearch = payment.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.confirmationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || payment.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  // Sort payments based on sort order
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    if (sortOrder === 'date-asc') {
      return new Date(a.date) - new Date(b.date);
    } else if (sortOrder === 'date-desc') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortOrder === 'amount-asc') {
      return a.amount - b.amount;
    } else if (sortOrder === 'amount-desc') {
      return b.amount - a.amount;
    }
    return 0;
  });

  // Filter payees based on search and selected category
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const filteredPayees = payees.filter(payee => {
    const matchesSearch = payee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payee.nickname.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || payee.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cancel payment handler
  const handleCancelPayment = async (paymentId) => {
    try {
      await api.delete(`/payments/${paymentId}`);
      
      // Update local state
      setRecentPayments(recentPayments.filter(payment => payment.id !== paymentId));
      showToast('Payment cancelled successfully!');
    } catch (err) {
      showToast(`Failed to cancel payment: ${err.response?.data?.message || 'Unknown error'}`, 'error');
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="pay-bills-page">
      <header className="pay009-page-header">
        <div className="pay009-back-button" onClick={goBack}>
          <span className="pay009-back-arrow">&#8592;</span> Back
        </div>
        <div className="pay009-wells-fargo-branding">
          <div className="pay009-logo-container">
            <img src="/Images/wells fargo.jpeg" alt="Wells Fargo Logo" className="pay009-wf-logo" />
          </div>
        </div>
      </header>

      <div className="page-content">
        <div className="page-title-container">
          <h1>Pay Bills</h1>
          <p className="subtitle">Manage and pay your bills in one place</p>
        </div>

        <div className="accounts-summary">
          <h3>Your Accounts</h3>
          <div className="accounts-list">
            {accounts.map(account => (
              <div key={account.id} className="account-item">
                <div className="account-name">{account.name}</div>
                <div className="account-number">{account.accountNumber}</div>
                <div className={`account-balance ${account.balance < 0 ? 'negative' : ''}`}>
                  {formatCurrency(account.balance)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bills-actions">
          <button className="add-payee-button" onClick={() => setShowAddPayeeModal(true)}>
            + Add New Payee
          </button>
          <button className="schedule-payment-button" onClick={() => setShowSchedulePaymentModal(true)}>
            Schedule Payment
          </button>
        </div>

        <div className="search-filter-container">
          <input
            type="text"
            placeholder="Search payees, payments or bills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="bills-tabs">
          <button 
            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Bills
          </button>
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Payment History
          </button>
          <button 
            className={`tab-button ${activeTab === 'payees' ? 'active' : ''}`}
            onClick={() => setActiveTab('payees')}
          >
            Manage Payees
          </button>
        </div>

        {activeTab === 'upcoming' && (
          <div className="upcoming-bills-container">
            <h2>Upcoming Bills</h2>
            <div className="upcoming-summary">
              <div className="due-soon">
                <span className="count">{upcomingBills.filter(bill => calculateDaysUntilDue(bill.dueDate) <= 7).length}</span>
                <span className="label">Due in 7 days</span>
              </div>
              <div className="autopay-count">
                <span className="count">{upcomingBills.filter(bill => bill.autopay).length}</span>
                <span className="label">On AutoPay</span>
              </div>
              <div className="total-due">
                <span className="amount">{formatCurrency(upcomingBills.reduce((sum, bill) => sum + bill.amount, 0))}</span>
                <span className="label">Total Due</span>
              </div>
            </div>
            {upcomingBills.length === 0 ? (
              <div className="no-bills-message">
                <p>You have no upcoming bills.</p>
              </div>
            ) : (
              <div className="bills-list">
                {upcomingBills
                  .filter(bill => bill.payee.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(bill => {
                    const daysUntilDue = calculateDaysUntilDue(bill.dueDate);
                    return (
                      <div key={bill.id} className="bill-item">
                        <div className="bill-details">
                          <div className="bill-payee">{bill.payee}</div>
                          <div className="bill-category">{bill.category}</div>
                          <div className={`bill-due-date ${daysUntilDue <= 3 ? 'urgent' : ''}`}>
                            Due: {bill.dueDate}
                            {daysUntilDue <= 3 && <span className="due-soon-tag">Due Soon!</span>}
                          </div>
                          <div className="bill-amount">{formatCurrency(bill.amount)}</div>
                          <div className={`bill-autopay ${bill.autopay ? 'enabled' : 'disabled'}`}>
                            {bill.autopay ? 'AutoPay Enabled' : 'AutoPay Disabled'}
                          </div>
                        </div>
                        <div className="bill-actions">
                          <button 
                            className="pay-now-button"
                            onClick={() => handlePayBill(bill)}
                          >
                            Pay Now
                          </button>
                          <button 
                            className={`autopay-button ${bill.autopay ? 'disable' : 'enable'}`}
                            onClick={() => handleManageAutopay(bill.id, bill.autopay)}
                          >
                            {bill.autopay ? 'Disable AutoPay' : 'Enable AutoPay'}
                          </button>
                          <button 
                            className="reminder-button"
                            onClick={() => handleManageReminder(bill.id, bill.reminderSet)}
                          >
                            {bill.reminderSet ? 'Edit Reminder' : 'Set Reminder'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="payment-history-container">
            <h2>Payment History</h2>
            <div className="filter-sort-container">
              <div className="filter-dropdown">
                <label htmlFor="status-filter">Filter by status:</label>
                <select 
                  id="status-filter" 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processed">Processed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="sort-dropdown">
                <label htmlFor="sort-order">Sort by:</label>
                <select 
                  id="sort-order" 
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="amount-desc">Amount (High to Low)</option>
                  <option value="amount-asc">Amount (Low to High)</option>
                </select>
              </div>
            </div>
            {sortedPayments.length === 0 ? (
              <div className="no-payments-message">
                <p>No payments found matching your criteria.</p>
              </div>
            ) : (
              <div className="payments-list">
                {sortedPayments.map(payment => (
                  <div key={payment.id} className="payment-item">
                    <div className="payment-details">
                      <div className="payment-payee">{payment.payee}</div>
                      <div className="payment-date">Paid on: {payment.date}</div>
                      <div className="payment-amount">{formatCurrency(payment.amount)}</div>
                      <div className="payment-account">From: {payment.accountUsed}</div>
                      <div className={`payment-status ${payment.status.toLowerCase()}`}>
                        {payment.status}
                      </div>
                      <div className="payment-confirmation">
                        Confirmation #: {payment.confirmationNumber}
                      </div>
                    </div>
                    <div className="payment-actions">
                      <button 
                        className="view-details-button"
                        onClick={() => viewPaymentDetails(payment)}
                      >
                        View Details
                      </button>
                      {payment.status === 'Pending' && (
                        <button 
                          className="cancel-payment-button"
                          onClick={() => handleCancelPayment(payment.id)}
                        >
                          Cancel Payment
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="download-options">
              <button className="download-button" onClick={() => generateReport('pdf')}>
                Download as PDF
              </button>
              <button className="download-button" onClick={() => generateReport('csv')}>
                Export to CSV
              </button>
            </div>
          </div>
        )}

        {activeTab === 'payees' && (
          <div className="payees-container">
            <h2>Manage Payees</h2>
            <div className="category-filter">
              {payeeCategories.map((category, index) => (
                <button 
                  key={index}
                  className={`category-button ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            {filteredPayees.length === 0 ? (
              <div className="no-payees-message">
                <p>{searchTerm || selectedCategory !== 'All' ? 'No payees match your search.' : 'You have no payees added.'}</p>
              </div>
            ) : (
              <div className="payees-list">
                {filteredPayees.map(payee => (
                  <div key={payee.id} className="payee-item">
                    <div className="payee-details">
                      <div className="payee-name">{payee.name}</div>
                      {payee.nickname !== payee.name && (
                        <div className="payee-nickname">"{payee.nickname}"</div>
                      )}
                      <div className="payee-category">{payee.category}</div>
                      <div className="payee-account">Account: {payee.accountNumber}</div>
                      <div className="payee-address">{payee.address}</div>
                      {payee.phone && <div className="payee-phone">Phone: {payee.phone}</div>}
                      {payee.website && <div className="payee-website">Website: {payee.website}</div>}
                    </div>
                    <div className="payee-actions">
                      <button 
                        className="pay-payee-button" 
                        onClick={() => handlePayBill({ 
                          id: `temp-${payee.id}`, 
                          payeeId: payee.id,
                          payee: payee.name, 
                          amount: 0, 
                          dueDate: format(new Date(), 'MM/dd/yyyy'), 
                          category: payee.category 
                        })}
                      >
                        Pay Now
                      </button>
                      <button className="edit-payee-button">
                        Edit
                      </button>
                      <button 
                        className="delete-payee-button"
                        onClick={() => confirmDeletePayee(payee)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Payment Modal */}
      {showSchedulePaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedBill ? `Pay ${selectedBill.payee}` : 'Schedule Payment'}</h2>
              <button 
                className="close-button" 
                onClick={() => setShowSchedulePaymentModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form className="payment-form">
                {!selectedBill && (
                  <div className="form-group">
                    <label htmlFor="payee-select">Select Payee:</label>
                    <select 
                      id="payee-select" 
                      className="form-select"
                      onChange={(e) => {
                        const selectedPayee = payees.find(p => p.id === e.target.value);
                        if (selectedPayee) {
                          setSelectedBill({
                            id: `temp-${selectedPayee.id}`,
                            payeeId: selectedPayee.id,
                            payee: selectedPayee.name,
                            amount: 0,
                            dueDate: format(new Date(), 'MM/dd/yyyy'),
                            category: selectedPayee.category
                          });
                        }
                      }}
                    >
                      <option value="">Select a payee</option>
                      {payees.map(payee => (
                        <option key={payee.id} value={payee.id}>{payee.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="payment-amount">Payment Amount:</label>
                  <div className="amount-input-wrapper">
                    <span className="currency-symbol">$</span>
                    <input 
                      type="number" 
                      id="payment-amount" 
                      className="text-input amount-input" 
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      step="0.01"
                      min="0.01"
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="payment-date">Payment Date:</label>
                  <input 
                    type="date" 
                    id="payment-date" 
                    className="date-input" 
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="payment-method">Pay From:</label>
                  <select 
                    id="payment-method" 
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.accountNumber} ({formatCurrency(account.balance)})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Payment Frequency:</label>
                  <div className="frequency-options">
                    <div className="frequency-option">
                      <input 
                        type="radio" 
                        id="freq-once" 
                        name="payment-frequency" 
                        value="once"
                        checked={paymentFrequency === 'once'}
                        onChange={() => setPaymentFrequency('once')}
                      />
                      <label htmlFor="freq-once">One Time</label>
                    </div>
                    <div className="frequency-option">
                      <input 
                        type="radio" 
                        id="freq-weekly" 
                        name="payment-frequency" 
                        value="weekly"
                        checked={paymentFrequency === 'weekly'}
                        onChange={() => setPaymentFrequency('weekly')}
                      />
                      <label htmlFor="freq-weekly">Weekly</label>
                    </div>
                    <div className="frequency-option">
                      <input 
                        type="radio" 
                        id="freq-monthly" 
                        name="payment-frequency" 
                        value="monthly"
                        checked={paymentFrequency === 'monthly'}
                        onChange={() => setPaymentFrequency('monthly')}
                      />
                      <label htmlFor="freq-monthly">Monthly</label>
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="payment-memo">Memo (Optional):</label>
                  <textarea 
                    id="payment-memo" 
                    className="text-input memo-input" 
                    placeholder="Add a note about this payment"
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button" 
                onClick={() => setShowSchedulePaymentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="submit-button"
                onClick={submitPayment}
                disabled={!selectedBill || !paymentAmount || !paymentDate || !paymentMethod}
              >
                Schedule Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentConfirmationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Payment Scheduled Successfully!</h2>
              <button 
                className="close-button" 
                onClick={() => setShowPaymentConfirmationModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-details">
                <div className="confirmation-icon">✓</div>
                <p>Your payment to <strong>{selectedBill.payee}</strong> has been scheduled.</p>
                <div className="payment-summary">
                  <div className="summary-item">
                    <span className="label">Amount:</span>
                    <span className="value">{formatCurrency(parseFloat(paymentAmount))}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Date:</span>
                    <span className="value">{format(new Date(paymentDate), 'MM/dd/yyyy')}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">From Account:</span>
                    <span className="value">
                      {accounts.find(acc => acc.id === paymentMethod)?.name || 'Primary Checking'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Confirmation Number:</span>
                    <span className="value">{confirmationNumber}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="close-button" 
                onClick={() => {
                  setShowPaymentConfirmationModal(false);
                  setActiveTab('history');
                }}
              >
                View Payment History
              </button>
              <button 
                className="download-button" 
                onClick={() => downloadReceipt(confirmationNumber)}
              >
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payee Modal */}
      {showAddPayeeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Payee</h2>
              <button 
                className="close-button" 
                onClick={() => setShowAddPayeeModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form className="payee-form">
                <div className="form-group">
                  <label htmlFor="payee-name">Payee Name:</label>
                  <input 
                    type="text" 
                    id="payee-name" 
                    className="text-input" 
                    value={newPayeeData.name}
                    onChange={(e) => setNewPayeeData({...newPayeeData, name: e.target.value})}
                    placeholder="e.g. PG&E"
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="payee-nickname">Nickname (Optional):</label>
                  <input 
                    type="text" 
                    id="payee-nickname" 
                    className="text-input" 
                    value={newPayeeData.nickname}
                    onChange={(e) => setNewPayeeData({...newPayeeData, nickname: e.target.value})}
                    placeholder="e.g. Electric Bill"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="payee-account">Account Number:</label>
                  <input 
                    type="text" 
                    id="payee-account" 
                    className="text-input" 
                    value={newPayeeData.accountNumber}
                    onChange={(e) => setNewPayeeData({...newPayeeData, accountNumber: e.target.value})}
                    placeholder="Your account number with this payee"
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="payee-category">Category:</label>
                  <select 
                    id="payee-category" 
                    className="form-select"
                    value={newPayeeData.category}
                    onChange={(e) => setNewPayeeData({...newPayeeData, category: e.target.value})}
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Mortgage/Rent">Mortgage/Rent</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Loan">Loan</option>
                    <option value="Phone/Internet">Phone/Internet</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="payee-address">Address:</label>
                  <textarea 
                    id="payee-address" 
                    className="text-input" 
                    value={newPayeeData.address}
                    onChange={(e) => setNewPayeeData({...newPayeeData, address: e.target.value})}
                    placeholder="Payee's billing address"
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label htmlFor="payee-phone">Phone (Optional):</label>
                  <input 
                    type="tel" 
                    id="payee-phone" 
                    className="text-input" 
                    value={newPayeeData.phone}
                    onChange={(e) => setNewPayeeData({...newPayeeData, phone: e.target.value})}
                    placeholder="e.g. (555) 123-4567"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="payee-website">Website (Optional):</label>
                  <input 
                    type="url" 
                    id="payee-website" 
                    className="text-input" 
                    value={newPayeeData.website}
                    onChange={(e) => setNewPayeeData({...newPayeeData, website: e.target.value})}
                    placeholder="e.g. https://www.example.com"
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button" 
                onClick={() => setShowAddPayeeModal(false)}
              >
                Cancel
              </button>
              <button 
                className="submit-button"
                onClick={handleAddPayee}
                disabled={!newPayeeData.name || !newPayeeData.accountNumber || !newPayeeData.category}
              >
                Add Payee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showPaymentDetailsModal && selectedPayment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Payment Details</h2>
              <button 
                className="close-button" 
                onClick={() => setShowPaymentDetailsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="payment-details-container">
                <div className="detail-row">
                  <span className="detail-label">Payee:</span>
                  <span className="detail-value">{selectedPayment.payee}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value">{formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Date:</span>
                  <span className="detail-value">{selectedPayment.date}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value status ${selectedPayment.status.toLowerCase()}`}>
                    {selectedPayment.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">From Account:</span>
                  <span className="detail-value">{selectedPayment.accountUsed}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Confirmation #:</span>
                  <span className="detail-value">{selectedPayment.confirmationNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{selectedPayment.category}</span>
                </div>
                {selectedPayment.memo && (
                  <div className="detail-row">
                    <span className="detail-label">Memo:</span>
                    <span className="detail-value">{selectedPayment.memo}</span>
                  </div>
                )}
                {selectedPayment.frequency !== 'once' && (
                  <div className="detail-row">
                    <span className="detail-label">Recurring:</span>
                    <span className="detail-value">
                      {selectedPayment.frequency === 'weekly' ? 'Weekly' : 'Monthly'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="close-button" 
                onClick={() => setShowPaymentDetailsModal(false)}
              >
                Close
              </button>
              <button 
                className="download-button" 
                onClick={() => downloadReceipt(selectedPayment.id)}
              >
                Download Receipt
              </button>
              {selectedPayment.status === 'Pending' && (
                <button 
                  className="cancel-payment-button"
                  onClick={() => {
                    handleCancelPayment(selectedPayment.id);
                    setShowPaymentDetailsModal(false);
                  }}
                >
                  Cancel Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && payeeToDelete && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button 
                className="close-button" 
                onClick={() => setShowDeleteConfirmation(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove <strong>{payeeToDelete.name}</strong> from your payees?</p>
              <p>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button" 
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-button"
                onClick={handleDeletePayee}
              >
                Delete Payee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
      {toast.show && (
        <div className={`toast-message ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default PayBillsPage;