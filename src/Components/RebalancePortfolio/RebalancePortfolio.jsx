import React, { useState, useEffect } from 'react';
import './RebalancePortfolio.css';

const RebalancePortfolio = () => {
  const [portfolioData, setPortfolioData] = useState({
    currentAllocation: [
      { category: 'Stocks', percentage: 55, amount: 38500 },
      { category: 'Bonds', percentage: 30, amount: 21000 },
      { category: 'Cash', percentage: 10, amount: 7000 },
      { category: 'Alternative Investments', percentage: 5, amount: 3500 }
    ],
    targetAllocation: [
      { category: 'Stocks', percentage: 60, amount: 42000 },
      { category: 'Bonds', percentage: 25, amount: 17500 },
      { category: 'Cash', percentage: 5, amount: 3500 },
      { category: 'Alternative Investments', percentage: 10, amount: 7000 }
    ],
    totalValue: 70000,
    lastRebalanced: '02/15/2025'
  });

  const [sliders, setSliders] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    // Initialize sliders with target allocation values
    const initialSliders = {};
    portfolioData.targetAllocation.forEach(asset => {
      initialSliders[asset.category] = asset.percentage;
    });
    setSliders(initialSliders);
  }, [portfolioData.targetAllocation]);

  const handleSliderChange = (category, value) => {
    setSliders({
      ...sliders,
      [category]: value
    });
  };

  const calculateTotalPercentage = () => {
    return Object.values(sliders).reduce((total, value) => total + value, 0);
  };

  const goToDashboard = () => {
    // Navigation logic would go here
    console.log('Navigating back to dashboard');
  };

  const handleRebalance = () => {
    setShowConfirmation(true);
  };

  const confirmRebalance = () => {
    // Here you would implement the actual rebalance logic
    // For this example, we'll just close the confirmation dialog
    setShowConfirmation(false);
    
    // Mock update to show changes would be applied
    const newTargetAllocation = portfolioData.targetAllocation.map(item => {
      return {
        ...item,
        percentage: sliders[item.category],
        amount: (sliders[item.category] / 100) * portfolioData.totalValue
      };
    });
    
    setPortfolioData({
      ...portfolioData,
      targetAllocation: newTargetAllocation,
      lastRebalanced: new Date().toLocaleDateString()
    });
  };

  const cancelRebalance = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="reb0100-container">
      <header className="reb0100-account-page-header">
        <div className="reb0100-back-button" onClick={goToDashboard}>
          <span className="reb0100-back-arrow">&#8592;</span> Back to Accounts
        </div>
        <div className="reb0100-wells-fargo-branding">
          <div className="reb0100-logo-container">
            <img src="/Images/wells fargo.jpeg" alt="Wells Fargo Logo" className="reb0100-wf-logo" />
          </div>
        </div>
      </header>

      <main className="reb0100-main-content">
        <h1 className="reb0100-page-title">Rebalance Your Portfolio</h1>
        
        <div className="reb0100-portfolio-summary">
          <div className="reb0100-summary-header">
            <h2>Portfolio Summary</h2>
            <div className="reb0100-total-value">
              <span>Total Value:</span> ${portfolioData.totalValue.toLocaleString()}
            </div>
            <div className="reb0100-last-rebalanced">
              <span>Last Rebalanced:</span> {portfolioData.lastRebalanced}
            </div>
          </div>
          
          <div className="reb0100-allocation-comparison">
            <div className="reb0100-current-allocation">
              <h3>Current Allocation</h3>
              <div className="reb0100-allocation-chart">
                {portfolioData.currentAllocation.map((asset, index) => (
                  <div 
                    key={index} 
                    className="reb0100-allocation-bar"
                    style={{ 
                      width: `${asset.percentage}%`,
                      backgroundColor: getAssetColor(asset.category)
                    }}
                    title={`${asset.category}: ${asset.percentage}%`}
                  ></div>
                ))}
              </div>
              <div className="reb0100-allocation-details">
                {portfolioData.currentAllocation.map((asset, index) => (
                  <div key={index} className="reb0100-asset-item">
                    <div className="reb0100-asset-color" style={{ backgroundColor: getAssetColor(asset.category) }}></div>
                    <div className="reb0100-asset-info">
                      <div className="reb0100-asset-name">{asset.category}</div>
                      <div className="reb0100-asset-value">${asset.amount.toLocaleString()} ({asset.percentage}%)</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="reb0100-target-allocation">
              <h3>Target Allocation</h3>
              <div className="reb0100-allocation-chart">
                {portfolioData.targetAllocation.map((asset, index) => (
                  <div 
                    key={index} 
                    className="reb0100-allocation-bar"
                    style={{ 
                      width: `${asset.percentage}%`,
                      backgroundColor: getAssetColor(asset.category)
                    }}
                    title={`${asset.category}: ${asset.percentage}%`}
                  ></div>
                ))}
              </div>
              <div className="reb0100-allocation-details">
                {portfolioData.targetAllocation.map((asset, index) => (
                  <div key={index} className="reb0100-asset-item">
                    <div className="reb0100-asset-color" style={{ backgroundColor: getAssetColor(asset.category) }}></div>
                    <div className="reb0100-asset-info">
                      <div className="reb0100-asset-name">{asset.category}</div>
                      <div className="reb0100-asset-value">${asset.amount.toLocaleString()} ({asset.percentage}%)</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="reb0100-rebalance-section">
          <h2>Adjust Target Allocation</h2>
          <p className="reb0100-rebalance-info">
            Move the sliders to adjust your target allocation. 
            The total allocation must equal 100%.
          </p>
          
          <div className="reb0100-total-percentage">
            <span>Total:</span> 
            <span className={calculateTotalPercentage() === 100 ? "reb0100-total-valid" : "reb0100-total-invalid"}>
              {calculateTotalPercentage()}%
            </span>
          </div>
          
          <div className="reb0100-sliders-container">
            {portfolioData.targetAllocation.map((asset, index) => (
              <div key={index} className="reb0100-slider-group">
                <div className="reb0100-slider-header">
                  <label htmlFor={`slider-${asset.category}`}>
                    {asset.category}
                  </label>
                  <span className="reb0100-slider-value">
                    {sliders[asset.category] || 0}%
                  </span>
                </div>
                <input
                  type="range"
                  id={`slider-${asset.category}`}
                  min="0"
                  max="100"
                  value={sliders[asset.category] || 0}
                  onChange={(e) => handleSliderChange(asset.category, parseInt(e.target.value))}
                  className="reb0100-slider"
                />
              </div>
            ))}
          </div>
          
          <div className="reb0100-actions">
            <button 
              className="reb0100-rebalance-button" 
              onClick={handleRebalance}
              disabled={calculateTotalPercentage() !== 100}
            >
              Rebalance Portfolio
            </button>
          </div>
        </div>
        
        {showConfirmation && (
          <div className="reb0100-confirmation-overlay">
            <div className="reb0100-confirmation-modal">
              <h2>Confirm Portfolio Rebalance</h2>
              <p>Are you sure you want to rebalance your portfolio with the following allocation?</p>
              
              <div className="reb0100-confirmation-details">
                {Object.entries(sliders).map(([category, percentage], index) => (
                  <div key={index} className="reb0100-confirm-item">
                    <span>{category}:</span> 
                    <span>{percentage}%</span>
                  </div>
                ))}
              </div>
              
              <div className="reb0100-confirmation-actions">
                <button className="reb0100-cancel-button" onClick={cancelRebalance}>
                  Cancel
                </button>
                <button className="reb0100-confirm-button" onClick={confirmRebalance}>
                  Confirm Rebalance
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="reb0100-footer">
        <p>© 2025 Wells Fargo. All rights reserved.</p>
        <p>For assistance, call 1-800-956-4442</p>
      </footer>
    </div>
  );
};

// Helper function to get colors for different asset categories
function getAssetColor(category) {
  const colorMap = {
    'Stocks': '#CD1309',
    'Bonds': '#E2A400',
    'Cash': '#D4B78F',
    'Alternative Investments': '#FFCD00'
  };
  return colorMap[category] || '#CCCCCC';
}

export default RebalancePortfolio;