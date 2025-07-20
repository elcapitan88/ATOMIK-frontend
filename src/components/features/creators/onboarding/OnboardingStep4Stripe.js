import React, { useState, useEffect } from 'react';

const OnboardingStep4Stripe = ({ data, onNext, onBack, isSubmitting }) => {
  const [stripeStatus, setStripeStatus] = useState('pending'); // pending, connecting, connected, error
  const [errorMessage, setErrorMessage] = useState('');
  const [accountDetails, setAccountDetails] = useState(null);

  useEffect(() => {
    if (data?.stripe?.accountId && data?.stripe?.onboardingComplete) {
      setStripeStatus('connected');
      setAccountDetails(data.stripe);
    }
  }, [data]);

  const handleStripeConnect = async () => {
    setStripeStatus('connecting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/v1/creators/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          businessType: data.taxInfo.businessType,
          country: data.taxInfo.address.country,
          baseUrl: window.location.origin
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to connect Stripe account');
      }

      window.location.href = result.onboardingUrl;
      
    } catch (error) {
      console.error('Stripe connection error:', error);
      setErrorMessage(error.message);
      setStripeStatus('error');
    }
  };

  const handleRetry = () => {
    setStripeStatus('pending');
    setErrorMessage('');
  };

  const handleContinue = () => {
    if (stripeStatus === 'connected') {
      onNext({ 
        stripe: {
          accountId: accountDetails.accountId,
          onboardingComplete: true
        }
      });
    }
  };

  const renderContent = () => {
    switch (stripeStatus) {
      case 'pending':
        return (
          <div className="stripe-pending">
            <div className="stripe-icon">
              <svg width="60" height="25" viewBox="0 0 60 25" fill="none">
                <path d="M59.5759 10.6602C59.5759 9.61426 58.9219 8.96875 57.8164 8.96875H53.8711V12.3516H57.8164C58.9219 12.3516 59.5759 11.7061 59.5759 10.6602Z" fill="#635BFF"/>
                <path d="M24.9219 15.4297C23.6602 15.4297 22.6953 14.4648 22.6953 13.2031V7.11719C22.6953 5.85547 23.6602 4.89062 24.9219 4.89062C26.1836 4.89062 27.1484 5.85547 27.1484 7.11719V13.2031C27.1484 14.4648 26.1836 15.4297 24.9219 15.4297Z" fill="#635BFF"/>
                <path d="M34.5781 15.4297C33.3164 15.4297 32.3516 14.4648 32.3516 13.2031V7.11719C32.3516 5.85547 33.3164 4.89062 34.5781 4.89062C35.8398 4.89062 36.8047 5.85547 36.8047 7.11719V13.2031C36.8047 14.4648 35.8398 15.4297 34.5781 15.4297Z" fill="#635BFF"/>
              </svg>
            </div>
            <h3>Connect Your Stripe Account</h3>
            <p>
              To receive payments from your strategy subscribers, you'll need to connect a Stripe account. 
              Stripe handles all payment processing securely.
            </p>
            
            <div className="benefits-list">
              <div className="benefit-item">
                <span className="check-icon">✓</span>
                <span>Secure payment processing</span>
              </div>
              <div className="benefit-item">
                <span className="check-icon">✓</span>
                <span>Automatic payouts to your bank account</span>
              </div>
              <div className="benefit-item">
                <span className="check-icon">✓</span>
                <span>Tax reporting and 1099 forms</span>
              </div>
              <div className="benefit-item">
                <span className="check-icon">✓</span>
                <span>Support for 40+ countries</span>
              </div>
            </div>

            <button 
              className="stripe-connect-button"
              onClick={handleStripeConnect}
              disabled={isSubmitting}
            >
              <span className="stripe-logo">
                <svg width="32" height="14" viewBox="0 0 32 14" fill="white">
                  <path d="M13.3 0c-1.8 0-2.9 1.5-2.9 3.5s1.1 3.5 2.9 3.5c1.8 0 2.9-1.5 2.9-3.5s-1.1-3.5-2.9-3.5zm0 5.8c-1.2 0-1.9-1-1.9-2.3s.7-2.3 1.9-2.3 1.9 1 1.9 2.3-.7 2.3-1.9 2.3z"/>
                  <path d="M9.6 7v6.4h-1V7.6c0-.6-.3-1-.9-1s-1 .4-1 1V13.4h-1V4.6h1v2.1c.3-.4.8-.7 1.4-.7 1 0 1.5.7 1.5 1.6V7z"/>
                  <path d="M21.8 0c-1.8 0-2.9 1.5-2.9 3.5s1.1 3.5 2.9 3.5c1.8 0 2.9-1.5 2.9-3.5s-1.1-3.5-2.9-3.5zm0 5.8c-1.2 0-1.9-1-1.9-2.3s.7-2.3 1.9-2.3 1.9 1 1.9 2.3-.7 2.3-1.9 2.3z"/>
                </svg>
              </span>
              Connect with Stripe
            </button>
          </div>
        );

      case 'connecting':
        return (
          <div className="stripe-connecting">
            <div className="loading-spinner"></div>
            <h3>Connecting to Stripe...</h3>
            <p>You'll be redirected to Stripe to complete your account setup.</p>
          </div>
        );

      case 'connected':
        return (
          <div className="stripe-connected">
            <div className="success-icon">✓</div>
            <h3>Stripe Account Connected!</h3>
            <p>Your payment processing is all set up. You can now receive payments from subscribers.</p>
            
            {accountDetails && (
              <div className="account-details">
                <div className="detail-item">
                  <span className="detail-label">Account Status:</span>
                  <span className="detail-value status-active">Active</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Payouts:</span>
                  <span className="detail-value">Enabled</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'error':
        return (
          <div className="stripe-error">
            <div className="error-icon">⚠️</div>
            <h3>Connection Failed</h3>
            <p className="error-message">{errorMessage}</p>
            <button 
              className="retry-button"
              onClick={handleRetry}
            >
              Try Again
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="stripe-step">
      <div className="step-header">
        <h2>Payment Setup</h2>
        <p>Connect your Stripe account to start earning from your strategies</p>
      </div>

      <div className="stripe-content">
        {renderContent()}
      </div>

      <div className="step-actions">
        <button 
          type="button" 
          className="secondary-button"
          onClick={onBack}
          disabled={isSubmitting || stripeStatus === 'connecting'}
        >
          Back
        </button>
        <button 
          type="button" 
          className="primary-button"
          onClick={handleContinue}
          disabled={stripeStatus !== 'connected' || isSubmitting}
        >
          Continue
        </button>
      </div>

      <style jsx>{`
        .stripe-step {
          max-width: 500px;
          margin: 0 auto;
        }

        .step-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .step-header h2 {
          color: white;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 6px 0;
        }

        .step-header p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-size: 14px;
        }

        .stripe-content {
          text-align: center;
          margin-bottom: 24px;
        }

        .stripe-pending, .stripe-connecting, .stripe-connected, .stripe-error {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 24px 20px;
        }

        .stripe-icon, .success-icon, .error-icon {
          margin-bottom: 16px;
        }

        .success-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          margin: 0 auto 16px;
        }

        .error-icon {
          font-size: 36px;
          margin-bottom: 16px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-top: 2px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .stripe-content h3 {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .stripe-content p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 16px 0;
          line-height: 1.4;
          font-size: 14px;
        }

        .benefits-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
          text-align: left;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
        }

        .check-icon {
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
          font-weight: bold;
          flex-shrink: 0;
        }

        .stripe-connect-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #635bff;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .stripe-connect-button:hover:not(:disabled) {
          background: #5a52ff;
          transform: translateY(-1px);
        }

        .stripe-connect-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .account-details {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          padding: 12px;
          margin-top: 16px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
        }

        .detail-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
        }

        .detail-value {
          color: white;
          font-weight: 500;
          font-size: 12px;
        }

        .status-active {
          color: #10b981;
        }

        .error-message {
          color: #ef4444 !important;
          margin-bottom: 16px !important;
        }

        .retry-button {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .step-actions {
          display: flex;
          gap: 12px;
          justify-content: space-between;
        }

        .primary-button, .secondary-button {
          padding: 10px 20px;
          border-radius: 6px;
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

export default OnboardingStep4Stripe;