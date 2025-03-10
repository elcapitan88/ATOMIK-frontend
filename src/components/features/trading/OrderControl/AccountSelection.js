import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/services/axiosConfig';  // Use your configured axios instance
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

const AccountSelection = ({ selectedAccounts, onChange }) => {
  const [selectionType, setSelectionType] = React.useState('single');
  const [selectedGroupId, setSelectedGroupId] = React.useState('');

  // Reset selections when switching types
  React.useEffect(() => {
    // Only reset selections, not on initial mount
    if (selectionType) {
      if (selectionType === 'single') {
        setSelectedGroupId('');
      }
      
      // Call onChange with empty array to reset parent component state
      onChange([], selectionType);
    }
  }, [selectionType, onChange]);

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

  const availableAccounts = React.useMemo(() => {
    logger.info('Starting account filtering process...');
    logger.info(`Total accounts: ${accounts.length}`, accounts);
    logger.info(`Total strategies: ${strategies.length}`, strategies);
    
    if (!accounts.length) {
      logger.warn('No accounts to filter!');
      return [];
    }
    
    // Get all accounts used in active single strategies - convert all to strings
    const singleStrategyAccounts = strategies
      .filter(s => s.is_active && s.strategy_type === 'single')
      .map(s => String(s.account_id));
    
    logger.info('Accounts in single strategies:', singleStrategyAccounts);

    // Get all accounts used in active multiple/group strategies - convert all to strings
    const groupStrategyAccounts = strategies
      .filter(s => s.is_active && s.strategy_type === 'multiple')
      .flatMap(s => {
        const leaderAccount = s.leader_account_id ? String(s.leader_account_id) : null;
        const followerAccounts = s.follower_accounts ? 
          s.follower_accounts.map(f => String(f.account_id)).filter(Boolean) : [];
          
        return [leaderAccount, ...followerAccounts].filter(Boolean);
      });
    
    logger.info('Accounts in group strategies:', groupStrategyAccounts);

    // Combine all accounts in use
    const accountsInUse = [...new Set([...singleStrategyAccounts, ...groupStrategyAccounts])];
    logger.info('All accounts in use:', accountsInUse);

    // Filter valid accounts - ensure all IDs are strings for comparison
    const validAccounts = accounts.filter(account => {
      // Skip accounts without an ID
      if (!account || !account.account_id) {
        logger.warn('Account missing ID:', account);
        return false;
      }
      
      // Convert to string for consistent comparison
      const accountId = String(account.account_id);
      const isTokenValid = account.is_token_expired === false; // Must explicitly check for false
      const isInUse = accountsInUse.includes(accountId);
      
      logger.info(
        `Account ${accountId}: valid token: ${isTokenValid}, in use: ${isInUse}, status: ${account.status}`
      );
      
      // Only return accounts with valid tokens that aren't in use
      return isTokenValid && !isInUse && account.status === 'active';
    });
    
    logger.info(`Available accounts after filtering: ${validAccounts.length}`, validAccounts);
    return validAccounts;
  }, [accounts, strategies]);

  const activeGroupStrategies = React.useMemo(() => {
    if (!strategies || !Array.isArray(strategies)) {
      logger.warn('No valid strategies array available');
      return [];
    }
    
    const groupStrategies = strategies.filter(s => 
      s && s.is_active && s.strategy_type === 'multiple'
    );
    
    logger.info(`Found ${groupStrategies.length} active group strategies`);
    
    // Make sure each strategy has the expected fields with fallbacks for essential fields
    return groupStrategies.map(strategy => ({
      ...strategy,
      id: strategy.id || 0,
      ticker: strategy.ticker || 'Unknown',
      group_name: strategy.group_name || 'Unnamed Group',
      leader_account_id: strategy.leader_account_id || null,
      leader_quantity: strategy.leader_quantity || 1,
      follower_accounts: strategy.follower_accounts || []
    }));
  }, [strategies]);

  const handleAccountChange = (value) => {
    logger.info('Account selected:', value);
    onChange([value], 'single');
  };

  const handleGroupStrategyChange = (groupId) => {
    console.log('Group selected:', groupId); // Debug log
    setSelectedGroupId(groupId);
    
    // Convert groupId to number for comparison since strategy.id is numeric
    const strategyId = parseInt(groupId, 10);
    console.log('Looking for strategy with ID:', strategyId);
    console.log('Available strategies:', activeGroupStrategies);
    
    // Find the matching strategy with proper type handling
    const strategy = activeGroupStrategies.find(s => s.id === strategyId);
    console.log('Found strategy:', strategy);
    
    if (strategy) {
      // Get all accounts associated with this group
      const groupAccounts = [
        strategy.leader_account_id,
        ...(strategy.follower_accounts?.map(f => f.account_id) || [])
      ].filter(Boolean).map(String);
      
      logger.info('Group accounts selected:', groupAccounts);
      
      // Pass both the accounts and group info including ticker
      onChange(
        groupAccounts, 
        'group', 
        {
          id: strategy.id,
          ticker: strategy.ticker, 
          groupName: strategy.group_name,
          // Include any other relevant group data
          leaderAccountId: strategy.leader_account_id,
          leaderQuantity: strategy.leader_quantity,
          followerAccounts: strategy.follower_accounts
        }
      );
    } else {
      console.warn('No strategy found with ID:', groupId);
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
          value={selectedAccounts[0] || ''}
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
            // Make sure we convert the ID to string for select option values
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