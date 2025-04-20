import React, { useEffect, useState } from 'react';
import './Preloading.css'; // Make sure to create this CSS file

const WellsFargoPreloader = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time - replace with your actual loading logic
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`preloader-container ${loading ? 'visible' : 'hidden'}`}>
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
    </div>
  );
};

export default WellsFargoPreloader;