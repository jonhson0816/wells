import React, { useState, useEffect } from 'react';
import './BudgetPlannerPage.css'

const BudgetPlanner = () => {
  // State for budget categories and transactions
  const [categories, setCategories] = useState([
    { id: 1, name: 'Housing', budgeted: 1200, spent: 0 },
    { id: 2, name: 'Transportation', budgeted: 350, spent: 0 },
    { id: 3, name: 'Food', budgeted: 500, spent: 0 },
    { id: 4, name: 'Utilities', budgeted: 250, spent: 0 },
    { id: 5, name: 'Entertainment', budgeted: 150, spent: 0 },
    { id: 6, name: 'Healthcare', budgeted: 200, spent: 0 },
    { id: 7, name: 'Savings', budgeted: 400, spent: 0 },
  ]);
  
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().substr(0, 10),
    description: ''
  });
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    budgeted: ''
  });
  
  const [monthlyIncome, setMonthlyIncome] = useState(3500);
  const [newMonthlyIncome, setNewMonthlyIncome] = useState(3500);
  const [showIncomeEdit, setShowIncomeEdit] = useState(false);
  
  const [currentMonth, setCurrentMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));

  // Calculate summary data
  const totalBudgeted = categories.reduce((sum, category) => sum + category.budgeted, 0);
  const totalSpent = categories.reduce((sum, category) => sum + category.spent, 0);
  const remaining = monthlyIncome - totalBudgeted;
  const availableToSpend = monthlyIncome - totalSpent;

  // Update spent amounts when transactions change
  useEffect(() => {
    const updatedCategories = [...categories];
    
    // Reset spent amounts
    updatedCategories.forEach(category => {
      category.spent = 0;
    });
    
    // Calculate new spent amounts based on transactions
    transactions.forEach(transaction => {
      const category = updatedCategories.find(cat => cat.id === parseInt(transaction.category));
      if (category) {
        category.spent += parseFloat(transaction.amount);
      }
    });
    
    setCategories(updatedCategories);
  }, [transactions]);

  // Handle new transaction
  const handleTransactionChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction({
      ...newTransaction,
      [name]: value
    });
  };

  // Add new transaction
  const addTransaction = (e) => {
    e.preventDefault();
    if (!newTransaction.category || !newTransaction.amount || !newTransaction.date) {
      alert('Please fill out all required fields');
      return;
    }
    
    setTransactions([
      ...transactions,
      {
        id: Date.now(),
        ...newTransaction,
        amount: parseFloat(newTransaction.amount)
      }
    ]);
    
    setNewTransaction({
      category: '',
      amount: '',
      date: new Date().toISOString().substr(0, 10),
      description: ''
    });
  };

  // Handle new category
  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setNewCategory({
      ...newCategory,
      [name]: value
    });
  };

  // Add new category
  const addCategory = (e) => {
    e.preventDefault();
    if (!newCategory.name || !newCategory.budgeted) {
      alert('Please fill out all fields');
      return;
    }
    
    setCategories([
      ...categories,
      {
        id: categories.length + 1,
        name: newCategory.name,
        budgeted: parseFloat(newCategory.budgeted),
        spent: 0
      }
    ]);
    
    setNewCategory({
      name: '',
      budgeted: ''
    });
  };

  // Update category budget
  const updateCategoryBudget = (id, value) => {
    const updatedCategories = categories.map(category => {
      if (category.id === id) {
        return { ...category, budgeted: parseFloat(value) || 0 };
      }
      return category;
    });
    
    setCategories(updatedCategories);
  };

  // Save new monthly income
  const saveMonthlyIncome = () => {
    setMonthlyIncome(parseFloat(newMonthlyIncome) || 0);
    setShowIncomeEdit(false);
  };

  // Delete a transaction
  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(transaction => transaction.id !== id));
  };

  // Delete a category
  const deleteCategory = (id) => {
    // Check if there are transactions using this category
    const hasTransactions = transactions.some(transaction => parseInt(transaction.category) === id);
    
    if (hasTransactions) {
      alert('Cannot delete category with existing transactions');
      return;
    }
    
    setCategories(categories.filter(category => category.id !== id));
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const currentDate = new Date();
    const [month, year] = currentMonth.split(' ');
    const monthIndex = new Date(Date.parse(`${month} 1, ${year}`)).getMonth();
    const previousDate = new Date(parseInt(year), monthIndex - 1);
    setCurrentMonth(previousDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
    
    // In a real app, you would fetch data for the new month here
    // For demo purposes, we'll just reset the transactions
    setTransactions([]);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const [month, year] = currentMonth.split(' ');
    const monthIndex = new Date(Date.parse(`${month} 1, ${year}`)).getMonth();
    const nextDate = new Date(parseInt(year), monthIndex + 1);
    setCurrentMonth(nextDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
    
    // In a real app, you would fetch data for the new month here
    // For demo purposes, we'll just reset the transactions
    setTransactions([]);
  };

  return (
    <div className="budget-planner">
      <div className="budget-header">
        <h1>Wells Fargo Budget Planner</h1>
        <div className="month-selector">
          <button onClick={goToPreviousMonth}>&lt;</button>
          <h2>{currentMonth}</h2>
          <button onClick={goToNextMonth}>&gt;</button>
        </div>
      </div>

      <div className="budget-summary">
        <div className="summary-card">
          <h3>Monthly Income</h3>
          {showIncomeEdit ? (
            <div className="income-edit">
              <input
                type="number"
                value={newMonthlyIncome}
                onChange={(e) => setNewMonthlyIncome(e.target.value)}
              />
              <button onClick={saveMonthlyIncome}>Save</button>
              <button onClick={() => setShowIncomeEdit(false)}>Cancel</button>
            </div>
          ) : (
            <div>
              <h2>${monthlyIncome.toFixed(2)}</h2>
              <button onClick={() => setShowIncomeEdit(true)}>Edit</button>
            </div>
          )}
        </div>

        <div className="summary-card">
          <h3>Total Budgeted</h3>
          <h2>${totalBudgeted.toFixed(2)}</h2>
        </div>

        <div className="summary-card">
          <h3>Total Spent</h3>
          <h2>${totalSpent.toFixed(2)}</h2>
        </div>

        <div className="summary-card">
          <h3>Remaining to Budget</h3>
          <h2 className={remaining < 0 ? 'negative' : ''}>${remaining.toFixed(2)}</h2>
        </div>

        <div className="summary-card">
          <h3>Available to Spend</h3>
          <h2 className={availableToSpend < 0 ? 'negative' : ''}>${availableToSpend.toFixed(2)}</h2>
        </div>
      </div>

      <div className="budget-container">
        <div className="budget-categories">
          <h2>Budget Categories</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Budgeted</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>
                    <input
                      type="number"
                      value={category.budgeted}
                      onChange={(e) => updateCategoryBudget(category.id, e.target.value)}
                    />
                  </td>
                  <td>${category.spent.toFixed(2)}</td>
                  <td className={category.budgeted - category.spent < 0 ? 'negative' : ''}>
                    ${(category.budgeted - category.spent).toFixed(2)}
                  </td>
                  <td>
                    <button onClick={() => deleteCategory(category.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="add-category">
            <h3>Add New Category</h3>
            <form onSubmit={addCategory}>
              <div>
                <label>Category Name:</label>
                <input
                  type="text"
                  name="name"
                  value={newCategory.name}
                  onChange={handleCategoryChange}
                  required
                />
              </div>
              <div>
                <label>Budget Amount:</label>
                <input
                  type="number"
                  name="budgeted"
                  value={newCategory.budgeted}
                  onChange={handleCategoryChange}
                  required
                />
              </div>
              <button type="submit">Add Category</button>
            </form>
          </div>
        </div>

        <div className="recent-transactions">
          <h2>Recent Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td>{categories.find(cat => cat.id === parseInt(transaction.category))?.name}</td>
                  <td>{transaction.description}</td>
                  <td>${transaction.amount.toFixed(2)}</td>
                  <td>
                    <button onClick={() => deleteTransaction(transaction.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="5">No transactions recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="add-transaction">
            <h3>Add New Transaction</h3>
            <form onSubmit={addTransaction}>
              <div>
                <label>Category:</label>
                <select
                  name="category"
                  value={newTransaction.category}
                  onChange={handleTransactionChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Amount:</label>
                <input
                  type="number"
                  name="amount"
                  value={newTransaction.amount}
                  onChange={handleTransactionChange}
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label>Date:</label>
                <input
                  type="date"
                  name="date"
                  value={newTransaction.date}
                  onChange={handleTransactionChange}
                  required
                />
              </div>
              <div>
                <label>Description:</label>
                <input
                  type="text"
                  name="description"
                  value={newTransaction.description}
                  onChange={handleTransactionChange}
                />
              </div>
              <button type="submit">Add Transaction</button>
            </form>
          </div>
        </div>
      </div>

      <div className="budget-insights">
        <h2>Budget Insights</h2>
        <div className="insights-container">
          {totalBudgeted > monthlyIncome && (
            <div className="insight-alert">
              <strong>Alert:</strong> You've budgeted ${(totalBudgeted - monthlyIncome).toFixed(2)} more than your income.
            </div>
          )}
          
          {categories.map(category => {
            if (category.spent > category.budgeted) {
              return (
                <div key={`insight-${category.id}`} className="insight-item">
                  <strong>{category.name} is over budget:</strong> You've spent ${(category.spent - category.budgeted).toFixed(2)} more than planned.
                </div>
              );
            }
            return null;
          })}
          
          {availableToSpend < 0 && (
            <div className="insight-alert">
              <strong>Alert:</strong> You've spent ${Math.abs(availableToSpend).toFixed(2)} more than your monthly income.
            </div>
          )}
          
          {categories.filter(cat => cat.name === 'Savings').length > 0 && (
            <div className="insight-item">
              <strong>Savings Goal:</strong> You've set aside ${categories.find(cat => cat.name === 'Savings').budgeted.toFixed(2)} for savings this month.
            </div>
          )}
        </div>
      </div>

      <div className="budget-tools">
        <h2>Budget Tools</h2>
        <div className="tools-container">
          <button>Export Budget Data</button>
          <button>Generate Budget Report</button>
          <button>Set Spending Alerts</button>
          <button>Connect to Accounts</button>
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanner;