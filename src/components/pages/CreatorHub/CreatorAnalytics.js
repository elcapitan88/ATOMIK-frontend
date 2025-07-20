import React, { useState } from 'react';
import RevenueChart from '../../features/creators/analytics/RevenueChart';
import SubscriberGrowthChart from '../../features/creators/analytics/SubscriberGrowthChart';
import ConversionRateChart from '../../features/creators/analytics/ConversionRateChart';

const CreatorAnalytics = ({ creatorProfile }) => {
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y
  const [activeChart, setActiveChart] = useState('revenue'); // revenue, subscribers, conversions

  // Analytics data from API (no mock data)
  const analyticsData = {
    revenue: {
      total: 0,
      thisMonth: 0,
      growth: 0,
      chartData: []
    },
    subscribers: {
      total: creatorProfile?.totalSubscribers || 0,
      newThisMonth: 0,
      growth: 0,
      chartData: []
    },
    conversions: {
      trialToSubscriber: 0,
      freeToTrial: 0,
      averageOrderValue: 0,
      chartData: []
    },
    topStrategies: [],
    recentActivity: []
  };

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  const chartOptions = [
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'subscribers', label: 'Subscribers', icon: '👥' },
    { id: 'conversions', label: 'Conversions', icon: '📈' }
  ];

  return (
    <div className="creator-analytics">
      <div className="analytics-header">
        <div className="header-left">
          <h2>Analytics & Insights</h2>
          <p>Track your performance and grow your creator business</p>
        </div>
        
        <div className="time-range-selector">
          {timeRangeOptions.map(option => (
            <button
              key={option.value}
              className={`range-btn ${timeRange === option.value ? 'active' : ''}`}
              onClick={() => setTimeRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="metrics-overview">
        <div className="metric-card revenue">
          <div className="metric-header">
            <span className="metric-icon">💰</span>
            <span className="metric-title">Total Revenue</span>
          </div>
          <div className="metric-value">${mockData.revenue.total.toLocaleString()}</div>
          <div className="metric-change positive">
            +{mockData.revenue.growth}% vs last period
          </div>
        </div>

        <div className="metric-card subscribers">
          <div className="metric-header">
            <span className="metric-icon">👥</span>
            <span className="metric-title">Total Subscribers</span>
          </div>
          <div className="metric-value">{mockData.subscribers.total}</div>
          <div className="metric-change positive">
            +{mockData.subscribers.newThisMonth} this month
          </div>
        </div>

        <div className="metric-card conversion">
          <div className="metric-header">
            <span className="metric-icon">📊</span>
            <span className="metric-title">Conversion Rate</span>
          </div>
          <div className="metric-value">{mockData.conversions.trialToSubscriber}%</div>
          <div className="metric-change neutral">
            Trial to subscriber
          </div>
        </div>

        <div className="metric-card aov">
          <div className="metric-header">
            <span className="metric-icon">💵</span>
            <span className="metric-title">Avg. Order Value</span>
          </div>
          <div className="metric-value">${mockData.conversions.averageOrderValue}</div>
          <div className="metric-change neutral">
            Per subscription
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <div className="chart-header">
          <div className="chart-tabs">
            {chartOptions.map(option => (
              <button
                key={option.id}
                className={`chart-tab ${activeChart === option.id ? 'active' : ''}`}
                onClick={() => setActiveChart(option.id)}
              >
                <span className="tab-icon">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-container">
          {activeChart === 'revenue' && (
            <RevenueChart data={analyticsData.revenue.chartData} timeRange={timeRange} />
          )}
          {activeChart === 'subscribers' && (
            <SubscriberGrowthChart data={analyticsData.subscribers.chartData} timeRange={timeRange} />
          )}
          {activeChart === 'conversions' && (
            <ConversionRateChart data={analyticsData.conversions.chartData} timeRange={timeRange} />
          )}
        </div>
      </div>

      {/* Top Performing Strategies */}
      <div className="top-strategies-section">
        <h3>Top Performing Strategies</h3>
        {mockData.topStrategies.length > 0 ? (
          <div className="strategies-list">
            {mockData.topStrategies.map((strategy, index) => (
              <div key={index} className="strategy-performance">
                <div className="strategy-rank">#{index + 1}</div>
                <div className="strategy-info">
                  <h4>{strategy.name}</h4>
                  <p>{strategy.subscribers} subscribers</p>
                </div>
                <div className="strategy-earnings">
                  <span className="earnings">${strategy.earnings}</span>
                  <span className="growth">+{strategy.growth}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-strategies">
            <div className="empty-icon">📊</div>
            <h4>No Performance Data Yet</h4>
            <p>Strategy performance metrics will appear here once you have monetized strategies with subscribers.</p>
          </div>
        )}
      </div>

      {/* Insights & Recommendations */}
      <div className="insights-section">
        <h3>Insights & Recommendations</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">💡</div>
            <div className="insight-content">
              <h4>Optimize Your Profile</h4>
              <p>Complete your creator profile to build trust with potential subscribers.</p>
              <button className="insight-action">Update Profile</button>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>Create Your First Strategy</h4>
              <p>Start monetizing by creating and pricing your first trading strategy.</p>
              <button className="insight-action">Create Strategy</button>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <h4>Enable Free Trials</h4>
              <p>Strategies with free trials convert 3x better than those without.</p>
              <button className="insight-action">Learn More</button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .creator-analytics {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
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

        .time-range-selector {
          display: flex;
          gap: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 4px;
        }

        .range-btn {
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

        .range-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .range-btn.active {
          color: white;
          background: rgba(99, 102, 241, 0.2);
        }

        .metrics-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .metric-card.revenue {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
          border-color: rgba(16, 185, 129, 0.2);
        }

        .metric-card.subscribers {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
          border-color: rgba(59, 130, 246, 0.2);
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .metric-icon {
          font-size: 20px;
        }

        .metric-title {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 500;
        }

        .metric-value {
          color: white;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .metric-change {
          font-size: 14px;
          font-weight: 500;
        }

        .metric-change.positive {
          color: #10b981;
        }

        .metric-change.neutral {
          color: rgba(255, 255, 255, 0.6);
        }

        .chart-section {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
        }

        .chart-header {
          margin-bottom: 24px;
        }

        .chart-tabs {
          display: flex;
          gap: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 4px;
        }

        .chart-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chart-tab:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .chart-tab.active {
          color: white;
          background: rgba(99, 102, 241, 0.2);
        }

        .tab-icon {
          font-size: 16px;
        }

        .chart-container {
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chart-placeholder {
          text-align: center;
          padding: 40px;
        }

        .chart-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .chart-placeholder h3 {
          color: white;
          font-size: 20px;
          margin-bottom: 8px;
        }

        .chart-placeholder p {
          color: rgba(255, 255, 255, 0.6);
          max-width: 400px;
          margin: 0 auto;
        }

        .top-strategies-section h3,
        .insights-section h3 {
          color: white;
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .empty-strategies {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 40px;
          text-align: center;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-strategies h4 {
          color: white;
          font-size: 18px;
          margin-bottom: 8px;
        }

        .empty-strategies p {
          color: rgba(255, 255, 255, 0.6);
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .insight-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          transition: all 0.2s ease;
        }

        .insight-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .insight-icon {
          font-size: 24px;
          margin-top: 4px;
        }

        .insight-content {
          flex: 1;
        }

        .insight-content h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .insight-content p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 16px 0;
          line-height: 1.4;
        }

        .insight-action {
          background: rgba(99, 102, 241, 0.2);
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .insight-action:hover {
          background: rgba(99, 102, 241, 0.3);
          color: white;
        }

        @media (max-width: 768px) {
          .analytics-header {
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
          }

          .time-range-selector {
            justify-content: stretch;
          }

          .range-btn {
            flex: 1;
            text-align: center;
          }

          .metrics-overview {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
          }

          .metric-card {
            padding: 20px;
          }

          .metric-value {
            font-size: 24px;
          }

          .chart-tabs {
            flex-direction: column;
          }

          .insights-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .insight-card {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default CreatorAnalytics;