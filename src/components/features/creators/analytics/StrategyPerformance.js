import React, { useState } from 'react';
import { TrendingUp, Users, DollarSign, BarChart3, Eye, ShoppingCart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StrategyPerformance = ({ strategies = [], isLoading = false }) => {
  const [selectedStrategy, setSelectedStrategy] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');

  const filteredStrategies = selectedStrategy === 'all' 
    ? strategies 
    : strategies.filter(s => s.id === selectedStrategy);

  const totalMetrics = filteredStrategies.reduce((acc, strategy) => {
    acc.views += strategy.performance?.views || 0;
    acc.trials += strategy.performance?.trials || 0;
    acc.conversions += strategy.performance?.conversions || 0;
    acc.revenue += strategy.performance?.revenue || 0;
    acc.subscribers += strategy.subscribers || 0;
    return acc;
  }, { views: 0, trials: 0, conversions: 0, revenue: 0, subscribers: 0 });

  const avgConversionRate = filteredStrategies.length > 0
    ? filteredStrategies.reduce((sum, s) => sum + (s.conversionRate || 0), 0) / filteredStrategies.length
    : 0;

  if (isLoading) {
    return (
      <div className="strategy-performance">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ color: 'white', fontSize: '18px' }}>Loading strategy performance...</div>
        </div>
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="strategy-performance">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ fontSize: '48px' }}>📊</div>
          <div style={{ color: 'white', fontSize: '20px', fontWeight: '600' }}>No Strategies Yet</div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', textAlign: 'center' }}>
            Create and monetize your first strategy to see performance analytics
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="strategy-performance">
      <div className="performance-header">
        <div className="header-content">
          <h3>Strategy Performance Analytics</h3>
          <p>Track conversion rates and strategy performance metrics</p>
        </div>
        <div className="header-controls">
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
            className="strategy-select"
          >
            <option value="all">All Strategies</option>
            {strategies.map(strategy => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-select"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <Eye size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Views</span>
            <span className="metric-value">{totalMetrics.views}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <Users size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Active Subscribers</span>
            <span className="metric-value">{totalMetrics.subscribers}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <ShoppingCart size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Conversions</span>
            <span className="metric-value">{totalMetrics.conversions}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <BarChart3 size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Avg Conversion Rate</span>
            <span className="metric-value">{avgConversionRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="conversion-funnel">
        <h4>Conversion Funnel</h4>
        <div className="funnel-stages">
          <div className="funnel-stage">
            <div className="stage-header">
              <span className="stage-name">Views</span>
              <span className="stage-value">{totalMetrics.views}</span>
            </div>
            <div className="stage-bar full"></div>
          </div>
          <div className="funnel-arrow">→</div>
          <div className="funnel-stage">
            <div className="stage-header">
              <span className="stage-name">Trials</span>
              <span className="stage-value">{totalMetrics.trials}</span>
            </div>
            <div className="stage-bar" style={{ width: `${(totalMetrics.trials / totalMetrics.views) * 100}%` }}></div>
            <span className="conversion-rate">
              {totalMetrics.views > 0 ? ((totalMetrics.trials / totalMetrics.views) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="funnel-arrow">→</div>
          <div className="funnel-stage">
            <div className="stage-header">
              <span className="stage-name">Conversions</span>
              <span className="stage-value">{totalMetrics.conversions}</span>
            </div>
            <div className="stage-bar" style={{ width: `${(totalMetrics.conversions / totalMetrics.views) * 100}%` }}></div>
            <span className="conversion-rate">
              {totalMetrics.views > 0 ? ((totalMetrics.conversions / totalMetrics.views) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Strategy Details Table */}
      <div className="strategy-table">
        <h4>Strategy Breakdown</h4>
        <table>
          <thead>
            <tr>
              <th>Strategy</th>
              <th>Type</th>
              <th>Price</th>
              <th>Views</th>
              <th>Trials</th>
              <th>Subscribers</th>
              <th>Conv. Rate</th>
              <th>Revenue</th>
              <th>Growth</th>
            </tr>
          </thead>
          <tbody>
            {filteredStrategies.map(strategy => (
              <tr key={strategy.id}>
                <td>{strategy.name}</td>
                <td>
                  <span className={`type-badge ${strategy.type}`}>
                    {strategy.type === 'subscription' ? 'Sub' : 'One-time'}
                  </span>
                </td>
                <td>${strategy.price}</td>
                <td>{strategy.performance.views}</td>
                <td>{strategy.performance.trials || '-'}</td>
                <td>{strategy.subscribers}</td>
                <td>{strategy.conversionRate.toFixed(1)}%</td>
                <td>${strategy.revenue.toFixed(2)}</td>
                <td>
                  <span className={`growth ${strategy.performance.growth >= 0 ? 'positive' : 'negative'}`}>
                    {strategy.performance.growth >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {Math.abs(strategy.performance.growth).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Metrics */}
      {selectedStrategy !== 'all' && filteredStrategies.length === 1 && (
        <div className="detailed-metrics">
          <h4>Detailed Metrics - {filteredStrategies[0].name}</h4>
          <div className="detail-grid">
            <div className="detail-card">
              <span className="detail-label">Trial Conversion Rate</span>
              <span className="detail-value">{filteredStrategies[0].trialConversion}%</span>
              <span className="detail-sublabel">Trials that convert to paid</span>
            </div>
            <div className="detail-card">
              <span className="detail-label">Views to Trial</span>
              <span className="detail-value">{filteredStrategies[0].viewsToTrial}%</span>
              <span className="detail-sublabel">Page views that start trial</span>
            </div>
            <div className="detail-card">
              <span className="detail-label">Avg Subscription Length</span>
              <span className="detail-value">{filteredStrategies[0].avgSubscriptionLength} months</span>
              <span className="detail-sublabel">Average customer lifetime</span>
            </div>
            <div className="detail-card">
              <span className="detail-label">Churn Rate</span>
              <span className="detail-value">{filteredStrategies[0].churnRate}%</span>
              <span className="detail-sublabel">Monthly cancellation rate</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .strategy-performance {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          padding: 24px;
        }

        .performance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-content h3 {
          color: white;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .header-content p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin: 0;
        }

        .header-controls {
          display: flex;
          gap: 12px;
        }

        .strategy-select,
        .time-select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 8px;
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
        }

        .metric-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .metric-value {
          color: white;
          font-size: 24px;
          font-weight: 600;
        }

        .conversion-funnel {
          background: rgba(255, 255, 255, 0.05);
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 32px;
        }

        .conversion-funnel h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 20px 0;
        }

        .funnel-stages {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .funnel-stage {
          flex: 1;
        }

        .stage-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .stage-name {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
        }

        .stage-value {
          color: white;
          font-size: 18px;
          font-weight: 600;
        }

        .stage-bar {
          height: 8px;
          background: #6366f1;
          border-radius: 4px;
          transition: width 0.3s ease;
          margin-bottom: 4px;
        }

        .stage-bar.full {
          width: 100%;
        }

        .conversion-rate {
          color: #10b981;
          font-size: 12px;
          font-weight: 600;
        }

        .funnel-arrow {
          color: rgba(255, 255, 255, 0.3);
          font-size: 24px;
        }

        .strategy-table {
          background: rgba(255, 255, 255, 0.02);
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 32px;
        }

        .strategy-table h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          text-align: left;
          padding: 12px 16px;
          font-size: 14px;
        }

        td {
          color: rgba(255, 255, 255, 0.9);
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 14px;
        }

        .type-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .type-badge.subscription {
          background: rgba(99, 102, 241, 0.2);
          color: #6366f1;
        }

        .type-badge.one_time {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .growth {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
        }

        .growth.positive {
          color: #10b981;
        }

        .growth.negative {
          color: #ef4444;
        }

        .detailed-metrics {
          background: rgba(255, 255, 255, 0.02);
          padding: 24px;
          border-radius: 8px;
        }

        .detailed-metrics h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 20px 0;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .detail-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
        }

        .detail-value {
          color: white;
          font-size: 20px;
          font-weight: 600;
        }

        .detail-sublabel {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
        }

        @media (max-width: 1024px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .detail-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .performance-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .header-controls {
            width: 100%;
            flex-direction: column;
          }

          .strategy-select,
          .time-select {
            width: 100%;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .funnel-stages {
            flex-direction: column;
            gap: 16px;
          }

          .funnel-arrow {
            transform: rotate(90deg);
          }

          .strategy-table {
            overflow-x: auto;
          }

          table {
            min-width: 700px;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StrategyPerformance;