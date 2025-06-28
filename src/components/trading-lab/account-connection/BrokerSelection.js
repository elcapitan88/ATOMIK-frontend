import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { devices, touchTargets } from '../../../styles/theme/breakpoints';
import { ATOMIC_COLORS } from '../shared/TradingLabUtils';
import { injectResponsiveStyles } from '../shared/TradingLabUtils';
import logger from '../../../utils/logger';

/**
 * BrokerSelection - Visual Broker Selection Grid
 * 
 * Large, visual broker logos in a grid layout (not dropdown menus).
 * Integration with existing broker configuration.
 * Demo account options clearly presented.
 * Real-time connection status with branded indicators.
 */

// Available brokers with their configurations
const AVAILABLE_BROKERS = [
  {
    id: 'tradovate',
    name: 'Tradovate',
    logo: '/logos/tradovate.svg',
    description: 'Futures & options trading',
    features: ['Low commissions', 'Advanced charting', 'Cloud-based platform'],
    supportedAssets: ['Futures', 'Options'],
    hasDemo: false,
    popular: true,
    comingSoon: false
  },
  {
    id: 'apex_trader_funding',
    name: 'Apex Trader Funding',
    logo: '/logos/apex.svg',
    description: 'Funded futures trading',
    features: ['$50K-$300K funding', 'Profit split up to 90%', 'Fast payouts'],
    supportedAssets: ['Futures'],
    hasDemo: false,
    popular: true,
    comingSoon: false,
    isPropFirm: true,
    underlyingBroker: 'tradovate'
  },
  {
    id: 'topstep',
    name: 'TopStep',
    logo: '/logos/topstep.svg',
    description: 'Trading combine leader',
    features: ['Combine programs', 'Live funded accounts', 'Mentorship'],
    supportedAssets: ['Futures'],
    hasDemo: false,
    popular: true,
    comingSoon: false,
    isPropFirm: true,
    underlyingBroker: 'tradovate'
  },
  {
    id: 'interactive_brokers',
    name: 'Interactive Brokers',
    logo: '/logos/ib.svg',
    description: 'Global market access',
    features: ['International markets', 'Low margin rates', 'API access'],
    supportedAssets: ['Stocks', 'Options', 'Futures', 'Forex', 'Bonds'],
    hasDemo: false,
    popular: false,
    comingSoon: false
  },
];

const BrokerSelection = ({ 
  onBrokerSelect, 
  selectedBroker, 
  onEnvironmentSelect,
  isMobileView = false,
  touchOptimized = false 
}) => {
  const [hoveredBroker, setHoveredBroker] = useState(null);
  const [showAllBrokers, setShowAllBrokers] = useState(true);
  const [showTradovateEnvironments, setShowTradovateEnvironments] = useState(false);

  // Reset Tradovate environment selector when broker changes
  useEffect(() => {
    if (selectedBroker?.id !== 'tradovate') {
      setShowTradovateEnvironments(false);
    } else if (selectedBroker?.id === 'tradovate') {
      setShowTradovateEnvironments(true);
    }
  }, [selectedBroker]);

  // Show popular brokers first, then others if expanded
  const displayedBrokers = showAllBrokers 
    ? AVAILABLE_BROKERS 
    : AVAILABLE_BROKERS.filter(broker => broker.popular);

  const handleBrokerClick = (broker) => {
    if (broker.comingSoon) {
      logger.info('[BrokerSelection] Coming soon broker clicked:', broker.name);
      return;
    }
    
    if (broker.id === 'tradovate') {
      // For Tradovate, show environment options inline
      logger.info('[BrokerSelection] Tradovate selected, showing environment options');
      setShowTradovateEnvironments(true);
      onBrokerSelect(broker, null); // Don't auto-connect yet
    } else {
      // For other brokers, proceed normally
      onBrokerSelect(broker);
    }
  };

  const handleEnvironmentClick = (environment) => {
    logger.info('[BrokerSelection] Environment selected:', environment);
    if (onEnvironmentSelect) {
      onEnvironmentSelect(environment);
    }
  };

  return (
    <div style={styles.container} className="broker-selection">
      {/* Broker Grid */}
      <motion.div 
        style={styles.brokerGrid}
        className="broker-grid"
      >
        {displayedBrokers.map((broker, index) => (
          <motion.div
            key={broker.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={!isMobileView && !broker.comingSoon && !(selectedBroker?.id === 'tradovate' && broker.id === 'tradovate') ? { scale: 1.02, y: -4 } : {}}
            whileTap={!broker.comingSoon ? { scale: 0.98 } : {}}
            onHoverStart={() => {
              // Disable hover effects for selected Tradovate card
              if (!(selectedBroker?.id === 'tradovate' && broker.id === 'tradovate')) {
                setHoveredBroker(broker.id);
              }
            }}
            onHoverEnd={() => setHoveredBroker(null)}
            onClick={() => handleBrokerClick(broker)}
            style={{
              ...styles.brokerCard,
              ...(selectedBroker?.id === broker.id ? styles.brokerCardSelected : {}),
              ...(hoveredBroker === broker.id && !isMobileView && !(selectedBroker?.id === 'tradovate' && broker.id === 'tradovate') ? styles.brokerCardHovered : {}),
              ...(broker.comingSoon ? styles.brokerCardComingSoon : {}),
              ...(touchOptimized ? styles.brokerCardTouch : {})
            }}
            className={`broker-card ${selectedBroker?.id === broker.id ? 'selected' : ''}`}
          >
            {/* Selection Indicator */}
            {selectedBroker?.id === broker.id && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={styles.selectionIndicator}
              >
                ✓
              </motion.div>
            )}

            {/* Popular Badge */}
            {broker.popular && !broker.comingSoon && (
              <div style={styles.popularBadge}>
                🔥 Popular
              </div>
            )}

            {/* Coming Soon Badge */}
            {broker.comingSoon && (
              <div style={styles.comingSoonBadge}>
                Coming Soon
              </div>
            )}

            {/* Broker Logo */}
            <div style={styles.brokerLogo}>
              {broker.logo.startsWith('/') ? (
                <img 
                  src={broker.logo} 
                  alt={`${broker.name} - ${broker.description} integration for automated trading${broker.isPropFirm ? ' and prop trading' : ''}`}
                  style={styles.brokerLogoImage}
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : (
                <span style={styles.brokerLogoFallback}>{broker.logo}</span>
              )}
              <span style={{ display: 'none' }}>{broker.name.charAt(0)}</span>
            </div>

            {/* Broker Name */}
            <h3 style={styles.brokerName}>
              {broker.name}
            </h3>

            {/* Broker Description */}
            <p style={styles.brokerDescription}>
              {broker.description}
            </p>

            {/* Tradovate Environment Selection */}
            {broker.id === 'tradovate' && selectedBroker?.id === 'tradovate' && showTradovateEnvironments && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={styles.environmentBadges}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEnvironmentClick('demo');
                  }}
                  style={styles.environmentBadge}
                >
                  Demo
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEnvironmentClick('live');
                  }}
                  style={styles.environmentBadge}
                >
                  Live
                </motion.button>
              </motion.div>
            )}

            {/* Demo Badge */}
            {broker.hasDemo && !broker.comingSoon && (
              <div style={styles.demoBadge}>
                📝 Demo Available
              </div>
            )}

            {/* Hover Details */}
            {hoveredBroker === broker.id && !isMobileView && !broker.comingSoon && !(selectedBroker?.id === 'tradovate' && broker.id === 'tradovate') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={styles.hoverDetails}
              >
                <div style={styles.features}>
                  {broker.features.map((feature, idx) => (
                    <div key={idx} style={styles.feature}>
                      <span style={styles.featureIcon}>✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div style={styles.supportedAssets}>
                  <span style={styles.assetsLabel}>Supports:</span>
                  <span style={styles.assetsList}>
                    {broker.supportedAssets.join(', ')}
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Show More Button */}
      {!showAllBrokers && AVAILABLE_BROKERS.length > displayedBrokers.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={styles.showMoreContainer}
        >
          <button
            onClick={() => setShowAllBrokers(true)}
            style={styles.showMoreButton}
            className="show-more-button"
          >
            Show all brokers ({AVAILABLE_BROKERS.length - displayedBrokers.length} more)
          </button>
        </motion.div>
      )}

      {/* Connection Help */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={styles.helpSection}
      >
        <p style={styles.helpText}>
          Don't see your broker? <a href="#" style={styles.helpLink}>Contact support</a>
        </p>
      </motion.div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    width: '100%'
  },
  brokerGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5rem',
    marginBottom: '2rem',
    justifyContent: 'center'
  },
  brokerCard: {
    position: 'relative',
    background: ATOMIC_COLORS.cardBackground,
    border: `1px solid ${ATOMIC_COLORS.border}`,
    borderRadius: '16px',
    padding: '2rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    minHeight: '220px',
    width: '250px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  brokerCardSelected: {
    background: ATOMIC_COLORS.cardBackgroundLight,
    border: `2px solid ${ATOMIC_COLORS.primary}`,
    boxShadow: `0 8px 32px ${ATOMIC_COLORS.primary}20`
  },
  brokerCardHovered: {
    background: ATOMIC_COLORS.cardBackgroundHover,
    border: `1px solid ${ATOMIC_COLORS.borderLight}`,
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)'
  },
  brokerCardComingSoon: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  brokerCardTouch: {
    minHeight: touchTargets.spacious
  },
  selectionIndicator: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: ATOMIC_COLORS.PRIMARY,
    color: '#000000',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1rem',
    boxShadow: `0 4px 12px ${ATOMIC_COLORS.PRIMARY}40`
  },
  popularBadge: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#EF4444',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  comingSoonBadge: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#888888',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  brokerLogo: {
    width: '80px',
    height: '80px',
    marginBottom: '1rem',
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
    lineHeight: 1
  },
  brokerName: {
    fontSize: '1.3rem',
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: ATOMIC_COLORS.text,
    margin: '0 0 0.5rem 0'
  },
  brokerDescription: {
    fontSize: '0.9rem',
    color: ATOMIC_COLORS.textMuted,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0
  },
  demoBadge: {
    position: 'absolute',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(16, 185, 129, 0.1)',
    color: ATOMIC_COLORS.SUCCESS,
    border: '1px solid rgba(16, 185, 129, 0.3)',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  hoverDetails: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.95)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '1.5rem',
    borderRadius: '16px'
  },
  features: {
    marginBottom: '1rem'
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: '#cccccc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    marginBottom: '0.25rem'
  },
  featureIcon: {
    color: ATOMIC_COLORS.SUCCESS,
    fontWeight: 'bold'
  },
  supportedAssets: {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    paddingTop: '1rem',
    fontSize: '0.8rem',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  assetsLabel: {
    color: '#888888',
    marginRight: '0.5rem'
  },
  assetsList: {
    color: ATOMIC_COLORS.PRIMARY
  },
  environmentBadges: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
    justifyContent: 'center'
  },
  environmentBadge: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: '#ffffff',
    padding: '0.4rem 0.8rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flex: 1,
    minWidth: '70px',
    backdropFilter: 'blur(10px)'
  },
  showMoreContainer: {
    textAlign: 'center',
    marginBottom: '1rem'
  },
  showMoreButton: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#888888',
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  helpSection: {
    textAlign: 'center',
    marginTop: '1rem'
  },
  helpText: {
    fontSize: '0.9rem',
    color: '#666666',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0
  },
  helpLink: {
    color: ATOMIC_COLORS.PRIMARY,
    textDecoration: 'none',
    transition: 'all 0.3s ease'
  }
};

// Responsive styles
const responsiveStyles = `
  @media ${devices.mobile} {
    .broker-selection .broker-grid {
      gap: 1rem;
    }
    
    .broker-selection .broker-card {
      padding: 1.5rem;
      min-height: 180px;
      width: 100%;
      max-width: 300px;
    }
    
    .broker-selection .broker-logo {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
    }
    
    .broker-selection .broker-name {
      font-size: 1.1rem;
    }
    
    .broker-selection .show-more-button {
      width: 100%;
    }
    
    .broker-selection .environment-badges {
      flex-direction: column;
      gap: 0.4rem;
    }
    
    .broker-selection .environment-badge {
      font-size: 0.75rem;
      padding: 0.3rem 0.6rem;
    }
  }
  
  @media ${devices.tablet} {
    .broker-selection .broker-card {
      width: 240px;
    }
  }
  
  @media (min-width: 1024px) {
    .broker-selection .broker-card {
      width: 250px;
    }
  }
`;

// Inject responsive styles using shared utility
injectResponsiveStyles(responsiveStyles, 'broker-selection-styles');

export default BrokerSelection;