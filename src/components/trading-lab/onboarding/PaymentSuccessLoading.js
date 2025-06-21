import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AtomicSpinner, AtomicProgressBar, FloatingElements } from '../shared/AtomikAnimations';
import { 
  ATOMIC_COLORS, 
  SHARED_STYLES, 
  ANIMATION_VARIANTS,
  triggerHapticFeedback,
  injectResponsiveStyles 
} from '../shared/TradingLabUtils';
import logger from '../../../utils/logger';

/**
 * PaymentSuccessLoading Component
 * 
 * Celebratory loading screen shown after successful payment/registration.
 * Creates anticipation and excitement for the Trading Lab experience.
 * Auto-navigates to strategy selection after completion.
 */
const PaymentSuccessLoading = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Payment confirmed!');
  const [isComplete, setIsComplete] = useState(false);

  // Progress sequence with messages - Extended for proper anticipation building
  const progressSequence = [
    { progress: 15, message: 'Payment confirmed!', delay: 800 },
    { progress: 35, message: 'Account activated!', delay: 2000 },
    { progress: 55, message: 'Preparing your strategies...', delay: 3500 },
    { progress: 75, message: 'Connecting to trading networks...', delay: 5000 },
    { progress: 90, message: 'Initializing your lab...', delay: 6500 },
    { progress: 100, message: 'Almost ready!', delay: 7500 }
  ];

  useEffect(() => {
    logger.info('[PaymentSuccessLoading] Component mounted');
    
    // Inject responsive styles
    injectResponsiveStyles(responsiveStyles, 'payment-success-loading-styles');

    // Trigger initial haptic feedback
    triggerHapticFeedback('success', true);

    // Execute progress sequence
    progressSequence.forEach(({ progress, message, delay }) => {
      setTimeout(() => {
        setProgress(progress);
        setCurrentMessage(message);
        
        // Haptic feedback for major milestones
        if (progress === 50 || progress === 100) {
          triggerHapticFeedback('medium', true);
        }
        
        logger.debug(`[PaymentSuccessLoading] Progress: ${progress}% - ${message}`);
      }, delay);
    });

    // Complete animation and navigate - Extended timing for anticipation
    setTimeout(() => {
      setIsComplete(true);
      triggerHapticFeedback('success', true);
      
      setTimeout(() => {
        logger.info('[PaymentSuccessLoading] Navigating to account connection (account-first flow)');
        navigate('/trading-lab/account-connection');
      }, 1500); // Extended completion display time
    }, 8500); // Extended total experience time

    return () => {
      logger.debug('[PaymentSuccessLoading] Component unmounted');
    };
  }, [navigate]);

  return (
    <motion.div
      style={styles.container}
      {...ANIMATION_VARIANTS.fadeIn}
      transition={{ duration: 0.6 }}
    >
      {/* Background floating elements for ambient effect */}
      <FloatingElements count={6} color={ATOMIC_COLORS.primary} speed="slow" />
      
      <div style={styles.content}>
        {/* Main welcome message */}
        <motion.div
          style={styles.welcomeSection}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            style={styles.atomIcon}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            ⚛️
          </motion.div>
          
          <h1 style={styles.title}>
            Welcome to your trading lab
          </h1>
          
          <motion.p
            style={styles.subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            You're about to become an algorithmic trader in seconds...
          </motion.p>
        </motion.div>

        {/* Loading section */}
        <motion.div
          style={styles.loadingSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <motion.p
            style={styles.loadingMessage}
            key={currentMessage} // Triggers re-animation on message change
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {currentMessage}
          </motion.p>
          
          <div style={styles.progressContainer}>
            <AtomicProgressBar
              progress={progress}
              label=""
              animated={true}
            />
          </div>
        </motion.div>

        {/* Completion celebration */}
        {isComplete && (
          <motion.div
            style={styles.completionSection}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              style={styles.successIcon}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, times: [0, 0.6, 1] }}
            >
              ✨
            </motion.div>
            <p style={styles.successMessage}>
              Your lab is ready!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: ATOMIC_COLORS.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  
  content: {
    textAlign: 'center',
    zIndex: 2,
    maxWidth: '500px',
    width: '100%',
    padding: '2rem'
  },
  
  welcomeSection: {
    marginBottom: '3rem'
  },
  
  atomIcon: {
    fontSize: '4rem',
    marginBottom: '1.5rem',
    display: 'inline-block'
  },
  
  title: {
    fontSize: '2.5rem',
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: ATOMIC_COLORS.text,
    marginBottom: '1rem',
    lineHeight: '1.2'
  },
  
  subtitle: {
    fontSize: '1.2rem',
    fontWeight: '400',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: ATOMIC_COLORS.textSecondary,
    lineHeight: '1.4',
    marginBottom: '0'
  },
  
  loadingSection: {
    marginBottom: '2rem'
  },
  
  loadingMessage: {
    fontSize: '1.1rem',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: ATOMIC_COLORS.primary,
    marginTop: '1.5rem',
    marginBottom: '2rem'
  },
  
  progressContainer: {
    maxWidth: '300px',
    margin: '0 auto'
  },
  
  completionSection: {
    marginTop: '2rem'
  },
  
  successIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    display: 'inline-block'
  },
  
  successMessage: {
    fontSize: '1rem',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: ATOMIC_COLORS.success,
    margin: '0'
  }
};

// Responsive styles
const responsiveStyles = `
  @media (max-width: 768px) {
    .payment-success-loading .title {
      font-size: 2rem !important;
    }
    
    .payment-success-loading .subtitle {
      font-size: 1.1rem !important;
    }
    
    .payment-success-loading .content {
      padding: 1.5rem !important;
    }
    
    .payment-success-loading .atomIcon {
      font-size: 3rem !important;
    }
  }
  
  @media (orientation: landscape) and (max-height: 600px) {
    .payment-success-loading .title {
      font-size: 1.8rem !important;
      margin-bottom: 0.5rem !important;
    }
    
    .payment-success-loading .welcomeSection {
      margin-bottom: 2rem !important;
    }
    
    .payment-success-loading .atomIcon {
      font-size: 2.5rem !important;
      margin-bottom: 1rem !important;
    }
  }
`;

export default PaymentSuccessLoading;