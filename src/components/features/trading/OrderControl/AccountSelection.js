import React, { useState, useEffect } from 'react';
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
  // Local state for UI only
  const [selectionType, setSelectionType] = useState('single');
  const [localSelectedAccountId, setLocalSelectedAccountId] = useState('');
  const [localSelectedGroupId, setLocalSelectedGroupId] = useState('');

  // Query for accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['activeAccounts'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/v1/brokers/accounts');
        return response.data || [];
      } catch (error) {
        logger.error('Failed to fetch accounts:', error);
        return [];
      }
    },
    staleTime: 30000
  });

  // Query for strategies
  const { data: strategies = [], isLoading: strategiesLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/v1/strategies/list');
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        logger.error('Failed to fetch strategies:', error);
        return [];
      }
    },
    staleTime: 30000
  });

  // Available accounts for selection (not in use by active strategies)
  const availableAccounts = React.useMemo(() => {
    if (!accounts || !strategies) return [];
    
    // Find accounts used in active strategies
    const usedAccountIds = new Set();
    
    strategies.forEach(strategy => {
      if (!strategy.is_active) return;
      
      if (strategy.strategy_type === 'single' && strategy.account_id) {
        usedAccountIds.add(String(strategy.account_id));
      } else if (strategy.strategy_type === 'multiple') {
        if (strategy.leader_account_id) {
          usedAccountIds.add(String(strategy.leader_account_id));
        }
        
        (strategy.follower_accounts || []).forEach(account => {
          if (account.account_id) {
            usedAccountIds.add(String(account.account_id));
          }
        });
      }
    });
    
    // Filter available accounts
    return accounts.filter(account => {
      const accountId = String(account.account_id);
      const isTokenValid = account.is_token_expired === false;
      const isAvailable = !usedAccountIds.has(accountId);
      const isActive = account.status === 'active';
      
      return isTokenValid && isAvailable && isActive;
    });
  }, [accounts, strategies]);

  // Available group strategies
  const availableGroupStrategies = React.useMemo(() => {
    return (strategies || []).filter(s => 
      s && s.is_active && s.strategy_type === 'multiple'
    );
  }, [strategies]);

  // Handle selection type change (single/group)
  const handleSelectionTypeChange = (newType) => {
    if (newType === selectionType) return;
    
    setSelectionType(newType);
    setLocalSelectedAccountId('');
    setLocalSelectedGroupId('');
    onChange([], newType);
  };

  // Handle account selection
  const handleAccountSelect = (accountId) => {
    setLocalSelectedAccountId(accountId);
    
    if (accountId) {
      onChange([accountId], 'single');
    } else {
      onChange([], 'single');
    }
  };

  // Handle group strategy selection
  const handleGroupSelect = (groupId) => {
    setLocalSelectedGroupId(groupId);
    
    if (!groupId) {
      onChange([], 'group');
      return;
    }
    
    const strategy = availableGroupStrategies.find(s => String(s.id) === groupId);
    if (!strategy) {
      onChange([], 'group');
      return;
    }
    
    // Get all accounts involved in this group
    const accounts = [];
    
    if (strategy.leader_account_id) {
      accounts.push(String(strategy.leader_account_id));
    }
    
    (strategy.follower_accounts || []).forEach(follower => {
      if (follower.account_id) {
        accounts.push(String(follower.account_id));
      }
    });
    
    // Create group info
    const groupInfo = {
      id: strategy.id,
      ticker: strategy.ticker || '',
      groupName: strategy.group_name || 'Unnamed Group',
      leaderAccountId: strategy.leader_account_id || '',
      leaderQuantity: strategy.leader_quantity || 1,
      followerAccounts: strategy.follower_accounts || []
    };
    
    onChange(accounts, 'group', groupInfo);
  };

  // Synchronize with parent component's selectedAccounts
  useEffect(() => {
    if (selectedAccounts.length > 0) {
      // If parent has selected accounts, but we have none locally,
      // update our local state to match
      if (selectionType === 'single' && !localSelectedAccountId) {
        setLocalSelectedAccountId(selectedAccounts[0]);
      }
    }
  }, [selectedAccounts, selectionType, localSelectedAccountId]);

  // Render component
  const isLoading = accountsLoading || strategiesLoading;
  
  if (isLoading) {
    return (
      <Box width="full" textAlign="center" py={2}>
        <Spinner size="sm" color="blue.400" />
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch" width="full">
      {/* Selection Type Toggle */}
      <RadioGroup 
        value={selectionType} 
        onChange={handleSelectionTypeChange}
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

      {/* Single Account Selection */}
      {selectionType === 'single' && (
        <Select
          value={localSelectedAccountId}
          onChange={(e) => handleAccountSelect(e.target.value)}
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
              {`${account.nickname || account.name || account.account_id} (${account.environment || 'unknown'})`}
            </option>
          ))}
        </Select>
      )}

      {/* Group Strategy Selection */}
      {selectionType === 'group' && (
        <Select
          value={localSelectedGroupId}
          onChange={(e) => handleGroupSelect(e.target.value)}
          placeholder="Select Group Strategy"
          bg="whiteAlpha.50"
          borderColor="whiteAlpha.200"
          _hover={{ borderColor: "whiteAlpha.300" }}
          _focus={{ 
            borderColor: "rgba(0, 198, 224, 0.6)",
            boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
          }}
          isDisabled={availableGroupStrategies.length === 0}
        >
          {availableGroupStrategies.map(group => (
            <option key={group.id} value={String(group.id)}>
              {`${group.group_name || 'Unnamed Group'} (${group.ticker || 'No Ticker'})`}
            </option>
          ))}
        </Select>
      )}

      {/* Status Messages */}
      {selectionType === 'single' && (
        <Text fontSize="xs" color="whiteAlpha.600">
          {availableAccounts.length === 0
            ? "No available accounts found"
            : `${availableAccounts.length} account(s) available`}
        </Text>
      )}
      
      {selectionType === 'group' && (
        <Text fontSize="xs" color="whiteAlpha.600">
          {availableGroupStrategies.length === 0
            ? "No active group strategies found"
            : `${availableGroupStrategies.length} group(s) available`}
        </Text>
      )}
    </VStack>
  );
};

export default AccountSelection;