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
import { useTrades } from '@/hooks/useTrades';
import { useMemo, useEffect } from 'react';
import AnimatedPositionRow from './components/AnimatedPositionRow';
import PositionStatusIndicator from './components/PositionStatusIndicator';
import { useThrottledPositions } from '@/services/websocket-proxy/hooks/useThrottledPositions';
import { useAudioAlerts } from '@/hooks/useAudioAlerts';

const LiveTradesView = () => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [sort, setSort] = useState({ field: 'timeEntered', direction: 'desc' });
  const [filter, setFilter] = useState({ side: 'all', symbol: 'all' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  console.log('[LiveTradesView] Component rendered - selectedBroker:', selectedBroker, 'selectedAccount:', selectedAccount);

  const toast = useToast();
  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useAccounts();
  const { isConnected, sendMessage, connections, testMarketDataAccess } = useWebSocketContext();
  
  // Use trades hook for database-backed live trades
  const { liveTrades, closeTrade: closeTradeApi, isLoading: tradesLoading } = useTrades();
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
  
  // Initialize audio alerts
  const { 
    checkPositionChange, 
    clearTrackedPositions
  } = useAudioAlerts(selectedAccount, selectedBroker);
  
  // Merge database trades with WebSocket positions
  const mergedPositions = useMemo(() => {
    // Start with WebSocket positions
    const positionsMap = new Map();
    
    // Add WebSocket positions
    if (positions && Array.isArray(positions)) {
      positions.forEach(pos => {
        const key = pos.positionId || pos.contractId;
        positionsMap.set(key, { ...pos, source: 'websocket' });
      });
    }
    
    // Add or update with database trades
    if (liveTrades && Array.isArray(liveTrades)) {
      liveTrades.forEach(trade => {
        const key = trade.position_id;
        const existing = positionsMap.get(key);
        
        if (existing) {
          // Merge data - WebSocket data takes precedence for real-time fields
          positionsMap.set(key, {
            ...existing,
            ...trade,
            // Keep real-time data from WebSocket
            currentPrice: existing.currentPrice,
            unrealizedPnl: existing.unrealizedPnl,
            // Add database fields
            strategy_id: trade.strategy_id,
            strategy_name: trade.strategy_name,
            max_unrealized_pnl: trade.max_unrealized_pnl,
            max_adverse_pnl: trade.max_adverse_pnl,
            source: 'both'
          });
        } else {
          // Database-only trade (might be stale or WebSocket hasn't caught up)
          positionsMap.set(key, { ...trade, source: 'database' });
        }
      });
    }
    
    return Array.from(positionsMap.values());
  }, [positions, liveTrades]);

  // Use throttled positions for better performance
  const throttledPositions = useThrottledPositions(mergedPositions, {
    priceUpdateDelay: 500,
    pnlUpdateDelay: 250,
    bulkUpdateDelay: 1000
  });
  
  // Trigger audio alerts when positions change
  useEffect(() => {
    if (mergedPositions && mergedPositions.length > 0) {
      // Check each position for changes
      mergedPositions.forEach(position => {
        checkPositionChange(position);
      });
    }
  }, [mergedPositions, checkPositionChange]);
  
  // Clear tracked positions on account change or disconnect
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      clearTrackedPositions();
    }
  }, [connectionStatus, clearTrackedPositions]);

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

  // Set initial account and monitor connection status
  useEffect(() => {
    console.log('[LiveTradesView] Connected accounts:', connectedAccounts);
    if (connectedAccounts.length > 0 && !selectedAccount) {
      console.log('[LiveTradesView] Setting initial account:', connectedAccounts[0]);
      setSelectedAccount(connectedAccounts[0].account_id);
      setSelectedBroker(connectedAccounts[0].broker_id);
    }
  }, [connectedAccounts, selectedAccount]);

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

  const handleAccountChange = useCallback((value) => {
    if (!value || value === 'null') return;
    
    // Find the account to get broker info
    const account = connectedAccounts.find(acc => acc.account_id === value);
    if (account) {
      setSelectedAccount(value);
      setSelectedBroker(account.broker_id);
    }
  }, [connectedAccounts]);

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
        // Also close the trade in the database
        if (position.id && closeTradeApi) {
          await closeTradeApi(position.id);
        }
        
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
  if (accountsLoading || positionsLoading || tradesLoading || !accounts) {
    console.log('[LiveTradesView] Loading state:', { accountsLoading, positionsLoading, tradesLoading, hasAccounts: !!accounts, accountsError });
    
    if (accountsError) {
      console.error('[LiveTradesView] Accounts loading error:', accountsError);
      return (
        <Alert status="error">
          <AlertIcon />
          Failed to load accounts: {accountsError.message}
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

  // Empty state - show coming soon instead of no connected accounts
  if (connectedAccounts.length === 0) {
    return (
      <Flex justify="center" align="center" height="100%" width="100%">
        <VStack spacing={4} textAlign="center" px={6}>
          <Box
            w="60px"
            h="60px"
            borderRadius="full"
            bg="linear-gradient(135deg, rgba(0, 198, 224, 0.1), rgba(153, 50, 204, 0.1))"
            border="2px solid"
            borderColor="rgba(0, 198, 224, 0.3)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            animation="pulse 2s infinite"
          >
            <Activity size={28} color="#00C6E0" />
          </Box>
          <VStack spacing={2}>
            <Text color="white" fontSize="lg" fontWeight="bold">
              Live Trading View Coming Soon!
            </Text>
            <Text color="whiteAlpha.700" fontSize="sm" maxW="300px">
              We're building an amazing real-time trading experience with live positions, 
              market data, and advanced analytics. Stay tuned!
            </Text>
          </VStack>
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
    <Box maxH="250px" overflowY="auto" className="custom-scrollbar">
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
      {connectionHealth && !connectionHealth.isHealthy && (
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
      
      {/* Header */}
      <Flex justify="space-between" mb={4} px={4}>
        <HStack spacing={4}>
          <Text fontSize="lg" fontWeight="semibold" color="white">
            Open Positions
          </Text>
          <Badge colorScheme="blue">
            {throttledPositions?.length || 0} Position{throttledPositions?.length !== 1 ? 's' : ''}
          </Badge>
          {connectionStatus === 'connected' && lastUpdate && (
            <PositionStatusIndicator lastUpdate={lastUpdate} />
          )}
          {updateStats && (updateStats.opened > 0 || updateStats.closed > 0) && (
            <HStack spacing={2}>
              <Badge colorScheme="green" variant="subtle">
                +{updateStats.opened} opened
              </Badge>
              <Badge colorScheme="red" variant="subtle">
                -{updateStats.closed} closed
              </Badge>
            </HStack>
          )}
        </HStack>

        <HStack spacing={2}>
          {/* Temporary Market Data Test Button */}
          <Button
            size="sm"
            colorScheme="yellow"
            onClick={async () => {
              try {
                const result = await testMarketDataAccess(selectedBroker, selectedAccount);
                console.log('[MARKET_DATA_TEST] Test results:', result);
                toast({
                  title: 'Market Data Test Complete',
                  description: 'Check console for results',
                  status: 'info',
                  duration: 5000,
                });
              } catch (error) {
                console.error('[MARKET_DATA_TEST] Test failed:', error);
                toast({
                  title: 'Market Data Test Failed',
                  description: error.message,
                  status: 'error',
                  duration: 5000,
                });
              }
            }}
          >
            Test Market Data
          </Button>
          
          <Select
            size="sm"
            value={selectedAccount}
            onChange={(e) => handleAccountChange(e.target.value)}
            bg="whiteAlpha.100"
            borderColor="whiteAlpha.200"
            width="120px"
          >
            {connectedAccounts.map((account) => (
              <option key={account.account_id} value={account.account_id}>
                {account.nickname || account.display_name || account.account_id}
              </option>
            ))}
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
            <Th color="whiteAlpha.600">Strategy</Th>
            <Th color="whiteAlpha.600" isNumeric>Account</Th>
            <Th width="50px"></Th>
          </Tr>
        </Thead>
        <Tbody>
          {!throttledPositions || throttledPositions.length === 0 ? (
            <Tr>
              <Td colSpan={11}>
                <Flex justify="center" align="center" py={8}>
                  <VStack spacing={3}>
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="full"
                      bg="rgba(0, 198, 224, 0.1)"
                      border="1px solid"
                      borderColor="rgba(0, 198, 224, 0.3)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Activity size={20} color="#00C6E0" />
                    </Box>
                    <VStack spacing={1}>
                      <Text color="white" fontSize="md" fontWeight="semibold">
                        Real-Time Positions Coming Soon!
                      </Text>
                      <Text color="whiteAlpha.600" fontSize="sm" textAlign="center">
                        Live position tracking with real-time P&L updates
                      </Text>
                    </VStack>
                  </VStack>
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

      {/* Footer Stats */}
      <Box mt={4} px={4}>
        <HStack spacing={4} justify="space-between">
          <HStack spacing={2}>
            {lastUpdate && (
              <Text fontSize="xs" color="whiteAlpha.500">
                Last update: {new Date(lastUpdate).toLocaleTimeString()}
              </Text>
            )}
          </HStack>
          <HStack spacing={4}>
            <Text fontSize="sm" color="whiteAlpha.600">
              Total Positions: {throttledPositions?.length || 0}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.600">
              Status:{' '}
              <Badge
                colorScheme={connectionStatus === 'connected' ? 'green' : 'red'}
                ml={1}
              >
                {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </Badge>
            </Text>
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
};

export default LiveTradesView;