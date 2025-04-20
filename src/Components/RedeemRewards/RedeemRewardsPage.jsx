import React, { useState, useEffect } from 'react';
import { ChevronRight, Gift, CreditCard, Home, Repeat, DollarSign, ShoppingBag, Plane, Utensils, Coffee, Star } from 'lucide-react';
import './RedeemRewardsPage.css';

const RedeemRewards = () => {
  const [availablePoints, setAvailablePoints] = useState(12500);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rewards, setRewards] = useState([]);
  const [featuredRewards, setFeaturedRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate fetching rewards data
  useEffect(() => {
    // Simulating API call delay
    setTimeout(() => {
      const allRewards = [
        { id: 1, name: 'Statement Credit', description: 'Apply points to your credit card balance', points: 2500, category: 'cashback', icon: <DollarSign /> },
        { id: 2, name: 'Amazon Gift Card', description: '$50 Amazon gift card', points: 5000, category: 'giftcard', icon: <ShoppingBag /> },
        { id: 3, name: 'Target Gift Card', description: '$25 Target gift card', points: 2500, category: 'giftcard', icon: <ShoppingBag /> },
        { id: 4, name: 'Travel Credit', description: '$100 travel credit for any airline', points: 10000, category: 'travel', icon: <Plane /> },
        { id: 5, name: 'Restaurant Dining', description: '$50 credit at select restaurants', points: 5000, category: 'dining', icon: <Utensils /> },
        { id: 6, name: 'Apple Gift Card', description: '$50 Apple Store gift card', points: 5000, category: 'giftcard', icon: <ShoppingBag /> },
        { id: 7, name: 'Starbucks Gift Card', description: '$25 Starbucks gift card', points: 2500, category: 'dining', icon: <Coffee /> },
        { id: 8, name: 'Cash Deposit', description: 'Deposit cash directly to your account', points: 5000, category: 'cashback', icon: <DollarSign /> },
        { id: 9, name: 'Hotel Discount', description: '15% off your next hotel booking', points: 3500, category: 'travel', icon: <Home /> },
      ];

      setRewards(allRewards);
      setFeaturedRewards([allRewards[3], allRewards[0], allRewards[5]]);
      setIsLoading(false);
    }, 800);
  }, []);

  // Filter rewards based on category and search
  const filteredRewards = rewards.filter(reward => {
    const matchesCategory = selectedCategory === 'all' || reward.category === selectedCategory;
    const matchesSearch = reward.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          reward.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Function to handle redemption
  const handleRedeemReward = (reward) => {
    if (availablePoints >= reward.points) {
      // In a real app, this would call an API
      setAvailablePoints(prevPoints => prevPoints - reward.points);
      alert(`Successfully redeemed ${reward.name} for ${reward.points} points!`);
    } else {
      alert('You do not have enough points for this reward.');
    }
  };

  return (
    <div className="redeem-rewards-container">
      <header className="rewards-header">
        <div className="logo-container">
          <img 
            src="/Images/wells fargo.jpeg" 
            alt="Wells Fargo" 
            className="wells-fargo-logo" 
          />
        </div>
        <div className="points-balance">
          <h2>Available Points</h2>
          <div className="points-amount">{availablePoints.toLocaleString()}</div>
        </div>
      </header>

      <div className="rewards-breadcrumb">
        <span>Home</span> <ChevronRight size={14} /> <span>Rewards</span> <ChevronRight size={14} /> <span className="current">Redeem Rewards</span>
      </div>

      <section className="rewards-content">
        <h1 className="page-title">Redeem Your Rewards</h1>
        <p className="page-subtitle">Turn your everyday purchases into extraordinary rewards</p>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading rewards...</p>
          </div>
        ) : (
          <>
            <div className="search-filter-container">
              <div className="search-box">
                <input 
                  type="text" 
                  placeholder="Search rewards..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="category-filters">
                <button 
                  className={selectedCategory === 'all' ? 'active' : ''} 
                  onClick={() => setSelectedCategory('all')}
                >
                  All
                </button>
                <button 
                  className={selectedCategory === 'cashback' ? 'active' : ''} 
                  onClick={() => setSelectedCategory('cashback')}
                >
                  Cash Back
                </button>
                <button 
                  className={selectedCategory === 'giftcard' ? 'active' : ''} 
                  onClick={() => setSelectedCategory('giftcard')}
                >
                  Gift Cards
                </button>
                <button 
                  className={selectedCategory === 'travel' ? 'active' : ''} 
                  onClick={() => setSelectedCategory('travel')}
                >
                  Travel
                </button>
                <button 
                  className={selectedCategory === 'dining' ? 'active' : ''} 
                  onClick={() => setSelectedCategory('dining')}
                >
                  Dining
                </button>
              </div>
            </div>

            {selectedCategory === 'all' && searchQuery === '' && (
              <section className="featured-rewards">
                <h2>Featured Rewards</h2>
                <div className="featured-rewards-grid">
                  {featuredRewards.map(reward => (
                    <div key={reward.id} className="featured-reward-card">
                      <div className="reward-icon featured">{reward.icon}</div>
                      <h3>{reward.name}</h3>
                      <p>{reward.description}</p>
                      <div className="points-required">{reward.points.toLocaleString()} points</div>
                      <button 
                        className="redeem-button featured"
                        onClick={() => handleRedeemReward(reward)}
                        disabled={availablePoints < reward.points}
                      >
                        Redeem Now
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="all-rewards">
              <h2>{selectedCategory === 'all' ? 'All Rewards' : 'Filtered Rewards'}</h2>
              {filteredRewards.length === 0 ? (
                <div className="no-rewards-found">
                  <p>No rewards found matching your criteria.</p>
                </div>
              ) : (
                <div className="rewards-grid">
                  {filteredRewards.map(reward => (
                    <div key={reward.id} className="reward-card">
                      <div className="reward-icon">{reward.icon}</div>
                      <div className="reward-info">
                        <h3>{reward.name}</h3>
                        <p>{reward.description}</p>
                        <div className="points-required">{reward.points.toLocaleString()} points</div>
                      </div>
                      <button 
                        className="redeem-button"
                        onClick={() => handleRedeemReward(reward)}
                        disabled={availablePoints < reward.points}
                      >
                        {availablePoints < reward.points ? 'Not Enough Points' : 'Redeem'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rewards-faq">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-item">
                <h3>How do I earn more points?</h3>
                <p>Earn points by using your Wells Fargo credit or debit card for everyday purchases. Special categories may offer bonus points.</p>
              </div>
              <div className="faq-item">
                <h3>When do my points expire?</h3>
                <p>Your points do not expire as long as your account remains open and in good standing.</p>
              </div>
              <div className="faq-item">
                <h3>How long does reward redemption take?</h3>
                <p>Statement credits typically process within 1-3 business days. Gift cards may take 3-5 business days to deliver.</p>
              </div>
            </section>
          </>
        )}
      </section>

      <footer className="rewards-footer">
        <div className="footer-links">
          <a href="#">Terms & Conditions</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Contact Us</a>
          <a href="#">Help Center</a>
        </div>
        <div className="copyright">
          © {new Date().getFullYear()} Wells Fargo Bank, N.A. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default RedeemRewards;