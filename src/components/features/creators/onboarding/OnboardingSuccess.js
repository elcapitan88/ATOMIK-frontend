import React, { useEffect, useState } from 'react';

const OnboardingSuccess = ({ onClose }) => {
  const [showFireworks, setShowFireworks] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFireworks(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleGoToCreatorHub = () => {
    window.location.href = '/creator-hub';
  };

  const handleViewMarketplace = () => {
    window.location.href = '/marketplace';
  };

  return (
    <div className="success-container">
      {showFireworks && (
        <div className="fireworks">
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
        </div>
      )}

      <div className="success-content">
        <div className="success-icon">
          🎉
        </div>
        
        <h2>Welcome to Creator Hub!</h2>
        <p className="success-message">
          Congratulations! Your creator account has been successfully set up. 
          You're now ready to start earning from your trading strategies.
        </p>

        <div className="next-steps">
          <h3>What happens next?</h3>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-icon">✅</div>
              <div className="step-content">
                <h4>Account Review</h4>
                <p>We'll review your application within 24-48 hours</p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-icon">📧</div>
              <div className="step-content">
                <h4>Email Confirmation</h4>
                <p>You'll receive an email once your account is approved</p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-icon">💰</div>
              <div className="step-content">
                <h4>Start Earning</h4>
                <p>Begin accepting subscribers and earning revenue</p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-icon">📊</div>
              <div className="step-content">
                <h4>Track Performance</h4>
                <p>Monitor your earnings and subscriber growth</p>
              </div>
            </div>
          </div>
        </div>

        <div className="quick-stats">
          <h4>Creator Benefits</h4>
          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-number">95%</span>
              <span className="stat-label">Revenue Share</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Creator Support</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">40+</span>
              <span className="stat-label">Countries</span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="primary-button"
            onClick={handleGoToCreatorHub}
          >
            Go to Creator Hub
          </button>
          <button 
            className="secondary-button"
            onClick={handleViewMarketplace}
          >
            View Marketplace
          </button>
        </div>

        <div className="close-action">
          <button 
            className="close-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .success-container {
          position: relative;
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .fireworks {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .firework {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #6366f1;
          border-radius: 50%;
          animation: firework 2s ease-out infinite;
        }

        .firework:nth-child(1) {
          left: 20%;
          animation-delay: 0s;
          background: #f59e0b;
        }

        .firework:nth-child(2) {
          left: 50%;
          animation-delay: 0.5s;
          background: #10b981;
        }

        .firework:nth-child(3) {
          left: 80%;
          animation-delay: 1s;
          background: #ef4444;
        }

        @keyframes firework {
          0% {
            transform: translateY(100px) scale(0);
            opacity: 1;
          }
          50% {
            transform: translateY(-100px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(0);
            opacity: 0;
          }
        }

        .success-content {
          position: relative;
          z-index: 1;
        }

        .success-icon {
          font-size: 80px;
          margin-bottom: 24px;
          animation: bounce 1s ease-out;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-20px);
          }
          60% {
            transform: translateY(-10px);
          }
        }

        .success-content h2 {
          color: white;
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 16px 0;
        }

        .success-message {
          color: rgba(255, 255, 255, 0.8);
          font-size: 18px;
          line-height: 1.6;
          margin: 0 0 40px 0;
        }

        .next-steps {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
        }

        .next-steps h3 {
          color: white;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 24px 0;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          text-align: left;
        }

        .step-icon {
          font-size: 20px;
          margin-top: 2px;
        }

        .step-content h4 {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .step-content p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          margin: 0;
          line-height: 1.4;
        }

        .quick-stats {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .quick-stats h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        .stats-row {
          display: flex;
          justify-content: space-around;
          gap: 16px;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat-number {
          color: #6366f1;
          font-size: 24px;
          font-weight: 700;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          text-align: center;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 24px;
        }

        .primary-button, .secondary-button {
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          min-width: 160px;
        }

        .primary-button {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
        }

        .secondary-button {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .secondary-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }

        .close-action {
          margin-top: 16px;
        }

        .close-button {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .close-button:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        @media (max-width: 640px) {
          .steps-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .stats-row {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default OnboardingSuccess;