import React, { memo, useState, useCallback, useRef } from 'react';
import { Box, Flex, HStack, Text, Badge, Portal } from '@chakra-ui/react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, X, Percent, XCircle } from 'lucide-react';

const MotionBox = motion.create(Box);
const SWIPE_THRESHOLD = -60;
const ACTION_WIDTH = 72;
const LONG_PRESS_DURATION = 500;

/**
 * PositionCard — mobile-friendly card with swipe-to-close gesture
 * and long-press quick action menu (Close 50%, Close All).
 */
const PositionCard = ({ position, onClose, onPartialClose }) => {
  const isLong = position.side === 'LONG' || (position.netPos && position.netPos > 0);
  const qty = position.quantity || Math.abs(position.netPos || 0);
  const pnl = position.unrealizedPnL || 0;
  const nickname = position._accountNickname || position._accountId || '';
  const entryPrice = position.avgPrice || 0;
  const isPnlPositive = pnl >= 0;

  const x = useMotionValue(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const longPressTimer = useRef(null);
  const didLongPress = useRef(false);

  // Scale the action button based on drag distance
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

  const handleClose = useCallback(() => {
    animate(x, 0, { type: 'spring', damping: 30, stiffness: 300 });
    setIsRevealed(false);
    onClose(position);
  }, [x, onClose, position]);

  const handleTap = useCallback(() => {
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    if (isRevealed) {
      animate(x, 0, { type: 'spring', damping: 30, stiffness: 300 });
      setIsRevealed(false);
    }
  }, [isRevealed, x]);

  // Long-press handlers
  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setShowQuickActions(true);
    }, LONG_PRESS_DURATION);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleDragStart = useCallback(() => {
    // Cancel long-press if user starts dragging
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <>
      <Box position="relative" overflow="hidden" borderRadius="lg">
        {/* Action behind card */}
        <MotionBox
          position="absolute"
          right={0}
          top={0}
          bottom={0}
          w={`${ACTION_WIDTH}px`}
          bg="red.500"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="lg"
          style={{ scale: actionScale, opacity: actionOpacity }}
          onClick={handleClose}
          cursor="pointer"
        >
          <Text fontSize="xs" fontWeight="bold" color="white">Close</Text>
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
          onDragStart={handleDragStart}
          onClick={handleTap}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
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

          {/* Row 2: Qty + Entry + P&L */}
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
          </Flex>
        </MotionBox>
      </Box>

      {/* Quick Actions Overlay (long-press) */}
      <AnimatePresence>
        {showQuickActions && (
          <Portal>
            {/* Backdrop */}
            <MotionBox
              position="fixed"
              inset={0}
              bg="blackAlpha.600"
              zIndex={1100}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickActions(false)}
            />
            {/* Action sheet */}
            <MotionBox
              position="fixed"
              left={3}
              right={3}
              bottom={`calc(160px + env(safe-area-inset-bottom, 0px))`}
              zIndex={1101}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <Box
                bg="rgba(25, 25, 25, 0.97)"
                backdropFilter="blur(20px)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                overflow="hidden"
              >
                {/* Header */}
                <Flex px={4} py={3} borderBottom="1px solid" borderColor="whiteAlpha.100" align="center" justify="space-between">
                  <HStack spacing={2}>
                    <Text fontSize="sm" fontWeight="bold" color="white">{position.symbol}</Text>
                    <Badge fontSize="9px" colorScheme={isLong ? 'green' : 'red'} variant="subtle">
                      {isLong ? 'LONG' : 'SHORT'} {qty}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" fontWeight="bold" color={isPnlPositive ? 'green.400' : 'red.400'} fontFamily="mono">
                    {isPnlPositive ? '+' : ''}${pnl.toFixed(2)}
                  </Text>
                </Flex>

                {/* Actions */}
                {onPartialClose && qty > 1 && (
                  <Flex
                    px={4}
                    py={3}
                    align="center"
                    cursor="pointer"
                    _hover={{ bg: 'whiteAlpha.100' }}
                    _active={{ bg: 'whiteAlpha.200' }}
                    onClick={() => {
                      setShowQuickActions(false);
                      onPartialClose(position, 0.5);
                    }}
                    borderBottom="1px solid"
                    borderColor="whiteAlpha.100"
                  >
                    <HStack spacing={3}>
                      <Percent size={16} color="#f6ad55" />
                      <Text fontSize="sm" color="white">Close 50%</Text>
                    </HStack>
                    <Text fontSize="xs" color="whiteAlpha.400" ml="auto">
                      {Math.floor(qty / 2)} contract{Math.floor(qty / 2) !== 1 ? 's' : ''}
                    </Text>
                  </Flex>
                )}

                <Flex
                  px={4}
                  py={3}
                  align="center"
                  cursor="pointer"
                  _hover={{ bg: 'whiteAlpha.100' }}
                  _active={{ bg: 'whiteAlpha.200' }}
                  onClick={() => {
                    setShowQuickActions(false);
                    onClose(position);
                  }}
                >
                  <HStack spacing={3}>
                    <XCircle size={16} color="#ef5350" />
                    <Text fontSize="sm" color="red.300">Close All</Text>
                  </HStack>
                  <Text fontSize="xs" color="whiteAlpha.400" ml="auto">
                    {qty} contract{qty !== 1 ? 's' : ''}
                  </Text>
                </Flex>
              </Box>

              {/* Cancel button */}
              <Box
                mt={2}
                bg="rgba(25, 25, 25, 0.97)"
                backdropFilter="blur(20px)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                px={4}
                py={3}
                textAlign="center"
                cursor="pointer"
                _hover={{ bg: 'whiteAlpha.100' }}
                _active={{ bg: 'whiteAlpha.200' }}
                onClick={() => setShowQuickActions(false)}
              >
                <Text fontSize="sm" fontWeight="semibold" color="whiteAlpha.700">Cancel</Text>
              </Box>
            </MotionBox>
          </Portal>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(PositionCard);
