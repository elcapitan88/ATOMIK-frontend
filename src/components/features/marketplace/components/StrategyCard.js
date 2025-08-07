import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { Users, Lock, Unlock, CheckCircle2 } from 'lucide-react';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';
import StarRating from '../StarRating';
import StrategyPurchaseModal from './StrategyPurchaseModal';

const StrategyCard = ({ strategy, onSubscriptionChange }) => {
  const {
    token,
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
    pricingEndpoint
  } = strategy;

  const [currentRating, setCurrentRating] = useState(rating);
  const [isLoading, setIsLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(isSubscribed);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [pricing, setPricing] = useState(null);
  const toast = useToast();

  const handleSubscription = async () => {
    try {
      setIsLoading(true);
      if (subscribed) {
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
      } else {
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
      }
    } catch (error) {
      // Handle HTTP 402 Payment Required error for monetized strategies
      if (error.response?.status === 402) {
        const errorData = error.response.data?.detail;
        if (errorData && errorData.error_code === 'PAYMENT_REQUIRED') {
          // This is a monetized strategy - open purchase modal
          await handlePurchaseFlow();
          return;
        }
      }
      
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
      // Fetch pricing information
      const pricingResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/strategies/${token}/pricing`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (pricingResponse.ok) {
        const pricingData = await pricingResponse.json();
        setPricing(pricingData);
        setIsPurchaseModalOpen(true);
      } else {
        throw new Error('Failed to fetch pricing information');
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing information. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
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
        transform: 'translateY(-2px)',
        borderColor: "rgba(0, 198, 224, 0.6)",
        boxShadow: "0 4px 12px rgba(0, 198, 224, 0.15)"
      }}
      w="280px"
      h="260px"
    >
      <VStack p={4} spacing={3} align="stretch" h="full">
        {/* Header Section */}
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={0}>
            <HStack align="center" spacing={2}>
              <Text 
                fontSize="md" 
                fontWeight="bold" 
                color="white"
                noOfLines={1}
              >
                {name}
              </Text>
              {isMonetized && (
                <Badge 
                  colorScheme="yellow" 
                  size="sm"
                  variant="solid"
                >
                  💰 PAID
                </Badge>
              )}
              {usageIntent === 'share_free' && (
                <Badge 
                  colorScheme="green" 
                  size="sm"
                  variant="solid"
                >
                  FREE
                </Badge>
              )}
            </HStack>
            <Text fontSize="sm" color="whiteAlpha.700">
              by {username}
            </Text>
          </VStack>
          <Tooltip 
            label={isPublic ? "Public Strategy" : "Private Strategy"} 
            placement="top"
          >
            <Box color="whiteAlpha.600">
              <Icon 
                as={isPublic ? Unlock : Lock} 
                size={16}
              />
            </Box>
          </Tooltip>
        </HStack>

        {/* Strategy Type Badge */}
        <Badge
          colorScheme="blue"
          bg="rgba(0, 198, 224, 0.2)"
          color="white"
          borderRadius="full"
          px={2}
          py={0.5}
          fontSize="xs"
          alignSelf="flex-start"
        >
          {strategyType}
        </Badge>

        {/* Description */}
        <Text 
          fontSize="sm" 
          color="whiteAlpha.800" 
          noOfLines={2}
          flex={1}
        >
          {description}
        </Text>

        {/* Stats Row */}
        <HStack justify="space-between" align="center">
          <StarRating 
            rating={currentRating} 
            token={token}
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

        {/* Subscribe Button */}
        <Button
          onClick={handleSubscription}
          isLoading={isLoading}
          variant="outline"
          size="sm"
          w="full"
          colorScheme={subscribed ? "blue" : "gray"}
          borderColor={subscribed ? "rgba(0, 198, 224, 0.6)" : "whiteAlpha.200"}
          color={subscribed ? "rgba(0, 198, 224, 0.9)" : "white"}
          _hover={{
            bg: subscribed ? "rgba(0, 198, 224, 0.1)" : "whiteAlpha.100",
            borderColor: "rgba(0, 198, 224, 0.6)"
          }}
          leftIcon={subscribed ? <CheckCircle2 size={16} /> : null}
        >
          {subscribed 
            ? "Subscribed" 
            : isMonetized 
              ? "💳 Purchase" 
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