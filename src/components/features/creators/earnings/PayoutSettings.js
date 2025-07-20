import React, { useState } from 'react';
import { CreditCard, Calendar, DollarSign, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';

const PayoutSettings = ({ creatorProfile }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [payoutSchedule, setPayoutSchedule] = useState('weekly'); // weekly, biweekly, monthly
  const [minimumPayout, setMinimumPayout] = useState(25);

  const handleUpdateSettings = async () => {
    setIsUpdating(true);
    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false);
      // Show success toast
    }, 1000);
  };

  const stripeConnected = creatorProfile?.stripeConnectAccountId;
  const currentTier = creatorProfile?.currentTier || 'bronze';
  const platformFee = creatorProfile?.platformFeePercentage || 20;

  return (
    <div className="payout-settings">
      <div className="settings-header">
        <h3>Payout Settings</h3>
        <p>Configure how and when you receive your earnings</p>
      </div>

      {/* Stripe Connect Status */}
      <div className="stripe-status-card">
        <div className="status-content">
          <div className={`status-icon ${stripeConnected ? 'connected' : 'disconnected'}`}>
            {stripeConnected ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          </div>
          <div className="status-info">
            <h4>Stripe Connect Status</h4>
            <p>{stripeConnected ? 'Your account is connected and ready to receive payouts' : 'Connect your Stripe account to receive payouts'}</p>
          </div>
        </div>
        {!stripeConnected && (
          <button className="connect-stripe-button">
            Connect Stripe Account
            <ExternalLink size={16} />
          </button>
        )}
      </div>

      {/* Platform Fee Information */}
      <div className="fee-info-card">
        <div className="fee-header">
          <h4>Platform Fee Structure</h4>
          <span className={`tier-badge ${currentTier}`}>{currentTier} Tier</span>
        </div>
        <div className="fee-details">
          <div className="fee-item">
            <span className="fee-label">Current Fee</span>
            <span className="fee-value">{platformFee}%</span>
          </div>
          <div className="fee-breakdown">
            <div className="tier-info">
              <span className="tier-name">Bronze</span>
              <span className="tier-fee">20%</span>
              <span className="tier-requirement">&lt; 100 subscribers</span>
            </div>
            <div className="tier-info">
              <span className="tier-name">Silver</span>
              <span className="tier-fee">15%</span>
              <span className="tier-requirement">100+ subscribers</span>
            </div>
            <div className="tier-info">
              <span className="tier-name">Gold</span>
              <span className="tier-fee">10%</span>
              <span className="tier-requirement">200+ subscribers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Schedule */}
      <div className="settings-section">
        <h4>Payout Schedule</h4>
        <p>Choose how often you want to receive payouts</p>
        <div className="schedule-options">
          <label className={`schedule-option ${payoutSchedule === 'weekly' ? 'active' : ''}`}>
            <input
              type="radio"
              name="schedule"
              value="weekly"
              checked={payoutSchedule === 'weekly'}
              onChange={(e) => setPayoutSchedule(e.target.value)}
            />
            <div className="option-content">
              <Calendar size={20} />
              <div>
                <h5>Weekly</h5>
                <p>Every Monday</p>
              </div>
            </div>
          </label>
          <label className={`schedule-option ${payoutSchedule === 'biweekly' ? 'active' : ''}`}>
            <input
              type="radio"
              name="schedule"
              value="biweekly"
              checked={payoutSchedule === 'biweekly'}
              onChange={(e) => setPayoutSchedule(e.target.value)}
            />
            <div className="option-content">
              <Calendar size={20} />
              <div>
                <h5>Bi-weekly</h5>
                <p>Every other Monday</p>
              </div>
            </div>
          </label>
          <label className={`schedule-option ${payoutSchedule === 'monthly' ? 'active' : ''}`}>
            <input
              type="radio"
              name="schedule"
              value="monthly"
              checked={payoutSchedule === 'monthly'}
              onChange={(e) => setPayoutSchedule(e.target.value)}
            />
            <div className="option-content">
              <Calendar size={20} />
              <div>
                <h5>Monthly</h5>
                <p>1st of each month</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Minimum Payout */}
      <div className="settings-section">
        <h4>Minimum Payout Amount</h4>
        <p>Set the minimum balance required for automatic payouts</p>
        <div className="minimum-payout-control">
          <DollarSign size={20} />
          <input
            type="number"
            min="25"
            max="500"
            step="25"
            value={minimumPayout}
            onChange={(e) => setMinimumPayout(Number(e.target.value))}
            className="payout-input"
          />
          <span className="payout-hint">Minimum: $25</span>
        </div>
      </div>

      {/* Tax Information */}
      <div className="tax-info-section">
        <h4>Tax Documents</h4>
        <p>Download your tax forms and earnings statements</p>
        <div className="tax-actions">
          <button className="tax-button">
            Download 1099 Form
          </button>
          <button className="tax-button">
            Earnings Statement
          </button>
        </div>
      </div>

      {/* Update Button */}
      <div className="settings-actions">
        <button 
          className="update-button"
          onClick={handleUpdateSettings}
          disabled={isUpdating || !stripeConnected}
        >
          {isUpdating ? 'Updating...' : 'Update Payout Settings'}
        </button>
      </div>

      <style jsx>{`
        .payout-settings {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          padding: 24px;
        }

        .settings-header {
          margin-bottom: 24px;
        }

        .settings-header h3 {
          color: white;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .settings-header p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin: 0;
        }

        .stripe-status-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-content {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .status-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-icon.connected {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .status-icon.disconnected {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .status-info h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .status-info p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin: 0;
        }

        .connect-stripe-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .connect-stripe-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .fee-info-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .fee-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .fee-header h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .tier-badge {
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .tier-badge.bronze {
          background: rgba(180, 83, 9, 0.2);
          color: #d97706;
        }

        .tier-badge.silver {
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
        }

        .tier-badge.gold {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .fee-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .fee-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .fee-value {
          color: white;
          font-size: 24px;
          font-weight: 600;
        }

        .fee-breakdown {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .tier-info {
          background: rgba(255, 255, 255, 0.02);
          padding: 12px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: center;
        }

        .tier-name {
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .tier-fee {
          color: #6366f1;
          font-size: 18px;
          font-weight: 600;
        }

        .tier-requirement {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
        }

        .settings-section {
          margin-bottom: 32px;
        }

        .settings-section h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .settings-section p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin: 0 0 16px 0;
        }

        .schedule-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .schedule-option {
          position: relative;
          cursor: pointer;
        }

        .schedule-option input {
          position: absolute;
          opacity: 0;
        }

        .option-content {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          transition: all 0.2s;
        }

        .schedule-option.active .option-content {
          background: rgba(99, 102, 241, 0.1);
          border-color: #6366f1;
        }

        .option-content h5 {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }

        .option-content p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          margin: 0;
        }

        .minimum-payout-control {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          padding: 12px 16px;
          border-radius: 8px;
          max-width: 300px;
        }

        .payout-input {
          background: transparent;
          border: none;
          color: white;
          font-size: 18px;
          font-weight: 600;
          width: 80px;
          text-align: center;
        }

        .payout-input:focus {
          outline: none;
        }

        .payout-hint {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .tax-info-section {
          margin-bottom: 32px;
        }

        .tax-info-section h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .tax-info-section p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin: 0 0 16px 0;
        }

        .tax-actions {
          display: flex;
          gap: 12px;
        }

        .tax-button {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tax-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .settings-actions {
          display: flex;
          justify-content: flex-end;
        }

        .update-button {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .update-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .update-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .stripe-status-card {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .connect-stripe-button {
            width: 100%;
            justify-content: center;
          }

          .fee-breakdown {
            grid-template-columns: 1fr;
          }

          .schedule-options {
            grid-template-columns: 1fr;
          }

          .tax-actions {
            flex-direction: column;
          }

          .tax-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default PayoutSettings;