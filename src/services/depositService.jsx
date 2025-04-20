import axios from 'axios';
import { getAuthToken } from '../utils/auth';

// Create an axios instance with authentication
const API = axios.create({
  baseURL: '/api/check-deposits', // Updated to match backend route
  withCredentials: true
});

// Request interceptor to add auth token to every request
API.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get deposit limits for the current user
export const getDepositLimits = async () => {
  try {
    const response = await API.get('/limits');
    return response.data;
  } catch (error) {
    console.error('Error fetching deposit limits:', error);
    throw error.response?.data || { message: 'Failed to fetch deposit limits' };
  }
};

// Get accounts available for deposits
export const getDepositAccounts = async () => {
  try {
    const response = await API.get('/accounts');
    return response.data;
  } catch (error) {
    console.error('Error fetching deposit accounts:', error);
    throw error.response?.data || { message: 'Failed to fetch accounts' };
  }
};

// Get deposit history with pagination support
export const getDepositHistory = async (page = 1, limit = 10) => {
  try {
    const response = await API.get('/history', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching deposit history:', error);
    throw error.response?.data || { message: 'Failed to fetch deposit history' };
  }
};

// Submit a new deposit
export const submitDeposit = async (depositData) => {
  try {
    // Create FormData to handle file uploads
    const formData = new FormData();
    
    // Add form fields
    formData.append('amount', depositData.amount);
    formData.append('accountId', depositData.accountId);
    
    if (depositData.emailReceipt !== undefined) {
      formData.append('emailReceipt', depositData.emailReceipt);
    }
    
    if (depositData.mobileReceipt !== undefined) {
      formData.append('mobileReceipt', depositData.mobileReceipt);
    }
    
    if (depositData.endorsementConfirmed !== undefined) {
      formData.append('endorsementConfirmed', depositData.endorsementConfirmed);
    }
    
    // Add reference number if provided
    if (depositData.referenceNumber) {
      formData.append('referenceNumber', depositData.referenceNumber);
    }
    
    // Handle image files
    if (depositData.frontImage) {
      // If it's already a File/Blob object
      if (depositData.frontImage instanceof Blob || depositData.frontImage instanceof File) {
        formData.append('frontImage', depositData.frontImage, 'front-image.jpg');
      } 
      // If it's a string URL (for testing)
      else if (typeof depositData.frontImage === 'string' && !depositData.frontImage.startsWith('data:')) {
        try {
          const response = await fetch(depositData.frontImage);
          const blob = await response.blob();
          formData.append('frontImage', blob, 'front-image.jpg');
        } catch (err) {
          console.error('Error converting front image URL to blob:', err);
          throw new Error('Failed to process front image');
        }
      }
      // If it's a base64 string
      else if (typeof depositData.frontImage === 'string') {
        formData.append('frontImage', dataURLtoBlob(depositData.frontImage), 'front-image.jpg');
      }
    }
    
    if (depositData.backImage) {
      // If it's already a File/Blob object
      if (depositData.backImage instanceof Blob || depositData.backImage instanceof File) {
        formData.append('backImage', depositData.backImage, 'back-image.jpg');
      } 
      // If it's a string URL (for testing)
      else if (typeof depositData.backImage === 'string' && !depositData.backImage.startsWith('data:')) {
        try {
          const response = await fetch(depositData.backImage);
          const blob = await response.blob();
          formData.append('backImage', blob, 'back-image.jpg');
        } catch (err) {
          console.error('Error converting back image URL to blob:', err);
          throw new Error('Failed to process back image');
        }
      }
      // If it's a base64 string
      else if (typeof depositData.backImage === 'string') {
        formData.append('backImage', dataURLtoBlob(depositData.backImage), 'back-image.jpg');
      }
    }
    
    // Submit form data - Adjusted to match backend route
    const response = await API.post('/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error submitting deposit:', error);
    throw error.response?.data || { message: 'Failed to submit deposit' };
  }
};

// Get details for a specific deposit by ID
export const getDepositDetails = async (depositId) => {
  try {
    const response = await API.get(`/${depositId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching deposit details:', error);
    throw error.response?.data || { message: 'Failed to fetch deposit details' };
  }
};

// Cancel a pending deposit
export const cancelDeposit = async (depositId) => {
  try {
    const response = await API.delete(`/${depositId}`);
    return response.data;
  } catch (error) {
    console.error('Error canceling deposit:', error);
    throw error.response?.data || { message: 'Failed to cancel deposit' };
  }
};

// Helper function to convert data URL to Blob
const dataURLtoBlob = (dataURL) => {
  // Convert base64/URLEncoded data component to raw binary data
  let byteString;
  if (dataURL.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(dataURL.split(',')[1]);
  } else {
    byteString = unescape(dataURL.split(',')[1]);
  }
  
  // Extract content type
  const mimeType = dataURL.split(',')[0].split(':')[1].split(';')[0];
  
  // Create a typed array from the binary string
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ia], { type: mimeType });
};