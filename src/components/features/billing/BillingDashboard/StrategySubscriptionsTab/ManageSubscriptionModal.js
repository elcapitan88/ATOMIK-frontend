import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Divider,
  Box,
  useToast,
  Badge,
  Icon,
  Link as ChakraLink
} from '@chakra-ui/react';
import {
  Calendar,
  DollarSign,
  User,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/services/axiosConfig';

const ManageSubscriptionModal = ({ isOpen, onClose, subscription, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: subscription?.currency || 'USD'
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

  const getIntervalText = (interval) => {
    switch (interval) {
      case 'month':
        return 'Monthly';
      case 'year':
        return 'Yearly';
      case 'week':
        return 'Weekly';
      default:
        return interval || 'One-time';
    }
  };

  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'active':
        return 'green';
      case 'trialing':
        return 'blue';
      case 'canceled':
      case 'cancelled':
        return 'red';
      case 'past_due':
        return 'orange';
      case 'completed':
        return 'green';
      default:
        return 'gray';
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      await axiosInstance.post(
        `/api/v1/subscriptions/strategy-subscriptions/${subscription.id}/cancel`
      );

      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription has been cancelled successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onRefresh) {
        await onRefresh();
      }

      setShowCancelConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Cancellation failed',
        description: error.response?.data?.detail || 'Failed to cancel subscription',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInMarketplace = () => {
    onClose();
    navigate('/marketplace');
  };

  const handleManagePayment = () => {
    // Navigate to billing portal
    window.open('https://billing.stripe.com/p/login/test_123', '_blank');
  };

  if (!subscription) return null;

  const canCancel =
    (subscription.status === 'active' || subscription.status === 'completed') &&
    !subscription.cancel_at_period_end;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
      <ModalContent
        bg="#1a1a1a"
        border="1px solid #333"
        maxW="600px"
      >
        <ModalHeader
          color="white"
          borderBottom="1px solid #333"
          pb={4}
        >
          <VStack align="start" spacing={2}>
            <Text fontSize="2xl" fontWeight="bold">
              Manage Subscription
            </Text>
            <HStack>
              <Badge colorScheme={getStatusColor(subscription.status)}>
                {subscription.status || 'Unknown'}
              </Badge>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton color="whiteAlpha.700" />

        <ModalBody py={6}>
          {showCancelConfirm ? (
            // Cancellation Confirmation View
            <VStack spacing={6} align="stretch">
              <Box
                bg="rgba(229, 62, 62, 0.1)"
                p={6}
                borderRadius="lg"
                border="1px solid rgba(229, 62, 62, 0.3)"
              >
                <VStack spacing={4} align="center">
                  <Icon as={AlertTriangle} w={12} h={12} color="red.400" />
                  <Text color="white" fontSize="lg" fontWeight="semibold" textAlign="center">
                    Cancel Subscription?
                  </Text>
                  <Text color="whiteAlpha.700" fontSize="sm" textAlign="center">
                    Are you sure you want to cancel your subscription to{' '}
                    <Text as="span" fontWeight="semibold" color="white">
                      {subscription.strategy_name}
                    </Text>
                    ?
                  </Text>
                  {subscription.current_period_end && (
                    <Text color="whiteAlpha.600" fontSize="xs" textAlign="center">
                      You'll continue to have access until{' '}
                      {formatDate(subscription.current_period_end)}
                    </Text>
                  )}
                </VStack>
              </Box>

              <HStack spacing={3}>
                <Button
                  flex={1}
                  variant="outline"
                  borderColor="#333"
                  color="whiteAlpha.700"
                  _hover={{ borderColor: "#00C6E0", color: "#00C6E0" }}
                  onClick={() => setShowCancelConfirm(false)}
                >
                  Keep Subscription
                </Button>
                <Button
                  flex={1}
                  bg="red.500"
                  color="white"
                  _hover={{ bg: "red.600" }}
                  onClick={handleCancelSubscription}
                  isLoading={isLoading}
                  loadingText="Cancelling..."
                >
                  Yes, Cancel
                </Button>
              </HStack>
            </VStack>
          ) : (
            // Main Subscription Details View
            <VStack spacing={6} align="stretch">
              {/* Strategy Info */}
              <Box>
                <Text color="whiteAlpha.600" fontSize="sm" mb={3}>
                  STRATEGY DETAILS
                </Text>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <HStack spacing={2} color="whiteAlpha.700">
                      <Icon as={TrendingUp} w={4} h={4} />
                      <Text fontSize="sm">Strategy:</Text>
                    </HStack>
                    <Text color="white" fontSize="sm" fontWeight="medium">
                      {subscription.strategy_name}
                    </Text>
                  </HStack>

                  <HStack justify="space-between">
                    <HStack spacing={2} color="whiteAlpha.700">
                      <Icon as={User} w={4} h={4} />
                      <Text fontSize="sm">Creator:</Text>
                    </HStack>
                    <Text color="white" fontSize="sm" fontWeight="medium">
                      {subscription.creator_name}
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              <Divider borderColor="#333" />

              {/* Billing Info */}
              <Box>
                <Text color="whiteAlpha.600" fontSize="sm" mb={3}>
                  BILLING INFORMATION
                </Text>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <HStack spacing={2} color="whiteAlpha.700">
                      <Icon as={DollarSign} w={4} h={4} />
                      <Text fontSize="sm">Amount:</Text>
                    </HStack>
                    <Text color="white" fontSize="sm" fontWeight="medium">
                      {formatCurrency(subscription.amount)} / {getIntervalText(subscription.interval)}
                    </Text>
                  </HStack>

                  {subscription.current_period_end && (
                    <HStack justify="space-between">
                      <HStack spacing={2} color="whiteAlpha.700">
                        <Icon as={Calendar} w={4} h={4} />
                        <Text fontSize="sm">
                          {subscription.cancel_at_period_end ? 'Expires:' : 'Next billing:'}
                        </Text>
                      </HStack>
                      <Text color="white" fontSize="sm" fontWeight="medium">
                        {formatDate(subscription.current_period_end)}
                      </Text>
                    </HStack>
                  )}

                  {subscription.trial_end && subscription.trial_end > Date.now() / 1000 && (
                    <HStack justify="space-between">
                      <HStack spacing={2} color="yellow.400">
                        <Icon as={Calendar} w={4} h={4} />
                        <Text fontSize="sm">Trial ends:</Text>
                      </HStack>
                      <Text color="yellow.400" fontSize="sm" fontWeight="medium">
                        {formatDate(subscription.trial_end)}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Box>

              {subscription.cancel_at_period_end && (
                <Box
                  bg="rgba(229, 62, 62, 0.1)"
                  p={4}
                  borderRadius="md"
                  border="1px solid rgba(229, 62, 62, 0.3)"
                >
                  <HStack spacing={2}>
                    <Icon as={AlertTriangle} w={5} h={5} color="red.400" />
                    <Text color="red.400" fontSize="sm">
                      This subscription will not renew
                    </Text>
                  </HStack>
                </Box>
              )}

              <Divider borderColor="#333" />

              {/* Actions */}
              <VStack spacing={3} align="stretch">
                <Button
                  variant="outline"
                  borderColor="#333"
                  color="whiteAlpha.700"
                  _hover={{ borderColor: "#00C6E0", color: "#00C6E0" }}
                  rightIcon={<ExternalLink size={16} />}
                  onClick={handleViewInMarketplace}
                >
                  View in Marketplace
                </Button>

                {canCancel && (
                  <Button
                    bg="rgba(229, 62, 62, 0.1)"
                    color="red.400"
                    border="1px solid rgba(229, 62, 62, 0.3)"
                    _hover={{
                      bg: "rgba(229, 62, 62, 0.2)",
                      borderColor: "red.400"
                    }}
                    leftIcon={<XCircle size={16} />}
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </VStack>

              {/* Subscription ID for reference */}
              {subscription.stripe_subscription_id && (
                <Box mt={4} pt={4} borderTop="1px solid #333">
                  <Text color="whiteAlpha.500" fontSize="xs">
                    Subscription ID: {subscription.stripe_subscription_id}
                  </Text>
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ManageSubscriptionModal;
