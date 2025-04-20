import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import axios from 'axios';
import './DisputeTransactionPage.css';

// API base URL - hardcoded fallback instead of using process.env
const API_URL = 'http://localhost:5000/api';

const DisputeTransactionPage = ({ userAccountId, wellsFargoAuthToken }) => {
    console.log("Token received:", wellsFargoAuthToken);
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  
  // State for transactions and pagination
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  
  // State for dispute process
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubReason, setDisputeSubReason] = useState('');
  const [description, setDescription] = useState('');
  const [contactMethod, setContactMethod] = useState('email');
  const [contactDetails, setContactDetails] = useState({ 
    email: '',
    phone: '',
    address: ''
  });
  const [step, setStep] = useState(1);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [temporaryCreditRequested, setTemporaryCreditRequested] = useState(false);
  const [isFraud, setIsFraud] = useState(false);
  const [cardStatus, setCardStatus] = useState('keep');
  const [disputeNumber, setDisputeNumber] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState('initial'); // initial, submitting, success, failed
  const [errorMessage, setErrorMessage] = useState('');
  const [statusHistory, setStatusHistory] = useState([]);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  // State for fraud details
  const [fraudDetails, setFraudDetails] = useState({
    cardInPossession: true,
    lastValidTransaction: '',
    suspectMerchant: '',
    additionalSuspiciousActivity: '',
    recognizeAnyTransactions: false
  });

  // If a transaction is passed in from location state, use it
  useEffect(() => {
    if (location.state?.transaction) {
      setSelectedTransaction(location.state.transaction);
      setStep(2);
    }
  }, [location.state]);

  // Fetch transactions from API
  
  const fetchTransactions = async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // Get auth token
      const token = getAuthToken();
      
      // Get account ID with proper handling
      let accountId;
      try {
        accountId = await getAccountId();
      } catch (error) {
        // Redirect to account selection page
        navigate('/select-account', { 
          state: { 
            returnPath: location.pathname,
            message: 'Please select an account to view transactions' 
          } 
        });
        return; // Exit function early
      }
      
      // Fetch transactions with the token and account ID
      const formattedTransactions = await getTransactions(token, accountId);
      
      setTransactions(formattedTransactions);
      setFilteredTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoadError('Unable to load transactions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };


  const getAccountId = async () => {
    // Check state management first
    if (userAccountId) return userAccountId;
    
    // Check local storage as fallback
    const userDataString = localStorage.getItem('wellsFargoUser');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        if (userData?.accounts?.length > 0) {
          return userData.accounts[0].accountNumber;
        }
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
      }
    }
    
    // If we reach here, we genuinely need account selection
    throw new Error('No account ID found. Please select an account first.');
  };



  // Apply filters when search term or other filters change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, dateFilter, amountFilter, transactions]);

  // Get user contact information from API
  useEffect(() => {
  const fetchUserProfile = async () => {
    try {
      // Get the token either from props or localStorage as a fallback
      const token = wellsFargoAuthToken || localStorage.getItem('token');
      
      if (token) {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        const response = await axios.get(`${API_URL}/auth/me`, config);
        const userData = response.data.data;
        
        if (userData) {
          setContactDetails({
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || ''
          });
        }
      } else {
        // Use fallback data if no token
        console.log('No auth token, using fallback user data');
        setContactDetails({
          email: 'user@example.com',
          phone: '(555) 123-4567',
          address: '123 Main St, Anytown, CA 12345'
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to default values
      setContactDetails({
        email: 'user@example.com',
        phone: '(555) 123-4567',
        address: '123 Main St, Anytown, CA 12345'
      });
    }
  };
  
  fetchUserProfile();
}, [wellsFargoAuthToken]);



  const generateMockTransactions = () => {
    const transactions = [];
    const currentDate = new Date();
    
    // Transaction descriptions
    const descriptions = [
      'Amazon.com Purchase', 
      'Walmart Store #1245', 
      'Target Online Order', 
      'Starbucks - Downtown', 
      'Uber Trip', 
      'Doordash - Food Delivery', 
      'Kroger Grocery',
      'Netflix Subscription',
      'Gas Station - Shell',
      'Best Buy Electronics',
      'Apple Store Purchase',
      'Home Depot',
      'Costco Wholesale',
      'CVS Pharmacy',
      'IKEA Furniture',
      'Delta Air Lines',
      'Hilton Hotels',
      'AT&T Wireless',
      'Verizon Payment',
      'T-Mobile Bill'
    ];

    // Transaction types
    const types = ['purchase', 'recurring', 'atm', 'transfer', 'fee'];
    const merchants = ['MERCHANT_RETAIL', 'MERCHANT_ONLINE', 'MERCHANT_TRAVEL', 'MERCHANT_FOOD', 'MERCHANT_SUBSCRIPTION'];

    // Generate 30 transactions
    for (let i = 0; i < 30; i++) {
      const daysAgo = Math.floor(Math.random() * 60); // Random day within last 60 days
      const transactionDate = new Date(currentDate);
      transactionDate.setDate(currentDate.getDate() - daysAgo);
      
      // Random description
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      
      // Random amount
      const amount = -(Math.random() * 200 + 5).toFixed(2);
      const type = types[Math.floor(Math.random() * types.length)];
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];
      
      transactions.push({
        id: `txn-${i}-${Date.now().toString(36)}`,
        date: transactionDate,
        formattedDate: format(transactionDate, 'MM/dd/yyyy'),
        description: description,
        type: type,
        merchantType: merchant,
        amount: parseFloat(amount),
        status: 'Completed',
        cardLast4: `${Math.floor(1000 + Math.random() * 9000)}`,
        postedDate: format(transactionDate, 'MM/dd/yyyy'),
        canBeDisputed: daysAgo <= 60, // Can only dispute transactions in last 60 days
        hasBeenDisputed: false
      });
    }
    
    // Sort by date (most recent first)
    transactions.sort((a, b) => {
      return b.date - a.date;
    });
    
    return transactions;
  };

  const applyFilters = () => {
    let results = [...transactions];
    
    // Apply search term filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      results = results.filter(transaction => 
        transaction.description.toLowerCase().includes(search)
      );
    }
    
    // Apply date range filter
    if (dateFilter.startDate) {
      const startDate = new Date(dateFilter.startDate);
      results = results.filter(transaction => new Date(transaction.date) >= startDate);
    }
    
    if (dateFilter.endDate) {
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      results = results.filter(transaction => new Date(transaction.date) <= endDate);
    }
    
    // Apply amount range filter
    if (amountFilter.min !== '') {
      const min = parseFloat(amountFilter.min);
      results = results.filter(transaction => Math.abs(transaction.amount) >= min);
    }
    
    if (amountFilter.max !== '') {
      const max = parseFloat(amountFilter.max);
      results = results.filter(transaction => Math.abs(transaction.amount) <= max);
    }
    
    setFilteredTransactions(results);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter({ startDate: '', endDate: '' });
    setAmountFilter({ min: '', max: '' });
    setFilteredTransactions(transactions);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Navigation functions
  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const goToAccount = () => {
    navigate('/checking-account');
  };

  // Get the current page of transactions
  const getCurrentTransactions = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  };

  // File handling functions
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    // Check file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        alert(`File ${file.name} is not a supported format. Please upload JPEG, PNG, GIF, or PDF files.`);
        return false;
      }
      
      if (file.size > maxSize) {
        alert(`File ${file.name} exceeds the 10MB size limit.`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length + attachments.length > 5) {
      alert('You can upload a maximum of 5 files.');
      // Only add files up to the limit
      const remainingSlots = 5 - attachments.length;
      const newFiles = validFiles.slice(0, remainingSlots);
      setAttachments([...attachments, ...newFiles]);
    } else {
      setAttachments([...attachments, ...validFiles]);
    }
    
    // Reset file input
    fileInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  // Dispute process handlers
  const handleTransactionSelect = (transaction) => {
    setSelectedTransaction(transaction);
    setStep(2);
  };

  const handleDisputeReasonChange = (e) => {
    const reason = e.target.value;
    setDisputeReason(reason);
    setDisputeSubReason('');
    
    // Reset fraud related state if changing reason
    if (reason !== 'unauthorized') {
      setIsFraud(false);
    } else {
      setIsFraud(true);
    }
  };

  const handleDisputeSubReasonChange = (e) => {
    setDisputeSubReason(e.target.value);
  };

  const handleSubmitDispute = () => {
    // Validation for step 2
    let hasErrors = false;
    
    if (!disputeReason) {
      alert('Please select a reason for dispute.');
      hasErrors = true;
    }
    
    if (disputeReason === 'unauthorized' && !fraudDetails.cardInPossession) {
      if (cardStatus === 'keep') {
        alert('For security reasons, we recommend blocking your card if you suspect fraud.');
        hasErrors = true;
      }
    }
    
    if (isFraud && !fraudDetails.lastValidTransaction) {
      alert('Please provide the date of your last valid transaction.');
      hasErrors = true;
    }
    
    if (disputeReason === 'other' && !description) {
      alert('Please provide a description for your dispute.');
      hasErrors = true;
    }
    
    if (hasErrors) return;
    
    setStep(3);
  };

  const handleConfirmDispute = () => {
    if (!hasAgreedToTerms) {
      alert('Please confirm that the information provided is accurate and complete.');
      return;
    }
    
    setIsConfirmModalOpen(true);
  };

  const handleDisputeSubmitted = async () => {
    setIsConfirmModalOpen(false);
    setSubmissionStatus('submitting');
    
    try {
      // Get the token either from props or localStorage as a fallback
      const token = wellsFargoAuthToken || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Create FormData for handling file uploads
      const formData = new FormData();
      
      // Add dispute data
      formData.append('transactionId', selectedTransaction.id);
      formData.append('transactionDate', format(new Date(selectedTransaction.date), 'yyyy-MM-dd'));
      formData.append('transactionDescription', selectedTransaction.description);
      formData.append('transactionAmount', selectedTransaction.amount);
      formData.append('cardLast4', selectedTransaction.cardLast4);
      formData.append('reason', disputeReason);
      
      if (disputeSubReason) {
        formData.append('subReason', disputeSubReason);
      }
      
      if (description) {
        formData.append('description', description);
      }
      
      formData.append('contactMethod', contactMethod);
      formData.append('contactDetails', JSON.stringify(contactDetails));
      formData.append('temporaryCreditRequested', temporaryCreditRequested);
      formData.append('isFraud', isFraud);
      formData.append('cardStatus', cardStatus);
      
      if (isFraud && fraudDetails) {
        formData.append('fraudDetails', JSON.stringify(fraudDetails));
      }
      
      // Append each file
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
      
      // Configure headers with auth token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      // Submit the dispute to the backend
      const response = await axios.post(`${API_URL}/disputes`, formData, config);
      
      // Handle successful response
      const disputeResponse = response.data.data;
      
      // Set dispute number from response
      setDisputeNumber(disputeResponse.disputeNumber || `DIS-${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`);
      
      // Generate status history
      const statusUpdates = disputeResponse.statusHistory || [
        {
          date: format(new Date(), 'MM/dd/yyyy hh:mm a'),
          status: 'Dispute Created',
          description: 'Your dispute has been successfully submitted.'
        }
      ];
      
      // Add card status update if user requested to block card
      if (cardStatus === 'block') {
        statusUpdates.push({
          date: format(new Date(), 'MM/dd/yyyy hh:mm a'),
          status: 'Card Blocked',
          description: 'Your card has been blocked for security reasons.'
        });
      }
      
      // Add temporary credit status if requested
      if (temporaryCreditRequested) {
        statusUpdates.push({
          date: format(new Date(new Date().getTime() + 60000), 'MM/dd/yyyy hh:mm a'),
          status: 'Temporary Credit Issued',
          description: `A temporary credit of ${formatCurrency(Math.abs(selectedTransaction.amount))} has been applied to your account.`
        });
      }
      
      setStatusHistory(statusUpdates);
      setSubmissionStatus('success');
      setStep(4);
      
      // Update transaction in list as disputed
      const updatedTransactions = transactions.map(t => 
        t.id === selectedTransaction.id ? { ...t, hasBeenDisputed: true } : t
      );
      setTransactions(updatedTransactions);
      setFilteredTransactions(updatedTransactions.filter(t => getCurrentTransactions().includes(t)));
      
    } catch (error) {
      console.error('Error submitting dispute:', error);
      setSubmissionStatus('failed');
      setErrorMessage(
        error.response?.data?.error || 
        error.message || 
        'There was an error submitting your dispute. Please try again or contact customer service for assistance.'
      );
    }
  };

  const handleRetrySubmission = () => {
    setSubmissionStatus('initial');
    handleDisputeSubmitted();
  };

  const handleContactCustomerService = () => {
    // Navigate to customer service page
    navigate('/customer-service', { 
      state: { 
        issue: 'Failed Dispute Submission',
        transactionId: selectedTransaction.id
      }
    });
  };

  // Get available sub-reasons for selected reason
  const getSubReasons = () => {
    switch (disputeReason) {
      case 'unauthorized':
        return [
          { value: 'fraud', label: 'Fraudulent transaction' },
          { value: 'card-stolen', label: 'Card was stolen' },
          { value: 'card-lost', label: 'Card was lost' },
          { value: 'card-not-received', label: 'Never received my card' },
          { value: 'family-member', label: 'Unauthorized use by family member' }
        ];
      case 'duplicate':
        return [
          { value: 'same-day', label: 'Multiple charges on same day' },
          { value: 'recurring', label: 'Duplicate recurring payment' },
          { value: 'previous-refund', label: 'Already refunded in store' }
        ];
      case 'wrong-amount':
        return [
          { value: 'incorrect-amount', label: 'Charged incorrect amount' },
          { value: 'tip-error', label: 'Tip amount error' },
          { value: 'currency-conversion', label: 'Currency conversion error' }
        ];
      case 'product-not-received':
        return [
          { value: 'never-delivered', label: 'Product never delivered' },
          { value: 'service-not-provided', label: 'Service not provided' },
          { value: 'partial-delivery', label: 'Only received part of order' }
        ];
      case 'defective':
        return [
          { value: 'broken', label: 'Product arrived broken/damaged' },
          { value: 'not-as-described', label: 'Product not as described' },
          { value: 'poor-quality', label: 'Poor quality service' },
          { value: 'counterfeit', label: 'Counterfeit product' }
        ];
      case 'cancelled':
        return [
          { value: 'subscription-cancelled', label: 'Subscription cancelled but still charged' },
          { value: 'membership-cancelled', label: 'Membership cancelled but still charged' },
          { value: 'did-not-authorize-renewal', label: 'Did not authorize automatic renewal' }
        ];
      case 'refund-not-received':
        return [
          { value: 'return-not-processed', label: 'Return not processed' },
          { value: 'refund-promised', label: 'Refund was promised but not received' },
          { value: 'cancelled-service', label: 'Service cancelled but refund not issued' }
        ];
      default:
        return [];
    }
  };

  const toggleHelpModal = () => {
    setIsHelpModalOpen(!isHelpModalOpen);
  };

  // Render functions for each step
  const renderStep1 = () => (
    <div className="dispute-transaction-step">
      <h2>Select a Transaction to Dispute</h2>
      <p className="step-description">
        Select a transaction from the last 60 days that you would like to dispute.
      </p>
      
      {/* Transaction search and filters */}
      <div className="transaction-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <div className="date-filter">
            <label>Date Range:</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
              max={dateFilter.endDate || undefined}
            />
            <span>to</span>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
              min={dateFilter.startDate || undefined}
            />
          </div>
          
          <div className="amount-filter">
            <label>Amount Range:</label>
            <input
              type="number"
              placeholder="Min"
              value={amountFilter.min}
              onChange={(e) => setAmountFilter({...amountFilter, min: e.target.value})}
              min="0"
              step="0.01"
            />
            <span>to</span>
            <input
              type="number"
              placeholder="Max"
              value={amountFilter.max}
              onChange={(e) => setAmountFilter({...amountFilter, max: e.target.value})}
              min={amountFilter.min || "0"}
              step="0.01"
            />
          </div>
          
          <button 
            className="clear-filters-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      {/* Transactions table */}
      {isLoading ? (
        <div className="loading-indicator">Loading transactions...</div>
      ) : loadError ? (
        <div className="error-message">
          {loadError}
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="no-transactions">
          <p>No transactions found matching your criteria.</p>
          {searchTerm || dateFilter.startDate || dateFilter.endDate || amountFilter.min || amountFilter.max ? (
            <p>Try adjusting your filters or <button onClick={clearFilters}>clear all filters</button>.</p>
          ) : (
            <p>There are no transactions available to dispute in your account.</p>
          )}
        </div>
      ) : (
        <div className="transactions-table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th></th>
                <th>Date</th>
                <th>Description</th>
                <th>Card</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {getCurrentTransactions().map(transaction => (
                <tr key={transaction.id} className={transaction.hasBeenDisputed ? 'already-disputed' : ''}>
                  <td>
                    {transaction.hasBeenDisputed ? (
                      <span className="dispute-status">Already disputed</span>
                    ) : !transaction.canBeDisputed ? (
                      <span className="dispute-status">Not eligible</span>
                    ) : (
                      <button 
                        className="select-transaction-button"
                        onClick={() => handleTransactionSelect(transaction)}
                        disabled={transaction.hasBeenDisputed || !transaction.canBeDisputed}
                      >
                        Select
                      </button>
                    )}
                  </td>
                  <td>{transaction.formattedDate}</td>
                  <td>{transaction.description}</td>
                  <td>x{transaction.cardLast4}</td>
                  <td className="negative-amount">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td>{transaction.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination controls */}
          {filteredTransactions.length > itemsPerPage && (
            <div className="pagination-controls">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-indicator">
                Page {currentPage} of {Math.ceil(filteredTransactions.length / itemsPerPage)}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredTransactions.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(filteredTransactions.length / itemsPerPage)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="disputes-help-info">
        <h3>Need Help?</h3>
        <p>
          If you don't see the transaction you want to dispute, you can try:
        </p>
        <ul>
          <li>Adjusting your search filters</li>
          <li>Looking in a different account</li>
          <li>Note that transactions older than 60 days may require calling customer service</li>
        </ul>
        <p>
          For assistance, contact Wells Fargo Customer Service at 1-800-869-3557, available 24/7.
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="dispute-transaction-step">
      <h2>Dispute Details</h2>
      
      {/* Selected Transaction */}
      <div className="selected-transaction">
        <h3>Selected Transaction</h3>
        <div className="transaction-details">
          <div className="transaction-detail">
            <span>Date:</span>
            <span>{selectedTransaction.formattedDate}</span>
          </div>
          <div className="transaction-detail">
            <span>Description:</span>
            <span>{selectedTransaction.description}</span>
          </div>
          <div className="transaction-detail">
            <span>Card Number:</span>
            <span>xxxx-xxxx-xxxx-{selectedTransaction.cardLast4}</span>
          </div>
          <div className="transaction-detail">
            <span>Amount:</span>
            <span className="negative-amount">{formatCurrency(selectedTransaction.amount)}</span>
          </div>
        </div>
      </div>
      
      {/* Dispute Form */}
      <div className="dispute-form">
        {/* Reason selection */}
        <div className="form-group">
          <label htmlFor="dispute-reason">Reason for Dispute:</label>
          <select 
            id="dispute-reason" 
            value={disputeReason}
            onChange={handleDisputeReasonChange}
            className="form-select"
          >
            <option value="">Select a reason</option>
            <option value="unauthorized">Unauthorized Transaction</option>
            <option value="duplicate">Duplicate Transaction</option>
            <option value="wrong-amount">Wrong Amount</option>
            <option value="product-not-received">Product/Service Not Received</option>
            <option value="defective">Defective Product/Service</option>
            <option value="cancelled">Cancelled Subscription/Membership</option>
            <option value="refund-not-received">Refund Not Received</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        {/* Sub-reason selection based on main reason */}
        {disputeReason && getSubReasons().length > 0 && (
          <div className="form-group">
            <label htmlFor="dispute-subreason">Specific Reason:</label>
            <select 
              id="dispute-subreason" 
              value={disputeSubReason}
              onChange={handleDisputeSubReasonChange}
              className="form-select"
            >
              <option value="">Select a specific reason</option>
              {getSubReasons().map(reason => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Fraud-specific questions */}
        {disputeReason === 'unauthorized' && (
          <div className="fraud-questions">
            <h4>Card Security Information</h4>
            
            <div className="form-group">
              <label>Do you have your card in your possession?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="card-possession"
                    checked={fraudDetails.cardInPossession}
                    onChange={() => setFraudDetails({...fraudDetails, cardInPossession: true})}
                  />
                  Yes
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="card-possession"
                    checked={!fraudDetails.cardInPossession}
                    onChange={() => setFraudDetails({...fraudDetails, cardInPossession: false})}
                  />
                  No
                </label>
              </div>
            </div>
            
            {!fraudDetails.cardInPossession && (
              <div className="form-group">
                <label>Card Status:</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="card-status"
                      value="block"
                      checked={cardStatus === 'block'}
                      onChange={() => setCardStatus('block')}
                    />
                    Block this card immediately
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="card-status"
                      value="keep"
                      checked={cardStatus === 'keep'}
                      onChange={() => setCardStatus('keep')}
                    />
                    Keep card active
                  </label>
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="last-valid-transaction">
                Date of last transaction you recognize:
              </label>
              <input 
                type="date" 
                id="last-valid-transaction"
                value={fraudDetails.lastValidTransaction}
                onChange={(e) => setFraudDetails({...fraudDetails, lastValidTransaction: e.target.value})}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="suspect-merchant">
                Is there a specific merchant you suspect?
              </label>
              <input 
                type="text" 
                id="suspect-merchant"
                value={fraudDetails.suspectMerchant}
                onChange={(e) => setFraudDetails({...fraudDetails, suspectMerchant: e.target.value})}
                placeholder="Enter merchant name (optional)"
              />
            </div>
            
            <div className="form-group">
              <label>Do you recognize any of the disputed transactions?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="recognize-transactions"
                    checked={fraudDetails.recognizeAnyTransactions}
                    onChange={() => setFraudDetails({...fraudDetails, recognizeAnyTransactions: true})}
                  />
                  Yes
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="recognize-transactions"
                    checked={!fraudDetails.recognizeAnyTransactions}
                    onChange={() => setFraudDetails({...fraudDetails, recognizeAnyTransactions: false})}
                  />
                  No
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="suspicious-activity">
                Have you noticed any other suspicious activity?
              </label>
              <textarea 
                id="suspicious-activity"
                value={fraudDetails.additionalSuspiciousActivity}
                onChange={(e) => setFraudDetails({...fraudDetails, additionalSuspiciousActivity: e.target.value})}
                placeholder="Describe any other suspicious activity (optional)"
                rows="3"
              />
            </div>
          </div>
        )}
        
        {/* Description field for "other" reason */}
        {disputeReason === 'other' && (
          <div className="form-group">
            <label htmlFor="dispute-description">Description:</label>
            <textarea 
              id="dispute-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe your dispute reason in detail"
              className="form-textarea"
              rows="4"
            />
          </div>
        )}
        
        {/* Additional details for product/service issues */}
        {(disputeReason === 'product-not-received' || disputeReason === 'defective' || disputeReason === 'refund-not-received') && (
          <div className="form-group">
            <label htmlFor="dispute-description">Additional Details:</label>
            <textarea 
              id="dispute-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide additional details about your dispute"
              className="form-textarea"
              rows="4"
            />
          </div>
        )}

        {/* File attachment section */}
        <div className="form-group">
          <label>Supporting Documentation (Optional):</label>
          <p className="attachment-instructions">
            You can upload receipts, correspondence with merchant, or other evidence to support your dispute (max 5 files, 10MB each).
          </p>
          
          <div className="file-upload-area">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".jpg,.jpeg,.png,.gif,.pdf"
              style={{ display: 'none' }}
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current.click()}
              className="file-upload-button"
              disabled={attachments.length >= 5}
            >
              Select Files
            </button>
            <span className="file-upload-info">
              {attachments.length === 0 ? 'No files selected' : `${attachments.length} file(s) selected`}
            </span>
          </div>
          
          {attachments.length > 0 && (
            <ul className="attachment-list">
              {attachments.map((file, index) => (
                <li key={index} className="attachment-item">
                  <span className="attachment-name">{file.name}</span>
                  <span className="attachment-size">({(file.size / 1024).toFixed(1)} KB)</span>
                  <button 
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="remove-attachment-button"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Contact preference */}
        <div className="form-group">
          <label>Preferred Contact Method:</label>
          <div className="radio-group">
            <label className="radio-label">
              <input 
                type="radio" 
                name="contact-method"
                value="email"
                checked={contactMethod === 'email'}
                onChange={() => setContactMethod('email')}
              />
              Email ({contactDetails.email})
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                name="contact-method"
                value="phone"
                checked={contactMethod === 'phone'}
                onChange={() => setContactMethod('phone')}
              />
              Phone ({contactDetails.phone})
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                name="contact-method"
                value="mail"
                checked={contactMethod === 'mail'}
                onChange={() => setContactMethod('mail')}
              />
              Mail ({contactDetails.address})
            </label>
          </div>
        </div>
        
        {/* Temporary credit option */}
        <div className="form-group">
          <label className="checkbox-label">
            <input 
              type="checkbox"
              checked={temporaryCreditRequested}
              onChange={() => setTemporaryCreditRequested(!temporaryCreditRequested)}
            />
            Request temporary credit while dispute is being investigated
          </label>
          <p className="help-text">
            For eligible disputes, a temporary credit may be applied to your account. If the dispute is resolved in the merchant's favor, this credit will be reversed.
          </p>
        </div>
      </div>
      
      <div className="step-actions">
        <button className="secondary-button" onClick={() => setStep(1)}>Back</button>
        <button className="primary-button" onClick={handleSubmitDispute}>Continue</button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="dispute-transaction-step">
      <h2>Review and Confirm</h2>
      
      <div className="dispute-summary">
        <h3>Dispute Summary</h3>
        
        <div className="summary-section">
          <h4>Transaction Details</h4>
          <div className="summary-item">
            <span>Date:</span>
            <span>{selectedTransaction.formattedDate}</span>
          </div>
          <div className="summary-item">
            <span>Description:</span>
            <span>{selectedTransaction.description}</span>
          </div>
          <div className="summary-item">
            <span>Card Number:</span>
            <span>xxxx-xxxx-xxxx-{selectedTransaction.cardLast4}</span>
          </div>
          <div className="summary-item">
            <span>Amount:</span>
            <span className="negative-amount">{formatCurrency(selectedTransaction.amount)}</span>
          </div>
        </div>
        
        <div className="summary-section">
          <h4>Dispute Details</h4>
          <div className="summary-item">
            <span>Reason:</span>
            <span>
              {disputeReason === 'unauthorized' && 'Unauthorized Transaction'}
              {disputeReason === 'duplicate' && 'Duplicate Transaction'}
              {disputeReason === 'wrong-amount' && 'Wrong Amount'}
              {disputeReason === 'product-not-received' && 'Product/Service Not Received'}
              {disputeReason === 'defective' && 'Defective Product/Service'}
              {disputeReason === 'cancelled' && 'Cancelled Subscription/Membership'}
              {disputeReason === 'refund-not-received' && 'Refund Not Received'}
              {disputeReason === 'other' && 'Other'}
            </span>
          </div>
          
          {disputeSubReason && (
            <div className="summary-item">
              <span>Specific Reason:</span>
              <span>
                {getSubReasons().find(r => r.value === disputeSubReason)?.label || disputeSubReason}
              </span>
            </div>
          )}
          
          {(description || disputeReason === 'other') && (
            <div className="summary-item">
              <span>Description:</span>
              <span>{description || 'None provided'}</span>
            </div>
          )}
          
          {isFraud && (
            <div className="fraud-summary">
              <div className="summary-item">
                <span>Card in Possession:</span>
                <span>{fraudDetails.cardInPossession ? 'Yes' : 'No'}</span>
              </div>
              
              {!fraudDetails.cardInPossession && (
                <div className="summary-item">
                  <span>Card Status:</span>
                  <span>{cardStatus === 'block' ? 'Card will be blocked' : 'Card will remain active'}</span>
                </div>
              )}
              
              <div className="summary-item">
                <span>Last Valid Transaction:</span>
                <span>{fraudDetails.lastValidTransaction || 'Not specified'}</span>
              </div>
              
              {fraudDetails.suspectMerchant && (
                <div className="summary-item">
                  <span>Suspected Merchant:</span>
                  <span>{fraudDetails.suspectMerchant}</span>
                </div>
              )}
              
              {fraudDetails.additionalSuspiciousActivity && (
                <div className="summary-item">
                  <span>Additional Information:</span>
                  <span>{fraudDetails.additionalSuspiciousActivity}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="summary-item">
            <span>Contact Method:</span>
            <span>{contactMethod === 'email' ? 'Email' : contactMethod === 'phone' ? 'Phone' : 'Mail'}</span>
          </div>
          
          <div className="summary-item">
            <span>Temporary Credit:</span>
            <span>{temporaryCreditRequested ? 'Requested' : 'Not requested'}</span>
          </div>
          
          {attachments.length > 0 && (
            <div className="summary-item">
              <span>Attachments:</span>
              <span>{attachments.length} file(s) attached</span>
            </div>
          )}
        </div>
        
        <div className="dispute-disclaimer">
          <h4>Important Information</h4>
          <p>
            By submitting this dispute, you confirm that you have reviewed the transaction in question and believe there is a valid reason for dispute according to Wells Fargo policies.
          </p>
          <p>
            After submitting your dispute:
          </p>
          <ul>
            <li>You will receive a confirmation email with your dispute case number.</li>
            <li>A temporary credit may be issued while your case is being investigated if you requested one.</li>
            <li>The investigation process typically takes 7-10 business days.</li>
            <li>You may be asked to provide additional information or documentation.</li>
            <li>If you indicated that your card was lost, stolen, or used fraudulently, we may block your card and issue a replacement.</li>
          </ul>
          
          <p>
            <strong>False Claims Notice:</strong> Submitting a false claim may result in account penalties and possible legal action. Please ensure all information provided is accurate and truthful.
          </p>
        </div>
        
        <div className="confirmation-checkbox">
          <label>
            <input 
              type="checkbox" 
              checked={hasAgreedToTerms}
              onChange={() => setHasAgreedToTerms(!hasAgreedToTerms)}
            />
            I confirm that the information provided is accurate and complete to the best of my knowledge.
          </label>
        </div>
      </div>
      
      <div className="step-actions">
        <button className="secondary-button" onClick={() => setStep(2)}>Back</button>
        <button className="primary-button" onClick={handleConfirmDispute}>Submit Dispute</button>
      </div>
    </div>
  );

  const renderStep4 = () => {
    if (submissionStatus === 'submitting') {
      return (
        <div className="dispute-transaction-step submission-step">
          <div className="loading-spinner"></div>
          <h2>Submitting Your Dispute</h2>
          <p className="processing-message">
            Please wait while we process your dispute submission...
          </p>
        </div>
      );
    }
    
    if (submissionStatus === 'failed') {
      return (
        <div className="dispute-transaction-step error-step">
          <div className="error-icon">!</div>
          <h2>Submission Error</h2>
          <p className="error-message">
            {errorMessage}
          </p>
          
          <div className="step-actions">
            <button className="secondary-button" onClick={handleContactCustomerService}>
              Contact Customer Service
            </button>
            <button className="primary-button" onClick={handleRetrySubmission}>
              Retry Submission
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="dispute-transaction-step success-step">
        <div className="success-icon">✓</div>
        <h2>Dispute Submitted Successfully</h2>
        <p className="success-message">
          Your dispute for {selectedTransaction.description} ({formatCurrency(selectedTransaction.amount)}) has been successfully submitted.
        </p>
        
        <div className="case-details">
          <h3>Case Details</h3>
          <div className="case-detail">
            <span>Case Number:</span>
            <span>{disputeNumber}</span>
          </div>
          <div className="case-detail">
            <span>Submission Date:</span>
            <span>{format(new Date(), 'MM/dd/yyyy')}</span>
          </div>
          <div className="case-detail">
            <span>Expected Resolution Date:</span>
            <span>
              {format(new Date(new Date().setDate(new Date().getDate() + 10)), 'MM/dd/yyyy')}
            </span>
          </div>
        </div>
        
        <div className="status-history">
          <h3>Status Updates</h3>
          <div className="status-timeline">
            {statusHistory.map((status, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-date">{status.date}</div>
                <div className="timeline-content">
                  <div className="timeline-status">{status.status}</div>
                  <div className="timeline-description">{status.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="next-steps">
          <h3>Next Steps</h3>
          <p>
            We'll review your dispute and may contact you via your preferred method ({contactMethod}) for additional information. You'll receive updates as your case progresses.
          </p>
          {temporaryCreditRequested && (
            <p>
              You requested a temporary credit of {formatCurrency(Math.abs(selectedTransaction.amount))}. This credit will appear in your account within 1-2 business days.
            </p>
          )}
          {cardStatus === 'block' && (
            <p>
              As requested, your card ending in {selectedTransaction.cardLast4} has been blocked. A replacement card will be mailed to your address on file within 7-10 business days.
            </p>
          )}
        </div>
        
        <div className="dispute-actions">
          <h3>Manage This Dispute</h3>
          <p>
            You can check the status of your dispute or provide additional information at any time.
          </p>
          <div className="dispute-action-buttons">
            <button onClick={() => navigate(`/disputes/${disputeNumber}`)}>
              View Dispute Details
            </button>
            <button onClick={() => navigate('/disputes')}>
              View All Disputes
            </button>
          </div>
        </div>
        
        <div className="step-actions">
          <button className="secondary-button" onClick={goToAccount}>Return to Account</button>
          <button className="primary-button" onClick={goToDashboard}>Go to Dashboard</button>
        </div>
      </div>
    );
  };

  return (
    <div className="dispute-transaction-page">
      <header className="dis010-page-header">
        <div className="dis010-back-button" onClick={goToAccount}>
          <span className="dis010-back-arrow">&#8592;</span> Back to Account
        </div>
        <button className="dis010-help-button" onClick={() => setIsHelpModalOpen(true)}>
          Need Help?
        </button>
        <div className="dis010-wells-fargo-branding">
          <div className="dis010-logo-container">
            <img src="/Images/wells fargo.jpeg" alt="Wells Fargo Logo" className="dis010-wf-logo" />
          </div>
        </div>
      </header>
      
      <div className="page-content">
        <div className="page-title-section">
          <h1>Dispute a Transaction</h1>
          <p className="page-description">
            If you don't recognize a transaction or have an issue with a charge, you can dispute it here.
          </p>
        </div>
        
        <div className="progress-tracker">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Select Transaction</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Enter Details</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Review & Confirm</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Confirmation</div>
          </div>
        </div>
        
        <div className="dispute-content">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Submission</h2>
              <button className="close-button" onClick={() => setIsConfirmModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to submit this dispute for {selectedTransaction.description} ({formatCurrency(selectedTransaction.amount)})?
              </p>
              {cardStatus === 'block' && (
                <p className="warning-text">
                  <strong>Important:</strong> Your card ending in {selectedTransaction.cardLast4} will be blocked and a replacement will be issued.
                </p>
              )}
              <p>
                <strong>Note:</strong> After submitting, your dispute will be reviewed by our team. The review process typically takes 7-10 business days.
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-button secondary" onClick={() => setIsConfirmModalOpen(false)}>Cancel</button>
              <button className="modal-button primary" onClick={handleDisputeSubmitted}>Confirm Submission</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Help Modal - can be triggered from any step */}
      {isHelpModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content help-modal">
            <div className="modal-header">
              <h2>Dispute Help</h2>
              <button className="close-button" onClick={() => setIsHelpModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <h3>About Transaction Disputes</h3>
              <p>
                A dispute (or chargeback) is a way to get your money back when there is an issue with a transaction on your account.
              </p>
              
              <h4>Common Reasons for Disputes:</h4>
              <ul>
                <li><strong>Unauthorized Transactions:</strong> Charges you didn't make or approve.</li>
                <li><strong>Duplicate Charges:</strong> Being charged more than once for the same purchase.</li>
                <li><strong>Wrong Amount:</strong> Being charged an incorrect amount.</li>
                <li><strong>Products/Services Not Received:</strong> Items not delivered or services not provided.</li>
                <li><strong>Defective Products/Services:</strong> Items that arrived damaged or services not as described.</li>
                <li><strong>Cancelled Services:</strong> Continuing to be charged after cancellation.</li>
                <li><strong>Refunds Not Received:</strong> Not receiving promised refunds from merchants.</li>
              </ul>
              
              <h4>Dispute Process Timeline:</h4>
              <ol>
                <li>Submit your dispute with all relevant details and documentation.</li>
                <li>Wells Fargo will review your case and may issue a temporary credit.</li>
                <li>We'll investigate with the merchant (typically 7-10 business days).</li>
                <li>You'll be notified of the resolution. If found in your favor, the temporary credit becomes permanent.</li>
              </ol>
              
              <h4>Tips for a Successful Dispute:</h4>
              <ul>
                <li>Submit your dispute as soon as possible after noticing the issue.</li>
                <li>Provide all requested information accurately and completely.</li>
                <li>Include any supporting documentation such as receipts or correspondence with the merchant.</li>
                <li>First attempt to resolve issues directly with the merchant when possible.</li>
              </ul>
              
              <p>
                For additional assistance, contact Wells Fargo Customer Service at 1-800-869-3557, available 24/7.
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-button primary" onClick={() => setIsHelpModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DisputeTransactionPage.propTypes = {
  userAccountId: PropTypes.string,
  wellsFargoAuthToken: PropTypes.string
};

DisputeTransactionPage.defaultProps = {
  userAccountId: '',
  wellsFargoAuthToken: ''
};

export default DisputeTransactionPage;