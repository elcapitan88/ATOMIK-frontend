import React, { memo } from 'react';
import { Box, Flex, HStack, Text, Badge, Button } from '@chakra-ui/react';
import { TrendingUp, TrendingDown, X } from 'lucide-react';

/**
 * PositionCard — mobile-friendly card layout for an open position.
 * Replaces the table row from PositionsTab on mobile.
 */
const PositionCard = ({ position, onClose }) => {
  const isLong = position.side === 'LONG' || (position.netPos && position.netPos > 0);
  const qty = position.quantity || Math.abs(position.netPos || 0);
  const pnl = position.unrealizedPnL || 0;
  const nickname = position._accountNickname || position._accountId || '';
  const entryPrice = position.avgPrice || 0;
  const isPnlPositive = pnl >= 0;

  return (
    <Box
      bg="whiteAlpha.100"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      px={3}
      py={2.5}
      position="relative"
      overflow="hidden"
      _active={{ bg: 'whiteAlpha.150' }}
    >
      {/* Left accent stripe */}
      <Box
        position="absolute"
        left={0}
        top="6px"
        bottom="6px"
        w="3px"
        borderRadius="full"
        bg={isLong ? 'green.400' : 'red.400'}
      />

      {/* Row 1: Symbol + Side + Account */}
      <Flex align="center" justify="space-between" mb={1.5}>
        <HStack spacing={2}>
          <Text fontSize="sm" fontWeight="bold" color="white">
            {position.symbol}
          </Text>
          <Badge
            fontSize="9px"
            colorScheme={isLong ? 'green' : 'red'}
            variant="subtle"
          >
            {isLong ? 'LONG' : 'SHORT'}
          </Badge>
        </HStack>
        <Text fontSize="xs" color="whiteAlpha.500" noOfLines={1} maxW="120px" textAlign="right">
          {nickname}
        </Text>
      </Flex>

      {/* Row 2: Qty + Entry + P&L + Close */}
      <Flex align="center" justify="space-between">
        <HStack spacing={3}>
          <HStack spacing={1}>
            <Text fontSize="xs" color="whiteAlpha.500">Qty</Text>
            <Text fontSize="xs" color="white" fontWeight="medium">{qty}</Text>
          </HStack>
          <HStack spacing={1}>
            <Text fontSize="xs" color="whiteAlpha.500">@</Text>
            <Text fontSize="xs" color="whiteAlpha.700" fontFamily="mono">
              {entryPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </HStack>
        </HStack>

        <HStack spacing={2}>
          <HStack spacing={1}>
            {isPnlPositive ? (
              <TrendingUp size={11} color="#48bb78" />
            ) : (
              <TrendingDown size={11} color="#ef5350" />
            )}
            <Text
              fontSize="xs"
              fontWeight="bold"
              color={isPnlPositive ? 'green.400' : 'red.400'}
              fontFamily="mono"
            >
              {isPnlPositive ? '+' : ''}${pnl.toFixed(2)}
            </Text>
          </HStack>

          <Button
            size="xs"
            variant="ghost"
            color="whiteAlpha.500"
            _hover={{ color: 'red.400', bg: 'whiteAlpha.100' }}
            _active={{ bg: 'whiteAlpha.200' }}
            onClick={(e) => {
              e.stopPropagation();
              onClose(position);
            }}
            minW="auto"
            h="28px"
            px={2}
          >
            <X size={14} />
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};

export default memo(PositionCard);
