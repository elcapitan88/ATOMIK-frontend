import React from 'react';

const OnboardingStep1Welcome = ({ onNext }) => {
  return (
    <div className="welcome-step">
      <div className="welcome-content">
        <div className="welcome-header">
          <div className="welcome-icon">
            🚀
          </div>
          <h2>Welcome to Creator Hub</h2>
          <p className="welcome-subtitle">
            Join thousands of traders sharing their strategies and earning revenue
          </p>
        </div>

        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">💰</div>
            <div className="benefit-content">
              <h4>Earn Revenue</h4>
              <p>Set your own pricing and earn from strategy subscriptions</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">📈</div>
            <div className="benefit-content">
              <h4>Share Strategies</h4>
              <p>Showcase your trading strategies to a global audience</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">🏆</div>
            <div className="benefit-content">
              <h4>Build Reputation</h4>
              <p>Gain recognition as a successful trading strategy creator</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">🔧</div>
            <div className="benefit-content">
              <h4>Professional Tools</h4>
              <p>Access advanced analytics and creator management tools</p>
            </div>
          </div>
        </div>

        <div className="onboarding-preview">
          <h4>What's next?</h4>
          <div className="steps-preview">
            <div className="step-preview">
              <span className="step-number">1</span>
              <span>Profile Setup</span>
            </div>
            <div className="step-preview">
              <span className="step-number">2</span>
              <span>Tax Information</span>
            </div>
            <div className="step-preview">
              <span className="step-number">3</span>
              <span>Payment Setup</span>
            </div>
            <div className="step-preview">
              <span className="step-number">4</span>
              <span>Strategy Selection</span>
            </div>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button 
          className="primary-button"
          onClick={() => onNext({})}
        >
          Get Started
        </button>
      </div>

      <style jsx>{`
        .welcome-step {
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
        }

        .welcome-header {
          margin-bottom: 24px;
        }

        .welcome-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .welcome-header h2 {
          color: white;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .welcome-subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          margin: 0;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
          text-align: left;
        }

        .benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .benefit-icon {
          font-size: 20px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .benefit-content h4 {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 2px 0;
        }

        .benefit-content p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          margin: 0;
          line-height: 1.3;
        }

        .onboarding-preview {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .onboarding-preview h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }

        .steps-preview {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 300px;
          margin: 0 auto;
        }

        .step-preview {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #00C6E0, #00D7F2);
          color: #000000;
          border-radius: 50%;
          font-weight: 700;
          font-size: 11px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 198, 224, 0.3);
        }

        .step-actions {
          display: flex;
          justify-content: center;
        }

        .primary-button {
          background: linear-gradient(135deg, #00C6E0, #00D7F2);
          color: #000000;
          border: none;
          border-radius: 12px;
          padding: 14px 36px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 198, 224, 0.25);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 198, 224, 0.4);
          background: linear-gradient(135deg, #00D7F2, #00E8FF);
        }

        .primary-button:active {
          transform: translateY(0px);
          box-shadow: 0 4px 16px rgba(0, 198, 224, 0.3);
        }
      `}</style>
    </div>
  );
};

export default OnboardingStep1Welcome;