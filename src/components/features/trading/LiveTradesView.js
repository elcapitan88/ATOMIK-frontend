// src/components/features/trading/LiveTradesView.js
// Cache busting update

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
  Spinner,
  Alert,
  AlertIcon,
  Button
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
  Clock,
  Activity
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatting/currency';
import { formatDate } from '@/utils/formatting/date';
import { useWebSocketPositions, useWebSocketContext } from '@/services/websocket-proxy';
import { useAccounts } from '@/hooks/useAccounts';
// import { useTrades } from '@/hooks/useTrades'; // TODO: Re-enable when trade recording is active
import { useMemo, useEffect } from 'react';
import AnimatedPositionRow from './components/AnimatedPositionRow';
import { useThrottledPositions } from '@/services/websocket-proxy/hooks/useThrottledPositions';

const LiveTradesView = ({ selectedAccount, onAccountChange, selectedBroker, filters = {} }) => {
  const [sort, setSort] = useState({ field: 'timeEntered', direction: 'desc' });
  const [filter, setFilter] = useState({ side: filters.side || 'all', symbol: filters.symbol || 'all' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  console.log('[LiveTradesView] Component rendered - selectedBroker:', selectedBroker, 'selectedAccount:', selectedAccount);

  const toast = useToast();
  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useAccounts();
  const { isConnected, sendMessage, connections } = useWebSocketContext();
  
  // TODO: Re-enable when trade recording is active in backend
  // const { liveTrades, closeTrade: closeTradeApi, isLoading: tradesLoading } = useTrades();
  const { 
    positions, 
    loading: positionsLoading, 
    error, 
    refreshPositions,
    lastUpdate,
    updateStats,
    getPositionState,
    isPositionUpdating,
    connectionHealth,
    retryConnection
  } = useWebSocketPositions(selectedBroker, selectedAccount);
  
  console.log('[LiveTradesView] Positions data:', { positions, positionsLoading, error, connectionHealth });
  
  // Use only WebSocket positions for now (trade recording disabled in backend)
  const mergedPositions = useMemo(() => {
    return positions || [];
  }, [positions]);

  // Use throttled positions for better performance
  const throttledPositions = useThrottledPositions(mergedPositions, {
    priceUpdateDelay: 500,
    pnlUpdateDelay: 250,
    bulkUpdateDelay: 1000
  });

  // Get connected accounts
  const connectedAccounts = useMemo(() => {
    console.log('[LiveTradesView] Computing connectedAccounts:', { 
      accounts, 
      accountsLoading, 
      accountsError,
      connectionsLength: connections?.length 
    });
    if (!accounts || !Array.isArray(accounts)) return [];
    
    const filtered = accounts.filter(acc => {
      const isActive = acc.is_active;
      const isConnectedResult = isConnected(acc.broker_id, acc.account_id);
      console.log('[LiveTradesView] Account filter check:', {
        account: acc.account_id,
        broker: acc.broker_id,
        isActive,
        isConnectedResult
      });
      return isActive && isConnectedResult;
    });
    
    console.log('[LiveTradesView] Filtered connected accounts:', filtered);
    return filtered;
  }, [accounts, isConnected, connections]);

  // Notify parent of account changes when needed
  useEffect(() => {
    console.log('[LiveTradesView] Connected accounts:', connectedAccounts);
    if (connectedAccounts.length > 0 && !selectedAccount && onAccountChange) {
      console.log('[LiveTradesView] Setting initial account:', connectedAccounts[0]);
      onAccountChange(connectedAccounts[0].account_id, connectedAccounts[0].broker_id);
    }
  }, [connectedAccounts, selectedAccount, onAccountChange]);

  // Monitor connection status
  useEffect(() => {
    if (selectedBroker && selectedAccount) {
      const connected = isConnected(selectedBroker, selectedAccount);
      console.log('[LiveTradesView] Connection status check:', { selectedBroker, selectedAccount, connected });
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    }
  }, [selectedBroker, selectedAccount, isConnected]);

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

  // Update local filter state when filters prop changes
  useEffect(() => {
    setFilter({ side: filters.side || 'all', symbol: filters.symbol || 'all' });
  }, [filters]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const success = await refreshPositions();
      if (success) {
        toast({
          title: "Positions refreshed",
          status: "success",
          duration: 2000,
          isClosable: true
        });
      }
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
    if (!selectedBroker || !selectedAccount) return;
    
    try {
      // First try to close via WebSocket (real-time)
      const success = await sendMessage(selectedBroker, selectedAccount, {
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
        // TODO: Close trade in database when trade recording is enabled
        // if (position.id && closeTradeApi) {
        //   await closeTradeApi(position.id);
        // }
        
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
  }, [selectedBroker, selectedAccount, sendMessage, closeTradeApi, toast]);

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

  // Loading state
  if (accountsLoading || positionsLoading || !accounts) {
    console.log('[LiveTradesView] Loading state:', { accountsLoading, positionsLoading, hasAccounts: !!accounts, accountsError });
    
    if (accountsError) {
      console.error('[LiveTradesView] Accounts loading error:', accountsError);
      return (
        <Alert status="error">
          <AlertIcon />
          Failed to load accounts: {accountsError?.message || 'Unknown error'}
        </Alert>
      );
    }
    
    return (
      <Flex justify="center" align="center" height="100%" width="100%">
        <VStack spacing={2}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.400">Loading positions...</Text>
        </VStack>
      </Flex>
    );
  }

  // Empty state - no connected accounts
  if (connectedAccounts.length === 0) {
    return (
      <Flex justify="center" align="center" height="100%" width="100%">
        <VStack spacing={3}>
          <Text color="whiteAlpha.600" fontSize="sm">
            No open trades
          </Text>
        </VStack>
      </Flex>
    );
  }

  // Error state
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
    <Box height="100%" overflow="hidden" display="flex" flexDirection="column">
      {/* Connection Status Alert */}
      {connectionStatus !== 'connected' && throttledPositions.length > 0 && (
        <Alert status="warning" mb={4} borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">Connection lost. Showing last known positions.</Text>
          <Button size="sm" ml="auto" onClick={handleRefresh}>
            Reconnect
          </Button>
        </Alert>
      )}
      
      {/* Connection Health Alert */}
      {connectionHealth && connectionHealth.isHealthy !== undefined && !connectionHealth.isHealthy && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1} flex={1}>
            <Text fontSize="sm">Connection issues detected</Text>
            {connectionHealth.lastError && (
              <Text fontSize="xs" opacity={0.8}>{connectionHealth.lastError}</Text>
            )}
            {connectionHealth.reconnectAttempts > 0 && (
              <Text fontSize="xs" opacity={0.8}>
                Reconnect attempts: {connectionHealth.reconnectAttempts}
              </Text>
            )}
          </VStack>
          <Button size="sm" ml={4} onClick={retryConnection}>
            Retry Now
          </Button>
        </Alert>
      )}
      

      {/* Positions Table */}
      <Box 
        flex="1" 
        overflowY="auto"
        px={4}
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
            borderRadius: '8px',
          },
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
        }}
      >
        <Table variant="unstyled" size="sm">
        <Thead>
          <Tr>
            <Th color="whiteAlpha.600">Time</Th>
            <Th color="whiteAlpha.600">Duration</Th>
            <Th color="whiteAlpha.600">Symbol</Th>
            <Th color="whiteAlpha.600">Side</Th>
            <Th color="whiteAlpha.600" isNumeric>Qty</Th>
            <Th color="whiteAlpha.600" isNumeric>Entry</Th>
            <Th color="whiteAlpha.600">Strategy</Th>
            <Th color="whiteAlpha.600" isNumeric>Account</Th>
            <Th width="50px"></Th>
          </Tr>
        </Thead>
        <Tbody>
          {!throttledPositions || throttledPositions.length === 0 ? (
            <Tr>
              <Td colSpan={9}>
                <Flex justify="center" align="center" py={8}>
                  <Text color="whiteAlpha.600" fontSize="sm">
                    No open trades
                  </Text>
                </Flex>
              </Td>
            </Tr>
          ) : (
            throttledPositions.map((position) => (
              <AnimatedPositionRow
                key={`${position.positionId || position.contractId}-${position.accountId}`}
                position={position}
                onClose={handleClosePosition}
                onAlert={handleSetAlert}
                onDetails={handleViewDetails}
                calculateDuration={calculateDuration}
              />
            ))
          )}
        </Tbody>
      </Table>
      </Box>

      {/* Footer with Stats */}
      <VStack spacing={2} mt={2}>
        {/* Stats Row */}
        <Flex 
          w="100%"
          px={4}
          py={2}
          borderTop="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          justifyContent="space-between"
          alignItems="center"
        >
          <HStack spacing={4} color="rgba(255, 255, 255, 0.6)" fontSize="sm">
            <HStack>
              <Text>Total Positions:</Text>
              <Text color="white" fontWeight="medium">{throttledPositions?.length || 0}</Text>
            </HStack>
            <HStack>
              <Text>Status:</Text>
              <Badge
                colorScheme={connectionStatus === 'connected' ? 'green' : 'red'}
                fontSize="xs"
              >
                {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </Badge>
            </HStack>
            {updateStats && updateStats.opened !== undefined && updateStats.closed !== undefined && (updateStats.opened > 0 || updateStats.closed > 0) && (
              <HStack spacing={2}>
                <Badge colorScheme="green" variant="subtle" fontSize="xs">
                  +{updateStats.opened} opened
                </Badge>
                <Badge colorScheme="red" variant="subtle" fontSize="xs">
                  -{updateStats.closed} closed
                </Badge>
              </HStack>
            )}
          </HStack>
          
          <HStack>
            {lastUpdate && (
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
                Last update: {new Date(lastUpdate).toLocaleTimeString()}
              </Text>
            )}
          </HStack>
        </Flex>
      </VStack>
    </Box>
  );
};

export default LiveTradesView;