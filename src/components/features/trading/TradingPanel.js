import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Badge,
  Button,
  ButtonGroup,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { Activity, Clock, FileText, MoreVertical, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import HistoricalTradesView from './HistoricalTradesView';
import axiosInstance from '@/services/axiosConfig';
import { useWebSocketContext } from '@/services/websocket-proxy/contexts/WebSocketContext';

/**
 * TradingPanel — bottom panel with 3 tabs: Positions, Orders, History
 *
 * Shows aggregated data from ALL accounts (both auto and manual).
 *
 * Props:
 *   positions      - aggregated positions from useAggregatedPositions (has _accountId, _accountNickname)
 *   orders         - aggregated orders from useAggregatedPositions
 *   chartSymbol    - current chart symbol for highlighting
 */
const TradingPanel = ({ positions = [], orders = [], chartSymbol = '', isCollapsed = false, onToggleCollapse }) => {
  const [activeTab, setActiveTab] = useState('positions');
  const toast = useToast();
  const { sendMessage } = useWebSocketContext();

  // Filter to open positions only
  const openPositions = useMemo(
    () =>
      positions.filter(
        (p) => p && !p.isClosed && p.side !== 'FLAT' && (p.quantity > 0 || Math.abs(p.netPos || 0) > 0)
      ),
    [positions]
  );

  // Filter working orders
  const workingOrders = useMemo(
    () =>
      orders.filter((o) => {
        if (!o || !o.orderId) return false;
        return (
          o.ordStatus === 'Working' ||
          o.status === 'Working' ||
          o.ordStatus === 6
        );
      }),
    [orders]
  );

  // Close position handler
  const handleClosePosition = useCallback(
    async (pos) => {
      const accountId = pos._accountId || pos.accountId;
      const brokerId = pos._brokerId || pos.brokerId;
      if (!accountId || !brokerId) return;

      try {
        const closeSide = pos.side === 'LONG' ? 'SELL' : 'BUY';
        const qty = pos.quantity || Math.abs(pos.netPos || 0);

        await sendMessage(brokerId, accountId, {
          type: 'submit_order',
          data: {
            symbol: pos.symbol,
            side: closeSide,
            quantity: qty,
            orderType: 'MARKET',
            accountId,
          },
        });
        toast({ title: 'Close order submitted', status: 'success', duration: 2000 });
      } catch (err) {
        toast({
          title: 'Failed to close',
          description: err.message,
          status: 'error',
          duration: 4000,
        });
      }
    },
    [sendMessage, toast]
  );

  // Cancel order handler
  const handleCancelOrder = useCallback(
    async (ord) => {
      const accountId = ord._accountId || ord.accountId;
      if (!accountId) return;

      try {
        await axiosInstance.delete(
          `/api/v1/brokers/accounts/${accountId}/orders/${ord.orderId}`
        );
        toast({ title: 'Order cancelled', status: 'success', duration: 2000 });
      } catch (err) {
        toast({
          title: 'Failed to cancel',
          description: err.response?.data?.detail || err.message,
          status: 'error',
          duration: 4000,
        });
      }
    },
    [toast]
  );

  const tabs = [
    { key: 'positions', label: 'Positions', icon: Activity, count: openPositions.length },
    { key: 'orders', label: 'Orders', icon: FileText, count: workingOrders.length },
    { key: 'history', label: 'History', icon: Clock },
  ];

  return (
    <Box
      h="100%"
      bg="whiteAlpha.100"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Tab Header */}
      <Flex px={3} py={2} align="center" borderBottom={isCollapsed ? 'none' : '1px solid'} borderColor="whiteAlpha.100">
        <ButtonGroup size="xs" isAttached variant="ghost" spacing={0}>
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              bg={activeTab === tab.key ? 'whiteAlpha.200' : 'transparent'}
              color={activeTab === tab.key ? 'white' : 'whiteAlpha.600'}
              _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
              leftIcon={<tab.icon size={13} />}
              fontWeight={activeTab === tab.key ? 'semibold' : 'normal'}
              borderRadius="md"
              px={3}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <Badge ml={1} fontSize="9px" colorScheme="cyan" variant="solid" borderRadius="full" px={1.5}>
                  {tab.count}
                </Badge>
              )}
            </Button>
          ))}
        </ButtonGroup>

        {onToggleCollapse && (
          <>
            <Box flex="1" />
            <IconButton
              icon={isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              size="xs"
              variant="ghost"
              color="whiteAlpha.500"
              _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            />
          </>
        )}
      </Flex>

      {/* Tab Content — hidden when collapsed */}
      {!isCollapsed && <Box flex="1" overflow="auto" minH={0} overflowX="auto">
        {activeTab === 'positions' && (
          <PositionsTab
            positions={openPositions}
            onClose={handleClosePosition}
            chartSymbol={chartSymbol}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab
            orders={workingOrders}
            onCancel={handleCancelOrder}
          />
        )}
        {activeTab === 'history' && <HistoricalTradesView />}
      </Box>}
    </Box>
  );
};

/** Positions tab — multi-account positions table */
const PositionsTab = memo(({ positions, onClose, chartSymbol }) => {
  if (positions.length === 0) {
    return (
      <Flex justify="center" align="center" h="100%" minH="80px">
        <Text fontSize="sm" color="whiteAlpha.400">
          No open positions
        </Text>
      </Flex>
    );
  }

  return (
    <Table size="sm" variant="unstyled">
      <Thead>
        <Tr>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100">Account</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100">Symbol</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100">Side</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100" isNumeric>Qty</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100" isNumeric display={{ base: 'none', md: 'table-cell' }}>Entry</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100" isNumeric>P&L</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100" w="40px"></Th>
        </Tr>
      </Thead>
      <Tbody>
        {positions.map((pos, i) => {
          const isLong = pos.side === 'LONG' || (pos.netPos && pos.netPos > 0);
          const qty = pos.quantity || Math.abs(pos.netPos || 0);
          const pnl = pos.unrealizedPnL || 0;
          const nickname = pos._accountNickname || pos._accountId || '';

          return (
            <Tr
              key={`${pos._accountId}-${pos.positionId || i}`}
              _hover={{ bg: 'whiteAlpha.50' }}
            >
              <Td py={1.5}>
                <Text fontSize="xs" color="whiteAlpha.700" noOfLines={1}>
                  {nickname}
                </Text>
              </Td>
              <Td py={1.5}>
                <Text fontSize="xs" fontWeight="bold" color="white">
                  {pos.symbol}
                </Text>
              </Td>
              <Td py={1.5}>
                <Badge
                  fontSize="9px"
                  colorScheme={isLong ? 'green' : 'red'}
                  variant="subtle"
                >
                  {isLong ? 'LONG' : 'SHORT'}
                </Badge>
              </Td>
              <Td py={1.5} isNumeric>
                <Text fontSize="xs" color="white">{qty}</Text>
              </Td>
              <Td py={1.5} isNumeric display={{ base: 'none', md: 'table-cell' }}>
                <Text fontSize="xs" color="whiteAlpha.700">
                  {(pos.avgPrice || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </Td>
              <Td py={1.5} isNumeric>
                <HStack spacing={1} justify="flex-end">
                  {pnl >= 0 ? (
                    <TrendingUp size={10} color="#26a69a" />
                  ) : (
                    <TrendingDown size={10} color="#ef5350" />
                  )}
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color={pnl >= 0 ? 'green.400' : 'red.400'}
                  >
                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                  </Text>
                </HStack>
              </Td>
              <Td py={1.5}>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<MoreVertical size={12} />}
                    variant="ghost"
                    size="xs"
                    color="whiteAlpha.500"
                    _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                    aria-label="Position actions"
                  />
                  <MenuList
                    bg="rgba(30, 30, 30, 0.95)"
                    borderColor="whiteAlpha.200"
                    minW="120px"
                  >
                    <MenuItem
                      fontSize="xs"
                      onClick={() => onClose(pos)}
                      _hover={{ bg: 'whiteAlpha.100' }}
                      bg="transparent"
                      color="white"
                    >
                      Close Position
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
});
PositionsTab.displayName = 'PositionsTab';

/** Orders tab — working orders across all accounts */
const OrdersTab = memo(({ orders, onCancel }) => {
  if (orders.length === 0) {
    return (
      <Flex justify="center" align="center" h="100%" minH="80px">
        <Text fontSize="sm" color="whiteAlpha.400">
          No working orders
        </Text>
      </Flex>
    );
  }

  return (
    <Table size="sm" variant="unstyled">
      <Thead>
        <Tr>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100">Account</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100">Symbol</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100">Side</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100" display={{ base: 'none', md: 'table-cell' }}>Type</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100" isNumeric>Qty</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100" isNumeric>Price</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100" w="40px"></Th>
        </Tr>
      </Thead>
      <Tbody>
        {orders.map((ord, i) => {
          const isBuy =
            ord.action === 'Buy' || ord.side === 'buy' || ord.side === 1;
          const typeLabel = ord.ordType || ord.orderType || ord.type || 'LIMIT';
          const price = ord.price || ord.limitPrice || ord.stopPrice || 0;
          const qty = ord.qty || ord.quantity || ord.orderQty || 1;
          const nickname = ord._accountNickname || ord._accountId || '';

          return (
            <Tr
              key={`${ord._accountId}-${ord.orderId || i}`}
              _hover={{ bg: 'whiteAlpha.50' }}
            >
              <Td py={1.5}>
                <Text fontSize="xs" color="whiteAlpha.700" noOfLines={1}>
                  {nickname}
                </Text>
              </Td>
              <Td py={1.5}>
                <Text fontSize="xs" fontWeight="bold" color="white">
                  {ord.symbol}
                </Text>
              </Td>
              <Td py={1.5}>
                <Badge
                  fontSize="9px"
                  colorScheme={isBuy ? 'green' : 'red'}
                  variant="subtle"
                >
                  {isBuy ? 'BUY' : 'SELL'}
                </Badge>
              </Td>
              <Td py={1.5} display={{ base: 'none', md: 'table-cell' }}>
                <Text fontSize="xs" color="whiteAlpha.600">{typeLabel}</Text>
              </Td>
              <Td py={1.5} isNumeric>
                <Text fontSize="xs" color="white">{qty}</Text>
              </Td>
              <Td py={1.5} isNumeric>
                <Text fontSize="xs" color="whiteAlpha.700">
                  {price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </Td>
              <Td py={1.5}>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  fontSize="10px"
                  onClick={() => onCancel(ord)}
                >
                  Cancel
                </Button>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
});
OrdersTab.displayName = 'OrdersTab';

export default memo(TradingPanel);
