// src/hooks/useAccounts.js
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/services/axiosConfig'; 
import logger from '@/utils/logger';

/**
 * Custom hook to fetch and normalize account data
 * Ensures consistent data structure with required fields
 */
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      try {
        // Make the API call to fetch accounts
        const response = await axiosInstance.get('/api/v1/brokers/accounts');
        const accounts = response.data || [];
        
        // Log the raw account data for debugging
        logger.debug('Raw account data from API:', accounts);
        
        // Transform and normalize the account data
        const normalizedAccounts = accounts.map(account => {
          // Ensure broker_id is present (critical for WebSocket connections)
          const broker_id = account.broker_id || account.brokerId || 'tradovate';
          
          // Create a normalized account object with consistent field names
          return {
            ...account,
            broker_id, // Ensure broker_id is always present
            account_id: account.account_id || account.id, // Normalize account_id
            name: account.name || `Account ${account.account_id || account.id}`, // Ensure name is present
            environment: account.environment || 'demo', // Default environment if missing
            // Default values for other required fields if they're missing
            status: account.status || 'inactive',
            is_token_expired: account.is_token_expired || false,
            is_deleted: account.is_deleted || false,
            balance: parseFloat(account.balance || 0),
            // Add any other fields that need normalization
          };
        });
        
        // Log the normalized accounts for debugging
        logger.debug('Normalized accounts:', normalizedAccounts);
        
        return normalizedAccounts;
      } catch (error) {
        logger.error('Error fetching accounts:', error);
        throw error;
      }
    },
    staleTime: 30000, // Data becomes stale after 30 seconds
    refetchOnWindowFocus: true, // Refresh data when window regains focus
    refetchOnMount: true, // Refresh data when component mounts
    refetchInterval: false, // Don't automatically refetch at intervals
    retry: 1 // Retry failed requests once
  });
}

export default useAccounts;