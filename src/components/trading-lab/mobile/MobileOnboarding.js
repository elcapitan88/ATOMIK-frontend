import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useTradingLab } from '../../../contexts/TradingLabContext';
import { devices, touchTargets } from '../../../styles/theme/breakpoints';
import { 
  PROGRESS_MESSAGES 
} from '../../../utils/constants/atomikTerminology';
import { TRADING_LAB_BACKGROUND, ATOMIC_COLORS, triggerHapticFeedback } from '../shared/TradingLabUtils';
import logger from '../../../utils/logger';

/**
 * MobileOnboarding - Mobile-optimized onboarding experience
 * 
 * Features:
 * - Touch-optimized button sizes (minimum 44px)
 * - Swipe gestures for navigation between steps
 * - Bottom sheet modals for additional information
 * - Pull-to-refresh and haptic feedback where supported
 * - Progressive disclosure optimized for mobile screens
 */

const MobileOnboarding = ({ children, currentStep, totalSteps, onNext, onPrevious, canGoNext, canGoBack }) => {
  const { isMobileView, touchOptimized, enableHapticFeedback } = useTradingLab();
  
  // Gesture handling
  const dragX = useMotionValue(0);
  const opacity = useTransform(dragX, [-200, 0, 200], [0.5, 1, 0.5]);
  const scale = useTransform(dragX, [-200, 0, 200], [0.95, 1, 0.95]);
  
  // State management
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [canPullRefresh, setCanPullRefresh] = useState(false);

  // Haptic feedback helper
  const triggerHaptic = useCallback((type = 'light') => {
    if (enableHapticFeedback && navigator.vibrate) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 50, 10],
        error: [50, 10, 50]
      };
      navigator.vibrate(patterns[type] || patterns.light);
    }
  }, [enableHapticFeedback]);

  // Swipe gesture handlers
  const handleDragEnd = useCallback((event, { offset, velocity }) => {
    const swipeThreshold = 100;
    const swipeVelocityThreshold = 500;
    
    const shouldSwipeLeft = offset.x > swipeThreshold || velocity.x > swipeVelocityThreshold;
    const shouldSwipeRight = offset.x < -swipeThreshold || velocity.x < -swipeVelocityThreshold;
    
    if (shouldSwipeLeft && canGoBack) {
      logger.info('[MobileOnboarding] Swipe left detected - going back');
      triggerHaptic('light');
      setSwipeDirection('left');
      setTimeout(() => {
        onPrevious();
        setSwipeDirection(null);
      }, 200);
    } else if (shouldSwipeRight && canGoNext) {
      logger.info('[MobileOnboarding] Swipe right detected - going next');
      triggerHaptic('light');
      setSwipeDirection('right');
      setTimeout(() => {
        onNext();
        setSwipeDirection(null);
      }, 200);
    } else {
      // Snap back
      dragX.set(0);
    }
  }, [canGoNext, canGoBack, onNext, onPrevious, triggerHaptic, dragX]);

  // Pull to refresh handler
  const handlePullRefresh = useCallback(async () => {
    if (!canPullRefresh) return;
    
    logger.info('[MobileOnboarding] Pull to refresh triggered');
    setIsRefreshing(true);
    triggerHaptic('medium');
    
    // Simulate refresh action
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsRefreshing(false);
    setCanPullRefresh(false);
  }, [canPullRefresh, triggerHaptic]);

  // Touch event handlers for pull-to-refresh
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    
    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e) => {
      currentY = e.touches[0].clientY;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Enable pull-to-refresh only at top of page
      if (scrollTop === 0 && currentY > startY + 50) {
        setCanPullRefresh(true);
      }
    };
    
    const handleTouchEnd = () => {
      if (canPullRefresh) {
        handlePullRefresh();
      }
    };
    
    if (isMobileView) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileView, canPullRefresh, handlePullRefresh]);

  // Mobile-specific keyboard handling
  useEffect(() => {
    const handleKeyboard = () => {
      if (window.visualViewport) {
        const viewport = window.visualViewport;
        const originalHeight = window.innerHeight;
        
        const handleViewportChange = () => {
          const heightDiff = originalHeight - viewport.height;
          const isKeyboardOpen = heightDiff > 150;
          
          document.documentElement.style.setProperty(
            '--keyboard-height',
            isKeyboardOpen ? `${heightDiff}px` : '0px'
          );
        };
        
        viewport.addEventListener('resize', handleViewportChange);
        return () => viewport.removeEventListener('resize', handleViewportChange);
      }
    };
    
    if (isMobileView) {
      return handleKeyboard();
    }
  }, [isMobileView]);

  return (
    <div style={styles.container} className="mobile-onboarding">
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {(canPullRefresh || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={styles.refreshIndicator}
          >
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : {}}
              transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              style={styles.refreshIcon}
            >
              ⚛️
            </motion.div>
            <span style={styles.refreshText}>
              {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          {Array.from({ length: totalSteps }, (_, index) => (
            <motion.div
              key={index}
              style={{
                ...styles.progressDot,
                ...(index <= currentStep - 1 ? styles.progressDotActive : {})
              }}
              initial={false}
              animate={{
                scale: index === currentStep - 1 ? 1.2 : 1,
                backgroundColor: index <= currentStep - 1 ? '#00C6E0' : 'rgba(255, 255, 255, 0.3)'
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
        <motion.div
          style={styles.progressLine}
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Main content with swipe gestures */}
      <motion.div
        style={{
          ...styles.content,
          opacity,
          scale
        }}
        drag="x"
        dragConstraints={{ left: -300, right: 300 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: 'grabbing' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: swipeDirection === 'left' ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: swipeDirection === 'right' ? -50 : 50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={styles.stepContent}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Mobile navigation */}
      <div style={styles.mobileNavigation}>
        {/* Swipe hints */}
        <div style={styles.swipeHints}>
          {canGoBack && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 0.6, x: 0 }}
              style={styles.swipeHintLeft}
            >
              ← Swipe to go back
            </motion.div>
          )}
          
          {canGoNext && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 0.6, x: 0 }}
              style={styles.swipeHintRight}
            >
              Swipe to continue →
            </motion.div>
          )}
        </div>

        {/* Touch-optimized buttons */}
        <div style={styles.buttonContainer}>
          {canGoBack && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic('light');
                onPrevious();
              }}
              style={{
                ...styles.navButton,
                ...styles.backButton,
                ...(touchOptimized ? styles.touchOptimizedButton : {})
              }}
              className="mobile-back-button"
            >
              <span style={styles.buttonIcon}>←</span>
              <span style={styles.buttonText}>Back</span>
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: canGoNext ? 0.95 : 1 }}
            onClick={() => {
              if (canGoNext) {
                triggerHaptic('medium');
                onNext();
              }
            }}
            disabled={!canGoNext}
            style={{
              ...styles.navButton,
              ...styles.nextButton,
              ...(touchOptimized ? styles.touchOptimizedButton : {}),
              ...(!canGoNext ? styles.buttonDisabled : {})
            }}
            className="mobile-next-button"
          >
            <span style={styles.buttonText}>
              {currentStep === totalSteps ? 'Complete' : 'Next'}
            </span>
            <span style={styles.buttonIcon}>→</span>
          </motion.button>
        </div>
      </div>

      {/* Bottom sheet for additional info */}
      <AnimatePresence>
        {showBottomSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={styles.bottomSheetOverlay}
              onClick={() => setShowBottomSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={styles.bottomSheet}
            >
              <div style={styles.bottomSheetHandle} />
              <div style={styles.bottomSheetContent}>
                <h3 style={styles.bottomSheetTitle}>Need Help?</h3>
                <p style={styles.bottomSheetText}>
                  This onboarding will guide you through setting up your automated trading network.
                  Each step is designed to be simple and quick.
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowBottomSheet(false)}
                  style={styles.bottomSheetButton}
                >
                  Got it!
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Help button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          triggerHaptic('light');
          setShowBottomSheet(true);
        }}
        style={styles.helpButton}
        className="mobile-help-button"
      >
        ?
      </motion.button>
    </div>
  );
};

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingTop: 'env(safe-area-inset-top)'
  },
  refreshIndicator: {
    position: 'fixed',
    top: 'calc(env(safe-area-inset-top) + 20px)',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(0, 0, 0, 0.9)',
    padding: '0.75rem 1.5rem',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)',
    zIndex: 1000
  },
  refreshIcon: {
    fontSize: '1.2rem'
  },
  refreshText: {
    fontSize: '0.9rem',
    color: '#00C6E0'
  },
  progressContainer: {
    position: 'relative',
    padding: '1rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  progressBar: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2
  },
  progressDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transition: 'all 0.3s ease'
  },
  progressDotActive: {
    backgroundColor: '#00C6E0',
    boxShadow: '0 0 12px rgba(0, 198, 224, 0.5)'
  },
  progressLine: {
    position: 'absolute',
    height: '2px',
    backgroundColor: '#00C6E0',
    left: '50%',
    top: '50%',
    transform: 'translateX(-50%) translateY(-50%)',
    zIndex: 1
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    position: 'relative'
  },
  stepContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  mobileNavigation: {
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0, 0, 0, 0.95)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '1rem',
    paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
  },
  swipeHints: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem'
  },
  swipeHintLeft: {
    fontSize: '0.8rem',
    color: '#666666',
    opacity: 0.6
  },
  swipeHintRight: {
    fontSize: '0.8rem',
    color: '#666666',
    opacity: 0.6
  },
  buttonContainer: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'space-between'
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minHeight: touchTargets.comfortable,
    minWidth: '100px'
  },
  touchOptimizedButton: {
    minHeight: touchTargets.spacious,
    padding: '1rem 2rem'
  },
  backButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  nextButton: {
    background: 'linear-gradient(135deg, #00C6E0 0%, #0099B3 100%)',
    color: '#000000',
    boxShadow: '0 4px 20px rgba(0, 198, 224, 0.3)',
    flex: 1
  },
  buttonDisabled: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#666666',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  buttonIcon: {
    fontSize: '1.1rem'
  },
  buttonText: {
    fontSize: '1rem',
    fontWeight: '600'
  },
  bottomSheetOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1998
  },
  bottomSheet: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    maxHeight: '70vh',
    zIndex: 1999,
    paddingBottom: 'env(safe-area-inset-bottom)'
  },
  bottomSheetHandle: {
    width: '40px',
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '2px',
    margin: '12px auto',
    flexShrink: 0
  },
  bottomSheetContent: {
    padding: '1rem 2rem 2rem',
    textAlign: 'center'
  },
  bottomSheetTitle: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '1rem'
  },
  bottomSheetText: {
    fontSize: '1rem',
    color: '#cccccc',
    lineHeight: 1.5,
    marginBottom: '1.5rem'
  },
  bottomSheetButton: {
    background: 'linear-gradient(135deg, #00C6E0 0%, #0099B3 100%)',
    color: '#000000',
    border: 'none',
    borderRadius: '12px',
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    minHeight: touchTargets.comfortable
  },
  helpButton: {
    position: 'fixed',
    top: 'calc(env(safe-area-inset-top) + 20px)',
    right: '20px',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(0, 198, 224, 0.2)',
    border: '1px solid rgba(0, 198, 224, 0.3)',
    color: '#00C6E0',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(10px)'
  }
};

export default MobileOnboarding;