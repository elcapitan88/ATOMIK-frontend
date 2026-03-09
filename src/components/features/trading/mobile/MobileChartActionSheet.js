import React, { memo } from 'react';
import { Box, Flex, VStack, Text, Button, Badge } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

const BOTTOM_NAV_HEIGHT = 64;

/**
 * MobileChartActionSheet — action sheet triggered by long-press on chart.
 *
 * Shows order options at the long-pressed price, including auto-bracket
 * stop orders when enabled.
 */
const MobileChartActionSheet = ({
  isOpen,
  onClose,
  price,
  formattedPrice,
  onPlaceOrder,
  onAutoBracketOrder,
  autoBracket,
  hasActiveAccounts,
}) => {
  const abEnabled = autoBracket?.enabled;
  const abLabel = abEnabled
    ? `TP: +${autoBracket.tpOffset} / SL: -${autoBracket.slOffset} ${autoBracket.unit === 'dollars' ? '$' : 'ticks'}`
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <MotionBox
            position="fixed"
            inset={0}
            bg="blackAlpha.500"
            zIndex={1200}
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
            zIndex={1201}
            px={4}
            pt={3}
            pb={4}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <Flex justify="center" mb={3}>
              <Box w="36px" h="4px" borderRadius="full" bg="whiteAlpha.400" />
            </Flex>

            {/* Price header */}
            <Flex align="center" justify="center" mb={3}>
              <Text fontSize="lg" fontWeight="bold" color="white" fontFamily="mono">
                @ {formattedPrice}
              </Text>
            </Flex>

            {!hasActiveAccounts && (
              <Text fontSize="xs" color="orange.300" textAlign="center" mb={3}>
                No active accounts — toggle at least one account ON
              </Text>
            )}

            <VStack spacing={2} align="stretch">
              {/* Standard orders */}
              <Text fontSize="10px" color="whiteAlpha.400" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                Orders
              </Text>

              <Flex gap={2}>
                <Button
                  flex="1"
                  h="44px"
                  bg="rgba(38, 166, 154, 0.2)"
                  color="green.300"
                  fontWeight="bold"
                  fontSize="sm"
                  borderWidth="1px"
                  borderColor="rgba(38, 166, 154, 0.3)"
                  _hover={{ bg: 'rgba(38, 166, 154, 0.3)' }}
                  _active={{ bg: 'rgba(38, 166, 154, 0.4)' }}
                  isDisabled={!hasActiveAccounts}
                  onClick={() => { onPlaceOrder?.('buy', 'LIMIT'); onClose(); }}
                  borderRadius="lg"
                >
                  Buy Limit
                </Button>
                <Button
                  flex="1"
                  h="44px"
                  bg="rgba(239, 83, 80, 0.2)"
                  color="red.300"
                  fontWeight="bold"
                  fontSize="sm"
                  borderWidth="1px"
                  borderColor="rgba(239, 83, 80, 0.3)"
                  _hover={{ bg: 'rgba(239, 83, 80, 0.3)' }}
                  _active={{ bg: 'rgba(239, 83, 80, 0.4)' }}
                  isDisabled={!hasActiveAccounts}
                  onClick={() => { onPlaceOrder?.('sell', 'LIMIT'); onClose(); }}
                  borderRadius="lg"
                >
                  Sell Limit
                </Button>
              </Flex>

              <Flex gap={2}>
                <Button
                  flex="1"
                  h="44px"
                  bg="rgba(38, 166, 154, 0.1)"
                  color="green.300"
                  fontWeight="medium"
                  fontSize="sm"
                  borderWidth="1px"
                  borderColor="rgba(38, 166, 154, 0.2)"
                  borderStyle="dashed"
                  _hover={{ bg: 'rgba(38, 166, 154, 0.2)' }}
                  _active={{ bg: 'rgba(38, 166, 154, 0.3)' }}
                  isDisabled={!hasActiveAccounts}
                  onClick={() => { onPlaceOrder?.('buy', 'STOP'); onClose(); }}
                  borderRadius="lg"
                >
                  Buy Stop
                </Button>
                <Button
                  flex="1"
                  h="44px"
                  bg="rgba(239, 83, 80, 0.1)"
                  color="red.300"
                  fontWeight="medium"
                  fontSize="sm"
                  borderWidth="1px"
                  borderColor="rgba(239, 83, 80, 0.2)"
                  borderStyle="dashed"
                  _hover={{ bg: 'rgba(239, 83, 80, 0.2)' }}
                  _active={{ bg: 'rgba(239, 83, 80, 0.3)' }}
                  isDisabled={!hasActiveAccounts}
                  onClick={() => { onPlaceOrder?.('sell', 'STOP'); onClose(); }}
                  borderRadius="lg"
                >
                  Sell Stop
                </Button>
              </Flex>

              {/* Auto-Bracket stop orders — only when enabled */}
              {abEnabled && (
                <>
                  <Flex align="center" gap={2} mt={1}>
                    <Text fontSize="10px" color="orange.300" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                      Stop + Brackets
                    </Text>
                    <Badge
                      bg="rgba(251, 146, 60, 0.2)"
                      color="orange.300"
                      fontSize="8px"
                      px={1.5}
                      borderRadius="full"
                    >
                      {abLabel}
                    </Badge>
                  </Flex>

                  <Flex gap={2}>
                    <Button
                      flex="1"
                      h="48px"
                      bg="rgba(38, 166, 154, 0.15)"
                      color="green.300"
                      fontWeight="bold"
                      fontSize="sm"
                      borderWidth="1px"
                      borderColor="orange.600"
                      _hover={{ bg: 'rgba(38, 166, 154, 0.25)' }}
                      _active={{ bg: 'rgba(38, 166, 154, 0.35)' }}
                      isDisabled={!hasActiveAccounts}
                      onClick={() => { onAutoBracketOrder?.(price, 'buy'); onClose(); }}
                      borderRadius="lg"
                    >
                      <VStack spacing={0}>
                        <Text>Buy Stop</Text>
                        <Text fontSize="9px" color="orange.300" fontWeight="normal">+ Brackets</Text>
                      </VStack>
                    </Button>
                    <Button
                      flex="1"
                      h="48px"
                      bg="rgba(239, 83, 80, 0.15)"
                      color="red.300"
                      fontWeight="bold"
                      fontSize="sm"
                      borderWidth="1px"
                      borderColor="orange.600"
                      _hover={{ bg: 'rgba(239, 83, 80, 0.25)' }}
                      _active={{ bg: 'rgba(239, 83, 80, 0.35)' }}
                      isDisabled={!hasActiveAccounts}
                      onClick={() => { onAutoBracketOrder?.(price, 'sell'); onClose(); }}
                      borderRadius="lg"
                    >
                      <VStack spacing={0}>
                        <Text>Sell Stop</Text>
                        <Text fontSize="9px" color="orange.300" fontWeight="normal">+ Brackets</Text>
                      </VStack>
                    </Button>
                  </Flex>
                </>
              )}

              {/* Cancel */}
              <Button
                w="100%"
                h="40px"
                variant="ghost"
                color="whiteAlpha.500"
                fontSize="sm"
                _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                onClick={onClose}
                borderRadius="lg"
                mt={1}
              >
                Cancel
              </Button>
            </VStack>
          </MotionBox>
        </>
      )}
    </AnimatePresence>
  );
};

export default memo(MobileChartActionSheet);
