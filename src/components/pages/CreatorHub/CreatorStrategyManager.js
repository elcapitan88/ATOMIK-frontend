import React, { useState, useEffect } from 'react';
import { useUnifiedStrategies as useStrategies } from '@/hooks/useUnifiedStrategies';

const CreatorStrategyManager = ({ creatorProfile }) => {
  const { strategies, isLoading: loading, refetch: fetchUserStrategies } = useStrategies();
  const [filter, setFilter] = useState('all'); // all, monetized, free
  const [sortBy, setSortBy] = useState('newest'); // newest, earnings, subscribers

  useEffect(() => {
    fetchUserStrategies();
  }, [fetchUserStrategies]);

  const filteredStrategies = strategies.filter(strategy => {
    switch (filter) {
      case 'monetized':
        return strategy.pricing && strategy.pricing.pricing_type !== 'free';
      case 'free':
        return !strategy.pricing || strategy.pricing.pricing_type === 'free';
      default:
        return true;
    }
  });

  const sortedStrategies = [...filteredStrategies].sort((a, b) => {
    switch (sortBy) {
      case 'earnings':
        return (b.earnings || 0) - (a.earnings || 0);
      case 'subscribers':
        return (b.subscribers || 0) - (a.subscribers || 0);
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  if (loading) {
    return (
      <div className="strategy-manager-loading">
        <div className="loading-spinner"></div>
        <p>Loading your strategies...</p>
      </div>
    );
  }

  return (
    <div className="creator-strategy-manager">
      <div className="manager-header">
        <div className="header-left">
          <h2>Strategy Management</h2>
          <p>Manage pricing and monitor performance of your strategies</p>
        </div>
        <button className="create-strategy-btn">
          + Create New Strategy
        </button>
      </div>

      <div className="manager-controls">
        <div className="filter-controls">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({strategies.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'monetized' ? 'active' : ''}`}
            onClick={() => setFilter('monetized')}
          >
            Monetized ({filteredStrategies.filter(s => s.pricing?.pricing_type !== 'free').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'free' ? 'active' : ''}`}
            onClick={() => setFilter('free')}
          >
            Free ({filteredStrategies.filter(s => !s.pricing || s.pricing.pricing_type === 'free').length})
          </button>
        </div>

        <select 
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="earnings">Highest Earnings</option>
          <option value="subscribers">Most Subscribers</option>
        </select>
      </div>

      <div className="strategies-grid">
        {sortedStrategies.length > 0 ? (
          sortedStrategies.map(strategy => (
            <div key={strategy.id} className="strategy-card">
              <div className="strategy-header">
                <div className="strategy-info">
                  <h4>{strategy.name}</h4>
                  <p>{strategy.description}</p>
                </div>
                <div className="strategy-status">
                  {strategy.pricing?.pricing_type === 'free' || !strategy.pricing ? (
                    <span className="status-badge free">Free</span>
                  ) : (
                    <span className="status-badge monetized">Monetized</span>
                  )}
                </div>
              </div>

              <div className="strategy-metrics">
                <div className="metric">
                  <span className="metric-value">${strategy.earnings || 0}</span>
                  <span className="metric-label">Total Earnings</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{strategy.subscribers || 0}</span>
                  <span className="metric-label">Subscribers</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{strategy.performance || '+0.0'}%</span>
                  <span className="metric-label">Performance</span>
                </div>
              </div>

              {strategy.pricing && strategy.pricing.pricing_type !== 'free' && (
                <div className="pricing-info">
                  <div className="price-display">
                    <span className="price">${strategy.pricing.base_amount}</span>
                    <span className="price-period">
                      /{strategy.pricing.billing_interval || 'month'}
                    </span>
                  </div>
                  {strategy.pricing.is_trial_enabled && (
                    <span className="trial-badge">
                      {strategy.pricing.trial_days} day trial
                    </span>
                  )}
                </div>
              )}

              <div className="strategy-actions">
                <button className="action-btn secondary">
                  📊 Analytics
                </button>
                {(!strategy.pricing || strategy.pricing.pricing_type === 'free') ? (
                  <button className="action-btn primary">
                    💰 Monetize
                  </button>
                ) : (
                  <button className="action-btn secondary">
                    ⚙️ Edit Pricing
                  </button>
                )}
                <button className="action-btn secondary">
                  ⋯
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-strategies">
            <div className="empty-icon">📈</div>
            <h3>No Strategies Found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't created any strategies yet. Start by creating your first trading strategy."
                : `You don't have any ${filter} strategies yet.`
              }
            </p>
            <button className="create-first-btn">
              Create Your First Strategy
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .creator-strategy-manager {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .strategy-manager-loading {
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

        .strategy-manager-loading p {
          color: rgba(255, 255, 255, 0.7);
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .header-left h2 {
          color: white;
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .header-left p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .create-strategy-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .create-strategy-btn:hover {
          transform: translateY(-1px);
        }

        .manager-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .filter-controls {
          display: flex;
          gap: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 4px;
        }

        .filter-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .filter-btn.active {
          color: white;
          background: rgba(99, 102, 241, 0.2);
        }

        .sort-select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          padding: 8px 12px;
          font-size: 14px;
        }

        .sort-select option {
          background: #1a1f2e;
          color: white;
        }

        .strategies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .strategy-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s ease;
        }

        .strategy-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .strategy-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .strategy-info h4 {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .strategy-info p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          margin: 0;
          line-height: 1.4;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.free {
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
        }

        .status-badge.monetized {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .strategy-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
          padding: 16px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .metric {
          text-align: center;
        }

        .metric-value {
          display: block;
          color: white;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .metric-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 500;
        }

        .pricing-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 12px 16px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 8px;
        }

        .price-display {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .price {
          color: white;
          font-size: 20px;
          font-weight: 700;
        }

        .price-period {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .trial-badge {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .strategy-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          flex: 1;
          border: none;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
        }

        .action-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .action-btn:hover {
          transform: translateY(-1px);
        }

        .action-btn.primary:hover {
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }

        .action-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .empty-strategies {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .empty-strategies h3 {
          color: white;
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .empty-strategies p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 32px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .create-first-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .create-first-btn:hover {
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .manager-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .manager-controls {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .strategies-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .strategy-card {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default CreatorStrategyManager;