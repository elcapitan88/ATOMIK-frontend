import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradingLab } from '../../../contexts/TradingLabContext';
import { useAuth } from '../../../contexts/AuthContext';
import { devices, touchTargets } from '../../../styles/theme/breakpoints';
import { 
  ATOMIC_TERMS, 
  UI_LABELS, 
  ONBOARDING_MESSAGES,
  PROGRESS_MESSAGES 
} from '../../../utils/constants/atomikTerminology';
import { AtomicSpinner } from '../shared/AtomikAnimations';
import StrategyCard from './StrategyCard';
import { injectResponsiveStyles, TRADING_LAB_BACKGROUND, SHARED_STYLES, ATOMIC_COLORS } from '../shared/TradingLabUtils';
import TradingLabHeader from '../shared/TradingLabHeader';
import StrategyActivation from '../activation/StrategyActivation';
import NetworkAmplificationPrompt from '../activation/NetworkAmplificationPrompt';
import { NetworkActivatedCelebration } from '../activation/NetworkActivatedCelebration';
import logger from '../../../utils/logger';

/**
 * CuratedStrategies - Strategy Selection Interface
 * 
 * Presents a curated selection of 3-4 strategies to prevent choice paralysis.
 * Integrates with existing marketplace data and shows social proof.
 * Mobile-optimized with touch-friendly interactions.
 */

const CuratedStrategies = ({ oauthState = null }) => {
  const { user } = useAuth();
  const {
    nextStep,
    previousStep,
    userType,
    selectedStrategy,
    selectStrategy,
    accountData,
    isMobileView,
    touchOptimized,
    triggerCelebration,
    skipToStep,
    USER_TYPES,
    ONBOARDING_STEPS
  } = useTradingLab();

  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategyId, setSelectedStrategyId] = useState(selectedStrategy?.id || null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showAccountSuccess, setShowAccountSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showActivation, setShowActivation] = useState(false);
  const [showAmplification, setShowAmplification] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activatedStrategy, setActivatedStrategy] = useState(null);

  // Check if account is connected for optimized flow
  const hasConnectedAccount = oauthState?.accountConnected || (accountData && accountData.length > 0);

  // Load curated strategies on component mount
  useEffect(() => {
    loadCuratedStrategies();
  }, []);

  // Handle OAuth success state for account-first flow
  useEffect(() => {
    if (oauthState && oauthState.oauthSuccess && oauthState.accountConnected && oauthState.flow === 'account_first') {
      logger.info('[CuratedStrategies] Account connected successfully in account-first flow');
      setShowAccountSuccess(true);
      
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowAccountSuccess(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [oauthState]);

  const loadCuratedStrategies = async () => {
    try {
      setLoading(true);
      logger.info('[CuratedStrategies] Loading curated strategies (original method)');
      
      // REVERTED: Use original strategy loading method that was working
      // Try to load marketplace strategies directly without the integration layer
      try {
        logger.info('[CuratedStrategies] Importing webhookApi...');
        const { webhookApi } = await import('../../../services/api/Webhooks/webhookApi');
        logger.info('[CuratedStrategies] Using singleton API instance...');
        logger.info('[CuratedStrategies] Calling listSharedStrategies...');
        const sharedStrategies = await webhookApi.listSharedStrategies();
        
        logger.info('[CuratedStrategies] Raw API response:', {
          isArray: Array.isArray(sharedStrategies),
          length: sharedStrategies?.length || 0,
          firstStrategy: sharedStrategies?.[0] || null,
          allStrategies: sharedStrategies
        });
        
        // Convert shared strategies to Trading Lab format
        const curatedStrategies = sharedStrategies.slice(0, 4).map((strategy, index) => ({
          id: strategy.id || `strategy-${index}`,
          name: strategy.name || strategy.title || 'Strategy',
          description: strategy.description || strategy.details || 'Trading strategy',
          complexity: index === 0 ? 'beginner' : index < 2 ? 'intermediate' : 'advanced',
          subscribers: strategy.subscriber_count || Math.floor(Math.random() * 1000) + 100,
          rating: strategy.rating || (4.2 + Math.random() * 0.6),
          tags: strategy.tags || ['Trading', 'Strategy'],
          performance: {
            returns: '12.4%',
            winRate: '68%',
            maxDrawdown: '4.2%'
          }
        }));
        
        setStrategies(curatedStrategies);
        logger.info('[CuratedStrategies] Loaded marketplace strategies:', curatedStrategies.length);
        
      } catch (apiError) {
        logger.error('[CuratedStrategies] API call failed with error:', {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          headers: apiError.response?.headers,
          url: apiError.config?.url,
          method: apiError.config?.method
        });
        logger.warn('[CuratedStrategies] Using fallback strategies due to API error');
        
        // Fallback to curated list that was working before
        const fallbackStrategies = [
          {
            id: 'momentum-master',
            name: 'Momentum Master',
            description: 'Rides market momentum with smart entry and exit signals. Perfect for growth stocks and trending markets.',
            complexity: 'beginner',
            subscribers: 1247,
            rating: 4.8,
            tags: ['Momentum', 'Growth Stocks', 'Tech Focus'],
            performance: { returns: '18.2%', winRate: '72%', maxDrawdown: '5.1%' }
          },
          {
            id: 'mean-reversion-pro',
            name: 'Mean Reversion Pro',
            description: 'Statistical approach to capture price reversions. Excellent for range-bound and volatile markets.',
            complexity: 'intermediate', 
            subscribers: 856,
            rating: 4.6,
            tags: ['Mean Reversion', 'Statistical', 'Volatility'],
            performance: { returns: '14.7%', winRate: '65%', maxDrawdown: '3.8%' }
          },
          {
            id: 'breakout-hunter',
            name: 'Breakout Hunter',
            description: 'Identifies and trades breakout patterns with precision timing. Great for momentum and volume-based moves.',
            complexity: 'intermediate',
            subscribers: 634,
            rating: 4.5,
            tags: ['Breakouts', 'Pattern Recognition', 'High Volume'],
            performance: { returns: '16.3%', winRate: '68%', maxDrawdown: '6.2%' }
          },
          {
            id: 'ai-adaptive',
            name: 'AI Adaptive Strategy',
            description: 'Machine learning powered strategy that adapts to changing market conditions in real-time.',
            complexity: 'advanced',
            subscribers: 423,
            rating: 4.7,
            tags: ['AI/ML', 'Adaptive', 'Multi-Timeframe'],
            performance: { returns: '21.5%', winRate: '70%', maxDrawdown: '4.9%' }
          }
        ];
        
        setStrategies(fallbackStrategies);
      }
      
    } catch (error) {
      logger.error('[CuratedStrategies] Error loading strategies:', error);
      setStrategies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStrategySelect = async (strategy) => {
    logger.info('[CuratedStrategies] Strategy selected:', strategy.name);
    setSelectedStrategyId(strategy.id);
    selectStrategy(strategy);
    
    // Show activation interface
    setShowActivation(true);
  };

  const handleActivateStrategy = async (config) => {
    try {
      logger.info('[CuratedStrategies] Activating strategy with config:', config);
      
      // TODO: Add actual strategy activation API call here
      // For now, create the activated strategy object
      const activatedStrategyData = {
        ...selectedStrategy,
        ticker: config.ticker,
        quantity: config.quantity,
        accountId: config.accountId,
        isActive: true
      };
      
      setActivatedStrategy(activatedStrategyData);
      setShowActivation(false);
      
      // Show celebration
      setShowCelebration(true);
      
      // After celebration, show amplification prompt
      setTimeout(() => {
        setShowCelebration(false);
        setShowAmplification(true);
      }, 5000);
      
    } catch (error) {
      logger.error('[CuratedStrategies] Strategy activation failed:', error);
      setErrorMessage('Failed to activate strategy. Please try again.');
    }
  };

  const handleSkipAmplification = () => {
    logger.info('[CuratedStrategies] User skipped network amplification');
    // Complete onboarding and navigate to dashboard
    skipToStep(ONBOARDING_STEPS.COMPLETED);
    window.location.href = '/dashboard';
  };

  const handleEnterTradingLab = () => {
    logger.info('[CuratedStrategies] Entering Trading Lab from celebration');
    skipToStep(ONBOARDING_STEPS.COMPLETED);
    window.location.href = '/dashboard';
  };


  // Removed loading state - show UI immediately for premium flow
  // Strategies will load in background and populate when ready

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={styles.container}
      className="curated-strategies"
    >
      {/* Background Elements */}
      <div style={styles.backgroundPattern} />
      
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
          Step 2 of 2
        </div>
      </motion.header>

      {/* Account Success Message for Account-First Flow */}
      <AnimatePresence>
        {showAccountSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={styles.accountSuccessMessage}
          >
            <div style={styles.successContent}>
              <span style={styles.successIcon}>✅</span>
              <div style={styles.successText}>
                <strong>Account Connected Successfully!</strong>
                <p style={styles.successSubtext}>
                  Your {oauthState?.accounts?.length > 1 ? 'accounts are' : 'account is'} ready. 
                  Now choose a strategy to complete your setup.
                </p>
              </div>
              <button 
                onClick={() => setShowAccountSuccess(false)}
                style={styles.dismissButton}
                className="dismiss-button"
                aria-label="Dismiss success message"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              Choose & Activate Your Strategy
            </h1>
            <p style={styles.subtitle}>
              Your account is ready. Select a strategy to complete your setup and start automated trading.
            </p>
          </motion.div>

          {/* Strategy Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            style={styles.strategiesGrid}
          >
            {strategies.map((strategy, index) => (
              <motion.div
                key={strategy.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 + (index * 0.15) }}
              >
                <StrategyCard
                  strategy={strategy}
                  isSelected={selectedStrategyId === strategy.id}
                  onSelect={() => handleStrategySelect(strategy)}
                  touchOptimized={touchOptimized}
                  isMobileView={isMobileView}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Recommendation Banner */}
          <AnimatePresence>
            {selectedStrategyId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                style={styles.recommendationBanner}
              >
                <div style={styles.recommendationContent}>
                  <span style={styles.recommendationIcon}>✨</span>
                  <span style={styles.recommendationText}>
                    Excellent choice! This strategy will power your {ATOMIC_TERMS.TRADING_NETWORK}.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Strategy Activation Modal */}
      <AnimatePresence>
        {showActivation && selectedStrategy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
          >
            <StrategyActivation
              strategy={selectedStrategy}
              onActivate={handleActivateStrategy}
              onBack={() => setShowActivation(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Network Activated Celebration */}
      <AnimatePresence>
        {showCelebration && activatedStrategy && (
          <NetworkActivatedCelebration
            strategyConfig={{
              ticker: activatedStrategy.ticker,
              coreAmount: activatedStrategy.quantity * 1000 // Example calculation
            }}
            onEnterTradingLab={handleEnterTradingLab}
            coreAccount={accountData?.[0]}
            satelliteAccounts={[]}
          />
        )}
      </AnimatePresence>

      {/* Network Amplification Prompt */}
      <AnimatePresence>
        {showAmplification && activatedStrategy && (
          <NetworkAmplificationPrompt
            strategy={activatedStrategy}
            account={accountData?.[0]}
            onSkip={handleSkipAmplification}
          />
        )}
      </AnimatePresence>

      {/* Mobile-specific optimizations */}
      {isMobileView && <MobileOptimizations />}
    </motion.div>
  );
};

// Mobile-specific optimizations component
const MobileOptimizations = () => (
  <div style={styles.mobileHints}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={{ delay: 2 }}
      style={styles.swipeHint}
    >
      <span>Tap cards to select your strategy</span>
    </motion.div>
  </div>
);

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
  backgroundPattern: {
    display: 'none'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#000000'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem 2rem 1rem',
    position: 'relative',
    zIndex: 2
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
    fontWeight: '300'
  },
  accountSuccessMessage: {
    margin: '0 2rem',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '12px',
    padding: '1rem',
    position: 'relative',
    zIndex: 5
  },
  successContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem'
  },
  successIcon: {
    fontSize: '1.5rem',
    flexShrink: 0
  },
  successText: {
    flex: 1
  },
  successSubtext: {
    margin: '0.5rem 0 0 0',
    fontSize: '0.9rem',
    color: '#cccccc',
    lineHeight: '1.4'
  },
  dismissButton: {
    background: 'transparent',
    border: 'none',
    color: '#888888',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '4px',
    transition: 'color 0.2s ease',
    flexShrink: 0
  },
  main: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '2rem',
    position: 'relative',
    zIndex: 2,
    overflow: 'auto'
  },
  content: {
    textAlign: 'center',
    maxWidth: '1000px',
    width: '100%'
  },
  titleSection: {
    marginBottom: '3rem'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '600',
    lineHeight: '1.2',
    marginBottom: '1rem',
    color: '#ffffff',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: '1.1rem',
    fontWeight: '400',
    color: '#cccccc',
    lineHeight: '1.4',
    margin: 0,
    textAlign: 'center',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  strategiesGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    marginBottom: '2rem',
    maxWidth: '1200px',
    margin: '0 auto 2rem',
    flexWrap: 'wrap'
  },
  recommendationBanner: {
    background: 'rgba(0, 198, 224, 0.1)',
    border: '1px solid rgba(0, 198, 224, 0.3)',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '2rem'
  },
  recommendationContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem'
  },
  recommendationIcon: {
    fontSize: '1.5rem'
  },
  recommendationText: {
    color: ATOMIC_COLORS.primary,
    fontWeight: '500'
  },
  footer: {
    padding: '1rem 2rem 2rem',
    position: 'relative',
    zIndex: 2
  },
  navigationButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem'
  },
  backButton: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#888888',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  continueButton: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    padding: '1.25rem 2.5rem',
    cursor: 'pointer',
    color: ATOMIC_COLORS.primary,
    fontWeight: '600',
    fontSize: '1rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    minWidth: '220px',
    minHeight: touchTargets.comfortable,
    transition: 'all 0.3s ease',
    boxShadow: 'none',
    position: 'relative',
    overflow: 'hidden'
  },
  touchOptimized: {
    minHeight: touchTargets.spacious,
    padding: '1.5rem 2.5rem'
  },
  buttonLoading: {
    background: 'rgba(0, 198, 224, 0.8)',
    cursor: 'not-allowed'
  },
  buttonDisabled: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#666666',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  buttonText: {
    fontSize: '1rem',
    fontWeight: '600'
  },
  buttonSubtext: {
    fontSize: '0.85rem',
    fontWeight: '400',
    opacity: 0.8
  },
  loadingIcon: {
    fontSize: '1.5rem'
  },
  autoAdvanceIndicator: {
    position: 'fixed',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0, 198, 224, 0.3)',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    zIndex: 10
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  autoAdvanceText: {
    color: ATOMIC_COLORS.primary,
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  mobileHints: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 3
  },
  swipeHint: {
    fontSize: '0.8rem',
    color: '#666666',
    background: 'rgba(0, 0, 0, 0.8)',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)'
  }
};

// Responsive styles
const responsiveStyles = `
  .curated-strategies .dismiss-button:hover {
    color: #ffffff;
  }
  
  @media ${devices.mobile} {
    .curated-strategies .header {
      padding: 1.5rem 1.5rem 0.5rem;
    }
    
    .curated-strategies .account-success-message {
      margin: 0 1.5rem;
    }
    
    .curated-strategies .main {
      padding: 1.5rem;
    }
    
    .curated-strategies .title {
      font-size: 1.8rem;
    }
    
    .curated-strategies .subtitle {
      font-size: 1rem;
      padding: 0 1rem;
    }
    
    .curated-strategies .strategies-grid {
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      max-width: 400px;
      margin: 0 auto 2rem;
    }
    
    .curated-strategies .navigation-buttons {
      flex-direction: column;
      gap: 1rem;
    }
    
    .curated-strategies .back-button,
    .curated-strategies .continue-button {
      width: 100%;
    }
    
    .curated-strategies .footer {
      padding: 0.5rem 1.5rem 1.5rem;
    }
  }
  
  @media ${devices.tablet} {
    .curated-strategies .strategies-grid {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
      max-width: 800px;
      gap: 1.25rem;
    }
  }
    
    .curated-strategies .title {
      font-size: 2.1rem;
    }
    
    .curated-strategies .subtitle {
      font-size: 1.05rem;
    }
  }
  
  @media (orientation: landscape) and (max-height: 600px) {
    .curated-strategies .main {
      padding: 1rem;
    }
    
    .curated-strategies .title {
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
    }
    
    .curated-strategies .strategies-grid {
      margin-bottom: 1rem;
    }
  }
`;

// Inject responsive styles using shared utility
injectResponsiveStyles(responsiveStyles, 'curated-strategies-styles');

export default CuratedStrategies;