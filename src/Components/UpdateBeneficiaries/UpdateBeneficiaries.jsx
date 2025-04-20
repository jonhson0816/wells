import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './UpdateBeneficiaries.css';

const UpdateBeneficiaries = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [account, setAccount] = useState(location.state?.account || null);
  const [beneficiaries, setBeneficiaries] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      relationship: 'Spouse',
      ssn: '***-**-4321',
      dateOfBirth: '05/12/1985',
      percentage: 75,
      address: '123 Main St, San Francisco, CA 94105',
      email: 'sarah.j@example.com',
      phone: '(415) 555-1234',
      type: 'Primary'
    },
    {
      id: 2,
      name: 'Michael Johnson',
      relationship: 'Child',
      ssn: '***-**-8765',
      dateOfBirth: '10/24/2010',
      percentage: 25,
      address: '123 Main St, San Francisco, CA 94105',
      email: 'parent.for.michael@example.com',
      phone: '(415) 555-5678',
      type: 'Primary'
    }
  ]);
  const [contingentBeneficiaries, setContingentBeneficiaries] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentBeneficiary, setCurrentBeneficiary] = useState(null);
  const [beneficiaryType, setBeneficiaryType] = useState('Primary');
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [totalPrimaryPercentage, setTotalPrimaryPercentage] = useState(100);
  const [totalContingentPercentage, setTotalContingentPercentage] = useState(0);

  // New beneficiary template
  const emptyBeneficiary = {
    name: '',
    relationship: '',
    ssn: '',
    dateOfBirth: '',
    percentage: '',
    address: '',
    email: '',
    phone: '',
    type: 'Primary'
  };

  // Load account data if not provided in location state
  useEffect(() => {
    if (!account) {
      // Mock data in case no account was provided
      setAccount({
        id: 'ret001',
        type: 'Retirement Account',
        balance: 125000.00,
        accountNumber: '****7890',
        routingNumber: '121000248',
        retirementType: '401(k)',
        taxStatus: 'Tax-Advantaged'
      });
    }
  }, [account]);

  // Calculate total percentages
  useEffect(() => {
    const primaryTotal = beneficiaries
      .filter(b => b.type === 'Primary')
      .reduce((sum, b) => sum + Number(b.percentage), 0);
    
    const contingentTotal = beneficiaries
      .filter(b => b.type === 'Contingent')
      .reduce((sum, b) => sum + Number(b.percentage), 0);
    
    setTotalPrimaryPercentage(primaryTotal);
    setTotalContingentPercentage(contingentTotal);
  }, [beneficiaries]);

  const openAddModal = (type) => {
    setBeneficiaryType(type);
    setCurrentBeneficiary({...emptyBeneficiary, type: type});
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const openEditModal = (beneficiary) => {
    setCurrentBeneficiary({...beneficiary});
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (beneficiary) => {
    setCurrentBeneficiary(beneficiary);
    setIsDeleteModalOpen(true);
  };

  const closeAllModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setCurrentBeneficiary(null);
    setFormErrors({});
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const goToAccountPage = () => {
    navigate(`/retirement-account/${account.id}`, { state: { account } });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentBeneficiary(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!currentBeneficiary.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!currentBeneficiary.relationship.trim()) {
      errors.relationship = 'Relationship is required';
    }
    
    if (!currentBeneficiary.percentage.toString().trim()) {
      errors.percentage = 'Percentage is required';
    } else if (isNaN(currentBeneficiary.percentage) || 
        Number(currentBeneficiary.percentage) <= 0 || 
        Number(currentBeneficiary.percentage) > 100) {
      errors.percentage = 'Percentage must be between 1 and 100';
    } else {
      // Check if total percentage would exceed 100%
      const otherBeneficiariesTotal = beneficiaries
        .filter(b => b.type === currentBeneficiary.type && b.id !== currentBeneficiary.id)
        .reduce((sum, b) => sum + Number(b.percentage), 0);
      
      const newTotal = otherBeneficiariesTotal + Number(currentBeneficiary.percentage);
      
      if (newTotal > 100) {
        errors.percentage = `Total percentage cannot exceed 100%. Current total: ${otherBeneficiariesTotal}%`;
      }
    }
    
    if (!currentBeneficiary.dateOfBirth.trim()) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    
    if (!currentBeneficiary.ssn.trim()) {
      errors.ssn = 'SSN is required';
    }
    
    return errors;
  };

  const addBeneficiary = () => {
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    const newBeneficiary = {
      ...currentBeneficiary,
      id: Date.now(), // Generate unique ID
      percentage: Number(currentBeneficiary.percentage)
    };
    
    setBeneficiaries(prev => [...prev, newBeneficiary]);
    setSuccessMessage('Beneficiary added successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
    closeAllModals();
  };

  const updateBeneficiary = () => {
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setBeneficiaries(prev => 
      prev.map(b => b.id === currentBeneficiary.id ? 
        {...currentBeneficiary, percentage: Number(currentBeneficiary.percentage)} : b)
    );
    
    setSuccessMessage('Beneficiary updated successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
    closeAllModals();
  };

  const deleteBeneficiary = () => {
    setBeneficiaries(prev => prev.filter(b => b.id !== currentBeneficiary.id));
    setSuccessMessage('Beneficiary removed successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
    closeAllModals();
  };

  const saveAllChanges = () => {
    const primaryTotal = beneficiaries
      .filter(b => b.type === 'Primary')
      .reduce((sum, b) => sum + Number(b.percentage), 0);
    
    if (primaryTotal !== 100) {
      setFormErrors({
        savePrimary: `Primary beneficiaries must total exactly 100%. Current: ${primaryTotal}%`
      });
      return;
    }
    
    const contingentTotal = beneficiaries
      .filter(b => b.type === 'Contingent')
      .reduce((sum, b) => sum + Number(b.percentage), 0);
    
    if (contingentTotal > 0 && contingentTotal !== 100) {
      setFormErrors({
        saveContingent: `Contingent beneficiaries must total exactly 100%. Current: ${contingentTotal}%`
      });
      return;
    }
    
    // In a real app, this would send data to the backend
    setSuccessMessage('All beneficiary changes have been saved successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
    setFormErrors({});
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  const formatSSN = (ssn) => {
    if (!ssn) return '';
    return ssn.replace(/^(\d{3})(\d{2})(\d{4})$/, '$1-$2-$3');
  };

  return (
    <div className="upd0011-update-beneficiaries-page">
      <header className="upd0011-account-page-header">
        <div className="upd0011-back-button" onClick={goToAccountPage}>
          <span className="upd0011-back-arrow">&#8592;</span> Back to Account
        </div>
        <div className="upd0011-wells-fargo-branding">
          <div className="upd0011-logo-container">
            <img src="/Images/wells fargo.jpeg" alt="Wells Fargo Logo" className="upd0011-wf-logo" />
          </div>
        </div>
      </header>

      <div className="upd0011-page-content">
        <div className="upd0011-page-header">
          <h1>Update Beneficiaries</h1>
          <p className="upd0011-account-number">Account: {account?.accountNumber} ({account?.retirementType})</p>
        </div>

        {successMessage && (
          <div className="upd0011-success-message">
            <span className="upd0011-success-icon">✓</span> {successMessage}
          </div>
        )}

        <div className="upd0011-beneficiaries-section">
          <div className="upd0011-section-header">
            <h2>Primary Beneficiaries ({totalPrimaryPercentage}%)</h2>
            <button 
              className="upd0011-add-beneficiary-button" 
              onClick={() => openAddModal('Primary')}
            >
              Add Primary Beneficiary
            </button>
          </div>

          {formErrors.savePrimary && (
            <div className="upd0011-error-message">
              <span className="upd0011-error-icon">!</span> {formErrors.savePrimary}
            </div>
          )}

          <div className="upd0011-beneficiaries-table-container">
            <table className="upd0011-beneficiaries-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Relationship</th>
                  <th>SSN</th>
                  <th>Date of Birth</th>
                  <th>Percentage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaries.filter(b => b.type === 'Primary').length === 0 ? (
                  <tr>
                    <td colSpan="6" className="upd0011-no-beneficiaries">
                      No primary beneficiaries have been added.
                    </td>
                  </tr>
                ) : (
                  beneficiaries
                    .filter(b => b.type === 'Primary')
                    .map(beneficiary => (
                      <tr key={beneficiary.id}>
                        <td>{beneficiary.name}</td>
                        <td>{beneficiary.relationship}</td>
                        <td>{beneficiary.ssn}</td>
                        <td>{beneficiary.dateOfBirth}</td>
                        <td>{beneficiary.percentage}%</td>
                        <td className="upd0011-actions-cell">
                          <button 
                            className="upd0011-edit-button" 
                            onClick={() => openEditModal(beneficiary)}
                          >
                            Edit
                          </button>
                          <button 
                            className="upd0011-delete-button" 
                            onClick={() => openDeleteModal(beneficiary)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          <div className="upd0011-section-header upd0011-contingent-header">
            <h2>Contingent Beneficiaries ({totalContingentPercentage}%)</h2>
            <button 
              className="upd0011-add-beneficiary-button" 
              onClick={() => openAddModal('Contingent')}
            >
              Add Contingent Beneficiary
            </button>
          </div>

          {formErrors.saveContingent && (
            <div className="upd0011-error-message">
              <span className="upd0011-error-icon">!</span> {formErrors.saveContingent}
            </div>
          )}

          <div className="upd0011-beneficiaries-table-container">
            <table className="upd0011-beneficiaries-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Relationship</th>
                  <th>SSN</th>
                  <th>Date of Birth</th>
                  <th>Percentage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaries.filter(b => b.type === 'Contingent').length === 0 ? (
                  <tr>
                    <td colSpan="6" className="upd0011-no-beneficiaries">
                      No contingent beneficiaries have been added.
                    </td>
                  </tr>
                ) : (
                  beneficiaries
                    .filter(b => b.type === 'Contingent')
                    .map(beneficiary => (
                      <tr key={beneficiary.id}>
                        <td>{beneficiary.name}</td>
                        <td>{beneficiary.relationship}</td>
                        <td>{beneficiary.ssn}</td>
                        <td>{beneficiary.dateOfBirth}</td>
                        <td>{beneficiary.percentage}%</td>
                        <td className="upd0011-actions-cell">
                          <button 
                            className="upd0011-edit-button" 
                            onClick={() => openEditModal(beneficiary)}
                          >
                            Edit
                          </button>
                          <button 
                            className="upd0011-delete-button" 
                            onClick={() => openDeleteModal(beneficiary)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="upd0011-info-section">
          <div className="upd0011-info-card">
            <h3><span className="upd0011-info-icon">i</span> About Beneficiaries</h3>
            <p>The people you select as beneficiaries will receive your retirement account assets in the event of your death. You can designate both primary and contingent beneficiaries.</p>
            <ul>
              <li><strong>Primary Beneficiaries:</strong> The first people in line to receive your assets. Must total 100%.</li>
              <li><strong>Contingent Beneficiaries:</strong> Will receive your assets if all primary beneficiaries are deceased. Must total 100% if any are added.</li>
            </ul>
          </div>
        </div>

        <div className="upd0011-actions-section">
          <button className="upd0011-cancel-button" onClick={goToAccountPage}>
            Cancel
          </button>
          <button className="upd0011-save-button" onClick={saveAllChanges}>
            Save Changes
          </button>
        </div>
      </div>

      {/* Add Beneficiary Modal */}
      {isAddModalOpen && (
        <div className="upd0011-modal-overlay">
          <div className="upd0011-modal-content">
            <div className="upd0011-modal-header">
              <h2>Add {beneficiaryType} Beneficiary</h2>
              <button className="upd0011-close-button" onClick={closeAllModals}>×</button>
            </div>
            <div className="upd0011-modal-body">
              <div className="upd0011-form-row">
                <div className="upd0011-form-group">
                  <label>Full Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={currentBeneficiary?.name || ''}
                    onChange={handleInputChange}
                    className={formErrors.name ? "upd0011-input-error" : ""}
                  />
                  {formErrors.name && <div className="upd0011-error-text">{formErrors.name}</div>}
                </div>
                <div className="upd0011-form-group">
                  <label>Relationship*</label>
                  <select
                    name="relationship"
                    value={currentBeneficiary?.relationship || ''}
                    onChange={handleInputChange}
                    className={formErrors.relationship ? "upd0011-input-error" : ""}
                  >
                    <option value="">Select a relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other Relative">Other Relative</option>
                    <option value="Friend">Friend</option>
                    <option value="Trust">Trust</option>
                    <option value="Estate">Estate</option>
                    <option value="Charity">Charity</option>
                  </select>
                  {formErrors.relationship && <div className="upd0011-error-text">{formErrors.relationship}</div>}
                </div>
              </div>

              <div className="upd0011-form-row">
                <div className="upd0011-form-group">
                  <label>Social Security Number*</label>
                  <input
                    type="text"
                    name="ssn"
                    placeholder="xxx-xx-xxxx"
                    value={currentBeneficiary?.ssn || ''}
                    onChange={handleInputChange}
                    className={formErrors.ssn ? "upd0011-input-error" : ""}
                  />
                  {formErrors.ssn && <div className="upd0011-error-text">{formErrors.ssn}</div>}
                </div>
                <div className="upd0011-form-group">
                  <label>Date of Birth*</label>
                  <input
                    type="text"
                    name="dateOfBirth"
                    placeholder="MM/DD/YYYY"
                    value={currentBeneficiary?.dateOfBirth || ''}
                    onChange={handleInputChange}
                    className={formErrors.dateOfBirth ? "upd0011-input-error" : ""}
                  />
                  {formErrors.dateOfBirth && <div className="upd0011-error-text">{formErrors.dateOfBirth}</div>}
                </div>
              </div>

              <div className="upd0011-form-row">
                <div className="upd0011-form-group">
                  <label>Percentage of Benefits*</label>
                  <div className="upd0011-percentage-input">
                    <input
                      type="number"
                      name="percentage"
                      min="1"
                      max="100"
                      value={currentBeneficiary?.percentage || ''}
                      onChange={handleInputChange}
                      className={formErrors.percentage ? "upd0011-input-error" : ""}
                    />
                    <span className="upd0011-percentage-symbol">%</span>
                  </div>
                  {formErrors.percentage && <div className="upd0011-error-text">{formErrors.percentage}</div>}
                </div>
                <div className="upd0011-form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="(xxx) xxx-xxxx"
                    value={currentBeneficiary?.phone || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="upd0011-form-row">
                <div className="upd0011-form-group upd0011-full-width">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={currentBeneficiary?.address || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="upd0011-form-row">
                <div className="upd0011-form-group upd0011-full-width">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={currentBeneficiary?.email || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="upd0011-required-note">* Required fields</div>
            </div>
            <div className="upd0011-modal-footer">
              <button className="upd0011-cancel-button" onClick={closeAllModals}>Cancel</button>
              <button className="upd0011-add-button" onClick={addBeneficiary}>Add Beneficiary</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Beneficiary Modal */}
      {isEditModalOpen && (
        <div className="upd0011-modal-overlay">
          <div className="upd0011-modal-content">
            <div className="upd0011-modal-header">
              <h2>Edit {currentBeneficiary?.type} Beneficiary</h2>
              <button className="upd0011-close-button" onClick={closeAllModals}>×</button>
            </div>
            <div className="upd0011-modal-body">
              <div className="upd0011-form-row">
                <div className="upd0011-form-group">
                  <label>Full Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={currentBeneficiary?.name || ''}
                    onChange={handleInputChange}
                    className={formErrors.name ? "upd0011-input-error" : ""}
                  />
                  {formErrors.name && <div className="upd0011-error-text">{formErrors.name}</div>}
                </div>
                <div className="upd0011-form-group">
                  <label>Relationship*</label>
                  <select
                    name="relationship"
                    value={currentBeneficiary?.relationship || ''}
                    onChange={handleInputChange}
                    className={formErrors.relationship ? "upd0011-input-error" : ""}
                  >
                    <option value="">Select a relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other Relative">Other Relative</option>
                    <option value="Friend">Friend</option>
                    <option value="Trust">Trust</option>
                    <option value="Estate">Estate</option>
                    <option value="Charity">Charity</option>
                  </select>
                  {formErrors.relationship && <div className="upd0011-error-text">{formErrors.relationship}</div>}
                </div>
              </div>

              <div className="upd0011-form-row">
                <div className="upd0011-form-group">
                  <label>Social Security Number*</label>
                  <input
                    type="text"
                    name="ssn"
                    placeholder="xxx-xx-xxxx"
                    value={currentBeneficiary?.ssn || ''}
                    onChange={handleInputChange}
                    className={formErrors.ssn ? "upd0011-input-error" : ""}
                  />
                  {formErrors.ssn && <div className="upd0011-error-text">{formErrors.ssn}</div>}
                </div>
                <div className="upd0011-form-group">
                  <label>Date of Birth*</label>
                  <input
                    type="text"
                    name="dateOfBirth"
                    placeholder="MM/DD/YYYY"
                    value={currentBeneficiary?.dateOfBirth || ''}
                    onChange={handleInputChange}
                    className={formErrors.dateOfBirth ? "upd0011-input-error" : ""}
                  />
                  {formErrors.dateOfBirth && <div className="upd0011-error-text">{formErrors.dateOfBirth}</div>}
                </div>
              </div>

              <div className="upd0011-form-row">
                <div className="upd0011-form-group">
                  <label>Percentage of Benefits*</label>
                  <div className="upd0011-percentage-input">
                    <input
                      type="number"
                      name="percentage"
                      min="1"
                      max="100"
                      value={currentBeneficiary?.percentage || ''}
                      onChange={handleInputChange}
                      className={formErrors.percentage ? "upd0011-input-error" : ""}
                    />
                    <span className="upd0011-percentage-symbol">%</span>
                  </div>
                  {formErrors.percentage && <div className="upd0011-error-text">{formErrors.percentage}</div>}
                </div>
                <div className="upd0011-form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="(xxx) xxx-xxxx"
                    value={currentBeneficiary?.phone || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="upd0011-form-row">
                <div className="upd0011-form-group upd0011-full-width">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={currentBeneficiary?.address || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="upd0011-form-row">
                <div className="upd0011-form-group upd0011-full-width">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={currentBeneficiary?.email || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="upd0011-required-note">* Required fields</div>
            </div>
            <div className="upd0011-modal-footer">
              <button className="upd0011-cancel-button" onClick={closeAllModals}>Cancel</button>
              <button className="upd0011-save-button" onClick={updateBeneficiary}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="upd0011-modal-overlay">
          <div className="upd0011-modal-content upd0011-confirm-modal">
            <div className="upd0011-modal-header">
              <h2>Remove Beneficiary</h2>
              <button className="upd0011-close-button" onClick={closeAllModals}>×</button>
            </div>
            <div className="upd0011-modal-body">
              <div className="upd0011-warning-icon">⚠️</div>
              <p className="upd0011-confirm-message">
                Are you sure you want to remove <strong>{currentBeneficiary?.name}</strong> as a beneficiary from this account?
              </p>
              <p className="upd0011-sub-message">
                This action cannot be undone. You'll need to add them again if you change your mind.
              </p>
            </div>
            <div className="upd0011-modal-footer">
              <button className="upd0011-cancel-button" onClick={closeAllModals}>Cancel</button>
              <button className="upd0011-delete-confirm-button" onClick={deleteBeneficiary}>
                Remove Beneficiary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateBeneficiaries;