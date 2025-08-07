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
  Box,
  Badge,
  Icon,
  Divider,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { CheckCircle2, Crown, Shield, Zap, Gift, Calendar } from 'lucide-react';

const StrategyPurchaseModal = ({ 
  isOpen, 
  onClose, 
  strategy, 
  pricing, 
  onSuccess 
}) => {
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  // Process purchase
  const handlePurchase = async () => {
    if (!selectedPrice) {
      toast({
        title: "No Pricing Selected",
        description: "Please select a pricing option to continue",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Import marketplace API
      const { marketplaceApi } = await import('@/services/api/marketplace/marketplaceApi');
      
      // Determine if this is a subscription or one-time purchase
      const isSubscription = selectedPrice.price_type === 'monthly' || selectedPrice.price_type === 'yearly';
      const isOneTime = selectedPrice.price_type === 'lifetime';
      
      let result;
      
      if (isSubscription) {
        // Handle subscription purchase
        result = await marketplaceApi.subscribeToStrategy(strategy.token, {
          payment_method_id: 'pm_card_visa', // This would come from Stripe Elements in a real implementation
          billing_interval: selectedPrice.price_type, // 'monthly' or 'yearly'
          start_trial: pricing.is_trial_enabled && pricing.trial_days > 0
        });
      } else if (isOneTime) {
        // Handle one-time purchase
        result = await marketplaceApi.purchaseStrategy(strategy.token, {
          payment_method_id: 'pm_card_visa', // This would come from Stripe Elements in a real implementation
          start_trial: false
        });
      } else {
        throw new Error('Unsupported pricing type');
      }

      // Handle different response types
      if (result.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = result.checkout_url;
      } else {
        // Direct purchase success
        toast({
          title: "🎉 Purchase Successful!",
          description: "You now have access to this strategy",
          status: "success",
          duration: 4000,
          isClosable: true,
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Please try again later",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get pricing display info
  const getPricingDisplay = (price) => {
    const amount = parseFloat(price.amount);
    
    switch (price.price_type) {
      case 'monthly':
        return {
          title: 'Monthly Subscription',
          price: `$${amount}/month`,
          description: 'Recurring monthly billing',
          icon: Calendar,
          color: 'blue'
        };
      case 'yearly':
        return {
          title: 'Annual Subscription',
          price: `$${amount}/year`,
          description: `Save ${Math.round((1 - (amount/12) / (pricing.prices.find(p => p.price_type === 'monthly')?.amount || amount/12)) * 100)}%`,
          icon: Crown,
          color: 'purple'
        };
      case 'lifetime':
        return {
          title: 'Lifetime Access',
          price: `$${amount}`,
          description: 'One-time payment, forever access',
          icon: Zap,
          color: 'green'
        };
      case 'setup':
        return {
          title: 'Setup Fee',
          price: `$${amount}`,
          description: 'One-time setup charge',
          icon: Gift,
          color: 'orange'
        };
      default:
        return {
          title: 'Premium Access',
          price: `$${amount}`,
          description: 'Access to strategy',
          icon: CheckCircle2,
          color: 'blue'
        };
    }
  };

  if (!strategy || !pricing || !pricing.prices || pricing.prices.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
        <ModalContent bg="rgba(255, 255, 255, 0.1)" backdropFilter="blur(15px)" borderColor="whiteAlpha.200">
          <ModalHeader color="white">Purchase Strategy</ModalHeader>
          <ModalCloseButton color="whiteAlpha.700" />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Spinner size="lg" color="blue.500" />
              <Text color="whiteAlpha.700">Loading pricing information...</Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
      <ModalContent 
        bg="rgba(255, 255, 255, 0.1)" 
        backdropFilter="blur(15px)" 
        borderColor="whiteAlpha.200"
        maxW="600px"
      >
        <ModalHeader color="white">
          <HStack spacing={3}>
            <Crown size={24} color="#FFD700" />
            <VStack align="start" spacing={0}>
              <Text fontSize="xl">Purchase Premium Strategy</Text>
              <Text fontSize="sm" color="whiteAlpha.700" fontWeight="normal">
                {strategy.name} by {strategy.username}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="whiteAlpha.700" />
        
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            
            {/* Strategy Info */}
            <Box 
              p={4}
              bg="rgba(255, 255, 255, 0.05)"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
            >
              <VStack align="start" spacing={2}>
                <HStack justify="space-between" w="full">
                  <Badge colorScheme="purple" size="sm">Premium Strategy</Badge>
                  <Badge colorScheme="blue" size="sm">{strategy.strategy_type}</Badge>
                </HStack>
                <Text color="whiteAlpha.800" fontSize="sm">
                  {strategy.details || strategy.description}
                </Text>
                <HStack spacing={4} color="whiteAlpha.600" fontSize="xs">
                  <Text>👥 {strategy.subscriber_count || 0} subscribers</Text>
                  <Text>⭐ {strategy.rating || 0} rating</Text>
                </HStack>
              </VStack>
            </Box>

            {/* Pricing Options */}
            <VStack spacing={3} align="stretch">
              <Text fontSize="lg" fontWeight="semibold" color="white">
                Choose Your Plan
              </Text>
              
              {pricing.prices.map((price) => {
                const displayInfo = getPricingDisplay(price);
                const isSelected = selectedPrice?.id === price.id;
                const IconComponent = displayInfo.icon;
                
                return (
                  <Box
                    key={price.id}
                    p={4}
                    bg={isSelected ? "rgba(102, 126, 234, 0.2)" : "rgba(255, 255, 255, 0.05)"}
                    borderRadius="lg"
                    borderWidth="2px"
                    borderColor={isSelected ? "blue.400" : "whiteAlpha.100"}
                    cursor="pointer"
                    transition="all 0.2s"
                    onClick={() => setSelectedPrice(price)}
                    _hover={{
                      borderColor: "blue.400",
                      bg: "rgba(102, 126, 234, 0.1)"
                    }}
                  >
                    <HStack justify="space-between" align="center">
                      <HStack spacing={3}>
                        <Box
                          p={2}
                          bg={`${displayInfo.color}.500`}
                          borderRadius="md"
                          color="white"
                        >
                          <IconComponent size={16} />
                        </Box>
                        <VStack align="start" spacing={1}>
                          <Text color="white" fontWeight="semibold" fontSize="md">
                            {displayInfo.title}
                          </Text>
                          <Text color="whiteAlpha.600" fontSize="sm">
                            {displayInfo.description}
                          </Text>
                          {price.display_name && (
                            <Text color="whiteAlpha.500" fontSize="xs">
                              {price.display_name}
                            </Text>
                          )}
                        </VStack>
                      </HStack>
                      <VStack align="end" spacing={0}>
                        <Text color="white" fontWeight="bold" fontSize="lg">
                          {displayInfo.price}
                        </Text>
                        {isSelected && (
                          <CheckCircle2 size={16} color="#48BB78" />
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>

            {/* Security Notice */}
            <Alert status="info" bg="rgba(79, 209, 197, 0.1)" borderColor="teal.400">
              <AlertIcon color="teal.300" />
              <VStack align="start" spacing={0}>
                <Text color="teal.300" fontSize="sm" fontWeight="semibold">
                  Secure Payment by Stripe
                </Text>
                <Text color="teal.200" fontSize="xs">
                  Your payment is secure and protected. Cancel anytime.
                </Text>
              </VStack>
            </Alert>

            <Divider borderColor="whiteAlpha.200" />

            {/* Action Buttons */}
            <HStack spacing={3} justify="end">
              <Button
                variant="outline"
                borderColor="whiteAlpha.200"
                color="whiteAlpha.700"
                onClick={onClose}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Cancel
              </Button>
              
              <Button
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                color="white"
                isLoading={isProcessing}
                loadingText="Processing..."
                isDisabled={!selectedPrice}
                onClick={handlePurchase}
                leftIcon={<Shield size={16} />}
                _hover={{
                  transform: "translateY(-1px)",
                  boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)"
                }}
                _disabled={{
                  opacity: 0.6,
                  cursor: "not-allowed",
                  _hover: {}
                }}
              >
                {selectedPrice ? 
                  `Purchase ${getPricingDisplay(selectedPrice).price}` : 
                  'Select a Plan'
                }
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default StrategyPurchaseModal;