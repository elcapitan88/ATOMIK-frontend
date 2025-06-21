/**
 * Trading Lab Shared Utilities
 * 
 * Common functions and patterns used across Trading Lab components
 * to reduce code duplication and ensure consistency.
 */

import logger from '../../../utils/logger';

/**
 * Inject responsive CSS styles into document head
 * @param {string} styles - CSS string to inject
 * @param {string} id - Unique identifier for the style sheet
 */
export const injectResponsiveStyles = (styles, id = 'trading-lab-styles') => {
  if (typeof document !== 'undefined') {
    // Remove existing styles with same ID
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }
    
    const styleSheet = document.createElement('style');
    styleSheet.id = id;
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    logger.debug(`[TradingLabUtils] Injected styles: ${id}`);
  }
};

/**
 * Common background used across Trading Lab - Pure black to match dashboard branding
 */
export const TRADING_LAB_BACKGROUND = '#000000';

/**
 * Alternative backgrounds for variety - All pure black variations
 */
export const TRADING_LAB_BACKGROUNDS = {
  primary: '#000000',
  subtle: '#000000',
  intense: '#000000'
};

/**
 * Dashboard-matching color scheme: black bg → grey components → lighter grey sub-components → cyan accents
 */
export const ATOMIC_COLORS = {
  // Cyan accent color (from dashboard)
  primary: '#00C6E0',
  secondary: '#0099B3',
  
  // Dashboard-matching greys
  background: '#000000',           // Pure black background
  cardBackground: '#1a1a1a',       // Dark grey for main components
  cardBackgroundLight: '#2a2a2a',  // Lighter grey for sub-components
  cardBackgroundHover: '#333333',  // Hover state
  
  // Borders and dividers
  border: '#333333',
  borderLight: '#444444',
  
  // Text colors
  text: '#ffffff',
  textSecondary: '#cccccc',
  textMuted: '#888888',
  textDisabled: '#666666',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B', 
  error: '#EF4444'
};

/**
 * Shared style objects for common patterns
 */
export const SHARED_STYLES = {
  // Atomic spinner styles
  atomicSpinner: {
    display: 'inline-block',
    fontSize: '2rem'
  },
  
  // Common loading container
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: TRADING_LAB_BACKGROUND
  },
  
  // Background pattern for depth - DISABLED for pure black background
  backgroundPattern: {
    display: 'none'
  },
  
  // Common header styles
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem 2rem 1rem',
    position: 'relative',
    zIndex: 2
  },
  
  // Atomic logo styles
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  
  logoText: {
    fontSize: '1.5rem',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: ATOMIC_COLORS.primary
  },
  
  // Step indicator
  stepIndicator: {
    fontSize: '0.9rem',
    color: ATOMIC_COLORS.textMuted,
    fontWeight: '400',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  
  // Touch-optimized button base
  touchOptimizedButton: {
    minHeight: '56px', // spacious touch target
    padding: '1rem 2rem',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  // Primary button variant - Modern glassmorphism
  primaryButton: {
    background: `linear-gradient(135deg, 
      rgba(0, 198, 224, 0.15) 0%, 
      rgba(0, 198, 224, 0.25) 100%)`,
    backdropFilter: 'blur(20px)',
    border: `1px solid rgba(0, 198, 224, 0.3)`,
    color: ATOMIC_COLORS.primary,
    boxShadow: `0 8px 32px rgba(0, 198, 224, 0.15), 
                inset 0 1px 0 rgba(255, 255, 255, 0.1)`
  },
  
  // Secondary button variant
  secondaryButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: ATOMIC_COLORS.text,
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  
  // Disabled button state
  disabledButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: ATOMIC_COLORS.textMuted,
    cursor: 'not-allowed',
    boxShadow: 'none'
  }
};

/**
 * Generate responsive CSS for Trading Lab components
 * @param {string} componentClass - Base CSS class name
 * @param {Object} breakpoints - Custom breakpoints if needed
 */
export const generateResponsiveCSS = (componentClass, customRules = {}) => {
  const defaultRules = {
    mobile: `
      .${componentClass} .header {
        padding: 1.5rem 1.5rem 0.5rem;
      }
      
      .${componentClass} .main {
        padding: 1.5rem;
      }
      
      .${componentClass} .title {
        font-size: 2rem;
      }
      
      .${componentClass} .navigation-buttons {
        flex-direction: column;
        gap: 1rem;
      }
      
      .${componentClass} .navigation-buttons > * {
        width: 100%;
      }
    `,
    tablet: `
      .${componentClass} .title {
        font-size: 2.2rem;
      }
    `,
    landscape: `
      .${componentClass} .main {
        padding: 1rem;
      }
      
      .${componentClass} .title {
        font-size: 1.8rem;
        margin-bottom: 0.5rem;
      }
    `
  };

  const rules = { ...defaultRules, ...customRules };

  return `
    @media (max-width: 768px) {
      ${rules.mobile}
    }
    
    @media (min-width: 769px) and (max-width: 1024px) {
      ${rules.tablet}
    }
    
    @media (orientation: landscape) and (max-height: 600px) {
      ${rules.landscape}
    }
  `;
};

/**
 * Create atomic logo component data
 * @param {boolean} animated - Whether to animate the atom icon (deprecated, now uses static logo)
 */
export const createAtomicLogo = (animated = true) => ({
  icon: 'IMAGE', // Special marker to indicate image should be used
  text: null, // No text needed with logo image
  animated: false, // Disable animation
  rotation: {}, // No rotation for image logo
  logoSrc: '/logos/atomik-logo.svg' // Path to logo image
});

/**
 * Common animation variants for Trading Lab components
 */
export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 }
  },
  
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 }
  },
  
  stagger: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }
};

/**
 * Create staggered animation delays for lists
 * @param {number} index - Item index
 * @param {number} baseDelay - Base delay in seconds
 * @param {number} staggerDelay - Delay between items
 */
export const createStaggerDelay = (index, baseDelay = 0.5, staggerDelay = 0.15) => {
  return baseDelay + (index * staggerDelay);
};

/**
 * Haptic feedback helper
 * @param {string} type - Type of haptic feedback
 * @param {boolean} enabled - Whether haptic feedback is enabled
 */
export const triggerHapticFeedback = (type = 'light', enabled = true) => {
  if (!enabled || !navigator.vibrate) return;
  
  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30],
    success: [10, 50, 10],
    error: [50, 10, 50],
    notification: [25, 25, 25]
  };
  
  const pattern = patterns[type] || patterns.light;
  navigator.vibrate(pattern);
  
  logger.debug(`[TradingLabUtils] Haptic feedback: ${type}`);
};

/**
 * Format step indicator text
 * @param {number} current - Current step (1-based)
 * @param {number} total - Total steps
 */
export const formatStepIndicator = (current, total) => {
  return `Step ${current} of ${total}`;
};

/**
 * Create celebration config for different milestone types
 */
export const CELEBRATION_CONFIGS = {
  welcome: {
    type: 'strategy_selected',
    message: 'Welcome to your Trading Lab!',
    duration: 2000
  },
  strategy_selected: {
    type: 'strategy_selected',
    message: 'Excellent strategy choice!',
    duration: 1500
  },
  network_activated: {
    type: 'network_activated',
    message: 'Your trading network is now active!',
    duration: 3000
  },
  first_trade: {
    type: 'first_trade',
    message: 'Congratulations on your first trade!',
    duration: 2500
  }
};

/**
 * Performance optimization: Debounce function for resize events
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 */
export const debounce = (func, wait = 250) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if device supports specific features
 */
export const DEVICE_CAPABILITIES = {
  hasHapticFeedback: () => 'vibrate' in navigator,
  hasVisualViewport: () => 'visualViewport' in window,
  hasTouchSupport: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  hasReducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isMobile: () => window.innerWidth <= 768,
  isTablet: () => window.innerWidth > 768 && window.innerWidth <= 1024,
  isLandscape: () => window.innerWidth > window.innerHeight
};

export default {
  injectResponsiveStyles,
  generateResponsiveCSS,
  createAtomicLogo,
  createStaggerDelay,
  triggerHapticFeedback,
  formatStepIndicator,
  debounce,
  TRADING_LAB_BACKGROUND,
  TRADING_LAB_BACKGROUNDS,
  ATOMIC_COLORS,
  SHARED_STYLES,
  ANIMATION_VARIANTS,
  CELEBRATION_CONFIGS,
  DEVICE_CAPABILITIES
};