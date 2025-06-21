import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ATOMIC_TERMS } from '../../../utils/constants/atomikTerminology';
import { ATOMIC_COLORS, injectResponsiveStyles } from '../shared/TradingLabUtils';
import { devices } from '../../../styles/theme/breakpoints';
import logger from '../../../utils/logger';

/**
 * NetworkOverview - Trading Lab Dashboard Network Display
 * 
 * Shows Core Account and Satellite accounts with network power,
 * synchronization status, and management options. Features atomic
 * terminology and premium Trading Lab aesthetics.
 */

const NetworkOverview = ({ 
  coreAccount,
  satelliteAccounts = [],
  selectedStrategy,
  onAddSatellite,
  onManageAccount,
  isMobileView = false 
}) => {
  const [expandedAccount, setExpandedAccount] = useState(null);

  const totalNetworkPower = [coreAccount, ...satelliteAccounts]
    .filter(Boolean)
    .reduce((total, account) => total + (account.balance || 0), 0);

  const allAccountsConnected = coreAccount && 
    satelliteAccounts.every(account => account.connected);

  const handleAccountClick = (accountId) => {
    setExpandedAccount(expandedAccount === accountId ? null : accountId);
  };

  const handleAddSatellite = () => {
    logger.info('[NetworkOverview] Add satellite account clicked');
    if (onAddSatellite) {
      onAddSatellite();
    }
  };

  const formatBalance = (balance) => {
    if (balance >= 1000000) {
      return `$${(balance / 1000000).toFixed(1)}M`;
    } else if (balance >= 1000) {
      return `$${(balance / 1000).toFixed(0)}K`;
    } else {
      return `$${balance?.toLocaleString() || '0'}`;
    }
  };

  return (
    <div style={styles.container} className="network-overview">
      {/* Network Status Header */}
      <div style={styles.networkHeader}>
        <div style={styles.headerLeft}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={styles.atomIcon}
          >
            ⚛️
          </motion.div>
          <div style={styles.headerInfo}>
            <h2 style={styles.networkTitle}>Trading Network</h2>
            <div style={styles.networkStatus}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  ...styles.statusDot,
                  background: allAccountsConnected ? '#10B981' : '#F59E0B'
                }}
              />
              <span style={styles.statusText}>
                {allAccountsConnected ? 'SYNCHRONIZED' : 'PARTIAL SYNC'}
              </span>
            </div>
          </div>
        </div>
        
        <div style={styles.networkPower}>
          <span style={styles.powerLabel}>Network Power</span>
          <span style={styles.powerValue}>{formatBalance(totalNetworkPower)}</span>
        </div>
      </div>

      {/* Core Account */}
      {coreAccount && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.accountCard}
          className="core-account-card"
        >
          <div style={styles.accountHeader}>
            <div style={styles.accountType}>
              <span style={styles.accountIcon}>⚛️</span>
              <span style={styles.accountTypeLabel}>{ATOMIC_TERMS.CORE_ACCOUNT}</span>
            </div>
            <div style={styles.accountStatus}>
              <div style={{
                ...styles.connectionDot,
                background: coreAccount.connected ? '#10B981' : '#EF4444'
              }} />
              <span style={styles.connectionText}>
                {coreAccount.connected ? 'ACTIVE' : 'DISCONNECTED'}
              </span>
            </div>
          </div>

          <div style={styles.accountDetails}>
            <div style={styles.accountInfo}>
              <h3 style={styles.accountName}>
                {coreAccount.nickname || coreAccount.name}
              </h3>
              <p style={styles.accountBroker}>
                {coreAccount.broker} • {coreAccount.environment || 'live'}
              </p>
            </div>
            <div style={styles.accountBalance}>
              {formatBalance(coreAccount.balance)}
            </div>
          </div>

          {selectedStrategy && (
            <div style={styles.strategyInfo}>
              <span style={styles.strategyLabel}>Running:</span>
              <span style={styles.strategyName}>{selectedStrategy.name}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Satellite Accounts */}
      {satelliteAccounts.length > 0 && (
        <div style={styles.satelliteSection}>
          <h3 style={styles.satelliteHeader}>
            🛰️ {ATOMIC_TERMS.SATELLITE_ACCOUNT} ({satelliteAccounts.length})
          </h3>
          
          <div style={styles.satelliteGrid}>
            {satelliteAccounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                style={styles.satelliteCard}
                className="satellite-account-card"
              >
                <div style={styles.satelliteHeader}>
                  <div style={styles.satelliteInfo}>
                    <h4 style={styles.satelliteName}>
                      {account.nickname || account.name}
                    </h4>
                    <p style={styles.satelliteBroker}>
                      {account.broker} • {account.environment || 'live'}
                    </p>
                  </div>
                  <div style={styles.satelliteStatus}>
                    <div style={{
                      ...styles.connectionDot,
                      background: account.connected ? '#10B981' : '#EF4444'
                    }} />
                  </div>
                </div>

                <div style={styles.satelliteBalance}>
                  {formatBalance(account.balance)}
                </div>

                <div style={styles.syncStatus}>
                  <span style={styles.syncLabel}>
                    {account.connected ? '⚡ Synchronized' : '⚠️ Disconnected'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Add Satellite Button */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={styles.addSatelliteSection}
      >
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddSatellite}
          style={styles.addSatelliteButton}
          className="add-satellite-button"
        >
          <span style={styles.addIcon}>🔗</span>
          <span>Add {ATOMIC_TERMS.SATELLITE_ACCOUNT_SHORT} Account</span>
        </motion.button>
        
        <p style={styles.addSatelliteDescription}>
          Amplify your network power with additional synchronized accounts
        </p>
      </motion.div>
    </div>
  );
};

const styles = {
  container: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '2rem',
    backdropFilter: 'blur(20px)'
  },
  networkHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  atomIcon: {
    fontSize: '2.5rem'
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  networkTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#ffffff',
    margin: 0
  },
  networkStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    boxShadow: '0 0 12px currentColor'
  },
  statusText: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#10B981',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  networkPower: {
    textAlign: 'right'
  },
  powerLabel: {
    display: 'block',
    fontSize: '0.9rem',
    color: '#888888',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    marginBottom: '0.25rem'
  },
  powerValue: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: ATOMIC_COLORS.PRIMARY,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  accountCard: {
    background: 'rgba(0, 198, 224, 0.08)',
    border: '1px solid rgba(0, 198, 224, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.5rem'
  },
  accountHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  accountType: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  accountIcon: {
    fontSize: '1.2rem'
  },
  accountTypeLabel: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: ATOMIC_COLORS.PRIMARY,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  accountStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  connectionDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    boxShadow: '0 0 8px currentColor'
  },
  connectionText: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#10B981',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  accountDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  accountInfo: {
    flex: 1
  },
  accountName: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: '0 0 0.25rem 0'
  },
  accountBroker: {
    fontSize: '0.9rem',
    color: '#cccccc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0
  },
  accountBalance: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  strategyInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px'
  },
  strategyLabel: {
    fontSize: '0.9rem',
    color: '#888888',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  strategyName: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  satelliteSection: {
    marginBottom: '2rem'
  },
  satelliteHeader: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    marginBottom: '1rem'
  },
  satelliteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem'
  },
  satelliteCard: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '1.25rem'
  },
  satelliteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  satelliteInfo: {
    flex: 1
  },
  satelliteName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: '0 0 0.25rem 0'
  },
  satelliteBroker: {
    fontSize: '0.8rem',
    color: '#cccccc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0
  },
  satelliteStatus: {
    display: 'flex',
    alignItems: 'center'
  },
  satelliteBalance: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    marginBottom: '0.75rem'
  },
  syncStatus: {
    padding: '0.5rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '6px'
  },
  syncLabel: {
    fontSize: '0.8rem',
    color: '#10B981',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  addSatelliteSection: {
    textAlign: 'center'
  },
  addSatelliteButton: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem'
  },
  addIcon: {
    fontSize: '1.2rem'
  },
  addSatelliteDescription: {
    fontSize: '0.9rem',
    color: '#888888',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0
  }
};

// Responsive styles
const responsiveStyles = `
  @media ${devices.mobile} {
    .network-overview .container {
      padding: 1.5rem;
    }
    
    .network-overview .network-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .network-overview .satellite-grid {
      grid-template-columns: 1fr;
    }
    
    .network-overview .add-satellite-button {
      width: 100%;
      justify-content: center;
    }
  }
  
  @media ${devices.tablet} {
    .network-overview .satellite-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

// Inject responsive styles
injectResponsiveStyles(responsiveStyles, 'network-overview-styles');

export default NetworkOverview;