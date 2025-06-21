import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TradingLabContext } from '../../../contexts/TradingLabContext';
import { useOAuth } from '../../../hooks/useOAuth';
import { ENVIRONMENTS } from '../../../utils/constants/brokers';
import BrokerSelection from './BrokerSelection';
import AtomikAnimations from '../shared/AtomikAnimations';
import { ATOMIC_COLORS } from '../shared/TradingLabUtils';
import logger from '../../../utils/logger';

const SatelliteSetup = ({ onComplete, onSkip, coreAccount }) => {
  const { initiateBrokerAuth, isProcessing, error: oauthError } = useOAuth();
  const { 
    networkAccounts, 
    setNetworkAccounts,
    selectedStrategy,
    addSatelliteAccount
  } = useContext(TradingLabContext);
  
  const [currentStep, setCurrentStep] = useState('selection'); // 'selection', 'connecting', 'connected'
  const [satelliteAccounts, setSatelliteAccounts] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [selectedBroker, setSelectedBroker] = useState(null);

  const handleBrokerSelect = async (broker) => {
    setSelectedBroker(broker);
    setIsConnecting(true);
    setCurrentStep('connecting');
    
    try {
      logger.info('[SatelliteSetup] Initiating REAL OAuth for satellite account:', broker.name);
      
      // Store satellite connection context
      sessionStorage.setItem('trading_lab_satellite_context', JSON.stringify({
        step: 'satellite_connection',
        coreAccount: coreAccount,
        selectedStrategy: selectedStrategy,
        satelliteCount: satelliteAccounts.length + 1,
        timestamp: Date.now()
      }));

      setConnectionProgress(25);

      // Get proper broker ID for OAuth (handle prop firms)
      const oauthBrokerId = broker.isPropFirm && broker.underlyingBroker 
        ? broker.underlyingBroker 
        : broker.id;
      
      // Initiate REAL OAuth flow for satellite account
      await initiateBrokerAuth(oauthBrokerId, ENVIRONMENTS.LIVE);
      
      // OAuth will redirect and return to callback

    } catch (error) {
      logger.error('[SatelliteSetup] OAuth initiation error:', error);
      setIsConnecting(false);
      setCurrentStep('selection');
      setConnectionProgress(0);
      // Show error to user
    }
    
    // Note: Actual satellite account data will be handled by OAuth callback
    // The callback will process the real account information and redirect back to Trading Lab
  };

  const handleAddAnother = () => {
    setCurrentStep('selection');
    setSelectedBroker(null);
    setConnectionProgress(0);
  };

  const handleComplete = () => {
    onComplete(satelliteAccounts);
  };

  const totalNetworkPower = (coreAccount?.buyingPower || 0) + 
    satelliteAccounts.reduce((sum, acc) => sum + (acc.buyingPower || 0), 0);

  const renderBrokerSelection = () => (
    <motion.div
      style={styles.selectionContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div style={styles.header}>
        <div style={styles.satelliteIcon}>
          🛰️
        </div>
        <h2 style={styles.title}>Add Satellite Account</h2>
        <p style={styles.subtitle}>
          Expand your trading network power
        </p>
      </div>

      <div style={styles.networkStatus}>
        <div style={styles.coreInfo}>
          <span style={styles.coreLabel}>⚛️ Core Element:</span>
          <span style={styles.coreAccount}>
            {coreAccount?.broker} •••{coreAccount?.accountNumber}
          </span>
          <span style={styles.corePower}>
            {TradingLabUtils.formatCurrency(coreAccount?.buyingPower || 0)}
          </span>
        </div>
      </div>

      <BrokerSelection
        onSelect={handleBrokerSelect}
        excludeBrokers={[coreAccount?.broker]}
        title="Choose satellite broker:"
        subtitle="Connect another account to amplify your network"
      />

      <div style={styles.actionButtons}>
        <motion.button
          style={styles.skipButton}
          onClick={onSkip}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Skip Satellite Setup
        </motion.button>
      </div>
    </motion.div>
  );

  const renderConnecting = () => (
    <motion.div
      style={styles.connectingContainer}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
    >
      <div style={styles.header}>
        <AtomikAnimations.LoadingSpinner type="satellite_sync" />
        <h2 style={styles.title}>Synchronizing Satellite</h2>
        <p style={styles.subtitle}>
          Connecting {selectedBroker?.name} to your network
        </p>
      </div>

      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <motion.div
            style={{
              ...styles.progressFill,
              width: `${connectionProgress}%`
            }}
            animate={{ width: `${connectionProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div style={styles.progressText}>
          {connectionProgress}% complete
        </div>
      </div>

      <div style={styles.securityNote}>
        <span style={styles.lockIcon}>🔒</span>
        <p style={styles.securityText}>
          Your credentials are secured with enterprise-grade encryption
        </p>
      </div>
    </motion.div>
  );

  const renderConnected = () => (
    <motion.div
      style={styles.connectedContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div style={styles.header}>
        <motion.div
          style={styles.successIcon}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2
          }}
        >
          ✅
        </motion.div>
        <h2 style={styles.title}>Satellite Connected!</h2>
        <p style={styles.subtitle}>
          Your network is growing stronger
        </p>
      </div>

      <div style={styles.networkOverview}>
        <h3 style={styles.overviewTitle}>🔗 Your Trading Network:</h3>
        
        {/* Core Account */}
        <div style={styles.accountCard}>
          <div style={styles.accountHeader}>
            <span style={styles.accountType}>⚛️ Core Element</span>
            <span style={styles.accountStatus}>🟢 Active</span>
          </div>
          <div style={styles.accountDetails}>
            <span style={styles.accountName}>
              {coreAccount?.broker} •••{coreAccount?.accountNumber}
            </span>
            <span style={styles.accountPower}>
              {TradingLabUtils.formatCurrency(coreAccount?.buyingPower || 0)}
            </span>
          </div>
        </div>

        {/* Satellite Accounts */}
        {satelliteAccounts.map((account, index) => (
          <motion.div
            key={account.id}
            style={styles.accountCard}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <div style={styles.accountHeader}>
              <span style={styles.accountType}>🛰️ Satellite</span>
              <span style={styles.accountStatus}>🟢 Synchronized</span>
            </div>
            <div style={styles.accountDetails}>
              <span style={styles.accountName}>
                {account.broker} •••{account.accountNumber}
              </span>
              <span style={styles.accountPower}>
                {TradingLabUtils.formatCurrency(account.buyingPower || 0)}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Total Network Power */}
        <motion.div
          style={styles.totalPowerCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span style={styles.totalLabel}>🎯 Total Atomic Power:</span>
          <span style={styles.totalAmount}>
            {TradingLabUtils.formatCurrency(totalNetworkPower)}
          </span>
        </motion.div>
      </div>

      <div style={styles.actionButtons}>
        <motion.button
          style={styles.addAnotherButton}
          onClick={handleAddAnother}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ➕ Add Another Satellite
        </motion.button>
        
        <motion.button
          style={styles.completeButton}
          onClick={handleComplete}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ⚛️ Activate Network →
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <AnimatePresence mode="wait">
          {currentStep === 'selection' && renderBrokerSelection()}
          {currentStep === 'connecting' && renderConnecting()}
          {currentStep === 'connected' && renderConnected()}
        </AnimatePresence>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  content: {
    width: '100%',
    maxWidth: '480px',
  },
  selectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  connectingContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    textAlign: 'center',
  },
  connectedContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1rem',
  },
  satelliteIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    display: 'block',
  },
  successIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    display: 'block',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 600,
    color: '#ffffff',
    margin: '0 0 0.5rem 0',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#cccccc',
    margin: 0,
    fontWeight: 400,
  },
  networkStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1rem',
    backdropFilter: 'blur(10px)',
  },
  coreInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  coreLabel: {
    fontSize: '0.9rem',
    color: '#888888',
    fontWeight: 500,
  },
  coreAccount: {
    fontSize: '1rem',
    color: '#ffffff',
    fontWeight: 500,
  },
  corePower: {
    fontSize: '0.9rem',
    color: '#10B981',
    fontWeight: 500,
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '0.5rem',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00C6E0',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  progressText: {
    fontSize: '0.9rem',
    color: '#cccccc',
    textAlign: 'center',
  },
  securityNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
  lockIcon: {
    fontSize: '1.2rem',
  },
  securityText: {
    fontSize: '0.9rem',
    color: '#888888',
    margin: 0,
  },
  networkOverview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  overviewTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    color: '#ffffff',
    margin: 0,
    textAlign: 'center',
  },
  accountCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1rem',
    backdropFilter: 'blur(10px)',
  },
  accountHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  accountType: {
    fontSize: '0.9rem',
    color: '#00C6E0',
    fontWeight: 500,
  },
  accountStatus: {
    fontSize: '0.8rem',
    color: '#10B981',
    fontWeight: 500,
  },
  accountDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountName: {
    fontSize: '1rem',
    color: '#ffffff',
    fontWeight: 500,
  },
  accountPower: {
    fontSize: '0.9rem',
    color: '#10B981',
    fontWeight: 500,
  },
  totalPowerCard: {
    backgroundColor: 'rgba(0, 198, 224, 0.1)',
    border: '1px solid rgba(0, 198, 224, 0.3)',
    borderRadius: '16px',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  totalLabel: {
    fontSize: '1rem',
    color: '#00C6E0',
    fontWeight: 600,
  },
  totalAmount: {
    fontSize: '1.2rem',
    color: '#00C6E0',
    fontWeight: 700,
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  skipButton: {
    padding: '0.875rem 1.5rem',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    color: '#888888',
    fontSize: '0.95rem',
    fontWeight: 400,
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  addAnotherButton: {
    padding: '0.875rem 1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  completeButton: {
    padding: '1rem 1.5rem',
    backgroundColor: 'rgba(0, 198, 224, 0.1)',
    border: '1px solid rgba(0, 198, 224, 0.3)',
    borderRadius: '16px',
    color: '#00C6E0',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  '@media (max-width: 480px)': {
    content: {
      padding: '0 0.5rem',
    },
    title: {
      fontSize: '1.75rem',
    },
    subtitle: {
      fontSize: '1rem',
    },
  },
};

export default SatelliteSetup;