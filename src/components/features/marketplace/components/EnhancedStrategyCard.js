import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  useToast,
  Circle,
  Flex,
  keyframes,
} from '@chakra-ui/react';
import { 
  Users, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Zap, 
  Gift, 
  Crown,
  Sparkles 
} from 'lucide-react';

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const EnhancedStrategyCard = ({ strategy, currentUser, onPurchase }) => {
  const {
    token,
    name,
    description,
    username,
    creatorTier = 'bronze',
    subscriberCount = 0,
    isPublic,
    pricing = null,
    userHasAccess = false,
    userPurchase = null
  } = strategy;

  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Determine pricing display
  const isFree = !pricing || pricing.pricingType === 'free';
  const monthlyPrice = pricing?.baseAmount ? parseFloat(pricing.baseAmount) : 0;
  const hasFreeTrial = pricing?.isTrialEnabled && pricing?.trialDays > 0;
  const isInTrial = userPurchase?.status === 'completed' && userPurchase?.trialEndsAt;

  // Creator tier styling
  const tierConfig = {
    bronze: { color: 'orange.400', bgColor: 'rgba(251, 211, 141, 0.2)' },
    silver: { color: 'gray.300', bgColor: 'rgba(203, 213, 224, 0.2)' },
    gold: { color: 'yellow.400', bgColor: 'rgba(250, 240, 137, 0.2)' }
  };

  const handlePurchaseClick = async () => {
    if (userHasAccess || isFree) return;
    
    setIsLoading(true);
    try {
      await onPurchase(strategy);
      toast({
        title: "🎉 Success!",
        description: hasFreeTrial ? "Your free trial has started!" : "You now have access to this strategy!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: error.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (userHasAccess) {
      return {
        text: isInTrial ? "Free Trial Active" : "Subscribed",
        icon: CheckCircle2,
        color: "green",
        disabled: true
      };
    }
    
    if (isFree) {
      return {
        text: "Follow Free",
        icon: Gift,
        color: "blue",
        disabled: false
      };
    }
    
    if (hasFreeTrial) {
      return {
        text: "Start Free Trial",
        icon: Sparkles,
        color: "purple",
        disabled: false
      };
    }
    
    return {
      text: `Subscribe $${monthlyPrice}/mo`,
      icon: Zap,
      color: "blue",
      disabled: false
    };
  };

  const buttonConfig = getButtonContent();
  const ButtonIcon = buttonConfig.icon;

  return (
    <Box
      bg="rgba(255, 255, 255, 0.08)"
      backdropFilter="blur(15px)"
      borderWidth="1px"
      borderColor={userHasAccess ? "green.400" : "whiteAlpha.200"}
      borderRadius="xl"
      overflow="hidden"
      transition="all 0.3s ease"
      _hover={{
        transform: 'translateY(-4px)',
        borderColor: userHasAccess ? "green.400" : "blue.400",
        boxShadow: userHasAccess 
          ? "0 8px 25px rgba(72, 187, 120, 0.25)" 
          : "0 8px 25px rgba(66, 153, 225, 0.25)"
      }}
      w="320px"
      h="auto"
      position="relative"
    >
      {/* Premium glow for paid strategies */}
      {!isFree && (
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          height="2px"
          bg="linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.8), transparent)"
          animation={`${shimmer} 2s infinite`}
        />
      )}

      <VStack p={5} spacing={4} align="stretch" h="full">
        {/* Header with creator tier */}
        <Flex justify="space-between" align="start">
          <VStack align="start" spacing={1} flex={1}>
            <HStack spacing={2} align="center">
              <Text 
                fontSize="lg" 
                fontWeight="bold" 
                color="white"
                noOfLines={1}
              >
                {name}
              </Text>
              {!isFree && (
                <Circle size="6" bg="purple.500" color="white">
                  <Crown size={12} />
                </Circle>
              )}
            </HStack>
            
            <HStack spacing={2} align="center">
              <Text fontSize="sm" color="whiteAlpha.700">
                by {username}
              </Text>
              <Badge
                bg={tierConfig[creatorTier].bgColor}
                color={tierConfig[creatorTier].color}
                borderRadius="full"
                px={2}
                py={0.5}
                fontSize="xs"
                textTransform="capitalize"
              >
                {creatorTier}
              </Badge>
            </HStack>
          </VStack>
          
          <Circle size="8" color="whiteAlpha.600">
            {isPublic ? <Unlock size={16} /> : <Lock size={16} />}
          </Circle>
        </Flex>

        {/* Description */}
        <Text 
          fontSize="sm" 
          color="whiteAlpha.800" 
          noOfLines={3}
          minH="60px"
        >
          {description}
        </Text>

        {/* Pricing Display */}
        {!isFree && (
          <Box
            p={3}
            bg="rgba(102, 126, 234, 0.1)"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="purple.400"
          >
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={0}>
                <Text color="white" fontWeight="bold" fontSize="lg">
                  ${monthlyPrice}/month
                </Text>
                {hasFreeTrial && (
                  <Text color="green.300" fontSize="xs" fontWeight="medium">
                    {pricing.trialDays}-day free trial
                  </Text>
                )}
              </VStack>
              <Badge colorScheme="purple" variant="solid" fontSize="xs">
                Premium
              </Badge>
            </HStack>
          </Box>
        )}

        {/* Stats */}
        <HStack justify="space-between" align="center">
          <HStack spacing={2} color="whiteAlpha.700">
            <Users size={16} />
            <Text fontSize="sm" fontWeight="medium">
              {subscriberCount.toLocaleString()} followers
            </Text>
          </HStack>
          
          {userHasAccess && (
            <Badge colorScheme="green" variant="solid" fontSize="xs">
              Active
            </Badge>
          )}
        </HStack>

        {/* Purchase Button */}
        <Button
          onClick={handlePurchaseClick}
          isLoading={isLoading}
          isDisabled={buttonConfig.disabled}
          size="lg"
          w="full"
          h="12"
          bg={
            buttonConfig.disabled 
              ? "rgba(72, 187, 120, 0.2)" 
              : buttonConfig.color === "purple"
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : buttonConfig.color === "green"
              ? "rgba(72, 187, 120, 0.2)"
              : "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)"
          }
          color="white"
          fontWeight="bold"
          borderWidth={buttonConfig.disabled ? "1px" : "0"}
          borderColor={buttonConfig.disabled ? "green.400" : "transparent"}
          leftIcon={<ButtonIcon size={18} />}
          _hover={!buttonConfig.disabled ? {
            transform: "translateY(-1px)",
            boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)"
          } : {}}
          _active={!buttonConfig.disabled ? {
            transform: "translateY(0px)"
          } : {}}
          transition="all 0.2s"
          animation={hasFreeTrial && !userHasAccess ? `${pulse} 2s infinite` : undefined}
        >
          {buttonConfig.text}
        </Button>

        {/* Trial countdown for active trials */}
        {isInTrial && userPurchase?.trialEndsAt && (
          <Box
            p={2}
            bg="rgba(250, 240, 137, 0.1)"
            borderRadius="md"
            textAlign="center"
          >
            <Text color="yellow.300" fontSize="xs" fontWeight="medium">
              Trial ends {new Date(userPurchase.trialEndsAt).toLocaleDateString()}
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default EnhancedStrategyCard;