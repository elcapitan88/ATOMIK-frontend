import React from 'react';
import { motion } from 'framer-motion';
import { createAtomicLogo, formatStepIndicator, SHARED_STYLES, ANIMATION_VARIANTS } from './TradingLabUtils';

/**
 * TradingLabHeader - Shared header component for Trading Lab screens
 * 
 * Provides consistent branding and navigation across all Trading Lab components.
 * Includes animated atomic logo, step indicators, and optional back button.
 */

const TradingLabHeader = ({
  currentStep = null,
  totalSteps = null,
  showLogo = true,
  showSteps = true,
  animated = true,
  onBack = null,
  className = '',
  style = {},
  ...props
}) => {
  const logo = createAtomicLogo(animated);

  return (
    <motion.header
      {...ANIMATION_VARIANTS.slideDown}
      transition={{ delay: 0.2 }}
      style={{
        ...SHARED_STYLES.header,
        ...style
      }}
      className={`trading-lab-header ${className}`}
      {...props}
    >
      {/* Logo Section */}
      {showLogo && (
        <div style={SHARED_STYLES.logo}>
          {logo.icon === 'IMAGE' ? (
            <img 
              src={logo.logoSrc} 
              alt="Atomik Trading" 
              style={styles.logoImage}
            />
          ) : (
            <>
              <motion.span
                {...(logo.animated ? logo.rotation : {})}
                style={styles.atomIcon}
              >
                {logo.icon}
              </motion.span>
              {logo.text && (
                <span style={SHARED_STYLES.logoText}>
                  {logo.text}
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Center Section - Could be used for titles in future */}
      <div style={styles.centerSection}>
        {/* Reserved for future use - titles, search, etc. */}
      </div>

      {/* Right Section - Steps or Actions */}
      <div style={styles.rightSection}>
        {/* Back Button */}
        {onBack && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            style={styles.backButton}
            className="header-back-button"
          >
            ← Back
          </motion.button>
        )}

        {/* Step Indicator */}
        {showSteps && currentStep && totalSteps && (
          <div style={SHARED_STYLES.stepIndicator}>
            {formatStepIndicator(currentStep, totalSteps)}
          </div>
        )}
      </div>
    </motion.header>
  );
};

// Styles specific to header component
const styles = {
  atomIcon: {
    fontSize: '2rem',
    display: 'inline-block'
  },
  logoImage: {
    height: '2rem',
    width: 'auto',
    objectFit: 'contain'
  },
  centerSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  backButton: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#888888',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }
};

export default TradingLabHeader;