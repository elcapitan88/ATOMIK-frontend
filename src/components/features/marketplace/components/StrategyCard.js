import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Tooltip,
  Button,
  useToast,
  useClipboard,
} from '@chakra-ui/react';
import { Users, Lock, Unlock, CheckCircle2, Shield, TrendingUp, Copy } from 'lucide-react';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';
import { engineStrategiesApi } from '@/services/api/strategies/engineStrategiesApi';
import StarRating from '../StarRating';
import StrategyPurchaseModal from './StrategyPurchaseModal';

const StrategyCard = ({ strategy, onSubscriptionChange, isMobile = false, isGuest = false }) => {
  const {
    token,
    source_id, // This is the ID for engine strategies or token for webhooks
    name,
    description,
    username,
    strategyType,
    rating = 0,
    subscriberCount = 0,
    isPublic,
    isSubscribed = false,
    isMonetized = false,
    usageIntent = 'personal',
    marketplacePurchaseUrl,
    pricingEndpoint,
    // Phase 2: Trust metrics for verified live performance
    live_total_trades = 0,
    live_winning_trades = 0,
    live_total_pnl = 0,
    live_win_rate = 0,
    combined_hash = null,
    is_locked = false
  } = strategy;

  // Special handling for Break N Enter - always treat as monetized
  const isBreakNEnter = token === 'OGgxOp0wOd60YGb4kc4CEh8oSz2ZCscKVVZtfwbCbHg';
  const isStrategyMonetized = isMonetized || usageIntent === 'monetize' || isBreakNEnter;

  const [currentRating, setCurrentRating] = useState(rating);
  const [isLoading, setIsLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(isSubscribed);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [pricing, setPricing] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { onCopy: onCopyHash, hasCopied: hasCopiedHash } = useClipboard(combined_hash || '');

  // Helper to format and copy verification hash
  const handleCopyHash = () => {
    if (combined_hash) {
      onCopyHash();
      toast({
        title: "Hash Copied",
        description: "Verification hash copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // Helper to truncate hash for display
  const truncateHash = (hash) => {
    if (!hash) return null;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // Debug logging for the specific purchased strategy
  React.useEffect(() => {
    if (token === 'OGgxOp0wOd60YGb4kc4CEh8oSz2ZCscKVVZtfwbCbHg') {
      console.log('[StrategyCard] Break N Enter strategy props:', {
        token,
        name,
        isSubscribed,
        subscribed,
        isMonetized,
        usageIntent
      });
    }
  }, [token, name, isSubscribed, subscribed, isMonetized, usageIntent]);

  const handleSubscription = async () => {
    if (isGuest) {
      // Save strategy info for auto-subscription after signup
      const pendingStrategy = {
        token,
        name,
        strategyType,
        source_id,
        isMonetized: isStrategyMonetized,
        timestamp: Date.now()
      };
      sessionStorage.setItem('pendingStrategySubscription', JSON.stringify(pendingStrategy));

      // Navigate to pricing page with strategy context
      navigate("/pricing?source=strategy_subscribe");
      return;
    }

    try {
      setIsLoading(true);
      if (subscribed) {
        if (strategyType === 'engine') {
          // For engine strategies, use the engine API to unsubscribe
          const strategyId = strategy.source_id || strategy.id;
          await engineStrategiesApi.unsubscribeFromStrategy(strategyId);
          toast({
            title: "Unsubscribed",
            description: "You have unsubscribed from this strategy",
            status: "info",
            duration: 3000,
            isClosable: true,
          });
          setSubscribed(false);
          if (onSubscriptionChange) {
            onSubscriptionChange(token, false);
          }
        } else {
          // For webhook strategies, use the unsubscribe API
          await webhookApi.unsubscribeFromStrategy(token);
          toast({
            title: "Unsubscribed",
            description: "You have unsubscribed from this strategy",
            status: "info",
            duration: 3000,
            isClosable: true,
          });
          setSubscribed(false);
          if (onSubscriptionChange) {
            onSubscriptionChange(token, false);
          }
        }
      } else {
        // Check if strategy is monetized - if so, go directly to purchase flow
        // Special check for Break N Enter which should always be monetized
        const isBreakNEnter = token === 'OGgxOp0wOd60YGb4kc4CEh8oSz2ZCscKVVZtfwbCbHg';

        // Debug logging for Break N Enter
        if (isBreakNEnter) {
          console.log('[StrategyCard] Break N Enter subscribe attempt:', {
            name,
            token,
            isMonetized,
            usageIntent,
            isBreakNEnter
          });
        }

        if (isMonetized || usageIntent === 'monetize' || isBreakNEnter) {
          console.log('[StrategyCard] Strategy is monetized, going to purchase flow');
          await handlePurchaseFlow();
          return;
        }

        // For free strategies, handle based on strategy type
        if (strategyType === 'engine') {
          // For engine strategies, use the engine API to subscribe
          const strategyId = strategy.source_id || strategy.id;
          await engineStrategiesApi.subscribeToStrategy(strategyId);
          toast({
            title: "Subscribed!",
            description: "You are now subscribed to this strategy. You can activate it in your Strategy Dashboard.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        } else {
          // For webhook strategies, use the subscription API
          try {
            await webhookApi.subscribeToStrategy(token);
            toast({
              title: "Subscribed!",
              description: "You are now subscribed to this strategy",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            setSubscribed(true);
            if (onSubscriptionChange) {
              onSubscriptionChange(token, true);
            }
          } catch (subscribeError) {
            // If we get a 402 error, it means this is a paid strategy
            if (subscribeError.response?.status === 402) {
              console.log('[StrategyCard] Got 402 error, triggering purchase flow for:', name);
              await handlePurchaseFlow();
              return;
            }
            throw subscribeError; // Re-throw other errors
          }
        }
      }
    } catch (error) {
      // Handle other errors
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

  const handleRatingChange = (newRating) => {
    setCurrentRating(newRating);
  };

  // Handle purchase flow for monetized strategies
  const handlePurchaseFlow = async () => {
    try {
      // Import and use marketplace API
      const { marketplaceApi } = await import('@/services/api/marketplace/marketplaceApi');

      // Fetch pricing information using the API service
      const pricingData = await marketplaceApi.getStrategyPricing(token);

      // Transform backend response to expected frontend format
      const transformedPricing = transformPricingData(pricingData);

      setPricing(transformedPricing);
      setIsPurchaseModalOpen(true);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load pricing information. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Transform backend PricingOptionsResponse to frontend expected format
  const transformPricingData = (pricingData) => {
    if (pricingData.is_free) {
      return {
        is_free: true,
        pricing_type: 'free',
        prices: []
      };
    }

    const prices = [];

    // Add monthly option if available
    if (pricingData.base_amount && pricingData.billing_intervals?.includes('monthly')) {
      prices.push({
        id: 'monthly',
        price_type: 'monthly',
        amount: parseFloat(pricingData.base_amount),
        display_name: 'Monthly Subscription'
      });
    }

    // Add yearly option if available
    if (pricingData.yearly_amount && pricingData.billing_intervals?.includes('yearly')) {
      prices.push({
        id: 'yearly',
        price_type: 'yearly',
        amount: parseFloat(pricingData.yearly_amount),
        display_name: 'Annual Subscription'
      });
    }

    // Add setup fee if available
    if (pricingData.setup_fee) {
      prices.push({
        id: 'setup',
        price_type: 'setup',
        amount: parseFloat(pricingData.setup_fee),
        display_name: 'Setup Fee'
      });
    }

    // Handle one-time pricing
    if (pricingData.pricing_type === 'one_time' && pricingData.base_amount) {
      prices.push({
        id: 'lifetime',
        price_type: 'lifetime',
        amount: parseFloat(pricingData.base_amount),
        display_name: 'One-time Purchase'
      });
    }

    return {
      is_free: false,
      pricing_type: pricingData.pricing_type,
      trial_days: pricingData.trial_days || 0,
      is_trial_enabled: pricingData.is_trial_enabled || false,
      user_has_access: pricingData.user_has_access || false,
      prices: prices
    };
  };

  // Handle successful purchase
  const handlePurchaseSuccess = () => {
    setSubscribed(true);
    setIsPurchaseModalOpen(false);
    if (onSubscriptionChange) {
      onSubscriptionChange(token, true);
    }
  };

  return (
    <Box
      bg="rgba(255, 255, 255, 0.1)"
      backdropFilter="blur(10px)"
      borderWidth="1px"
      borderColor={subscribed ? "rgba(0, 198, 224, 0.6)" : "whiteAlpha.200"}
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.2s"
      _hover={{
        transform: isMobile ? 'none' : 'translateY(-2px)',
        borderColor: "rgba(0, 198, 224, 0.6)",
        boxShadow: isMobile ? "none" : "0 4px 12px rgba(0, 198, 224, 0.15)"
      }}
      w={isMobile ? "320px" : "280px"}
      maxW={isMobile ? "calc(100% - 16px)" : "280px"}
      h={isMobile ? "auto" : "260px"}
      minH={isMobile ? "160px" : "260px"}
    >
      <VStack p={isMobile ? 3 : 4} spacing={isMobile ? 2 : 3} align="stretch" h="full">
        {/* Header Section */}
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={0} flex={1}>
            <HStack align="center" spacing={2}>
              <Text
                fontSize="md"
                fontWeight="bold"
                color="white"
                noOfLines={1}
              >
                {name}
              </Text>
            </HStack>
            <Text fontSize="sm" color="whiteAlpha.700">
              by {username}
            </Text>
          </VStack>
          {/* Pricing Badge - Glassmorphic style matching app aesthetic */}
          {isStrategyMonetized ? (
            <Box
              bg="rgba(255, 193, 7, 0.15)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(255, 193, 7, 0.4)"
              borderRadius="full"
              px={3}
              py={0.5}
            >
              <Text
                fontSize="0.65rem"
                fontWeight="bold"
                color="rgba(255, 193, 7, 1)"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                Premium
              </Text>
            </Box>
          ) : (
            <Box
              bg="rgba(16, 185, 129, 0.15)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(16, 185, 129, 0.4)"
              borderRadius="full"
              px={3}
              py={0.5}
            >
              <Text
                fontSize="0.65rem"
                fontWeight="bold"
                color="rgba(16, 185, 129, 1)"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                Free
              </Text>
            </Box>
          )}
        </HStack>

        {/* Description */}
        <Text
          fontSize={isMobile ? "xs" : "sm"}
          color="whiteAlpha.800"
          noOfLines={isMobile ? 2 : 2}
          flex={isMobile ? "none" : 1}
        >
          {description}
        </Text>

        {/* Stats Row */}
        <HStack justify="space-between" align="center">
          <StarRating
            rating={currentRating}
            sourceId={source_id || token} // Use source_id for unified rating endpoint
            onRatingChange={handleRatingChange}
            isInteractive={subscribed}
          />
          <HStack spacing={1} color="whiteAlpha.800">
            <Icon as={Users} size={14} />
            <Text fontSize="sm">
              {subscriberCount.toLocaleString()}
            </Text>
          </HStack>
        </HStack>

        {/* Trust Metrics - Phase 2: Verified Live Performance */}
        {is_locked && live_total_trades > 0 && (
          <Box
            bg="rgba(16, 185, 129, 0.08)"
            border="1px solid rgba(16, 185, 129, 0.3)"
            borderRadius="md"
            p={2}
          >
            <HStack justify="space-between" align="center" mb={1}>
              <HStack spacing={1}>
                <Icon as={Shield} boxSize={3} color="green.400" />
                <Text fontSize="xs" fontWeight="semibold" color="green.400">
                  Verified Performance
                </Text>
              </HStack>
              <Tooltip label={hasCopiedHash ? "Copied!" : "Copy verification hash"}>
                <HStack
                  spacing={1}
                  cursor="pointer"
                  onClick={handleCopyHash}
                  _hover={{ opacity: 0.8 }}
                >
                  <Text fontSize="xs" color="whiteAlpha.600" fontFamily="mono">
                    {truncateHash(combined_hash)}
                  </Text>
                  <Icon as={Copy} boxSize={3} color="whiteAlpha.600" />
                </HStack>
              </Tooltip>
            </HStack>
            <HStack justify="space-between" spacing={2}>
              <VStack spacing={0} align="start">
                <Text fontSize="xs" color="whiteAlpha.600">Trades</Text>
                <Text fontSize="sm" fontWeight="bold" color="white">
                  {live_total_trades}
                </Text>
              </VStack>
              <VStack spacing={0} align="center">
                <Text fontSize="xs" color="whiteAlpha.600">Win Rate</Text>
                <Text fontSize="sm" fontWeight="bold" color={live_win_rate >= 50 ? "green.400" : "red.400"}>
                  {live_win_rate.toFixed(1)}%
                </Text>
              </VStack>
              <VStack spacing={0} align="end">
                <Text fontSize="xs" color="whiteAlpha.600">PnL</Text>
                <Text fontSize="sm" fontWeight="bold" color={live_total_pnl >= 0 ? "green.400" : "red.400"}>
                  {live_total_pnl >= 0 ? '+' : ''}{live_total_pnl.toFixed(2)}%
                </Text>
              </VStack>
            </HStack>
          </Box>
        )}

        {/* Subscribe Button */}
        <Button
          onClick={handleSubscription}
          isLoading={isLoading}
          variant="outline"
          size={isMobile ? "md" : "sm"}
          w="full"
          minH="44px"
          colorScheme={subscribed ? "blue" : "gray"}
          borderColor={subscribed ? "rgba(0, 198, 224, 0.6)" : "whiteAlpha.200"}
          color={subscribed ? "rgba(0, 198, 224, 0.9)" : "white"}
          _hover={{
            bg: subscribed ? "rgba(0, 198, 224, 0.1)" : "whiteAlpha.100",
            borderColor: "rgba(0, 198, 224, 0.6)"
          }}
          leftIcon={subscribed ? <CheckCircle2 size={isMobile ? 18 : 16} /> : null}
          fontSize={isMobile ? "sm" : "xs"}
        >
          {subscribed
            ? "Subscribed"
            : isGuest
              ? "Sign Up to Subscribe"
              : isStrategyMonetized
                ? "View Pricing"
                : "Subscribe Free"
          }
        </Button>
      </VStack>

      {/* Purchase Modal */}
      {isPurchaseModalOpen && pricing && (
        <StrategyPurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          strategy={strategy}
          pricing={pricing}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </Box>
  );
};

export default StrategyCard;