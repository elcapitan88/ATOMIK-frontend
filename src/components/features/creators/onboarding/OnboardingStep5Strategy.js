import React, { useState, useEffect } from 'react';
import { FormSelect } from '../../../common/Form/FormSelect';
import { useStrategies } from '../../../../hooks/useStrategies';
import { PricingSetupForm } from '../pricing/PricingSetupForm';

const OnboardingStep5Strategy = ({ data, onNext, onBack, isSubmitting }) => {
  const { strategies, loading: strategiesLoading, fetchUserStrategies } = useStrategies();
  const [selectedStrategy, setSelectedStrategy] = useState(data?.strategy?.strategyId || '');
  const [pricingData, setPricingData] = useState(data?.strategy?.pricing || {
    type: 'monthly',
    price: 29,
    freeTrial: false,
    trialDays: 0
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUserStrategies();
  }, [fetchUserStrategies]);

  const strategyOptions = [
    { value: '', label: 'Select a strategy to monetize' },
    ...strategies.map(strategy => ({
      value: strategy.id,
      label: `${strategy.name} (${strategy.description?.substring(0, 50)}...)`
    }))
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!selectedStrategy) {
      newErrors.strategy = 'Please select a strategy to monetize';
    }

    if (!pricingData.price || pricingData.price <= 0) {
      newErrors.price = 'Price must be greater than $0';
    } else if (pricingData.price < 5) {
      newErrors.price = 'Minimum price is $5';
    } else if (pricingData.price > 999) {
      newErrors.price = 'Maximum price is $999';
    }

    if (pricingData.freeTrial && (!pricingData.trialDays || pricingData.trialDays < 1)) {
      newErrors.trialDays = 'Trial period must be at least 1 day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStrategyChange = (strategyId) => {
    setSelectedStrategy(strategyId);
    if (errors.strategy) {
      setErrors(prev => ({ ...prev, strategy: '' }));
    }
  };

  const handlePricingChange = (newPricingData) => {
    setPricingData(newPricingData);
    // Clear pricing-related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.price;
      delete newErrors.trialDays;
      return newErrors;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onNext({
        strategy: {
          strategyId: selectedStrategy,
          pricing: pricingData
        }
      });
    }
  };

  const selectedStrategyData = strategies.find(s => s.id === selectedStrategy);

  return (
    <div className="strategy-step">
      <div className="step-header">
        <h2>Choose Your Strategy</h2>
        <p>Select a strategy to monetize and set your pricing</p>
      </div>

      <form onSubmit={handleSubmit} className="strategy-form">
        <div className="form-section">
          <FormSelect
            label="Strategy to Monetize *"
            value={selectedStrategy}
            onChange={handleStrategyChange}
            options={strategyOptions}
            error={errors.strategy}
            loading={strategiesLoading}
          />
          
          {!strategiesLoading && strategies.length === 0 && (
            <div className="no-strategies-notice">
              <div className="notice-icon">📈</div>
              <div className="notice-content">
                <h4>No Strategies Found</h4>
                <p>You need to create at least one strategy before becoming a creator.</p>
                <button 
                  type="button" 
                  className="create-strategy-button"
                  onClick={() => window.open('/strategies', '_blank')}
                >
                  Create Your First Strategy
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedStrategyData && (
          <div className="strategy-preview">
            <h4>Selected Strategy</h4>
            <div className="strategy-card">
              <div className="strategy-info">
                <h5>{selectedStrategyData.name}</h5>
                <p>{selectedStrategyData.description}</p>
              </div>
              <div className="strategy-stats">
                <div className="stat-item">
                  <span className="stat-label">Performance</span>
                  <span className="stat-value positive">
                    +{selectedStrategyData.performance || '12.5'}%
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Trades</span>
                  <span className="stat-value">
                    {selectedStrategyData.totalTrades || '247'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedStrategy && (
          <div className="pricing-section">
            <h4>Set Your Pricing</h4>
            <p className="pricing-subtitle">
              Choose how much to charge for access to your strategy
            </p>
            
            <PricingSetupForm
              initialData={pricingData}
              onChange={handlePricingChange}
              errors={errors}
            />
            
            <div className="earnings-preview">
              <h5>Estimated Monthly Earnings</h5>
              <div className="earnings-breakdown">
                <div className="earnings-item">
                  <span>10 subscribers × ${pricingData.price}</span>
                  <span>${(10 * pricingData.price).toFixed(0)}</span>
                </div>
                <div className="earnings-item">
                  <span>Platform fee (5%)</span>
                  <span>-${(10 * pricingData.price * 0.05).toFixed(0)}</span>
                </div>
                <div className="earnings-item total">
                  <span>Your earnings</span>
                  <span>${(10 * pricingData.price * 0.95).toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
            disabled={!selectedStrategy || !pricingData.price || pricingData.price <= 0 || isSubmitting}
          >
            {isSubmitting ? 'Setting up...' : 'Complete Setup'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .strategy-step {
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
          margin: 0;
        }

        .strategy-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-section {
          position: relative;
        }

        .no-strategies-notice {
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }

        .notice-icon {
          font-size: 24px;
        }

        .notice-content h4 {
          color: #fbbf24;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .notice-content p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 16px 0;
          font-size: 14px;
        }

        .create-strategy-button {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .create-strategy-button:hover {
          transform: translateY(-1px);
        }

        .strategy-preview {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 20px;
        }

        .strategy-preview h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        .strategy-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 16px;
        }

        .strategy-info h5 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .strategy-info p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          margin: 0 0 16px 0;
        }

        .strategy-stats {
          display: flex;
          gap: 24px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 500;
        }

        .stat-value {
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .stat-value.positive {
          color: #10b981;
        }

        .pricing-section {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 24px;
        }

        .pricing-section h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .pricing-subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          margin: 0 0 24px 0;
        }

        .earnings-preview {
          margin-top: 24px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 16px;
        }

        .earnings-preview h5 {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }

        .earnings-breakdown {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .earnings-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .earnings-item span:first-child {
          color: rgba(255, 255, 255, 0.7);
        }

        .earnings-item span:last-child {
          color: white;
          font-weight: 500;
        }

        .earnings-item.total {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 8px;
          margin-top: 4px;
          font-weight: 600;
        }

        .earnings-item.total span {
          color: #10b981;
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

export default OnboardingStep5Strategy;