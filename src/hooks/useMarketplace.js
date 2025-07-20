// src/hooks/useMarketplace.js
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceApi } from '@/services/api/marketplace/marketplaceApi';
import { useToast } from '@chakra-ui/react';

// Query keys for cache management
const QUERY_KEYS = {
  strategies: 'marketplace-strategies',
  pricing: (token) => ['strategy-pricing', token],
  userPurchases: 'user-purchases',
  strategyAccess: (token) => ['strategy-access', token]
};

export const useMarketplace = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Get marketplace strategies with filters
  const useMarketplaceStrategies = (filters = {}) => {
    return useQuery({
      queryKey: [QUERY_KEYS.strategies, filters],
      queryFn: () => marketplaceApi.getMarketplaceStrategies(filters),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Get strategy pricing
  const useStrategyPricing = (strategyToken) => {
    return useQuery({
      queryKey: QUERY_KEYS.pricing(strategyToken),
      queryFn: () => marketplaceApi.getStrategyPricing(strategyToken),
      enabled: !!strategyToken,
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Get user's purchases
  const useUserPurchases = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.userPurchases],
      queryFn: () => marketplaceApi.getUserPurchases(),
      staleTime: 1 * 60 * 1000, // 1 minute
    });
  };

  // Check strategy access
  const useStrategyAccess = (strategyToken) => {
    return useQuery({
      queryKey: QUERY_KEYS.strategyAccess(strategyToken),
      queryFn: () => marketplaceApi.checkStrategyAccess(strategyToken),
      enabled: !!strategyToken,
      staleTime: 30 * 1000, // 30 seconds
    });
  };

  // Quick purchase mutation
  const useQuickPurchase = () => {
    return useMutation({
      mutationFn: ({ strategy, options }) => marketplaceApi.quickPurchase(strategy, options),
      onSuccess: (data, { strategy }) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries([QUERY_KEYS.userPurchases]);
        queryClient.invalidateQueries(QUERY_KEYS.strategyAccess(strategy.token));
        
        toast({
          title: "🎉 Success!",
          description: strategy.pricing?.isTrialEnabled 
            ? "Your free trial has started!" 
            : "You now have access to this strategy!",
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      },
      onError: (error) => {
        toast({
          title: "Purchase failed",
          description: error.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    });
  };

  // Cancel subscription mutation
  const useCancelSubscription = () => {
    return useMutation({
      mutationFn: (purchaseId) => marketplaceApi.cancelSubscription(purchaseId),
      onSuccess: () => {
        queryClient.invalidateQueries([QUERY_KEYS.userPurchases]);
        toast({
          title: "Subscription cancelled",
          description: "Your subscription has been successfully cancelled",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error) => {
        toast({
          title: "Cancellation failed",
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
    useMarketplaceStrategies,
    useStrategyPricing,
    useUserPurchases,
    useStrategyAccess,
    
    // Mutations
    useQuickPurchase,
    useCancelSubscription,
    
    // Utils
    queryKeys: QUERY_KEYS
  };
};

// Standalone hook for strategy purchase flow
export const usePurchaseFlow = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const { useQuickPurchase } = useMarketplace();
  const purchaseMutation = useQuickPurchase();

  const startPurchase = useCallback((strategy) => {
    setSelectedStrategy(strategy);
    setIsModalOpen(true);
  }, []);

  const closePurchase = useCallback(() => {
    setIsModalOpen(false);
    setSelectedStrategy(null);
  }, []);

  const executePurchase = useCallback(async (options = {}) => {
    if (!selectedStrategy) return;
    
    try {
      await purchaseMutation.mutateAsync({
        strategy: selectedStrategy,
        options
      });
      closePurchase();
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Purchase failed:', error);
    }
  }, [selectedStrategy, purchaseMutation, closePurchase]);

  return {
    isModalOpen,
    selectedStrategy,
    isProcessing: purchaseMutation.isPending,
    startPurchase,
    closePurchase,
    executePurchase
  };
};

// Hook for marketplace filters
export const useMarketplaceFilters = () => {
  const [filters, setFilters] = useState({
    category: '',
    pricingType: '', // 'free', 'subscription', 'one_time'
    minPrice: '',
    maxPrice: '',
    hasFreeTrial: false,
    creatorTier: '' // 'bronze', 'silver', 'gold'
  });

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      category: '',
      pricingType: '',
      minPrice: '',
      maxPrice: '',
      hasFreeTrial: false,
      creatorTier: ''
    });
  }, []);

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== false
  );

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters
  };
};

export default useMarketplace;