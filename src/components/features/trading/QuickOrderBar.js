import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Badge,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  NumberInput,
  NumberInputField,
  Tooltip,
  useToast,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  VStack,
  ButtonGroup,
} from '@chakra-ui/react';
import { ChevronDown, Settings } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';
import AutomatedFlattenModal from './AutomatedFlattenModal';

/**
 * QuickOrderBar — thin horizontal bar between chart and bottom panel.
 *
 * Displays: ticker badge, total qty / active accounts, order type dropdown,
 * BUY / SELL buttons, optional inline price input for limit/stop orders.
 *
 * Props:
 *   chartSymbol        - current chart symbol (e.g. 'NQ')
 *   multiAccountTrading - return from useMultiAccountTrading hook
 *   positions          - aggregated positions from useAggregatedPositions
 *   orders             - aggregated orders from useAggregatedPositions
 */
const QuickOrderBar = ({ chartSymbol, multiAccountTrading, positions = [], orders = [], bracketPlacement, getCopyInfo, autoBracket }) => {
  const toast = useToast();
  const [isFlattening, setIsFlattening] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [flattenMode, setFlattenMode] = useState('flattenAndCancel'); // 'flattenAndCancel' | 'flattenOnly' | 'cancelOnly'
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [autoModalData, setAutoModalData] = useState(null);

  const {
    activeAccounts,
    activeCount,
    totalContracts,
    orderType,
    setOrderType,
    limitPrice,
    setLimitPrice,
    stopPrice,
    setStopPrice,
    timeInForce,
    setTimeInForce,
    placeMultiAccountOrder,
    isSubmitting,
    strategyBoundAccountIds,
    getAccountStrategies,
  } = multiAccountTrading;

  const hasActiveAccounts = activeCount > 0;
  const symbol = chartSymbol || 'NQ';
  const needsPrice = orderType === 'LIMIT' || orderType === 'STOP_LIMIT';
  const needsStop = orderType === 'STOP' || orderType === 'STOP_LIMIT';

  // Place order helper
  const handleOrder = useCallback(
    async (side) => {
      if (!hasActiveAccounts) {
        toast({
          title: 'No Active Accounts',
          description: 'Toggle at least one account ON in the Accounts panel.',
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      if (needsPrice && !limitPrice) {
        toast({ title: 'Enter a limit price', status: 'warning', duration: 2000 });
        return;
      }
      if (needsStop && !stopPrice) {
        toast({ title: 'Enter a stop price', status: 'warning', duration: 2000 });
        return;
      }

      await placeMultiAccountOrder({
        side,
        type: orderType,
        price: needsPrice ? parseFloat(limitPrice) : undefined,
        stopPrice: needsStop ? parseFloat(stopPrice) : undefined,
        symbol,
        timeInForce,
      });
    },
    [hasActiveAccounts, orderType, limitPrice, stopPrice, timeInForce, symbol, placeMultiAccountOrder, needsPrice, needsStop, toast]
  );

  // Helper: check if an account is a copy-follower (managed by copy cascade)
  const isCopyFollower = useCallback(
    (accountId) => getCopyInfo?.(accountId)?.mode === 'copy-follower',
    [getCopyInfo]
  );

  // Open positions — exclude copy-follower accounts (copy cascade handles them)
  const openPositions = useMemo(
    () => positions.filter(
      (p) => p && !p.isClosed && p.side !== 'FLAT' && (p.quantity > 0 || Math.abs(p.netPos || 0) > 0)
        && !isCopyFollower(p._accountId || p.accountId)
    ),
    [positions, isCopyFollower]
  );

  // Working orders — exclude copy-follower accounts
  const workingOrders = useMemo(
    () => orders.filter((o) => {
      if (!o || !o.orderId) return false;
      if (isCopyFollower(o._accountId || o.accountId)) return false;
      return o.ordStatus === 'Working' || o.status === 'Working' || o.ordStatus === 6;
    }),
    [orders, isCopyFollower]
  );

  // Helper: check if account is strategy-bound (automated)
  const isStrategyBound = useCallback(
    (accountId) => strategyBoundAccountIds?.has(String(accountId)),
    [strategyBoundAccountIds]
  );

  // Split positions into manual vs automated
  const manualPositions = useMemo(
    () => openPositions.filter((p) => !isStrategyBound(p._accountId || p.accountId)),
    [openPositions, isStrategyBound]
  );
  const automatedPositions = useMemo(
    () => openPositions.filter((p) => isStrategyBound(p._accountId || p.accountId)),
    [openPositions, isStrategyBound]
  );

  // Split orders into manual vs automated
  const manualOrders = useMemo(
    () => workingOrders.filter((o) => !isStrategyBound(o._accountId || o.accountId)),
    [workingOrders, isStrategyBound]
  );
  const automatedOrders = useMemo(
    () => workingOrders.filter((o) => isStrategyBound(o._accountId || o.accountId)),
    [workingOrders, isStrategyBound]
  );

  // Cancel all working orders for given accounts (helper)
  const cancelOrdersForAccounts = useCallback(async (accountOrders) => {
    const results = await Promise.all(
      accountOrders.map(async (ord) => {
        const accountId = ord._accountId || ord.accountId;
        if (!accountId) return { success: false, error: 'Missing account ID' };
        try {
          await axiosInstance.delete(`/api/v1/brokers/accounts/${accountId}/orders/${ord.orderId}`);
          return { success: true };
        } catch (err) {
          return { success: false, error: err.response?.data?.detail || err.message };
        }
      })
    );
    return results;
  }, []);

  // Helper: flatten manual positions only
  const flattenManualPositions = useCallback(async () => {
    return Promise.all(
      manualPositions.map(async (pos) => {
        const accountId = pos._accountId || pos.accountId;
        if (!accountId) return { success: false, error: 'Missing account info' };
        const closeSide = pos.side === 'LONG' ? 'SELL' : 'BUY';
        const qty = pos.quantity || Math.abs(pos.netPos || 0);
        try {
          await axiosInstance.post(
            `/api/v1/brokers/accounts/${accountId}/discretionary/orders`,
            { symbol: pos.symbol, side: closeSide, type: 'MARKET', quantity: qty, time_in_force: 'IOC', force_close: true }
          );
          return { success: true };
        } catch (err) {
          return { success: false, error: err.response?.data?.detail || err.message };
        }
      })
    );
  }, [manualPositions]);

  // Helper: show automated modal or just toast if no automated positions
  const showResultsOrModal = useCallback((flatOk, flatFail, cancelOk, cancelFail, mode) => {
    if (automatedPositions.length > 0) {
      // Open modal — defer toast until user decides
      setAutoModalData({
        manualResults: { flatOk, flatFail, cancelOk, cancelFail },
        flattenMode: mode,
      });
      setAutoModalOpen(true);
    } else {
      // No automated positions — show toast immediately
      const parts = [];
      if (flatOk > 0) parts.push(`${flatOk} position${flatOk !== 1 ? 's' : ''} closed`);
      if (cancelOk > 0) parts.push(`${cancelOk} order${cancelOk !== 1 ? 's' : ''} cancelled`);
      const failTotal = flatFail + cancelFail;
      if (failTotal === 0) {
        toast({ title: parts.join(', ') || 'Done', status: 'success', duration: 3000 });
      } else {
        toast({ title: `${parts.join(', ')}. ${failTotal} failed.`, status: 'warning', duration: 4000, isClosable: true });
      }
    }
  }, [automatedPositions, toast]);

  // Flatten — close manual positions, then prompt for automated
  const handleFlatten = useCallback(async () => {
    if (openPositions.length === 0) {
      toast({ title: 'No open positions', status: 'info', duration: 2000 });
      return;
    }

    setIsFlattening(true);
    try {
      const results = manualPositions.length > 0 ? await flattenManualPositions() : [];
      const flatOk = results.filter((r) => r.success).length;
      const flatFail = results.filter((r) => !r.success).length;
      showResultsOrModal(flatOk, flatFail, 0, 0, 'flattenOnly');
    } catch (err) {
      toast({ title: 'Flatten failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setIsFlattening(false);
    }
  }, [openPositions, manualPositions, flattenManualPositions, showResultsOrModal, toast]);

  // Flatten + Cancel — close manual positions + cancel manual orders, then prompt for automated
  const handleFlattenAndCancel = useCallback(async () => {
    if (openPositions.length === 0 && workingOrders.length === 0) {
      toast({ title: 'Nothing to flatten or cancel', status: 'info', duration: 2000 });
      return;
    }

    setIsFlattening(true);
    try {
      const [flattenResults, cancelResults] = await Promise.all([
        manualPositions.length > 0 ? flattenManualPositions() : [],
        manualOrders.length > 0 ? cancelOrdersForAccounts(manualOrders) : [],
      ]);

      const flatOk = flattenResults.filter((r) => r.success).length;
      const flatFail = flattenResults.filter((r) => !r.success).length;
      const cancelOk = cancelResults.filter((r) => r.success).length;
      const cancelFail = cancelResults.filter((r) => !r.success).length;

      showResultsOrModal(flatOk, flatFail, cancelOk, cancelFail, 'flattenAndCancel');
    } catch (err) {
      toast({ title: 'Flatten + Cancel failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setIsFlattening(false);
    }
  }, [openPositions, workingOrders, manualPositions, manualOrders, flattenManualPositions, cancelOrdersForAccounts, showResultsOrModal, toast]);

  // Cancel all manual working orders, then prompt for automated
  const handleCancelAll = useCallback(async () => {
    if (workingOrders.length === 0) {
      toast({ title: 'No working orders', status: 'info', duration: 2000 });
      return;
    }

    setIsCancelling(true);
    try {
      const results = manualOrders.length > 0 ? await cancelOrdersForAccounts(manualOrders) : [];
      const cancelOk = results.filter((r) => r.success).length;
      const cancelFail = results.filter((r) => !r.success).length;
      showResultsOrModal(0, 0, cancelOk, cancelFail, 'cancelOnly');
    } catch (err) {
      toast({ title: 'Cancel failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setIsCancelling(false);
    }
  }, [workingOrders, manualOrders, cancelOrdersForAccounts, showResultsOrModal, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only fire when no input/select is focused
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleOrder('buy');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleOrder('sell');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOrder]);

  return (
    <Box
      bg="whiteAlpha.100"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      px={3}
      py={1.5}
    >
      <Flex align="center" justify="space-between" gap={{ base: 2, md: 3 }} wrap="wrap">
        {/* Left: Ticker + Summary */}
        <HStack spacing={2} flexShrink={0}>
          <Badge
            bg="whiteAlpha.200"
            color="white"
            fontSize="sm"
            fontWeight="bold"
            px={2}
            py={0.5}
            borderRadius="md"
          >
            {symbol}
          </Badge>

          <Text fontSize="xs" color="whiteAlpha.500" display={{ base: 'none', sm: 'block' }}>
            {hasActiveAccounts
              ? (() => {
                  // Check if any active account is a copy leader
                  const leaderAcct = activeAccounts.find(
                    (a) => getCopyInfo?.(a.account_id)?.mode === 'copy-leader'
                  );
                  if (leaderAcct) {
                    const info = getCopyInfo(leaderAcct.account_id);
                    const leaderName = leaderAcct.nickname || leaderAcct.name || leaderAcct.account_id;
                    return `${totalContracts} ct${totalContracts !== 1 ? 's' : ''} on ${leaderName} → copying to ${info.followerCount || 0} acct${(info.followerCount || 0) !== 1 ? 's' : ''}`;
                  }
                  return `${totalContracts} ct${totalContracts !== 1 ? 's' : ''} / ${activeCount} acct${activeCount !== 1 ? 's' : ''}`;
                })()
              : 'No accounts active'}
          </Text>
        </HStack>

        {/* Center: Order Type + Price Inputs + Buy/Sell */}
        <HStack spacing={2} flex="1" justify="center">
          <Menu>
            <MenuButton
              as={Button}
              size="xs"
              variant="outline"
              bg="whiteAlpha.100"
              borderColor="whiteAlpha.200"
              color="white"
              fontWeight="normal"
              w="100px"
              rightIcon={<ChevronDown size={12} />}
              _hover={{ bg: 'whiteAlpha.200' }}
              _active={{ bg: 'whiteAlpha.200' }}
            >
              {{ MARKET: 'Market', LIMIT: 'Limit', STOP: 'Stop', STOP_LIMIT: 'Stop Limit' }[orderType]}
            </MenuButton>
            <MenuList
              bg="rgba(0, 0, 0, 0.85)"
              backdropFilter="blur(20px)"
              borderColor="rgba(255, 255, 255, 0.1)"
              minW="100px"
            >
              {[
                { value: 'MARKET', label: 'Market' },
                { value: 'LIMIT', label: 'Limit' },
                { value: 'STOP', label: 'Stop' },
                { value: 'STOP_LIMIT', label: 'Stop Limit' },
              ].map((opt) => (
                <MenuItem
                  key={opt.value}
                  fontSize="xs"
                  bg="transparent"
                  color={orderType === opt.value ? 'cyan.300' : 'white'}
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => setOrderType(opt.value)}
                >
                  {opt.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          <Menu>
            <MenuButton
              as={Button}
              size="xs"
              variant="outline"
              bg="whiteAlpha.100"
              borderColor="whiteAlpha.200"
              color="white"
              fontWeight="normal"
              w="80px"
              rightIcon={<ChevronDown size={12} />}
              _hover={{ bg: 'whiteAlpha.200' }}
              _active={{ bg: 'whiteAlpha.200' }}
            >
              {timeInForce}
            </MenuButton>
            <MenuList
              bg="rgba(0, 0, 0, 0.85)"
              backdropFilter="blur(20px)"
              borderColor="rgba(255, 255, 255, 0.1)"
              minW="80px"
            >
              {[
                { value: 'GTC', label: 'GTC' },
                { value: 'Day', label: 'Day' },
                { value: 'IOC', label: 'IOC' },
                { value: 'FOK', label: 'FOK' },
              ].map((opt) => (
                <MenuItem
                  key={opt.value}
                  fontSize="xs"
                  bg="transparent"
                  color={timeInForce === opt.value ? 'cyan.300' : 'white'}
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => setTimeInForce(opt.value)}
                >
                  {opt.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {needsPrice && (
            <NumberInput
              size="xs"
              value={limitPrice}
              onChange={(val) => setLimitPrice(val)}
              min={0}
              precision={2}
              w="80px"
            >
              <NumberInputField
                placeholder="Price"
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.200"
                color="white"
                textAlign="center"
                px={1}
                _focus={{ borderColor: 'cyan.400' }}
                _placeholder={{ color: 'whiteAlpha.400' }}
              />
            </NumberInput>
          )}

          {needsStop && (
            <NumberInput
              size="xs"
              value={stopPrice}
              onChange={(val) => setStopPrice(val)}
              min={0}
              precision={2}
              w="80px"
            >
              <NumberInputField
                placeholder="Stop"
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.200"
                color="white"
                textAlign="center"
                px={1}
                _focus={{ borderColor: 'orange.400' }}
                _placeholder={{ color: 'whiteAlpha.400' }}
              />
            </NumberInput>
          )}

          <Tooltip label={bracketPlacement?.isActive ? "Cancel bracket mode (Esc)" : "Place bracket order on chart"} fontSize="xs" hasArrow>
            <Button
              size="xs"
              px={3}
              bg={bracketPlacement?.isActive ? 'rgba(124, 58, 237, 0.8)' : 'transparent'}
              color={bracketPlacement?.isActive ? 'white' : 'whiteAlpha.600'}
              borderWidth="1px"
              borderColor={bracketPlacement?.isActive ? 'purple.400' : 'whiteAlpha.200'}
              fontWeight="medium"
              fontSize="xs"
              _hover={{ bg: bracketPlacement?.isActive ? 'rgba(124, 58, 237, 1)' : 'whiteAlpha.200', color: 'white' }}
              _active={{ bg: 'rgba(124, 58, 237, 0.6)' }}
              onClick={() => bracketPlacement?.isActive ? bracketPlacement.deactivate() : bracketPlacement?.activate()}
            >
              Bracket
            </Button>
          </Tooltip>

          {/* Auto-Bracket toggle + settings */}
          {autoBracket && (
            <HStack spacing={0}>
              <Tooltip label={autoBracket.enabled ? `Auto-Bracket ON (TP: ${autoBracket.tpOffset} / SL: ${autoBracket.slOffset} ${autoBracket.unit})` : "Auto-Bracket: attach TP/SL to right-click stop orders"} fontSize="xs" hasArrow>
                <Button
                  size="xs"
                  px={2.5}
                  bg={autoBracket.enabled ? 'rgba(251, 146, 60, 0.8)' : 'transparent'}
                  color={autoBracket.enabled ? 'white' : 'whiteAlpha.600'}
                  borderWidth="1px"
                  borderColor={autoBracket.enabled ? 'orange.400' : 'whiteAlpha.200'}
                  borderRightRadius={0}
                  fontWeight="medium"
                  fontSize="xs"
                  _hover={{ bg: autoBracket.enabled ? 'rgba(251, 146, 60, 1)' : 'whiteAlpha.200', color: 'white' }}
                  _active={{ bg: 'rgba(251, 146, 60, 0.6)' }}
                  onClick={autoBracket.toggle}
                >
                  AB
                </Button>
              </Tooltip>
              <Popover placement="bottom" closeOnBlur>
                <PopoverTrigger>
                  <Button
                    size="xs"
                    px={1}
                    minW="auto"
                    bg={autoBracket.enabled ? 'rgba(251, 146, 60, 0.6)' : 'transparent'}
                    color={autoBracket.enabled ? 'white' : 'whiteAlpha.600'}
                    borderWidth="1px"
                    borderColor={autoBracket.enabled ? 'orange.400' : 'whiteAlpha.200'}
                    borderLeftRadius={0}
                    borderLeft="none"
                    _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
                    _active={{ bg: 'whiteAlpha.300' }}
                  >
                    <Settings size={10} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  bg="rgba(0, 0, 0, 0.9)"
                  backdropFilter="blur(20px)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  w="200px"
                  _focus={{ boxShadow: 'none' }}
                >
                  <PopoverArrow bg="rgba(0, 0, 0, 0.9)" />
                  <PopoverBody p={3}>
                    <VStack spacing={2} align="stretch">
                      <Text fontSize="xs" fontWeight="bold" color="orange.300">Auto-Bracket Offsets</Text>

                      <HStack justify="space-between">
                        <Text fontSize="xs" color="whiteAlpha.700">TP</Text>
                        <NumberInput
                          size="xs"
                          value={autoBracket.tpOffset}
                          onChange={(val) => autoBracket.setTpOffset(val)}
                          min={1}
                          max={999}
                          w="70px"
                        >
                          <NumberInputField
                            bg="whiteAlpha.100"
                            borderColor="whiteAlpha.200"
                            color="green.300"
                            textAlign="center"
                            px={1}
                            fontSize="xs"
                            _focus={{ borderColor: 'green.400' }}
                          />
                        </NumberInput>
                      </HStack>

                      <HStack justify="space-between">
                        <Text fontSize="xs" color="whiteAlpha.700">SL</Text>
                        <NumberInput
                          size="xs"
                          value={autoBracket.slOffset}
                          onChange={(val) => autoBracket.setSlOffset(val)}
                          min={1}
                          max={999}
                          w="70px"
                        >
                          <NumberInputField
                            bg="whiteAlpha.100"
                            borderColor="whiteAlpha.200"
                            color="red.300"
                            textAlign="center"
                            px={1}
                            fontSize="xs"
                            _focus={{ borderColor: 'red.400' }}
                          />
                        </NumberInput>
                      </HStack>

                      <ButtonGroup size="xs" isAttached w="100%">
                        <Button
                          flex="1"
                          bg={autoBracket.unit === 'ticks' ? 'orange.600' : 'whiteAlpha.100'}
                          color="white"
                          _hover={{ bg: autoBracket.unit === 'ticks' ? 'orange.500' : 'whiteAlpha.200' }}
                          onClick={() => autoBracket.setUnit('ticks')}
                        >
                          Ticks
                        </Button>
                        <Button
                          flex="1"
                          bg={autoBracket.unit === 'dollars' ? 'orange.600' : 'whiteAlpha.100'}
                          color="white"
                          _hover={{ bg: autoBracket.unit === 'dollars' ? 'orange.500' : 'whiteAlpha.200' }}
                          onClick={() => autoBracket.setUnit('dollars')}
                        >
                          Dollars
                        </Button>
                      </ButtonGroup>
                    </VStack>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </HStack>
          )}

          <Tooltip label="Keyboard: B" fontSize="xs" hasArrow>
            <Button
              size="xs"
              px={4}
              bg="rgba(38, 166, 154, 0.8)"
              color="white"
              fontWeight="bold"
              _hover={{ bg: 'rgba(38, 166, 154, 1)' }}
              _active={{ bg: 'rgba(38, 166, 154, 0.6)' }}
              isLoading={isSubmitting}
              isDisabled={!hasActiveAccounts}
              onClick={() => handleOrder('buy')}
            >
              BUY
            </Button>
          </Tooltip>

          <Tooltip label="Keyboard: S" fontSize="xs" hasArrow>
            <Button
              size="xs"
              px={4}
              bg="rgba(239, 83, 80, 0.8)"
              color="white"
              fontWeight="bold"
              _hover={{ bg: 'rgba(239, 83, 80, 1)' }}
              _active={{ bg: 'rgba(239, 83, 80, 0.6)' }}
              isLoading={isSubmitting}
              isDisabled={!hasActiveAccounts}
              onClick={() => handleOrder('sell')}
            >
              SELL
            </Button>
          </Tooltip>
        </HStack>

        {/* Right: Flatten / Cancel — mode selector + execute button */}
        <HStack spacing={0} flexShrink={0}>
          <Tooltip
            label={{
              flattenAndCancel: 'Flatten positions + cancel orders',
              flattenOnly: 'Flatten positions only',
              cancelOnly: 'Cancel working orders only',
            }[flattenMode]}
            fontSize="xs"
            hasArrow
          >
            <Button
              size="xs"
              px={2.5}
              variant="ghost"
              color={{
                flattenAndCancel: 'red.300',
                flattenOnly: 'whiteAlpha.600',
                cancelOnly: 'orange.300',
              }[flattenMode]}
              fontWeight="medium"
              fontSize="xs"
              borderRightRadius={0}
              _hover={{ bg: 'rgba(239, 83, 80, 0.15)', color: 'red.300' }}
              _active={{ bg: 'rgba(239, 83, 80, 0.25)' }}
              isLoading={isFlattening || isCancelling}
              isDisabled={
                (flattenMode === 'flattenOnly' && openPositions.length === 0) ||
                (flattenMode === 'cancelOnly' && workingOrders.length === 0) ||
                (flattenMode === 'flattenAndCancel' && openPositions.length === 0 && workingOrders.length === 0)
              }
              onClick={{
                flattenAndCancel: handleFlattenAndCancel,
                flattenOnly: handleFlatten,
                cancelOnly: handleCancelAll,
              }[flattenMode]}
            >
              {{ flattenAndCancel: 'Flatten + Cancel', flattenOnly: 'Flatten', cancelOnly: 'Cancel' }[flattenMode]}
            </Button>
          </Tooltip>
          <Menu placement="bottom-end">
            <MenuButton
              as={Button}
              size="xs"
              px={1}
              minW="auto"
              variant="ghost"
              color="whiteAlpha.600"
              fontSize="xs"
              borderLeftRadius={0}
              borderLeft="1px solid"
              borderLeftColor="whiteAlpha.200"
              _hover={{ bg: 'rgba(239, 83, 80, 0.15)', color: 'red.300' }}
              _active={{ bg: 'rgba(239, 83, 80, 0.25)' }}
            >
              <ChevronDown size={10} />
            </MenuButton>
            <MenuList
              bg="rgba(0, 0, 0, 0.85)"
              backdropFilter="blur(20px)"
              borderColor="rgba(255, 255, 255, 0.1)"
              minW="180px"
            >
              <MenuItem
                fontSize="xs"
                bg="transparent"
                color={flattenMode === 'flattenAndCancel' ? 'cyan.300' : 'red.300'}
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => setFlattenMode('flattenAndCancel')}
              >
                Flatten + Cancel All
              </MenuItem>
              <MenuItem
                fontSize="xs"
                bg="transparent"
                color={flattenMode === 'flattenOnly' ? 'cyan.300' : 'white'}
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => setFlattenMode('flattenOnly')}
              >
                Flatten Only
              </MenuItem>
              <MenuItem
                fontSize="xs"
                bg="transparent"
                color={flattenMode === 'cancelOnly' ? 'cyan.300' : 'orange.300'}
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => setFlattenMode('cancelOnly')}
              >
                Cancel Orders
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Automated positions modal — appears after manual flatten if automated positions remain */}
      <AutomatedFlattenModal
        isOpen={autoModalOpen}
        onClose={() => { setAutoModalOpen(false); setAutoModalData(null); }}
        automatedPositions={automatedPositions}
        automatedOrders={automatedOrders}
        getAccountStrategies={getAccountStrategies}
        manualResults={autoModalData?.manualResults}
        flattenMode={autoModalData?.flattenMode}
      />
    </Box>
  );
};

export default memo(QuickOrderBar);
