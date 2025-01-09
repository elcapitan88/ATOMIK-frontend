// src/hooks/strategies/useStrategies.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { strategiesApi } from '@/services/api/strategies/strategiesApi';
import { useToast } from '@chakra-ui/react';

// Query key for strategies
export const STRATEGIES_KEYS = {
  all: ['strategies'],
  lists: () => [...STRATEGIES_KEYS.all, 'list'],
  details: (id) => [...STRATEGIES_KEYS.all, 'detail', id],
  stats: (id) => [...STRATEGIES_KEYS.all, 'stats', id]
};

export const useStrategies = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Query for fetching all strategies
  const {
    data: strategies = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: STRATEGIES_KEYS.lists(),
    queryFn: () => strategiesApi.listStrategies(),
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
    onError: (error) => {
      toast({
        title: "Error fetching strategies",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });

  // Mutation for creating strategy
  const createStrategyMutation = useMutation({
    mutationFn: (strategyData) => strategiesApi.activateStrategy(strategyData),
    onSuccess: () => {
      queryClient.invalidateQueries(STRATEGIES_KEYS.lists());
      toast({
        title: "Strategy Created",
        description: "Strategy has been successfully activated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating strategy",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });

  // Mutation for toggling strategy
  const toggleStrategyMutation = useMutation({
    mutationFn: (strategyId) => strategiesApi.toggleStrategy(strategyId),
    onSuccess: (data, strategyId) => {
      // Optimistic update
      queryClient.setQueryData(STRATEGIES_KEYS.lists(), (old) => {
        return old?.map(strategy => 
          strategy.id === strategyId 
            ? { ...strategy, is_active: !strategy.is_active }
            : strategy
        );
      });
      
      toast({
        title: "Strategy Updated",
        description: "Strategy status has been updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error, strategyId) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries(STRATEGIES_KEYS.lists());
      toast({
        title: "Error updating strategy",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });

  // Mutation for deleting strategy
  const deleteStrategyMutation = useMutation({
    mutationFn: (strategyId) => strategiesApi.deleteStrategy(strategyId),
    onSuccess: (_, strategyId) => {
      // Optimistic update
      queryClient.setQueryData(STRATEGIES_KEYS.lists(), (old) => {
        return old?.filter(strategy => strategy.id !== strategyId);
      });
      
      toast({
        title: "Strategy Deleted",
        description: "Strategy has been successfully removed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries(STRATEGIES_KEYS.lists());
      toast({
        title: "Error deleting strategy",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });

  return {
    // Queries
    strategies,
    isLoading,
    isError,
    error,
    refetch,

    // Create Strategy
    createStrategy: createStrategyMutation.mutate,
    isCreating: createStrategyMutation.isLoading,
    createStrategyError: createStrategyMutation.error,

    // Toggle Strategy
    toggleStrategy: toggleStrategyMutation.mutate,
    isToggling: toggleStrategyMutation.isLoading,
    toggleStrategyError: toggleStrategyMutation.error,

    // Delete Strategy
    deleteStrategy: deleteStrategyMutation.mutate,
    isDeleting: deleteStrategyMutation.isLoading,
    deleteStrategyError: deleteStrategyMutation.error
  };
};

// Optional: Hook for individual strategy details
export const useStrategy = (strategyId) => {
  const toast = useToast();

  return useQuery({
    queryKey: STRATEGIES_KEYS.details(strategyId),
    queryFn: () => strategiesApi.getStrategyStats(strategyId),
    enabled: !!strategyId,
    staleTime: 30000,
    onError: (error) => {
      toast({
        title: "Error fetching strategy details",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });
};