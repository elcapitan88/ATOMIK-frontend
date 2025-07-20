import React, { useState } from 'react';
import { Calendar, CreditCard, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';

const PayoutHistory = ({ creatorProfile, payouts = [], isLoading = false }) => {
  const [filter, setFilter] = useState('all'); // all, completed, pending, failed

  const filteredPayouts = payouts.filter(payout => {
    if (filter === 'all') return true;
    return payout.status === filter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'failed':
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const totalPaid = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  if (isLoading) {
    return (
      <div className="payout-history">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '300px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ color: 'white', fontSize: '18px' }}>Loading payout history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="payout-history">
      <div className="history-header">
        <div className="header-info">
          <h3>Payout History</h3>
          <p>Track your earnings payouts</p>
        </div>
        <div className="header-actions">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Payouts</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="payout-summary">
        <div className="summary-card">
          <div className="summary-icon">
            <CreditCard size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-label">Total Paid Out</span>
            <span className="summary-value">${totalPaid.toFixed(2)}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon pending">
            <Clock size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-label">Pending Payouts</span>
            <span className="summary-value">${pendingAmount.toFixed(2)}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">
            <Calendar size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-label">Next Payout</span>
            <span className="summary-value">
              {pendingAmount > 0 ? 'In 2 days' : 'No pending'}
            </span>
          </div>
        </div>
      </div>

      <div className="payouts-list">
        {filteredPayouts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <h4>No payouts yet</h4>
            <p>Your payouts will appear here once you start earning</p>
          </div>
        ) : (
          filteredPayouts.map(payout => (
            <div key={payout.id} className="payout-item">
              <div className="payout-main">
                <div className="payout-icon" style={{ color: getStatusColor(payout.status) }}>
                  {getStatusIcon(payout.status)}
                </div>
                <div className="payout-details">
                  <div className="payout-header">
                    <h4>${payout.amount.toFixed(2)}</h4>
                    <span className={`status-badge ${payout.status}`}>
                      {payout.status}
                    </span>
                  </div>
                  <div className="payout-meta">
                    <span>Transaction ID: {payout.transactionId}</span>
                    <span>•</span>
                    <span>Bank Account: {payout.bankAccount}</span>
                  </div>
                  <div className="payout-dates">
                    <span>Initiated: {new Date(payout.date).toLocaleDateString()}</span>
                    {payout.status === 'completed' && payout.processedDate && (
                      <>
                        <span>•</span>
                        <span>Completed: {new Date(payout.processedDate).toLocaleDateString()}</span>
                      </>
                    )}
                    {payout.status === 'pending' && payout.estimatedDate && (
                      <>
                        <span>•</span>
                        <span>Expected: {new Date(payout.estimatedDate).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="payout-actions">
                <button className="action-button">
                  <Download size={16} />
                  Receipt
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .payout-history {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          padding: 24px;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-info h3 {
          color: white;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .header-info p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin: 0;
        }

        .filter-select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }

        .payout-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 8px;
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .summary-icon {
          width: 48px;
          height: 48px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
        }

        .summary-icon.pending {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .summary-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .summary-value {
          color: white;
          font-size: 20px;
          font-weight: 600;
        }

        .payouts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .payout-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
        }

        .payout-item:hover {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
        }

        .payout-main {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          flex: 1;
        }

        .payout-icon {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .payout-details {
          flex: 1;
        }

        .payout-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .payout-header h4 {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-badge.completed {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .status-badge.pending {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .status-badge.failed {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .payout-meta,
        .payout-dates {
          display: flex;
          gap: 8px;
          align-items: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin-bottom: 4px;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .empty-state {
          text-align: center;
          padding: 48px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h4 {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        @media (max-width: 768px) {
          .payout-summary {
            grid-template-columns: 1fr;
          }

          .payout-item {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .payout-actions {
            width: 100%;
          }

          .action-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default PayoutHistory;