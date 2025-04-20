import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import './OrderChecksPage.css';

const API_URL = 'http://localhost:5000/api';

const OrderChecksPage = ({ userAccounts = [] }) => {
  const navigate = useNavigate();
  
  // Default accounts if none provided through props
  const defaultAccounts = [
    { id: 'checking1', type: 'checking', name: 'Everyday Checking', number: '*****5678', balance: 2543.87 },
    { id: 'checking2', type: 'checking', name: 'Premium Checking', number: '*****3456', balance: 8721.45 },
    { id: 'savings1', type: 'savings', name: 'Way2Save Savings', number: '*****9012', balance: 15420.32 }
  ];
  
  const accounts = (userAccounts && userAccounts.length > 0) ? userAccounts : defaultAccounts || [];
  const checkingAccounts = accounts ? accounts.filter(account => account.type === 'checking') : [];



  // Form state
  const [selectedAccount, setSelectedAccount] = useState(checkingAccounts && checkingAccounts.length > 0 ? checkingAccounts[0]?.id : '');
  const [checkStyle, setCheckStyle] = useState('standard');
  const [quantity, setQuantity] = useState('1');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [shippingAddress, setShippingAddress] = useState('home');
  const [customization, setCustomization] = useState({ 
    startingNumber: '',
    includeAddress: true,
    includePhoneNumber: false,
    includeDriversLicense: false,
    duplicateChecks: false,
    largePrint: false,
    fontStyle: 'standard'
  });
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [savePreferences, setSavePreferences] = useState(false);
  
  // Addresses state
  const [addresses, setAddresses] = useState([
    { id: 'home', name: 'Home Address', street: '123 Main St', city: 'Anytown', state: 'CA', zip: '94000', primary: true },
    { id: 'work', name: 'Work Address', street: '456 Business Ave', city: 'Anytown', state: 'CA', zip: '94001', primary: false }
  ]);
  const [newAddress, setNewAddress] = useState({ name: '', street: '', city: '', state: '', zip: '', primary: false });
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  
  // Modal states
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  // File upload state
  const [customPhoto, setCustomPhoto] = useState(null);
  const [customPhotoPreview, setCustomPhotoPreview] = useState(null);
  
  // Error and validation states
  const [formErrors, setFormErrors] = useState({});
  const [orderNumber, setOrderNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Check options
  const [checkStyles, setCheckStyles] = useState([
    { id: 'standard', name: 'Standard Blue', price: 20.00, image: '/Images/check-standard.jpg', description: 'Classic blue design with security features' },
    { id: 'premium', name: 'Premium Gray', price: 25.00, image: '/Images/check-premium.jpg', description: 'Elegant gray design with enhanced security' },
    { id: 'scenic', name: 'Scenic Nature', price: 28.00, image: '/Images/check-scenic.jpg', description: 'Beautiful landscape imagery on each check' },
    { id: 'custom', name: 'Custom Photo', price: 35.00, image: '/Images/check-custom.jpg', description: 'Upload your personal photo for a customized look' }
  ]);

  const [deliveryOptions, setDeliveryOptions] = useState([
    { id: 'standard', name: 'Standard Delivery', description: '7-10 business days', price: 0.00 },
    { id: 'expedited', name: 'Expedited Delivery', description: '3-5 business days', price: 8.95 },
    { id: 'overnight', name: 'Overnight Delivery', description: 'Next business day', price: 15.95 }
  ]);

  const [quantityOptions, setQuantityOptions] = useState([
    { id: '1', name: 'Single Book', description: '100 checks', price: 20.00 },
    { id: '2', name: 'Double Book', description: '200 checks', price: 36.00 },
    { id: '4', name: 'Value Pack', description: '400 checks', price: 65.00 }
  ]);
  
  const [taxRate, setTaxRate] = useState(0.0825); // Default 8.25%

  // Calculate prices and totals
  const selectedCheckStyle = checkStyles && checkStyles.length > 0 ? 
  (checkStyles.find(style => style.id === checkStyle) || checkStyles[0]) : 
  { id: 'standard', name: 'Standard Blue', price: 20.00, image: '/Images/check-standard.jpg', description: 'Classic blue design with security features' };

  const selectedQuantityOption = quantityOptions && quantityOptions.length > 0 ? 
  (quantityOptions.find(option => option.id === quantity) || quantityOptions[0]) : 
  { id: '1', name: 'Single Book', description: '100 checks', price: 20.00 };

  const selectedDeliveryOption = deliveryOptions && deliveryOptions.length > 0 ? 
  (deliveryOptions.find(option => option.id === deliveryMethod) || deliveryOptions[0]) : 
  { id: 'standard', name: 'Standard Delivery', description: '7-10 business days', price: 0.00 };
  
  const selectedAccountData = accounts && accounts.length > 0 ? 
  (accounts.find(acc => acc.id === selectedAccount) || accounts[0]) : 
  { id: '', type: 'checking', name: 'No Account', number: '', balance: 0 };
  
  
  // Calculate pricing
  const calculateSubtotal = () => {
    return selectedCheckStyle.price + selectedQuantityOption.price;
  };
  
  const calculateTax = () => {
    return calculateSubtotal() * taxRate;
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + selectedDeliveryOption.price;
  };

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('wellsFargoAuthToken');
  };

  // Axios instance with auth headers
  const getAuthConfig = () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return null;
    }
    return {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
  };

  // Load check styles and pricing from API
  useEffect(() => {
    const fetchCheckStylesAndPricing = async () => {
      try {
        const config = getAuthConfig();
        if (!config) return;

        // Fetch check styles
        const checkStylesRes = await axios.get(`${API_URL}/order-checks/check-styles`, config);
        if (checkStylesRes.data.success) {
          setCheckStyles(checkStylesRes.data.data);
        }

        // Fetch pricing information
        const pricingRes = await axios.get(`${API_URL}/order-checks/pricing`, config);
        if (pricingRes.data && pricingRes.data.success && pricingRes.data.data) {
          const { checkStyles, quantities, deliveryMethods, taxRate } = pricingRes.data.data || {};
          
          if (checkStyles && checkStyles.length > 0) {
            setCheckStyles(prev => {
              // Merge prices with existing check styles
              return prev.map(style => {
                const priceInfo = checkStyles.find(cs => cs.id === style.id);
                return { ...style, price: priceInfo?.price || style.price };
              });
            });
          }
          
          if (quantities && quantities.length > 0) {
            setQuantityOptions(prev => {
              return prev.map(option => {
                const priceInfo = quantities.find(q => q.id === option.id);
                return { ...option, price: priceInfo?.price || option.price };
              });
            });
          }
          
          if (deliveryMethods && deliveryMethods.length > 0) {
            setDeliveryOptions(prev => {
              return prev.map(option => {
                const priceInfo = deliveryMethods.find(dm => dm.id === option.id);
                return { ...option, price: priceInfo?.price || option.price };
              });
            });
          }
          
          if (taxRate) {
            setTaxRate(taxRate);
          }
        }
      } catch (error) {
        console.error('Error fetching check styles and pricing:', error);
        setApiError('Failed to load check styles and pricing information.');
      }
    };
    
    fetchCheckStylesAndPricing();
  }, [navigate]);
  
  // Load saved preferences from API
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const config = getAuthConfig();
        if (!config) return;

        const res = await axios.get(`${API_URL}/order-checks/preferences`, config);
        if (res.data.success && res.data.data) {
          const preferences = res.data.data;
          if (preferences.checkStyle) setCheckStyle(preferences.checkStyle);
          if (preferences.deliveryMethod) setDeliveryMethod(preferences.deliveryMethod);
          if (preferences.customization) {
            setCustomization(prev => ({
              ...prev,
              ...preferences.customization
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
        // Don't show error to user for preferences loading
      }
    };
    
    loadUserPreferences();
  }, [navigate]);

  // Generate order number when successful
  useEffect(() => {
    if (isSuccessModalOpen && !orderNumber) {
      const timestamp = new Date().getTime().toString().slice(-8);
      const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setOrderNumber(`WF${timestamp}${randomDigits}`);
    }
  }, [isSuccessModalOpen, orderNumber]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!selectedAccount) errors.account = 'Please select an account';
    if (!checkStyle) errors.checkStyle = 'Please select a check style';
    if (!quantity) errors.quantity = 'Please select a quantity';
    if (!shippingAddress) errors.shippingAddress = 'Please select a shipping address';
    if (!agreeToTerms) errors.agreeToTerms = 'You must agree to the terms and conditions';
    
    // For custom checks, validate that a photo is selected
    if (checkStyle === 'custom' && !customPhoto && !customPhotoPreview) {
      errors.customPhoto = 'Please upload a custom photo for your checks';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Clear any existing errors
    setFormErrors({});
    
    // Open confirmation modal
    setIsConfirmModalOpen(true);
  };

  // Add new address
  const handleAddAddress = () => {
    // Validate address
    const errors = {};
    if (!newAddress.name) errors.name = 'Address name is required';
    if (!newAddress.street) errors.street = 'Street address is required';
    if (!newAddress.city) errors.city = 'City is required';
    if (!newAddress.state) errors.state = 'State is required';
    if (!newAddress.zip) errors.zip = 'ZIP code is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Add new address with unique id
    const id = `address_${Date.now()}`;
    const addressToAdd = {
      ...newAddress,
      id
    };
    
    setAddresses([...addresses, addressToAdd]);
    setShippingAddress(id);
    setNewAddress({ name: '', street: '', city: '', state: '', zip: '', primary: false });
    setIsAddingAddress(false);
    setIsAddressModalOpen(false);
  };

  // Delete address
  const handleDeleteAddress = (id) => {
    // Don't allow deleting if it's the only address
    if (addresses.length <= 1) {
      alert('You must have at least one shipping address.');
      return;
    }
    
    const updatedAddresses = addresses.filter(address => address.id !== id);
    setAddresses(updatedAddresses);
    
    // If the deleted address was selected, select the first available address
    if (shippingAddress === id) {
      setShippingAddress(updatedAddresses[0].id);
    }
  };

  // Set address as primary
  const handleSetPrimaryAddress = (id) => {
    const updatedAddresses = addresses.map(address => ({
      ...address,
      primary: address.id === id
    }));
    
    setAddresses(updatedAddresses);
  };

  // Preview checks
  const handlePreviewChecks = () => {
    setIsLoadingPreview(true);
    setIsPreviewModalOpen(true);
    
    // Simulate loading preview
    setTimeout(() => {
      setIsLoadingPreview(false);
    }, 1500);
  };

  // Handle file selection for custom photo upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setFormErrors({...formErrors, customPhoto: 'File size must be less than 10MB'});
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormErrors({...formErrors, customPhoto: 'Only image files are allowed'});
        return;
      }
      
      setCustomPhoto(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear error if exists
      if (formErrors.customPhoto) {
        const { customPhoto, ...rest } = formErrors;
        setFormErrors(rest);
      }
    }
  };

  // Upload custom photo for checks
  const handleUploadCustomPhoto = async () => {
    if (!customPhoto) return null;
    
    try {
      setIsLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        navigate('/login');
        return null;
      }

      const formData = new FormData();
      formData.append('photo', customPhoto);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      };

      const res = await axios.post(`${API_URL}/order-checks/upload-photo`, formData, config);
      
      if (res.data.success) {
        setIsLoading(false);
        setIsCustomizeModalOpen(false);
        return res.data.data.filePath;
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setApiError('Failed to upload photo. Please try again.');
      setIsLoading(false);
      return null;
    }
  };

  // Place order
  const confirmOrder = async () => {
    try {
      setIsLoading(true);
      
      // Upload custom photo if selected
      let customPhotoPath = null;
      if (checkStyle === 'custom' && customPhoto) {
        customPhotoPath = await handleUploadCustomPhoto();
        if (!customPhotoPath && checkStyle === 'custom') {
          setApiError('Failed to upload custom photo. Please try again.');
          setIsLoading(false);
          return;
        }
      }
      
      const config = getAuthConfig();
      if (!config) return;

      // Prepare order data
      const selectedAddress = addresses.find(addr => addr.id === shippingAddress);
      
      const orderData = {
        accountId: selectedAccountData.id,
        accountName: selectedAccountData.name,
        accountNumber: selectedAccountData.number,
        checkStyle,
        quantity,
        deliveryMethod,
        shippingAddress: selectedAddress,
        customization: {
          ...customization,
          customPhotoPath: customPhotoPath
        },
        specialInstructions,
        pricing: {
          checkStylePrice: selectedCheckStyle.price,
          quantityPrice: selectedQuantityOption.price,
          deliveryPrice: selectedDeliveryOption.price,
          subtotal: calculateSubtotal(),
          tax: calculateTax(),
          total: calculateTotal()
        }
      };

      // Create order
      const res = await axios.post(`${API_URL}/order-checks`, orderData, config);
      
      if (res.data.success) {
        setIsLoading(false);
        setIsConfirmModalOpen(false);
        setOrderNumber(res.data.data.orderNumber);
        setIsSuccessModalOpen(true);
        
        // Save preferences if selected
        if (savePreferences) {
          try {
            await axios.post(
              `${API_URL}/order-checks/preferences`, 
              {
                checkStyle,
                deliveryMethod,
                customization: {
                  startingNumber: customization.startingNumber,
                  includeAddress: customization.includeAddress,
                  includePhoneNumber: customization.includePhoneNumber,
                  includeDriversLicense: customization.includeDriversLicense,
                  duplicateChecks: customization.duplicateChecks,
                  largePrint: customization.largePrint,
                  fontStyle: customization.fontStyle
                }
              }, 
              config
            );
          } catch (error) {
            console.error('Error saving preferences:', error);
            // Continue even if saving preferences fails
          }
        }
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setApiError(error.response?.data?.message || 'Failed to place order. Please try again.');
      setIsLoading(false);
      setIsConfirmModalOpen(false);
    }
  };

  // Close success modal and navigate back
  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    navigate('/checking-account');
  };

  // Format address for display
  const formatAddress = (address) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  };

  // Get selected address object
  const getSelectedAddress = () => {
    return addresses.find(address => address.id === shippingAddress) || addresses[0];
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  // Format date based on delivery method
  const getEstimatedDeliveryDate = () => {
    const today = new Date();
    let deliveryDate = new Date();
    
    if (deliveryMethod === 'overnight') {
      deliveryDate.setDate(today.getDate() + 1);
      // Check if it's a weekend
      if (deliveryDate.getDay() === 0) deliveryDate.setDate(deliveryDate.getDate() + 1); // Sunday
      if (deliveryDate.getDay() === 6) deliveryDate.setDate(deliveryDate.getDate() + 2); // Saturday
      return `${deliveryDate.toLocaleDateString()} by 5:00 PM`;
    } else if (deliveryMethod === 'expedited') {
      deliveryDate.setDate(today.getDate() + 5);
      const minDate = new Date();
      minDate.setDate(today.getDate() + 3);
      return `Between ${minDate.toLocaleDateString()} and ${deliveryDate.toLocaleDateString()}`;
    } else {
      deliveryDate.setDate(today.getDate() + 10);
      const minDate = new Date();
      minDate.setDate(today.getDate() + 7);
      return `Between ${minDate.toLocaleDateString()} and ${deliveryDate.toLocaleDateString()}`;
    }
  };

  return (
    <div className="order-checks-page">
      <header className="ord022-order-checks-header">
        <div className="ord022-back-button" onClick={() => navigate('/checking-account')}>
          <span className="ord022-back-arrow">&#8592;</span> Back to Account
        </div>
        <div className="ord022-wells-fargo-branding">
          <div className="ord022-logo-container">
            <img src="/Images/wells fargo.jpeg" alt="Wells Fargo Logo" className="ord022-wf-logo" />
          </div>
        </div>
      </header>

      {apiError && (
        <div className="api-error-banner">
          <p>{apiError}</p>
          <button onClick={() => setApiError(null)} className="close-error">×</button>
        </div>
      )}

      <div className="order-checks-content">
        <div className="order-checks-card">
          <h1>Order Checks</h1>
          <p className="order-description">
            Order new checks for your account by selecting from our available styles and delivery options.
          </p>

          <form className="order-form" onSubmit={handleSubmit}>
            {/* Account Selection */}
            <div className="form-group">
              <label htmlFor="account-from">Select Account:</label>
              <select 
                id="account-from" 
                value={selectedAccount} 
                onChange={(e) => setSelectedAccount(e.target.value)}
                className={`form-control ${formErrors.account ? 'error' : ''}`}
              >
                <option value="">Select an account</option>
                {checkingAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.number} (Balance: ${account.balance.toFixed(2)})
                  </option>
                ))}
              </select>
              {formErrors.account && <div className="error-message">{formErrors.account}</div>}
            </div>

            {/* Check Style Selection */}
            <div className="form-group">
              <label>Select Check Style:</label>
              <div className={`check-styles-grid ${formErrors.checkStyle ? 'error' : ''}`}>
                {checkStyles && checkStyles.length > 0 ? checkStyles.map(style => (
                  <div
                    key={style.id}
                    className={`check-style-option ${checkStyle === style.id ? 'selected' : ''}`}
                    onClick={() => setCheckStyle(style.id)}
                  >
                    <div className="check-style-image-container">
                      <img
                        src={style.image}
                        alt={style.name}
                        className="check-style-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/Images/wells fargo.jpeg';
                        }}
                      />
                    </div>
                    <div className="check-style-info">
                      <div className="check-style-name">{style.name}</div>
                      <div className="check-style-price">{formatCurrency(style.price)}</div>
                      <div className="check-style-description">{style.description}</div>
                    </div>
                    {checkStyle === style.id && <div className="check-style-selected-indicator">✓</div>}
                  </div>
                )) : <div className="no-styles-message">Loading check styles...</div>}
              </div>
              {formErrors.checkStyle && <div className="error-message">{formErrors.checkStyle}</div>}
              
              {/* Customize button for custom photo option */}
              {checkStyle === 'custom' && (
                <div className="custom-photo-section">
                  <button 
                    type="button" 
                    className="button secondary customize-button"
                    onClick={() => setIsCustomizeModalOpen(true)}
                  >
                    Upload Custom Photo
                  </button>
                  {customPhotoPreview && (
                    <div className="photo-preview">
                      <p>Selected photo:</p>
                      <img src={customPhotoPreview} alt="Custom check preview" className="custom-photo-preview" />
                    </div>
                  )}
                  {formErrors.customPhoto && <div className="error-message">{formErrors.customPhoto}</div>}
                </div>
              )}
            </div>

            {/* Quantity Selection */}
            <div className="form-group">
              <label htmlFor="quantity">Quantity:</label>
              <select 
                id="quantity" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)}
                className={`form-control ${formErrors.quantity ? 'error' : ''}`}
              >
                <option value="">Select quantity</option>
                {quantityOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name} ({option.description}) - {formatCurrency(option.price)}
                  </option>
                ))}
              </select>
              {formErrors.quantity && <div className="error-message">{formErrors.quantity}</div>}
            </div>

            {/* Delivery Method Selection */}
            <div className="form-group">
              <label htmlFor="delivery-method">Delivery Method:</label>
              <div className="delivery-options">
                {deliveryOptions.map(option => (
                  <div 
                    key={option.id}
                    className={`delivery-option ${deliveryMethod === option.id ? 'selected' : ''}`}
                    onClick={() => setDeliveryMethod(option.id)}
                  >
                    <div className="delivery-option-radio">
                      <input 
                        type="radio" 
                        name="delivery" 
                        checked={deliveryMethod === option.id}
                        onChange={() => setDeliveryMethod(option.id)}
                      />
                    </div>
                    <div className="delivery-option-info">
                      <div className="delivery-option-name">{option.name}</div>
                      <div className="delivery-option-description">{option.description}</div>
                      <div className="delivery-option-price">{formatCurrency(option.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address Selection */}
            <div className="form-group">
              <label htmlFor="shipping-address">Shipping Address:</label>
              <select 
                id="shipping-address" 
                value={shippingAddress} 
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setIsAddingAddress(true);
                    setIsAddressModalOpen(true);
                  } else {
                    setShippingAddress(e.target.value);
                  }
                }}
                className={`form-control ${formErrors.shippingAddress ? 'error' : ''}`}
              >
                <option value="">Select shipping address</option>
                {addresses.map(address => (
                  <option key={address.id} value={address.id}>
                    {address.name} - {formatAddress(address)}
                    {address.primary ? ' (Primary)' : ''}
                  </option>
                ))}
                <option value="new">Add New Address</option>
              </select>
              {formErrors.shippingAddress && <div className="error-message">{formErrors.shippingAddress}</div>}
              
              {/* Address management buttons */}
              {shippingAddress && shippingAddress !== 'new' && (
                <div className="address-management">
                  <button 
                    type="button" 
                    className="button link edit-address-button"
                    onClick={() => {
                      const address = addresses.find(a => a.id === shippingAddress);
                      if (address) {
                        setNewAddress({...address});
                        setIsAddingAddress(false);
                        setIsAddressModalOpen(true);
                      }
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    type="button" 
                    className="button link delete-address-button"
                    onClick={() => handleDeleteAddress(shippingAddress)}
                  >
                    Delete
                  </button>
                  {!getSelectedAddress().primary && (
                    <button 
                      type="button" 
                      className="button link set-primary-button"
                      onClick={() => handleSetPrimaryAddress(shippingAddress)}
                    >
                      Set as Primary
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Customization Options */}
            <div className="form-group">
              <label>Customization Options:</label>
              <div className="customization-options">
                <div className="customization-option">
                  <label htmlFor="starting-number">Starting Check Number:</label>
                  <input 
                    type="number" 
                    id="starting-number"
                    min="1000"
                    placeholder="Leave blank for sequential numbering"
                    value={customization.startingNumber}
                    onChange={(e) => setCustomization({...customization, startingNumber: e.target.value})}
                    className="form-control"
                  />
                </div>
                
                <div className="checkbox-group">
                  <div className="checkbox-option">
                    <input 
                      type="checkbox" 
                      id="include-address"
                      checked={customization.includeAddress}
                      onChange={(e) => setCustomization({...customization, includeAddress: e.target.checked})}
                    />
                    <label htmlFor="include-address">Include address on checks</label>
                  </div>
                  
                  <div className="checkbox-option">
                    <input 
                      type="checkbox" 
                      id="include-phone"
                      checked={customization.includePhoneNumber}
                      onChange={(e) => setCustomization({...customization, includePhoneNumber: e.target.checked})}
                    />
                    <label htmlFor="include-phone">Include phone number on checks</label>
                  </div>
                  
                  <div className="checkbox-option">
                    <input 
                      type="checkbox" 
                      id="include-license"
                      checked={customization.includeDriversLicense}
                      onChange={(e) => setCustomization({...customization, includeDriversLicense: e.target.checked})}
                    />
                    <label htmlFor="include-license">Include driver's license on checks</label>
                  </div>
                </div>
                
                <button
                  type="button"
                  className="button secondary customize-button"
                  onClick={() => setIsCustomizeModalOpen(true)}
                >
                  More Options
                </button>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="form-group">
              <label htmlFor="special-instructions">Special Instructions (optional):</label>
              <textarea
                id="special-instructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Add any special instructions or requests"
                className="form-control"
                rows="3"
              ></textarea>
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="summary-item">
                <span>Check Style:</span>
                <span>{selectedCheckStyle.name}</span>
                <span className="price">{formatCurrency(selectedCheckStyle.price)}</span>
              </div>
              <div className="summary-item">
                <span>Quantity:</span>
                <span>{selectedQuantityOption.name}</span>
                <span className="price">{formatCurrency(selectedQuantityOption.price)}</span>
              </div>
              <div className="summary-item">
                <span>Delivery:</span>
                <span>{selectedDeliveryOption.name}</span>
                <span className="price">{formatCurrency(selectedDeliveryOption.price)}</span>
              </div>
              <div className="summary-item subtotal">
                <span>Subtotal:</span>
                <span></span>
                <span className="price">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="summary-item">
                <span>Tax ({(taxRate * 100).toFixed(2)}%):</span>
                <span></span>
                <span className="price">{formatCurrency(calculateTax())}</span>
              </div>
              <div className="summary-item total">
                <span>Total:</span>
                <span></span>
                <span className="price">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            {/* Terms and Save Preferences */}
            <div className="form-group agreement">
              <div className="checkbox-option terms-checkbox">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                />
                <label htmlFor="agree-terms">
                  I agree to the <a href="/terms" target="_blank">terms and conditions</a>
                </label>
              </div>
              {formErrors.agreeToTerms && <div className="error-message">{formErrors.agreeToTerms}</div>}
              
              <div className="checkbox-option save-preferences">
                <input
                  type="checkbox"
                  id="save-preferences"
                  checked={savePreferences}
                  onChange={(e) => setSavePreferences(e.target.checked)}
                />
                <label htmlFor="save-preferences">Save preferences for future orders</label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                type="button"
                className="button secondary"
                onClick={handlePreviewChecks}
              >
                Preview Checks
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Address Modal */}
      {isAddressModalOpen && (
        <div className="modal address-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{isAddingAddress ? 'Add New Address' : 'Edit Address'}</h2>
              <button className="close-modal" onClick={() => setIsAddressModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="address-name">Address Name:</label>
                <input
                  type="text"
                  id="address-name"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
                  placeholder="e.g. Home, Work, etc."
                  className={`form-control ${formErrors.name ? 'error' : ''}`}
                />
                {formErrors.name && <div className="error-message">{formErrors.name}</div>}
              </div>
              <div className="form-group">
                <label htmlFor="street-address">Street Address:</label>
                <input
                  type="text"
                  id="street-address"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                  placeholder="Street address"
                  className={`form-control ${formErrors.street ? 'error' : ''}`}
                />
                {formErrors.street && <div className="error-message">{formErrors.street}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City:</label>
                  <input
                    type="text"
                    id="city"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                    placeholder="City"
                    className={`form-control ${formErrors.city ? 'error' : ''}`}
                  />
                  {formErrors.city && <div className="error-message">{formErrors.city}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="state">State:</label>
                  <input
                    type="text"
                    id="state"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                    placeholder="State"
                    className={`form-control ${formErrors.state ? 'error' : ''}`}
                  />
                  {formErrors.state && <div className="error-message">{formErrors.state}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="zip">ZIP Code:</label>
                  <input
                    type="text"
                    id="zip"
                    value={newAddress.zip}
                    onChange={(e) => setNewAddress({...newAddress, zip: e.target.value})}
                    placeholder="ZIP"
                    className={`form-control ${formErrors.zip ? 'error' : ''}`}
                  />
                  {formErrors.zip && <div className="error-message">{formErrors.zip}</div>}
                </div>
              </div>
              <div className="checkbox-option">
                <input
                  type="checkbox"
                  id="primary-address"
                  checked={newAddress.primary}
                  onChange={(e) => setNewAddress({...newAddress, primary: e.target.checked})}
                />
                <label htmlFor="primary-address">Set as primary address</label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button secondary"
                onClick={() => setIsAddressModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleAddAddress}
              >
                {isAddingAddress ? 'Add Address' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customize Modal */}
      {isCustomizeModalOpen && (
        <div className="modal customize-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{checkStyle === 'custom' ? 'Upload Custom Photo' : 'Additional Customization Options'}</h2>
              <button className="close-modal" onClick={() => setIsCustomizeModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {checkStyle === 'custom' && (
                <div className="custom-photo-upload">
                  <label htmlFor="custom-photo">Upload a photo for your checks:</label>
                  <input
                    type="file"
                    id="custom-photo"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="form-control"
                  />
                  <p className="file-requirements">Image files only. Maximum size: 10MB</p>
                  {customPhotoPreview && (
                    <div className="photo-preview">
                      <p>Preview:</p>
                      <img src={customPhotoPreview} alt="Custom check preview" className="custom-photo-preview" />
                    </div>
                  )}
                </div>
              )}
              
              <div className="additional-customization">
                <div className="customization-option">
                  <label htmlFor="font-style">Font Style:</label>
                  <select
                    id="font-style"
                    value={customization.fontStyle}
                    onChange={(e) => setCustomization({...customization, fontStyle: e.target.value})}
                    className="form-control"
                  >
                    <option value="standard">Standard</option>
                    <option value="script">Script</option>
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                  </select>
                </div>
                
                <div className="checkbox-group">
                  <div className="checkbox-option">
                    <input
                      type="checkbox"
                      id="duplicate-checks"
                      checked={customization.duplicateChecks}
                      onChange={(e) => setCustomization({...customization, duplicateChecks: e.target.checked})}
                    />
                    <label htmlFor="duplicate-checks">Duplicate checks (+$5.00)</label>
                  </div>
                  
                  <div className="checkbox-option">
                    <input
                      type="checkbox"
                      id="large-print"
                      checked={customization.largePrint}
                      onChange={(e) => setCustomization({...customization, largePrint: e.target.checked})}
                    />
                    <label htmlFor="large-print">Large print (+$3.00)</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button secondary"
                onClick={() => setIsCustomizeModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                onClick={() => setIsCustomizeModalOpen(false)}
              >
                Save Options
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="modal preview-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Check Preview</h2>
              <button className="close-modal" onClick={() => setIsPreviewModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {isLoadingPreview ? (
                <div className="loading-preview">
                  <div className="loading-spinner"></div>
                  <p>Generating preview...</p>
                </div>
              ) : (
                <div className="check-preview">
                  <div className="check-preview-image">
                    <img 
                      src={customPhotoPreview || selectedCheckStyle.image} 
                      alt="Check Preview" 
                      className="preview-image"
                    />
                  </div>
                  <div className="check-preview-details">
                    <div className="preview-detail">
                      <span>Account:</span>
                      <span>{selectedAccountData.name} ({selectedAccountData.number})</span>
                    </div>
                    <div className="preview-detail">
                      <span>Style:</span>
                      <span>{selectedCheckStyle.name}</span>
                    </div>
                    <div className="preview-detail">
                      <span>Quantity:</span>
                      <span>{selectedQuantityOption.description}</span>
                    </div>
                    <div className="preview-detail">
                      <span>Customization:</span>
                      <span>
                        {customization.includeAddress ? 'With address' : 'No address'}, 
                        {customization.duplicateChecks ? 'Duplicate checks' : 'Standard checks'},
                        {customization.largePrint ? 'Large print' : 'Standard print'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button primary"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="modal confirm-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Order</h2>
              <button className="close-modal" onClick={() => setIsConfirmModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Please review your order details below:</p>
              
              <div className="confirmation-details">
                <div className="confirmation-section">
                  <h3>Account Information</h3>
                  <div className="confirmation-detail">
                    <span>Account:</span>
                    <span>{selectedAccountData.name}</span>
                  </div>
                  <div className="confirmation-detail">
                    <span>Account Number:</span>
                    <span>{selectedAccountData.number}</span>
                  </div>
                </div>
                
                <div className="confirmation-section">
                  <h3>Order Details</h3>
                  <div className="confirmation-detail">
                    <span>Check Style:</span>
                    <span>{selectedCheckStyle.name}</span>
                  </div>
                  <div className="confirmation-detail">
                    <span>Quantity:</span>
                    <span>{selectedQuantityOption.name} ({selectedQuantityOption.description})</span>
                  </div>
                  <div className="confirmation-detail">
                    <span>Delivery Method:</span>
                    <span>{selectedDeliveryOption.name} ({selectedDeliveryOption.description})</span>
                  </div>
                  <div className="confirmation-detail">
                    <span>Estimated Delivery:</span>
                    <span>{getEstimatedDeliveryDate()}</span>
                  </div>
                </div>
                
                <div className="confirmation-section">
                  <h3>Shipping Address</h3>
                  <div className="confirmation-detail address">
                    <span>{getSelectedAddress().name}</span>
                    <span>{formatAddress(getSelectedAddress())}</span>
                  </div>
                </div>
                
                <div className="confirmation-section">
                  <h3>Payment Summary</h3>
                  <div className="confirmation-detail">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="confirmation-detail">
                    <span>Tax ({(taxRate * 100).toFixed(2)}%):</span>
                    <span>{formatCurrency(calculateTax())}</span>
                  </div>
                  <div className="confirmation-detail">
                    <span>Shipping:</span>
                    <span>{formatCurrency(selectedDeliveryOption.price)}</span>
                  </div>
                  <div className="confirmation-detail total">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button secondary"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Edit Order
              </button>
              <button
                type="button"
                className="button primary"
                onClick={confirmOrder}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="modal success-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Order Successful</h2>
            </div>
            <div className="modal-body">
              <div className="success-icon">✓</div>
              <h3>Thank you for your order!</h3>
              <p>Your check order has been successfully placed.</p>
              <div className="order-confirmation">
                <p>Order Number: <strong>{orderNumber}</strong></p>
                <p>Expected Delivery: <strong>{getEstimatedDeliveryDate()}</strong></p>
              </div>
              <p>
                A confirmation email has been sent to your registered email address. 
                You can also track your order in the "Order History" section of your account.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button primary"
                onClick={closeSuccessModal}
              >
                Return to Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

OrderChecksPage.propTypes = {
  userAccounts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      number: PropTypes.string.isRequired,
      balance: PropTypes.number.isRequired
    })
  )
};

export default OrderChecksPage;