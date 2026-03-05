import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  Input,
  useToast,
} from '@chakra-ui/react';
import axiosInstance from '@/services/axiosConfig';
import { roundToTick, getTickSize, normalizeSymbol } from '@/hooks/useChartTrading';
import { getContractTicker } from '@/utils/formatting/tickerUtils';

const QUICK_OFFSETS = [10, 25, 50, 100];

/**
 * MobileBracketInputs — numeric bracket order form for mobile.
 *
 * Three price inputs (Entry, TP, SL) + side selector + quick offset presets.
 * Places bracket orders via the same API as desktop useBracketPlacement.
 */
const MobileBracketInputs = ({
  chartSymbol,
  chartCurrentPrice,
  multiAccountTrading,
  timeInForce = 'GTC',
}) => {
  const toast = useToast();
  const symbol = normalizeSymbol(chartSymbol || 'NQ');
  const tickSize = getTickSize(symbol);

  const [side, setSide] = useState('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [selectedOffset, setSelectedOffset] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { activeAccounts, activeCount, totalContracts } = multiAccountTrading;
  const hasActiveAccounts = activeCount > 0;

  // Auto-fill entry price with current market price
  useEffect(() => {
    if (chartCurrentPrice && !entryPrice) {
      setEntryPrice(String(roundToTick(chartCurrentPrice, symbol)));
    }
  }, [chartCurrentPrice, symbol]); // intentionally not including entryPrice to avoid resetting user edits

  // Apply quick offset
  const handleQuickOffset = useCallback(
    (offset) => {
      const entry = parseFloat(entryPrice);
      if (isNaN(entry)) {
        toast({ title: 'Set an entry price first', status: 'warning', duration: 2000 });
        return;
      }

      const tickOffset = tickSize * offset;
      const isBuy = side === 'BUY';

      setTpPrice(String(roundToTick(isBuy ? entry + tickOffset : entry - tickOffset, symbol)));
      setSlPrice(String(roundToTick(isBuy ? entry - tickOffset : entry + tickOffset, symbol)));
      setSelectedOffset(offset);
    },
    [entryPrice, side, tickSize, symbol, toast]
  );

  // When side changes, swap TP/SL if they exist
  const handleSideChange = useCallback(
    (newSide) => {
      if (newSide === side) return;
      setSide(newSide);

      // Swap TP and SL
      if (tpPrice && slPrice) {
        const oldTp = tpPrice;
        setTpPrice(slPrice);
        setSlPrice(oldTp);
      }
    },
    [side, tpPrice, slPrice]
  );

  // Submit bracket order
  const handleSubmit = useCallback(async () => {
    if (!hasActiveAccounts) {
      toast({ title: 'No Active Accounts', description: 'Toggle at least one account ON.', status: 'warning', duration: 3000 });
      return;
    }

    const entry = parseFloat(entryPrice);
    const tp = parseFloat(tpPrice);
    const sl = parseFloat(slPrice);

    if (isNaN(entry)) {
      toast({ title: 'Enter an entry price', status: 'warning', duration: 2000 });
      return;
    }
    if (isNaN(tp)) {
      toast({ title: 'Enter a take profit price', status: 'warning', duration: 2000 });
      return;
    }
    if (isNaN(sl)) {
      toast({ title: 'Enter a stop loss price', status: 'warning', duration: 2000 });
      return;
    }

    // Validate TP/SL logic
    const isBuy = side === 'BUY';
    if (isBuy && tp <= entry) {
      toast({ title: 'TP must be above entry for BUY', status: 'warning', duration: 2000 });
      return;
    }
    if (isBuy && sl >= entry) {
      toast({ title: 'SL must be below entry for BUY', status: 'warning', duration: 2000 });
      return;
    }
    if (!isBuy && tp >= entry) {
      toast({ title: 'TP must be below entry for SELL', status: 'warning', duration: 2000 });
      return;
    }
    if (!isBuy && sl <= entry) {
      toast({ title: 'SL must be above entry for SELL', status: 'warning', duration: 2000 });
      return;
    }

    setIsSubmitting(true);
    const contractSymbol = getContractTicker(symbol);

    const promises = activeAccounts.map((acct) =>
      axiosInstance
        .post(`/api/v1/brokers/accounts/${acct.account_id}/discretionary/bracket-order`, {
          symbol: contractSymbol,
          side: side.toLowerCase(),
          quantity: acct.quantity,
          entry_price: roundToTick(entry, symbol),
          tp_price: roundToTick(tp, symbol),
          sl_price: roundToTick(sl, symbol),
          entry_type: 'LIMIT',
          time_in_force: timeInForce,
        })
        .catch((err) => ({ _error: true, acct: acct.account_id, err }))
    );

    try {
      const results = await Promise.all(promises);
      const failures = results.filter((r) => r && r._error);

      if (failures.length > 0) {
        const succeeded = results.length - failures.length;
        toast({
          title: 'Bracket partially placed',
          description: `${succeeded} of ${results.length} succeeded.`,
          status: 'warning',
          duration: 4000,
        });
      } else {
        toast({
          title: 'Bracket placed',
          description: `Bracket on ${activeAccounts.length} account${activeAccounts.length > 1 ? 's' : ''}. TP/SL auto-linked.`,
          status: 'success',
          duration: 3000,
        });
        // Reset form
        setTpPrice('');
        setSlPrice('');
        setSelectedOffset(null);
      }
    } catch (err) {
      toast({
        title: 'Bracket order failed',
        description: err?.response?.data?.detail || err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [hasActiveAccounts, entryPrice, tpPrice, slPrice, side, activeAccounts, symbol, timeInForce, toast]);

  const formattedPrice = chartCurrentPrice
    ? chartCurrentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '---';

  return (
    <VStack spacing={3} align="stretch">
      {/* Side Selector */}
      <Box>
        <Text fontSize="xs" color="whiteAlpha.500" mb={1.5} fontWeight="medium">
          Side
        </Text>
        <HStack spacing={0} bg="whiteAlpha.100" borderRadius="lg" p={0.5} w="100%">
          <Button
            flex="1"
            size="sm"
            h="40px"
            fontSize="sm"
            fontWeight={side === 'BUY' ? 'bold' : 'normal'}
            bg={side === 'BUY' ? 'rgba(38, 166, 154, 0.6)' : 'transparent'}
            color={side === 'BUY' ? 'white' : 'whiteAlpha.600'}
            borderRadius="md"
            _hover={{ bg: side === 'BUY' ? 'rgba(38, 166, 154, 0.6)' : 'whiteAlpha.100' }}
            _active={{ bg: 'rgba(38, 166, 154, 0.4)' }}
            onClick={() => handleSideChange('BUY')}
          >
            BUY
          </Button>
          <Button
            flex="1"
            size="sm"
            h="40px"
            fontSize="sm"
            fontWeight={side === 'SELL' ? 'bold' : 'normal'}
            bg={side === 'SELL' ? 'rgba(239, 83, 80, 0.6)' : 'transparent'}
            color={side === 'SELL' ? 'white' : 'whiteAlpha.600'}
            borderRadius="md"
            _hover={{ bg: side === 'SELL' ? 'rgba(239, 83, 80, 0.6)' : 'whiteAlpha.100' }}
            _active={{ bg: 'rgba(239, 83, 80, 0.4)' }}
            onClick={() => handleSideChange('SELL')}
          >
            SELL
          </Button>
        </HStack>
      </Box>

      {/* Entry Price */}
      <Box>
        <Flex justify="space-between" align="center" mb={1.5}>
          <Text fontSize="xs" color="whiteAlpha.500" fontWeight="medium">
            Entry Price
          </Text>
          <Text fontSize="10px" color="whiteAlpha.400" fontFamily="mono">
            Mkt: {formattedPrice}
          </Text>
        </Flex>
        <Input
          value={entryPrice}
          onChange={(e) => setEntryPrice(e.target.value)}
          placeholder={formattedPrice}
          type="number"
          step={tickSize}
          h="44px"
          bg="whiteAlpha.100"
          borderColor="whiteAlpha.200"
          color="white"
          fontSize="md"
          textAlign="center"
          fontFamily="mono"
          borderRadius="lg"
          _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px rgba(124, 58, 237, 0.5)' }}
          _placeholder={{ color: 'whiteAlpha.400' }}
        />
      </Box>

      {/* Quick Offset Presets */}
      <Box>
        <Text fontSize="xs" color="whiteAlpha.500" mb={1.5} fontWeight="medium">
          TP/SL Offset (ticks)
        </Text>
        <HStack spacing={2}>
          {QUICK_OFFSETS.map((offset) => (
            <Button
              key={offset}
              flex="1"
              size="sm"
              h="36px"
              fontSize="xs"
              fontWeight={selectedOffset === offset ? 'bold' : 'normal'}
              bg={selectedOffset === offset ? 'purple.600' : 'whiteAlpha.100'}
              color={selectedOffset === offset ? 'white' : 'whiteAlpha.700'}
              borderRadius="md"
              _hover={{ bg: selectedOffset === offset ? 'purple.500' : 'whiteAlpha.200' }}
              _active={{ bg: 'whiteAlpha.300' }}
              onClick={() => handleQuickOffset(offset)}
            >
              +/-{offset}
            </Button>
          ))}
        </HStack>
      </Box>

      {/* Take Profit */}
      <Box>
        <Text fontSize="xs" color="green.400" mb={1.5} fontWeight="medium">
          Take Profit
        </Text>
        <Input
          value={tpPrice}
          onChange={(e) => { setTpPrice(e.target.value); setSelectedOffset(null); }}
          placeholder="TP price"
          type="number"
          step={tickSize}
          h="44px"
          bg="whiteAlpha.100"
          borderColor="whiteAlpha.200"
          color="white"
          fontSize="md"
          textAlign="center"
          fontFamily="mono"
          borderRadius="lg"
          _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 1px rgba(72, 187, 120, 0.5)' }}
          _placeholder={{ color: 'whiteAlpha.400' }}
        />
      </Box>

      {/* Stop Loss */}
      <Box>
        <Text fontSize="xs" color="red.400" mb={1.5} fontWeight="medium">
          Stop Loss
        </Text>
        <Input
          value={slPrice}
          onChange={(e) => { setSlPrice(e.target.value); setSelectedOffset(null); }}
          placeholder="SL price"
          type="number"
          step={tickSize}
          h="44px"
          bg="whiteAlpha.100"
          borderColor="whiteAlpha.200"
          color="white"
          fontSize="md"
          textAlign="center"
          fontFamily="mono"
          borderRadius="lg"
          _focus={{ borderColor: 'red.400', boxShadow: '0 0 0 1px rgba(245, 101, 101, 0.5)' }}
          _placeholder={{ color: 'whiteAlpha.400' }}
        />
      </Box>

      {/* Account summary */}
      <Text fontSize="10px" color="whiteAlpha.400" textAlign="center">
        {hasActiveAccounts
          ? `${totalContracts} ct${totalContracts !== 1 ? 's' : ''} across ${activeCount} account${activeCount !== 1 ? 's' : ''}`
          : 'No accounts active'}
      </Text>

      {/* Place Bracket Button */}
      <Button
        w="100%"
        h="52px"
        bg={side === 'BUY' ? 'rgba(38, 166, 154, 0.85)' : 'rgba(239, 83, 80, 0.85)'}
        color="white"
        fontWeight="bold"
        fontSize="md"
        _hover={{ bg: side === 'BUY' ? 'rgba(38, 166, 154, 1)' : 'rgba(239, 83, 80, 1)' }}
        _active={{ transform: 'scale(0.97)' }}
        isLoading={isSubmitting}
        isDisabled={!hasActiveAccounts}
        onClick={handleSubmit}
        borderRadius="xl"
      >
        {side} BRACKET
      </Button>
    </VStack>
  );
};

export default memo(MobileBracketInputs);
