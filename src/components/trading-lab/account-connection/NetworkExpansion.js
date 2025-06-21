import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradingLab } from '../../../contexts/TradingLabContext';
import { ATOMIC_TERMS } from '../../../utils/constants/atomikTerminology';
import { ATOMIC_COLORS, injectResponsiveStyles } from '../shared/TradingLabUtils';
import { devices } from '../../../styles/theme/breakpoints';
import logger from '../../../utils/logger';

export const NetworkExpansion = () => {
  const { 
    satelliteAccounts, 
    addSatelliteAccount,
    selectedStrategy,
    accountData,
    nextStep,
    previousStep
  } = useTradingLab();
  
  const [showExpansionOptions, setShowExpansionOptions] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  const handleExpand = () => {
    logger.info('[NetworkExpansion] User chose to expand network');
    setIsExpanding(true);
    setShowExpansionOptions(true);
  };

  const handleAddAccount = () => {
    logger.info('[NetworkExpansion] User chose to add satellite account');
    // TODO: Navigate to satellite account setup
    // For now, skip to activation
    nextStep();
  };

  const handleSkip = () => {
    logger.info('[NetworkExpansion] User chose to skip network expansion');
    nextStep(); // Proceed to activation step
  };

  const handleContinueWithCore = () => {
    logger.info('[NetworkExpansion] User chose to continue with core account only');
    nextStep(); // Proceed to activation step
  };

  // Get the connected account from accountData
  const connectedAccount = accountData?.accounts?.[0] || accountData?.coreAccount;
  const networkPower = connectedAccount?.balance || 0;
  const formattedPower = `$${networkPower?.toLocaleString() || '0'}`;

  return (
    <div style={styles.container} className="network-expansion">
      <motion.div
        style={styles.content}
        className="content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Header */}
        <div style={styles.header}>
          <img 
            src="/logos/atomik-logo.svg" 
            alt="Atomik Trading" 
            style={styles.logoImage}
          />
          <h1 style={styles.title} className="title">{ATOMIC_TERMS.CORE_ACCOUNT} Connected</h1>
          <p style={styles.subtitle} className="subtitle">
            Your trading foundation is established
          </p>
        </div>

        {/* Core Account Status */}
        <motion.div
          style={styles.coreAccountCard}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div style={styles.accountHeader}>
            <div style={styles.successIndicator}>
              <span style={styles.checkmark}>✅</span>
              <span style={styles.accountName}>
                {connectedAccount?.broker || 'Account'} Connected
              </span>
            </div>
            <div style={styles.buyingPower}>
              {formattedPower} buying power available
            </div>
          </div>
          
          <div style={styles.strategyInfo}>
            <span style={styles.strategyLabel}>Ready for:</span>
            <span style={styles.strategyName}>"{selectedStrategy?.name || 'Selected Strategy'}"</span>
          </div>
        </motion.div>

        {/* Network Expansion Prompt */}
        <AnimatePresence>
          {!showExpansionOptions && (
            <motion.div
              style={styles.expansionPrompt}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div style={styles.promptHeader}>
                <span style={styles.lightbulb}>💡</span>
                <h3 style={styles.promptTitle}>
                  Want to build a trading network?
                </h3>
                <p style={styles.promptSubtitle}>
                  (Optional but powerful)
                </p>
              </div>

              <div style={styles.networkBenefits}>
                <div style={styles.benefit}>
                  <span style={styles.benefitIcon}>🔗</span>
                  <span style={styles.benefitText}>Synchronized trading across accounts</span>
                </div>
                <div style={styles.benefit}>
                  <span style={styles.benefitIcon}>⚡</span>
                  <span style={styles.benefitText}>Amplified market reactions</span>
                </div>
                <div style={styles.benefit}>
                  <span style={styles.benefitIcon}>🎯</span>
                  <span style={styles.benefitText}>Diversified execution power</span>
                </div>
              </div>

              <motion.button
                onClick={handleExpand}
                style={styles.expandButton}
                disabled={isExpanding}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isExpanding ? 'Expanding Network...' : '🔗 Build Trading Network'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expansion Options */}
        <AnimatePresence>
          {showExpansionOptions && (
            <motion.div
              style={styles.expansionOptions}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <h3 style={styles.optionsTitle}>Add satellite accounts:</h3>
              
              <motion.button
                style={styles.addAccountButton}
                onClick={handleAddAccount}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span style={styles.addIcon}>➕</span>
                <span style={styles.addText}>Connect Another Account</span>
                <span style={styles.addArrow}>→</span>
              </motion.button>

              <div style={styles.networkPreview}>
                <p style={styles.previewText}>
                  Your network will synchronize all trades automatically
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div style={styles.actionButtons} className="action-buttons">
          <motion.button
            style={styles.skipButton}
            onClick={handleSkip}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Skip Network Building
          </motion.button>

          {showExpansionOptions && (
            <motion.button
              style={styles.continueButton}
              onClick={handleContinueWithCore}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue with {ATOMIC_TERMS.CORE_ACCOUNT} Only →
            </motion.button>
          )}
        </div>
      </motion.div>
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
  },
  header: {
    textAlign: 'center',
    marginBottom: '1rem',
  },
  logoImage: {
    height: '3rem',
    width: 'auto',
    objectFit: 'contain',
    marginBottom: '1rem',
    display: 'block',
    margin: '0 auto 1rem auto'
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
  coreAccountCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
  },
  accountHeader: {
    marginBottom: '1rem',
  },
  successIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  checkmark: {
    fontSize: '1.2rem',
  },
  accountName: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#ffffff',
  },
  buyingPower: {
    fontSize: '1rem',
    color: '#10B981',
    fontWeight: 500,
  },
  strategyInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  strategyLabel: {
    fontSize: '0.9rem',
    color: '#888888',
  },
  strategyName: {
    fontSize: '0.9rem',
    color: '#00C6E0',
    fontWeight: 500,
  },
  expansionPrompt: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
  },
  promptHeader: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  lightbulb: {
    fontSize: '2rem',
    display: 'block',
    marginBottom: '1rem',
  },
  promptTitle: {
    fontSize: '1.3rem',
    fontWeight: 600,
    color: '#ffffff',
    margin: '0 0 0.5rem 0',
  },
  promptSubtitle: {
    fontSize: '0.9rem',
    color: '#888888',
    margin: 0,
    fontStyle: 'italic',
  },
  networkBenefits: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  benefit: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  benefitIcon: {
    fontSize: '1.1rem',
    width: '1.5rem',
    textAlign: 'center',
  },
  benefitText: {
    fontSize: '0.95rem',
    color: '#cccccc',
    fontWeight: 400,
  },
  expandButton: {
    width: '100%',
    padding: '1rem 1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    color: '#00C6E0',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  expansionOptions: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
  },
  optionsTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#ffffff',
    margin: '0 0 1rem 0',
  },
  addAccountButton: {
    width: '100%',
    padding: '1rem 1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  addIcon: {
    fontSize: '1.2rem',
  },
  addText: {
    flex: 1,
    textAlign: 'center',
  },
  addArrow: {
    fontSize: '1.1rem',
    color: '#00C6E0',
  },
  networkPreview: {
    textAlign: 'center',
  },
  previewText: {
    fontSize: '0.9rem',
    color: '#888888',
    margin: 0,
    fontStyle: 'italic',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem',
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
  continueButton: {
    padding: '0.875rem 1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    color: '#00C6E0',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
};

// Responsive styles
const responsiveStyles = `
  @media ${devices.mobile} {
    .network-expansion .content {
      padding: 0 0.5rem;
    }
    
    .network-expansion .title {
      font-size: 1.75rem;
    }
    
    .network-expansion .subtitle {
      font-size: 1rem;
    }
    
    .network-expansion .action-buttons {
      flex-direction: column;
    }
  }
  
  @media ${devices.tablet} {
    .network-expansion .action-buttons {
      flex-direction: row;
    }
  }
`;

// Inject responsive styles
injectResponsiveStyles(responsiveStyles, 'network-expansion-styles');