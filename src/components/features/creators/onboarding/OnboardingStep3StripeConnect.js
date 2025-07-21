import React, { useState } from 'react';
import axiosInstance from '../../../../services/axiosConfig';

const OnboardingStep3StripeConnect = ({ data, onNext, onBack, isSubmitting }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(data?.stripe?.onboardingComplete ? 'completed' : 'pending');

  const handleStripeConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Call backend to create Stripe Connect account link
      const response = await axiosInstance.post('/api/v1/creators/setup-stripe-connect', {
        refresh_url: window.location.href,
        return_url: `${window.location.origin}/creator/onboarding/stripe-return`
      });

      const result = response.data;
      
      // Redirect to Stripe's hosted onboarding
      window.location.href = result.account_link_url;
      
    } catch (error) {
      console.error('Stripe Connect setup failed:', error);
      setIsConnecting(false);
      // Could add error toast here
    }
  };

  const handleContinue = () => {
    onNext({ 
      stripe: { 
        accountId: data?.stripe?.accountId || null,
        onboardingComplete: connectionStatus === 'completed' 
      } 
    });
  };

  return (
    <div className="stripe-connect-step">
      <div className="step-header">
        <h2>Connect with Stripe</h2>
        <p>Connect your Stripe account to start earning from your strategies</p>
      </div>

      <div className="stripe-info-card">
        <div className="stripe-icon">
          <svg width="40" height="17" viewBox="0 0 40 17" fill="none">
            <path d="M40 5.7c0-3.2-2.1-5.7-5.1-5.7-3 0-5.1 2.5-5.1 5.7 0 3.8 2.7 5.7 6.1 5.7 1.8 0 3.1-.4 4.1-.9v-2.3c-1 .5-2.2.7-3.5.7-1.4 0-2.7-.5-2.9-2.1h7.3c0-.4.1-.7.1-1.1zm-7.3-1c0-1.4 1.1-2.2 2.2-2.2s2.1.8 2.1 2.2h-4.3zm-4.4-4.6c-1.2 0-2 .6-2.4 1h-.1V.3h-2.8v10.9h2.8V6.9c0-1.3.6-2 1.6-2s1.5.7 1.5 2v4.3h2.8V6.4c0-2.4-1.2-3.8-3.4-3.8zm-6.8 0c-1.7 0-2.8.8-2.8.8l.9 2.2s.9-.6 1.8-.6c.8 0 1.2.4 1.2 1v.1c-2.4.1-4.9.9-4.9 3.2 0 1.9 1.4 2.8 3 2.8 1.5 0 2.3-.7 2.7-1.2h.1l.2 1h2.4V6.7c0-2.2-1.3-3.6-4.6-3.6zm1.8 6.8c0 .9-.8 1.6-1.8 1.6-.7 0-1.2-.4-1.2-1 0-1 1.3-1.2 3-1.3v.7zm-7.8-6.8c-1.2 0-2 .6-2.4 1h-.1V.3h-2.8v10.9h2.8V6.9c0-1.3.6-2 1.6-2s1.5.7 1.5 2v4.3h2.8V6.4c0-2.4-1.2-3.8-3.4-3.8zm-8.4 5.6V3.7h2.9V1.2h-2.9V.3h-2.8v.9h-1.4v2.5h1.4v5.1c0 2.3 1.3 3.4 3.7 3.4.8 0 1.5-.1 1.9-.3v-2.4c-.3.1-.7.2-1.1.2-.8 0-1.3-.4-1.3-1.2z" fill="#00C6E0"/>
          </svg>
        </div>
        
        <div className="stripe-content">
          <h3>Why Stripe?</h3>
          <ul className="benefits-list">
            <li>
              <span className="check-icon">✓</span>
              <span>Secure payment processing</span>
            </li>
            <li>
              <span className="check-icon">✓</span>
              <span>Automatic tax compliance</span>
            </li>
            <li>
              <span className="check-icon">✓</span>
              <span>Fast payouts (2-7 business days)</span>
            </li>
            <li>
              <span className="check-icon">✓</span>
              <span>Global payment support</span>
            </li>
          </ul>
        </div>
      </div>

      {connectionStatus === 'pending' && (
        <div className="connection-action">
          <p className="connection-description">
            Click below to securely connect your Stripe account. You'll be redirected to Stripe's 
            secure onboarding process where you can provide your business information.
          </p>
          
          <button 
            onClick={handleStripeConnect}
            disabled={isConnecting}
            className="stripe-connect-button"
          >
            {isConnecting ? (
              <span className="connecting">
                <span className="spinner"></span>
                Connecting...
              </span>
            ) : (
              <>
                <span className="stripe-logo">
                  <svg width="32" height="14" viewBox="0 0 40 17" fill="none">
                    <path d="M40 5.7c0-3.2-2.1-5.7-5.1-5.7-3 0-5.1 2.5-5.1 5.7 0 3.8 2.7 5.7 6.1 5.7 1.8 0 3.1-.4 4.1-.9v-2.3c-1 .5-2.2.7-3.5.7-1.4 0-2.7-.5-2.9-2.1h7.3c0-.4.1-.7.1-1.1zm-7.3-1c0-1.4 1.1-2.2 2.2-2.2s2.1.8 2.1 2.2h-4.3zm-4.4-4.6c-1.2 0-2 .6-2.4 1h-.1V.3h-2.8v10.9h2.8V6.9c0-1.3.6-2 1.6-2s1.5.7 1.5 2v4.3h2.8V6.4c0-2.4-1.2-3.8-3.4-3.8zm-6.8 0c-1.7 0-2.8.8-2.8.8l.9 2.2s.9-.6 1.8-.6c.8 0 1.2.4 1.2 1v.1c-2.4.1-4.9.9-4.9 3.2 0 1.9 1.4 2.8 3 2.8 1.5 0 2.3-.7 2.7-1.2h.1l.2 1h2.4V6.7c0-2.2-1.3-3.6-4.6-3.6zm1.8 6.8c0 .9-.8 1.6-1.8 1.6-.7 0-1.2-.4-1.2-1 0-1 1.3-1.2 3-1.3v.7zm-7.8-6.8c-1.2 0-2 .6-2.4 1h-.1V.3h-2.8v10.9h2.8V6.9c0-1.3.6-2 1.6-2s1.5.7 1.5 2v4.3h2.8V6.4c0-2.4-1.2-3.8-3.4-3.8zm-8.4 5.6V3.7h2.9V1.2h-2.9V.3h-2.8v.9h-1.4v2.5h1.4v5.1c0 2.3 1.3 3.4 3.7 3.4.8 0 1.5-.1 1.9-.3v-2.4c-.3.1-.7.2-1.1.2-.8 0-1.3-.4-1.3-1.2z" fill="white"/>
                  </svg>
                </span>
                Connect with Stripe
              </>
            )}
          </button>
        </div>
      )}

      {connectionStatus === 'completed' && (
        <div className="connection-success">
          <div className="success-icon">✓</div>
          <h3>Stripe Connected Successfully!</h3>
          <p>Your Stripe account is connected and ready to receive payments.</p>
        </div>
      )}

      <div className="security-footer">
        <span className="security-icon">🔒</span>
        <span>Your information is processed securely by Stripe</span>
      </div>

      <div className="step-actions">
        <button 
          type="button" 
          className="secondary-button"
          onClick={onBack}
          disabled={isSubmitting || isConnecting}
        >
          Back
        </button>
        <button 
          type="button" 
          className="primary-button"
          onClick={handleContinue}
          disabled={connectionStatus !== 'completed' || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>

      <style jsx>{`
        .stripe-connect-step {
          max-width: 500px;
          margin: 0 auto;
        }

        .step-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .step-header h2 {
          color: white;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .step-header p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-size: 14px;
        }

        .stripe-info-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .stripe-icon {
          text-align: center;
          margin-bottom: 16px;
        }

        .stripe-content h3 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px 0;
          text-align: center;
        }

        .benefits-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .benefits-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          margin-bottom: 8px;
        }

        .check-icon {
          color: #00C6E0;
          font-weight: 600;
          width: 16px;
          text-align: center;
        }

        .connection-action {
          text-align: center;
          margin-bottom: 24px;
        }

        .connection-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 20px 0;
        }

        .stripe-connect-button {
          background: #635bff;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 0 auto;
          transition: all 0.2s ease;
          min-width: 200px;
        }

        .stripe-connect-button:hover:not(:disabled) {
          background: #5a52e8;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(99, 91, 255, 0.3);
        }

        .stripe-connect-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .connecting {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .connection-success {
          text-align: center;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .success-icon {
          width: 48px;
          height: 48px;
          background: #22c55e;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 600;
          margin: 0 auto 12px auto;
        }

        .connection-success h3 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .connection-success p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          margin: 0;
        }

        .security-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          margin-bottom: 24px;
        }

        .security-icon {
          font-size: 14px;
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
          background: linear-gradient(135deg, #00C6E0, #00D7F2);
          color: #000000;
          flex: 1;
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(0, 198, 224, 0.3);
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

export default OnboardingStep3StripeConnect;