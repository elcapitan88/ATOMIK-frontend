import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  Heading,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  SimpleGrid,
  Icon,
  Skeleton,
  Stack,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import {
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import axiosInstance from '../../../../utils/axiosInstance';
import { format } from 'date-fns';

const SubscriptionManagement = ({ userId }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchSubscriptions();
  }, [userId]);

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/api/v1/subscriptions/strategy-subscriptions');
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Error loading subscriptions',
        description: 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    setIsProcessing(true);
    try {
      await axiosInstance.post(`/api/v1/subscriptions/strategy-subscriptions/${subscriptionId}/cancel`);
      
      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription will remain active until the end of the billing period',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      fetchSubscriptions();
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to cancel subscription',
        description: error.response?.data?.detail || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async (subscriptionId) => {
    setIsProcessing(true);
    try {
      await axiosInstance.post(`/api/v1/subscriptions/${subscriptionId}/reactivate`);
      
      toast({
        title: 'Subscription reactivated',
        description: 'Your subscription has been reactivated',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      fetchSubscriptions();
    } catch (error) {
      toast({
        title: 'Failed to reactivate subscription',
        description: error.response?.data?.detail || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgradeSubscription = async (subscriptionId, newPriceType) => {
    setIsProcessing(true);
    try {
      await axiosInstance.post(`/api/v1/subscriptions/${subscriptionId}/upgrade`, {
        new_price_type: newPriceType
      });
      
      toast({
        title: 'Subscription upgraded',
        description: 'Your subscription has been upgraded successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      fetchSubscriptions();
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to upgrade subscription',
        description: error.response?.data?.detail || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'trialing':
        return 'blue';
      case 'past_due':
        return 'orange';
      case 'canceled':
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return CheckCircle;
      case 'past_due':
        return AlertCircle;
      case 'canceled':
      case 'cancelled':
        return XCircle;
      default:
        return RefreshCw;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch">
        <Skeleton height="100px" />
        <Skeleton height="100px" />
        <Skeleton height="100px" />
      </VStack>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Box
        p={8}
        bg={bgColor}
        borderRadius="lg"
        borderWidth={1}
        borderColor={borderColor}
        textAlign="center"
      >
        <VStack spacing={4}>
          <Icon as={CreditCard} boxSize={12} color="gray.400" />
          <Text fontSize="lg" fontWeight="medium">
            No Active Subscriptions
          </Text>
          <Text color="gray.500">
            You haven't subscribed to any strategies yet
          </Text>
          <Button colorScheme="blue" onClick={() => window.location.href = '/marketplace'}>
            Browse Strategies
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>My Subscriptions</Heading>
          <Text color="gray.500">
            Manage your strategy subscriptions and billing
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {subscriptions.map((subscription) => {
            const StatusIcon = getStatusIcon(subscription.status);
            const isActive = subscription.status === 'active' || subscription.status === 'trialing';
            
            return (
              <Box
                key={subscription.id}
                p={5}
                bg={bgColor}
                borderRadius="lg"
                borderWidth={1}
                borderColor={borderColor}
                _hover={{ boxShadow: 'md' }}
                transition="all 0.2s"
              >
                <VStack align="stretch" spacing={3}>
                  {/* Strategy Name & Status */}
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="lg">
                        {subscription.strategy_name}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        by {subscription.creator_name}
                      </Text>
                    </VStack>
                    <Badge
                      colorScheme={getStatusColor(subscription.status)}
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      <HStack spacing={1}>
                        <Icon as={StatusIcon} boxSize={3} />
                        <Text>{subscription.status}</Text>
                      </HStack>
                    </Badge>
                  </HStack>

                  <Divider />

                  {/* Pricing Info */}
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Icon as={DollarSign} boxSize={4} color="gray.500" />
                      <Text fontWeight="medium">
                        {formatCurrency(subscription.amount)}/{subscription.interval}
                      </Text>
                    </HStack>
                    
                    {subscription.trial_end && new Date(subscription.trial_end) > new Date() && (
                      <HStack>
                        <Icon as={Calendar} boxSize={4} color="blue.500" />
                        <Text fontSize="sm" color="blue.500">
                          Trial ends {format(new Date(subscription.trial_end), 'MMM d, yyyy')}
                        </Text>
                      </HStack>
                    )}
                    
                    <HStack>
                      <Icon as={Calendar} boxSize={4} color="gray.500" />
                      <Text fontSize="sm" color="gray.500">
                        {isActive ? 'Next billing' : 'Ends'}: {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
                      </Text>
                    </HStack>
                  </VStack>

                  <Divider />

                  {/* Actions */}
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSubscription(subscription);
                        onOpen();
                      }}
                      leftIcon={<Settings size={16} />}
                    >
                      Manage
                    </Button>
                    
                    {subscription.status === 'active' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleCancelSubscription(subscription.id)}
                        isLoading={isProcessing}
                      >
                        Cancel
                      </Button>
                    )}
                    
                    {subscription.status === 'canceled' && new Date(subscription.current_period_end) > new Date() && (
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handleReactivateSubscription(subscription.id)}
                        isLoading={isProcessing}
                      >
                        Reactivate
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </Box>
            );
          })}
        </SimpleGrid>

        {/* Billing History Section */}
        <Box>
          <Heading size="md" mb={4}>Billing History</Heading>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Strategy</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Invoice</Th>
                </Tr>
              </Thead>
              <Tbody>
                {subscriptions.flatMap(sub => 
                  (sub.invoices || []).map(invoice => (
                    <Tr key={invoice.id}>
                      <Td>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</Td>
                      <Td>{sub.strategy_name}</Td>
                      <Td>{formatCurrency(invoice.amount)}</Td>
                      <Td>
                        <Badge colorScheme={invoice.status === 'paid' ? 'green' : 'red'}>
                          {invoice.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Download size={16} />}
                          onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                        >
                          Download
                        </Button>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </VStack>

      {/* Subscription Management Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Manage Subscription
            {selectedSubscription && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {selectedSubscription.strategy_name}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {selectedSubscription && (
              <VStack spacing={4} align="stretch">
                {/* Current Plan */}
                <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
                  <Text fontWeight="bold" mb={2}>Current Plan</Text>
                  <HStack justify="space-between">
                    <Text>{selectedSubscription.price_type}</Text>
                    <Text fontWeight="bold">
                      {formatCurrency(selectedSubscription.amount)}/{selectedSubscription.interval}
                    </Text>
                  </HStack>
                </Box>

                {/* Upgrade Options */}
                {selectedSubscription.available_upgrades && selectedSubscription.available_upgrades.length > 0 && (
                  <>
                    <Text fontWeight="bold">Upgrade Options</Text>
                    <SimpleGrid columns={1} spacing={3}>
                      {selectedSubscription.available_upgrades.map((upgrade) => (
                        <Box
                          key={upgrade.price_type}
                          p={4}
                          borderWidth={1}
                          borderRadius="lg"
                          cursor="pointer"
                          _hover={{ borderColor: 'blue.500' }}
                        >
                          <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{upgrade.label}</Text>
                              <Text fontSize="sm" color="gray.500">
                                Save {upgrade.savings_percent}%
                              </Text>
                            </VStack>
                            <VStack align="end" spacing={0}>
                              <Text fontWeight="bold">
                                {formatCurrency(upgrade.amount)}/{upgrade.interval}
                              </Text>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={() => handleUpgradeSubscription(selectedSubscription.id, upgrade.price_type)}
                                isLoading={isProcessing}
                              >
                                Upgrade
                              </Button>
                            </VStack>
                          </HStack>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </>
                )}

                {/* Cancel Subscription */}
                {selectedSubscription.status === 'active' && (
                  <Alert status="warning" borderRadius="lg">
                    <AlertIcon />
                    <AlertDescription>
                      <VStack align="start" spacing={2}>
                        <Text>
                          Cancelling will stop your subscription at the end of the current billing period.
                        </Text>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => {
                            handleCancelSubscription(selectedSubscription.id);
                          }}
                          isLoading={isProcessing}
                        >
                          Cancel Subscription
                        </Button>
                      </VStack>
                    </AlertDescription>
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SubscriptionManagement;