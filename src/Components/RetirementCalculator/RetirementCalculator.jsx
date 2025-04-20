import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './RetirementCalculator.css';

const RetirementCalculator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [account, setAccount] = useState(location.state?.account || null);
  
  // Form state
  const [currentAge, setCurrentAge] = useState(35);
  const [retirementAge, setRetirementAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [currentSavings, setCurrentSavings] = useState(account?.balance || 125000);
  const [currentIncome, setCurrentIncome] = useState(85000);
  const [annualContribution, setAnnualContribution] = useState(12000);
  const [expectedReturnRate, setExpectedReturnRate] = useState(7);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [incomeNeeded, setIncomeNeeded] = useState(75);
  const [socialSecurity, setSocialSecurity] = useState(24000);
  const [otherIncome, setOtherIncome] = useState(0);
  
  // Results state
  const [retirementResults, setRetirementResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedTab, setSelectedTab] = useState('inputs');
  
  useEffect(() => {
    // If we navigate back to results tab, recalculate
    if (selectedTab === 'results' && !showResults) {
      calculateRetirement();
    }
  }, [selectedTab]);
  
  const calculateRetirement = () => {
    // Years until retirement
    const yearsToRetirement = retirementAge - currentAge;
    
    // Years in retirement
    const yearsInRetirement = lifeExpectancy - retirementAge;
    
    // Calculate future value of current savings at retirement
    const futureValueCurrentSavings = currentSavings * Math.pow(1 + (expectedReturnRate / 100), yearsToRetirement);
    
    // Calculate future value of annual contributions
    let futureValueContributions = 0;
    for (let i = 0; i < yearsToRetirement; i++) {
      futureValueContributions += annualContribution * Math.pow(1 + (expectedReturnRate / 100), i);
    }
    
    // Total savings at retirement
    const totalRetirementSavings = futureValueCurrentSavings + futureValueContributions;
    
    // Calculate annual income needed in retirement (adjusted for inflation)
    const inflationFactor = Math.pow(1 + (inflationRate / 100), yearsToRetirement);
    const futureAnnualIncome = currentIncome * inflationFactor;
    const annualIncomeNeeded = (futureAnnualIncome * (incomeNeeded / 100));
    
    // Annual income from other sources (adjusted for inflation)
    const futureSocialSecurity = socialSecurity * inflationFactor;
    const futureOtherIncome = otherIncome * inflationFactor;
    
    // Annual income needed from savings
    const annualIncomeFromSavings = annualIncomeNeeded - futureSocialSecurity - futureOtherIncome;
    
    // Calculate how long savings will last
    // Using 4% withdrawal rule as a baseline
    const safeWithdrawalRate = 4;
    const safeAnnualWithdrawal = totalRetirementSavings * (safeWithdrawalRate / 100);
    
    // Shortfall or surplus
    const annualSurplusOrShortfall = safeAnnualWithdrawal - annualIncomeFromSavings;
    
    // If maintaining desired withdrawal rate, how many years will savings last?
    let savingsDepletion = 0;
    if (annualIncomeFromSavings > 0) {
      // Simple calculation assuming constant return during retirement
      const realReturnRate = (expectedReturnRate - inflationRate) / 100;
      if (annualIncomeFromSavings < totalRetirementSavings * realReturnRate) {
        savingsDepletion = Infinity; // Savings will never run out
      } else {
        savingsDepletion = Math.log(1 - (totalRetirementSavings * realReturnRate / annualIncomeFromSavings)) / 
                          Math.log(1 + realReturnRate) * -1;
      }
    }
    
    // Generate chart data for growth projection
    const projectionData = [];
    let runningTotal = currentSavings;
    
    // Pre-retirement projection (accumulation phase)
    for (let year = 0; year <= yearsToRetirement; year++) {
      const age = currentAge + year;
      if (year > 0) {
        runningTotal = runningTotal * (1 + expectedReturnRate / 100) + annualContribution;
      }
      projectionData.push({
        age,
        year,
        savings: Math.round(runningTotal),
        phase: 'accumulation'
      });
    }
    
    // Retirement projection (distribution phase)
    const maxYearsToProject = yearsInRetirement;
    const retirementRunningTotal = runningTotal;
    
    for (let year = 1; year <= maxYearsToProject; year++) {
      const age = retirementAge + year;
      const withdrawalThisYear = annualIncomeFromSavings * Math.pow(1 + (inflationRate / 100), year - 1);
      
      runningTotal = Math.max(0, runningTotal * (1 + expectedReturnRate / 100) - withdrawalThisYear);
      
      projectionData.push({
        age,
        year: yearsToRetirement + year,
        savings: Math.round(runningTotal),
        phase: 'distribution'
      });
      
      // Stop projection if savings are depleted
      if (runningTotal <= 0) break;
    }

    // Calculate recommended changes if there's a shortfall
    let recommendedChanges = null;
    if (annualSurplusOrShortfall < 0) {
      // Calculate how much more to save annually
      const additionalAnnualSavingsNeeded = Math.abs(annualSurplusOrShortfall) / 
        (Math.pow(1 + (expectedReturnRate / 100), yearsToRetirement) - 1) * 
        (expectedReturnRate / 100);
      
      // Calculate how many more years to work
      let additionalYearsToWork = 0;
      let tempSavings = totalRetirementSavings;
      while (tempSavings * (safeWithdrawalRate / 100) < annualIncomeFromSavings && additionalYearsToWork < 20) {
        tempSavings = tempSavings * (1 + expectedReturnRate / 100) + annualContribution;
        additionalYearsToWork++;
      }
      
      // Calculate retirement lifestyle adjustment
      const adjustedIncomePercentage = (safeAnnualWithdrawal + futureSocialSecurity + futureOtherIncome) / 
        futureAnnualIncome * 100;
      
      recommendedChanges = {
        additionalAnnualSavingsNeeded: Math.round(additionalAnnualSavingsNeeded),
        newTotalAnnualContribution: Math.round(annualContribution + additionalAnnualSavingsNeeded),
        additionalYearsToWork,
        newRetirementAge: retirementAge + additionalYearsToWork,
        adjustedIncomePercentage: Math.round(adjustedIncomePercentage)
      };
    }
    
    setRetirementResults({
      yearsToRetirement,
      yearsInRetirement,
      totalRetirementSavings: Math.round(totalRetirementSavings),
      annualIncomeNeeded: Math.round(annualIncomeNeeded),
      annualIncomeFromSavings: Math.round(annualIncomeFromSavings),
      safeAnnualWithdrawal: Math.round(safeAnnualWithdrawal),
      annualSurplusOrShortfall: Math.round(annualSurplusOrShortfall),
      savingsDepletion: savingsDepletion === Infinity ? "Never" : Math.round(savingsDepletion),
      savingsLastUntilAge: savingsDepletion === Infinity ? "Lifetime" : Math.round(retirementAge + savingsDepletion),
      futureSocialSecurity: Math.round(futureSocialSecurity),
      futureOtherIncome: Math.round(futureOtherIncome),
      projectionData,
      retirementIncome: {
        fromSavings: Math.round(annualIncomeFromSavings),
        fromSocialSecurity: Math.round(futureSocialSecurity),
        fromOther: Math.round(futureOtherIncome),
        total: Math.round(annualIncomeFromSavings + futureSocialSecurity + futureOtherIncome)
      },
      recommendedChanges
    });
    
    setShowResults(true);
    setSelectedTab('results');
  };
  
  const resetCalculator = () => {
    setCurrentAge(35);
    setRetirementAge(65);
    setLifeExpectancy(90);
    setCurrentSavings(account?.balance || 125000);
    setCurrentIncome(85000);
    setAnnualContribution(12000);
    setExpectedReturnRate(7);
    setInflationRate(2.5);
    setIncomeNeeded(75);
    setSocialSecurity(24000);
    setOtherIncome(0);
    setRetirementResults(null);
    setShowResults(false);
    setSelectedTab('inputs');
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  
  const goBack = () => {
    navigate(-1);
  };
  
  // Function to render the savings growth chart
  const renderSavingsChart = (data) => {
    if (!data || data.length === 0) return null;
    
    const maxSavings = Math.max(...data.map(d => d.savings));
    const maxAge = data[data.length - 1].age;
    const startAge = data[0].age;
    
    return (
      <div className="retir0211-chart-container">
        <div className="retir0211-chart-labels">
          <div className="retir0211-chart-y-axis">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="retir0211-chart-y-label">
                {formatCurrency(maxSavings * (4 - i) / 4)}
              </div>
            ))}
          </div>
        </div>
        <div className="retir0211-chart">
          {data.map((point, index) => {
            const heightPercentage = (point.savings / maxSavings) * 100;
            const widthPercentage = 100 / data.length;
            
            return (
              <div 
                key={index} 
                className={`retir0211-chart-bar ${point.phase === 'distribution' ? 'retir0211-distribution' : 'retir0211-accumulation'}`}
                style={{ 
                  height: `${heightPercentage}%`, 
                  width: `${widthPercentage}%` 
                }}
                title={`Age: ${point.age} - Savings: ${formatCurrency(point.savings)}`}
              >
                {index % Math.floor(data.length / 5) === 0 || index === data.length - 1 ? (
                  <div className="retir0211-chart-x-label">{point.age}</div>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="retir0211-chart-legend">
          <div className="retir0211-legend-item">
            <div className="retir0211-legend-color retir0211-accumulation"></div>
            <span>Accumulation Phase</span>
          </div>
          <div className="retir0211-legend-item">
            <div className="retir0211-legend-color retir0211-distribution"></div>
            <span>Distribution Phase</span>
          </div>
        </div>
      </div>
    );
  };
  
  // Function to render the retirement income pie chart
  const renderIncomeChart = (incomeData) => {
    if (!incomeData) return null;
    
    const total = incomeData.fromSavings + incomeData.fromSocialSecurity + incomeData.fromOther;
    const savingsPercent = (incomeData.fromSavings / total) * 100;
    const socialSecurityPercent = (incomeData.fromSocialSecurity / total) * 100;
    const otherPercent = (incomeData.fromOther / total) * 100;
    
    return (
      <div className="retir0211-pie-chart-container">
        <div className="retir0211-pie-chart">
          <div className="retir0211-pie" style={{
            background: `conic-gradient(
              #CD1309 0% ${savingsPercent}%, 
              #FFCD11 ${savingsPercent}% ${savingsPercent + socialSecurityPercent}%, 
              #E2E3E4 ${savingsPercent + socialSecurityPercent}% 100%
            )`
          }}></div>
        </div>
        <div className="retir0211-pie-legend">
          <div className="retir0211-legend-item">
            <div className="retir0211-legend-color" style={{ backgroundColor: '#CD1309' }}></div>
            <span>Retirement Savings: {formatCurrency(incomeData.fromSavings)} ({Math.round(savingsPercent)}%)</span>
          </div>
          <div className="retir0211-legend-item">
            <div className="retir0211-legend-color" style={{ backgroundColor: '#FFCD11' }}></div>
            <span>Social Security: {formatCurrency(incomeData.fromSocialSecurity)} ({Math.round(socialSecurityPercent)}%)</span>
          </div>
          <div className="retir0211-legend-item">
            <div className="retir0211-legend-color" style={{ backgroundColor: '#E2E3E4' }}></div>
            <span>Other Income: {formatCurrency(incomeData.fromOther)} ({Math.round(otherPercent)}%)</span>
          </div>
          <div className="retir0211-legend-total">
            <span>Total Annual Income: {formatCurrency(incomeData.total)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="retir0211-retirement-calculator-page">
      <header className="retir0211-account-page-header">
        <div className="retir0211-back-button" onClick={goBack}>
          <span className="retir0211-back-arrow">&#8592;</span> Back
        </div>
        <div className="retir0211-wells-fargo-branding">
          <div className="retir0211-logo-container">
            <img src="/Images/wells fargo.jpeg" alt="Wells Fargo Logo" className="retir0211-wf-logo" />
          </div>
        </div>
      </header>

      <div className="retir0211-calculator-container">
        <div className="retir0211-calculator-header">
          <h1>Retirement Calculator</h1>
          <p>Plan your retirement needs and savings goals to ensure financial security in your golden years.</p>
        </div>
        
        <div className="retir0211-calculator-tabs">
          <button 
            className={`retir0211-tab-button ${selectedTab === 'inputs' ? 'retir0211-active' : ''}`}
            onClick={() => setSelectedTab('inputs')}
          >
            Plan Inputs
          </button>
          <button 
            className={`retir0211-tab-button ${selectedTab === 'results' ? 'retir0211-active' : ''}`}
            onClick={() => selectedTab === 'results' || calculateRetirement()}
            disabled={!showResults && selectedTab !== 'inputs'}
          >
            Results & Projections
          </button>
        </div>
        
        {selectedTab === 'inputs' && (
          <div className="retir0211-calculator-form">
            <div className="retir0211-form-section">
              <h2>Personal Information</h2>
              <div className="retir0211-form-row">
                <div className="retir0211-form-group">
                  <label htmlFor="currentAge">Current Age</label>
                  <input 
                    type="number" 
                    id="currentAge" 
                    value={currentAge} 
                    onChange={(e) => setCurrentAge(parseInt(e.target.value) || 0)}
                    className="retir0211-form-input"
                    min="18"
                    max="100"
                  />
                </div>
                <div className="retir0211-form-group">
                  <label htmlFor="retirementAge">Retirement Age</label>
                  <input 
                    type="number" 
                    id="retirementAge" 
                    value={retirementAge} 
                    onChange={(e) => setRetirementAge(parseInt(e.target.value) || 0)}
                    className="retir0211-form-input"
                    min={currentAge}
                    max="100"
                  />
                </div>
                <div className="retir0211-form-group">
                  <label htmlFor="lifeExpectancy">Life Expectancy</label>
                  <input 
                    type="number" 
                    id="lifeExpectancy" 
                    value={lifeExpectancy} 
                    onChange={(e) => setLifeExpectancy(parseInt(e.target.value) || 0)}
                    className="retir0211-form-input"
                    min={retirementAge}
                    max="120"
                  />
                </div>
              </div>
            </div>
            
            <div className="retir0211-form-section">
              <h2>Current Financial Situation</h2>
              <div className="retir0211-form-row">
                <div className="retir0211-form-group retir0211-currency-group">
                  <label htmlFor="currentSavings">Current Retirement Savings</label>
                  <div className="retir0211-currency-input">
                    <span className="retir0211-currency-symbol">$</span>
                    <input 
                      type="number" 
                      id="currentSavings" 
                      value={currentSavings} 
                      onChange={(e) => setCurrentSavings(parseFloat(e.target.value) || 0)}
                      className="retir0211-form-input"
                      min="0"
                    />
                  </div>
                </div>
                <div className="retir0211-form-group retir0211-currency-group">
                  <label htmlFor="currentIncome">Current Annual Income</label>
                  <div className="retir0211-currency-input">
                    <span className="retir0211-currency-symbol">$</span>
                    <input 
                      type="number" 
                      id="currentIncome" 
                      value={currentIncome} 
                      onChange={(e) => setCurrentIncome(parseFloat(e.target.value) || 0)}
                      className="retir0211-form-input"
                      min="0"
                    />
                  </div>
                </div>
                <div className="retir0211-form-group retir0211-currency-group">
                  <label htmlFor="annualContribution">Annual Contribution</label>
                  <div className="retir0211-currency-input">
                    <span className="retir0211-currency-symbol">$</span>
                    <input 
                      type="number" 
                      id="annualContribution" 
                      value={annualContribution} 
                      onChange={(e) => setAnnualContribution(parseFloat(e.target.value) || 0)}
                      className="retir0211-form-input"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="retir0211-form-section">
              <h2>Retirement Assumptions</h2>
              <div className="retir0211-form-row">
                <div className="retir0211-form-group retir0211-percentage-group">
                  <label htmlFor="expectedReturnRate">Expected Return Rate</label>
                  <div className="retir0211-percentage-input">
                    <input 
                      type="number" 
                      id="expectedReturnRate" 
                      value={expectedReturnRate} 
                      onChange={(e) => setExpectedReturnRate(parseFloat(e.target.value) || 0)}
                      className="retir0211-form-input"
                      step="0.1"
                      min="0"
                      max="15"
                    />
                    <span className="retir0211-percentage-symbol">%</span>
                  </div>
                </div>
                <div className="retir0211-form-group retir0211-percentage-group">
                  <label htmlFor="inflationRate">Inflation Rate</label>
                  <div className="retir0211-percentage-input">
                    <input 
                      type="number" 
                      id="inflationRate" 
                      value={inflationRate} 
                      onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                      className="retir0211-form-input"
                      step="0.1"
                      min="0"
                      max="10"
                    />
                    <span className="retir0211-percentage-symbol">%</span>
                  </div>
                </div>
                <div className="retir0211-form-group retir0211-percentage-group">
                  <label htmlFor="incomeNeeded">Desired Retirement Income</label>
                  <div className="retir0211-percentage-input">
                    <input 
                      type="number" 
                      id="incomeNeeded" 
                      value={incomeNeeded} 
                      onChange={(e) => setIncomeNeeded(parseFloat(e.target.value) || 0)}
                      className="retir0211-form-input"
                      step="5"
                      min="0"
                      max="100"
                    />
                    <span className="retir0211-percentage-symbol">%</span>
                  </div>
                  <div className="retir0211-input-help">% of your current income</div>
                </div>
              </div>
            </div>
            
            <div className="retir0211-form-section">
              <h2>Additional Income Sources</h2>
              <div className="retir0211-form-row">
                <div className="retir0211-form-group retir0211-currency-group">
                  <label htmlFor="socialSecurity">Social Security (Annual)</label>
                  <div className="retir0211-currency-input">
                    <span className="retir0211-currency-symbol">$</span>
                    <input 
                      type="number" 
                      id="socialSecurity" 
                      value={socialSecurity} 
                      onChange={(e) => setSocialSecurity(parseFloat(e.target.value) || 0)}
                      className="retir0211-form-input"
                      min="0"
                    />
                  </div>
                </div>
                <div className="retir0211-form-group retir0211-currency-group">
                  <label htmlFor="otherIncome">Other Income (Annual)</label>
                  <div className="retir0211-currency-input">
                    <span className="retir0211-currency-symbol">$</span>
                    <input 
                      type="number" 
                      id="otherIncome" 
                      value={otherIncome} 
                      onChange={(e) => setOtherIncome(parseFloat(e.target.value) || 0)}
                      className="retir0211-form-input"
                      min="0"
                    />
                  </div>
                  <div className="retir0211-input-help">Pensions, part-time work, etc.</div>
                </div>
              </div>
            </div>
            
            <div className="retir0211-calculator-actions">
              <button className="retir0211-button retir0211-secondary" onClick={resetCalculator}>
                Reset
              </button>
              <button className="retir0211-button retir0211-primary" onClick={calculateRetirement}>
                Calculate Retirement
              </button>
            </div>
          </div>
        )}
        
        {selectedTab === 'results' && retirementResults && (
          <div className="retir0211-calculator-results">
            <div className="retir0211-results-summary">
              <div className="retir0211-result-card retir0211-highlight">
                <h3>Retirement Projection</h3>
                <div className="retir0211-result-value retir0211-large">
                  {formatCurrency(retirementResults.totalRetirementSavings)}
                </div>
                <div className="retir0211-result-label">
                  Estimated Savings at Retirement
                </div>
                <div className="retir0211-result-details">
                  <div className="retir0211-result-detail">
                    <span>Years until retirement:</span>
                    <span>{retirementResults.yearsToRetirement}</span>
                  </div>
                  <div className="retir0211-result-detail">
                    <span>Retirement Age:</span>
                    <span>{retirementAge}</span>
                  </div>
                </div>
              </div>
              
              <div className="retir0211-result-card">
                <h3>Retirement Income</h3>
                <div className="retir0211-result-value">
                  {formatCurrency(retirementResults.retirementIncome.total)}
                </div>
                <div className="retir0211-result-label">
                  Estimated Annual Income
                </div>
                <div className="retir0211-result-details">
                  <div className="retir0211-result-detail">
                    <span>From Savings:</span>
                    <span>{formatCurrency(retirementResults.retirementIncome.fromSavings)}</span>
                  </div>
                  <div className="retir0211-result-detail">
                    <span>Social Security:</span>
                    <span>{formatCurrency(retirementResults.retirementIncome.fromSocialSecurity)}</span>
                  </div>
                  <div className="retir0211-result-detail">
                    <span>Other Sources:</span>
                    <span>{formatCurrency(retirementResults.retirementIncome.fromOther)}</span>
                  </div>
                </div>
              </div>
              
              <div className="retir0211-result-card">
                <h3>Retirement Duration</h3>
                <div className="retir0211-result-value">
                  {retirementResults.savingsDepletion === "Never" ? "Lifetime" : 
                   `${retirementResults.savingsDepletion} years`}
                </div>
                <div className="retir0211-result-label">
                  How Long Savings Will Last
                </div>
                <div className="retir0211-result-details">
                  <div className="retir0211-result-detail">
                    <span>Savings Last Until Age:</span>
                    <span>{retirementResults.savingsLastUntilAge}</span>
                  </div>
                  <div className="retir0211-result-detail">
                    <span>Life Expectancy:</span>
                    <span>{lifeExpectancy}</span>
                  </div>
                </div>
              </div>
              
              <div className={`retir0211-result-card ${retirementResults.annualSurplusOrShortfall < 0 ? 'retir0211-warning' : 'retir0211-success'}`}>
                <h3>Retirement Gap Analysis</h3>
                <div className="retir0211-result-value">
                  {retirementResults.annualSurplusOrShortfall >= 0 ? (
                    <>
                      <span className="retir0211-result-positive">+{formatCurrency(retirementResults.annualSurplusOrShortfall)}</span>
                      <div className="retir0211-result-label">Annual Surplus</div>
                    </>
                  ) : (
                    <>
                      <span className="retir0211-result-negative">-{formatCurrency(Math.abs(retirementResults.annualSurplusOrShortfall))}</span>
                      <div className="retir0211-result-label">Annual Shortfall</div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {retirementResults.recommendedChanges && (
              <div className="retir0211-recommendations">
                <h3>Recommendations to Close Your Retirement Gap</h3>
                <div className="retir0211-recommendation-cards">
                  <div className="retir0211-recommendation-card">
                    <div className="retir0211-recommendation-icon retir0211-savings-icon"></div>
                    <h4>Increase Your Savings</h4>
                    <p>Consider increasing your annual contribution by {formatCurrency(retirementResults.recommendedChanges.additionalAnnualSavingsNeeded)} to {formatCurrency(retirementResults.recommendedChanges.newTotalAnnualContribution)} per year.</p>
                  </div>
                  
                  <div className="retir0211-recommendation-card">
                    <div className="retir0211-recommendation-icon retir0211-time-icon"></div>
                    <h4>Extend Your Working Years</h4>
                    <p>Working {retirementResults.recommendedChanges.additionalYearsToWork} additional years (until age {retirementResults.recommendedChanges.newRetirementAge}) could help close your retirement gap.</p>
                  </div>
                  
                  <div className="retir0211-recommendation-card">
  <div className="retir0211-recommendation-icon retir0211-lifestyle-icon"></div>
  <h4>Adjust Retirement Lifestyle</h4>
  <p>Reducing your retirement income needs to {retirementResults.recommendedChanges.adjustedIncomePercentage}% of your current income could help make your savings last longer.</p>
</div>
              </div>
            </div>
            )}
            
            <div className="retir0211-projection-charts">
              <h3>Retirement Savings Projection</h3>
              <p>This chart shows how your retirement savings are projected to grow and decline over time.</p>
              {renderSavingsChart(retirementResults.projectionData)}
              
              <h3>Retirement Income Sources</h3>
              <p>Breakdown of your estimated annual income during retirement.</p>
              {renderIncomeChart(retirementResults.retirementIncome)}
            </div>
            
            <div className="retir0211-calculator-actions">
              <button className="retir0211-button retir0211-secondary" onClick={() => setSelectedTab('inputs')}>
                Adjust Inputs
              </button>
              <button className="retir0211-button retir0211-primary" onClick={goToDashboard}>
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetirementCalculator;