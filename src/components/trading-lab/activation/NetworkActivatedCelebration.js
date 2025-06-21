import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TradingLabContext } from '../../../contexts/TradingLabContext';
import { CelebrationAnimation } from '../shared/AtomikAnimations';
import { formatCurrency } from '../../../utils/formatting/currency';

export const NetworkActivatedCelebration = ({ 
  strategyConfig, 
  onEnterTradingLab,
  coreAccount,
  satelliteAccounts = []
}) => {
  const { 
    selectedStrategy,
    primaryAccount,
    updateNetworkState,
    completeOnboarding,
    NETWORK_STATES
  } = useContext(TradingLabContext);
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [nextSignalTime, setNextSignalTime] = useState('');

  const isMultiAccount = satelliteAccounts.length > 0;
  const totalAccounts = 1 + satelliteAccounts.length;

  useEffect(() => {
    // Start celebration sequence
    setShowConfetti(true);
    
    // Show details after initial celebration
    setTimeout(() => {
      setShowDetails(true);
    }, 1500);

    // Update network state to active
    updateNetworkState(NETWORK_STATES.ACTIVE);

    // Generate next signal time (2-15 minutes from now)
    const nextSignal = new Date();
    const minutesToAdd = Math.floor(Math.random() * 13) + 2; // 2-15 minutes
    nextSignal.setMinutes(nextSignal.getMinutes() + minutesToAdd);
    setNextSignalTime(`${minutesToAdd} min`);

    // Auto-advance to Trading Lab after celebration
    const autoAdvanceTimer = setTimeout(() => {
      handleEnterTradingLab();
    }, 8000);

    return () => clearTimeout(autoAdvanceTimer);
  }, []);

  const handleEnterTradingLab = () => {
    completeOnboarding();
    onEnterTradingLab();
  };

  const renderSingleAccountCelebration = () => (
    <motion.div
      style={styles.celebrationContent}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        delay: 0.5,
        type: "spring", 
        stiffness: 150, 
        damping: 20 
      }}
    >
      <motion.div
        style={styles.mainIcon}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          delay: 0.8,
          type: "spring", 
          stiffness: 200, 
          damping: 15 
        }}
      >
        ⚡
      </motion.div>

      <motion.h1
        style={styles.celebrationTitle}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        STRATEGY INITIATED!
      </motion.h1>

      <motion.p
        style={styles.celebrationSubtitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        Your algorithmic trading strategy is now active
      </motion.p>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            style={styles.detailsSection}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div style={styles.statusCard}>
              <div style={styles.statusHeader}>
                <span style={styles.statusIcon}>🟢</span>
                <span style={styles.statusText}>ACTIVE & SCANNING</span>
              </div>
              
              <div style={styles.accountInfo}>
                <span style={styles.accountLabel}>Core Account:</span>
                <span style={styles.accountName}>
                  {coreAccount?.broker} •••{coreAccount?.accountNumber}
                </span>
                <span style={styles.accountPower}>
                  {formatCurrency(strategyConfig?.coreAmount || 1000)} per trade
                </span>
              </div>

              <div style={styles.strategyInfo}>
                <span style={styles.strategyLabel}>Strategy:</span>
                <span style={styles.strategyName}>"{selectedStrategy?.name}"</span>
                <span style={styles.strategyTarget}>Target: {strategyConfig?.ticker}</span>
              </div>

              <div style={styles.nextSignal}>
                <span style={styles.signalLabel}>⚡ Next signal expected in:</span>
                <span style={styles.signalTime}>{nextSignalTime}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const renderMultiAccountCelebration = () => (
    <motion.div
      style={styles.celebrationContent}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        delay: 0.5,
        type: "spring", 
        stiffness: 150, 
        damping: 20 
      }}
    >
      <motion.div
        style={styles.networkIcon}
        initial={{ scale: 0, rotate: -360 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          delay: 0.8,
          type: "spring", 
          stiffness: 200, 
          damping: 15 
        }}
      >
        ⚛️
      </motion.div>

      <motion.h1
        style={styles.celebrationTitle}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        NETWORK ACTIVATED!
      </motion.h1>

      <motion.p
        style={styles.celebrationSubtitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        Your trading network is synchronized and ready for action
      </motion.p>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            style={styles.detailsSection}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {/* Core Account */}
            <motion.div
              style={styles.networkCard}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div style={styles.accountRow}>
                <div style={styles.accountHeader}>
                  <span style={styles.coreIcon}>⚛️</span>
                  <span style={styles.accountType}>Core</span>
                  <span style={styles.accountStatus}>SCANNING</span>
                </div>
                <div style={styles.accountDetails}>
                  <span style={styles.accountName}>
                    {coreAccount?.broker} •••{coreAccount?.accountNumber}
                  </span>
                  <span style={styles.accountAmount}>
                    {formatCurrency(strategyConfig?.coreAmount || 1000)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Satellite Accounts */}
            {satelliteAccounts.map((account, index) => (
              <motion.div
                key={account.id}
                style={styles.networkCard}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <div style={styles.accountRow}>
                  <div style={styles.accountHeader}>
                    <span style={styles.satelliteIcon}>🛰️</span>
                    <span style={styles.accountType}>Satellite</span>
                    <span style={styles.accountStatus}>SYNCHRONIZED</span>
                  </div>
                  <div style={styles.accountDetails}>
                    <span style={styles.accountName}>
                      {account.broker} •••{account.accountNumber}
                    </span>
                    <span style={styles.accountAmount}>
                      {formatCurrency(strategyConfig?.satelliteAmounts?.[account.id] || 500)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Network Summary */}
            <motion.div
              style={styles.networkSummary}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0 }}
            >
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>📊 All accounts in perfect sync</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.totalLabel}>💰 Total atomic trading power:</span>
                <span style={styles.totalAmount}>
                  {formatCurrency(strategyConfig?.totalPower || 0)}
                </span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.signalLabel}>⚡ Next signal expected in:</span>
                <span style={styles.signalTime}>{nextSignalTime}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div style={styles.container}>
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <CelebrationAnimation 
            type={isMultiAccount ? "network_activated" : "strategy_initiated"}
            duration={3000}
          />
        )}
      </AnimatePresence>

      <div style={styles.content}>
        {isMultiAccount ? renderMultiAccountCelebration() : renderSingleAccountCelebration()}

        {/* Action Buttons */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              style={styles.actionSection}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0, duration: 0.8 }}
            >
              <motion.button
                style={styles.primaryButton}
                onClick={handleEnterTradingLab}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(0, 198, 224, 0.3)',
                    '0 0 30px rgba(0, 198, 224, 0.5)',
                    '0 0 20px rgba(0, 198, 224, 0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span style={styles.buttonIcon}>📊</span>
                <span style={styles.buttonText}>ENTER TRADING LAB</span>
              </motion.button>

              <motion.p
                style={styles.achievementText}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
              >
                🎊 You're now an algorithmic trader!
              </motion.p>
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
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    width: '100%',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    zIndex: 10,
  },
  celebrationContent: {
    textAlign: 'center',
    width: '100%',
  },
  mainIcon: {
    fontSize: '5rem',
    marginBottom: '1rem',
    display: 'block',
  },
  networkIcon: {
    fontSize: '6rem',
    marginBottom: '1rem',
    display: 'block',
  },
  celebrationTitle: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 1rem 0',
    lineHeight: '1.1',
    textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
  },
  celebrationSubtitle: {
    fontSize: '1.2rem',
    color: '#cccccc',
    margin: '0 0 2rem 0',
    fontWeight: 400,
    lineHeight: '1.4',
  },
  detailsSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: '1.2rem',
  },
  statusText: {
    fontSize: '1rem',
    color: '#10B981',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  accountInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  accountLabel: {
    fontSize: '0.9rem',
    color: '#888888',
    fontWeight: 500,
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
  strategyInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '1rem',
    textAlign: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  strategyLabel: {
    fontSize: '0.9rem',
    color: '#888888',
    fontWeight: 500,
  },
  strategyName: {
    fontSize: '1rem',
    color: '#00C6E0',
    fontWeight: 600,
  },
  strategyTarget: {
    fontSize: '0.9rem',
    color: '#00C6E0',
    fontWeight: 500,
  },
  nextSignal: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    textAlign: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  signalLabel: {
    fontSize: '0.9rem',
    color: '#ffffff',
    fontWeight: 500,
  },
  signalTime: {
    fontSize: '1.2rem',
    color: '#00C6E0',
    fontWeight: 600,
  },
  networkCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '1rem',
    backdropFilter: 'blur(10px)',
  },
  accountRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  accountHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  coreIcon: {
    fontSize: '1.2rem',
  },
  satelliteIcon: {
    fontSize: '1.2rem',
  },
  accountType: {
    fontSize: '0.9rem',
    color: '#00C6E0',
    fontWeight: 600,
    flex: 1,
  },
  accountStatus: {
    fontSize: '0.8rem',
    color: '#10B981',
    fontWeight: 500,
    textTransform: 'uppercase',
  },
  accountDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountAmount: {
    fontSize: '0.9rem',
    color: '#10B981',
    fontWeight: 600,
  },
  networkSummary: {
    backgroundColor: 'rgba(0, 198, 224, 0.1)',
    border: '1px solid rgba(0, 198, 224, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  summaryLabel: {
    fontSize: '1rem',
    color: '#ffffff',
    fontWeight: 500,
    width: '100%',
    textAlign: 'center',
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
  actionSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1rem',
  },
  primaryButton: {
    padding: '1.25rem 2rem',
    backgroundColor: 'rgba(0, 198, 224, 0.2)',
    border: '2px solid rgba(0, 198, 224, 0.7)',
    borderRadius: '20px',
    color: '#00C6E0',
    fontSize: '1.1rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    textTransform: 'uppercase',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    transition: 'all 0.3s ease',
  },
  buttonIcon: {
    fontSize: '1.3rem',
  },
  buttonText: {
    letterSpacing: '0.5px',
  },
  achievementText: {
    fontSize: '1.1rem',
    color: '#ffffff',
    fontWeight: 500,
    textAlign: 'center',
    margin: 0,
  },
  '@media (max-width: 480px)': {
    celebrationTitle: {
      fontSize: '2rem',
    },
    celebrationSubtitle: {
      fontSize: '1rem',
    },
    mainIcon: {
      fontSize: '4rem',
    },
    networkIcon: {
      fontSize: '4.5rem',
    },
    primaryButton: {
      padding: '1rem 1.5rem',
      fontSize: '1rem',
    },
  },
};