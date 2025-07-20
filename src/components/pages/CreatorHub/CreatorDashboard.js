import React, { useState, useEffect } from 'react';
import { useCreator } from '../../../hooks/useCreator';

const CreatorDashboard = ({ creatorProfile }) => {
  const { getCreatorAnalytics, getTierProgress } = useCreator();
  const [analytics, setAnalytics] = useState(null);
  const [tierProgress, setTierProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [analyticsData, progressData] = await Promise.all([
          getCreatorAnalytics(),
          getTierProgress()
        ]);
        setAnalytics(analyticsData);
        setTierProgress(progressData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [getCreatorAnalytics, getTierProgress]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const mockAnalytics = analytics || {
    totalEarnings: 0,
    monthlyEarnings: 0,
    totalSubscribers: creatorProfile?.totalSubscribers || 0,
    monthlyGrowth: 0,
    activeStrategies: 0,
    conversionRate: 0,
    recentTransactions: []
  };

  const mockTierProgress = tierProgress || {
    currentTier: creatorProfile?.currentTier || 'bronze',
    currentSubscribers: creatorProfile?.totalSubscribers || 0,
    nextTierThreshold: 100,
    progressPercentage: ((creatorProfile?.totalSubscribers || 0) / 100) * 100
  };

  const quickActions = [
    {
      title: 'Create Strategy',
      description: 'Upload a new trading strategy',
      icon: '📈',
      action: () => window.open('/strategies', '_blank'),
      color: 'blue'
    },
    {
      title: 'Update Pricing',
      description: 'Adjust your strategy pricing',
      icon: '💰',
      action: () => {},
      color: 'green'
    },
    {
      title: 'View Analytics',
      description: 'Deep dive into your performance',
      icon: '📊',
      action: () => {},
      color: 'purple'
    },
    {
      title: 'Creator Support',
      description: 'Get help from our team',
      icon: '🎧',
      action: () => {},
      color: 'orange'
    }
  ];

  const getTierColor = (tier) => {
    switch (tier) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      default: return '#cd7f32';
    }
  };

  const getNextTier = (currentTier) => {
    switch (currentTier) {
      case 'bronze': return 'Silver';
      case 'silver': return 'Gold';
      case 'gold': return 'Diamond';
      default: return 'Silver';
    }
  };

  return (
    <div className="creator-dashboard">
      {/* Revenue Overview */}
      <section className="revenue-section">
        <h2>Revenue Overview</h2>
        <div className="revenue-cards">
          <div className="revenue-card primary">
            <div className="revenue-icon">💰</div>
            <div className="revenue-data">
              <span className="revenue-amount">${mockAnalytics.totalEarnings.toLocaleString()}</span>
              <span className="revenue-label">Total Earnings</span>
            </div>
          </div>
          
          <div className="revenue-card">
            <div className="revenue-icon">📅</div>
            <div className="revenue-data">
              <span className="revenue-amount">${mockAnalytics.monthlyEarnings.toLocaleString()}</span>
              <span className="revenue-label">This Month</span>
              <span className="revenue-growth positive">+{mockAnalytics.monthlyGrowth}%</span>
            </div>
          </div>

          <div className="revenue-card">
            <div className="revenue-icon">👥</div>
            <div className="revenue-data">
              <span className="revenue-amount">{mockAnalytics.totalSubscribers}</span>
              <span className="revenue-label">Total Subscribers</span>
            </div>
          </div>

          <div className="revenue-card">
            <div className="revenue-icon">📈</div>
            <div className="revenue-data">
              <span className="revenue-amount">{mockAnalytics.activeStrategies}</span>
              <span className="revenue-label">Active Strategies</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tier Progress */}
      <section className="tier-section">
        <h2>Creator Tier Progress</h2>
        <div className="tier-card">
          <div className="tier-info">
            <div className="current-tier">
              <span className="tier-badge" style={{ background: getTierColor(mockTierProgress.currentTier) }}>
                {mockTierProgress.currentTier.toUpperCase()}
              </span>
              <span className="tier-subscribers">
                {mockTierProgress.currentSubscribers} subscribers
              </span>
            </div>
            <div className="tier-next">
              <span className="next-label">Next: {getNextTier(mockTierProgress.currentTier)} Tier</span>
              <span className="next-target">
                {mockTierProgress.nextTierThreshold - mockTierProgress.currentSubscribers} more subscribers needed
              </span>
            </div>
          </div>
          
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(mockTierProgress.progressPercentage, 100)}%`,
                  background: getTierColor(mockTierProgress.currentTier)
                }}
              />
            </div>
            <span className="progress-text">
              {Math.round(mockTierProgress.progressPercentage)}% to {getNextTier(mockTierProgress.currentTier)}
            </span>
          </div>

          <div className="tier-benefits">
            <h4>Current Tier Benefits:</h4>
            <ul>
              <li>Platform fee: {mockTierProgress.currentTier === 'bronze' ? '20%' : mockTierProgress.currentTier === 'silver' ? '15%' : '10%'}</li>
              <li>Priority support</li>
              <li>Advanced analytics</li>
              {mockTierProgress.currentTier !== 'bronze' && <li>Featured placement</li>}
              {mockTierProgress.currentTier === 'gold' && <li>Custom branding</li>}
            </ul>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <div 
              key={index}
              className={`action-card ${action.color}`}
              onClick={action.action}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <h4>{action.title}</h4>
                <p>{action.description}</p>
              </div>
              <div className="action-arrow">→</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="activity-section">
        <h2>Recent Activity</h2>
        <div className="activity-card">
          {mockAnalytics.recentTransactions.length > 0 ? (
            <div className="transactions-list">
              {mockAnalytics.recentTransactions.map((transaction, index) => (
                <div key={index} className="transaction-item">
                  <div className="transaction-info">
                    <span className="transaction-type">{transaction.type}</span>
                    <span className="transaction-date">{transaction.date}</span>
                  </div>
                  <span className="transaction-amount">+${transaction.amount}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-activity">
              <div className="empty-icon">📭</div>
              <h4>No Recent Activity</h4>
              <p>Your earnings and subscriber activity will appear here once you start monetizing your strategies.</p>
              <button className="get-started-btn">
                Get Started
              </button>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .creator-dashboard {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-top: 2px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .dashboard-loading p {
          color: rgba(255, 255, 255, 0.7);
        }

        section h2 {
          color: white;
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .revenue-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .revenue-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s ease;
        }

        .revenue-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .revenue-card.primary {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
          border-color: rgba(99, 102, 241, 0.3);
        }

        .revenue-icon {
          font-size: 32px;
          opacity: 0.8;
        }

        .revenue-data {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .revenue-amount {
          color: white;
          font-size: 24px;
          font-weight: 700;
        }

        .revenue-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .revenue-growth {
          font-size: 12px;
          font-weight: 600;
        }

        .revenue-growth.positive {
          color: #10b981;
        }

        .tier-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 32px;
        }

        .tier-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .current-tier {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tier-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          align-self: flex-start;
        }

        .tier-subscribers {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
          font-weight: 500;
        }

        .tier-next {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .next-label {
          color: white;
          font-weight: 600;
        }

        .next-target {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .progress-container {
          margin-bottom: 24px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        .progress-text {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .tier-benefits h4 {
          color: white;
          font-size: 16px;
          margin-bottom: 12px;
        }

        .tier-benefits ul {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tier-benefits li {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          padding-left: 20px;
          position: relative;
        }

        .tier-benefits li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: bold;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .action-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .action-card.blue:hover {
          border-color: rgba(59, 130, 246, 0.4);
        }

        .action-card.green:hover {
          border-color: rgba(16, 185, 129, 0.4);
        }

        .action-card.purple:hover {
          border-color: rgba(139, 92, 246, 0.4);
        }

        .action-card.orange:hover {
          border-color: rgba(245, 158, 11, 0.4);
        }

        .action-icon {
          font-size: 24px;
        }

        .action-content {
          flex: 1;
        }

        .action-content h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .action-content p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin: 0;
        }

        .action-arrow {
          color: rgba(255, 255, 255, 0.4);
          font-size: 18px;
          transition: transform 0.2s ease;
        }

        .action-card:hover .action-arrow {
          transform: translateX(4px);
        }

        .activity-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 32px;
        }

        .empty-activity {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-activity h4 {
          color: white;
          font-size: 18px;
          margin-bottom: 8px;
        }

        .empty-activity p {
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 24px;
        }

        .get-started-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .get-started-btn:hover {
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .creator-dashboard {
            gap: 24px;
          }

          .revenue-cards {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
          }

          .revenue-card {
            padding: 20px;
          }

          .tier-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .tier-next {
            text-align: left;
          }

          .actions-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .action-card {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default CreatorDashboard;