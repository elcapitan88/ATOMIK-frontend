import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  Badge,
  Input,
  useToast,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Minus, Plus, X } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';

const MotionBox = motion.create(Box);

const ORDER_TYPES = [
  { value: 'MARKET', label: 'Market' },
  { value: 'LIMIT', label: 'Limit' },
  { value: 'STOP', label: 'Stop' },
  { value: 'STOP_LIMIT', label: 'Stop Lmt' },
];

const TIF_OPTIONS = [
  { value: 'GTC', label: 'GTC' },
  { value: 'Day', label: 'Day' },
  { value: 'IOC', label: 'IOC' },
  { value: 'FOK', label: 'FOK' },
];

const BOTTOM_NAV_HEIGHT = 64;

/** Segmented control — touch-friendly alternative to dropdowns */
const SegmentedControl = memo(({ options, value, onChange, size = 'sm' }) => (
  <HStack
    spacing={0}
    bg="whiteAlpha.100"
    borderRadius="lg"
    p={0.5}
    w="100%"
  >
    {options.map((opt) => (
      <Button
        key={opt.value}
        flex="1"
        size={size}
        h={size === 'sm' ? '36px' : '32px'}
        fontSize="xs"
        fontWeight={value === opt.value ? 'bold' : 'normal'}
        bg={value === opt.value ? 'whiteAlpha.300' : 'transparent'}
        color={value === opt.value ? 'white' : 'whiteAlpha.600'}
        borderRadius="md"
        _hover={{ bg: value === opt.value ? 'whiteAlpha.300' : 'whiteAlpha.100' }}
        _active={{ bg: 'whiteAlpha.200' }}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </Button>
    ))}
  </HStack>
));
SegmentedControl.displayName = 'SegmentedControl';

/** Quantity stepper — large +/- buttons for thumb use */
const QuantityStepper = memo(({ value, onChange }) => (
  <HStack spacing={0} bg="whiteAlpha.100" borderRadius="lg" p={0.5}>
    <Button
      h="44px"
      w="44px"
      minW="44px"
      variant="ghost"
      color="whiteAlpha.700"
      _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
      _active={{ bg: 'whiteAlpha.300' }}
      onClick={() => onChange(Math.max(1, value - 1))}
      borderRadius="md"
    >
      <Minus size={18} />
    </Button>
    <Text
      flex="1"
      textAlign="center"
      fontSize="lg"
      fontWeight="bold"
      color="white"
      minW="48px"
      userSelect="none"
    >
      {value}
    </Text>
    <Button
      h="44px"
      w="44px"
      minW="44px"
      variant="ghost"
      color="whiteAlpha.700"
      _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
      _active={{ bg: 'whiteAlpha.300' }}
      onClick={() => onChange(Math.min(999, value + 1))}
      borderRadius="md"
    >
      <Plus size={18} />
    </Button>
  </HStack>
));
QuantityStepper.displayName = 'QuantityStepper';

/**
 * MobileOrderTicket — expandable half-sheet for full order configuration.
 * Slides up from the action bar when expanded.
 */
const MobileOrderTicket = ({
  isOpen,
  onClose,
  chartSymbol,
  chartCurrentPrice,
  multiAccountTrading,
  positions = [],
  orders = [],
  copyTrading,
}) => {
  const toast = useToast();
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
  } = multiAccountTrading;

  const symbol = chartSymbol || 'NQ';
  const hasActiveAccounts = activeCount > 0;
  const needsPrice = orderType === 'LIMIT' || orderType === 'STOP_LIMIT';
  const needsStop = orderType === 'STOP' || orderType === 'STOP_LIMIT';

  // Flatten/cancel state
  const [isFlattening, setIsFlattening] = useState(false);

  // Open positions (exclude copy followers)
  const openPositions = useMemo(
    () =>
      positions.filter(
        (p) =>
          p &&
          !p.isClosed &&
          p.side !== 'FLAT' &&
          (p.quantity > 0 || Math.abs(p.netPos || 0) > 0)
      ),
    [positions]
  );

  // Working orders
  const workingOrders = useMemo(
    () =>
      orders.filter((o) => {
        if (!o || !o.orderId) return false;
        return o.ordStatus === 'Working' || o.status === 'Working' || o.ordStatus === 6;
      }),
    [orders]
  );

  // Place order
  const handleOrder = useCallback(
    async (side) => {
      if (!hasActiveAccounts) {
        toast({ title: 'No Active Accounts', status: 'warning', duration: 3000 });
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

  // Flatten all positions
  const handleFlattenAll = useCallback(async () => {
    if (openPositions.length === 0 && workingOrders.length === 0) {
      toast({ title: 'Nothing to flatten or cancel', status: 'info', duration: 2000 });
      return;
    }

    setIsFlattening(true);
    try {
      const results = await Promise.all([
        // Flatten positions
        ...openPositions.map(async (pos) => {
          const accountId = pos._accountId || pos.accountId;
          if (!accountId) return { success: false };
          const closeSide = pos.side === 'LONG' ? 'SELL' : 'BUY';
          const qty = pos.quantity || Math.abs(pos.netPos || 0);
          try {
            await axiosInstance.post(`/api/v1/brokers/accounts/${accountId}/discretionary/orders`, {
              symbol: pos.symbol,
              side: closeSide,
              type: 'MARKET',
              quantity: qty,
              time_in_force: 'IOC',
              force_close: true,
            });
            return { success: true };
          } catch (err) {
            return { success: false };
          }
        }),
        // Cancel orders
        ...workingOrders.map(async (ord) => {
          const accountId = ord._accountId || ord.accountId;
          if (!accountId) return { success: false };
          try {
            await axiosInstance.delete(`/api/v1/brokers/accounts/${accountId}/orders/${ord.orderId}`);
            return { success: true };
          } catch (err) {
            return { success: false };
          }
        }),
      ]);

      const successes = results.filter((r) => r.success).length;
      const failures = results.filter((r) => !r.success).length;

      if (failures === 0) {
        toast({ title: `Closed ${successes} position${successes !== 1 ? 's' : ''}/order${successes !== 1 ? 's' : ''}`, status: 'success', duration: 3000 });
      } else {
        toast({ title: `${successes} closed, ${failures} failed`, status: 'warning', duration: 4000 });
      }
    } catch (err) {
      toast({ title: 'Flatten failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setIsFlattening(false);
    }
  }, [openPositions, workingOrders, toast]);

  const formattedPrice = chartCurrentPrice
    ? chartCurrentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <MotionBox
            position="fixed"
            inset={0}
            bg="blackAlpha.600"
            zIndex={1100}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <MotionBox
            position="fixed"
            left={0}
            right={0}
            bottom={`${BOTTOM_NAV_HEIGHT}px`}
            bg="rgba(15, 15, 15, 0.97)"
            backdropFilter="blur(24px)"
            borderTopRadius="2xl"
            zIndex={1101}
            px={4}
            pt={3}
            pb={4}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            maxH="70vh"
            overflowY="auto"
          >
            {/* Handle + Close */}
            <Flex justify="space-between" align="center" mb={3}>
              <Flex justify="center" flex="1">
                <Box w="36px" h="4px" borderRadius="full" bg="whiteAlpha.400" />
              </Flex>
              <Button
                minW="auto"
                size="sm"
                variant="ghost"
                color="whiteAlpha.500"
                _hover={{ color: 'white' }}
                onClick={onClose}
                p={1}
              >
                <ChevronDown size={20} />
              </Button>
            </Flex>

            {/* Symbol + Price header */}
            <Flex align="center" justify="space-between" mb={4}>
              <HStack spacing={2}>
                <Badge
                  bg="whiteAlpha.200"
                  color="white"
                  fontSize="sm"
                  fontWeight="bold"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {symbol}
                </Badge>
                <Text fontSize="lg" fontWeight="bold" color="white" fontFamily="mono">
                  {formattedPrice}
                </Text>
              </HStack>
              <Text fontSize="xs" color="whiteAlpha.500">
                {hasActiveAccounts
                  ? `${totalContracts} ct${totalContracts !== 1 ? 's' : ''} / ${activeCount} acct${activeCount !== 1 ? 's' : ''}`
                  : 'No accounts active'}
              </Text>
            </Flex>

            <VStack spacing={3} align="stretch">
              {/* Order Type */}
              <Box>
                <Text fontSize="xs" color="whiteAlpha.500" mb={1.5} fontWeight="medium">
                  Order Type
                </Text>
                <SegmentedControl
                  options={ORDER_TYPES}
                  value={orderType}
                  onChange={setOrderType}
                />
              </Box>

              {/* Time in Force */}
              <Box>
                <Text fontSize="xs" color="whiteAlpha.500" mb={1.5} fontWeight="medium">
                  Time in Force
                </Text>
                <SegmentedControl
                  options={TIF_OPTIONS}
                  value={timeInForce}
                  onChange={setTimeInForce}
                  size="xs"
                />
              </Box>

              {/* Quantity */}
              <Box>
                <Text fontSize="xs" color="whiteAlpha.500" mb={1.5} fontWeight="medium">
                  Quantity
                </Text>
                <QuantityStepper
                  value={totalContracts || 1}
                  onChange={(val) => {
                    // Update first active account's quantity
                    const firstActive = multiAccountTrading.activeAccounts[0];
                    if (firstActive) {
                      multiAccountTrading.setAccountQuantity(firstActive.account_id, val);
                    }
                  }}
                />
              </Box>

              {/* Price inputs (conditional) */}
              {needsPrice && (
                <Box>
                  <Text fontSize="xs" color="whiteAlpha.500" mb={1.5} fontWeight="medium">
                    Limit Price
                  </Text>
                  <Input
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder={formattedPrice}
                    type="number"
                    h="44px"
                    bg="whiteAlpha.100"
                    borderColor="whiteAlpha.200"
                    color="white"
                    fontSize="md"
                    textAlign="center"
                    fontFamily="mono"
                    borderRadius="lg"
                    _focus={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.5)' }}
                    _placeholder={{ color: 'whiteAlpha.400' }}
                  />
                </Box>
              )}

              {needsStop && (
                <Box>
                  <Text fontSize="xs" color="whiteAlpha.500" mb={1.5} fontWeight="medium">
                    Stop Price
                  </Text>
                  <Input
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value)}
                    placeholder="Stop price"
                    type="number"
                    h="44px"
                    bg="whiteAlpha.100"
                    borderColor="whiteAlpha.200"
                    color="white"
                    fontSize="md"
                    textAlign="center"
                    fontFamily="mono"
                    borderRadius="lg"
                    _focus={{ borderColor: 'orange.400', boxShadow: '0 0 0 1px rgba(246, 173, 85, 0.5)' }}
                    _placeholder={{ color: 'whiteAlpha.400' }}
                  />
                </Box>
              )}

              {/* BUY / SELL buttons */}
              <HStack spacing={3} pt={1}>
                <Button
                  flex="1"
                  h="52px"
                  bg="rgba(38, 166, 154, 0.85)"
                  color="white"
                  fontWeight="bold"
                  fontSize="md"
                  _hover={{ bg: 'rgba(38, 166, 154, 1)' }}
                  _active={{ bg: 'rgba(38, 166, 154, 0.6)', transform: 'scale(0.97)' }}
                  isLoading={isSubmitting}
                  isDisabled={!hasActiveAccounts}
                  onClick={() => handleOrder('buy')}
                  borderRadius="xl"
                >
                  BUY
                </Button>
                <Button
                  flex="1"
                  h="52px"
                  bg="rgba(239, 83, 80, 0.85)"
                  color="white"
                  fontWeight="bold"
                  fontSize="md"
                  _hover={{ bg: 'rgba(239, 83, 80, 1)' }}
                  _active={{ bg: 'rgba(239, 83, 80, 0.6)', transform: 'scale(0.97)' }}
                  isLoading={isSubmitting}
                  isDisabled={!hasActiveAccounts}
                  onClick={() => handleOrder('sell')}
                  borderRadius="xl"
                >
                  SELL
                </Button>
              </HStack>

              {/* Flatten + Cancel */}
              {(openPositions.length > 0 || workingOrders.length > 0) && (
                <Button
                  w="100%"
                  h="40px"
                  variant="ghost"
                  color="red.300"
                  fontSize="sm"
                  fontWeight="medium"
                  _hover={{ bg: 'rgba(239, 83, 80, 0.1)' }}
                  _active={{ bg: 'rgba(239, 83, 80, 0.2)' }}
                  isLoading={isFlattening}
                  onClick={handleFlattenAll}
                  borderRadius="lg"
                >
                  Flatten All + Cancel Orders
                </Button>
              )}
            </VStack>
          </MotionBox>
        </>
      )}
    </AnimatePresence>
  );
};

export default memo(MobileOrderTicket);
