// src/contexts/SubscriptionContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import axiosInstance from '@/services/axiosConfig';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/utils/logger';

// Create context
const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  // State management
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [resourceUsage, setResourceUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Hooks
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  
  // Fetch subscription data
  const fetchSubscriptionStatus = useCallback(async (showToast = false) => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axiosInstance.get('/api/v1/subscriptions/status');
      
      if (response.data) {
        setSubscriptionData(response.data.subscription);
        setResourceUsage(response.data.resources);
        setLastUpdated(new Date());
        
        logger.info('Subscription data fetched successfully', response.data);
        
        if (showToast) {
          toast({
            title: "Subscription updated",
            description: "Your subscription information has been refreshed",
            status: "success",
            duration: 3000,
          });
        }
      }
    } catch (error) {
      logger.error('Error fetching subscription data:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to fetch subscription data');
      
      if (showToast) {
        toast({
          title: "Error updating subscription",
          description: error.response?.data?.detail || error.message || 'Failed to update subscription information',
          status: "error",
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);
  
  // Initialize on auth state change
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptionStatus();
    } else {
      // Reset state when logged out
      setSubscriptionData(null);
      setResourceUsage(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchSubscriptionStatus]);
  
  // Apply promo code
  const applyPromoCode = async (code) => {
    try {
      setIsLoading(true);
      
      const response = await axiosInstance.post('/api/v1/auth/apply-promo-code', {
        promoCode: code
      });
      
      if (response.data?.success) {
        // Update subscription data after successful promo code application
        await fetchSubscriptionStatus();
        
        toast({
          title: "Promo code applied!",
          description: response.data.message || "Your subscription has been upgraded successfully",
          status: "success",
          duration: 5000,
        });
        
        return { success: true, message: response.data.message };
      }
      
      return { success: false, message: "Failed to apply promo code" };
      
    } catch (error) {
      logger.error('Error applying promo code:', error);
      
      toast({
        title: "Failed to apply promo code",
        description: error.response?.data?.detail || error.message || "Please check your code and try again",
        status: "error",
        duration: 5000,
      });
      
      return {
        success: false,
        message: error.response?.data?.detail || error.message || "Failed to apply promo code"
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create checkout session for upgrading
  const createCheckoutSession = async (plan, interval) => {
    try {
      setIsLoading(true);
      
      const response = await axiosInstance.post('/api/v1/subscriptions/create-checkout', {
        plan,
        interval
      });
      
      if (response.data?.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
        return { success: true };
      }
      
      throw new Error("No checkout URL returned");
      
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      
      toast({
        title: "Checkout Error",
        description: error.response?.data?.detail || error.message || "Failed to start checkout process",
        status: "error",
        duration: 5000,
      });
      
      return {
        success: false,
        message: error.response?.data?.detail || error.message || "Failed to create checkout session"
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create customer portal session for managing subscription
  const createPortalSession = async () => {
    try {
      setIsLoading(true);
      
      const response = await axiosInstance.post('/api/v1/subscriptions/create-portal-session');
      
      if (response.data?.url) {
        // Redirect to Stripe portal
        window.location.href = response.data.url;
        return { success: true };
      }
      
      throw new Error("No portal URL returned");
      
    } catch (error) {
      logger.error('Error creating portal session:', error);
      
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to access subscription management portal",
        status: "error",
        duration: 5000,
      });
      
      return {
        success: false,
        message: error.response?.data?.detail || error.message || "Failed to create portal session"
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper methods to check resource limits
  const canAddResource = (resourceType) => {
    if (!subscriptionData || !resourceUsage) return false;
    
    const tierLimits = subscriptionData.limits || {};
    const limits = tierLimits[resourceType] || {};
    
    return limits.available;
  };
  
  // Check if feature is available for current tier
  const isFeatureAvailable = (featureName) => {
    if (!subscriptionData) return false;
    
    // Check if feature is explicitly in limits
    if (subscriptionData.limits && featureName in subscriptionData.limits) {
      return subscriptionData.limits[featureName];
    }
    
    // Hardcoded feature availability by tier for fallback
    const tierFeatureMap = {
      starter: ['basic_webhooks', 'manual_trading'],
      pro: ['basic_webhooks', 'manual_trading', 'group_strategies_allowed', 'can_share_webhooks'],
      elite: ['basic_webhooks', 'manual_trading', 'group_strategies_allowed', 'can_share_webhooks', 'unlimited_accounts']
    };
    
    const tier = subscriptionData.tier?.toLowerCase() || 'starter';
    return tierFeatureMap[tier]?.includes(featureName) || false;
  };
  
  // Get appropriate upgrade tier based on current tier
  const getNextTier = () => {
    if (!subscriptionData) return 'pro';
    
    const tierHierarchy = ['starter', 'pro', 'elite'];
    const currentTierIndex = tierHierarchy.indexOf(subscriptionData.tier?.toLowerCase() || 'starter');
    
    if (currentTierIndex === -1 || currentTierIndex >= tierHierarchy.length - 1) {
      return null; // Already at highest tier or unknown tier
    }
    
    return tierHierarchy[currentTierIndex + 1];
  };
  
  // Context value
  const value = {
    isLoading,
    error,
    subscriptionData,
    resourceUsage,
    lastUpdated,
    currentTier: subscriptionData?.tier || 'starter',
    isLifetime: subscriptionData?.is_lifetime || false,
    status: subscriptionData?.status || 'inactive',
    // Methods
    refreshSubscription: (showToast) => fetchSubscriptionStatus(showToast),
    applyPromoCode,
    createCheckoutSession,
    createPortalSession,
    canAddResource,
    isFeatureAvailable,
    getNextTier
  };
  
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Custom hook to use the context
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export default SubscriptionContext;