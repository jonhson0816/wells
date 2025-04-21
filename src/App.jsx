import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { UserProvider } from './Context/UserContext';
import { AuthProvider, useAuth } from './Context/AuthContext';

// Import all necessary components
import WellsFargoPage from './Components/WellsFargoPage/WellsFargoPage';
import Dashboard from './Components/Dashboard/Dashboard';
import Navbar from './Components/Navbar/Navbar';
import UserProfile from './Components/UserProfile/UserProfile';
import AccountDetailPage from './Components/AccountDetail/AccountDetailPage';
import AddNewAccount from './Components/OpenNewAccount/OpenNewAccount';
import WellsFargoPreloader from './Components/Preloading/Preloading';
import TransferPage from './Components/TransferPage/TransferPage';
import AccountPage from './Components/CheckingAccount/CheckingAccountPage';
import SavingsAccountPage from './Components/SavingsAccount/SavingsAccountPage';
import CreditAccountPage from './Components/CreditAccount/CreditAccountPage';
import RetirementAccountPage from './Components/RetirementAccount/RetirementAccountPage';
import CheckingAccountPage from './Components/CheckingAccount/CheckingAccountPage';
// import LoanAccountPage from './Components/LoanAccount/LoanAccountPage';
// import StudentAccountPage from './Components/StudentAccount/StudentAccountPage';
import DepositCheckPage from './Components/DepositCheck/DepositCheckPage';
import TransferMoneyPage from './Components/TransferMoney/TransferMoneyPage';
import PayBillsPage from './Components/PayBills/PayBillsPage';
import WithdrawFundsPage from './Components/WithdrawFunds/WithdrawFundsPage';
import OrderChecksPage from './Components/OrderChecks/OrderChecksPage';
import SetupAutoPayPage from './Components/SetupAutoPay/SetupAutoPayPage';
import AccountAlertsPage from './Components/AccountAlerts/AccountAlertsPage';
import DisputeTransactionPage from './Components/DisputeTransaction/DisputeTransactionPage';
import OpenNewAccount from './Components/OpenNewAccount/OpenNewAccount';
import AutoSavePage from './Components/AutoSave/AutoSavePage';
import InterestDetails from './Components/InterestDetails/InterestDetailsPage';
import BudgetPlanner from './Components/BudgetPlanner/BudgetPlannerPage';
import BalanceTransfer from './Components/BalanceTransfer/BalanceTransferPage';
import CashAdvance from './Components/CashAdvance/CashAdvancePage';
import CreditLimit from './Components/CreditLimit/CreditLimitPage';
import RedeemRewards from './Components/RedeemRewards/RedeemRewardsPage';
import ContributeRetirement from './Components/ContributeRetirement/ContributeRetirementPage';
import WithdrawRetirement from './Components/WithdrawRetirement/WithdrawRetirement';
import RebalancePortfolio from './Components/RebalancePortfolio/RebalancePortfolio';
import RolloverRetirementPage from './Components/RolloverRetirementPage/RolloverRetirementPage';
import RetirementLoanPage from './Components/RetirementLoanPage/RetirementLoanPage';
import UpdateBeneficiaries from './Components/UpdateBeneficiaries/UpdateBeneficiaries';
import RetirementCalculator from './Components/RetirementCalculator/RetirementCalculator';
import InvestmentAccountPage from './Components/InvestmentAccount/InvestmentAccountPage';
import StudentAccountPage from './Components/StudentAccount/StudentAccountPage';
import CertificateOfDepositPage from './Components/CertificateOfDeposit/CertificateOfDepositPage';

if (import.meta.env.DEV) {
  const originalFetch = window.fetch;
  window.fetch = function(resource, init) {
    console.log(`Fetch request to: ${resource}`);
    return originalFetch.apply(this, arguments);
  };
}

// Wrapper component to handle page-level loading
const PageLoader = ({ children }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const location = useLocation();

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 seconds loading time for each page

    return () => clearTimeout(timer);
  }, [location.pathname]); // Reset loading when path changes

  if (isLoading) {
    return <WellsFargoPreloader />;
  }

  return children;
};

// Protected Route component - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <WellsFargoPreloader />;
  }
  
  if (!currentUser) {
    // Redirect to the landing page with a return_to parameter
    return <Navigate to="/dashboard" state={{ return_to: location.pathname }} replace />;
  }

  return children;
};

function App() {
  // Mock accounts for demonstration
  const mockAccounts = [
    { 
      id: 'chk001',
      type: 'Checking Account', 
      accountNumber: '****5678', 
      balance: 45678.92,
      creditLimit: 0
    },
    { 
      id: 'sav001',
      type: 'Savings Account', 
      accountNumber: '****9012', 
      balance: 25000.50,
      creditLimit: 0
    },
    { 
      id: 'crd001',
      type: 'Credit Account', 
      accountNumber: '****3456', 
      balance: -2500.75,
      creditLimit: 10000
    },
    { 
      id: 'ret001',
      type: 'Retirement Account', 
      accountNumber: '****7890', 
      balance: 125000.00,
      creditLimit: 0
    }
  ];

  return (
    <Router>
      {/* Wrap the entire application with AuthProvider */}
      <AuthProvider>
        {/* Keep your existing UserProvider for backward compatibility */}
        <UserProvider>
          <div className="app-container">
            <Navbar />
            <Routes>
              {/* Landing Page - public */}
              <Route 
                path="/" 
                element={
                  <PageLoader>
                    <WellsFargoPage />
                  </PageLoader>
                } 
              />

              {/* Dashboard Route - protected */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <Dashboard />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />

              {/* User Profile Route - protected */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <UserProfile />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />

              {/* Accounts Routes - protected */}
              <Route 
                path="/accounts" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <AccountPage accounts={mockAccounts} />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />

              {/* Specific Account Details Route - protected */}
              <Route 
                path="/accounts/:accountId" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <AccountDetailPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />

              {/* FIXED: Match routes from Dashboard component */}
              <Route 
                path="/accounts/checking/:accountId?" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <CheckingAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              
              {/* New simplified route for savings account */}
              <Route 
                path="/savings" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <SavingsAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              
              {/* Keep original savings route for backward compatibility */}
              <Route 
                path="/accounts/savings/:accountId?" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <SavingsAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/accounts/credit/:accountId?" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <CreditAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/accounts/investment/:accountId?" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <RetirementAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />

              {/* Keeping original routes for backward compatibility */}
              <Route 
                path="/accounts/checking-account/:accountId?" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <CheckingAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/accounts/savings-account/:accountId?" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <SavingsAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/accounts/retirement-account/:accountId?" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <RetirementAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/accounts/credit-account/:accountId?" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <CreditAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/accounts/investment-account/:accountId?" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <InvestmentAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/accounts/cd-account/:accountId?" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <CertificateOfDepositPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />

              {/* Transfers Route - protected */}
              <Route 
                path="/transfers" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <TransferPage accounts={mockAccounts} />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />

              {/* Add New Account Route - protected */}
              <Route 
                path="/open-new-account" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <OpenNewAccount />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />

              {/* Legacy Account Type Routes (keeping for backward compatibility) */}
              <Route 
                path="/savings-account" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <SavingsAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/credit-account" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <CreditAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/retirement-account" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <RetirementAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/checking-account" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <CheckingAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/investment-account" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <InvestmentAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              
              {/* <Route 
                path="/cd-account" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <CertificateDepositPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              /> */}
              {/* <Route 
                path="/money-market-accountt" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <CertificateDepositPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              /> */}
              <Route
                path="/accounts/student/:accountId"
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <StudentAccountPage />
                    </PageLoader>
                  </ProtectedRoute>
                }
              />
              {/* Banking Feature Routes - all protected */}
              <Route 
                path="/transfer-money" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <TransferMoneyPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pay-bills" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <PayBillsPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/deposit-check" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <DepositCheckPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/withdraw-funds" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <WithdrawFundsPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/withdraw" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <WithdrawFundsPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/order-checks" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <OrderChecksPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/setup-autopay" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <SetupAutoPayPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/account-alerts" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <AccountAlertsPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dispute-transaction" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <DisputeTransactionPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              
              {/* Savings Feature Routes */}
              <Route 
                path="/auto-save" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <AutoSavePage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/interest-details" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <InterestDetails />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/budget-planner" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <BudgetPlanner />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              
              {/* Credit Account Feature Routes */}
              <Route 
                path="/balance-transfer" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <BalanceTransfer />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cash-advance" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <CashAdvance />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/credit-limit" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <CreditLimit />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/redeem-rewards" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <RedeemRewards />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              
              {/* Retirement Account Feature Routes */}
              <Route 
                path="/contribute-retirement" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <ContributeRetirement />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/withdraw-retirement" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <WithdrawRetirement />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/rebalance-portfolio" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <RebalancePortfolio />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/rollover-retirement" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <RolloverRetirementPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/retirement-loan" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <RetirementLoanPage />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/update-beneficiaries" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <UpdateBeneficiaries />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/retirement-calculator" 
                element={
                  <ProtectedRoute>
                    <PageLoader>
                      <RetirementCalculator />
                    </PageLoader>
                  </ProtectedRoute>
                } 
              />

              {/* Authentication Routes - use only the landing page now */}
              <Route 
                path="/login" 
                element={
                  <Navigate to="/" state={{ showLogin: true }} replace />
                } 
              />
              <Route 
                path="/register" 
                element={
                  <Navigate to="/" state={{ showRegister: true }} replace />
                } 
              />
            </Routes>
          </div>
        </UserProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;