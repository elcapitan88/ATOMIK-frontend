import React, { useState } from 'react';
import { useCreator } from '../../../hooks/useCreator';

const CreatorSettings = ({ creatorProfile }) => {
  const { updateCreatorProfile } = useCreator();
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: creatorProfile?.displayName || '',
    bio: creatorProfile?.bio || '',
    tradingExperience: creatorProfile?.tradingExperience || '',
    website: creatorProfile?.website || '',
    socialLinks: creatorProfile?.socialLinks || {
      twitter: '',
      linkedin: '',
      discord: ''
    }
  });

  const sections = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'payout', label: 'Payout Settings', icon: '💳' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy & Safety', icon: '🔒' }
  ];

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateCreatorProfile(formData);
      // Show success message
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const renderProfileSection = () => (
    <div className="settings-section">
      <h3>Creator Profile</h3>
      <p>Manage your public creator profile information</p>

      <div className="form-group">
        <label>Display Name</label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => handleInputChange('displayName', e.target.value)}
          placeholder="Your creator name"
        />
      </div>

      <div className="form-group">
        <label>Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Tell potential subscribers about your trading experience..."
          rows={4}
        />
        <span className="char-count">{formData.bio.length}/500</span>
      </div>

      <div className="form-group">
        <label>Trading Experience</label>
        <select
          value={formData.tradingExperience}
          onChange={(e) => handleInputChange('tradingExperience', e.target.value)}
        >
          <option value="">Select experience level</option>
          <option value="beginner">Beginner (< 1 year)</option>
          <option value="intermediate">Intermediate (1-3 years)</option>
          <option value="experienced">Experienced (3-5 years)</option>
          <option value="expert">Expert (5+ years)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Website (Optional)</label>
        <input
          type="url"
          value={formData.website}
          onChange={(e) => handleInputChange('website', e.target.value)}
          placeholder="https://yourwebsite.com"
        />
      </div>

      <div className="social-section">
        <h4>Social Links</h4>
        <div className="social-inputs">
          <div className="form-group">
            <label>Twitter</label>
            <input
              type="text"
              value={formData.socialLinks.twitter}
              onChange={(e) => handleInputChange('socialLinks.twitter', e.target.value)}
              placeholder="@username"
            />
          </div>

          <div className="form-group">
            <label>LinkedIn</label>
            <input
              type="url"
              value={formData.socialLinks.linkedin}
              onChange={(e) => handleInputChange('socialLinks.linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
          </div>

          <div className="form-group">
            <label>Discord</label>
            <input
              type="text"
              value={formData.socialLinks.discord}
              onChange={(e) => handleInputChange('socialLinks.discord', e.target.value)}
              placeholder="username#1234"
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button 
          className="save-btn"
          onClick={handleSaveProfile}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderPayoutSection = () => (
    <div className="settings-section">
      <h3>Payout Settings</h3>
      <p>Manage your Stripe Connect account and payout preferences</p>

      <div className="payout-status">
        <div className="status-card">
          <div className="status-header">
            <span className="status-icon">💳</span>
            <div className="status-info">
              <h4>Stripe Connect Account</h4>
              <p>{creatorProfile?.stripeConnectAccountId ? 'Connected' : 'Not Connected'}</p>
            </div>
          </div>
          {creatorProfile?.stripeConnectAccountId ? (
            <span className="status-badge connected">Active</span>
          ) : (
            <button className="connect-btn">Connect Stripe</button>
          )}
        </div>
      </div>

      <div className="payout-info">
        <h4>Payout Information</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Current Tier:</span>
            <span className="info-value">{creatorProfile?.currentTier?.toUpperCase() || 'BRONZE'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Platform Fee:</span>
            <span className="info-value">
              {creatorProfile?.currentTier === 'gold' ? '10%' : 
               creatorProfile?.currentTier === 'silver' ? '15%' : '20%'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Payout Schedule:</span>
            <span className="info-value">Weekly</span>
          </div>
          <div className="info-item">
            <span className="info-label">Next Payout:</span>
            <span className="info-value">No pending earnings</span>
          </div>
        </div>
      </div>

      {creatorProfile?.stripeConnectAccountId && (
        <div className="payout-actions">
          <button className="secondary-btn">View Stripe Dashboard</button>
          <button className="secondary-btn">Download Tax Documents</button>
        </div>
      )}
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="settings-section">
      <h3>Notification Preferences</h3>
      <p>Choose what notifications you want to receive</p>

      <div className="notification-groups">
        <div className="notification-group">
          <h4>Earnings & Payouts</h4>
          <div className="notification-item">
            <div className="notification-info">
              <span className="notification-label">New Subscriber</span>
              <span className="notification-desc">When someone subscribes to your strategy</span>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="notification-item">
            <div className="notification-info">
              <span className="notification-label">Payout Processed</span>
              <span className="notification-desc">When your earnings are paid out</span>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="notification-group">
          <h4>Performance & Analytics</h4>
          <div className="notification-item">
            <div className="notification-info">
              <span className="notification-label">Weekly Summary</span>
              <span className="notification-desc">Weekly performance report</span>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="notification-item">
            <div className="notification-info">
              <span className="notification-label">Tier Progress</span>
              <span className="notification-desc">Updates on tier advancement</span>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="settings-section">
      <h3>Privacy & Safety</h3>
      <p>Control your privacy and safety settings</p>

      <div className="privacy-settings">
        <div className="privacy-item">
          <div className="privacy-info">
            <h4>Profile Visibility</h4>
            <p>Control who can see your creator profile</p>
          </div>
          <select className="privacy-select">
            <option value="public">Public - Anyone can view</option>
            <option value="subscribers">Subscribers only</option>
            <option value="private">Private - Hidden</option>
          </select>
        </div>

        <div className="privacy-item">
          <div className="privacy-info">
            <h4>Strategy Performance</h4>
            <p>Show strategy performance metrics publicly</p>
          </div>
          <label className="toggle">
            <input type="checkbox" defaultChecked />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="privacy-item">
          <div className="privacy-info">
            <h4>Subscriber Count</h4>
            <p>Display subscriber count on your strategies</p>
          </div>
          <label className="toggle">
            <input type="checkbox" defaultChecked />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="danger-zone">
        <h4>Danger Zone</h4>
        <div className="danger-item">
          <div className="danger-info">
            <h5>Deactivate Creator Account</h5>
            <p>Temporarily disable your creator account and hide all strategies</p>
          </div>
          <button className="danger-btn">Deactivate</button>
        </div>
        <div className="danger-item">
          <div className="danger-info">
            <h5>Delete Creator Account</h5>
            <p>Permanently delete your creator account and all associated data</p>
          </div>
          <button className="danger-btn">Delete Account</button>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'payout':
        return renderPayoutSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'privacy':
        return renderPrivacySection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="creator-settings">
      <div className="settings-sidebar">
        {sections.map(section => (
          <button
            key={section.id}
            className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="sidebar-icon">{section.icon}</span>
            <span className="sidebar-label">{section.label}</span>
          </button>
        ))}
      </div>

      <div className="settings-content">
        {renderSection()}
      </div>

      <style jsx>{`
        .creator-settings {
          display: flex;
          gap: 32px;
          min-height: 600px;
        }

        .settings-sidebar {
          min-width: 240px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 8px;
          height: fit-content;
        }

        .sidebar-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 4px;
        }

        .sidebar-item:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .sidebar-item.active {
          color: white;
          background: rgba(99, 102, 241, 0.2);
        }

        .sidebar-icon {
          font-size: 18px;
        }

        .sidebar-label {
          font-weight: 500;
        }

        .settings-content {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 32px;
        }

        .settings-section h3 {
          color: white;
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .settings-section > p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 32px 0;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          color: white;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          color: white;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .char-count {
          display: block;
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          text-align: right;
          margin-top: 4px;
        }

        .social-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .social-section h4 {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .social-inputs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .form-actions {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .save-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .payout-status {
          margin-bottom: 32px;
        }

        .status-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-icon {
          font-size: 24px;
        }

        .status-info h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .status-info p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.connected {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .connect-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .payout-info h4 {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .info-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .info-value {
          color: white;
          font-weight: 600;
        }

        .payout-actions {
          display: flex;
          gap: 12px;
        }

        .secondary-btn {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .secondary-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .notification-groups {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .notification-group h4 {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .notification-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .notification-info {
          flex: 1;
        }

        .notification-label {
          display: block;
          color: white;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .notification-desc {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .toggle {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }

        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.2);
          transition: 0.2s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.2s;
          border-radius: 50%;
        }

        .toggle input:checked + .toggle-slider {
          background-color: #6366f1;
        }

        .toggle input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .privacy-settings {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 32px;
        }

        .privacy-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .privacy-info {
          flex: 1;
          margin-right: 20px;
        }

        .privacy-info h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .privacy-info p {
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .privacy-select {
          min-width: 200px;
        }

        .danger-zone {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          padding: 24px;
          margin-top: 32px;
        }

        .danger-zone h4 {
          color: #ef4444;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .danger-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid rgba(239, 68, 68, 0.2);
        }

        .danger-item:last-child {
          border-bottom: none;
        }

        .danger-info h5 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .danger-info p {
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .danger-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          padding: 8px 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .danger-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          color: white;
        }

        @media (max-width: 768px) {
          .creator-settings {
            flex-direction: column;
            gap: 20px;
          }

          .settings-sidebar {
            min-width: auto;
            display: flex;
            overflow-x: auto;
            padding: 4px;
          }

          .sidebar-item {
            min-width: 140px;
            justify-content: center;
            margin-right: 4px;
            margin-bottom: 0;
          }

          .settings-content {
            padding: 20px;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .privacy-item,
          .danger-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .privacy-info {
            margin-right: 0;
          }

          .social-inputs {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CreatorSettings;