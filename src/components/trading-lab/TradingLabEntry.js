import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTradingLab, ONBOARDING_STEPS as FALLBACK_ONBOARDING_STEPS } from '../../contexts/TradingLabContext';
import { useLocation } from 'react-router-dom';
import CuratedStrategies from './strategy-selection/CuratedStrategies';
import CoreAccountSetup from './account-connection/CoreAccountSetup';
import { NetworkExpansion } from './account-connection/NetworkExpansion';
import { NetworkActivation } from './activation/NetworkActivation';
import Dashboard from '../pages/Dashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { devices } from '../../styles/theme/breakpoints';
import { ATOMIC_TERMS } from '../../utils/constants/atomikTerminology';
import { injectResponsiveStyles, TRADING_LAB_BACKGROUND, SHARED_STYLES } from './shared/TradingLabUtils';
import logger from '../../utils/logger';

/**
 * TradingLabEntry - Smart Router Component
 * 
 * This component determines whether users should see:
 * 1. Full-screen Trading Lab onboarding (new users with feature flag)
 * 2. Existing Trading Lab dashboard (returning users who completed onboarding)
 * 3. Classic dashboard (fallback for users without feature flag access)
 */

const TradingLabEntry = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();
  const {
    userType,
    isFirstTime,
    isOnboardingComplete,
    canAccessTradingLab,
    currentStep,
    setCurrentStep,
    setAccountData,
    USER_TYPES,
    ONBOARDING_STEPS
  } = useTradingLab();

  const [entryDecision, setEntryDecision] = useState(null);
  const [showTransition, setShowTransition] = useState(true);
  const [oauthState, setOauthState] = useState(null);

  // Check for OAuth callback state on mount
  useEffect(() => {
    const state = location.state;
    if (state) {
      logger.info('[TradingLabEntry] Received navigation state:', state);
      
      // Handle OAuth success from callback
      if (state.oauthSuccess && state.accountConnected) {
        setOauthState(state);
        
        // Store account data in Trading Lab context
        if (state.accounts && setAccountData) {
          setAccountData({
            accounts: state.accounts,
            wsStatus: state.wsStatus,
            connectionErrors: state.connectionErrors
          });
        }
        
        // Handle forced step navigation for account-first flow
        if (state.forceStep && setCurrentStep && ONBOARDING_STEPS) {
          logger.info('[TradingLabEntry] Forcing step navigation to:', state.forceStep);
          
          if (state.forceStep === 'strategy_activation') {
            setCurrentStep(ONBOARDING_STEPS.STRATEGY_ACTIVATION);
          }
        }
      }
      
      // Handle OAuth error from callback
      if (state.oauthError) {
        setOauthState(state);
        logger.warn('[TradingLabEntry] OAuth error received:', state.error);
      }
    }
  }, [location.state, setAccountData, setCurrentStep, ONBOARDING_STEPS]);

  // Determine entry path based on user state and feature flags
  useEffect(() => {
    logger.info('[TradingLabEntry] Entry effect triggered:', {
      authLoading,
      isAuthenticated,
      user: user?.email || 'No user',
      currentStep,
      userType,
      oauthState: !!oauthState
    });

    if (authLoading) {
      logger.info('[TradingLabEntry] Still loading auth, waiting...');
      return; // Still loading, don't make decisions yet
    }

    if (!isAuthenticated || !user) {
      logger.warn('[TradingLabEntry] User not authenticated - this should not happen for /trading-lab');
      logger.info('[TradingLabEntry] Auth state:', { isAuthenticated, user: !!user });
      // Instead of redirecting, let's see what's happening
      setEntryDecision('classic_dashboard');
      return;
    }

    // TEMP: Skip feature flag loading to avoid API errors - always allow Trading Lab for testing
    logger.info('[TradingLabEntry] Skipping feature flag check, allowing Trading Lab access');
    
    // Determine path based on user state
    const decision = determineUserPath();
    setEntryDecision(decision);
    
    logger.info('[TradingLabEntry] Entry decision made:', {
      decision,
      userType,
      isFirstTime,
      isOnboardingComplete,
      currentStep,
      hasOAuthState: !!oauthState
    });
  }, [
    authLoading,
    isAuthenticated,
    user,
    userType,
    isFirstTime,
    isOnboardingComplete,
    currentStep,
    oauthState
  ]);

  const determineUserPath = () => {
    // Route based on current step from TradingLabContext
    logger.info('[TradingLabEntry] Determining path based on currentStep:', currentStep);
    logger.info('[TradingLabEntry] Available ONBOARDING_STEPS:', ONBOARDING_STEPS);
    logger.info('[TradingLabEntry] User type:', userType, 'First time:', isFirstTime);
    
    // Use fallback if ONBOARDING_STEPS is undefined
    const steps = ONBOARDING_STEPS || FALLBACK_ONBOARDING_STEPS;
    
    if (!steps) {
      logger.warn('[TradingLabEntry] ONBOARDING_STEPS not available, defaulting to account connection');
      return 'onboarding_account_connection';
    }
    
    // Route based on current step from context - OPTIMIZED ACCOUNT-FIRST FLOW
    switch (currentStep) {
      case steps.WELCOME:
      case steps.ACCOUNT_CONNECTION:
        logger.info('[TradingLabEntry] Routing to account connection (Step 1)');
        return 'onboarding_account_connection';
      case steps.STRATEGY_ACTIVATION:
        logger.info('[TradingLabEntry] Routing to strategy activation (Step 2)');
        return 'onboarding_strategy_activation';
      case steps.NETWORK_AMPLIFICATION:
        logger.info('[TradingLabEntry] Routing to network amplification (optional post-success)');
        return 'onboarding_network_amplification';
      case steps.COMPLETED:
        logger.info('[TradingLabEntry] Routing to Trading Lab dashboard');
        return 'trading_lab_dashboard';
      default:
        logger.info('[TradingLabEntry] Unknown step, defaulting to account connection:', currentStep);
        return 'onboarding_account_connection';
    }
  };

  // Handle transition completion
  useEffect(() => {
    if (entryDecision) {
      const timer = setTimeout(() => {
        setShowTransition(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [entryDecision]);

  // Render loading state while determining path
  if (authLoading || !entryDecision) {
    return <EntryLoadingState />;
  }

  // Handle auth required
  if (entryDecision === 'auth_required') {
    // This should be handled by the app's routing system
    return null;
  }

  // Debug logging before render
  logger.info('[TradingLabEntry] Rendering with decision:', entryDecision, 'showTransition:', showTransition);

  // Render appropriate component based on decision
  return (
    <AnimatePresence mode="wait">
      {showTransition ? (
        <EntryTransition key="transition" decision={entryDecision} />
      ) : (
        <EntryContent key="content" decision={entryDecision} oauthState={oauthState} />
      )}
    </AnimatePresence>
  );
};

// Loading state component
const EntryLoadingState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="entry-loading"
    style={styles.loadingContainer}
  >
    <div style={styles.loadingContent}>
      <div style={styles.atomIcon}>
        ⚛️
      </div>
      <motion.p
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
        style={styles.loadingText}
      >
        {ATOMIC_TERMS.ANALYZING} molecular patterns...
      </motion.p>
    </div>
  </motion.div>
);

// Transition animation component
const EntryTransition = ({ decision }) => {
  const getTransitionMessage = () => {
    switch (decision) {
      case 'onboarding_strategy_selection':
        return `Welcome to ${ATOMIC_TERMS.TRADING_LAB}`;
      case 'onboarding_resume':
        return 'Resuming your transformation...';
      case 'trading_lab_dashboard':
        return `Entering ${ATOMIC_TERMS.COMMAND_CENTER}`;
      default:
        return 'Initializing...';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      style={styles.transitionContainer}
    >
      <div style={styles.transitionContent}>
        <div style={styles.transitionIcon}>
          ⚛️
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={styles.transitionTitle}
        >
          {getTransitionMessage()}
        </motion.h2>
      </div>
    </motion.div>
  );
};

// Main content renderer - OPTIMIZED ACCOUNT-FIRST FLOW
const EntryContent = ({ decision, oauthState }) => {
  switch (decision) {
    case 'onboarding_account_connection':
      return <CoreAccountSetup oauthState={oauthState} />;
    
    case 'onboarding_strategy_activation':
      return <CuratedStrategies oauthState={oauthState} />;
    
    case 'onboarding_network_amplification':
      return <NetworkExpansion oauthState={oauthState} />;
    
    case 'onboarding_activation':
      return <NetworkActivation oauthState={oauthState} />;
    
    case 'trading_lab_dashboard':
      // TODO: Replace with actual Trading Lab Dashboard in Phase 3
      return <TradingLabPlaceholder />;
    
    case 'classic_dashboard':
    default:
      return <Dashboard />;
  }
};

// Placeholder for Trading Lab Dashboard (will be implemented in Phase 3)
const TradingLabPlaceholder = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={styles.placeholderContainer}
  >
    <div style={styles.placeholderContent}>
      <h1 style={styles.placeholderTitle}>
        ⚛️ {ATOMIC_TERMS.TRADING_LAB} {ATOMIC_TERMS.COMMAND_CENTER}
      </h1>
      <p style={styles.placeholderText}>
        Trading Lab Dashboard will be implemented in Phase 3.
      </p>
      <p style={styles.placeholderSubtext}>
        For now, you have access to the {ATOMIC_TERMS.TRADING_LAB} experience!
      </p>
      
      {/* Temporary link back to classic dashboard */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={styles.fallbackButton}
        onClick={() => window.location.reload()}
      >
        Return to Classic Dashboard
      </motion.button>
    </div>
  </motion.div>
);

// Styles
const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#000000',
    color: '#ffffff'
  },
  loadingContent: {
    textAlign: 'center',
    padding: '2rem'
  },
  atomIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    display: 'block'
  },
  loadingText: {
    fontSize: '1.1rem',
    fontWeight: '300',
    color: '#00C6E0'
  },
  transitionContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#000000',
    color: '#ffffff'
  },
  transitionContent: {
    textAlign: 'center',
    padding: '2rem'
  },
  transitionIcon: {
    fontSize: '5rem',
    marginBottom: '1.5rem'
  },
  transitionTitle: {
    fontSize: '2rem',
    fontWeight: '300',
    color: '#00C6E0',
    margin: 0
  },
  placeholderContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#000000',
    color: '#ffffff',
    padding: '2rem'
  },
  placeholderContent: {
    textAlign: 'center',
    maxWidth: '600px'
  },
  placeholderTitle: {
    fontSize: '2.5rem',
    fontWeight: '300',
    color: '#00C6E0',
    marginBottom: '1rem'
  },
  placeholderText: {
    fontSize: '1.2rem',
    marginBottom: '1rem',
    color: '#ffffff'
  },
  placeholderSubtext: {
    fontSize: '1rem',
    marginBottom: '2rem',
    color: '#888888'
  },
  fallbackButton: {
    background: 'rgba(0, 198, 224, 0.1)',
    border: '1px solid #00C6E0',
    color: '#00C6E0',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }
};

// Responsive styles using CSS-in-JS with media queries
const responsiveStyles = `
  @media ${devices.mobile} {
    .entry-loading {
      padding: 1rem;
    }
    
    .entry-loading .atom-icon {
      font-size: 3rem;
    }
    
    .entry-loading .loading-text {
      font-size: 1rem;
    }
    
    .transition-content {
      padding: 1rem;
    }
    
    .transition-icon {
      font-size: 4rem;
    }
    
    .transition-title {
      font-size: 1.5rem;
    }
    
    .placeholder-title {
      font-size: 2rem;
    }
    
    .placeholder-text {
      font-size: 1.1rem;
    }
  }
  
  @media ${devices.tablet} {
    .placeholder-title {
      font-size: 2.2rem;
    }
  }
`;

// Inject responsive styles using shared utility
injectResponsiveStyles(responsiveStyles, 'trading-lab-entry-styles');

export default TradingLabEntry;