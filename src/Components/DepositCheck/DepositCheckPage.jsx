import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { CheckCircle, AlertTriangle, Camera, RotateCcw, ArrowLeft, DollarSign } from 'lucide-react';
import './DepositCheckPage.css';
import { 
  getDepositLimits, 
  getDepositAccounts, 
  submitDeposit, 
  getDepositHistory 
} from '../../services/depositService';

const DepositCheckPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth() || { currentUser: null };
  
  // Main state management
  const [step, setStep] = useState(1);
  const [depositAccount, setDepositAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [depositComplete, setDepositComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Check image states
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontImageTaken, setFrontImageTaken] = useState(false);
  const [backImageTaken, setBackImageTaken] = useState(false);
  
  // Advanced features state
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [checkLimits, setCheckLimits] = useState({
    minAmount: 0.01,
    maxAmount: 10000,
    dailyLimit: 5000,
    monthlyLimit: 20000
  });
  const [dailyDepositedAmount, setDailyDepositedAmount] = useState(0);
  const [checkValidationErrors, setCheckValidationErrors] = useState([]);
  const [checkHistory, setCheckHistory] = useState([]);
  const [endorsementConfirmed, setEndorsementConfirmed] = useState(false);
  const [depositDate, setDepositDate] = useState(new Date());
  const [availabilityDate, setAvailabilityDate] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [emailReceipt, setEmailReceipt] = useState(true);
  const [mobileReceipt, setMobileReceipt] = useState(true);
  const [saveInformation, setSaveInformation] = useState(false);
  
  // Camera access states
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraPermission, setCameraPermission] = useState(true);
  
  // Account data
  const [accounts, setAccounts] = useState([]);
  
  // Refs
  const frontImageRef = useRef(null);
  const backImageRef = useRef(null);
  const frontCameraRef = useRef(null);
  const backCameraRef = useRef(null);
  const amountInputRef = useRef(null);
  
  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load deposit limits
        let limitsData;
        try {
          limitsData = await getDepositLimits();
        } catch (err) {
          console.error("Error fetching deposit limits:", err);
          limitsData = { 
            limits: {
              minAmount: 0.01,
              maxAmount: 10000,
              dailyLimit: 5000,
              monthlyLimit: 20000
            },
            usedToday: 0
          };
        }
        
        // Make sure limits data has the expected structure
        if (!limitsData || !limitsData.limits) {
          limitsData = { 
            limits: {
              minAmount: 0.01,
              maxAmount: 10000,
              dailyLimit: 5000,
              monthlyLimit: 20000
            },
            usedToday: 0
          };
        }
        
        setCheckLimits(limitsData.limits);
        setDailyDepositedAmount(limitsData.usedToday || 0);
        
        if (limitsData.usedToday >= limitsData.limits.dailyLimit) {
          setDailyLimitReached(true);
          setError("You've reached your daily deposit limit. Please try again tomorrow.");
        }
        
        // Load user accounts
        let accountsData;
        try {
          accountsData = await getDepositAccounts();
        } catch (err) {
          console.error("Error fetching deposit accounts:", err);
          accountsData = { accounts: [] };
        }
        
        // Make sure accounts data has the expected structure
        if (!accountsData || !accountsData.accounts) {
          accountsData = { accounts: [] };
        }
        
        setAccounts(accountsData.accounts);
        
        // Set default account if accounts exist
        if (accountsData.accounts && accountsData.accounts.length > 0) {
          setDepositAccount(accountsData.accounts[0]._id); // Using _id to match MongoDB's id format
        }
        
        // Load deposit history
        let historyData;
        try {
          historyData = await getDepositHistory();
        } catch (err) {
          console.error("Error fetching deposit history:", err);
          historyData = { deposits: [] };
        }
        
        // Make sure history data has the expected structure
        if (!historyData || !historyData.deposits) {
          historyData = { deposits: [] };
        }
        
        setCheckHistory(historyData.deposits);
        
        // Calculate availability date and generate reference number
        calculateAvailabilityDate();
        generateReferenceNumber();
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError("Failed to load account information. Please try again later.");
        setLoading(false);
      }
    };
    
    loadInitialData();
    
    // Check camera availability
    checkCameraAvailability();
    
    // Focus on amount input when step 1 is active
    if (step === 1) {
      setTimeout(() => {
        if (amountInputRef.current) {
          amountInputRef.current.focus();
        }
      }, 300);
    }
  }, [step]);

  const checkCameraAvailability = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraPermission(false);
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // If we get here, camera is available and permission granted
      setCameraPermission(true);
      setHasCamera(true);
      
      // Stop the stream since we're just checking availability
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Camera error:", err);
      if (err.name === 'NotFoundError') {
        setHasCamera(false);
      } else if (err.name === 'NotAllowedError') {
        setCameraPermission(false);
      }
    }
  };

  const calculateAvailabilityDate = () => {
    // Calculate when funds will be available (typically next business day)
    const today = new Date();
    let availDate = new Date(today);
    
    // Add one business day (skip weekends)
    availDate.setDate(today.getDate() + 1);
    if (availDate.getDay() === 0) { // Sunday
      availDate.setDate(availDate.getDate() + 1);
    } else if (availDate.getDay() === 6) { // Saturday
      availDate.setDate(availDate.getDate() + 2);
    }
    
    setAvailabilityDate(availDate);
  };

  const generateReferenceNumber = () => {
    // Generate a unique reference number
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setReferenceNumber(`DEP-${timestamp}-${random}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const goBack = () => {
    if (step > 1 && !depositComplete) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const validateAmount = (amount) => {
    const errors = [];
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount)) {
      errors.push("Please enter a valid amount");
    } else {
      if (numAmount < checkLimits.minAmount) {
        errors.push(`Minimum deposit amount is ${formatCurrency(checkLimits.minAmount)}`);
      }
      
      if (numAmount > checkLimits.maxAmount) {
        errors.push(`Maximum deposit amount is ${formatCurrency(checkLimits.maxAmount)}`);
      }
      
      if (numAmount + dailyDepositedAmount > checkLimits.dailyLimit) {
        const remaining = checkLimits.dailyLimit - dailyDepositedAmount;
        errors.push(`This deposit would exceed your daily limit. You can deposit up to ${formatCurrency(remaining > 0 ? remaining : 0)} today.`);
      }
    }
    
    return errors;
  };

  const handleSubmitInformation = (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate amount
    const amountErrors = validateAmount(amount);
    if (amountErrors.length > 0) {
      setError(amountErrors[0]);
      return;
    }
    
    // If daily limit has been reached
    if (dailyLimitReached) {
      setError("You've reached your daily deposit limit. Please try again tomorrow.");
      return;
    }
    
    setStep(2);
  };

  const startCamera = async (side) => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (side === 'front' && frontCameraRef.current) {
        frontCameraRef.current.srcObject = stream;
        frontCameraRef.current.play();
      } else if (side === 'back' && backCameraRef.current) {
        backCameraRef.current.srcObject = stream;
        backCameraRef.current.play();
      }
      
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError') {
        setCameraPermission(false);
        setError("Camera access is required for mobile deposit. Please enable camera access in your browser settings.");
      } else {
        setError("Unable to access camera. Please try again or use another device.");
      }
    }
  };

  const stopCamera = (side) => {
    if (side === 'front' && frontCameraRef.current && frontCameraRef.current.srcObject) {
      frontCameraRef.current.srcObject.getTracks().forEach(track => track.stop());
      frontCameraRef.current.srcObject = null;
    } else if (side === 'back' && backCameraRef.current && backCameraRef.current.srcObject) {
      backCameraRef.current.srcObject.getTracks().forEach(track => track.stop());
      backCameraRef.current.srcObject = null;
    }
  };

  const handleCaptureFront = () => {
    // In a real implementation, you would capture from the video stream
    setFrontImageTaken(true);
    
    // For this implementation, we'll use a canvas to capture from the video stream
    setLoading(true);
    
    try {
      const video = frontCameraRef.current;
      if (video && video.readyState === 4) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob for API submission
        canvas.toBlob((blob) => {
          const imageFile = new File([blob], 'check-front.jpg', { type: 'image/jpeg' });
          setFrontImage(imageFile);
          
          // Display preview
          const imageUrl = URL.createObjectURL(blob);
          if (frontImageRef.current) {
            frontImageRef.current.src = imageUrl;
          }
          
          setLoading(false);
          stopCamera('front');
          validateCheckImage('front');
        }, 'image/jpeg', 0.95);
      } else {
        // Fallback for testing when no real camera capture is possible
        setTimeout(() => {
          setLoading(false);
          if (frontImageRef.current) {
            frontImageRef.current.src = "/Images/check-front-placeholder.png";
            // For testing we don't have a real file, but in production this would be a File object
            setFrontImage("/Images/check-front-placeholder.png");
          }
          stopCamera('front');
          validateCheckImage('front');
        }, 1000);
      }
    } catch (err) {
      console.error("Error capturing image:", err);
      setLoading(false);
      setError("Failed to capture image. Please try again.");
    }
  };

  const handleCaptureBack = () => {
    setBackImageTaken(true);
    setLoading(true);
    
    try {
      const video = backCameraRef.current;
      if (video && video.readyState === 4) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob for API submission
        canvas.toBlob((blob) => {
          const imageFile = new File([blob], 'check-back.jpg', { type: 'image/jpeg' });
          setBackImage(imageFile);
          
          // Display preview
          const imageUrl = URL.createObjectURL(blob);
          if (backImageRef.current) {
            backImageRef.current.src = imageUrl;
          }
          
          setLoading(false);
          stopCamera('back');
          validateCheckImage('back');
        }, 'image/jpeg', 0.95);
      } else {
        // Fallback for testing
        setTimeout(() => {
          setLoading(false);
          if (backImageRef.current) {
            backImageRef.current.src = "/Images/check-back-placeholder.png";
            setBackImage("/Images/check-back-placeholder.png");
          }
          stopCamera('back');
          validateCheckImage('back');
        }, 1000);
      }
    } catch (err) {
      console.error("Error capturing image:", err);
      setLoading(false);
      setError("Failed to capture image. Please try again.");
    }
  };

  const validateCheckImage = (side) => {
    // In a real app, this would be done server-side
    // Here we'll just simulate the check
    const errors = [];
    
    if (side === 'front') {
      // Clear previous errors
      setCheckValidationErrors([]);
      
      // For demo purposes - randomly simulate an issue
      const randomIssue = Math.random();
      if (randomIssue > 0.9) {
        errors.push("Please ensure the check amount is clearly visible");
      }
    } else if (side === 'back') {
      // Check for endorsement - in a real app would use image recognition
      setEndorsementConfirmed(true);
      
      // For demo purposes - randomly simulate an issue
      const randomIssue = Math.random();
      if (randomIssue > 0.9) {
        errors.push("Please ensure the check is endorsed on the back");
        setEndorsementConfirmed(false);
      }
    }
    
    if (errors.length > 0) {
      setCheckValidationErrors(prev => [...prev, ...errors]);
    }
  };

  const clearCheckImage = (side) => {
    if (side === 'front') {
      setFrontImageTaken(false);
      setFrontImage(null);
      if (frontImageRef.current) {
        frontImageRef.current.src = "";
      }
    } else {
      setBackImageTaken(false);
      setBackImage(null);
      if (backImageRef.current) {
        backImageRef.current.src = "";
      }
    }
    
    // Clear validation errors
    setCheckValidationErrors([]);
  };

  const handleReviewDeposit = () => {
    if (!frontImageTaken || !backImageTaken) {
      setError("Please capture both sides of the check");
      return;
    }
    
    if (checkValidationErrors.length > 0) {
      setError("Please fix the image issues before proceeding");
      return;
    }
    
    if (!endorsementConfirmed) {
      setError("Please ensure the check is endorsed on the back");
      return;
    }
    
    setStep(3);
  };

  const handleActivateCamera = (side) => {
    if (side === 'front') {
      startCamera('front');
    } else {
      startCamera('back');
    }
  };

  const confirmDeposit = () => {
    // Final validation before submission
    const amountErrors = validateAmount(amount);
    if (amountErrors.length > 0) {
      setError(amountErrors[0]);
      return false;
    }
    
    if (!frontImageTaken || !backImageTaken) {
      setError("Check images are required");
      return false;
    }
    
    if (!endorsementConfirmed) {
      setError("Please ensure the check is endorsed on the back");
      return false;
    }
    
    return true;
  };

  const handleSubmitDeposit = async () => {
    // Validate deposit one last time
    if (!confirmDeposit()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare deposit data
      const depositData = {
        amount: parseFloat(amount),
        accountId: depositAccount,
        frontImage: frontImage,
        backImage: backImage,
        emailReceipt: emailReceipt,
        mobileReceipt: mobileReceipt,
        saveInformation: saveInformation,
        endorsementConfirmed: endorsementConfirmed,
        referenceNumber: referenceNumber
      };
      
      // Submit deposit to API
      const result = await submitDeposit(depositData);
      
      // Update daily deposited amount
      setDailyDepositedAmount(prev => prev + parseFloat(amount));
      
      // Complete deposit
      setDepositComplete(true);
      setLoading(false);
      
      // If server provided a reference number, use it
      if (result.deposit && result.deposit.referenceNumber) {
        setReferenceNumber(result.deposit.referenceNumber);
      }
      
      // Update availability date if provided
      if (result.deposit && result.deposit.availabilityDate) {
        setAvailabilityDate(new Date(result.deposit.availabilityDate));
      }
      
    } catch (err) {
      console.error("Error submitting deposit:", err);
      setLoading(false);
      setError(err.message || "We encountered an issue processing your deposit. Please try again or contact customer service at 1-800-956-4442.");
    }
  };

  const handleNewDeposit = () => {
    setStep(1);
    setAmount('');
    setFrontImageTaken(false);
    setBackImageTaken(false);
    setDepositComplete(false);
    setFrontImage(null);
    setBackImage(null);
    setEndorsementConfirmed(false);
    setError(null);
    setCheckValidationErrors([]);
    
    if (frontImageRef.current) {
      frontImageRef.current.src = "";
    }
    if (backImageRef.current) {
      backImageRef.current.src = "";
    }
    
    // Generate new reference number
    generateReferenceNumber();
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const goToDepositHistory = () => {
    navigate('/check-deposits');
  };

  const sendSupportRequest = () => {
    navigate('/support', { state: { referenceNumber } });
  };

  return (
    <div className="deposit-check-page">
      <header className="dep0011-page-header">
        <div className="dep0011-back-button" onClick={goBack}>
          <ArrowLeft size={20} /> Back
        </div>
        <div className="dep0011-wells-fargo-branding">
          <div className="dep0011-logo-container">
            <img src="/Images/wells fargo.jpeg" alt="Wells Fargo Logo" className="dep0011-wf-logo" />
          </div>
        </div>
      </header>

      <div className="page-content">
        <div className="page-title-container">
          <h1>Mobile Check Deposit</h1>
          <p className="subtitle">Deposit checks quickly and securely</p>
        </div>

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Processing, please wait...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {dailyLimitReached && !depositComplete && (
          <div className="info-message">
            <p>
              You've reached your daily deposit limit of {formatCurrency(checkLimits.dailyLimit)}.
              Your limit will reset at midnight.
            </p>
          </div>
        )}

        {!depositComplete && (
          <div className="steps-indicator">
            <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Enter Information</div>
            </div>
            <div className="step-connector"></div>
            <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Capture Images</div>
            </div>
            <div className="step-connector"></div>
            <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Review & Submit</div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="step-container">
            <h2>Step 1: Enter Check Information</h2>
            
            <div className="deposit-limits-info">
              <h3>Your Deposit Limits</h3>
              <div className="limits-container">
                <div className="limit-item">
                  <span className="limit-label">Per Check:</span>
                  <span className="limit-value">{formatCurrency(checkLimits.maxAmount)}</span>
                </div>
                <div className="limit-item">
                  <span className="limit-label">Daily:</span>
                  <span className="limit-value">{formatCurrency(checkLimits.dailyLimit)}</span>
                </div>
                <div className="limit-item">
                  <span className="limit-label">Used Today:</span>
                  <span className="limit-value">{formatCurrency(dailyDepositedAmount)}</span>
                </div>
                <div className="limit-item">
                  <span className="limit-label">Available Today:</span>
                  <span className="limit-value">{formatCurrency(Math.max(checkLimits.dailyLimit - dailyDepositedAmount, 0))}</span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmitInformation} className="deposit-form">
              <div className="form-group">
                <label htmlFor="deposit-account">Deposit To:</label>
                <select 
                  id="deposit-account" 
                  value={depositAccount}
                  onChange={(e) => setDepositAccount(e.target.value)}
                  className="form-select"
                >
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {account.number} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="check-amount">Check Amount:</label>
                <div className="amount-input-container">
                  <span className="currency-symbol">$</span>
                  <input 
                    type="number" 
                    id="check-amount" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                    className="amount-input"
                    ref={amountInputRef}
                  />
                </div>
              </div>
              
              <div className="form-group receipt-options">
                <label>Receipt Options:</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="email-receipt"
                    checked={emailReceipt}
                    onChange={(e) => setEmailReceipt(e.target.checked)}
                  />
                  <label htmlFor="email-receipt">Email receipt to {currentUser?.email || "your email"}</label>
                </div>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="mobile-receipt"
                    checked={mobileReceipt}
                    onChange={(e) => setMobileReceipt(e.target.checked)}
                  />
                  <label htmlFor="mobile-receipt">Mobile receipt to {currentUser?.phone || "your phone"}</label>
                </div>
              </div>
              
              <div className="form-group">
  <div className="checkbox-group">
    <input
      type="checkbox"
      id="save-information"
      checked={saveInformation}
      onChange={(e) => setSaveInformation(e.target.checked)}
    />
    <label htmlFor="save-information">Save this information for future deposits</label>
  </div>
</div>

<div className="form-actions">
  <button 
    type="submit" 
    className="primary-button"
    disabled={loading || dailyLimitReached}
  >
    Continue to Check Capture
  </button>
</div>
</form>
</div>
)}

{step === 2 && (
<div className="step-container">
  <h2>Step 2: Capture Check Images</h2>
  
  {!hasCamera && (
    <div className="warning-message">
      <AlertTriangle size={18} />
      <p>No camera detected on your device. Please use a device with a camera to deposit checks.</p>
    </div>
  )}
  
  {!cameraPermission && (
    <div className="warning-message">
      <AlertTriangle size={18} />
      <p>Camera access is required for mobile deposit. Please enable camera access in your browser settings.</p>
    </div>
  )}
  
  <div className="capture-instructions">
    <h3>Important Tips:</h3>
    <ul>
      <li>Place check on dark background</li>
      <li>Ensure good lighting</li>
      <li>Make sure all four corners are visible</li>
      <li>Ensure amount is clearly visible</li>
      <li>Endorse the back with "For mobile deposit only"</li>
    </ul>
  </div>
  
  <div className="check-capture-container">
    <div className="check-side">
      <h3>Front of Check</h3>
      
      {!frontImageTaken ? (
        <div className="camera-container">
          <video 
            ref={frontCameraRef} 
            className="camera-view" 
            autoPlay 
            playsInline
          ></video>
          <button 
            className="camera-button"
            onClick={() => handleActivateCamera('front')}
            disabled={!hasCamera || !cameraPermission}
          >
            <Camera size={24} />
            <span>Activate Camera</span>
          </button>
          <button 
            className="capture-button"
            onClick={handleCaptureFront}
            disabled={!frontCameraRef.current?.srcObject}
          >
            Capture Front
          </button>
        </div>
      ) : (
        <div className="image-preview-container">
          <img 
            ref={frontImageRef} 
            className="check-image-preview" 
            alt="Front of check" 
          />
          <button 
            className="retake-button"
            onClick={() => clearCheckImage('front')}
          >
            <RotateCcw size={16} />
            <span>Retake</span>
          </button>
        </div>
      )}
    </div>
    
    <div className="check-side">
      <h3>Back of Check</h3>
      
      {!backImageTaken ? (
        <div className="camera-container">
          <video 
            ref={backCameraRef} 
            className="camera-view" 
            autoPlay 
            playsInline
          ></video>
          <button 
            className="camera-button"
            onClick={() => handleActivateCamera('back')}
            disabled={!hasCamera || !cameraPermission}
          >
            <Camera size={24} />
            <span>Activate Camera</span>
          </button>
          <button 
            className="capture-button"
            onClick={handleCaptureBack}
            disabled={!backCameraRef.current?.srcObject}
          >
            Capture Back
          </button>
        </div>
      ) : (
        <div className="image-preview-container">
          <img 
            ref={backImageRef} 
            className="check-image-preview" 
            alt="Back of check" 
          />
          <button 
            className="retake-button"
            onClick={() => clearCheckImage('back')}
          >
            <RotateCcw size={16} />
            <span>Retake</span>
          </button>
        </div>
      )}
    </div>
  </div>
  
  {checkValidationErrors.length > 0 && (
    <div className="validation-errors">
      <h3>Please fix the following issues:</h3>
      <ul>
        {checkValidationErrors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  )}
  
  <div className="endorsement-reminder">
    <p>
      Remember to endorse the back of your check with "For mobile deposit only" 
      and your signature before capturing the back image.
    </p>
  </div>
  
  <div className="form-actions">
    <button 
      className="secondary-button"
      onClick={() => setStep(1)}
      disabled={loading}
    >
      Back
    </button>
    <button 
      className="primary-button"
      onClick={handleReviewDeposit}
      disabled={loading || !frontImageTaken || !backImageTaken}
    >
      Review Deposit
    </button>
  </div>
</div>
)}

{step === 3 && (
<div className="step-container">
  <h2>Step 3: Review & Submit</h2>
  
  <div className="review-container">
    <div className="review-section">
      <h3>Deposit Details</h3>
      <div className="review-item">
        <span className="review-label">Amount:</span>
        <span className="review-value">{formatCurrency(parseFloat(amount) || 0)}</span>
      </div>
      <div className="review-item">
        <span className="review-label">Deposit To:</span>
        <span className="review-value">
          {accounts.find(acc => acc.id === depositAccount)?.name || ''} - 
          {accounts.find(acc => acc.id === depositAccount)?.number || ''}
        </span>
      </div>
      <div className="review-item">
        <span className="review-label">Deposit Date:</span>
        <span className="review-value">{formatDate(depositDate)}</span>
      </div>
      <div className="review-item">
        <span className="review-label">Funds Available By:</span>
        <span className="review-value">{formatDate(availabilityDate)}</span>
      </div>
    </div>
    
    <div className="review-section">
      <h3>Check Images</h3>
      <div className="check-images-review">
        <div className="check-image-container">
          <h4>Front of Check</h4>
          <img 
            src={frontImageRef.current?.src || ""} 
            alt="Front of check" 
            className="check-review-image" 
          />
        </div>
        <div className="check-image-container">
          <h4>Back of Check</h4>
          <img 
            src={backImageRef.current?.src || ""} 
            alt="Back of check" 
            className="check-review-image" 
          />
        </div>
      </div>
    </div>
    
    <div className="terms-and-conditions">
      <div className="checkbox-group">
        <input
          type="checkbox"
          id="agree-terms"
          checked={true}
          readOnly
        />
        <label htmlFor="agree-terms">
          I agree to the <a href="/terms" target="_blank">Terms & Conditions</a> for 
          mobile check deposits.
        </label>
      </div>
      <p className="terms-summary">
        By submitting this deposit, you confirm that this is a valid check made payable 
        to you, that it has not been altered, and that it has not been previously deposited.
      </p>
    </div>
  </div>
  
  <div className="form-actions">
    <button 
      className="secondary-button"
      onClick={() => setStep(2)}
      disabled={loading}
    >
      Back
    </button>
    <button 
      className="primary-button"
      onClick={handleSubmitDeposit}
      disabled={loading}
    >
      Submit Deposit
    </button>
  </div>
</div>
)}

{depositComplete && (
<div className="deposit-success">
  <div className="success-icon">
    <CheckCircle size={64} color="#00A86B" />
  </div>
  <h2>Deposit Successful!</h2>
  
  <div className="success-details">
    <div className="success-item">
      <span className="success-label">Amount:</span>
      <span className="success-value">{formatCurrency(parseFloat(amount))}</span>
    </div>
    <div className="success-item">
      <span className="success-label">Account:</span>
      <span className="success-value">
        {accounts.find(acc => acc.id === depositAccount)?.name || ''}
      </span>
    </div>
    <div className="success-item">
      <span className="success-label">Reference Number:</span>
      <span className="success-value">{referenceNumber}</span>
    </div>
    <div className="success-item">
      <span className="success-label">Submitted On:</span>
      <span className="success-value">{formatDate(depositDate)}</span>
    </div>
    <div className="success-item">
      <span className="success-label">Funds Available By:</span>
      <span className="success-value">{formatDate(availabilityDate)}</span>
    </div>
  </div>
  
  <div className="funds-availability-notice">
    <h3>Funds Availability</h3>
    <p>
      The first $225 of your deposit will be available on {formatDate(depositDate)}. 
      The remaining amount will be available by {formatDate(availabilityDate)}.
    </p>
  </div>
  
  <div className="success-actions">
    <button 
      className="primary-button"
      onClick={handleNewDeposit}
    >
      <DollarSign size={18} />
      Deposit Another Check
    </button>
    <button 
      className="secondary-button"
      onClick={goToDepositHistory}
    >
      View Deposit History
    </button>
    <button 
      className="secondary-button"
      onClick={goToDashboard}
    >
      Return to Dashboard
    </button>
  </div>
  
  <div className="support-info">
    <p>
      If you have questions about this deposit, please contact customer service 
      at 1-800-956-4442 or <a onClick={sendSupportRequest}>submit a support request</a>.
    </p>
  </div>
</div>
)}

</div>
</div>
  );
};

export default DepositCheckPage;