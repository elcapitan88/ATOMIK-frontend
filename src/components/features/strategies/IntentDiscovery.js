// frontend/src/components/features/strategies/IntentDiscovery.js
import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Icon,
  Flex,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast
} from '@chakra-ui/react';
import { 
  User, 
  Share2, 
  DollarSign, 
  Lock, 
  Users, 
  TrendingUp,
  AlertCircle,
  Settings
} from 'lucide-react';

const IntentCard = ({ 
  icon, 
  title, 
  description, 
  badge, 
  isSelected, 
  onClick, 
  isDisabled, 
  disabledReason 
}) => {
  return (
    <Box
      p={3}
      borderRadius="lg"
      border="2px solid"
      borderColor={isSelected ? "#00C6E0" : "rgba(255, 255, 255, 0.18)"}
      bg={isSelected ? "rgba(0, 198, 224, 0.08)" : "rgba(255, 255, 255, 0.05)"}
      backdropFilter="blur(10px)"
      cursor={isDisabled ? "not-allowed" : "pointer"}
      opacity={isDisabled ? 0.6 : 1}
      transition="all 0.3s ease"
      _hover={!isDisabled ? {
        borderColor: isSelected ? "#00C6E0" : "rgba(0, 198, 224, 0.5)",
        bg: isSelected ? "rgba(0, 198, 224, 0.12)" : "rgba(255, 255, 255, 0.08)",
        transform: "translateY(-1px)",
        boxShadow: "0 4px 16px 0 rgba(0, 0, 0, 0.3)"
      } : {}}
      onClick={!isDisabled ? onClick : undefined}
      position="relative"
    >
      <VStack spacing={2} align="flex-start">
        <HStack justify="space-between" w="full">
          <HStack spacing={3}>
            <Box
              p={2}
              borderRadius="md"
              bg="rgba(0, 198, 224, 0.15)"
              color="#00C6E0"
            >
              <Icon as={icon} size="18px" />
            </Box>
            <Text
              fontSize="md"
              fontWeight="semibold"
              color="white"
            >
              {title}
            </Text>
          </HStack>
          
          {badge && (
            <Badge
              variant="subtle"
              colorScheme={badge.color}
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="full"
            >
              {badge.text}
            </Badge>
          )}
        </HStack>

        <Text
          fontSize="sm"
          color="rgba(255, 255, 255, 0.8)"
          lineHeight="1.4"
        >
          {description}
        </Text>

        {isDisabled && disabledReason && (
          <Alert status="warning" size="sm" bg="rgba(255, 193, 7, 0.1)" border="none">
            <AlertIcon color="orange.300" />
            <AlertDescription fontSize="xs" color="orange.200">
              {disabledReason}
            </AlertDescription>
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

const IntentDiscovery = ({ 
  onIntentSelect, 
  selectedIntent, 
  user,
  onCreatorSetup 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Check if user has creator profile and Stripe Connect account
  const hasCreatorProfile = user?.creator_profile?.id;
  const hasStripeAccount = user?.creator_profile?.stripe_account_id;
  const canMonetize = hasCreatorProfile && hasStripeAccount;

  const handleIntentSelect = async (intent) => {
    if (intent === 'monetize' && !canMonetize) {
      // Redirect to creator onboarding
      if (onCreatorSetup) {
        onCreatorSetup();
      } else {
        toast({
          title: "Creator Setup Required",
          description: "Complete your creator profile to monetize strategies",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }
      return;
    }

    setIsLoading(true);
    try {
      await onIntentSelect(intent);
    } catch (error) {
      console.error('Error selecting intent:', error);
      toast({
        title: "Selection Failed",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const intents = [
    {
      id: 'personal',
      icon: User,
      title: 'Personal Use',
      description: 'Keep this strategy private for your own trading. Perfect for testing and personal automation.',
      badge: { text: 'Private', color: 'gray' },
      available: true
    },
    {
      id: 'share_free',
      icon: Share2,
      title: 'Share for Free',
      description: 'Make your strategy available to the community at no cost. Build your reputation and help others.',
      badge: { text: 'Community', color: 'green' },
      available: true
    },
    {
      id: 'monetize',
      icon: DollarSign,
      title: 'Monetize Strategy',
      description: 'Set up pricing and earn revenue from your strategy. Requires creator profile and payment setup.',
      badge: { text: 'Earn Money', color: 'yellow' },
      available: canMonetize,
      disabledReason: !hasCreatorProfile 
        ? 'Complete creator profile setup first'
        : !hasStripeAccount 
        ? 'Connect payment account to monetize'
        : undefined
    }
  ];

  return (
    <Box w="full">
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Text
            fontSize="lg"
            fontWeight="bold"
            color="white"
            mb={1}
          >
            How will you use this strategy?
          </Text>
          <Text
            fontSize="sm"
            color="rgba(255, 255, 255, 0.7)"
            maxW="md"
            mx="auto"
          >
            Choose your intent to customize the creation experience and unlock the right features for your goals.
          </Text>
        </Box>

        {/* Intent Cards */}
        <VStack spacing={2}>
          {intents.map((intent) => (
            <IntentCard
              key={intent.id}
              icon={intent.icon}
              title={intent.title}
              description={intent.description}
              badge={intent.badge}
              isSelected={selectedIntent === intent.id}
              onClick={() => handleIntentSelect(intent.id)}
              isDisabled={!intent.available}
              disabledReason={intent.disabledReason}
            />
          ))}
        </VStack>

        {/* Creator Setup Banner for monetization */}
        {selectedIntent === 'monetize' && !canMonetize && (
          <Alert
            status="info"
            bg="rgba(0, 198, 224, 0.1)"
            border="1px solid rgba(0, 198, 224, 0.3)"
            borderRadius="lg"
            p={4}
          >
            <AlertIcon color="#00C6E0" />
            <Box flex="1">
              <Text color="white" fontWeight="medium" mb={2}>
                Creator Setup Required
              </Text>
              <Text color="rgba(255, 255, 255, 0.8)" fontSize="sm" mb={3}>
                {!hasCreatorProfile 
                  ? 'Create your creator profile and connect a payment account to start monetizing your strategies.'
                  : 'Connect your payment account to start earning from your strategies.'
                }
              </Text>
              <Button
                size="sm"
                bg="transparent"
                color="#00C6E0"
                borderWidth={1}
                borderColor="#00C6E0"
                _hover={{
                  bg: 'rgba(0, 198, 224, 0.1)'
                }}
                leftIcon={<Settings size={16} />}
                onClick={() => onCreatorSetup && onCreatorSetup()}
              >
                {!hasCreatorProfile ? 'Complete Creator Setup' : 'Connect Payment Account'}
              </Button>
            </Box>
          </Alert>
        )}

        {/* Selected Intent Summary */}
        {selectedIntent && (
          <Box
            p={3}
            bg="rgba(0, 198, 224, 0.05)"
            border="1px solid rgba(0, 198, 224, 0.2)"
            borderRadius="md"
          >
            <HStack spacing={3}>
              <Icon 
                as={intents.find(i => i.id === selectedIntent)?.icon} 
                color="#00C6E0" 
                size="18px" 
              />
              <Box flex="1">
                <Text color="white" fontWeight="medium" fontSize="sm">
                  Intent: {intents.find(i => i.id === selectedIntent)?.title}
                </Text>
                <Text color="rgba(255, 255, 255, 0.7)" fontSize="xs">
                  {selectedIntent === 'personal' && 'Your strategy will be private and for personal use only.'}
                  {selectedIntent === 'share_free' && 'Your strategy will be shared freely with the community.'}
                  {selectedIntent === 'monetize' && 'Your strategy will be available for purchase with your pricing.'}
                </Text>
              </Box>
            </HStack>
          </Box>
        )}

        {/* Benefits Preview */}
        {selectedIntent && (
          <Box
            p={3}
            bg="rgba(255, 255, 255, 0.02)"
            borderRadius="md"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <Text color="white" fontWeight="medium" mb={2} fontSize="sm">
              What you'll get:
            </Text>
            <VStack spacing={1.5} align="stretch">
              {selectedIntent === 'personal' && (
                <>
                  <HStack spacing={2}>
                    <Lock size={14} color="rgba(255, 255, 255, 0.7)" />
                    <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                      Private webhook URL for your exclusive use
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Settings size={14} color="rgba(255, 255, 255, 0.7)" />
                    <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                      Full control over configuration and settings
                    </Text>
                  </HStack>
                </>
              )}
              
              {selectedIntent === 'share_free' && (
                <>
                  <HStack spacing={2}>
                    <Users size={14} color="rgba(255, 255, 255, 0.7)" />
                    <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                      Community visibility and user ratings
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <TrendingUp size={14} color="rgba(255, 255, 255, 0.7)" />
                    <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                      Build reputation and follower base
                    </Text>
                  </HStack>
                </>
              )}
              
              {selectedIntent === 'monetize' && (
                <>
                  <HStack spacing={2}>
                    <DollarSign size={14} color="rgba(255, 255, 255, 0.7)" />
                    <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                      Set your own pricing (monthly, yearly, lifetime)
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <TrendingUp size={14} color="rgba(255, 255, 255, 0.7)" />
                    <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                      Automatic revenue tracking and analytics
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Users size={14} color="rgba(255, 255, 255, 0.7)" />
                    <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                      Subscriber management and notifications
                    </Text>
                  </HStack>
                </>
              )}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default IntentDiscovery;