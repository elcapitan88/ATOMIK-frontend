import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Divider,
  useToast
} from '@chakra-ui/react';
import { AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';

const CancelSubscriptionModal = ({ isOpen, onClose, subscription, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: subscription.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await axiosInstance.post(`/api/v1/subscriptions/strategy-subscriptions/${subscription.id}/cancel`);
      
      toast({
        title: "Subscription cancelled",
        description: "Your strategy subscription has been cancelled successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onSuccess(); // Refresh the subscriptions list
      onClose();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Failed to cancel subscription",
        description: error.response?.data?.detail || "Please try again or contact support",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="#121212" border="1px solid #333" borderRadius="lg" mx={4}>
        <ModalHeader color="white" pb={2}>
          <HStack spacing={3}>
            <Box color="red.400">
              <AlertTriangle size={24} />
            </Box>
            <Text>Cancel Strategy Subscription</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="whiteAlpha.700" />
        
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Warning Alert */}
            <Alert status="warning" bg="rgba(237, 137, 54, 0.1)" border="1px solid rgba(237, 137, 54, 0.3)">
              <AlertIcon color="orange.400" />
              <Box>
                <AlertTitle color="orange.400" fontSize="sm">
                  Are you sure you want to cancel?
                </AlertTitle>
                <AlertDescription color="whiteAlpha.700" fontSize="sm">
                  You'll lose access to this strategy's signals and performance data.
                </AlertDescription>
              </Box>
            </Alert>

            {/* Subscription Details */}
            <Box bg="#1a1a1a" p={4} borderRadius="md" border="1px solid #333">
              <VStack spacing={3} align="stretch">
                <Text color="white" fontSize="lg" fontWeight="semibold">
                  {subscription.strategy_name}
                </Text>
                <Text color="whiteAlpha.600" fontSize="sm">
                  by {subscription.creator_name}
                </Text>
                
                <Divider borderColor="#333" />
                
                <HStack justify="space-between">
                  <HStack spacing={2} color="whiteAlpha.700">
                    <DollarSign size={16} />
                    <Text fontSize="sm">Current plan:</Text>
                  </HStack>
                  <Text color="white" fontSize="sm" fontWeight="medium">
                    {formatCurrency(subscription.amount)} / {subscription.interval}
                  </Text>
                </HStack>

                {subscription.current_period_end && (
                  <HStack justify="space-between">
                    <HStack spacing={2} color="whiteAlpha.700">
                      <Calendar size={16} />
                      <Text fontSize="sm">Access until:</Text>
                    </HStack>
                    <Text color="white" fontSize="sm" fontWeight="medium">
                      {formatDate(subscription.current_period_end)}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </Box>

            {/* Cancellation Terms */}
            <Box bg="rgba(0, 198, 224, 0.05)" p={4} borderRadius="md" border="1px solid rgba(0, 198, 224, 0.2)">
              <VStack spacing={2} align="start">
                <Text color="#00C6E0" fontSize="sm" fontWeight="semibold">
                  What happens when you cancel:
                </Text>
                <VStack spacing={1} align="start" color="whiteAlpha.700" fontSize="sm">
                  <Text>• Your subscription will not renew automatically</Text>
                  <Text>• You'll keep access until the end of your current billing period</Text>
                  <Text>• You can resubscribe anytime in the marketplace</Text>
                  <Text>• No refunds for partial periods</Text>
                </VStack>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter pt={0}>
          <HStack spacing={3} width="full">
            <Button
              variant="outline"
              borderColor="#333"
              color="whiteAlpha.700"
              _hover={{ borderColor: "#00C6E0", color: "#00C6E0" }}
              onClick={onClose}
              flex={1}
            >
              Keep Subscription
            </Button>
            <Button
              bg="red.500"
              color="white"
              _hover={{ bg: "red.600" }}
              _active={{ bg: "red.700" }}
              onClick={handleCancel}
              isLoading={isLoading}
              loadingText="Cancelling..."
              flex={1}
            >
              Cancel Subscription
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CancelSubscriptionModal;