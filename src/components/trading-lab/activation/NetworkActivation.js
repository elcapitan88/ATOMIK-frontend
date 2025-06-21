import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TradingLabContext } from '../../../contexts/TradingLabContext';
import { AtomicSpinner, NetworkSyncAnimation, CelebrationAnimation } from '../shared/AtomikAnimations';
import { ATOMIC_COLORS, SHARED_STYLES, injectResponsiveStyles } from '../shared/TradingLabUtils';
import { formatCurrency } from '../../../utils/formatting/currency';

export const NetworkActivation = ({ strategyConfig, onComplete }) => {
  const { 
    selectedStrategy,
    primaryAccount,
    satelliteAccounts,
    updateNetworkState,
    triggerCelebration,
    NETWORK_STATES
  } = useContext(TradingLabContext);
  
  const [activationStep, setActivationStep] = useState('initializing');
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const isMultiAccount = satelliteAccounts.length > 0;

  // Activation sequence steps
  const activationSteps = isMultiAccount ? [
    { step: 'initializing', message: 'Initializing atomic network...', progress: 10, duration: 1200 },
    { step: 'strategy_configured', message: 'Strategy parameters configured', progress: 25, duration: 1000 },
    { step: 'core_connecting', message: 'Connecting core element...', progress: 40, duration: 1500 },
    { step: 'satellites_syncing', message: 'Synchronizing satellite accounts...', progress: 60, duration: 2000 },
    { step: 'network_mesh', message: 'Establishing network mesh...', progress: 75, duration: 1200 },
    { step: 'market_data', message: 'Connecting to market data streams...', progress: 90, duration: 1000 },
    { step: 'activated', message: 'Network activated successfully!', progress: 100, duration: 800 }
  ] : [
    { step: 'initializing', message: 'Initializing strategy...', progress: 15, duration: 1000 },
    { step: 'strategy_configured', message: 'Strategy parameters configured', progress: 35, duration: 800 },
    { step: 'account_connecting', message: 'Connecting to trading account...', progress: 60, duration: 1200 },
    { step: 'market_data', message: 'Connecting to market data...', progress: 85, duration: 1000 },
    { step: 'activated', message: 'Strategy initiated successfully!', progress: 100, duration: 600 }
  ];

  // Start activation sequence
  useEffect(() => {
    runActivationSequence();
  }, []);

  const runActivationSequence = async () => {
    updateNetworkState(NETWORK_STATES.CONNECTING);

    for (const stepData of activationSteps) {
      setActivationStep(stepData.step);
      setCurrentMessage(stepData.message);
      
      // Animate progress to target
      animateProgress(stepData.progress);
      
      // Wait for step duration
      await new Promise(resolve => setTimeout(resolve, stepData.duration));
    }

    // Mark as complete
    setIsComplete(true);
    updateNetworkState(NETWORK_STATES.ACTIVE);
    
    // Trigger celebration
    if (isMultiAccount) {
      triggerCelebration('network_activated');
    } else {
      triggerCelebration('strategy_initiated');
    }

    // Complete after celebration
    setTimeout(() => {
      onComplete(strategyConfig);
    }, 2000);
  };

  const animateProgress = (targetProgress) => {
    const startProgress = progress;
    const duration = 800;
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      const easeOutProgress = 1 - Math.pow(1 - progressRatio, 3);
      
      const currentProgress = startProgress + (targetProgress - startProgress) * easeOutProgress;
      setProgress(currentProgress);

      if (progressRatio < 1) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  };

  const renderAccountsList = () => {
    const allAccounts = [
      { ...primaryAccount, type: 'core', icon: '⚛️', label: 'Core Element' },
      ...satelliteAccounts.map(acc => ({ ...acc, type: 'satellite', icon: '🛰️', label: 'Satellite' }))
    ];

    return (
      <div style={styles.accountsList}>
        {allAccounts.map((account, index) => (
          <motion.div
            key={account.id || index}
            style={styles.accountItem}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: progress > (index + 1) * 20 ? 1 : 0.3,
              x: 0 
            }}
            transition={{ delay: index * 0.2 }}
          >
            <div style={styles.accountIcon}>
              <motion.span
                animate={progress > (index + 1) * 20 ? { 
                  scale: [1, 1.2, 1],
                  rotate: [0, 360, 720]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {account.icon}
              </motion.span>
            </div>
            <div style={styles.accountDetails}>
              <span style={styles.accountType}>{account.label}</span>
              <span style={styles.accountName}>
                {account.broker} •••{account.accountNumber}
              </span>
              <motion.span 
                style={{
                  ...styles.accountStatus,
                  color: progress > (index + 1) * 20 ? '#10B981' : '#888888'
                }}
                animate={progress > (index + 1) * 20 ? { opacity: [0.5, 1, 0.5] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {progress > (index + 1) * 20 ? 'CONNECTED' : 'CONNECTING...'}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderStrategyInfo = () => (
    <motion.div
      style={styles.strategyInfo}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div style={styles.strategyHeader}>
        <motion.div
          style={styles.strategyIcon}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          ⚡
        </motion.div>
        <div style={styles.strategyDetails}>
          <span style={styles.strategyName}>{selectedStrategy?.name}</span>
          <span style={styles.strategyTarget}>Target: {strategyConfig?.ticker}</span>
          <span style={styles.strategyPower}>
            Total Power: {formatCurrency(strategyConfig?.totalPower || 0)}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <motion.div
          style={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={styles.mainIcon}>
            {isMultiAccount ? '⚛️' : '⚡'}
          </div>
          <h1 style={styles.title}>
            {isMultiAccount ? 'Activating Network' : 'Initiating Strategy'}
          </h1>
          <p style={styles.subtitle}>
            {isMultiAccount 
              ? 'Synchronizing your trading network for coordinated execution'
              : 'Configuring your automated trading strategy'
            }
          </p>
        </motion.div>

        {/* Strategy Information */}
        {renderStrategyInfo()}

        {/* Progress Section */}
        <motion.div
          style={styles.progressSection}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div style={styles.progressHeader}>
            <span style={styles.progressLabel}>Activation Progress</span>
            <span style={styles.progressPercent}>{Math.round(progress)}%</span>
          </div>
          
          <div style={styles.progressBar}>
            <motion.div
              style={{
                ...styles.progressFill,
                width: `${progress}%`
              }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <motion.div
              style={styles.progressGlow}
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.02, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          <motion.div
            style={styles.currentMessage}
            key={currentMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {currentMessage}
          </motion.div>
        </motion.div>

        {/* Accounts List */}
        <motion.div
          style={styles.accountsSection}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 style={styles.accountsTitle}>
            {isMultiAccount ? 'Network Status' : 'Account Status'}
          </h3>
          {renderAccountsList()}
        </motion.div>

        {/* Completion State */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              style={styles.completionOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                style={styles.completionContent}
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              >
                <motion.div
                  style={styles.successIcon}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  ✅
                </motion.div>
                <h2 style={styles.successTitle}>
                  {isMultiAccount ? 'Network Activated!' : 'Strategy Initiated!'}
                </h2>
                <p style={styles.successMessage}>
                  {isMultiAccount 
                    ? 'Your trading network is now synchronized and ready for action'
                    : 'Your strategy is now active and monitoring the market'
                  }
                </p>
              </motion.div>
            </motion.div>
          )}
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
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    position: 'relative',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1rem',
  },
  mainIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    display: 'block',
  },
  title: {
    fontSize: '2.2rem',
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
    lineHeight: '1.4',
  },
  strategyInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
  },
  strategyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  strategyIcon: {
    fontSize: '2.5rem',
  },
  strategyDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  strategyName: {
    fontSize: '1.2rem',
    color: '#ffffff',
    fontWeight: 600,
  },
  strategyTarget: {
    fontSize: '1rem',
    color: '#00C6E0',
    fontWeight: 500,
  },
  strategyPower: {
    fontSize: '0.9rem',
    color: '#10B981',
    fontWeight: 500,
  },
  progressSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  progressLabel: {
    fontSize: '1rem',
    color: '#ffffff',
    fontWeight: 500,
  },
  progressPercent: {
    fontSize: '1.2rem',
    color: '#00C6E0',
    fontWeight: 600,
  },
  progressBar: {
    width: '100%',
    height: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: '1rem',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00C6E0, #00E6FF)',
    borderRadius: '6px',
    transition: 'width 0.8s ease-out',
    position: 'relative',
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, transparent, rgba(0, 198, 224, 0.3), transparent)',
    borderRadius: '6px',
  },
  currentMessage: {
    fontSize: '0.95rem',
    color: '#cccccc',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  accountsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
  },
  accountsTitle: {
    fontSize: '1.1rem',
    color: '#ffffff',
    fontWeight: 600,
    marginBottom: '1rem',
    margin: '0 0 1rem 0',
  },
  accountsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  accountItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
  accountIcon: {
    fontSize: '1.5rem',
    width: '2.5rem',
    height: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '50%',
  },
  accountDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  accountType: {
    fontSize: '0.8rem',
    color: '#00C6E0',
    fontWeight: 500,
    textTransform: 'uppercase',
  },
  accountName: {
    fontSize: '0.95rem',
    color: '#ffffff',
    fontWeight: 500,
  },
  accountStatus: {
    fontSize: '0.8rem',
    fontWeight: 500,
    textTransform: 'uppercase',
  },
  completionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)',
  },
  completionContent: {
    textAlign: 'center',
    padding: '2rem',
  },
  successIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    display: 'block',
  },
  successTitle: {
    fontSize: '2rem',
    fontWeight: 600,
    color: '#ffffff',
    margin: '0 0 1rem 0',
  },
  successMessage: {
    fontSize: '1.1rem',
    color: '#cccccc',
    margin: 0,
    lineHeight: '1.4',
  },
  '@media (max-width: 480px)': {
    title: {
      fontSize: '1.8rem',
    },
    subtitle: {
      fontSize: '1rem',
    },
    strategyHeader: {
      flexDirection: 'column',
      textAlign: 'center',
      gap: '0.5rem',
    },
    accountItem: {
      padding: '1rem',
    },
  },
};