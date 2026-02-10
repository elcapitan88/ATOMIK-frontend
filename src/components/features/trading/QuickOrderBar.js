import React, { memo, useCallback, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Badge,
  Button,
  Select,
  NumberInput,
  NumberInputField,
  Tooltip,
  useToast,
} from '@chakra-ui/react';

/**
 * QuickOrderBar — thin horizontal bar between chart and bottom panel.
 *
 * Displays: ticker badge, total qty / active accounts, order type dropdown,
 * BUY / SELL buttons, optional inline price input for limit/stop orders.
 *
 * Props:
 *   chartSymbol        - current chart symbol (e.g. 'NQ')
 *   multiAccountTrading - return from useMultiAccountTrading hook
 */
const QuickOrderBar = ({ chartSymbol, multiAccountTrading }) => {
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
    placeMultiAccountOrder,
    isSubmitting,
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
      });
    },
    [hasActiveAccounts, orderType, limitPrice, stopPrice, symbol, placeMultiAccountOrder, needsPrice, needsStop, toast]
  );

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
      <Flex align="center" justify="space-between" gap={3}>
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

          <Text fontSize="xs" color="whiteAlpha.500">
            {hasActiveAccounts
              ? `${totalContracts} ct${totalContracts !== 1 ? 's' : ''} / ${activeCount} acct${activeCount !== 1 ? 's' : ''}`
              : 'No accounts active'}
          </Text>
        </HStack>

        {/* Center: Order Type + Price Inputs + Buy/Sell */}
        <HStack spacing={2} flex="1" justify="center">
          <Select
            size="xs"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            bg="whiteAlpha.100"
            borderColor="whiteAlpha.200"
            color="white"
            w="100px"
            _focus={{ borderColor: 'cyan.400' }}
          >
            <option value="MARKET" style={{ background: '#1a1a2e' }}>Market</option>
            <option value="LIMIT" style={{ background: '#1a1a2e' }}>Limit</option>
            <option value="STOP" style={{ background: '#1a1a2e' }}>Stop</option>
            <option value="STOP_LIMIT" style={{ background: '#1a1a2e' }}>Stop Limit</option>
          </Select>

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

        {/* Right: Spacer to balance layout */}
        <Box w="100px" flexShrink={0} />
      </Flex>
    </Box>
  );
};

export default memo(QuickOrderBar);
