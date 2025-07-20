import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Filter, Download } from 'lucide-react';
import { useCreator } from '@/hooks/useCreator';

const EarningsBreakdown = () => {
  const { useCreatorEarnings } = useCreator();
  const { data: earnings, isLoading } = useCreatorEarnings();
  const [filter, setFilter] = useState('all'); // all, pending, paid
  const [timeFilter, setTimeFilter] = useState('30d');

  const filteredEarnings = (earnings || []).filter(earning => {
    if (filter !== 'all' && earning.status !== filter) return false;
    // Add time filtering logic here
    return true;
  });

  const totals = filteredEarnings.reduce((acc, earning) => {
    acc.gross += earning.grossAmount;
    acc.fees += earning.platformFee;
    acc.net += earning.netAmount;
    return acc;
  }, { gross: 0, fees: 0, net: 0 });

  const handleExport = () => {
    // Export to CSV logic
    const csv = [
      ['Date', 'Strategy', 'Subscriber', 'Type', 'Gross', 'Fee', 'Net', 'Status', 'Payout Date'],
      ...filteredEarnings.map(e => [
        new Date(e.date).toLocaleDateString(),
        e.strategy,
        e.subscriber,
        e.type,
        e.grossAmount.toFixed(2),
        e.platformFee.toFixed(2),
        e.netAmount.toFixed(2),
        e.status,
        e.payoutDate ? new Date(e.payoutDate).toLocaleDateString() : 'Pending'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="earnings-breakdown">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '300px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ color: 'white', fontSize: '18px' }}>Loading earnings data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="earnings-breakdown">
      <div className="breakdown-header">
        <div className="header-info">
          <h3>Transaction History</h3>
          <p>Track your earnings and platform fees</p>
        </div>
        <div className="header-actions">
          <div className="filter-group">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Transactions</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <button className="export-button" onClick={handleExport}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="earnings-summary">
        <div className="summary-card">
          <span className="summary-label">Gross Earnings</span>
          <span className="summary-value">${totals.gross.toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Platform Fees</span>
          <span className="summary-value fee">-${totals.fees.toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Net Earnings</span>
          <span className="summary-value net">${totals.net.toFixed(2)}</span>
        </div>
      </div>

      <div className="transactions-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Strategy</th>
              <th>Subscriber</th>
              <th>Type</th>
              <th>Gross</th>
              <th>Fee</th>
              <th>Net</th>
              <th>Status</th>
              <th>Payout</th>
            </tr>
          </thead>
          <tbody>
            {filteredEarnings.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  <p>No transactions found for the selected filters</p>
                </td>
              </tr>
            ) : (
              filteredEarnings.map(earning => (
                <tr key={earning.id}>
                  <td>{new Date(earning.date).toLocaleDateString()}</td>
                  <td>{earning.strategy}</td>
                  <td>{earning.subscriber}</td>
                  <td>
                    <span className={`type-badge ${earning.type}`}>
                      {earning.type === 'subscription' ? 'Sub' : 'One-time'}
                    </span>
                  </td>
                  <td>${earning.grossAmount.toFixed(2)}</td>
                  <td className="fee">-${earning.platformFee.toFixed(2)}</td>
                  <td className="net">${earning.netAmount.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${earning.status}`}>
                      {earning.status}
                    </span>
                  </td>
                  <td>
                    {earning.payoutDate 
                      ? new Date(earning.payoutDate).toLocaleDateString()
                      : 'Pending'
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .earnings-breakdown {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .breakdown-header {
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

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .filter-group {
          display: flex;
          gap: 8px;
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

        .export-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .export-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .earnings-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .summary-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .summary-value {
          color: white;
          font-size: 24px;
          font-weight: 600;
        }

        .summary-value.fee {
          color: #ef4444;
        }

        .summary-value.net {
          color: #10b981;
        }

        .transactions-table {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          overflow: hidden;
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

        tr:hover td {
          background: rgba(255, 255, 255, 0.02);
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

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.paid {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .status-badge.pending {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        td.fee {
          color: #ef4444;
        }

        td.net {
          color: #10b981;
        }

        .empty-state {
          text-align: center;
          padding: 48px;
        }

        .empty-state p {
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        @media (max-width: 768px) {
          .breakdown-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
            flex-direction: column;
          }

          .filter-group {
            width: 100%;
          }

          .filter-select {
            flex: 1;
          }

          .earnings-summary {
            grid-template-columns: 1fr;
          }

          .transactions-table {
            overflow-x: auto;
          }

          table {
            min-width: 700px;
          }
        }
      `}</style>
    </div>
  );
};

export default EarningsBreakdown;