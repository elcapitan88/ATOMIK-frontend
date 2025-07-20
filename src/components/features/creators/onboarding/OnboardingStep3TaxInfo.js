import React, { useState } from 'react';
import FormInput from '../../../common/Form/FormInput';
import FormSelect from '../../../common/Form/FormSelect';

const OnboardingStep3TaxInfo = ({ data, onNext, onBack, isSubmitting }) => {
  const [formData, setFormData] = useState({
    businessType: data?.taxInfo?.businessType || '',
    taxId: data?.taxInfo?.taxId || '',
    address: {
      street: data?.taxInfo?.address?.street || '',
      city: data?.taxInfo?.address?.city || '',
      state: data?.taxInfo?.address?.state || '',
      zipCode: data?.taxInfo?.address?.zipCode || '',
      country: data?.taxInfo?.address?.country || 'US'
    }
  });

  const [errors, setErrors] = useState({});

  const businessTypes = [
    { value: '', label: 'Select business type' },
    { value: 'individual', label: 'Individual/Sole Proprietor' },
    { value: 'llc', label: 'LLC' },
    { value: 'corporation', label: 'Corporation' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'other', label: 'Other' }
  ];

  const usStates = [
    { value: '', label: 'Select state' },
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.businessType) {
      newErrors.businessType = 'Business type is required';
    }

    if (formData.businessType !== 'individual' && !formData.taxId.trim()) {
      newErrors.taxId = 'Tax ID is required for business entities';
    } else if (formData.taxId && !isValidTaxId(formData.taxId)) {
      newErrors.taxId = 'Please enter a valid Tax ID (EIN: XX-XXXXXXX or SSN: XXX-XX-XXXX)';
    }

    if (!formData.address.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.address.state) {
      newErrors.state = 'State is required';
    }

    if (!formData.address.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!isValidZipCode(formData.address.zipCode)) {
      newErrors.zipCode = 'Please enter a valid ZIP code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidTaxId = (taxId) => {
    const ein = /^\d{2}-\d{7}$/;
    const ssn = /^\d{3}-\d{2}-\d{4}$/;
    return ein.test(taxId) || ssn.test(taxId);
  };

  const isValidZipCode = (zip) => {
    return /^\d{5}(-\d{4})?$/.test(zip);
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    if (errors[field] || errors[field.split('.')[1]]) {
      setErrors(prev => ({ ...prev, [field]: '', [field.split('.')[1]]: '' }));
    }
  };

  const formatTaxId = (value) => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length <= 9) {
      if (cleaned.length >= 2) {
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 9)}`;
      }
      return cleaned;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onNext({ taxInfo: formData });
    }
  };

  const isFormValid = formData.businessType && formData.address.street && formData.address.city && formData.address.state && formData.address.zipCode;

  return (
    <div className="tax-info-step">
      <div className="step-header">
        <h2>Tax Information</h2>
        <p>This information is required for payment processing and tax reporting</p>
        <div className="security-note">
          <span className="security-icon">🔒</span>
          <span>All information is encrypted and securely stored</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="tax-form">
        <div className="form-section">
          <FormSelect
            label="Business Type *"
            value={formData.businessType}
            onChange={(value) => handleInputChange('businessType', value)}
            options={businessTypes}
            error={errors.businessType}
          />
        </div>

        {formData.businessType && formData.businessType !== 'individual' && (
          <div className="form-section">
            <FormInput
              label="Tax ID (EIN) *"
              placeholder="XX-XXXXXXX"
              value={formData.taxId}
              onChange={(value) => handleInputChange('taxId', formatTaxId(value))}
              error={errors.taxId}
              maxLength={10}
            />
          </div>
        )}

        {formData.businessType === 'individual' && (
          <div className="form-section">
            <FormInput
              label="SSN (Optional)"
              placeholder="XXX-XX-XXXX"
              value={formData.taxId}
              onChange={(value) => handleInputChange('taxId', formatTaxId(value))}
              error={errors.taxId}
              maxLength={11}
              helperText="Optional: Helps with faster payment processing"
            />
          </div>
        )}

        <div className="address-section">
          <h4>Business Address</h4>
          <div className="address-grid">
            <div className="form-section full-width">
              <FormInput
                label="Street Address *"
                placeholder="123 Main Street"
                value={formData.address.street}
                onChange={(value) => handleInputChange('address.street', value)}
                error={errors.street}
              />
            </div>

            <div className="form-section">
              <FormInput
                label="City *"
                placeholder="City"
                value={formData.address.city}
                onChange={(value) => handleInputChange('address.city', value)}
                error={errors.city}
              />
            </div>

            <div className="form-section">
              <FormSelect
                label="State *"
                value={formData.address.state}
                onChange={(value) => handleInputChange('address.state', value)}
                options={usStates}
                error={errors.state}
              />
            </div>

            <div className="form-section">
              <FormInput
                label="ZIP Code *"
                placeholder="12345"
                value={formData.address.zipCode}
                onChange={(value) => handleInputChange('address.zipCode', value)}
                error={errors.zipCode}
                maxLength={10}
              />
            </div>
          </div>
        </div>

        <div className="step-actions">
          <button 
            type="button" 
            className="secondary-button"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </button>
          <button 
            type="submit" 
            className="primary-button"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .tax-info-step {
          max-width: 500px;
          margin: 0 auto;
        }

        .step-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .step-header h2 {
          color: white;
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .step-header p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 16px 0;
        }

        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 8px;
          padding: 8px 16px;
        }

        .security-icon {
          font-size: 16px;
        }

        .tax-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-section {
          position: relative;
        }

        .address-section h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        .address-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .step-actions {
          display: flex;
          gap: 12px;
          justify-content: space-between;
          margin-top: 32px;
        }

        .primary-button, .secondary-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .primary-button {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          flex: 1;
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
        }

        .primary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .secondary-button {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .secondary-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
};

export default OnboardingStep3TaxInfo;