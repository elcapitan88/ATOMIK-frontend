import React, { useState, useEffect } from 'react';
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
  Box,
  Circle,
  keyframes,
  useToast,
  Badge,
  Divider,
  SimpleGrid,
  Icon,
  Skeleton,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  Sparkles, 
  CreditCard, 
  Shield, 
  Clock,
  CheckCircle,
  Gift,
  Zap,
  Calendar,
  DollarSign,
  Info
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import axiosInstance from '../../../../utils/axiosInstance';

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const StrategyPurchaseModal = ({ 
  isOpen, 
  onClose, 
  strategy, 
  currentUser 
}) => {
  const [pricingOptions, setPricingOptions] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const selectedBorder = useColorModeValue('blue.500', 'blue.400');

  useEffect(() => {
    if (isOpen && strategy?.webhookToken) {
      fetchPricingOptions();
    }
  }, [isOpen, strategy]);

  const fetchPricingOptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axiosInstance.get(
        `/api/v1/strategy-monetization/${strategy.webhookToken}/pricing`
      );
      
      if (response.data && response.data.length > 0) {
        setPricingOptions(response.data);
        // Auto-select the first option
        setSelectedPrice(response.data[0]);
      } else {
        setError('No pricing options available for this strategy');
      }
    } catch (err) {
      console.error('Error fetching pricing options:', err);
      setError('Failed to load pricing options. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPrice) {
      toast({
        title: 'Please select a pricing option',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create checkout session
      const response = await axiosInstance.post(
        `/api/v1/strategy-monetization/${strategy.webhookToken}/purchase`,
        {
          price_type: selectedPrice.price_type,
          customer_email: currentUser?.email
        }
      );

      if (response.data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error('No checkout URL returned');
      }

    } catch (error) {
      setIsProcessing(false);
      toast({
        title: 'Purchase failed',
        description: error.response?.data?.detail || error.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPriceIcon = (priceType) => {
    switch (priceType) {
      case 'monthly':
        return Calendar;
      case 'yearly':
        return Zap;
      case 'lifetime':
        return Shield;
      case 'setup':
        return DollarSign;
      default:
        return DollarSign;
    }
  };

  const getPriceLabel = (priceOption) => {
    switch (priceOption.price_type) {
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      case 'lifetime':
        return 'Lifetime Access';
      case 'setup':
        return 'Setup Fee + Monthly';
      default:
        return priceOption.price_type;
    }
  };

  const getPricingDescription = (priceOption) => {
    const amount = formatPrice(priceOption.amount);
    
    switch (priceOption.price_type) {
      case 'monthly':
        return `${amount} per month`;
      case 'yearly':
        return `${amount} per year`;
      case 'lifetime':
        return `${amount} one-time payment`;
      case 'setup':
        return `${amount} setup + monthly fee`;
      default:
        return amount;
    }
  };

  const calculateSavings = (monthly, yearly) => {
    const monthlyCost = monthly * 12;
    const savings = monthlyCost - yearly;
    const percent = Math.round((savings / monthlyCost) * 100);
    return { savings, percent };
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="2xl"
      isCentered
      closeOnOverlayClick={!isProcessing}
    >
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(4px)" />
      <ModalContent bg={bgColor} borderRadius="xl">
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold">
              Subscribe to {strategy?.name}
            </Text>
            <Text fontSize="sm" color="gray.500">
              by {strategy?.creatorName || strategy?.username}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isProcessing} />
        
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Strategy Info */}
            <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
              <HStack spacing={3}>
                <Circle size="12" bg="blue.500" color="white">
                  <Sparkles size={24} />
                </Circle>
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontWeight="bold">{strategy?.name}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {strategy?.performance?.totalTrades || 0} trades • 
                    {strategy?.performance?.winRate || 0}% win rate
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* Loading State */}
            {isLoading && (
              <VStack spacing={3}>
                <Skeleton height="100px" borderRadius="lg" />
                <Skeleton height="100px" borderRadius="lg" />
                <Skeleton height="100px" borderRadius="lg" />
              </VStack>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <Alert status="error" borderRadius="lg">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {/* Pricing Options */}
            {!isLoading && !error && pricingOptions.length > 0 && (
              <>
                <Text fontWeight="medium" fontSize="lg">
                  Choose your subscription plan:
                </Text>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {pricingOptions.map((option) => {
                    const IconComponent = getPriceIcon(option.price_type);
                    const isSelected = selectedPrice?.id === option.id;
                    const monthlyOption = pricingOptions.find(p => p.price_type === 'monthly');
                    const showSavings = option.price_type === 'yearly' && monthlyOption;
                    const savings = showSavings ? calculateSavings(monthlyOption.amount, option.amount) : null;
                    
                    return (
                      <Box
                        key={option.id}
                        p={4}
                        borderWidth={2}
                        borderColor={isSelected ? selectedBorder : borderColor}
                        borderRadius="lg"
                        bg={isSelected ? selectedBg : 'transparent'}
                        cursor="pointer"
                        onClick={() => setSelectedPrice(option)}
                        transition="all 0.2s"
                        _hover={{
                          borderColor: selectedBorder,
                          transform: 'translateY(-2px)',
                          boxShadow: 'sm'
                        }}
                        position="relative"
                      >
                        {/* Savings Badge */}
                        {showSavings && savings && (
                          <Badge
                            colorScheme="green"
                            position="absolute"
                            top="-10px"
                            right="10px"
                            px={2}
                            py={1}
                            borderRadius="full"
                            fontSize="xs"
                          >
                            Save {savings.percent}%
                          </Badge>
                        )}

                        <VStack align="start" spacing={3}>
                          <HStack>
                            <Circle size="8" bg={isSelected ? 'blue.500' : 'gray.400'} color="white">
                              <IconComponent size={16} />
                            </Circle>
                            <Text fontWeight="bold">{getPriceLabel(option)}</Text>
                          </HStack>
                          
                          <Text fontSize="2xl" fontWeight="bold">
                            {formatPrice(option.amount)}
                            {option.billing_interval && (
                              <Text as="span" fontSize="sm" color="gray.500" ml={1}>
                                /{option.billing_interval}
                              </Text>
                            )}
                          </Text>
                          
                          {option.trial_period_days > 0 && (
                            <Badge colorScheme="green" fontSize="xs">
                              {option.trial_period_days} day free trial
                            </Badge>
                          )}
                          
                          {showSavings && savings && (
                            <Text fontSize="sm" color="green.500">
                              Save {formatPrice(savings.savings)} per year
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    );
                  })}
                </SimpleGrid>

                {/* Benefits */}
                <Box p={4} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="lg">
                  <Text fontWeight="bold" mb={3}>What's included:</Text>
                  <SimpleGrid columns={2} spacing={2}>
                    {[
                      'Real-time strategy signals',
                      'Automated trading execution',
                      'Performance analytics',
                      'Priority support',
                      'Cancel anytime',
                      'Secure payment'
                    ].map((benefit, index) => (
                      <HStack key={index} spacing={2}>
                        <Icon as={CheckCircle} color="green.500" boxSize={4} />
                        <Text fontSize="sm">{benefit}</Text>
                      </HStack>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Platform Fee Info */}
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <Text fontSize="sm">
                      Platform fee: 10-20% based on creator tier. The creator receives 80-90% of your payment.
                    </Text>
                  </Box>
                </Alert>

                {/* Action Buttons */}
                <HStack spacing={3} justify="flex-end">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    isDisabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={handlePurchase}
                    isLoading={isProcessing}
                    loadingText="Processing..."
                    leftIcon={<CreditCard size={18} />}
                    isDisabled={!selectedPrice || isProcessing}
                    size="lg"
                  >
                    {selectedPrice?.trial_period_days > 0 
                      ? `Start ${selectedPrice.trial_period_days}-day free trial`
                      : `Subscribe for ${selectedPrice ? formatPrice(selectedPrice.amount) : '...'}`
                    }
                  </Button>
                </HStack>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default StrategyPurchaseModal;