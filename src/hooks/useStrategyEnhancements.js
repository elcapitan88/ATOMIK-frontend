// frontend/src/hooks/useStrategyEnhancements.js
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Feature flag hook for Strategy Enhancement features
 * Controls rollout of new strategy monetization features
 */
export const useStrategyEnhancements = () => {
  const { user } = useAuth();
  const [features, setFeatures] = useState({
    enhancedUI: false,
    intentDiscovery: false,
    monetization: false,
    glassMorphism: false,
    loading: true
  });

  useEffect(() => {
    const checkFeatureFlags = async () => {
      try {
        // Check if user is eligible for enhanced features
        const isEligible = checkUserEligibility(user);
        
        // Get feature flags from environment or API
        const flags = await getFeatureFlags(user?.id);
        
        setFeatures({
          enhancedUI: isEligible && flags.enhancedUI,
          intentDiscovery: isEligible && flags.intentDiscovery,
          monetization: isEligible && flags.monetization,
          glassMorphism: isEligible && flags.glassMorphism,
          loading: false
        });
      } catch (error) {
        console.error('Error loading feature flags:', error);
        // Default to disabled state on error
        setFeatures({
          enhancedUI: false,
          intentDiscovery: false,
          monetization: false,
          glassMorphism: false,
          loading: false
        });
      }
    };

    if (user) {
      checkFeatureFlags();
    } else {
      setFeatures(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  return features;
};

/**
 * Check if user is eligible for enhanced features
 * Simple eligibility: admins and beta testers only
 */
const checkUserEligibility = (user) => {
  if (!user) return false;
  
  // Enable for admins and beta testers only
  return user.app_role === 'admin' || user.app_role === 'beta_tester';
};

/**
 * Get feature flags from API or environment
 */
const getFeatureFlags = async (userId) => {
  // First check environment variables for quick overrides
  const envFlags = {
    enhancedUI: process.env.REACT_APP_ENHANCED_UI_ENABLED === 'true',
    intentDiscovery: process.env.REACT_APP_INTENT_DISCOVERY_ENABLED === 'true',
    monetization: process.env.REACT_APP_MONETIZATION_ENABLED === 'true',
    glassMorphism: process.env.REACT_APP_GLASS_MORPHISM_ENABLED === 'true'
  };
  
  // If any env flags are set, use them
  if (Object.values(envFlags).some(flag => flag)) {
    return envFlags;
  }
  
  try {
    // Try to fetch from API
    const response = await fetch(`/api/v1/users/${userId}/feature-flags`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    
    if (response.ok) {
      const apiFlags = await response.json();
      return {
        enhancedUI: apiFlags.strategy_enhanced_ui || false,
        intentDiscovery: apiFlags.strategy_intent_discovery || false,
        monetization: apiFlags.strategy_monetization || false,
        glassMorphism: apiFlags.strategy_glass_morphism || false
      };
    }
  } catch (error) {
    console.warn('Could not fetch feature flags from API:', error);
  }
  
  // Default to enabled for eligible users (admins and beta testers)
  return {
    enhancedUI: true,     
    intentDiscovery: true, 
    monetization: true,   // Enable monetization for admins/beta testers
    glassMorphism: true   
  };
};

/**
 * Simple hash function for consistent user assignment
 */
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Hook for checking specific feature availability
 */
export const useFeature = (featureName) => {
  const features = useStrategyEnhancements();
  return {
    enabled: features[featureName] || false,
    loading: features.loading
  };
};

/**
 * Hook for UI component selection based on feature flags
 */
export const useStrategyModal = () => {
  const { enhancedUI, loading } = useStrategyEnhancements();
  
  return {
    ModalComponent: enhancedUI ? 'EnhancedStrategyModal' : 'WebhookModal',
    useEnhanced: enhancedUI,
    loading
  };
};

/**
 * Hook for text and terminology based on feature flags
 */
export const useStrategyTerminology = () => {
  const { enhancedUI } = useStrategyEnhancements();
  
  return {
    // Primary terms
    itemName: enhancedUI ? 'Strategy' : 'Webhook',
    itemNamePlural: enhancedUI ? 'Strategies' : 'Webhooks',
    createAction: enhancedUI ? 'Create Strategy' : 'Generate Webhook',
    
    // Table headers
    tableHeaders: {
      name: enhancedUI ? 'Strategy Name' : 'Webhook Name',
      status: enhancedUI ? 'Status' : 'Active',
      type: enhancedUI ? 'Strategy Type' : 'Source Type'
    },
    
    // Menu items
    menuItems: {
      myItems: enhancedUI ? 'My Strategies' : 'My Webhooks',
      marketplace: enhancedUI ? 'Strategy Marketplace' : 'Webhook Marketplace'
    }
  };
};

export default useStrategyEnhancements;