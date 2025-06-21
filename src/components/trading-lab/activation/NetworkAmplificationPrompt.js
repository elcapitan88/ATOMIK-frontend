import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ATOMIC_COLORS, injectResponsiveStyles } from '../shared/TradingLabUtils';
import { devices } from '../../../styles/theme/breakpoints';
import logger from '../../../utils/logger';

/**
 * NetworkAmplificationPrompt - Post-Activation Satellite Account Prompt
 * 
 * Appears after strategy activation to offer network amplification through
 * satellite accounts. Follows atomic terminology and Trading Lab principles.
 */

const NetworkAmplificationPrompt = ({ 
  coreAccount,
  selectedStrategy,
  onAmplifyNetwork,
  onEnterTradingLab,
  isMobileView = false 
}) => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAmplifyNetwork = () => {
    logger.info('[NetworkAmplificationPrompt] User chose to amplify network');
    setIsAnimating(true);
    
    setTimeout(() => {
      if (onAmplifyNetwork) {
        onAmplifyNetwork();
      } else {
        // Navigate to satellite account setup
        navigate('/trading-lab/satellite-setup');
      }
    }, 300);
  };

  const handleEnterTradingLab = () => {
    logger.info('[NetworkAmplificationPrompt] User chose to enter Trading Lab');
    setIsAnimating(true);
    
    setTimeout(() => {
      if (onEnterTradingLab) {
        onEnterTradingLab();
      } else {
        navigate('/trading-lab');
      }
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={styles.container}
      className="network-amplification-prompt"
    >
      {/* Background Effects */}
      <div style={styles.backgroundEffects}>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={styles.orbitalRing}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={styles.header}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={styles.atomIcon}
        >
          ⚛️
        </motion.div>
        <h1 style={styles.title}>Core Account Activated!</h1>
        <p style={styles.subtitle}>
          Your {selectedStrategy?.name} strategy is now scanning for opportunities
        </p>
      </motion.header>

      {/* Core Account Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={styles.coreAccountCard}
      >
        <div style={styles.statusIndicator}>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={styles.statusDot}
          />
          <span style={styles.statusText}>ACTIVE SCANNING</span>
        </div>
        
        <div style={styles.accountDetails}>
          <span style={styles.accountLabel}>⚛️ Core Account:</span>
          <span style={styles.accountName}>
            {coreAccount?.nickname || coreAccount?.name || 'Trading Account'}
          </span>
        </div>
      </motion.div>

      {/* Amplification Offer */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={styles.amplificationSection}
      >
        <div style={styles.amplificationHeader}>
          <h2 style={styles.amplificationTitle}>
            🚀 Ready to Amplify Your Network?
          </h2>
          <p style={styles.amplificationDescription}>
            Add satellite accounts to multiply your trading power and diversify execution across multiple brokers
          </p>
        </div>

        <div style={styles.benefitsGrid}>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>🔗</span>
            <span style={styles.benefitText}>Synchronized Trading</span>
          </div>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>⚡</span>
            <span style={styles.benefitText}>Amplified Power</span>
          </div>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>🎯</span>
            <span style={styles.benefitText}>Risk Distribution</span>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={styles.actionButtons}
      >
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAmplifyNetwork}
          style={styles.amplifyButton}
          className="amplify-button"
          disabled={isAnimating}
        >
          <span style={styles.buttonIcon}>🔗</span>
          <span>Amplify Network</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleEnterTradingLab}
          style={styles.enterLabButton}
          className="enter-lab-button"
          disabled={isAnimating}
        >
          <span style={styles.buttonIcon}>📊</span>
          <span>Enter Trading Lab</span>
        </motion.button>
      </motion.div>

      {/* Skip Option */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        style={styles.skipSection}
      >
        <p style={styles.skipText}>
          You can always add satellite accounts later from the Trading Lab
        </p>
      </motion.div>
    </motion.div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#000000',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden'
  },
  backgroundEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 1
  },
  orbitalRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '800px',
    height: '800px',
    border: `2px solid ${ATOMIC_COLORS.PRIMARY}`,
    borderRadius: '50%',
    opacity: 0.1
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    zIndex: 2,
    position: 'relative'
  },
  atomIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    display: 'inline-block'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '300',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    marginBottom: '0.5rem',
    color: ATOMIC_COLORS.PRIMARY
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#cccccc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0
  },
  coreAccountCard: {
    background: 'rgba(0, 198, 224, 0.1)',
    border: '1px solid rgba(0, 198, 224, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '2rem',
    maxWidth: '500px',
    width: '100%',
    zIndex: 2,
    position: 'relative'
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem'
  },
  statusDot: {
    width: '12px',
    height: '12px',
    background: '#10B981',
    borderRadius: '50%',
    boxShadow: '0 0 20px #10B981'
  },
  statusText: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#10B981',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  accountDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  accountLabel: {
    fontSize: '1rem',
    color: ATOMIC_COLORS.PRIMARY,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  accountName: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  amplificationSection: {
    textAlign: 'center',
    marginBottom: '2rem',
    maxWidth: '600px',
    zIndex: 2,
    position: 'relative'
  },
  amplificationHeader: {
    marginBottom: '1.5rem'
  },
  amplificationTitle: {
    fontSize: '1.8rem',
    fontWeight: '400',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    marginBottom: '0.75rem',
    color: '#ffffff'
  },
  amplificationDescription: {
    fontSize: '1rem',
    color: '#cccccc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: '1.5',
    margin: 0
  },
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginTop: '1.5rem'
  },
  benefit: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px'
  },
  benefitIcon: {
    fontSize: '1.5rem'
  },
  benefitText: {
    fontSize: '0.9rem',
    color: '#cccccc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    textAlign: 'center'
  },
  actionButtons: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    zIndex: 2,
    position: 'relative'
  },
  amplifyButton: {
    background: ATOMIC_COLORS.PRIMARY,
    color: '#000000',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: `0 8px 32px ${ATOMIC_COLORS.PRIMARY}40`
  },
  enterLabButton: {
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  buttonIcon: {
    fontSize: '1.2rem'
  },
  skipSection: {
    textAlign: 'center',
    zIndex: 2,
    position: 'relative'
  },
  skipText: {
    fontSize: '0.9rem',
    color: '#888888',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0
  }
};

// Responsive styles
const responsiveStyles = `
  @media ${devices.mobile} {
    .network-amplification-prompt .container {
      padding: 1.5rem;
    }
    
    .network-amplification-prompt .title {
      font-size: 2rem;
    }
    
    .network-amplification-prompt .amplification-title {
      font-size: 1.5rem;
    }
    
    .network-amplification-prompt .benefits-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    
    .network-amplification-prompt .action-buttons {
      flex-direction: column;
      width: 100%;
    }
    
    .network-amplification-prompt .amplify-button,
    .network-amplification-prompt .enter-lab-button {
      width: 100%;
      justify-content: center;
    }
  }
  
  @media ${devices.tablet} {
    .network-amplification-prompt .benefits-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    
    .network-amplification-prompt .action-buttons {
      flex-direction: row;
    }
  }
`;

// Inject responsive styles
injectResponsiveStyles(responsiveStyles, 'network-amplification-prompt-styles');

export default NetworkAmplificationPrompt;