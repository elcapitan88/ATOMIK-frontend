import React, { useState, useEffect } from 'react';
import { Box, SimpleGrid, VStack, HStack, Text, Flex, Spinner, Select } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnifiedStrategies as useStrategies } from '@/hooks/useUnifiedStrategies';
import SegmentedControl from '../components/SegmentedControl';

const MotionBox = motion(Box);

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }
};

const CreatorStrategiesTab = () => {
  const { strategies, isLoading: loading, refetch: fetchUserStrategies } = useStrategies();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchUserStrategies();
  }, [fetchUserStrategies]);

  const filteredStrategies = strategies.filter(strategy => {
    switch (filter) {
      case 'monetized':
        return strategy.pricing && strategy.pricing.pricing_type !== 'free';
      case 'free':
        return !strategy.pricing || strategy.pricing.pricing_type === 'free';
      default:
        return true;
    }
  });

  const sortedStrategies = [...filteredStrategies].sort((a, b) => {
    switch (sortBy) {
      case 'earnings':
        return (b.earnings || 0) - (a.earnings || 0);
      case 'subscribers':
        return (b.subscribers || 0) - (a.subscribers || 0);
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  const monetizedCount = strategies.filter(s => s.pricing?.pricing_type !== 'free').length;
  const freeCount = strategies.length - monetizedCount;

  if (loading) {
    return (
      <Box py={12} textAlign="center">
        <Spinner color="#00C6E0" size="lg" />
        <Text color="whiteAlpha.500" mt={4} fontSize="sm">Loading strategies...</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Controls */}
      <Flex
        justify="space-between"
        align="center"
        mb={5}
        gap={4}
        flexWrap={{ base: 'wrap', md: 'nowrap' }}
      >
        <SegmentedControl
          options={[
            { value: 'all', label: 'All', count: strategies.length },
            { value: 'monetized', label: 'Monetized', count: monetizedCount },
            { value: 'free', label: 'Free', count: freeCount }
          ]}
          value={filter}
          onChange={setFilter}
          size="sm"
        />
        <Select
          bg="rgba(255,255,255,0.04)"
          border="1px solid rgba(255,255,255,0.08)"
          borderRadius="10px"
          color="white"
          fontSize="13px"
          w="180px"
          flexShrink={0}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          _hover={{ borderColor: 'rgba(255,255,255,0.15)' }}
          sx={{
            '> option': { bg: '#1a1a1a', color: 'white' }
          }}
        >
          <option value="newest">Newest First</option>
          <option value="earnings">Highest Earnings</option>
          <option value="subscribers">Most Subscribers</option>
        </Select>
      </Flex>

      {/* Strategy Cards */}
      {sortedStrategies.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={filter + sortBy}
        >
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
            {sortedStrategies.map((strategy) => (
              <MotionBox
                key={strategy.id}
                variants={cardVariants}
                bg="#121212"
                border="1px solid rgba(255,255,255,0.06)"
                borderRadius="16px"
                p={5}
                cursor="default"
                _hover={{
                  borderColor: 'rgba(255,255,255,0.12)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px -8px rgba(0,0,0,0.3)'
                }}
                transition="all 0.2s ease"
              >
                {/* Header */}
                <Flex justify="space-between" align="flex-start" mb={4}>
                  <VStack align="start" spacing={1} flex={1} mr={3}>
                    <Text color="white" fontSize="16px" fontWeight="600" noOfLines={1}>
                      {strategy.name}
                    </Text>
                    <Text color="whiteAlpha.500" fontSize="13px" noOfLines={2}>
                      {strategy.description || 'No description'}
                    </Text>
                  </VStack>
                  <Box
                    px={2.5}
                    py={1}
                    borderRadius="full"
                    fontSize="11px"
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="0.03em"
                    bg={strategy.pricing?.pricing_type === 'free' || !strategy.pricing
                      ? 'rgba(156, 163, 175, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)'
                    }
                    color={strategy.pricing?.pricing_type === 'free' || !strategy.pricing
                      ? '#9ca3af'
                      : '#10b981'
                    }
                    flexShrink={0}
                  >
                    {strategy.pricing?.pricing_type === 'free' || !strategy.pricing ? 'Free' : 'Monetized'}
                  </Box>
                </Flex>

                {/* Metrics */}
                <SimpleGrid columns={3} spacing={3} mb={4} py={3} borderTop="1px solid rgba(255,255,255,0.04)" borderBottom="1px solid rgba(255,255,255,0.04)">
                  <VStack spacing={0}>
                    <Text color="white" fontSize="16px" fontWeight="700" fontFeatureSettings="'tnum'">
                      ${strategy.earnings || 0}
                    </Text>
                    <Text color="whiteAlpha.400" fontSize="11px" fontWeight="500" textTransform="uppercase">
                      Earnings
                    </Text>
                  </VStack>
                  <VStack spacing={0}>
                    <Text color="white" fontSize="16px" fontWeight="700" fontFeatureSettings="'tnum'">
                      {strategy.subscribers || 0}
                    </Text>
                    <Text color="whiteAlpha.400" fontSize="11px" fontWeight="500" textTransform="uppercase">
                      Subs
                    </Text>
                  </VStack>
                  <VStack spacing={0}>
                    <Text color="white" fontSize="16px" fontWeight="700" fontFeatureSettings="'tnum'">
                      {strategy.performance || '+0.0'}%
                    </Text>
                    <Text color="whiteAlpha.400" fontSize="11px" fontWeight="500" textTransform="uppercase">
                      Perf
                    </Text>
                  </VStack>
                </SimpleGrid>

                {/* Pricing row */}
                {strategy.pricing && strategy.pricing.pricing_type !== 'free' && (
                  <Flex
                    justify="space-between"
                    align="center"
                    mb={4}
                    px={3}
                    py={2}
                    bg="rgba(0, 198, 224, 0.06)"
                    borderRadius="8px"
                    border="1px solid rgba(0, 198, 224, 0.1)"
                  >
                    <HStack spacing={1}>
                      <Text color="white" fontSize="18px" fontWeight="700">${strategy.pricing.base_amount}</Text>
                      <Text color="whiteAlpha.500" fontSize="13px">/{strategy.pricing.billing_interval || 'month'}</Text>
                    </HStack>
                    {strategy.pricing.is_trial_enabled && (
                      <Box
                        bg="rgba(245, 158, 11, 0.15)"
                        color="#f59e0b"
                        px={2}
                        py={0.5}
                        borderRadius="6px"
                        fontSize="11px"
                        fontWeight="600"
                      >
                        {strategy.pricing.trial_days}d trial
                      </Box>
                    )}
                  </Flex>
                )}

                {/* Actions */}
                <HStack spacing={2}>
                  <Box
                    as="button"
                    flex={1}
                    bg="rgba(255,255,255,0.06)"
                    border="1px solid rgba(255,255,255,0.08)"
                    borderRadius="8px"
                    py={2}
                    fontSize="13px"
                    fontWeight="500"
                    color="whiteAlpha.700"
                    cursor="pointer"
                    transition="all 0.15s"
                    _hover={{ bg: 'rgba(255,255,255,0.1)', color: 'white' }}
                    textAlign="center"
                  >
                    Analytics
                  </Box>
                  <Box
                    as="button"
                    flex={1}
                    bg={!strategy.pricing || strategy.pricing.pricing_type === 'free'
                      ? '#00C6E0'
                      : 'rgba(255,255,255,0.06)'
                    }
                    border="1px solid"
                    borderColor={!strategy.pricing || strategy.pricing.pricing_type === 'free'
                      ? '#00C6E0'
                      : 'rgba(255,255,255,0.08)'
                    }
                    borderRadius="8px"
                    py={2}
                    fontSize="13px"
                    fontWeight="600"
                    color="white"
                    cursor="pointer"
                    transition="all 0.15s"
                    _hover={{
                      transform: 'translateY(-1px)',
                      boxShadow: !strategy.pricing || strategy.pricing.pricing_type === 'free'
                        ? '0 4px 12px -4px rgba(0, 198, 224, 0.4)'
                        : 'none'
                    }}
                    textAlign="center"
                  >
                    {!strategy.pricing || strategy.pricing.pricing_type === 'free' ? 'Monetize' : 'Edit Pricing'}
                  </Box>
                </HStack>
              </MotionBox>
            ))}
          </SimpleGrid>
        </motion.div>
      ) : (
        <Box py={16} textAlign="center">
          <Text fontSize="48px" mb={4}>
            {filter === 'all' ? '📈' : filter === 'monetized' ? '💰' : '🆓'}
          </Text>
          <Text color="white" fontSize="lg" fontWeight="600" mb={2}>
            {filter === 'all' ? 'No Strategies Yet' : `No ${filter} strategies`}
          </Text>
          <Text color="whiteAlpha.500" fontSize="sm" maxW="360px" mx="auto" mb={6}>
            {filter === 'all'
              ? 'Create your first trading strategy to start building your creator business.'
              : `You don't have any ${filter} strategies yet.`
            }
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default CreatorStrategiesTab;
