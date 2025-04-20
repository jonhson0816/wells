import React, { useState, useEffect } from 'react';
import './InterestDetailsPage.css'

const InterestDetails = () => {
  // State for all interest-related data
  const [accountsData, setAccountsData] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [historicalRates, setHistoricalRates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calculatorValues, setCalculatorValues] = useState({
    principal: 10000,
    rate: 3.5,
    time: 5,
    compoundFrequency: 12, // Monthly
  });
  const [calculatorResult, setCalculatorResult] = useState(null);

  // Simulated data fetch - replace with actual API calls
  useEffect(() => {
    // Simulate API loading
    setIsLoading(true);
    
    // Mock data - replace with actual API endpoints
    setTimeout(() => {
      try {
        // Mock accounts with interest information
        const mockAccounts = [
          {
            id: 'acct1234',
            name: 'Way2Save Savings',
            balance: 12543.87,
            interestRate: 0.95,
            apy: 0.96,
            lastInterestPaid: '03/31/2025',
            interestYTD: 29.84,
            interestLastYear: 112.67,
            nextInterestDate: '04/30/2025',
          },
          {
            id: 'acct5678',
            name: 'Platinum Savings',
            balance: 35750.21,
            interestRate: 1.75,
            apy: 1.77,
            lastInterestPaid: '03/31/2025',
            interestYTD: 154.12,
            interestLastYear: 612.45,
            nextInterestDate: '04/30/2025',
          },
          {
            id: 'cd9012',
            name: 'Step Rate CD',
            balance: 25000.00,
            interestRate: 3.50,
            apy: 3.55,
            lastInterestPaid: '03/15/2025',
            interestYTD: 218.75,
            interestLastYear: 0, // New CD
            maturityDate: '03/15/2026',
            term: '12 months',
          }
        ];

        // Mock historical rates
        const mockHistoricalRates = [
          { date: '04/01/2025', savingsRate: 0.95, cdRate: 3.50 },
          { date: '03/01/2025', savingsRate: 0.95, cdRate: 3.50 },
          { date: '02/01/2025', savingsRate: 0.90, cdRate: 3.45 },
          { date: '01/01/2025', savingsRate: 0.90, cdRate: 3.40 },
          { date: '12/01/2024', savingsRate: 0.85, cdRate: 3.35 },
          { date: '11/01/2024', savingsRate: 0.85, cdRate: 3.30 },
        ];

        setAccountsData(mockAccounts);
        setHistoricalRates(mockHistoricalRates);
        setSelectedAccount(mockAccounts[0]);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load interest data. Please try again later.');
        setIsLoading(false);
      }
    }, 1000);
  }, []);

  // Interest calculator function
  const calculateInterest = () => {
    const { principal, rate, time, compoundFrequency } = calculatorValues;
    const r = rate / 100;
    const n = compoundFrequency;
    const t = time;
    
    // Compound interest formula: A = P(1 + r/n)^(nt)
    const amount = principal * Math.pow(1 + (r / n), n * t);
    const interest = amount - principal;
    
    setCalculatorResult({
      futureValue: amount.toFixed(2),
      totalInterest: interest.toFixed(2),
      effectiveRate: (Math.pow(1 + r/n, n) - 1) * 100
    });
  };

  // Handle calculator input changes
  const handleCalculatorChange = (event) => {
    const { name, value } = event.target;
    setCalculatorValues({
      ...calculatorValues,
      [name]: parseFloat(value)
    });
  };

  // Handle account selection
  const handleAccountSelect = (accountId) => {
    const selected = accountsData.find(account => account.id === accountId);
    setSelectedAccount(selected);
  };

  // Convert date string to formatted display
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  if (isLoading) return <div>Loading interest details...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="interest-details-container">
      <header>
        <h1>Interest Details</h1>
        <p>View and manage interest information for your Wells Fargo accounts</p>
      </header>

      <section className="account-selector">
        <h2>Select Account</h2>
        <div className="accounts-list">
          {accountsData.map(account => (
            <div 
              key={account.id} 
              onClick={() => handleAccountSelect(account.id)}
              className={`account-item ${selectedAccount?.id === account.id ? 'selected' : ''}`}
            >
              <h3>{account.name}</h3>
              <p>${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p>Interest Rate: {account.interestRate}%</p>
            </div>
          ))}
        </div>
      </section>

      {selectedAccount && (
        <section className="account-interest-details">
          <h2>Interest Details for {selectedAccount.name}</h2>
          
          <div className="detail-row">
            <div className="detail-item">
              <h3>Current Balance</h3>
              <p>${selectedAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            
            <div className="detail-item">
              <h3>Current Rate</h3>
              <p>{selectedAccount.interestRate}%</p>
            </div>
            
            <div className="detail-item">
              <h3>Annual Percentage Yield (APY)</h3>
              <p>{selectedAccount.apy}%</p>
            </div>
          </div>
          
          <div className="detail-row">
            <div className="detail-item">
              <h3>Interest Earned YTD</h3>
              <p>${selectedAccount.interestYTD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            
            <div className="detail-item">
              <h3>Interest Last Year</h3>
              <p>${selectedAccount.interestLastYear.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            
            <div className="detail-item">
              <h3>Last Interest Paid</h3>
              <p>{selectedAccount.lastInterestPaid}</p>
            </div>
          </div>
          
          {selectedAccount.nextInterestDate && (
            <div className="detail-item">
              <h3>Next Interest Payment</h3>
              <p>{selectedAccount.nextInterestDate}</p>
            </div>
          )}
          
          {selectedAccount.maturityDate && (
            <div className="detail-row">
              <div className="detail-item">
                <h3>Term</h3>
                <p>{selectedAccount.term}</p>
              </div>
              <div className="detail-item">
                <h3>Maturity Date</h3>
                <p>{selectedAccount.maturityDate}</p>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="interest-calculator">
        <h2>Interest Calculator</h2>
        <p>Estimate future earnings on your savings</p>
        
        <div className="calculator-form">
          <div className="form-group">
            <label htmlFor="principal">Initial Deposit ($)</label>
            <input
              id="principal"
              name="principal"
              type="number"
              value={calculatorValues.principal}
              onChange={handleCalculatorChange}
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="rate">Interest Rate (%)</label>
            <input
              id="rate"
              name="rate"
              type="number"
              value={calculatorValues.rate}
              onChange={handleCalculatorChange}
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="time">Time Period (years)</label>
            <input
              id="time"
              name="time"
              type="number"
              value={calculatorValues.time}
              onChange={handleCalculatorChange}
              min="0.25"
              step="0.25"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="compoundFrequency">Compound Frequency</label>
            <select
              id="compoundFrequency"
              name="compoundFrequency"
              value={calculatorValues.compoundFrequency}
              onChange={handleCalculatorChange}
            >
              <option value="1">Annually</option>
              <option value="2">Semi-annually</option>
              <option value="4">Quarterly</option>
              <option value="12">Monthly</option>
              <option value="365">Daily</option>
            </select>
          </div>
          
          <button onClick={calculateInterest} className="calculate-button">
            Calculate
          </button>
        </div>
        
        {calculatorResult && (
          <div className="calculator-results">
            <h3>Results</h3>
            <div className="result-item">
              <p>Future Value:</p>
              <p>${calculatorResult.futureValue}</p>
            </div>
            <div className="result-item">
              <p>Total Interest:</p>
              <p>${calculatorResult.totalInterest}</p>
            </div>
            <div className="result-item">
              <p>Effective Annual Rate:</p>
              <p>{calculatorResult.effectiveRate.toFixed(2)}%</p>
            </div>
          </div>
        )}
      </section>
      
      <section className="historical-rates">
        <h2>Historical Interest Rates</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Savings Accounts</th>
              <th>Certificates of Deposit</th>
            </tr>
          </thead>
          <tbody>
            {historicalRates.map((rate, index) => (
              <tr key={index}>
                <td>{rate.date}</td>
                <td>{rate.savingsRate}%</td>
                <td>{rate.cdRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      <section className="interest-faqs">
        <h2>Interest FAQs</h2>
        <div className="faq-item">
          <h3>How is interest calculated on my accounts?</h3>
          <p>Interest is calculated using the daily balance method. This method applies a daily periodic rate to the principal in the account each day.</p>
        </div>
        <div className="faq-item">
          <h3>When is interest paid to my account?</h3>
          <p>For savings accounts, interest is typically paid monthly on the last business day of the month. For CDs, interest can be paid monthly, quarterly, semi-annually, annually, or at maturity, depending on your selection when opening the CD.</p>
        </div>
        <div className="faq-item">
          <h3>What is APY?</h3>
          <p>Annual Percentage Yield (APY) reflects the total amount of interest paid on an account based on the interest rate and the frequency of compounding for a 365-day period. The higher the APY, the more money you earn.</p>
        </div>
      </section>
    </div>
  );
};

export default InterestDetails;