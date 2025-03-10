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
  Users,
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

  if (!order) return null;

  const isCloseAll = order.type === 'close-all';
  const isGroupOrder = order.isGroupOrder || order.groupInfo;

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
            <Text>
              {isCloseAll ? 'Confirm Close All Positions' : 
               isGroupOrder ? `Confirm Group ${order.type.toUpperCase()}` : 
               `Confirm ${order.type.toUpperCase()}`}
            </Text>
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
                  {isCloseAll ? 'Close All Positions' : order.type}
                </Text>
              </HStack>
            </HStack>

            {/* Order details - show for regular and group orders */}
            {!isCloseAll && (
              <>
                <HStack justify="space-between">
                  <Text color="whiteAlpha.700">Ticker:</Text>
                  <Text fontWeight="bold">{order.ticker}</Text>
                </HStack>
                
                {/* Only show single quantity for non-group orders */}
                {!isGroupOrder && (
                  <HStack justify="space-between">
                    <Text color="whiteAlpha.700">Quantity:</Text>
                    <Text fontWeight="bold">{order.quantity}</Text>
                  </HStack>
                )}
                
                {/* Show group info if available */}
                {isGroupOrder && order.groupInfo && (
                  <HStack justify="space-between">
                    <Text color="whiteAlpha.700">Strategy Group:</Text>
                    <HStack>
                      <Users size={16} />
                      <Text fontWeight="bold">{order.groupInfo.groupName || 'Group Strategy'}</Text>
                    </HStack>
                  </HStack>
                )}
              </>
            )}

            <Divider borderColor="whiteAlpha.200" />

            {/* Account Selection Info */}
            <Box>
              <Text color="whiteAlpha.700" mb={2}>
                {isGroupOrder ? 'Group Accounts:' : 'Selected Accounts:'}
              </Text>
              <VStack spacing={2} align="stretch">
                {/* For group orders, we need to show different quantities for each account */}
                {isGroupOrder && order.groupInfo ? (
                  <>
                    {/* Display leader account first */}
                    {order.groupInfo.leaderAccountId && (
                      <Box
                        key={order.groupInfo.leaderAccountId}
                        bg="whiteAlpha.200"
                        p={3}
                        borderRadius="md"
                      >
                        <VStack align="stretch" spacing={1}>
                          <HStack justify="space-between">
                            <HStack>
                              <Text fontSize="sm" fontWeight="medium">
                                {accountsData[order.groupInfo.leaderAccountId]?.name || `Account ${order.groupInfo.leaderAccountId}`}
                              </Text>
                              <Badge colorScheme="purple">Leader</Badge>
                            </HStack>
                            <Badge colorScheme={isCloseAll ? "orange" : "blue"}>
                              {isCloseAll ? 'All Positions' : `${order.groupInfo.leaderQuantity || order.quantity} contracts`}
                            </Badge>
                          </HStack>
                        </VStack>
                      </Box>
                    )}
                    
                    {/* Display follower accounts */}
                    {order.groupInfo.followerAccounts && order.groupInfo.followerAccounts.map((follower, index) => (
                      <Box
                        key={follower.account_id}
                        bg="whiteAlpha.100"
                        p={3}
                        borderRadius="md"
                      >
                        <VStack align="stretch" spacing={1}>
                          <HStack justify="space-between">
                            <HStack>
                              <Text fontSize="sm" fontWeight="medium">
                                {accountsData[follower.account_id]?.name || `Account ${follower.account_id}`}
                              </Text>
                              <Badge colorScheme="cyan">Follower</Badge>
                            </HStack>
                            <Badge colorScheme={isCloseAll ? "orange" : "blue"}>
                              {isCloseAll ? 'All Positions' : `${follower.quantity} contracts`}
                            </Badge>
                          </HStack>
                        </VStack>
                      </Box>
                    ))}
                  </>
                ) : (
                  // Regular account display for non-group orders
                  order.accounts.map((accountId) => (
                    <Box
                      key={accountId}
                      bg="whiteAlpha.100"
                      p={3}
                      borderRadius="md"
                    >
                      <VStack align="stretch" spacing={1}>
                        <HStack justify="space-between">
                          <Text fontSize="sm" fontWeight="medium">
                            {accountsData[accountId]?.name || `Account ${accountId}`}
                          </Text>
                          <Badge colorScheme={isCloseAll ? "orange" : "blue"}>
                            {isCloseAll ? 'All Positions' : `${order.quantity} contracts`}
                          </Badge>
                        </HStack>
                      </VStack>
                    </Box>
                  ))
                )}
              </VStack>
            </Box>

            {/* Warning Message */}
            <Box 
              bg={isCloseAll ? "orange.900" : isGroupOrder ? "purple.900" : "yellow.900"}
              p={3} 
              borderRadius="md" 
              borderLeft="4px" 
              borderColor={isCloseAll ? "orange.500" : isGroupOrder ? "purple.500" : "yellow.500"}
            >
              <HStack spacing={2}>
                <AlertTriangle size={16} color={isCloseAll ? "#ED8936" : isGroupOrder ? "#D6BCFA" : "#ECC94B"} />
                <Text fontSize="sm">
                  {isCloseAll 
                    ? "This will close ALL open positions in the selected accounts. This action cannot be undone."
                    : isGroupOrder
                    ? "This will execute orders for all accounts in the group strategy using predefined quantities."
                    : "Please confirm your order details carefully before proceeding."}
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
            colorScheme={isCloseAll ? "orange" : isGroupOrder ? "purple" : (order.type === 'buy' ? 'green' : 'red')}
            onClick={handleConfirm}
            isLoading={isConfirming}
            loadingText="Confirming..."
            leftIcon={<CheckCircle2 size={16} />}
          >
            {isCloseAll ? 'Close All Positions' : 
             isGroupOrder ? `Execute Group ${order.type.toUpperCase()}` :
             `Confirm ${order.type.toUpperCase()}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OrderConfirmationModal;