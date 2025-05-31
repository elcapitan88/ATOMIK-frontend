/**
 * useFeatureFlags Hook
 * 
 * Provides comprehensive feature flag functionality for the frontend application.
 * Integrates with the backend feature flag service to enable dynamic feature control,
 * beta testing, and gradual rollouts.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { envConfig } from '../config/environment';

const useFeatureFlags = () => {
  const { user, isAuthenticated } = useAuth();
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);

  /**
   * Fetch user's available features from the backend
   */
  const fetchUserFeatures = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('[FeatureFlags] User not authenticated or missing, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[FeatureFlags] Fetching features for user:', user?.email || user?.id);
      console.log('[FeatureFlags] User app_role:', user?.app_role);

      const response = await fetch(`${envConfig.apiBaseUrl}/api/v1/beta/features/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[FeatureFlags] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FeatureFlags] API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[FeatureFlags] API response data:', data);
      console.log('[FeatureFlags] Features received:', data.features);
      console.log('[FeatureFlags] Strategy builder enabled:', data.features?.['strategy-builder']);
      
      setFeatures(data.features || {});
      setIsBetaTester(data.is_beta_tester || false);
      setFeatureCount(data.feature_count || 0);
    } catch (err) {
      console.error('[FeatureFlags] Error fetching user features:', err);
      setError(err.message);
      setFeatures({});
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Check if a specific feature is enabled for the user
   */
  const isFeatureEnabled = useCallback((featureName) => {
    const isEnabled = Boolean(features[featureName]);
    console.log(`[FeatureFlags] Checking feature '${featureName}': ${isEnabled}`, { features });
    return isEnabled;
  }, [features]);

  /**
   * Check feature access with detailed response
   */
  const checkFeatureAccess = useCallback(async (featureName) => {
    if (!isAuthenticated || !user) {
      return { enabled: false, reason: 'User not authenticated' };
    }

    try {
      const response = await fetch(`${envConfig.apiBaseUrl}/api/v1/beta/features/${featureName}/access`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error checking feature access:', err);
      return { enabled: false, reason: 'Error checking access' };
    }
  }, [isAuthenticated, user]);

  /**
   * Get features by category
   */
  const getFeaturesByCategory = useCallback(async (category) => {
    if (!isAuthenticated || !user) {
      return { features: {}, available_count: 0 };
    }

    try {
      const response = await fetch(`${envConfig.apiBaseUrl}/api/v1/beta/features/categories/${category}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching category features:', err);
      return { features: {}, available_count: 0 };
    }
  }, [isAuthenticated, user]);

  /**
   * Get enabled features for specific categories
   */
  const getEnabledFeaturesByCategory = useCallback((category) => {
    const categoryFeatures = [];
    const featureCategories = {
      'UI Enhancements': ['new-dashboard', 'advanced-charts'],
      'Advanced Analytics': ['advanced-analytics', 'ai-insights'],
      'Trading Features': ['experimental-trading', 'strategy-builder'],
      'App Features': ['ai-insights', 'mobile-app-preview', 'social-trading'],
      'Integrations': ['broker-integration-v2'],
      'Communication': ['member-chat']
    };

    const categoryFeatureNames = featureCategories[category] || [];
    
    categoryFeatureNames.forEach(featureName => {
      if (isFeatureEnabled(featureName)) {
        categoryFeatures.push(featureName);
      }
    });

    return categoryFeatures;
  }, [isFeatureEnabled]);

  /**
   * Get all enabled features grouped by category
   */
  const getEnabledFeaturesByCategories = useCallback(() => {
    const categories = {
      'UI Enhancements': [],
      'Advanced Analytics': [],
      'Trading Features': [],
      'App Features': [],
      'Integrations': [],
      'Communication': []
    };

    Object.keys(categories).forEach(category => {
      categories[category] = getEnabledFeaturesByCategory(category);
    });

    return categories;
  }, [getEnabledFeaturesByCategory]);

  /**
   * Refresh feature flags from server
   */
  const refreshFeatures = useCallback(() => {
    return fetchUserFeatures();
  }, [fetchUserFeatures]);

  /**
   * Check if user has access to any beta features
   */
  const hasBetaFeatures = useCallback(() => {
    return featureCount > 0;
  }, [featureCount]);

  /**
   * Get feature flag for specific feature with fallback
   */
  const getFeatureFlag = useCallback((featureName, defaultValue = false) => {
    return features.hasOwnProperty(featureName) ? features[featureName] : defaultValue;
  }, [features]);

  /**
   * Create feature gate component wrapper
   */
  const createFeatureGate = useCallback((featureName, fallbackComponent = null) => {
    return ({ children }) => {
      if (isFeatureEnabled(featureName)) {
        return children;
      }
      return fallbackComponent;
    };
  }, [isFeatureEnabled]);

  // Load features on mount and when user changes
  useEffect(() => {
    fetchUserFeatures();
  }, [fetchUserFeatures]);

  // Auto-refresh features every 5 minutes when user is active
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchUserFeatures();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUserFeatures]);

  // Return all feature flag utilities
  return {
    // State
    features,
    loading,
    error,
    isBetaTester,
    featureCount,
    
    // Feature checking functions
    isFeatureEnabled,
    checkFeatureAccess,
    getFeatureFlag,
    hasBetaFeatures,
    
    // Category functions
    getFeaturesByCategory,
    getEnabledFeaturesByCategory,
    getEnabledFeaturesByCategories,
    
    // Utility functions
    refreshFeatures,
    createFeatureGate,
    
    // Convenience flags for specific features
    hasAdvancedAnalytics: isFeatureEnabled('advanced-analytics'),
    hasNewDashboard: isFeatureEnabled('new-dashboard'),
    hasExperimentalTrading: isFeatureEnabled('experimental-trading'),
    hasAiInsights: isFeatureEnabled('ai-insights'),
    hasAdvancedCharts: isFeatureEnabled('advanced-charts'),
    hasBrokerIntegrationV2: isFeatureEnabled('broker-integration-v2'),
    hasSocialTrading: isFeatureEnabled('social-trading'),
    hasMobileAppPreview: isFeatureEnabled('mobile-app-preview'),
    hasMemberChat: isFeatureEnabled('member-chat'),
    hasStrategyBuilder: (() => {
      const enabled = isFeatureEnabled('strategy-builder');
      console.log('[FeatureFlags] hasStrategyBuilder result:', enabled);
      return enabled;
    })(),
  };
};

export default useFeatureFlags;