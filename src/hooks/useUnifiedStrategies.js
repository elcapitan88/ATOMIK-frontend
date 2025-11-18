// src/hooks/useUnifiedStrategies.js
/**
 * Unified Strategies Hook
 *
 * This hook uses the unified strategy API to manage all strategies (webhook and engine)
 * through a single interface. It replaces the legacy useStrategies hook.
 *
 * Key changes from legacy:
 * - Single createStrategy mutation for both webhook and engine strategies
 * - execution_type field determines the strategy type
 * - No need to route to different APIs based on strategy type
 * - Cleaner, more consistent interface
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import unifiedStrategiesApi from '@/services/api/strategies/unifiedStrategiesApi';
import { useToast } from '@chakra-ui/react';

// Query key for unified strategies
export const UNIFIED_STRATEGIES_KEYS = {
  all: ['unified-strategies'],
  lists: (filters = {}) => [...UNIFIED_STRATEGIES_KEYS.all, 'list', filters],
  details: (id) => [...UNIFIED_STRATEGIES_KEYS.all, 'detail', id],
  stats: (id) => [...UNIFIED_STRATEGIES_KEYS.all, 'stats', id]
};

export const useUnifiedStrategies = (filters = {}) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Query for fetching strategies with optional filters
  const {
    data: strategies = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: UNIFIED_STRATEGIES_KEYS.lists(filters),
    queryFn: () => unifiedStrategiesApi.listStrategies(filters),
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
    onError: (error) => {
      console.error('Error fetching strategies:', error);
      // Only show toast for non-404 errors (404 might be expected during initial load)
      if (error.response?.status !== 404) {
        toast({
          title: "Error fetching strategies",
          description: error.message || "Unable to load strategies",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  });

  // Mutation for creating strategy (unified for both webhook and engine)
  const createStrategyMutation = useMutation({
    mutationFn: (strategyData) => {
      // Ensure execution_type is set based on strategy data
      const dataWithExecutionType = {
        ...strategyData,
        execution_type: strategyData.execution_type ||
          (strategyData.webhook_id ? 'webhook' :
           strategyData.strategy_code_id ? 'engine' :
           undefined)
      };

      if (!dataWithExecutionType.execution_type) {
        throw new Error('Unable to determine strategy execution type');
      }

      return unifiedStrategiesApi.createStrategy(dataWithExecutionType);
    },
    onMutate: async (newStrategy) => {
      await queryClient.cancelQueries(UNIFIED_STRATEGIES_KEYS.all);
      const previousStrategies = queryClient.getQueryData(UNIFIED_STRATEGIES_KEYS.lists(filters));
      return { previousStrategies };
    },
    onSuccess: async (response, variables) => {
      // Invalidate all strategy queries to ensure fresh data
      queryClient.invalidateQueries(UNIFIED_STRATEGIES_KEYS.all);

      // Force refresh to ensure strategies are loaded from server
      try {
        await unifiedStrategiesApi.forceRefreshStrategies();
      } catch (error) {
        console.error('[useUnifiedStrategies] Error force refreshing strategies:', error);
      }

      toast({
        title: "Strategy Created",
        description: `${response.ticker} strategy has been successfully activated`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error, variables, context) => {
      // Rollback to previous state if there was an error
      if (context?.previousStrategies) {
        queryClient.setQueryData(UNIFIED_STRATEGIES_KEYS.lists(filters), context.previousStrategies);
      }

      const errorMessage = error.response?.data?.detail || error.message || "Failed to create strategy";
      toast({
        title: "Error creating strategy",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });

  // Mutation for updating strategy
  const updateStrategyMutation = useMutation({
    mutationFn: ({ strategyId, updateData }) => {
      return unifiedStrategiesApi.updateStrategy(strategyId, updateData);
    },
    onMutate: async ({ strategyId, updateData }) => {
      await queryClient.cancelQueries(UNIFIED_STRATEGIES_KEYS.all);
      const previousStrategies = queryClient.getQueryData(UNIFIED_STRATEGIES_KEYS.lists(filters));

      // Optimistically update the strategy in the cache
      queryClient.setQueryData(UNIFIED_STRATEGIES_KEYS.lists(filters), (old = []) => {
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
      queryClient.setQueryData(UNIFIED_STRATEGIES_KEYS.lists(filters), (old = []) => {
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
        queryClient.setQueryData(UNIFIED_STRATEGIES_KEYS.lists(filters), context.previousStrategies);
      }

      const errorMessage = error.response?.data?.detail || error.message || "Failed to update strategy";
      toast({
        title: "Error updating strategy",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries(UNIFIED_STRATEGIES_KEYS.all);
    }
  });

  // Mutation for toggling strategy
  const toggleStrategyMutation = useMutation({
    mutationFn: (strategyId) => unifiedStrategiesApi.toggleStrategy(strategyId),
    onMutate: async (strategyId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(UNIFIED_STRATEGIES_KEYS.all);

      // Snapshot the previous value
      const previousStrategies = queryClient.getQueryData(UNIFIED_STRATEGIES_KEYS.lists(filters));

      // Optimistically update the cache
      queryClient.setQueryData(UNIFIED_STRATEGIES_KEYS.lists(filters), (old) => {
        return old?.map(strategy =>
          strategy.id === strategyId
            ? { ...strategy, is_active: !strategy.is_active }
            : strategy
        ) ?? [];
      });

      return { previousStrategies };
    },
    onSuccess: (response, strategyId) => {
      const strategy = strategies.find(s => s.id === strategyId);
      const action = response.is_active ? "activated" : "deactivated";

      toast({
        title: "Strategy Toggled",
        description: `${strategy?.ticker || 'Strategy'} has been ${action}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (err, strategyId, context) => {
      // Rollback on error
      queryClient.setQueryData(UNIFIED_STRATEGIES_KEYS.lists(filters), context.previousStrategies);

      toast({
        title: "Error toggling strategy",
        description: err.response?.data?.detail || err.message || "Failed to toggle strategy",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries(UNIFIED_STRATEGIES_KEYS.all);
    }
  });

  // Mutation for deleting strategy
  const deleteStrategyMutation = useMutation({
    mutationFn: (strategyId) => unifiedStrategiesApi.deleteStrategy(strategyId),
    onMutate: async (strategyId) => {
      await queryClient.cancelQueries(UNIFIED_STRATEGIES_KEYS.all);
      const previousStrategies = queryClient.getQueryData(UNIFIED_STRATEGIES_KEYS.lists(filters));

      // Optimistically remove the strategy from cache
      queryClient.setQueryData(UNIFIED_STRATEGIES_KEYS.lists(filters), (old = []) => {
        return old.filter(strategy => strategy.id !== strategyId);
      });

      return { previousStrategies };
    },
    onSuccess: () => {
      toast({
        title: "Strategy Deleted",
        description: "Strategy has been successfully removed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error, strategyId, context) => {
      // Rollback to previous state if there was an error
      if (context?.previousStrategies) {
        queryClient.setQueryData(UNIFIED_STRATEGIES_KEYS.lists(filters), context.previousStrategies);
      }

      const errorMessage = error.response?.data?.detail || error.message || "Failed to delete strategy";
      toast({
        title: "Error deleting strategy",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries(UNIFIED_STRATEGIES_KEYS.all);
    }
  });

  // Mutation for batch operations
  const batchOperationMutation = useMutation({
    mutationFn: ({ strategyIds, operation }) =>
      unifiedStrategiesApi.batchOperation(strategyIds, operation),
    onSuccess: (response, { operation }) => {
      queryClient.invalidateQueries(UNIFIED_STRATEGIES_KEYS.all);

      const actionText = operation === 'delete' ? 'deleted' :
                        operation === 'activate' ? 'activated' : 'deactivated';

      toast({
        title: "Batch Operation Complete",
        description: `${response.affected_count || 0} strategies ${actionText}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: "Batch Operation Failed",
        description: error.response?.data?.detail || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });

  // Mutation for validating strategy before creation
  const validateStrategyMutation = useMutation({
    mutationFn: (strategyData) => unifiedStrategiesApi.validateStrategy(strategyData),
  });

  // Helper functions
  const refreshStrategies = async () => {
    await unifiedStrategiesApi.refreshStrategies();
    return refetch();
  };

  // Filter helpers
  const getWebhookStrategies = () => strategies.filter(s => s.execution_type === 'webhook');
  const getEngineStrategies = () => strategies.filter(s => s.execution_type === 'engine');
  const getActiveStrategies = () => strategies.filter(s => s.is_active);
  const getStrategiesByAccount = (accountId) => strategies.filter(s =>
    s.account_id === accountId ||
    s.leader_account_id === accountId ||
    s.follower_account_ids?.includes(accountId)
  );

  return {
    // Data
    strategies,
    isLoading,
    isError,
    error,

    // Mutations
    createStrategy: createStrategyMutation.mutate,
    createStrategyAsync: createStrategyMutation.mutateAsync,
    isCreating: createStrategyMutation.isLoading,

    updateStrategy: updateStrategyMutation.mutate,
    updateStrategyAsync: updateStrategyMutation.mutateAsync,
    isUpdating: updateStrategyMutation.isLoading,

    toggleStrategy: toggleStrategyMutation.mutate,
    toggleStrategyAsync: toggleStrategyMutation.mutateAsync,
    isToggling: toggleStrategyMutation.isLoading,

    deleteStrategy: deleteStrategyMutation.mutate,
    deleteStrategyAsync: deleteStrategyMutation.mutateAsync,
    isDeleting: deleteStrategyMutation.isLoading,

    batchOperation: batchOperationMutation.mutate,
    batchOperationAsync: batchOperationMutation.mutateAsync,
    isBatchOperating: batchOperationMutation.isLoading,

    validateStrategy: validateStrategyMutation.mutateAsync,
    isValidating: validateStrategyMutation.isLoading,

    // Helpers
    refetch,
    refreshStrategies,
    getWebhookStrategies,
    getEngineStrategies,
    getActiveStrategies,
    getStrategiesByAccount,

    // Query client for manual cache updates if needed
    queryClient
  };
};

// Export for backward compatibility during migration
export { useUnifiedStrategies as useStrategies };
export default useUnifiedStrategies;