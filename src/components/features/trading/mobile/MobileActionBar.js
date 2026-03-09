import React, { memo, useCallback, useMemo } from 'react';
import { Box, Flex, HStack, Text, Badge, Button, Skeleton, useToast } from '@chakra-ui/react';
import { ChevronUp, Crosshair } from 'lucide-react';

const BOTTOM_NAV_HEIGHT = 64;

/**
 * MobileActionBar — compact floating bar pinned above the bottom sheet.
 *
 * Shows: symbol + live price | BUY / SELL | expand chevron
 * Second row: total contracts + open P&L
 */
const MobileActionBar = ({
  chartSymbol,
  chartCurrentPrice,
  multiAccountTrading,
  positions = [],
  copyTrading,
  onExpandOrderTicket,
  isBracketChartMode = false,
  autoBracket,
}) => {
  const toast = useToast();
  const {
    activeAccounts,
    activeCount,
    totalContracts,
    placeMultiAccountOrder,
    isSubmitting,
  } = multiAccountTrading;

  const symbol = chartSymbol || 'NQ';
  const hasActiveAccounts = activeCount > 0;

  // Calculate total open P&L
  const totalOpenPnL = useMemo(() => {
    return positions
      .filter((p) => p && !p.isClosed && p.side !== 'FLAT' && (p.quantity > 0 || Math.abs(p.netPos || 0) > 0))
      .reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0);
  }, [positions]);

  // Copy trading summary
  const copyInfo = useMemo(() => {
    if (!copyTrading?.getCopyInfo) return null;
    const leaderAcct = activeAccounts.find(
      (a) => copyTrading.getCopyInfo(a.account_id)?.mode === 'copy-leader'
    );
    if (!leaderAcct) return null;
    const info = copyTrading.getCopyInfo(leaderAcct.account_id);
    return {
      leaderName: leaderAcct.nickname || leaderAcct.name || leaderAcct.account_id,
      followerCount: info.followerCount || 0,
    };
  }, [activeAccounts, copyTrading]);

  // Quick market order
  const handleQuickOrder = useCallback(
    async (side) => {
      if (!hasActiveAccounts) {
        toast({
          title: 'No Active Accounts',
          description: 'Toggle at least one account ON.',
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      await placeMultiAccountOrder({
        side,
        type: 'MARKET',
        symbol,
        timeInForce: 'GTC',
      });
    },
    [hasActiveAccounts, placeMultiAccountOrder, symbol, toast]
  );

  const pnlColor = totalOpenPnL >= 0 ? 'green.400' : 'red.400';
  const pnlPrefix = totalOpenPnL >= 0 ? '+' : '';
  const formattedPrice = chartCurrentPrice
    ? chartCurrentPrice.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '—';

  return (
    <Box
      position="fixed"
      left={0}
      right={0}
      bottom={`calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`}
      zIndex={1000}
      px={3}
      pb={2}
      pt={2}
      bg="rgba(10, 10, 10, 0.9)"
      backdropFilter="blur(16px)"
      borderTop="1px solid"
      borderColor="whiteAlpha.100"
    >
      {/* Row 1: Symbol + Price + BUY/SELL + Expand */}
      <Flex align="center" gap={2}>
        {/* Symbol + Price */}
        <Box flex="0 0 auto" minW="0">
          <HStack spacing={1.5}>
            <Badge
              bg="whiteAlpha.200"
              color="white"
              fontSize="xs"
              fontWeight="bold"
              px={1.5}
              py={0.5}
              borderRadius="md"
            >
              {symbol}
            </Badge>
            {chartCurrentPrice ? (
              <Text fontSize="xs" color="whiteAlpha.700" fontFamily="mono">
                {formattedPrice}
              </Text>
            ) : (
              <Skeleton h="14px" w="65px" startColor="#333" endColor="#555" borderRadius="md" />
            )}
          </HStack>
        </Box>

        {/* BUY / SELL buttons (or bracket mode indicator) */}
        <HStack spacing={2} flex="1" justify="center">
          {isBracketChartMode ? (
            <Flex
              flex="1"
              h="44px"
              align="center"
              justify="center"
              bg="rgba(124, 58, 237, 0.2)"
              border="1px solid"
              borderColor="purple.600"
              borderRadius="lg"
              gap={2}
            >
              <Crosshair size={16} color="#a78bfa" />
              <Text fontSize="sm" fontWeight="bold" color="purple.300">
                Bracket Mode
              </Text>
            </Flex>
          ) : (
            <>
              <Button
                flex="1"
                h="44px"
                bg="rgba(38, 166, 154, 0.85)"
                color="white"
                fontWeight="bold"
                fontSize="sm"
                _hover={{ bg: 'rgba(38, 166, 154, 1)' }}
                _active={{ bg: 'rgba(38, 166, 154, 0.6)', transform: 'scale(0.97)' }}
                isLoading={isSubmitting}
                isDisabled={!hasActiveAccounts}
                onClick={() => handleQuickOrder('buy')}
                borderRadius="lg"
              >
                BUY
              </Button>
              <Button
                flex="1"
                h="44px"
                bg="rgba(239, 83, 80, 0.85)"
                color="white"
                fontWeight="bold"
                fontSize="sm"
                _hover={{ bg: 'rgba(239, 83, 80, 1)' }}
                _active={{ bg: 'rgba(239, 83, 80, 0.6)', transform: 'scale(0.97)' }}
                isLoading={isSubmitting}
                isDisabled={!hasActiveAccounts}
                onClick={() => handleQuickOrder('sell')}
                borderRadius="lg"
              >
                SELL
              </Button>
            </>
          )}
        </HStack>

        {/* Expand to order ticket */}
        <Button
          minW="auto"
          h="44px"
          w="44px"
          variant="ghost"
          color="whiteAlpha.600"
          _hover={{ color: 'cyan.400', bg: 'whiteAlpha.100' }}
          _active={{ bg: 'whiteAlpha.200' }}
          onClick={onExpandOrderTicket}
          borderRadius="lg"
          p={0}
        >
          <ChevronUp size={20} />
        </Button>
      </Flex>

      {/* Row 2: Summary info */}
      <Flex align="center" justify="space-between" mt={1} px={1}>
        <HStack spacing={1.5}>
          <Text fontSize="10px" color="whiteAlpha.500">
            {!hasActiveAccounts
              ? 'No accounts active'
              : copyInfo
              ? `${totalContracts} ct${totalContracts !== 1 ? 's' : ''} on ${copyInfo.leaderName} → ${copyInfo.followerCount} follower${copyInfo.followerCount !== 1 ? 's' : ''}`
              : `${totalContracts} ct${totalContracts !== 1 ? 's' : ''} / ${activeCount} acct${activeCount !== 1 ? 's' : ''}`}
          </Text>
          {autoBracket?.enabled && (
            <Badge
              bg="rgba(251, 146, 60, 0.3)"
              color="orange.300"
              fontSize="8px"
              px={1.5}
              py={0}
              borderRadius="full"
              fontWeight="bold"
            >
              AB
            </Badge>
          )}
        </HStack>
        <Text fontSize="10px" fontWeight="bold" color={pnlColor}>
          {pnlPrefix}${Math.abs(totalOpenPnL).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} open P&L
        </Text>
      </Flex>
    </Box>
  );
};

export default memo(MobileActionBar);
