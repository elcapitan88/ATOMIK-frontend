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

  // Mutation for creating strategy (unified for both webhook and engine)
  const createStrategyMutation = useMutation({
    mutationFn: (strategyData) => {
      // Route to appropriate API based on strategy data
      if (strategyData.webhook_id) {
        return strategiesApi.activateStrategy(strategyData);
      } else if (strategyData.strategy_code_id) {
        return strategiesApi.configureEngineStrategy(strategyData);
      } else {
        throw new Error('Invalid strategy data: missing webhook_id or strategy_code_id');
      }
    },
    onMutate: async (newStrategy) => {
      await queryClient.cancelQueries(STRATEGIES_KEYS.lists());
      const previousStrategies = queryClient.getQueryData(STRATEGIES_KEYS.lists());
      return { previousStrategies };
    },
    onSuccess: (response, variables) => {
      // Immediately update the cache with the new strategy
      queryClient.setQueryData(STRATEGIES_KEYS.lists(), (old = []) => {
        return [...old, response];
      });
  
      toast({
        title: "Strategy Created",
        description: "Strategy has been successfully activated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error, variables, context) => {
      // Rollback to previous state if there was an error
      if (context?.previousStrategies) {
        queryClient.setQueryData(STRATEGIES_KEYS.lists(), context.previousStrategies);
      }
      
      toast({
        title: "Error creating strategy",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries(STRATEGIES_KEYS.lists());
    }
  });

  // Mutation for updating strategy (unified for both webhook and engine)
  const updateStrategyMutation = useMutation({
    mutationFn: ({ strategyId, updateData, strategyType = 'webhook' }) => {
      // Route to appropriate update API based on strategy type
      if (strategyType === 'engine') {
        return strategiesApi.updateEngineStrategy(strategyId, updateData);
      } else {
        return strategiesApi.updateStrategy(strategyId, updateData);
      }
    },
    onMutate: async ({ strategyId, updateData }) => {
      await queryClient.cancelQueries(STRATEGIES_KEYS.lists());
      const previousStrategies = queryClient.getQueryData(STRATEGIES_KEYS.lists());
      
      // Optimistically update the strategy in the cache
      queryClient.setQueryData(STRATEGIES_KEYS.lists(), (old = []) => {
        return old.map(strategy => 
          strategy.id === strategyId 
            ? { ...strategy, ...updateData }
            : strategy
        );
      });
      
      return { previousStrategies };
    },
    onSuccess: (response, { strategyId }) => {
      // Update the cache with the response from the server
      queryClient.setQueryData(STRATEGIES_KEYS.lists(), (old = []) => {
        return old.map(strategy => 
          strategy.id === strategyId ? response : strategy
        );
      });

      toast({
        title: "Strategy Updated",
        description: "Strategy has been successfully updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error, variables, context) => {
      // Rollback to previous state if there was an error
      if (context?.previousStrategies) {
        queryClient.setQueryData(STRATEGIES_KEYS.lists(), context.previousStrategies);
      }
      
      toast({
        title: "Error updating strategy",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries(STRATEGIES_KEYS.lists());
    }
  });

  // Mutation for toggling strategy
  const toggleStrategyMutation = useMutation({
    mutationFn: (strategyId) => strategiesApi.toggleStrategy(strategyId),
    onMutate: async (strategyId) => {
      // Cancel any outgoing refetches 
      await queryClient.cancelQueries(STRATEGIES_KEYS.lists());
  
      // Snapshot the previous value
      const previousStrategies = queryClient.getQueryData(STRATEGIES_KEYS.lists());
  
      // Optimistically update the cache
      queryClient.setQueryData(STRATEGIES_KEYS.lists(), (old) => {
        return old?.map(strategy => 
          strategy.id === strategyId 
            ? { ...strategy, is_active: !strategy.is_active }
            : strategy
        ) ?? [];
      });
  
      return { previousStrategies };
    },
    onError: (err, strategyId, context) => {
      // Rollback on error
      queryClient.setQueryData(STRATEGIES_KEYS.lists(), context.previousStrategies);
      
      toast({
        title: "Error updating strategy",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we're in sync
      queryClient.invalidateQueries(STRATEGIES_KEYS.lists());
    }
  });

  // Mutation for deleting strategy (unified for both webhook and engine)
  const deleteStrategyMutation = useMutation({
    mutationFn: (param) => {
      // Support both old single parameter and new object parameter
      const { strategyId, strategyType } = typeof param === 'object' ? param : { strategyId: param, strategyType: 'webhook' };
      
      // Route to appropriate delete API based on strategy type
      if (strategyType === 'engine') {
        return strategiesApi.deleteEngineStrategy(strategyId);
      } else {
        return strategiesApi.deleteStrategy(strategyId);
      }
    },
    onSuccess: (_, param) => {
      // Handle both old single parameter and new object parameter
      const strategyId = typeof param === 'object' ? param.strategyId : param;
      
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

    // Update Strategy
    updateStrategy: updateStrategyMutation.mutate,
    isUpdating: updateStrategyMutation.isLoading,
    updateStrategyError: updateStrategyMutation.error,

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