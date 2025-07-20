import React, { useState } from 'react';
import EarningsBreakdown from './EarningsBreakdown';
import PayoutHistory from './PayoutHistory';
import PayoutSettings from './PayoutSettings';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';

const EarningsOverview = ({ 
  creatorProfile,
  earningsData = {},
  payoutsData = [],
  isLoading = false 
}) => {
  const [activeTab, setActiveTab] = useState('breakdown'); // breakdown, history, settings

  const tabs = [
    { id: 'breakdown', label: 'Earnings Breakdown', icon: DollarSign },
    { id: 'history', label: 'Payout History', icon: Calendar },
    { id: 'settings', label: 'Payout Settings', icon: CreditCard }
  ];

  // Calculate summary from real data
  const summary = {
    totalEarned: earningsData.totalEarned || 0,
    thisMonth: earningsData.thisMonth || 0,
    pendingPayout: earningsData.pendingPayout || 0,
    nextPayoutDate: earningsData.nextPayoutDate || null
  };

  return (
    <div className="earnings-overview">
      <div className="overview-header">
        <h2>Earnings Management</h2>
        <p>Track your earnings, view payout history, and manage payment settings</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="card-icon">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Total Earned</span>
            <span className="card-value">${summary.totalEarned.toFixed(2)}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">This Month</span>
            <span className="card-value">${summary.thisMonth.toFixed(2)}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">
            <Calendar size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Pending Payout</span>
            <span className="card-value">${summary.pendingPayout.toFixed(2)}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">
            <CreditCard size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Next Payout</span>
            <span className="card-value">
              {summary.nextPayoutDate 
                ? new Date(summary.nextPayoutDate).toLocaleDateString()
                : 'No payouts scheduled'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'breakdown' && (
          <EarningsBreakdown 
            creatorProfile={creatorProfile}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'history' && (
          <PayoutHistory 
            creatorProfile={creatorProfile}
            payouts={payoutsData}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'settings' && (
          <PayoutSettings 
            creatorProfile={creatorProfile}
          />
        )}
      </div>

      <style jsx>{`
        .earnings-overview {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .overview-header {
          margin-bottom: 32px;
        }

        .overview-header h2 {
          color: white;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .overview-header p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 16px;
          margin: 0;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .summary-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .card-icon {
          width: 56px;
          height: 56px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
        }

        .card-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .card-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .card-value {
          color: white;
          font-size: 24px;
          font-weight: 600;
        }

        .tabs-container {
          margin-bottom: 24px;
        }

        .tabs {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.02);
          padding: 4px;
          border-radius: 10px;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .tab.active {
          background: rgba(99, 102, 241, 0.2);
          color: #6366f1;
        }

        @media (max-width: 1024px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .earnings-overview {
            padding: 16px;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .tabs {
            flex-wrap: wrap;
          }

          .tab {
            flex: 1;
            min-width: 120px;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default EarningsOverview;