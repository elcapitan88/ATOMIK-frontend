import React from 'react';
import {
  SimpleGrid,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Skeleton,
  SkeletonText,
  Flex,
  useToast
} from '@chakra-ui/react';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const StrategyCard = ({ strategy, onSubscribe, isSubscribing }) => {
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
    return num.toString();
  };

  return (
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
      transition="all 0.3s"
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

          {/* Revenue & Pricing */}
          <HStack justify="space-between" align="center">
            <VStack spacing={1} align="start">
              <Text fontSize="xs" color="whiteAlpha.500">
                Monthly Revenue
              </Text>
              <Text fontSize="sm" fontWeight="semibold" color="#00C6E0">
                {formatCurrency(strategy.estimated_monthly_revenue)}
              </Text>
            </VStack>

            {strategy.min_price && (
              <VStack spacing={1} align="end">
                <Text fontSize="xs" color="whiteAlpha.500">
                  From
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="white">
                  {formatCurrency(strategy.min_price)}<Text as="span" fontSize="sm" color="whiteAlpha.600">/mo</Text>
                </Text>
              </VStack>
            )}
          </HStack>
        </VStack>

        {/* Subscribe Button */}
        <Button
          size="md"
          bg="#00C6E0"
          color="white"
          _hover={{ bg: "#00A3B8" }}
          _active={{ bg: "#008C9E" }}
          onClick={() => onSubscribe(strategy)}
          isLoading={isSubscribing}
          loadingText="Subscribing..."
          leftIcon={<TrendingUp size={16} />}
        >
          Subscribe
        </Button>
      </VStack>
    </MotionBox>
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
  onSubscribe
}) => {
  const toast = useToast();

  const handleSubscribe = async (strategy) => {
    try {
      // TODO: Implement subscription logic
      toast({
        title: "Feature coming soon!",
        description: "Strategy subscriptions will be available soon",
        status: "info",
        duration: 3000,
        isClosable: true,
      });

      if (onSubscribe) {
        onSubscribe(strategy);
      }
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

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
          onSubscribe={handleSubscribe}
          isSubscribing={false}
        />
      ))}
    </SimpleGrid>
  );
};

export default StrategyGrid;