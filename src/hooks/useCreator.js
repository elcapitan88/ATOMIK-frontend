// src/hooks/useCreator.js
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorApi } from '@/services/api/creators/creatorApi';
import { marketplaceApi } from '@/services/api/marketplace/marketplaceApi';
import { useToast } from '@chakra-ui/react';

// Query keys for cache management
const QUERY_KEYS = {
  profile: 'creator-profile',
  analytics: 'creator-analytics',
  earnings: 'creator-earnings',
  tierProgress: 'creator-tier-progress',
  dashboard: 'creator-dashboard',
  isCreator: 'is-creator'
};

export const useCreator = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Check if user is a creator
  const useIsCreator = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.isCreator],
      queryFn: () => creatorApi.isCreator(),
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false // Don't retry 404s
    });
  };

  // Get creator profile
  const useCreatorProfile = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.profile],
      queryFn: () => creatorApi.getCreatorProfile(),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Get creator dashboard data
  const useCreatorDashboard = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.dashboard],
      queryFn: () => creatorApi.getCreatorDashboardData(),
      staleTime: 1 * 60 * 1000, // 1 minute
    });
  };

  // Get creator analytics
  const useCreatorAnalytics = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.analytics],
      queryFn: () => creatorApi.getCreatorAnalytics(),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Get tier progress
  const useTierProgress = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.tierProgress],
      queryFn: () => creatorApi.getTierProgress(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Become creator mutation
  const useBecomeCreator = () => {
    return useMutation({
      mutationFn: (profileData) => creatorApi.becomeCreator(profileData),
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries([QUERY_KEYS.isCreator]);
        queryClient.invalidateQueries([QUERY_KEYS.profile]);
        
        toast({
          title: "🎉 Welcome to Creator Hub!",
          description: "You're now a strategy creator. Let's set up your earnings!",
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      },
      onError: (error) => {
        toast({
          title: "Creator setup failed",
          description: error.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    });
  };

  // Update profile mutation
  const useUpdateProfile = () => {
    return useMutation({
      mutationFn: (profileData) => creatorApi.updateCreatorProfile(profileData),
      onSuccess: () => {
        queryClient.invalidateQueries([QUERY_KEYS.profile]);
        queryClient.invalidateQueries([QUERY_KEYS.dashboard]);
        
        toast({
          title: "Profile updated",
          description: "Your creator profile has been updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error) => {
        toast({
          title: "Update failed",
          description: error.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    });
  };

  // Quick creator setup mutation
  const useQuickCreatorSetup = () => {
    return useMutation({
      mutationFn: (basicInfo) => creatorApi.quickSetupCreator(basicInfo),
      onSuccess: (data) => {
        queryClient.invalidateQueries([QUERY_KEYS.isCreator]);
        queryClient.invalidateQueries([QUERY_KEYS.profile]);
        
        // Redirect to Stripe onboarding
        if (data.stripeOnboardingUrl) {
          window.location.href = data.stripeOnboardingUrl;
        }
      },
      onError: (error) => {
        toast({
          title: "Creator setup failed",
          description: error.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    });
  };

  return {
    // Hooks
    useIsCreator,
    useCreatorProfile,
    useCreatorDashboard,
    useCreatorAnalytics,
    useTierProgress,
    
    // Mutations
    useBecomeCreator,
    useUpdateProfile,
    useQuickCreatorSetup,
    
    // Utils
    queryKeys: QUERY_KEYS
  };
};

// Hook for strategy pricing management
export const useStrategyPricing = (strategyToken) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Create pricing mutation
  const useCreatePricing = () => {
    return useMutation({
      mutationFn: (pricingData) => marketplaceApi.createStrategyPricing({
        webhook_id: strategyToken, // Assuming token maps to webhook_id
        ...pricingData
      }),
      onSuccess: () => {
        queryClient.invalidateQueries(['strategy-pricing', strategyToken]);
        
        toast({
          title: "✨ Pricing saved!",
          description: "Your strategy pricing has been configured successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error) => {
        toast({
          title: "Pricing setup failed",
          description: error.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    });
  };

  // Update pricing mutation
  const useUpdatePricing = () => {
    return useMutation({
      mutationFn: ({ pricingId, pricingData }) => 
        marketplaceApi.updateStrategyPricing(pricingId, pricingData),
      onSuccess: () => {
        queryClient.invalidateQueries(['strategy-pricing', strategyToken]);
        
        toast({
          title: "Pricing updated",
          description: "Your strategy pricing has been updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error) => {
        toast({
          title: "Update failed",
          description: error.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    });
  };

  return {
    useCreatePricing,
    useUpdatePricing
  };
};

// Hook for revenue calculations and projections
export const useRevenueCalculator = () => {
  const [projectionParams, setProjectionParams] = useState({
    monthlyPrice: 0,
    subscriberCount: 100,
    tier: 'silver' // bronze, silver, gold
  });

  const calculateProjection = useCallback((params = projectionParams) => {
    return creatorApi.calculateRevenueProjection(
      params.monthlyPrice, 
      params.subscriberCount
    );
  }, [projectionParams]);

  const updateProjection = useCallback((newParams) => {
    setProjectionParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const formatCurrency = useCallback((amount) => {
    return creatorApi.formatCurrency(amount);
  }, []);

  const projection = calculateProjection();

  return {
    projection,
    projectionParams,
    updateProjection,
    calculateProjection,
    formatCurrency
  };
};


export default useCreator;