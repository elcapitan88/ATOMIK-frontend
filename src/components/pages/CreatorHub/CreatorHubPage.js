import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreator } from '../../../hooks/useCreator';
import CreatorDashboard from './CreatorDashboard';
import CreatorStrategyManager from './CreatorStrategyManager';
import CreatorAnalyticsDashboard from '../../features/creator/CreatorAnalyticsDashboard';
import CreatorSettings from './CreatorSettings';

const CreatorHubPage = () => {
  const navigate = useNavigate();
  const { useCreatorProfile } = useCreator();
  const { data: creatorProfile, isLoading, error } = useCreatorProfile();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!isLoading && !creatorProfile) {
      navigate('/marketplace');
    }
  }, [creatorProfile, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="creator-hub-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Creator Hub...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="creator-hub-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Creator Hub</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!creatorProfile) {
    return (
      <div className="creator-hub-unauthorized">
        <div className="unauthorized-content">
          <h2>Creator Hub Access Required</h2>
          <p>You need to complete creator onboarding to access this area.</p>
          <button onClick={() => navigate('/marketplace')}>
            Go to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'strategies', label: 'Strategies', icon: '📈' },
    { id: 'analytics', label: 'Analytics', icon: '📉' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CreatorDashboard creatorProfile={creatorProfile} />;
      case 'strategies':
        return <CreatorStrategyManager creatorProfile={creatorProfile} />;
      case 'analytics':
        return <CreatorAnalyticsDashboard />;
      case 'settings':
        return <CreatorSettings creatorProfile={creatorProfile} />;
      default:
        return <CreatorDashboard creatorProfile={creatorProfile} />;
    }
  };

  return (
    <div className="creator-hub-page">
      <div className="creator-hub-header">
        <div className="header-content">
          <div className="creator-info">
            <div className="creator-avatar">
              {creatorProfile?.username?.charAt(0) || creatorProfile?.display_name?.charAt(0) || 'C'}
            </div>
            <div className="creator-details">
              <h1>Welcome back, {creatorProfile?.username || creatorProfile?.display_name || 'Creator'}</h1>
              <div className="creator-status">
                <span className={`tier-badge ${creatorProfile.currentTier}`}>
                  {creatorProfile.currentTier?.toUpperCase()} TIER
                </span>
                <span className="verification-status">
                  {creatorProfile.isVerified ? (
                    <>
                      <span className="verified-icon">✓</span>
                      Verified Creator
                    </>
                  ) : (
                    <>
                      <span className="pending-icon">⏳</span>
                      Verification Pending
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="quick-stats">
            <div className="stat-card">
              <span className="stat-value">{creatorProfile.totalSubscribers || 0}</span>
              <span className="stat-label">Subscribers</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">$0</span>
              <span className="stat-label">This Month</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">0</span>
              <span className="stat-label">Strategies</span>
            </div>
          </div>
        </div>

        <nav className="creator-hub-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="creator-hub-content">
        {renderTabContent()}
      </div>

      <style jsx>{`
        .creator-hub-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f1419, #1a1f2e);
          padding: 0;
        }

        .creator-hub-header {
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 32px 40px 0;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .creator-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .creator-avatar {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
          color: white;
        }

        .creator-details h1 {
          color: white;
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 12px 0;
        }

        .creator-status {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .tier-badge {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .tier-badge.bronze {
          background: linear-gradient(135deg, #cd7f32, #b8860b);
          color: white;
        }

        .tier-badge.silver {
          background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
          color: white;
        }

        .tier-badge.gold {
          background: linear-gradient(135deg, #ffd700, #ffed4e);
          color: #1a1f2e;
        }

        .verification-status {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .verified-icon {
          color: #10b981;
          font-weight: bold;
        }

        .pending-icon {
          color: #f59e0b;
        }

        .quick-stats {
          display: flex;
          gap: 24px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          min-width: 120px;
        }

        .stat-value {
          display: block;
          color: white;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 500;
        }

        .creator-hub-nav {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 8px 8px 0 0;
          transition: all 0.2s ease;
        }

        .nav-tab:hover {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.03);
        }

        .nav-tab.active {
          color: white;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 2px solid #6366f1;
        }

        .tab-icon {
          font-size: 16px;
        }

        .creator-hub-content {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .creator-hub-loading,
        .creator-hub-error,
        .creator-hub-unauthorized {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top: 3px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .creator-hub-loading h3,
        .creator-hub-error h3,
        .creator-hub-unauthorized h2 {
          color: white;
          margin-bottom: 16px;
        }

        .creator-hub-error p,
        .creator-hub-unauthorized p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 24px;
        }

        .creator-hub-error button,
        .creator-hub-unauthorized button {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .creator-hub-error button:hover,
        .creator-hub-unauthorized button:hover {
          transform: translateY(-1px);
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .creator-hub-header {
            padding: 20px;
          }

          .header-content {
            flex-direction: column;
            gap: 24px;
            align-items: flex-start;
          }

          .quick-stats {
            width: 100%;
            justify-content: space-between;
          }

          .stat-card {
            min-width: auto;
            flex: 1;
            padding: 16px;
          }

          .creator-hub-nav {
            overflow-x: auto;
            padding-bottom: 0;
          }

          .creator-hub-content {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default CreatorHubPage;