// src/components/features/trading/LiveTradesView.js

import React, { useState, useCallback } from 'react';
import {
  Box, 
  Flex,
  Text,
  VStack,
  HStack,
  Grid,
  Select,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  MoreVertical,
  X,
  Bell,
  FileText,
  Clock
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatting/currency';
import { formatDate } from '@/utils/formatting/date';
import useWebSocket from '@/hooks/useWebSocket';

const LiveTradesView = () => {
  const [selectedAccount, setSelectedAccount] = useState('null');
  const [sort, setSort] = useState({ field: 'timeEntered', direction: 'desc' });
  const [filter, setFilter] = useState({ side: 'all', symbol: 'all' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toast = useToast();
  const {
    positions,
    status,
    hasActiveAccounts,
    isChecking,
    error,
    subscribeToMarketData,
    unsubscribeFromMarketData,
    sendMessage,
    accountInfo
  } = useWebSocket('tradovate', selectedAccount);

  const calculateDuration = useCallback((timeEntered) => {
    if (!timeEntered) return '-';
    const now = new Date();
    const enteredTime = new Date(timeEntered);
    const diffInMinutes = Math.floor((now - enteredTime) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m`;
    }
    return `${Math.floor(diffInMinutes / 1440)}d ${Math.floor((diffInMinutes % 1440) / 60)}h`;
  }, []);

  const handleAccountChange = useCallback((accountId) => {
    setSelectedAccount(accountId);
    sendMessage({
      type: 'get_positions',
      accountId
    });
  }, [sendMessage]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await sendMessage({ type: 'get_positions' });
      if (positions?.length > 0) {
        const symbols = positions.map(p => p.symbol);
        await subscribeToMarketData(symbols);
      }
      toast({
        title: "Positions refreshed",
        status: "success",
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClosePosition = useCallback(async (position) => {
    try {
      const success = await sendMessage({
        type: 'submit_order',
        data: {
          symbol: position.symbol,
          side: position.side === 'LONG' ? 'SELL' : 'BUY',
          quantity: position.quantity,
          orderType: 'MARKET',
          accountId: position.accountId
        }
      });

      if (success) {
        toast({
          title: "Close order submitted",
          status: "success",
          duration: 3000,
          isClosable: true
        });
      }
    } catch (error) {
      toast({
        title: "Error closing position",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    }
  }, [sendMessage, toast]);

  const handleSetAlert = useCallback((position) => {
    toast({
      title: "Coming Soon",
      description: "Alert functionality will be available in a future update",
      status: "info",
      duration: 3000,
      isClosable: true
    });
  }, [toast]);

  const handleViewDetails = useCallback((position) => {
    toast({
      title: "Coming Soon",
      description: "Detailed position view will be available in a future update",
      status: "info",
      duration: 3000,
      isClosable: true
    });
  }, [toast]);

  if (isChecking) {
    return (
      <Flex justify="center" align="center" height="100%" width="100%">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (!hasActiveAccounts) {
    return (
      <Flex justify="center" align="center" height="100%" width="100%">
        <VStack spacing={2}>
          <AlertTriangle size={24} color="white" opacity={0.6} />
          <Text color="whiteAlpha.600">No active trading accounts connected</Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" height="100%" width="100%">
        <VStack spacing={2}>
          <AlertTriangle size={24} color="red.400" />
          <Text color="red.400">{error}</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box maxH="250px" overflowY="auto" className="custom-scrollbar">
      {/* Header */}
      <Flex justify="space-between" mb={4} px={4}>
        <HStack spacing={4}>
          <Text fontSize="lg" fontWeight="semibold" color="white">
            Open Positions
          </Text>
          <Badge colorScheme="blue">
            {positions?.length || 0} Position{positions?.length !== 1 ? 's' : ''}
          </Badge>
          {status === 'connected' && (
            <Badge colorScheme="green">Live</Badge>
          )}
        </HStack>

        <HStack spacing={2}>
          <Select
            size="sm"
            value={selectedAccount}
            onChange={(e) => handleAccountChange(e.target.value)}
            bg="whiteAlpha.100"
            borderColor="whiteAlpha.200"
            width="120px"
          >
            <option value="all">All Accounts</option>
            {accountInfo && (
              <option value={accountInfo.accountId}>
                {accountInfo.name || accountInfo.accountId}
              </option>
            )}
          </Select>

          <Select
            size="sm"
            value={filter.side}
            onChange={(e) => setFilter(prev => ({ ...prev, side: e.target.value }))}
            bg="whiteAlpha.100"
            borderColor="whiteAlpha.200"
            width="120px"
          >
            <option value="all">All Sides</option>
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </Select>

          <IconButton
            icon={<RefreshCw size={16} />}
            variant="ghost"
            size="sm"
            isLoading={isRefreshing}
            onClick={handleRefresh}
            color="whiteAlpha.700"
            _hover={{ color: 'white', bg: 'whiteAlpha.200' }}
          />
        </HStack>
      </Flex>

      {/* Positions Table */}
      <Table variant="unstyled" size="sm">
        <Thead>
          <Tr>
            <Th color="whiteAlpha.600">Time</Th>
            <Th color="whiteAlpha.600">Duration</Th>
            <Th color="whiteAlpha.600">Symbol</Th>
            <Th color="whiteAlpha.600">Side</Th>
            <Th color="whiteAlpha.600" isNumeric>Qty</Th>
            <Th color="whiteAlpha.600" isNumeric>Entry</Th>
            <Th color="whiteAlpha.600" isNumeric>Current</Th>
            <Th color="whiteAlpha.600" isNumeric>P&L</Th>
            <Th color="whiteAlpha.600" isNumeric>Account</Th>
            <Th width="50px"></Th>
          </Tr>
        </Thead>
        <Tbody>
          {!positions || positions.length === 0 ? (
            <Tr>
              <Td colSpan={10}>
                <Flex justify="center" align="center" py={4}>
                  <Text color="whiteAlpha.600">No open positions</Text>
                </Flex>
              </Td>
            </Tr>
          ) : (
            positions.map((position) => (
              <Tr 
                key={`${position.contractId}-${position.accountId}`}
                _hover={{ bg: 'whiteAlpha.100' }}
                transition="background 0.2s"
              >
                <Td>{formatDate(position.timeEntered)}</Td>
                <Td>
                  <HStack spacing={1}>
                    <Clock size={14} />
                    <Text>{calculateDuration(position.timeEntered)}</Text>
                  </HStack>
                </Td>
                <Td>
                  <HStack spacing={1}>
                    <Text>{position.symbol}</Text>
                    {position.contractInfo && (
                      <Badge size="sm" variant="subtle" colorScheme="blue">
                        {position.contractInfo.name}
                      </Badge>
                    )}
                  </HStack>
                </Td>
                <Td>
                  <Badge
                    colorScheme={position.side === 'LONG' ? 'green' : 'red'}
                    variant="subtle"
                  >
                    {position.side}
                  </Badge>
                </Td>
                <Td isNumeric>{position.quantity}</Td>
                <Td isNumeric>{formatCurrency(position.avgPrice)}</Td>
                <Td isNumeric>
                  <HStack justify="flex-end" spacing={1}>
                    <Text>{formatCurrency(position.currentPrice)}</Text>
                    {position.currentPrice > position.avgPrice ? (
                      <TrendingUp size={14} color="#48BB78" />
                    ) : position.currentPrice < position.avgPrice ? (
                      <TrendingDown size={14} color="#F56565" />
                    ) : null}
                  </HStack>
                </Td>
                <Td isNumeric>
                  <Text
                    color={parseFloat(position.unrealizedPnL) >= 0 ? 'green.400' : 'red.400'}
                    fontWeight="medium"
                  >
                    {formatCurrency(position.unrealizedPnL)}
                  </Text>
                </Td>
                <Td>
                  <Text fontSize="sm" color="whiteAlpha.900">
                    {position.accountId}
                  </Text>
                </Td>
                <Td>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<MoreVertical size={14} />}
                      variant="ghost"
                      size="sm"
                      _hover={{ bg: 'whiteAlpha.100' }}
                    />
                    <MenuList bg="gray.800" borderColor="whiteAlpha.200">
                      <MenuItem
                        icon={<X size={14} />}
                        onClick={() => handleClosePosition(position)}
                        _hover={{ bg: 'whiteAlpha.100' }}
                      >
                        Close Position
                      </MenuItem>
                      <MenuItem
                        icon={<Bell size={14} />}
                        onClick={() => handleSetAlert(position)}
                        _hover={{ bg: 'whiteAlpha.100' }}
                      >
                        Set Alert
                      </MenuItem>
                      <MenuItem
                        icon={<FileText size={14} />}
                        onClick={() => handleViewDetails(position)}
                        _hover={{ bg: 'whiteAlpha.100' }}
                      >
                        View Details
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      {/* Footer Stats */}
      <Box mt={4} px={4}>
        <HStack spacing={4} justify="flex-end">
          <Text fontSize="sm" color="whiteAlpha.600">
            Total Positions: {positions?.length || 0}
          </Text>
          <Text fontSize="sm" color="whiteAlpha.600">
            Status:{' '}
            <Badge
              colorScheme={status === 'connected' ? 'green' : 'red'}
              ml={1}
            >
              {status === 'connected' ? 'Connected' : 'Disconnected'}
            </Badge>
          </Text>
        </HStack>
      </Box>
    </Box>
  );
};

export default LiveTradesView;