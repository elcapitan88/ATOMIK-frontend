import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SimpleGrid,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Skeleton,
  SkeletonText,
  Flex,
  useToast
} from '@chakra-ui/react';
import { TrendingUp, Users, Calendar, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';
import { marketplaceApi } from '@/services/api/marketplace/marketplaceApi';
import StrategyPurchaseModal from '@/components/features/marketplace/components/StrategyPurchaseModal';

const MotionBox = motion(Box);

const StrategyCard = ({
  strategy,
  isGuest,
  onSubscriptionChange
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isSubscribed, setIsSubscribed] = useState(strategy.is_subscribed || false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [pricing, setPricing] = useState(null);

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num?.toString() || '0';
  };

  // Transform backend pricing data to frontend format
  const transformPricingData = (pricingData) => {
    if (pricingData.is_free) {
      return {
        is_free: true,
        pricing_type: 'free',
        prices: []
      };
    }

    const prices = [];

    if (pricingData.base_amount && pricingData.billing_intervals?.includes('monthly')) {
      prices.push({
        id: 'monthly',
        price_type: 'monthly',
        amount: parseFloat(pricingData.base_amount),
        display_name: 'Monthly Subscription'
      });
    }

    if (pricingData.yearly_amount && pricingData.billing_intervals?.includes('yearly')) {
      prices.push({
        id: 'yearly',
        price_type: 'yearly',
        amount: parseFloat(pricingData.yearly_amount),
        display_name: 'Annual Subscription'
      });
    }

    if (pricingData.lifetime_amount) {
      prices.push({
        id: 'lifetime',
        price_type: 'lifetime',
        amount: parseFloat(pricingData.lifetime_amount),
        display_name: 'Lifetime Access'
      });
    }

    return {
      is_free: false,
      pricing_type: pricingData.pricing_type || 'subscription',
      prices: prices
    };
  };

  const handlePurchaseFlow = async () => {
    try {
      const pricingData = await marketplaceApi.getStrategyPricing(strategy.token);
      const transformedPricing = transformPricingData(pricingData);
      setPricing(transformedPricing);
      setIsPurchaseModalOpen(true);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load pricing information",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSubscriptionClick = async () => {
    // Handle guest users
    if (isGuest) {
      const pendingStrategy = {
        token: strategy.token,
        name: strategy.name,
        isMonetized: strategy.is_monetized,
        timestamp: Date.now()
      };
      sessionStorage.setItem('pendingStrategySubscription', JSON.stringify(pendingStrategy));
      navigate("/pricing?source=strategy_subscribe");
      return;
    }

    setIsLoading(true);

    try {
      if (isSubscribed) {
        // Unsubscribe
        await webhookApi.unsubscribeFromStrategy(strategy.token);
        setIsSubscribed(false);
        toast({
          title: "Unsubscribed",
          description: `You have unsubscribed from ${strategy.name}`,
          status: "info",
          duration: 3000,
          isClosable: true,
          position: "top-right"
        });
        if (onSubscriptionChange) {
          onSubscriptionChange(strategy.token, false);
        }
      } else {
        // Subscribe - check if monetized
        if (strategy.is_monetized || strategy.usage_intent === 'monetize') {
          await handlePurchaseFlow();
        } else {
          // Free subscription
          try {
            await webhookApi.subscribeToStrategy(strategy.token);
            setIsSubscribed(true);
            toast({
              title: "Subscribed!",
              description: `You are now subscribed to ${strategy.name}`,
              status: "success",
              duration: 3000,
              isClosable: true,
              position: "top-right"
            });
            if (onSubscriptionChange) {
              onSubscriptionChange(strategy.token, true);
            }
          } catch (subscribeError) {
            // If 402 error, it's a paid strategy
            if (subscribeError.response?.status === 402) {
              await handlePurchaseFlow();
              return;
            }
            throw subscribeError;
          }
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseSuccess = () => {
    setIsSubscribed(true);
    setIsPurchaseModalOpen(false);
    toast({
      title: "Purchase Successful!",
      description: `You now have access to ${strategy.name}`,
      status: "success",
      duration: 5000,
      isClosable: true,
      position: "top-right"
    });
    if (onSubscriptionChange) {
      onSubscriptionChange(strategy.token, true);
    }
  };

  return (
    <>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        bg="#1a1a1a"
        border="1px solid #333"
        borderRadius="lg"
        p={6}
        _hover={{
          borderColor: "#00C6E0",
          transform: "translateY(-2px)",
          boxShadow: "0 8px 25px -8px rgba(0, 198, 224, 0.3)"
        }}
        cursor="pointer"
      >
        <VStack spacing={4} align="stretch" h="full">
          {/* Header */}
          <VStack spacing={2} align="start" flex={1}>
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="white"
              noOfLines={2}
              lineHeight="1.3"
            >
              {strategy.name || 'Unnamed Strategy'}
            </Text>

            {strategy.description && (
              <Text
                fontSize="sm"
                color="whiteAlpha.700"
                noOfLines={3}
                lineHeight="1.4"
              >
                {strategy.description}
              </Text>
            )}
          </VStack>

          {/* Stats */}
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <HStack spacing={2}>
                <Users size={16} color="rgba(255, 255, 255, 0.6)" />
                <Text fontSize="sm" color="whiteAlpha.700">
                  {formatNumber(strategy.total_subscribers)} subscribers
                </Text>
              </HStack>

              <HStack spacing={2}>
                <Calendar size={16} color="rgba(255, 255, 255, 0.6)" />
                <Text fontSize="sm" color="whiteAlpha.700">
                  {formatDate(strategy.created_at)}
                </Text>
              </HStack>
            </HStack>

            {/* Pricing */}
            <HStack justify="space-between" align="center">
              {strategy.is_monetized && strategy.min_price ? (
                <VStack spacing={0} align="start">
                  <Text fontSize="xs" color="whiteAlpha.500">
                    From
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    {formatCurrency(strategy.min_price)}
                    <Text as="span" fontSize="sm" color="whiteAlpha.600">/mo</Text>
                  </Text>
                </VStack>
              ) : (
                <Text fontSize="lg" fontWeight="bold" color="#10B981">
                  Free
                </Text>
              )}
            </HStack>
          </VStack>

          {/* Subscribe Button */}
          <Button
            size="md"
            bg={isSubscribed ? "transparent" : "#00C6E0"}
            color={isSubscribed ? "#00C6E0" : "white"}
            border={isSubscribed ? "1px solid #00C6E0" : "none"}
            _hover={{
              bg: isSubscribed ? "rgba(0, 198, 224, 0.1)" : "#00A3B8",
            }}
            _active={{ bg: isSubscribed ? "rgba(0, 198, 224, 0.2)" : "#008C9E" }}
            onClick={handleSubscriptionClick}
            isLoading={isLoading}
            loadingText={isSubscribed ? "Unsubscribing..." : "Subscribing..."}
            leftIcon={isSubscribed ? <Check size={16} /> : <TrendingUp size={16} />}
          >
            {isSubscribed ? "Subscribed" : "Subscribe"}
          </Button>
        </VStack>
      </MotionBox>

      {/* Purchase Modal for Paid Strategies */}
      {pricing && (
        <StrategyPurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          strategy={{
            token: strategy.token,
            name: strategy.name,
            description: strategy.description
          }}
          pricing={pricing}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}
    </>
  );
};

const StrategyCardSkeleton = () => (
  <Box
    bg="#1a1a1a"
    border="1px solid #333"
    borderRadius="lg"
    p={6}
    h="280px"
  >
    <VStack spacing={4} align="stretch" h="full">
      <VStack spacing={2} align="start">
        <Skeleton height="24px" width="80%" startColor="#333" endColor="#555" />
        <SkeletonText
          mt="2"
          noOfLines={3}
          spacing="2"
          skeletonHeight="2"
          startColor="#333"
          endColor="#555"
        />
      </VStack>

      <VStack spacing={3} align="stretch">
        <HStack justify="space-between">
          <Skeleton height="16px" width="100px" startColor="#333" endColor="#555" />
          <Skeleton height="16px" width="80px" startColor="#333" endColor="#555" />
        </HStack>

        <HStack justify="space-between">
          <Skeleton height="32px" width="100px" startColor="#333" endColor="#555" />
          <Skeleton height="32px" width="80px" startColor="#333" endColor="#555" />
        </HStack>
      </VStack>

      <Skeleton height="40px" width="full" startColor="#333" endColor="#555" />
    </VStack>
  </Box>
);

const StrategyGrid = ({
  strategies = [],
  isLoading = false,
  onSubscriptionChange
}) => {
  const { user } = useAuth();
  const isGuest = !user;

  // Show skeleton loading state
  if (isLoading) {
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {Array.from({ length: 6 }).map((_, index) => (
          <StrategyCardSkeleton key={index} />
        ))}
      </SimpleGrid>
    );
  }

  // Show empty state
  if (!strategies || strategies.length === 0) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        py={12}
        px={8}
        textAlign="center"
      >
        <TrendingUp size={48} color="rgba(255, 255, 255, 0.3)" />
        <Text fontSize="lg" fontWeight="semibold" color="white" mt={4} mb={2}>
          No strategies yet
        </Text>
        <Text fontSize="sm" color="whiteAlpha.600" maxW="400px">
          This creator hasn't published any trading strategies yet.
          Follow them to get notified when they share new strategies.
        </Text>
      </Flex>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {strategies.map((strategy, index) => (
        <StrategyCard
          key={strategy.id || index}
          strategy={strategy}
          isGuest={isGuest}
          onSubscriptionChange={onSubscriptionChange}
        />
      ))}
    </SimpleGrid>
  );
};

export default StrategyGrid;
