import React, { useEffect, useState } from 'react';
import './Preloading.css';

const WellsFargoPreloader = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time - replace with your actual loading logic
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Don't render anything if not loading
  if (!loading) return null;

  return (
    <div className={`preloader-container ${loading ? 'visible' : 'hidden'}`}>
      <div className="preloader-content">
        <div className="loader-wrapper">
          {/* Circular loader animation */}
          <div className="circular-track">
            <div className="circular-loader"></div>
          </div>
          
          {/* Wells Fargo logo centered in the circle */}
          <div className="logo-circle">
            <img 
              src="/Images/wells fargo.jpeg" 
              alt="Wells Fargo Logo" 
              className="wells-fargo-logo" 
            />
          </div>
        </div>
        
        <h1 className="wf-title">Wells Fargo</h1>
        <p className="loading-text">Loading your account information...</p>
        
        {/* Progress dots animation */}
        <div className="loading-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
};

export default WellsFargoPreloader;