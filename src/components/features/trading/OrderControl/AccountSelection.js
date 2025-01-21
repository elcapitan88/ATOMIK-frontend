// src/components/features/trading/OrderControl/AccountSelection.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Radio,
  RadioGroup,
  Select,
  Button,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Tooltip,
  Badge,
  Text,
  Flex,
} from '@chakra-ui/react';
import { 
  Users, 
  User, 
  CircleDollarSign, 
  SignalHigh,
  SignalLow,
  AlertCircle,
} from 'lucide-react';

const AccountSelection = ({ selectedAccounts, onChange }) => {
  const [selectionType, setSelectionType] = useState('single');
  const [accounts, setAccounts] = useState([]);
  const [accountGroups, setAccountGroups] = useState([]);

  // Simulated data - replace with actual API calls
  useEffect(() => {
    setAccounts([
      { id: '1', name: 'Main Trading', balance: 10000, status: 'active', type: 'live' },
      { id: '2', name: 'Secondary', balance: 5000, status: 'active', type: 'live' },
      { id: '3', name: 'Test Account', balance: 1000, status: 'warning', type: 'demo' },
      { id: '4', name: 'Development', balance: 2000, status: 'inactive', type: 'demo' },
    ]);

    setAccountGroups([
      { 
        id: 'group1', 
        name: 'Momentum Group', 
        accounts: ['1', '2'],
        type: 'live'
      },
      { 
        id: 'group2', 
        name: 'Test Group', 
        accounts: ['2', '3'],
        type: 'mixed'
      },
    ]);
  }, []);

  const handleAccountChange = (accountId) => {
    if (selectionType === 'single') {
      onChange([accountId]);
    }
  };

  const handleGroupChange = (groupId) => {
    const group = accountGroups.find(g => g.id === groupId);
    if (group) {
      onChange(group.accounts);
    }
  };

  const handleAccountRemove = (accountId) => {
    onChange(selectedAccounts.filter(id => id !== accountId));
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : accountId;
  };

  const getAccountStatus = (account) => {
    switch (account.status) {
      case 'active':
        return { icon: <SignalHigh size={14} color="#48BB78" />, color: 'green' };
      case 'warning':
        return { icon: <SignalLow size={14} color="#ECC94B" />, color: 'yellow' };
      case 'inactive':
        return { icon: <AlertCircle size={14} color="#F56565" />, color: 'red' };
      default:
        return { icon: null, color: 'gray' };
    }
  };

  return (
    <VStack spacing={4} align="stretch" width="full">
      {/* Selection Type Toggle */}
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
              <User size={14} />
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
              <Users size={14} />
              <Text>Account Group</Text>
            </HStack>
          </Radio>
        </HStack>
      </RadioGroup>

      {/* Account/Group Selection */}
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
        >
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {`${account.name} (${account.type.toUpperCase()}) - $${account.balance.toLocaleString()}`}
            </option>
          ))}
        </Select>
      ) : (
        <Select
          value={selectedAccounts.length ? accountGroups.find(
            g => g.accounts.every(a => selectedAccounts.includes(a))
          )?.id || '' : ''}
          onChange={(e) => handleGroupChange(e.target.value)}
          placeholder="Select Group"
          bg="whiteAlpha.50"
          borderColor="whiteAlpha.200"
          _hover={{ borderColor: "whiteAlpha.300" }}
          _focus={{ 
            borderColor: "rgba(0, 198, 224, 0.6)",
            boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
          }}
        >
          {accountGroups.map(group => (
            <option key={group.id} value={group.id}>
              {`${group.name} (${group.accounts.length} accounts)`}
            </option>
          ))}
        </Select>
      )}

      {/* Selected Accounts Display */}
      {selectedAccounts.length > 0 && (
        <Wrap spacing={2}>
          {selectedAccounts.map(accountId => {
            const account = accounts.find(a => a.id === accountId);
            if (!account) return null;
            
            const status = getAccountStatus(account);
            
            return (
              <WrapItem key={accountId}>
                <Tooltip
                  label={
                    <VStack spacing={1} align="start">
                      <Text>Balance: ${account.balance.toLocaleString()}</Text>
                      <Text>Type: {account.type.toUpperCase()}</Text>
                      <Text>Status: {account.status.toUpperCase()}</Text>
                    </VStack>
                  }
                  hasArrow
                  placement="top"
                >
                  <Tag
                    size="md"
                    borderRadius="full"
                    variant="subtle"
                    bgGradient="linear(to-r, whiteAlpha.200, whiteAlpha.100)"
                    borderWidth="1px"
                    borderColor="whiteAlpha.300"
                  >
                    <HStack spacing={2}>
                      {status.icon}
                      <TagLabel>{account.name}</TagLabel>
                      <Badge 
                        colorScheme={account.type === 'live' ? 'green' : 'purple'}
                        fontSize="xs"
                      >
                        {account.type}
                      </Badge>
                      <CircleDollarSign size={14} />
                      <Text fontSize="xs">{`${(account.balance / 1000).toFixed(1)}K`}</Text>
                      <TagCloseButton 
                        onClick={() => handleAccountRemove(accountId)}
                        _hover={{ bg: 'whiteAlpha.300' }}
                      />
                    </HStack>
                  </Tag>
                </Tooltip>
              </WrapItem>
            );
          })}
        </Wrap>
      )}
    </VStack>
  );
};

export default AccountSelection;