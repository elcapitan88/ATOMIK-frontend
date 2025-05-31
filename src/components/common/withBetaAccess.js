// frontend/src/components/common/withBetaAccess.js
import React from 'react';
import BetaFeature from './BetaFeature';

/**
 * Higher Order Component that wraps a component with beta access checking
 * 
 * @param {string} featureName - The name of the beta feature
 * @param {Object} options - Configuration options
 * @param {React.ReactNode} options.fallback - Custom fallback component
 * @param {boolean} options.showComingSoon - Whether to show ComingSoon component
 * @param {boolean} options.showRequestAccess - Whether to show request access option
 * @param {string} options.title - Title for the access denied message
 * @param {string} options.description - Description for the access denied message
 * @param {boolean} options.requireExactFeature - If true, requires exact feature access
 * @returns {Function} - HOC function
 * 
 * @example
 * // Basic usage
 * const AdvancedAnalytics = () => <div>Advanced analytics content</div>;
 * export default withBetaAccess('advanced-analytics')(AdvancedAnalytics);
 * 
 * @example
 * // With options
 * const NewDashboard = () => <div>New dashboard content</div>;
 * export default withBetaAccess('new-dashboard', {
 *   title: "Enhanced Dashboard",
 *   description: "Experience our redesigned dashboard with improved performance and new widgets.",
 *   showComingSoon: true
 * })(NewDashboard);
 * 
 * @example
 * // Any beta access (not feature-specific)
 * const BetaSection = () => <div>General beta content</div>;
 * export default withBetaAccess('general-beta', {
 *   requireExactFeature: false
 * })(BetaSection);
 */
const withBetaAccess = (featureName, options = {}) => {
  return (WrappedComponent) => {
    const BetaAccessWrapper = (props) => {
      return (
        <BetaFeature
          featureName={featureName}
          {...options}
        >
          <WrappedComponent {...props} />
        </BetaFeature>
      );
    };

    // Set display name for debugging
    BetaAccessWrapper.displayName = `withBetaAccess(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    
    // Copy over any static properties
    BetaAccessWrapper.WrappedComponent = WrappedComponent;

    return BetaAccessWrapper;
  };
};

export default withBetaAccess;