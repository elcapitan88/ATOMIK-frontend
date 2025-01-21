// src/components/features/trading/OrderControl/OrderConfirmationModal.js
import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Divider,
  Badge,
  Checkbox,
  useToast,
} from '@chakra-ui/react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowBigUp,
  ArrowBigDown,
  Ban,
  DollarSign,
  Percent,
  Scale,
} from 'lucide-react';

const OrderConfirmationModal = ({ isOpen, onClose, order, onConfirm }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);
  const toast = useToast();

  // Simulated account data - replace with your actual account data source
  const accountsData = useMemo(() => ({
    '1': { balance: 10000, name: 'Main Trading' },
    '2': { balance: 5000, name: 'Secondary' },
    '3': { balance: 1000, name: 'Test Account' },
  }), []);

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      await onConfirm(order);
      
      if (rememberChoice) {
        localStorage.setItem('skipOrderConfirmation', 'true');
        toast({
          title: "Preference Saved",
          description: "Future orders will not require confirmation",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const getOrderIcon = () => {
    switch (order?.type) {
      case 'buy':
        return <ArrowBigUp size={20} color="#48BB78" />;
      case 'sell':
        return <ArrowBigDown size={20} color="#F56565" />;
      case 'close-all':
        return <Ban size={20} color="#ED8936" />;
      default:
        return null;
    }
  };

  const getOrderColor = () => {
    switch (order?.type) {
      case 'buy':
        return 'green.500';
      case 'sell':
        return 'red.500';
      case 'close-all':
        return 'orange.500';
      default:
        return 'white';
    }
  };

  const getRiskLevel = (percentage) => {
    if (percentage > 20) return { level: 'High', color: 'red' };
    if (percentage > 10) return { level: 'Medium', color: 'yellow' };
    return { level: 'Low', color: 'green' };
  };

  if (!order) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      isCentered
      closeOnOverlayClick={!isConfirming}
      closeOnEsc={!isConfirming}
      size="lg"
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent
        bg="rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
        borderRadius="xl"
        border="1px solid rgba(255, 255, 255, 0.18)"
        color="white"
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.18)"
          pb={4}
        >
          <HStack spacing={2}>
            <AlertTriangle color="#ED8936" />
            <Text>Confirm {order.type.replace('-', ' ')}</Text>
          </HStack>
        </ModalHeader>
        {!isConfirming && <ModalCloseButton />}

        <ModalBody py={6}>
          <VStack spacing={4} align="stretch">
            {/* Order Type and Basic Info */}
            <HStack justify="space-between">
              <Text color="whiteAlpha.700">Order Type:</Text>
              <HStack>
                {getOrderIcon()}
                <Text color={getOrderColor()} textTransform="capitalize" fontWeight="bold">
                  {order.type.replace('-', ' ')}
                </Text>
              </HStack>
            </HStack>

            {/* Quantity if not close-all */}
            {order.type !== 'close-all' && (
              <HStack justify="space-between">
                <Text color="whiteAlpha.700">Quantity per Account:</Text>
                <Text fontWeight="bold">{order.quantity}</Text>
              </HStack>
            )}

            <Divider borderColor="whiteAlpha.200" />

            {/* Order Preview Section */}
            <Box>
              <Text color="whiteAlpha.700" mb={2}>Order Distribution:</Text>
              <VStack spacing={2} align="stretch">
                {order.accounts.map((accountId) => {
                  const account = accountsData[accountId];
                  if (!account) return null;

                  const positionValue = order.quantity * 50; // Example contract value
                  const positionRisk = (positionValue / account.balance) * 100;
                  const riskLevel = getRiskLevel(positionRisk);

                  return (
                    <Box
                      key={accountId}
                      bg="whiteAlpha.100"
                      p={3}
                      borderRadius="md"
                    >
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Text fontSize="sm" fontWeight="medium">{account.name}</Text>
                          <Badge colorScheme="blue">
                            {order.type === 'close-all' ? 'All Positions' : `${order.quantity} contracts`}
                          </Badge>
                        </HStack>

                        <HStack spacing={4} justify="space-between">
                          <HStack spacing={1}>
                            <DollarSign size={14} />
                            <Text fontSize="xs" color="whiteAlpha.700">
                              ${positionValue.toLocaleString()}
                            </Text>
                          </HStack>

                          <HStack spacing={1}>
                            <Percent size={14} />
                            <Text fontSize="xs" color="whiteAlpha.700">
                              {positionRisk.toFixed(1)}% of balance
                            </Text>
                          </HStack>

                          <Badge 
                            colorScheme={riskLevel.color}
                            variant="subtle"
                          >
                            {riskLevel.level} Risk
                          </Badge>
                        </HStack>
                      </VStack>
                    </Box>
                  );
                })}
              </VStack>
            </Box>

            {/* High Risk Warning */}
            {order.accounts.some(accountId => {
              const account = accountsData[accountId];
              const positionValue = order.quantity * 50;
              const positionRisk = (positionValue / account?.balance) * 100;
              return getRiskLevel(positionRisk).level === 'High';
            }) && (
              <Box
                bg="red.900"
                p={3}
                borderRadius="md"
                borderLeft="4px"
                borderColor="red.500"
              >
                <HStack spacing={2}>
                  <AlertTriangle size={16} color="#F56565" />
                  <Text fontSize="sm">
                    High risk level detected in one or more accounts. Consider reducing position size.
                  </Text>
                </HStack>
              </Box>
            )}

            {/* Warning Message */}
            <Box 
              bg="orange.900" 
              p={3} 
              borderRadius="md" 
              borderLeft="4px" 
              borderColor="orange.500"
            >
              <HStack spacing={2}>
                <AlertTriangle size={16} color="#ED8936" />
                <Text fontSize="sm">
                  This action cannot be undone. Please confirm your order details.
                </Text>
              </HStack>
            </Box>

            {/* Remember Choice */}
            <Checkbox
              isChecked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              colorScheme="blue"
            >
              <Text fontSize="sm">Don't show this confirmation again</Text>
            </Checkbox>
          </VStack>
        </ModalBody>

        <ModalFooter
          borderTop="1px solid rgba(255, 255, 255, 0.18)"
          pt={4}
        >
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            isDisabled={isConfirming}
            leftIcon={<XCircle size={16} />}
            _hover={{ bg: 'whiteAlpha.100' }}
          >
            Cancel
          </Button>
          <Button
            colorScheme={order.type === 'buy' ? 'green' : order.type === 'sell' ? 'red' : 'orange'}
            onClick={handleConfirm}
            isLoading={isConfirming}
            loadingText="Confirming..."
            leftIcon={<CheckCircle2 size={16} />}
          >
            Confirm {order.type.replace('-', ' ')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OrderConfirmationModal;