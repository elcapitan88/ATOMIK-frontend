/**
 * FeatureGate Component
 * 
 * Advanced feature gating component that integrates with the feature flag system.
 * Provides conditional rendering based on feature availability, user roles,
 * and beta testing access with comprehensive fallback options.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useFeatureFlags from '../../hooks/useFeatureFlags';
import useBetaAccess from '../../hooks/useBetaAccess';
import BetaBadge from './BetaBadge';
import ComingSoon from './ComingSoon';

const FeatureGate = ({
  feature,
  children,
  fallback = null,
  showComingSoon = false,
  showBetaBadge = true,
  requireBetaAccess = false,
  loadingComponent = null,
  errorComponent = null,
  onFeatureCheck = null,
  className = '',
  style = {},
  testMode = false,
  testValue = false
}) => {
  const { 
    isFeatureEnabled, 
    checkFeatureAccess, 
    loading: featureLoading, 
    error: featureError 
  } = useFeatureFlags();
  
  const { 
    isBetaTester, 
    loading: betaLoading 
  } = useBetaAccess();

  const [featureAccess, setFeatureAccess] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Check detailed feature access on mount
  useEffect(() => {
    const checkDetails = async () => {
      if (testMode) {
        setFeatureAccess({ enabled: testValue, reason: testValue ? null : 'Test mode disabled' });
        return;
      }

      if (!feature) return;

      setDetailsLoading(true);
      try {
        const accessDetails = await checkFeatureAccess(feature);
        setFeatureAccess(accessDetails);
        
        // Call optional callback with access details
        if (onFeatureCheck) {
          onFeatureCheck(accessDetails);
        }
      } catch (error) {
        console.error('Error checking feature access details:', error);
        setFeatureAccess({ enabled: false, reason: 'Error checking access' });
      } finally {
        setDetailsLoading(false);
      }
    };

    checkDetails();
  }, [feature, checkFeatureAccess, onFeatureCheck, testMode, testValue]);

  // Determine if we should show loading state
  const isLoading = featureLoading || betaLoading || detailsLoading;

  // Determine if there's an error
  const hasError = featureError;

  // Check basic feature availability
  const basicFeatureEnabled = testMode ? testValue : isFeatureEnabled(feature);

  // Check beta access requirement
  const hasBetaAccess = requireBetaAccess ? isBetaTester : true;

  // Final determination of feature availability
  const shouldShowFeature = basicFeatureEnabled && hasBetaAccess;

  // Show loading component if still loading
  if (isLoading) {
    if (loadingComponent) {
      return loadingComponent;
    }
    return (
      <div className={`feature-gate-loading ${className}`} style={style}>
        <div className="loading-spinner">Loading feature...</div>
      </div>
    );
  }

  // Show error component if there's an error
  if (hasError && errorComponent) {
    return errorComponent;
  }

  // Show feature if enabled
  if (shouldShowFeature) {
    return (
      <div className={`feature-gate-enabled ${className}`} style={style}>
        {showBetaBadge && isBetaTester && (
          <div className="feature-beta-indicator">
            <BetaBadge variant="pill" size="sm" />
          </div>
        )}
        {children}
      </div>
    );
  }

  // Show fallback content based on configuration
  if (fallback) {
    return (
      <div className={`feature-gate-fallback ${className}`} style={style}>
        {fallback}
      </div>
    );
  }

  if (showComingSoon) {
    return (
      <div className={`feature-gate-coming-soon ${className}`} style={style}>
        <ComingSoon 
          title="Feature Coming Soon"
          description={
            requireBetaAccess && !isBetaTester
              ? "This feature is currently available to beta testers only."
              : featureAccess?.reason || "This feature is not yet available."
          }
          showBetaRequest={requireBetaAccess && !isBetaTester}
        />
      </div>
    );
  }

  // Return null if no fallback specified
  return null;
};

FeatureGate.propTypes = {
  /**
   * The feature name to check
   */
  feature: PropTypes.string.isRequired,
  
  /**
   * Content to render when feature is enabled
   */
  children: PropTypes.node.isRequired,
  
  /**
   * Fallback content when feature is disabled
   */
  fallback: PropTypes.node,
  
  /**
   * Whether to show coming soon component as fallback
   */
  showComingSoon: PropTypes.bool,
  
  /**
   * Whether to show beta badge when feature is enabled
   */
  showBetaBadge: PropTypes.bool,
  
  /**
   * Whether to require beta tester access
   */
  requireBetaAccess: PropTypes.bool,
  
  /**
   * Custom loading component
   */
  loadingComponent: PropTypes.node,
  
  /**
   * Custom error component
   */
  errorComponent: PropTypes.node,
  
  /**
   * Callback when feature access is checked
   */
  onFeatureCheck: PropTypes.func,
  
  /**
   * Additional CSS class
   */
  className: PropTypes.string,
  
  /**
   * Inline styles
   */
  style: PropTypes.object,
  
  /**
   * Test mode for development/testing
   */
  testMode: PropTypes.bool,
  
  /**
   * Test value when in test mode
   */
  testValue: PropTypes.bool,
};

// Higher-order component for feature gating
export const withFeatureGate = (feature, options = {}) => {
  return (WrappedComponent) => {
    const FeatureGatedComponent = (props) => {
      return (
        <FeatureGate feature={feature} {...options}>
          <WrappedComponent {...props} />
        </FeatureGate>
      );
    };

    FeatureGatedComponent.displayName = `withFeatureGate(${WrappedComponent.displayName || WrappedComponent.name})`;
    return FeatureGatedComponent;
  };
};

// Specific feature gate components for common features
export const AdvancedAnalyticsGate = ({ children, ...props }) => (
  <FeatureGate feature="advanced-analytics" requireBetaAccess {...props}>
    {children}
  </FeatureGate>
);

export const NewDashboardGate = ({ children, ...props }) => (
  <FeatureGate feature="new-dashboard" {...props}>
    {children}
  </FeatureGate>
);

export const ExperimentalTradingGate = ({ children, ...props }) => (
  <FeatureGate feature="experimental-trading" requireBetaAccess {...props}>
    {children}
  </FeatureGate>
);

export const AiInsightsGate = ({ children, ...props }) => (
  <FeatureGate feature="ai-insights" requireBetaAccess {...props}>
    {children}
  </FeatureGate>
);

export const SocialTradingGate = ({ children, ...props }) => (
  <FeatureGate feature="social-trading" requireBetaAccess showComingSoon {...props}>
    {children}
  </FeatureGate>
);

export const MobileAppPreviewGate = ({ children, ...props }) => (
  <FeatureGate feature="mobile-app-preview" showBetaBadge {...props}>
    {children}
  </FeatureGate>
);

// CSS styles for the component
const featureGateStyles = `
.feature-gate-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: #666;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-spinner::before {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #9932CC;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.feature-gate-enabled {
  position: relative;
}

.feature-beta-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 10;
}

.feature-gate-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-gate-coming-soon {
  display: flex;
  align-items: center;
  justify-content: center;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = featureGateStyles;
  document.head.appendChild(styleSheet);
}

export default FeatureGate;