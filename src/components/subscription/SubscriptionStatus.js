// src/components/subscription/SubscriptionStatus.js
import React, { useMemo } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Badge,
  Tooltip,
  Progress,
  Button,
  Icon,
  Heading,
  Link
} from '@chakra-ui/react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { CircleAlert, Zap, Award, Clock, RefreshCw, ChevronRight } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

// Helper to format resource limits for display
const formatLimit = (limit) => {
  if (limit === Infinity || limit === 'Infinity' || limit === 'unlimited') {
    return 'Unlimited';
  }
  return limit.toString();
};

const SubscriptionStatus = () => {
  const {
    isLoading,
    currentTier,
    isLifetime,
    status,
    subscriptionData,
    resourceUsage,
    refreshSubscription,
    getNextTier
  } = useSubscription();

  const resourceItems = useMemo(() => {
    if (!resourceUsage || !subscriptionData?.limits) return [];

    return [
      {
        name: 'Connected Accounts',
        key: 'connected_accounts',
        used: resourceUsage.connected_accounts || 0,
        limit: subscriptionData.limits.connected_accounts?.limit || 0,
        available: subscriptionData.limits.connected_accounts?.available || false
      },
      {
        name: 'Active Webhooks',
        key: 'active_webhooks',
        used: resourceUsage.active_webhooks || 0,
        limit: subscriptionData.limits.active_webhooks?.limit || 0,
        available: subscriptionData.limits.active_webhooks?.available || false
      },
      {
        name: 'Active Strategies',
        key: 'active_strategies',
        used: resourceUsage.active_strategies || 0,
        limit: subscriptionData.limits.active_strategies?.limit || 0,
        available: subscriptionData.limits.active_strategies?.available || false
      }
    ];
  }, [resourceUsage, subscriptionData]);

  // Determine if any resources are approaching their limits (80% or more)
  const hasWarnings = useMemo(() => {
    return resourceItems.some(item => {
      if (item.limit === Infinity || item.limit === 'Infinity' || item.limit === 'unlimited') {
        return false;
      }
      return (item.used / item.limit) >= 0.8;
    });
  }, [resourceItems]);

  // Next upgrade tier
  const nextTier = getNextTier();

  return (
    <Box
      bg="whiteAlpha.100"
      borderRadius="xl"
      p={4}
      borderWidth="1px"
      borderColor={hasWarnings ? "yellow.400" : "whiteAlpha.200"}
      boxShadow={hasWarnings ? "0 0 0 1px rgba(236, 201, 75, 0.3)" : "none"}
      transition="all 0.3s ease"
    >
      <VStack spacing={4} align="stretch">
        {/* Header with status */}
        <Flex justify="space-between" align="center">
          <HStack>
            <Heading size="sm" color="white">Subscription Status</Heading>
            {isLifetime && (
              <Badge colorScheme="purple" variant="solid" fontSize="xs">
                Lifetime
              </Badge>
            )}
          </HStack>
          
          <Tooltip label="Refresh subscription information">
            <Button 
              size="xs" 
              variant="ghost" 
              isLoading={isLoading}
              onClick={() => refreshSubscription(true)}
              color="whiteAlpha.700"
              _hover={{ color: "white" }}
            >
              <Icon as={RefreshCw} size={14} />
            </Button>
          </Tooltip>
        </Flex>

        {/* Current tier */}
        <HStack spacing={4}>
          <Box>
            <Text fontSize="xs" color="whiteAlpha.600">Current Plan</Text>
            <HStack>
              <Badge 
                colorScheme={
                  currentTier === 'elite' ? 'purple' : 
                  currentTier === 'pro' ? 'blue' : 
                  'gray'
                }
                variant="subtle"
                px={2}
                py={0.5}
                borderRadius="md"
              >
                {currentTier.toUpperCase()}
              </Badge>
              
              <Text 
                fontSize="xs" 
                color={status === 'active' ? 'green.400' : 'red.400'}
              >
                {status === 'active' ? 'Active' : 'Inactive'}
              </Text>
            </HStack>
          </Box>

          {status === 'active' && nextTier && (
            <Link 
              as={RouterLink} 
              to="/pricing" 
              display="flex" 
              alignItems="center"
              ml="auto"
              color="#00C6E0"
              fontSize="sm"
              _hover={{ textDecoration: 'none', color: 'cyan.300' }}
            >
              Upgrade <Icon as={ChevronRight} size={16} ml={1} />
            </Link>
          )}

          {status !== 'active' && (
            <Button
              as={RouterLink}
              to="/pricing"
              size="sm"
              colorScheme="red"
              ml="auto"
              leftIcon={<Icon as={CircleAlert} size={14} />}
            >
              Reactivate
            </Button>
          )}
        </HStack>

        {/* Resource usage */}
        {resourceItems.length > 0 && (
          <VStack spacing={3} align="stretch" mt={2}>
            <Text fontSize="xs" color="whiteAlpha.600" fontWeight="medium">
              Resource Usage
            </Text>
            
            {resourceItems.map((resource) => {
              // Calculate percentage for progress bar
              const isUnlimited = resource.limit === Infinity || resource.limit === 'Infinity' || resource.limit === 'unlimited';
              const percentage = isUnlimited ? 0 : Math.min(100, Math.round((resource.used / resource.limit) * 100));
              const isWarning = !isUnlimited && percentage >= 80;
              
              return (
                <Box key={resource.key}>
                  <Flex justify="space-between" align="center" mb={1}>
                    <Text fontSize="xs" color="whiteAlpha.700">
                      {resource.name}
                    </Text>
                    <Text fontSize="xs" color={isWarning ? "yellow.400" : "whiteAlpha.700"}>
                      {resource.used} / {formatLimit(resource.limit)}
                    </Text>
                  </Flex>
                  
                  {!isUnlimited && (
                    <Progress 
                      value={percentage} 
                      size="xs" 
                      borderRadius="full"
                      colorScheme={isWarning ? "yellow" : "blue"}
                      bg="whiteAlpha.200"
                    />
                  )}
                  
                  {isUnlimited && (
                    <Box height="6px" width="full" position="relative">
                      <Box 
                        position="absolute" 
                        top={0} 
                        left={0} 
                        right={0} 
                        bottom={0}
                        borderRadius="full"
                        bg="whiteAlpha.200"
                      />
                      <Flex 
                        position="absolute" 
                        top={0} 
                        left={0} 
                        right={0} 
                        bottom={0}
                        align="center" 
                        justify="center"
                      >
                        <Icon as={Zap} size={10} color="#00C6E0" />
                      </Flex>
                    </Box>
                  )}
                </Box>
              );
            })}
          </VStack>
        )}

        {/* Upgrade prompt if resources are near capacity */}
        {hasWarnings && (
          <Box 
            mt={2} 
            p={3} 
            borderRadius="md" 
            bg="rgba(236, 201, 75, 0.1)" 
            borderWidth="1px"
            borderColor="yellow.400"
          >
            <HStack spacing={3}>
              <Icon as={CircleAlert} color="yellow.400" />
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="white">
                  Approaching resource limits
                </Text>
                <Text fontSize="xs" color="whiteAlpha.800">
                  Upgrade to {nextTier?.toUpperCase()} for higher limits and more features.
                </Text>
              </VStack>
              
              <Button
                as={RouterLink}
                to="/pricing"
                size="sm"
                colorScheme="yellow"
                variant="outline"
                ml="auto"
              >
                Upgrade
              </Button>
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default SubscriptionStatus;