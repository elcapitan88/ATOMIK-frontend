import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  HStack,
  VStack,
  Box,
  Divider,
  Badge,
  Checkbox,
  Flex,
} from '@chakra-ui/react';

const ACTION_CONFIG = {
  place: {
    label: 'Place Order',
    badgeColor: null, // determined by side
    confirmLabel: 'Place Order',
    confirmColor: 'green',
  },
  modify: {
    label: 'Modify Order',
    badgeColor: 'orange',
    confirmLabel: 'Modify Order',
    confirmColor: 'green',
  },
  cancel: {
    label: 'Cancel Order',
    badgeColor: 'red',
    confirmLabel: 'Cancel Order',
    confirmColor: 'red',
  },
  close: {
    label: 'Close Position',
    badgeColor: 'red',
    confirmLabel: 'Close Position',
    confirmColor: 'red',
  },
  reverse: {
    label: 'Reverse Position',
    badgeColor: 'orange',
    confirmLabel: 'Reverse Position',
    confirmColor: 'green',
  },
  bracket: {
    label: 'Add Brackets',
    badgeColor: 'purple',
    confirmLabel: 'Add Brackets',
    confirmColor: 'green',
  },
  bracketPlace: {
    label: 'Place Bracket Order',
    badgeColor: 'purple',
    confirmLabel: 'Place Bracket',
    confirmColor: 'purple',
  },
};

function formatPrice(value) {
  if (value == null || isNaN(value)) return '--';
  return `$${Number(value).toFixed(2)}`;
}

function DetailRow({ label, children }) {
  return (
    <Flex justify="space-between" align="center" w="100%" py={1}>
      <Text fontSize="sm" color="whiteAlpha.600">
        {label}
      </Text>
      <Box textAlign="right">{children}</Box>
    </Flex>
  );
}

function getBadgeColorForAction(action, side) {
  if (action === 'place') {
    return side?.toUpperCase() === 'BUY' ? 'cyan' : 'red';
  }
  return ACTION_CONFIG[action]?.badgeColor || 'gray';
}

function getConfirmColor(action, side) {
  if (action === 'place') {
    return side?.toUpperCase() === 'BUY' ? 'green' : 'red';
  }
  return ACTION_CONFIG[action]?.confirmColor || 'green';
}

function CommonDetails({ details }) {
  if (!details) return null;
  const { symbol, side, type, quantity } = details;

  return (
    <>
      {symbol && (
        <DetailRow label="Symbol">
          <Text fontSize="sm" color="whiteAlpha.800" fontWeight="semibold">
            {symbol}
          </Text>
        </DetailRow>
      )}
      {side && (
        <DetailRow label="Side">
          <Badge
            colorScheme={side?.toUpperCase() === 'BUY' ? 'cyan' : 'red'}
            variant="subtle"
            fontSize="xs"
          >
            {side.toUpperCase()}
          </Badge>
        </DetailRow>
      )}
      {type && (
        <DetailRow label="Type">
          <Text fontSize="sm" color="whiteAlpha.800">
            {type}
          </Text>
        </DetailRow>
      )}
      {quantity != null && (
        <DetailRow label="Quantity">
          <Text fontSize="sm" color="whiteAlpha.800">
            {quantity}
          </Text>
        </DetailRow>
      )}
    </>
  );
}

function PlaceDetails({ details }) {
  if (!details) return null;
  const { price, stopPrice } = details;

  return (
    <>
      {price != null && (
        <DetailRow label="Price">
          <Text fontSize="sm" color="whiteAlpha.800">
            {formatPrice(price)}
          </Text>
        </DetailRow>
      )}
      {stopPrice != null && (
        <DetailRow label="Stop Price">
          <Text fontSize="sm" color="whiteAlpha.800">
            {formatPrice(stopPrice)}
          </Text>
        </DetailRow>
      )}
    </>
  );
}

function ModifyDetails({ details }) {
  if (!details) return null;
  const { originalPrice, newPrice, orderId } = details;

  const diff =
    originalPrice != null && newPrice != null ? newPrice - originalPrice : null;

  return (
    <>
      {orderId && (
        <DetailRow label="Order ID">
          <Text fontSize="xs" color="whiteAlpha.600" fontFamily="mono">
            {orderId}
          </Text>
        </DetailRow>
      )}
      {originalPrice != null && newPrice != null && (
        <DetailRow label="Price">
          <HStack spacing={1}>
            <Text fontSize="sm" color="whiteAlpha.600" textDecoration="line-through">
              {formatPrice(originalPrice)}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.600">
              {' -> '}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.800" fontWeight="semibold">
              {formatPrice(newPrice)}
            </Text>
            {diff != null && (
              <Text
                fontSize="xs"
                color={diff >= 0 ? 'green.300' : 'red.300'}
              >
                ({diff >= 0 ? '+' : ''}
                {diff.toFixed(2)})
              </Text>
            )}
          </HStack>
        </DetailRow>
      )}
    </>
  );
}

function CancelDetails({ details }) {
  if (!details) return null;
  const { price, orderId } = details;

  return (
    <>
      {orderId && (
        <DetailRow label="Order ID">
          <Text fontSize="xs" color="whiteAlpha.600" fontFamily="mono">
            {orderId}
          </Text>
        </DetailRow>
      )}
      {price != null && (
        <DetailRow label="Price">
          <Text fontSize="sm" color="whiteAlpha.800">
            {formatPrice(price)}
          </Text>
        </DetailRow>
      )}
    </>
  );
}

function CloseDetails({ details }) {
  if (!details) return null;
  const { positionId, avgPrice, unrealizedPnL } = details;

  return (
    <>
      {positionId && (
        <DetailRow label="Position ID">
          <Text fontSize="xs" color="whiteAlpha.600" fontFamily="mono">
            {positionId}
          </Text>
        </DetailRow>
      )}
      {avgPrice != null && (
        <DetailRow label="Avg Entry">
          <Text fontSize="sm" color="whiteAlpha.800">
            {formatPrice(avgPrice)}
          </Text>
        </DetailRow>
      )}
      {unrealizedPnL != null && (
        <DetailRow label="Unrealized P&L">
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color={unrealizedPnL >= 0 ? 'green.300' : 'red.300'}
          >
            {unrealizedPnL >= 0 ? '+' : ''}
            {formatPrice(unrealizedPnL)}
          </Text>
        </DetailRow>
      )}
    </>
  );
}

function ReverseDetails({ details }) {
  if (!details) return null;
  const { positionId, avgPrice } = details;

  return (
    <>
      {positionId && (
        <DetailRow label="Position ID">
          <Text fontSize="xs" color="whiteAlpha.600" fontFamily="mono">
            {positionId}
          </Text>
        </DetailRow>
      )}
      {avgPrice != null && (
        <DetailRow label="Avg Entry">
          <Text fontSize="sm" color="whiteAlpha.800">
            {formatPrice(avgPrice)}
          </Text>
        </DetailRow>
      )}
    </>
  );
}

function BracketDetails({ details }) {
  if (!details) return null;
  const { tpPrice, slPrice } = details;

  return (
    <>
      {tpPrice != null && (
        <DetailRow label="Take Profit">
          <Text fontSize="sm" color="green.300" fontWeight="semibold">
            {formatPrice(tpPrice)}
          </Text>
        </DetailRow>
      )}
      {slPrice != null && (
        <DetailRow label="Stop Loss">
          <Text fontSize="sm" color="red.300" fontWeight="semibold">
            {formatPrice(slPrice)}
          </Text>
        </DetailRow>
      )}
    </>
  );
}

function BracketPlaceDetails({ details }) {
  if (!details) return null;
  const { entryPrice, tpPrice, slPrice, accountCount } = details;
  return (
    <>
      {entryPrice != null && (
        <DetailRow label="Entry Price">
          <Text fontSize="sm" color="purple.300" fontWeight="semibold">
            {formatPrice(entryPrice)}
          </Text>
        </DetailRow>
      )}
      {tpPrice != null && (
        <DetailRow label="Take Profit">
          <Text fontSize="sm" color="green.300" fontWeight="semibold">
            {formatPrice(tpPrice)}
          </Text>
        </DetailRow>
      )}
      {slPrice != null && (
        <DetailRow label="Stop Loss">
          <Text fontSize="sm" color="red.300" fontWeight="semibold">
            {formatPrice(slPrice)}
          </Text>
        </DetailRow>
      )}
      {accountCount != null && (
        <DetailRow label="Accounts">
          <Text fontSize="sm" color="whiteAlpha.800">
            {accountCount} account{accountCount !== 1 ? 's' : ''}
          </Text>
        </DetailRow>
      )}
    </>
  );
}

const ACTION_DETAIL_COMPONENTS = {
  place: PlaceDetails,
  modify: ModifyDetails,
  cancel: CancelDetails,
  close: CloseDetails,
  reverse: ReverseDetails,
  bracket: BracketDetails,
  bracketPlace: BracketPlaceDetails,
};

function OrderConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  action = 'place',
  details,
  skipConfirmation,
  onToggleSkip,
}) {
  const config = ACTION_CONFIG[action] || ACTION_CONFIG.place;
  const side = details?.side;
  const badgeColor = getBadgeColorForAction(action, side);
  const confirmColor = getConfirmColor(action, side);
  const ActionDetails = ACTION_DETAIL_COMPONENTS[action];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="md"
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.400" />
      <ModalContent
        bg="rgba(0, 0, 0, 0.4)"
        backdropFilter="blur(10px)"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        borderRadius="xl"
      >
        <ModalHeader
          bg="rgba(0, 0, 0, 0.3)"
          mx={-6}
          mt={-6}
          px={6}
          pt={5}
          pb={4}
          borderTopRadius="xl"
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
        >
          <HStack spacing={3}>
            <Text fontSize="lg" fontWeight="bold" color="whiteAlpha.800">
              {config.label}
            </Text>
            <Badge colorScheme={badgeColor} variant="subtle" fontSize="xs">
              {action.toUpperCase()}
            </Badge>
          </HStack>
        </ModalHeader>

        <ModalBody py={4} px={6}>
          {!details ? (
            <Text fontSize="sm" color="whiteAlpha.600">
              No order details available.
            </Text>
          ) : (
            <VStack spacing={0} align="stretch">
              <CommonDetails details={details} />

              {ActionDetails && (
                <>
                  <Divider borderColor="whiteAlpha.100" my={2} />
                  <ActionDetails details={details} />
                </>
              )}

              {details.accountNickname && (
                <>
                  <Divider borderColor="whiteAlpha.100" my={2} />
                  <DetailRow label="Account">
                    <Text fontSize="sm" color="whiteAlpha.800">
                      {details.accountNickname}
                    </Text>
                  </DetailRow>
                </>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
          px={6}
          py={3}
        >
          <Flex w="100%" justify="space-between" align="center">
            <Checkbox
              size="sm"
              colorScheme="whiteAlpha"
              isChecked={skipConfirmation}
              onChange={onToggleSkip}
              sx={{
                '.chakra-checkbox__label': {
                  fontSize: 'xs',
                  color: 'whiteAlpha.600',
                },
                '.chakra-checkbox__control': {
                  borderColor: 'whiteAlpha.400',
                },
              }}
            >
              Don't ask again
            </Checkbox>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="ghost"
                color="whiteAlpha.700"
                _hover={{ bg: 'whiteAlpha.100' }}
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                colorScheme={confirmColor}
                onClick={onConfirm}
              >
                {config.confirmLabel}
              </Button>
            </HStack>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default OrderConfirmationModal;
