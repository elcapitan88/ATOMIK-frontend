import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/services/axiosConfig';
import {
  Box,
  VStack,
  HStack,
  Radio,
  RadioGroup,
  Select,
  Text,
  Spinner,
} from '@chakra-ui/react';
import { User as UserIcon, Users as UsersIcon } from 'lucide-react';
import logger from '@/utils/logger';

const AccountSelection = ({ selectedAccounts = [], onChange }) => {
  const [selectionType, setSelectionType] = useState('single');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Query for accounts with proper endpoint
  const { data: accounts = [], isLoading: accountsLoading, error: accountsError } = useQuery({
    queryKey: ['activeAccounts'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/v1/brokers/accounts');
        logger.info('Accounts API response:', response.data);
        return response.data || [];
      } catch (error) {
        logger.error('Failed to fetch accounts:', error);
        
        // Try fallback endpoint if the main endpoint fails
        if (error.response?.status === 404) {
          try {
            logger.info('Trying fallback accounts endpoint...');
            const fallbackResponse = await axios.get('/api/tradovate/fetch-accounts/');
            logger.info('Fallback accounts response:', fallbackResponse.data);
            return fallbackResponse.data || [];
          } catch (fallbackError) {
            logger.error('Fallback accounts endpoint also failed:', fallbackError);
          }
        }
        
        throw error;
      }
    },
    staleTime: 30000 // Cache for 30 seconds
  });

  // Query for strategies with proper endpoint
  const { data: strategies = [], isLoading: strategiesLoading, error: strategiesError } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/v1/strategies/list');
        logger.info('Strategies API response:', response.data);
        
        // Validate response structure
        if (!Array.isArray(response.data)) {
          logger.error('Invalid strategies response format:', response.data);
          return [];
        }
        
        return response.data || [];
      } catch (error) {
        logger.error('Failed to fetch strategies:', error);
        throw error;
      }
    },
    staleTime: 30000 // Cache for 30 seconds
  });

  // Reset selections when switching types
  useEffect(() => {
    if (selectionType === 'single') {
      setSelectedGroupId('');
      setSelectedAccountId('');
      onChange([], 'single');
    } else if (selectionType === 'group') {
      setSelectedAccountId('');
      setSelectedGroupId('');
      onChange([], 'group');
    }
  }, [selectionType, onChange]);

  // Effect to handle pre-selected accounts passed from parent
  useEffect(() => {
    if (selectedAccounts && selectedAccounts.length > 0 && accounts.length > 0) {
      const accountId = selectedAccounts[0];
      if (selectionType === 'single') {
        setSelectedAccountId(accountId);
      }
    }
  }, [selectedAccounts, accounts, selectionType]);

  const availableAccounts = useMemo(() => {
    logger.info('Starting account filtering process...');
    logger.info(`Total accounts: ${accounts.length}`);
    logger.info(`Total strategies: ${strategies.length}`);
    
    if (!accounts || accounts.length === 0) {
      logger.warn('No accounts to filter!');
      return [];
    }
    
    // Make sure all account IDs are strings for consistent comparison
    const accountsWithStringIds = accounts.map(account => ({
      ...account,
      account_id: String(account.account_id)
    }));
    
    // Get all accounts used in active strategies - convert all to strings
    const accountsInUse = new Set();
    
    // Add accounts from single strategies
    strategies
      .filter(s => s && s.is_active && s.strategy_type === 'single' && s.account_id)
      .forEach(s => {
        accountsInUse.add(String(s.account_id));
      });
    
    // Add accounts from multiple/group strategies
    strategies
      .filter(s => s && s.is_active && s.strategy_type === 'multiple')
      .forEach(s => {
        // Add leader account
        if (s.leader_account_id) {
          accountsInUse.add(String(s.leader_account_id));
        }
        
        // Add follower accounts
        if (s.follower_accounts && Array.isArray(s.follower_accounts)) {
          s.follower_accounts.forEach(f => {
            if (f && f.account_id) {
              accountsInUse.add(String(f.account_id));
            }
          });
        }
      });
    
    logger.info(`Found ${accountsInUse.size} accounts in use by active strategies`);
    
    // Filter available accounts
    const validAccounts = accountsWithStringIds.filter(account => {
      if (!account || !account.account_id) {
        return false;
      }
      
      const isTokenValid = account.is_token_expired === false;
      const isInUse = accountsInUse.has(account.account_id);
      const isActive = account.status === 'active';
      
      logger.debug(
        `Account ${account.account_id}: valid token=${isTokenValid}, in use=${isInUse}, active=${isActive}`
      );
      
      return isTokenValid && !isInUse && isActive;
    });
    
    logger.info(`Available accounts after filtering: ${validAccounts.length}`);
    return validAccounts;
  }, [accounts, strategies]);

  const activeGroupStrategies = useMemo(() => {
    if (!strategies || !Array.isArray(strategies)) {
      return [];
    }
    
    const groupStrategies = strategies.filter(s => 
      s && s.is_active && s.strategy_type === 'multiple'
    );
    
    return groupStrategies.map(strategy => ({
      ...strategy,
      id: strategy.id || 0,
      ticker: strategy.ticker || 'Unknown',
      group_name: strategy.group_name || 'Unnamed Group',
      leader_account_id: strategy.leader_account_id ? String(strategy.leader_account_id) : null,
      leader_quantity: strategy.leader_quantity || 1,
      follower_accounts: Array.isArray(strategy.follower_accounts) ? 
        strategy.follower_accounts.map(f => ({
          ...f,
          account_id: f.account_id ? String(f.account_id) : ''
        })) : []
    }));
  }, [strategies]);

  const handleAccountChange = (value) => {
    logger.info('Account selected:', value);
    setSelectedAccountId(value);
    
    if (value) {
      onChange([value], 'single');
    } else {
      onChange([], 'single');
    }
  };

  const handleGroupStrategyChange = (groupId) => {
    logger.info('Group selected:', groupId);
    setSelectedGroupId(groupId);
    
    if (!groupId) {
      onChange([], 'group');
      return;
    }
    
    // Find the matching strategy
    const numericId = parseInt(groupId, 10);
    const strategy = activeGroupStrategies.find(s => s.id === numericId);
    
    if (strategy) {
      // Ensure all account IDs are strings
      const leaderAccountId = strategy.leader_account_id || '';
      const followerAccountIds = (strategy.follower_accounts || [])
        .map(f => String(f.account_id))
        .filter(id => id);
      
      // Create the accounts array with leader first, then followers
      const groupAccounts = [leaderAccountId, ...followerAccountIds].filter(Boolean);
      
      if (groupAccounts.length > 0) {
        logger.info('Group accounts selected:', groupAccounts);
        
        onChange(
          groupAccounts, 
          'group', 
          {
            id: strategy.id,
            ticker: strategy.ticker, 
            groupName: strategy.group_name,
            leaderAccountId: leaderAccountId,
            leaderQuantity: strategy.leader_quantity,
            followerAccounts: strategy.follower_accounts
          }
        );
      } else {
        logger.warn('No valid accounts found in the selected group strategy');
        onChange([], 'group');
      }
    } else {
      logger.warn(`No strategy found with ID: ${groupId}`);
      onChange([], 'group');
    }
  };

  const isLoading = accountsLoading || strategiesLoading;
  const hasErrors = accountsError || strategiesError;

  // Show loading state
  if (isLoading) {
    return (
      <Box width="full" textAlign="center" py={2}>
        <Spinner size="sm" color="blue.400" />
      </Box>
    );
  }

  // Show error state if needed
  if (hasErrors && !accounts.length) {
    return (
      <Box width="full" textAlign="center" py={2} color="red.400">
        <Text fontSize="xs">Error loading accounts</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch" width="full">
      <RadioGroup 
        value={selectionType} 
        onChange={setSelectionType}
        size="sm"
      >
        <HStack spacing={4} bg="whiteAlpha.50" p={2} borderRadius="md">
          <Radio 
            value="single"
            colorScheme="blue"
            sx={{
              '.chakra-radio__control': {
                borderColor: 'whiteAlpha.400',
                _checked: {
                  bg: 'rgba(0, 198, 224, 0.6)',
                  borderColor: 'rgba(0, 198, 224, 0.6)',
                }
              }
            }}
          >
            <HStack spacing={1}>
              <UserIcon size={14} />
              <Text>Single Account</Text>
            </HStack>
          </Radio>
          <Radio 
            value="group"
            colorScheme="blue"
            sx={{
              '.chakra-radio__control': {
                borderColor: 'whiteAlpha.400',
                _checked: {
                  bg: 'rgba(0, 198, 224, 0.6)',
                  borderColor: 'rgba(0, 198, 224, 0.6)',
                }
              }
            }}
          >
            <HStack spacing={1}>
              <UsersIcon size={14} />
              <Text>Account Group</Text>
            </HStack>
          </Radio>
        </HStack>
      </RadioGroup>

      {selectionType === 'single' ? (
        <Select
          value={selectedAccountId}
          onChange={(e) => handleAccountChange(e.target.value)}
          placeholder="Select Account"
          bg="whiteAlpha.50"
          borderColor="whiteAlpha.200"
          _hover={{ borderColor: "whiteAlpha.300" }}
          _focus={{ 
            borderColor: "rgba(0, 198, 224, 0.6)",
            boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
          }}
          isDisabled={availableAccounts.length === 0}
        >
          {availableAccounts.map(account => (
            <option key={account.account_id} value={account.account_id}>
              {`${account.name || account.account_id} (${account.environment || 'unknown'})`}
            </option>
          ))}
        </Select>
      ) : (
        <Select
          value={selectedGroupId}
          onChange={(e) => handleGroupStrategyChange(e.target.value)}
          placeholder="Select Group Strategy"
          bg="whiteAlpha.50"
          borderColor="whiteAlpha.200"
          _hover={{ borderColor: "whiteAlpha.300" }}
          _focus={{ 
            borderColor: "rgba(0, 198, 224, 0.6)",
            boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
          }}
          isDisabled={activeGroupStrategies.length === 0}
        >
          {activeGroupStrategies.map(group => (
            <option key={group.id} value={String(group.id)}>
              {`${group.group_name || 'Unnamed Group'} (${group.ticker || 'No Ticker'})`}
            </option>
          ))}
        </Select>
      )}

      {selectionType === 'single' && (
        <Text fontSize="xs" color="whiteAlpha.600">
          {accounts.length === 0 ? "No accounts available" : 
           availableAccounts.length === 0 ? "All accounts are either in use or have expired tokens" : 
           `${availableAccounts.length} account(s) available`}
        </Text>
      )}
      
      {selectionType === 'group' && (
        <Text fontSize="xs" color="whiteAlpha.600">
          {activeGroupStrategies.length === 0 ? "No active group strategies" : 
           `${activeGroupStrategies.length} group(s) available`}
        </Text>
      )}
    </VStack>
  );
};

export default AccountSelection;