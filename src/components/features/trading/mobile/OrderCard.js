import React, { memo } from 'react';
import { Box, Flex, HStack, Text, Badge, Button } from '@chakra-ui/react';
import { X } from 'lucide-react';

/**
 * OrderCard — mobile-friendly card layout for a working order.
 * Replaces the table row from OrdersTab on mobile.
 */
const OrderCard = ({ order, onCancel }) => {
  const isBuy = order.action === 'Buy' || order.side === 'buy' || order.side === 1;
  const typeLabel = order.ordType || order.orderType || order.type || 'LIMIT';
  const price = order.price || order.limitPrice || order.stopPrice || 0;
  const qty = order.qty || order.quantity || order.orderQty || 1;
  const nickname = order._accountNickname || order._accountId || '';
  const tif = order.timeInForce || order.tif || 'GTC';

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
        bg={isBuy ? 'green.400' : 'red.400'}
      />

      {/* Row 1: Symbol + Side + Account */}
      <Flex align="center" justify="space-between" mb={1.5}>
        <HStack spacing={2}>
          <Text fontSize="sm" fontWeight="bold" color="white">
            {order.symbol}
          </Text>
          <Badge
            fontSize="9px"
            colorScheme={isBuy ? 'green' : 'red'}
            variant="subtle"
          >
            {isBuy ? 'BUY' : 'SELL'}
          </Badge>
          <Badge
            fontSize="8px"
            bg="whiteAlpha.200"
            color="whiteAlpha.700"
            variant="subtle"
          >
            {typeLabel}
          </Badge>
        </HStack>
        <Text fontSize="xs" color="whiteAlpha.500" noOfLines={1} maxW="120px" textAlign="right">
          {nickname}
        </Text>
      </Flex>

      {/* Row 2: Qty + Price + TIF + Cancel */}
      <Flex align="center" justify="space-between">
        <HStack spacing={3}>
          <HStack spacing={1}>
            <Text fontSize="xs" color="whiteAlpha.500">Qty</Text>
            <Text fontSize="xs" color="white" fontWeight="medium">{qty}</Text>
          </HStack>
          <HStack spacing={1}>
            <Text fontSize="xs" color="whiteAlpha.500">@</Text>
            <Text fontSize="xs" color="whiteAlpha.700" fontFamily="mono">
              {price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </HStack>
          <Text fontSize="9px" color="whiteAlpha.400">{tif}</Text>
        </HStack>

        <Button
          size="xs"
          variant="ghost"
          color="whiteAlpha.500"
          _hover={{ color: 'red.400', bg: 'whiteAlpha.100' }}
          _active={{ bg: 'whiteAlpha.200' }}
          onClick={(e) => {
            e.stopPropagation();
            onCancel(order);
          }}
          minW="auto"
          h="28px"
          px={2}
        >
          <X size={14} />
        </Button>
      </Flex>
    </Box>
  );
};

export default memo(OrderCard);
