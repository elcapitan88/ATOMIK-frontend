import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTradingLab } from '../../../contexts/TradingLabContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useOAuth } from '../../../hooks/useOAuth';
import { devices, touchTargets } from '../../../styles/theme/breakpoints';
import { ATOMIC_TERMS } from '../../../utils/constants/atomikTerminology';
import { ENVIRONMENTS, getBrokerById } from '../../../utils/constants/brokers';
import { injectResponsiveStyles, ATOMIC_COLORS } from '../shared/TradingLabUtils';
import BrokerSelection from './BrokerSelection';
import logger from '../../../utils/logger';

/**
 * CoreAccountSetup - Progressive Account Connection Flow
 * 
 * Handles the OAuth integration with existing broker connection logic.
 * Features visual broker selection, security messaging, and progress indicators.
 * Mobile-optimized OAuth flow with smooth transitions.
 */

const CoreAccountSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { initiateBrokerAuth, isProcessing, error: oauthError } = useOAuth();
  const {
    nextStep,
    previousStep,
    selectedStrategy,
    setAccountData,
    accountData,
    isMobileView,
    touchOptimized,
    triggerCelebration,
    currentStep,
    skipToStep,
    ONBOARDING_STEPS
  } = useTradingLab();

  const [selectedBroker, setSelectedBroker] = useState(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState(ENVIRONMENTS.LIVE); // Preserve existing default: live trading
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, connecting, success, error
  const [errorMessage, setErrorMessage] = useState(null);

  // Account-first flow: Ensure correct step on mount
  useEffect(() => {
    if (currentStep !== ONBOARDING_STEPS.ACCOUNT_CONNECTION) {
      logger.info('[CoreAccountSetup] Correcting step to account_connection, was:', currentStep);
      skipToStep(ONBOARDING_STEPS.ACCOUNT_CONNECTION);
    }
  }, []); // Empty dependency array - only run once on mount

  const handleBrokerSelect = async (broker, skipAutoConnect = false) => {
    logger.info('[CoreAccountSetup] Broker selected:', broker.name);
    setSelectedBroker(broker);
    setErrorMessage(null);
    
    // Set default environment for prop firms
    if (broker.isPropFirm) {
      setSelectedEnvironment(ENVIRONMENTS.DEMO); // Prop firms default to demo
      // Auto-connect prop firms immediately
      if (!skipAutoConnect) {
        setTimeout(() => {
          handleConnect(broker);
        }, 800);
      }
    } else if (broker.id === 'tradovate') {
      // For Tradovate, don't auto-connect - wait for environment selection
      // Environment selection will be shown inline in the card
      logger.info('[CoreAccountSetup] Tradovate selected, waiting for environment selection');
    } else {
      // Other brokers default to live environment
      setSelectedEnvironment(ENVIRONMENTS.LIVE);
      // Auto-connect other brokers
      if (!skipAutoConnect) {
        setTimeout(() => {
          handleConnect(broker);
        }, 800);
      }
    }
  };

  const handleEnvironmentSelect = (environment) => {
    logger.info('[CoreAccountSetup] Environment selected:', environment);
    setSelectedEnvironment(environment);
    
    // Auto-connect after environment selection
    setTimeout(() => {
      handleConnect(selectedBroker);
    }, 500);
  };

  const handleConnect = async (brokerToConnect = selectedBroker) => {
    if (!brokerToConnect) return;

    setIsConnecting(true);
    setConnectionStatus('connecting');
    setConnectionProgress(0);
    setErrorMessage(null);

    try {
      logger.info('[CoreAccountSetup] Starting connection for:', brokerToConnect.name, selectedEnvironment);
      
      // TEMPORARY: Simulate OAuth flow for Trading Lab testing
      // TODO: Remove this simulation and restore real OAuth when ready
      const isSimulatingOAuth = true; // Set to false to use real OAuth
      
      if (isSimulatingOAuth) {
        logger.info('[CoreAccountSetup] SIMULATING OAuth flow for Trading Lab testing');
        
        // Simulate connection progress
        setConnectionProgress(25);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setConnectionProgress(50);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setConnectionProgress(75);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setConnectionProgress(100);
        setConnectionStatus('success');
        
        // Simulate successful account data
        const mockAccountData = [{
          id: `${brokerToConnect.name.toLowerCase()}_account_1`,
          name: `${brokerToConnect.name} Account`,
          nickname: brokerToConnect.isPropFirm ? `${brokerToConnect.name} Funded` : `${brokerToConnect.name} Trading`,
          balance: brokerToConnect.isPropFirm ? 50000 : 25000,
          environment: selectedEnvironment,
          broker: brokerToConnect.name,
          connected: true
        }];
        
        setAccountData(mockAccountData);
        
        // Wait a moment to show success, then proceed to strategy activation (optimized flow)
        setTimeout(() => {
          logger.info('[CoreAccountSetup] Account connection complete, advancing to strategy activation (step 2 of 2)');
          setIsConnecting(false);
          
          // OPTIMIZED FLOW: Advance directly to strategy activation
          skipToStep(ONBOARDING_STEPS.STRATEGY_ACTIVATION);
          
          // Navigate to Trading Lab with strategy activation step
          setTimeout(() => {
            logger.info('[CoreAccountSetup] Navigating to strategy activation step');
            navigate('/trading-lab', { 
              state: { 
                oauthSuccess: true, 
                accountConnected: true,
                accounts: mockAccountData,
                flow: 'account_first',
                forceStep: 'strategy_activation'
              }
            });
          }, 500);
        }, 1000);
        
      } else {
        // REAL OAuth flow (currently disabled for testing)
        // Store Trading Lab context before OAuth redirect (account-first flow)
        sessionStorage.setItem('trading_lab_oauth_context', JSON.stringify({
          step: 'account_connection',
          flow: 'account_first',
          redirect_to: 'strategy_activation', // OPTIMIZED: Direct to combined selection/activation
          accountData: accountData,
          timestamp: Date.now()
        }));

        // Set progress to show we're initiating OAuth
        setConnectionProgress(25);

        // Get the proper broker ID for OAuth (handle prop firms routing to Tradovate)
        const oauthBrokerId = getOAuthBrokerForSelection(brokerToConnect);
        
        // Initiate REAL OAuth flow using existing infrastructure
        await initiateBrokerAuth(oauthBrokerId, selectedEnvironment);
        
        // OAuth will redirect to broker, then return to our callback
        // The callback will handle success and redirect back to Trading Lab
      }

    } catch (error) {
      logger.error('[CoreAccountSetup] Connection error:', error);
      setConnectionStatus('error');
      setErrorMessage(oauthError || error.message || 'Failed to connect to broker. Please try again.');
      setIsConnecting(false);
      setConnectionProgress(0);
    }
  };

  // Helper function to handle prop firm routing
  const getOAuthBrokerForSelection = (selectedBroker) => {
    // If it's a prop firm, route through its underlying broker
    if (selectedBroker.isPropFirm && selectedBroker.underlyingBroker) {
      return selectedBroker.underlyingBroker;
    }
    return selectedBroker.id;
  };

  const getProgressMessage = () => {
    const envText = selectedEnvironment === ENVIRONMENTS.DEMO ? 'demo' : 'live';
    if (connectionProgress < 30) return `Initiating secure OAuth flow for ${envText} environment...`;
    if (connectionProgress < 60) return 'Redirecting to broker authentication...';
    if (connectionProgress < 90) return 'Awaiting broker authorization...';
    return 'Completing OAuth flow...';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={styles.container}
      className="core-account-setup"
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={styles.header}
      >
        <div style={styles.logo}>
          <img 
            src="/logos/atomik-logo.svg" 
            alt="Atomik Trading" 
            style={styles.logoImage}
          />
        </div>
        
        <div style={styles.stepIndicator}>
          Step 1 of 2
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        style={styles.main}
      >
        <div style={styles.content}>
          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            style={styles.titleSection}
          >
            <h1 style={styles.title}>
              Connect Your Trading Account
            </h1>
            <p style={styles.subtitle}>
              You're seconds away from having AI trading for you automatically
            </p>
            <p style={styles.description}>
              ⚛️ Connect your account and choose a strategy to complete your setup
            </p>
          </motion.div>

          {/* Connection Status or Broker Selection */}
          <AnimatePresence mode="wait">
            {connectionStatus === 'connecting' || connectionStatus === 'success' ? (
              <motion.div
                key="progress"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={styles.progressContainer}
              >
                <div style={styles.progressHeader}>
                  <div style={styles.brokerLogo}>
                    <img 
                      src={selectedBroker?.logo} 
                      alt={`${selectedBroker?.name} logo`}
                      style={styles.brokerLogoImage}
                    />
                  </div>
                  <h3 style={styles.progressTitle}>
                    Connecting to {selectedBroker?.name}
                  </h3>
                </div>

                <div style={styles.progressBarContainer}>
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

                {connectionStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={styles.successMessage}
                  >
                    <span style={styles.successIcon}>✅</span>
                    <span>Connected successfully!</span>
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
                  touchOptimized={touchOptimized}
                />

                {/* Security Message */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  style={styles.securityMessage}
                >
                  <span style={styles.lockIcon}>🔒</span>
                  <span style={styles.securityText}>
                    Secure OAuth - we never see your login credentials
                  </span>
                </motion.div>

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

                {/* Auto-connecting indicator */}
                {selectedBroker && !isConnecting && (selectedBroker.id !== 'tradovate' || (selectedBroker.id === 'tradovate' && selectedEnvironment)) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={styles.autoConnectIndicator}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={styles.loadingIcon}
                    >
                      ⚛️
                    </motion.div>
                    <span style={styles.autoConnectText}>
                      Connecting to {selectedBroker.name}...
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Real Trading Only - No Demo Options */}
    </motion.div>
  );
};

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: '#000000',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem',
    position: 'relative',
    zIndex: 2
  },
  backButton: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  logoImage: {
    height: '2rem',
    width: 'auto',
    objectFit: 'contain'
  },
  stepIndicator: {
    fontSize: '0.9rem',
    color: '#888888',
    fontWeight: '400',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  main: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    position: 'relative',
    zIndex: 2
  },
  content: {
    textAlign: 'center',
    maxWidth: '800px',
    width: '100%',
    margin: '0 auto'
  },
  titleSection: {
    marginBottom: '3rem'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '400',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: '1.2',
    marginBottom: '1rem',
    color: '#ffffff'
  },
  subtitle: {
    fontSize: '1.3rem',
    fontWeight: '400',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#cccccc',
    marginBottom: '1rem'
  },
  description: {
    fontSize: '1.1rem',
    fontWeight: '400',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: ATOMIC_COLORS.PRIMARY,
    lineHeight: '1.4'
  },
  progressContainer: {
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0, 198, 224, 0.2)',
    borderRadius: '16px',
    padding: '3rem',
    maxWidth: '500px',
    margin: '0 auto'
  },
  progressHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem'
  },
  brokerLogo: {
    width: '120px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  brokerLogoImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain'
  },
  brokerLogoFallback: {
    fontSize: '3rem',
    fontWeight: '600',
    color: ATOMIC_COLORS.PRIMARY,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },
  progressTitle: {
    fontSize: '1.5rem',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#ffffff',
    margin: 0
  },
  progressBarContainer: {
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
    color: '#888888',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    marginBottom: '1rem'
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    color: ATOMIC_COLORS.SUCCESS,
    fontSize: '1.1rem',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    marginTop: '1rem'
  },
  successIcon: {
    fontSize: '1.5rem'
  },
  securityMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginTop: '2rem',
    padding: '1rem 2rem',
    background: 'rgba(0, 198, 224, 0.05)',
    border: '1px solid rgba(0, 198, 224, 0.2)',
    borderRadius: '12px',
    maxWidth: '400px',
    margin: '2rem auto 0'
  },
  lockIcon: {
    fontSize: '1.2rem'
  },
  securityText: {
    fontSize: '0.95rem',
    color: '#cccccc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
  },
  autoConnectIndicator: {
    marginTop: '2rem',
    background: 'rgba(0, 198, 224, 0.1)',
    border: '1px solid rgba(0, 198, 224, 0.3)',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    maxWidth: '300px',
    margin: '2rem auto 0'
  },
  autoConnectText: {
    color: ATOMIC_COLORS.PRIMARY,
    fontSize: '0.9rem',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  buttonIcon: {
    fontSize: '1.3rem'
  },
  loadingIcon: {
    fontSize: '1.3rem'
  }
};

// Responsive styles
const responsiveStyles = `
  @media ${devices.mobile} {
    .core-account-setup .header {
      padding: 1.5rem;
    }
    
    .core-account-setup .main {
      padding: 1.5rem;
    }
    
    .core-account-setup .title {
      font-size: 2rem;
    }
    
    .core-account-setup .subtitle {
      font-size: 1.1rem;
    }
    
    .core-account-setup .progress-container {
      padding: 2rem;
    }
    
    .core-account-setup .auto-connect-indicator {
      max-width: 90%;
      margin: 1.5rem auto 0;
    }
    
    .core-account-setup .security-message {
      margin: 1.5rem auto 0;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
    }
  }
  
  @media ${devices.tablet} {
    .core-account-setup .title {
      font-size: 2.2rem;
    }
  }
`;

// Inject responsive styles using shared utility
injectResponsiveStyles(responsiveStyles, 'core-account-setup-styles');

export default CoreAccountSetup;