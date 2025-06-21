import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ATOMIC_TERMS } from '../../../utils/constants/atomikTerminology';
import { ATOMIC_COLORS, injectResponsiveStyles } from '../shared/TradingLabUtils';
import BrokerSelection from '../account-connection/BrokerSelection';
import { devices } from '../../../styles/theme/breakpoints';
import logger from '../../../utils/logger';

/**
 * SatelliteAccountManager - Satellite Account Connection Flow
 * 
 * Reuses existing BrokerSelection component for adding satellite accounts
 * to the trading network. Follows atomic terminology and Trading Lab UX.
 */

const SatelliteAccountManager = ({ 
  onAccountConnect,
  onCancel,
  coreAccount,
  existingSatellites = [],
  isMobileView = false 
}) => {
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleBrokerSelect = async (broker, skipAutoConnect = false) => {
    logger.info('[SatelliteAccountManager] Satellite broker selected:', broker.name);
    setSelectedBroker(broker);
    setErrorMessage(null);
    
    if (!skipAutoConnect) {
      // For satellites, auto-connect with same logic as CoreAccountSetup
      setTimeout(() => {
        handleConnect(broker);
      }, 800);
    }
  };

  const handleEnvironmentSelect = (environment) => {
    logger.info('[SatelliteAccountManager] Environment selected for satellite:', environment);
    
    // Auto-connect after environment selection
    setTimeout(() => {
      handleConnect(selectedBroker, environment);
    }, 500);
  };

  const handleConnect = async (brokerToConnect, environment = 'live') => {
    if (!brokerToConnect) return;

    setIsConnecting(true);
    setConnectionProgress(0);
    setErrorMessage(null);

    try {
      logger.info('[SatelliteAccountManager] Connecting satellite account:', brokerToConnect.name, environment);
      
      // TEMPORARY: Simulate satellite account connection
      // TODO: Replace with real OAuth flow when ready
      const isSimulatingConnection = true;
      
      if (isSimulatingConnection) {
        // Simulate connection progress
        setConnectionProgress(25);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setConnectionProgress(50);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setConnectionProgress(75);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setConnectionProgress(100);
        
        // Create mock satellite account data
        const satelliteAccount = {
          id: `${brokerToConnect.name.toLowerCase()}_satellite_${Date.now()}`,
          name: `${brokerToConnect.name} Satellite`,
          nickname: brokerToConnect.isPropFirm ? `${brokerToConnect.name} Funded Satellite` : `${brokerToConnect.name} Satellite`,
          balance: brokerToConnect.isPropFirm ? 50000 : Math.floor(Math.random() * 50000) + 10000,
          environment: environment,
          broker: brokerToConnect.name,
          connected: true,
          type: 'satellite',
          synchronizedWith: coreAccount?.id
        };
        
        // Wait a moment to show success, then complete
        setTimeout(() => {
          logger.info('[SatelliteAccountManager] Satellite connection complete');
          if (onAccountConnect) {
            onAccountConnect(satelliteAccount);
          }
        }, 1000);
        
      } else {
        // TODO: Real OAuth flow for satellite accounts
        // This would reuse the same OAuth infrastructure as CoreAccountSetup
      }

    } catch (error) {
      logger.error('[SatelliteAccountManager] Satellite connection error:', error);
      setErrorMessage(error.message || 'Failed to connect satellite account. Please try again.');
      setIsConnecting(false);
      setConnectionProgress(0);
    }
  };

  const getProgressMessage = () => {
    if (connectionProgress < 30) return 'Establishing satellite connection...';
    if (connectionProgress < 60) return 'Synchronizing with network...';
    if (connectionProgress < 90) return 'Verifying network alignment...';
    return 'Completing satellite integration...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      style={styles.container}
      className="satellite-account-manager"
    >
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={styles.atomIcon}
          >
            ⚛️
          </motion.div>
          <div>
            <h2 style={styles.title}>Add {ATOMIC_TERMS.SATELLITE_ACCOUNT_SHORT} Account</h2>
            <p style={styles.subtitle}>
              Amplify your network power with synchronized trading
            </p>
          </div>
        </div>
        
        <button
          onClick={onCancel}
          style={styles.cancelButton}
          className="cancel-button"
        >
          ✕
        </button>
      </div>

      {/* Network Context */}
      <div style={styles.networkContext}>
        <div style={styles.contextCard}>
          <span style={styles.contextLabel}>⚛️ {ATOMIC_TERMS.CORE_ACCOUNT}:</span>
          <span style={styles.contextValue}>
            {coreAccount?.nickname || coreAccount?.name || 'Primary Account'}
          </span>
        </div>
        {existingSatellites.length > 0 && (
          <div style={styles.contextCard}>
            <span style={styles.contextLabel}>🛰️ Existing Satellites:</span>
            <span style={styles.contextValue}>
              {existingSatellites.length} connected
            </span>
          </div>
        )}
      </div>

      {/* Connection Status or Broker Selection */}
      <div style={styles.content}>
        <AnimatePresence mode="wait">
          {isConnecting ? (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={styles.connectingCard}
            >
              <div style={styles.connectingHeader}>
                <h3 style={styles.connectingTitle}>
                  Connecting {selectedBroker?.name} Satellite
                </h3>
              </div>

              <div style={styles.progressContainer}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${connectionProgress}%` }}
                  transition={{ duration: 0.3 }}
                  style={styles.progressBar}
                />
              </div>

              <p style={styles.progressMessage}>
                {getProgressMessage()}
              </p>

              {connectionProgress === 100 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={styles.successMessage}
                >
                  <span style={styles.successIcon}>✅</span>
                  <span>Satellite synchronized successfully!</span>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BrokerSelection
                onBrokerSelect={handleBrokerSelect}
                selectedBroker={selectedBroker}
                onEnvironmentSelect={handleEnvironmentSelect}
                isMobileView={isMobileView}
                touchOptimized={true}
              />

              {/* Satellite Benefits */}
              <div style={styles.benefitsSection}>
                <h3 style={styles.benefitsTitle}>Satellite Account Benefits</h3>
                <div style={styles.benefitsGrid}>
                  <div style={styles.benefit}>
                    <span style={styles.benefitIcon}>🔗</span>
                    <span style={styles.benefitText}>Perfect Synchronization</span>
                  </div>
                  <div style={styles.benefit}>
                    <span style={styles.benefitIcon}>⚡</span>
                    <span style={styles.benefitText}>Amplified Network Power</span>
                  </div>
                  <div style={styles.benefit}>
                    <span style={styles.benefitIcon}>🎯</span>
                    <span style={styles.benefitText}>Risk Distribution</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={styles.errorMessage}
                >
                  <span style={styles.errorIcon}>⚠️</span>
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const styles = {
  container: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '2rem',
    backdropFilter: 'blur(20px)',
    maxWidth: '900px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  title: {
    fontSize: '1.8rem',
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#ffffff',
    margin: '0 0 0.5rem 0'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#cccccc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0
  },
  cancelButton: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    padding: '0.5rem',
    borderRadius: '8px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  networkContext: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem'
  },
  contextCard: {
    background: 'rgba(0, 198, 224, 0.1)',
    border: '1px solid rgba(0, 198, 224, 0.3)',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1
  },
  contextLabel: {
    fontSize: '0.9rem',
    color: ATOMIC_COLORS.PRIMARY,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  contextValue: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  content: {
    minHeight: '400px'
  },
  connectingCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '2rem',
    textAlign: 'center'
  },
  connectingHeader: {
    marginBottom: '2rem'
  },
  connectingTitle: {
    fontSize: '1.3rem',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#ffffff',
    margin: 0
  },
  progressContainer: {
    width: '100%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '1rem'
  },
  progressBar: {
    height: '100%',
    background: ATOMIC_COLORS.PRIMARY,
    borderRadius: '4px',
    boxShadow: `0 0 20px ${ATOMIC_COLORS.PRIMARY}40`
  },
  progressMessage: {
    fontSize: '0.9rem',
    color: '#cccccc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    marginBottom: '1rem'
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    color: '#10B981',
    fontSize: '1rem',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    marginTop: '1rem'
  },
  successIcon: {
    fontSize: '1.2rem'
  },
  benefitsSection: {
    marginTop: '2rem',
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px'
  },
  benefitsTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#ffffff',
    marginBottom: '1rem',
    textAlign: 'center'
  },
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem'
  },
  benefit: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px'
  },
  benefitIcon: {
    fontSize: '1.5rem'
  },
  benefitText: {
    fontSize: '0.8rem',
    color: '#cccccc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    textAlign: 'center'
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginTop: '1rem',
    padding: '1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#EF4444',
    fontSize: '0.9rem',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  errorIcon: {
    fontSize: '1.2rem'
  }
};

// Responsive styles
const responsiveStyles = `
  @media ${devices.mobile} {
    .satellite-account-manager .container {
      padding: 1.5rem;
    }
    
    .satellite-account-manager .header {
      flex-direction: column;
      gap: 1rem;
    }
    
    .satellite-account-manager .network-context {
      flex-direction: column;
    }
    
    .satellite-account-manager .benefits-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    
    .satellite-account-manager .title {
      font-size: 1.5rem;
    }
  }
  
  @media ${devices.tablet} {
    .satellite-account-manager .benefits-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
`;

// Inject responsive styles
injectResponsiveStyles(responsiveStyles, 'satellite-account-manager-styles');

export default SatelliteAccountManager;