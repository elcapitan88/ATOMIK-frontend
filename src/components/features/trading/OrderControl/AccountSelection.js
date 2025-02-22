import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
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

const AccountSelection = ({ selectedAccounts, onChange }) => {
  const [selectionType, setSelectionType] = React.useState('single');
  // Add state to track selected group ID
  const [selectedGroupId, setSelectedGroupId] = React.useState('');

  // Reset selections when switching types
  React.useEffect(() => {
    onChange([]);
    setSelectedGroupId('');
  }, [selectionType, onChange]);

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['activeAccounts'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/v1/brokers/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    }
  });

  const { data: strategies = [], isLoading: strategiesLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/v1/strategies/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    }
  });

  const availableAccounts = React.useMemo(() => {
    // Get all accounts used in active single strategies
    const singleStrategyAccounts = strategies
      .filter(s => s.is_active && s.strategy_type === 'single')
      .map(s => s.account_id);

    // Get all accounts used in active multiple/group strategies
    const groupStrategyAccounts = strategies
      .filter(s => s.is_active && s.strategy_type === 'multiple')
      .flatMap(s => [
        s.leader_account_id,                                    // Leader account
        ...(s.follower_accounts?.map(f => f.account_id) || []) // Follower accounts
      ]);

    // Combine all accounts in use
    const accountsInUse = [...new Set([...singleStrategyAccounts, ...groupStrategyAccounts])];

    // Filter available accounts
    return accounts.filter(account => 
      !account.is_token_expired && 
      !accountsInUse.includes(account.account_id)
    );
  }, [accounts, strategies]);

  const activeGroupStrategies = React.useMemo(() => {
    return strategies.filter(s => 
      s.is_active && 
      s.strategy_type === 'multiple'
    );
  }, [strategies]);

  const handleAccountChange = (value) => {
    onChange([value]);
  };

  const handleGroupStrategyChange = (groupId) => {
    setSelectedGroupId(groupId); // Update selected group ID
    
    const strategy = activeGroupStrategies.find(s => s.id === Number(groupId));
    if (strategy) {
      // Get all accounts associated with this group
      const groupAccounts = [
        strategy.leader_account_id,
        ...(strategy.follower_accounts?.map(f => f.account_id) || [])
      ];
      onChange(groupAccounts);
    } else {
      onChange([]); // Clear selection if no group found
    }
  };

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
              {`${account.name} (${account.environment})`}
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
            <option key={group.id} value={group.id}>
              {`${group.group_name} (${group.ticker})`}
            </option>
          ))}
        </Select>
      )}

      {selectionType === 'single' && availableAccounts.length === 0 && (
        <Text fontSize="xs" color="whiteAlpha.600">
          No available trading accounts
        </Text>
      )}
      {selectionType === 'group' && activeGroupStrategies.length === 0 && (
        <Text fontSize="xs" color="whiteAlpha.600">
          No active group strategies
        </Text>
      )}
    </VStack>
  );
};

export default AccountSelection;