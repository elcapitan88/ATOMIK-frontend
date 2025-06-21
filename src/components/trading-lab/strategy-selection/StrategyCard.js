import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { devices, touchTargets } from '../../../styles/theme/breakpoints';
import { injectResponsiveStyles, ATOMIC_COLORS } from '../shared/TradingLabUtils';
import logger from '../../../utils/logger';

/**
 * StrategyCard - Redesigned for TradingLab Simplicity
 * 
 * Fixed 350px height, Apple-like design with exactly 4 essential elements:
 * 1. Strategy name + emoji (instant recognition)
 * 2. Simple description (what it does)
 * 3. Single key metric (annual return) 
 * 4. Select button (clear action)
 * 
 * Eliminates analysis paralysis by removing complexity.
 * Mobile-first responsive design for 3-minute magic moment.
 */

const StrategyCard = ({ 
  strategy, 
  isSelected, 
  onSelect, 
  touchOptimized = false,
  isMobileView = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Safety check for strategy object
  if (!strategy) {
    logger.warn('[StrategyCard] Strategy object is undefined');
    return null;
  }

  const handleSelect = () => {
    logger.info('[StrategyCard] Strategy selected:', strategy.name);
    onSelect(strategy);
  };

  const getRiskColor = () => {
    const riskColors = {
      'beginner': '#10B981',
      'intermediate': '#F59E0B', 
      'advanced': '#EF4444'
    };
    return riskColors[strategy.riskLevel] || '#00C6E0';
  };

  const toggleDetails = (e) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  return (
    <motion.div
      whileHover={!isMobileView ? { scale: 1.02, y: -4 } : {}}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleSelect}
      style={{
        ...styles.card,
        ...(isSelected ? styles.cardSelected : {}),
        ...(isHovered ? styles.cardHovered : {})
      }}
      className={`strategy-card ${isSelected ? 'selected' : ''}`}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={styles.selectionIndicator}
        >
          <span style={styles.checkmark}>✓</span>
        </motion.div>
      )}

      {/* Strategy Identity */}
      <div style={styles.strategyIdentity}>
        <h3 style={styles.strategyName}>
          {strategy.name || 'Unnamed Strategy'}
        </h3>
        <div style={styles.riskBadge}>
          <span style={{
            ...styles.riskIndicator,
            backgroundColor: getRiskColor() + '20',
            color: getRiskColor(),
            border: `1px solid ${getRiskColor()}40`
          }}>
            {strategy.riskLevel || 'intermediate'}
          </span>
        </div>
      </div>

      {/* Description with Expandable */}
      <div style={styles.descriptionContainer}>
        <p style={styles.description}>
          {showDetails 
            ? (strategy.description || 'No description available')
            : (strategy.description || '').length > 100 
              ? (strategy.description || '').substring(0, 100) + '...' 
              : (strategy.description || 'No description available')
          }
        </p>
        {(strategy.description || '').length > 100 && (
          <button
            onClick={toggleDetails}
            style={styles.expandText}
            className="expand-text"
          >
            {showDetails ? ' Show less' : ' Read more'}
          </button>
        )}
      </div>

      {/* Social Proof */}
      <div style={styles.socialProof}>
        <div style={styles.socialMetrics}>
          <span style={styles.subscribers}>
            👥 {(strategy.socialProof?.subscribers || strategy.subscribers || 0).toLocaleString()}
          </span>
          <div style={styles.rating}>
            <span style={styles.stars}>
              {'★'.repeat(Math.floor(strategy.socialProof?.rating || strategy.rating || 4.5))}
            </span>
            <span style={styles.ratingValue}>
              {(strategy.socialProof?.rating || strategy.rating || 4.5).toFixed(1)}
            </span>
          </div>
        </div>
      </div>


      {/* Select Button - Always Visible */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect();
        }}
        style={{
          ...styles.selectButton,
          ...(isSelected ? styles.selectButtonSelected : {}),
          ...(touchOptimized ? styles.selectButtonTouch : {})
        }}
        className="select-button"
      >
        {isSelected ? (
          <>
            <span style={styles.buttonIcon}>✓</span>
            <span>Selected</span>
          </>
        ) : (
          <span>Select Strategy</span>
        )}
      </motion.button>

      {/* Subtle hover effect */}
      {isHovered && !isMobileView && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={styles.hoverOverlay}
        />
      )}
    </motion.div>
  );
};

// Styles optimized for Apple-like simplicity
const styles = {
  card: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    height: '380px', // Increased height for better content display
    width: '100%',
    maxWidth: '280px', // Consistent card width
    display: 'flex',
    flexDirection: 'column',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  cardSelected: {
    background: 'rgba(0, 198, 224, 0.08)',
    border: '2px solid rgba(0, 198, 224, 0.4)',
    boxShadow: '0 12px 40px rgba(0, 198, 224, 0.15)'
  },
  cardHovered: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)',
    transform: 'translateY(-2px)'
  },
  selectionIndicator: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: '#00C6E0',
    color: '#000000',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    boxShadow: '0 4px 12px rgba(0, 198, 224, 0.4)'
  },
  checkmark: {
    fontSize: '0.9rem',
    fontWeight: 'bold'
  },
  strategyIdentity: {
    textAlign: 'center',
    marginBottom: '1rem'
  },
  strategyName: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 0.5rem 0',
    lineHeight: 1.2
  },
  riskBadge: {
    display: 'flex',
    justifyContent: 'center'
  },
  riskIndicator: {
    padding: '0.3rem 1rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  descriptionContainer: {
    textAlign: 'center',
    margin: '0 0 1rem 0',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  description: {
    fontSize: '0.9rem',
    color: '#cccccc',
    lineHeight: '1.4',
    textAlign: 'center',
    margin: '0'
  },
  performanceHighlight: {
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.06)'
  },
  metricLabel: {
    fontSize: '0.9rem',
    color: '#888888',
    marginBottom: '0.5rem',
    fontWeight: '400'
  },
  metricValue: {
    fontSize: '1.8rem',
    fontWeight: '700',
    lineHeight: 1
  },
  selectButton: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '16px',
    padding: '1rem',
    color: '#00C6E0',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    minHeight: touchTargets.comfortable,
    backdropFilter: 'blur(10px)'
  },
  selectButtonSelected: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: '#10B981'
  },
  selectButtonTouch: {
    minHeight: touchTargets.spacious,
    padding: '1.25rem'
  },
  buttonIcon: {
    fontSize: '1.1rem'
  },
  hoverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 198, 224, 0.02)',
    borderRadius: '20px',
    zIndex: 1,
    pointerEvents: 'none'
  },
  detailsButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1rem'
  },
  socialProof: {
    marginBottom: '1rem',
    marginTop: 'auto'
  },
  socialMetrics: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  subscribers: {
    fontSize: '0.8rem',
    color: '#888888'
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  stars: {
    color: '#F59E0B',
    fontSize: '0.8rem'
  },
  ratingValue: {
    fontSize: '0.8rem',
    color: '#ffffff',
    fontWeight: '500'
  },
  expandText: {
    background: 'transparent',
    border: 'none',
    color: '#00C6E0',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '0.25rem',
    textDecoration: 'underline'
  },
};

// Mobile-first responsive styles
const responsiveStyles = `
  @media ${devices.mobile} {
    .strategy-card {
      height: 300px !important;
      padding: 1.25rem !important;
    }
    
    .strategy-card .strategy-icon {
      font-size: 2rem !important;
      margin-bottom: 0.5rem !important;
    }
    
    .strategy-card .strategy-name {
      font-size: 1.1rem !important;
      margin-bottom: 0.5rem !important;
    }
    
    .strategy-card .description {
      font-size: 0.85rem !important;
      margin-bottom: 1rem !important;
    }
    
    .strategy-card .select-button {
      padding: 1rem !important;
      font-size: 0.95rem !important;
    }
  }
  
  @media ${devices.tablet} {
    .strategy-card {
      height: 320px !important;
    }
  }
`;

// Inject responsive styles
injectResponsiveStyles(responsiveStyles, 'strategy-card-simplified-styles');

export default StrategyCard;