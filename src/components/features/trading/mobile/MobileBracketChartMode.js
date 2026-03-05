import React, { memo } from 'react';
import { Box, Flex, HStack, Text, Button, Badge } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Crosshair } from 'lucide-react';
import { formatPrice } from '@/hooks/useChartTrading';

const MotionBox = motion.create(Box);

const BOTTOM_NAV_HEIGHT = 64;
const ACTION_BAR_HEIGHT = 80;

/**
 * MobileBracketChartMode — floating UI for chart-based bracket placement.
 *
 * Two states:
 *   1. Awaiting tap: "Tap chart to set entry price" instruction banner
 *   2. Lines placed: Shows entry/TP/SL prices + Confirm/Cancel buttons
 *
 * Renders above the action bar, replaces the bottom sheet visually.
 */
const MobileBracketChartMode = ({
  isActive,
  bracketPlacement,
  onConfirm,
  onCancel,
}) => {
  if (!isActive || !bracketPlacement) return null;

  const { isPlaced, entryPrice, tpPrice, slPrice, side, symbol, isSubmitting } = bracketPlacement;
  const isAwaiting = bracketPlacement.isActive && !isPlaced;

  return (
    <AnimatePresence>
      {isActive && (
        <MotionBox
          position="fixed"
          left={0}
          right={0}
          bottom={`${BOTTOM_NAV_HEIGHT + ACTION_BAR_HEIGHT}px`}
          zIndex={998}
          px={3}
          pb={2}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <Box
            bg="rgba(15, 15, 15, 0.95)"
            backdropFilter="blur(20px)"
            borderRadius="xl"
            border="1px solid"
            borderColor="purple.800"
            px={4}
            py={3}
            boxShadow="0 -4px 20px rgba(124, 58, 237, 0.15)"
          >
            {isAwaiting ? (
              /* State 1: Awaiting tap */
              <Flex align="center" justify="space-between">
                <HStack spacing={2}>
                  <Crosshair size={16} color="#a78bfa" />
                  <Text fontSize="sm" color="whiteAlpha.800" fontWeight="medium">
                    Tap chart to set entry price
                  </Text>
                </HStack>
                <Button
                  size="sm"
                  variant="ghost"
                  color="whiteAlpha.500"
                  _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                  onClick={onCancel}
                  leftIcon={<X size={14} />}
                  fontSize="xs"
                >
                  Cancel
                </Button>
              </Flex>
            ) : isPlaced ? (
              /* State 2: Lines placed — show prices + confirm/cancel */
              <>
                {/* Price summary */}
                <Flex align="center" justify="space-between" mb={3}>
                  <HStack spacing={3}>
                    <Badge
                      bg={side === 'BUY' ? 'rgba(38, 166, 154, 0.6)' : 'rgba(239, 83, 80, 0.6)'}
                      color="white"
                      fontSize="xs"
                      fontWeight="bold"
                      px={2}
                      py={0.5}
                      borderRadius="md"
                    >
                      {side} BRACKET
                    </Badge>
                  </HStack>
                  <Text fontSize="10px" color="whiteAlpha.400">
                    Drag lines to adjust
                  </Text>
                </Flex>

                {/* Price labels */}
                <HStack spacing={3} mb={3}>
                  <Box flex="1" textAlign="center">
                    <Text fontSize="9px" color="whiteAlpha.500" textTransform="uppercase" mb={0.5}>
                      Entry
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="white" fontFamily="mono">
                      ${formatPrice(entryPrice, symbol)}
                    </Text>
                  </Box>
                  <Box flex="1" textAlign="center">
                    <Text fontSize="9px" color="green.400" textTransform="uppercase" mb={0.5}>
                      TP
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="green.300" fontFamily="mono">
                      ${formatPrice(tpPrice, symbol)}
                    </Text>
                  </Box>
                  <Box flex="1" textAlign="center">
                    <Text fontSize="9px" color="red.400" textTransform="uppercase" mb={0.5}>
                      SL
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="red.300" fontFamily="mono">
                      ${formatPrice(slPrice, symbol)}
                    </Text>
                  </Box>
                </HStack>

                {/* Confirm / Cancel */}
                <HStack spacing={3}>
                  <Button
                    flex="1"
                    h="44px"
                    variant="ghost"
                    color="whiteAlpha.600"
                    borderWidth="1px"
                    borderColor="whiteAlpha.200"
                    _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                    _active={{ bg: 'whiteAlpha.200' }}
                    onClick={onCancel}
                    borderRadius="lg"
                    leftIcon={<X size={16} />}
                    fontSize="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    flex="1"
                    h="44px"
                    bg={side === 'BUY' ? 'rgba(38, 166, 154, 0.85)' : 'rgba(239, 83, 80, 0.85)'}
                    color="white"
                    fontWeight="bold"
                    fontSize="sm"
                    _hover={{ opacity: 1 }}
                    _active={{ transform: 'scale(0.97)' }}
                    isLoading={isSubmitting}
                    onClick={onConfirm}
                    borderRadius="lg"
                    leftIcon={<Check size={16} />}
                  >
                    Confirm
                  </Button>
                </HStack>
              </>
            ) : null}
          </Box>
        </MotionBox>
      )}
    </AnimatePresence>
  );
};

export default memo(MobileBracketChartMode);
