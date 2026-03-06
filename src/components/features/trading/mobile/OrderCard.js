import React, { memo, useState, useCallback } from 'react';
import { Box, Flex, HStack, Text, Badge } from '@chakra-ui/react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const MotionBox = motion.create(Box);
const SWIPE_THRESHOLD = -60;
const ACTION_WIDTH = 72;

/**
 * OrderCard — mobile-friendly card with swipe-to-cancel gesture.
 * Swipe left reveals an orange Cancel button behind the card.
 */
const OrderCard = ({ order, onCancel }) => {
  const isBuy = order.action === 'Buy' || order.side === 'buy' || order.side === 1;
  const typeLabel = order.ordType || order.orderType || order.type || 'LIMIT';
  const price = order.price || order.limitPrice || order.stopPrice || 0;
  const qty = order.qty || order.quantity || order.orderQty || 1;
  const nickname = order._accountNickname || order._accountId || '';
  const tif = order.timeInForce || order.tif || 'GTC';

  const x = useMotionValue(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const actionScale = useTransform(x, [-ACTION_WIDTH, 0], [1, 0.5]);
  const actionOpacity = useTransform(x, [-ACTION_WIDTH * 0.5, 0], [1, 0]);

  const handleDragEnd = useCallback((_, info) => {
    if (info.offset.x < SWIPE_THRESHOLD || info.velocity.x < -300) {
      animate(x, -ACTION_WIDTH, { type: 'spring', damping: 30, stiffness: 300 });
      setIsRevealed(true);
    } else {
      animate(x, 0, { type: 'spring', damping: 30, stiffness: 300 });
      setIsRevealed(false);
    }
  }, [x]);

  const handleCancel = useCallback(() => {
    animate(x, 0, { type: 'spring', damping: 30, stiffness: 300 });
    setIsRevealed(false);
    onCancel(order);
  }, [x, onCancel, order]);

  const handleTap = useCallback(() => {
    if (isRevealed) {
      animate(x, 0, { type: 'spring', damping: 30, stiffness: 300 });
      setIsRevealed(false);
    }
  }, [isRevealed, x]);

  return (
    <Box position="relative" overflow="hidden" borderRadius="lg">
      {/* Action behind card */}
      <MotionBox
        position="absolute"
        right={0}
        top={0}
        bottom={0}
        w={`${ACTION_WIDTH}px`}
        bg="orange.500"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="lg"
        style={{ scale: actionScale, opacity: actionOpacity }}
        onClick={handleCancel}
        cursor="pointer"
      >
        <Text fontSize="xs" fontWeight="bold" color="white">Cancel</Text>
      </MotionBox>

      {/* Draggable card */}
      <MotionBox
        bg="whiteAlpha.100"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="whiteAlpha.100"
        px={3}
        py={2.5}
        position="relative"
        overflow="hidden"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onClick={handleTap}
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

        {/* Row 1: Symbol + Side + Type + Account */}
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

        {/* Row 2: Qty + Price + TIF */}
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
        </Flex>
      </MotionBox>
    </Box>
  );
};

export default memo(OrderCard);
