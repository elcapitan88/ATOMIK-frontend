import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Flex,
  Container,
  Select,
  Badge,
  useToast,
  Spinner,
  ButtonGroup,
  Button,
  Icon,
  IconButton,
} from '@chakra-ui/react';
import {
  Search,
  TrendingUp,
  BarChart2,
  Target,
  Gauge,
  TimerReset,
  BookMarked,
  Layout,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';
import { STRATEGY_TYPE_OPTIONS } from '@utils/constants/strategyTypes';
import StrategyCard from '../features/marketplace/components/StrategyCard';
import Menu from '../layout/Sidebar/Menu';

const MotionFlex = motion(Flex);
const MotionBox = motion(Box);

const categories = [
  {
    id: 'momentum',
    title: 'Momentum Strategies',
    icon: TrendingUp,
    description: 'Strategies that capitalize on strong market movements and trends',
  },
  {
    id: 'mean_reversion',
    title: 'Mean Reversion',
    icon: TimerReset,
    description: 'Strategies that trade price returns to statistical averages',
  },
  {
    id: 'breakout',
    title: 'Breakout Strategies',
    icon: Target,
    description: 'Strategies that capture significant price breakouts from ranges',
  },
  {
    id: 'arbitrage',
    title: 'Arbitrage Strategies',
    icon: BarChart2,
    description: 'Strategies that exploit price differences across markets',
  },
  {
    id: 'scalping',
    title: 'Scalping Strategies',
    icon: Gauge,
    description: 'High-frequency strategies for short-term opportunities',
  },
];

const MarketplacePage = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [strategies, setStrategies] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all');
  const [subscribedStrategies, setSubscribedStrategies] = useState(new Set());
  const [searchFocused, setSearchFocused] = useState(false);
  const toast = useToast();

  // Calculate totals
  const totalStrategies = useMemo(() => {
    return Object.values(strategies).reduce(
      (acc, categoryStrategies) => acc + categoryStrategies.length,
      0
    );
  }, [strategies]);

  const totalSubscribed = useMemo(() => {
    return subscribedStrategies.size;
  }, [subscribedStrategies]);

  // Fetch strategies and subscriptions
  const fetchStrategies = async () => {
    try {
      setIsLoading(true);
      const [sharedResponse, subscribedResponse] = await Promise.all([
        webhookApi.listSharedStrategies(),
        webhookApi.getSubscribedStrategies()
      ]);
      
      const subscribedSet = new Set(subscribedResponse.map(s => s.token));
      setSubscribedStrategies(subscribedSet);
      
      const groupedStrategies = sharedResponse.reduce((acc, strategy) => {
        const type = strategy.strategy_type || 'uncategorized';
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push({
          ...strategy,
          name: strategy.name || 'Unnamed Strategy',
          description: strategy.details || 'No description provided',
          username: strategy.username || 'Anonymous',
          strategyType: strategy.strategy_type,
          isPublic: strategy.is_shared,
          rating: strategy.rating || 0,
          subscriberCount: strategy.subscriber_count || 0,
          isSubscribed: subscribedSet.has(strategy.token)
        });
        return acc;
      }, {});

      setStrategies(groupedStrategies);
    } catch (error) {
      toast({
        title: "Error fetching strategies",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  // Handle subscription changes
  const handleSubscriptionChange = (token, isSubscribed) => {
    setSubscribedStrategies(prev => {
      const newSet = new Set(prev);
      if (isSubscribed) {
        newSet.add(token);
      } else {
        newSet.delete(token);
      }
      return newSet;
    });
    
    setStrategies(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(category => {
        updated[category] = updated[category].map(strategy => {
          if (strategy.token === token) {
            return {
              ...strategy,
              isSubscribed,
              subscriberCount: isSubscribed 
                ? strategy.subscriberCount + 1 
                : Math.max(0, strategy.subscriberCount - 1)
            };
          }
          return strategy;
        });
      });
      return updated;
    });
  };

  // Filter strategies based on search and category
  const getFilteredStrategies = (categoryStrategies, categoryId) => {
    if (!categoryStrategies) return [];
    
    return categoryStrategies.filter(strategy => {
      const matchesSearch = searchQuery === '' || 
        strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || categoryId === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  // Get subscribed strategies
  const getSubscribedStrategiesArray = () => {
    return Object.values(strategies)
      .flat()
      .filter(strategy => subscribedStrategies.has(strategy.token));
  };

  // Component for empty states
  const EmptyState = ({ message, icon }) => (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="300px"
        p={8}
        textAlign="center"
      >
        <Icon as={icon} size={48} color="whiteAlpha.400" mb={4} />
        <Text color="whiteAlpha.600" fontSize="lg">
          {message}
        </Text>
      </Flex>
    </MotionBox>
  );

  // Strategy grid component
  const StrategyGrid = ({ strategies }) => (
    <MotionFlex
      gap={6}
      flexWrap="wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      justify="center" 
      width="100%"
      minHeight="260px" // Maintain consistent height
    >
      <AnimatePresence mode="wait">
        {strategies.length > 0 ? (
          strategies.map((strategy) => (
            <MotionBox
              key={strategy.token}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StrategyCard
                strategy={strategy}
                onSubscriptionChange={handleSubscriptionChange}
              />
            </MotionBox>
          ))
        ) : (
          <Flex align="center" justify="center" height="260px">
            <Text color="whiteAlpha.600" fontSize="md">
              No strategies available for this category
            </Text>
          </Flex>
        )}
      </AnimatePresence>
    </MotionFlex>
  );

  // Search bar component
  const SearchBar = () => (
    <InputGroup
      maxW={{ base: "100%", sm: "350px", md: "450px" }}
      transition="all 0.3s"
      transform={searchFocused ? 'translateY(-2px)' : 'none'}
      boxShadow={searchFocused ? '0 4px 12px rgba(0, 198, 224, 0.15)' : 'none'}
    >
      <InputLeftElement pointerEvents="none">
        <Search size={18} color="white" opacity={0.5} />
      </InputLeftElement>
      <Input
        placeholder="Search strategies..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
        bg="whiteAlpha.100"
        border="1px solid"
        borderColor="whiteAlpha.200"
        _hover={{ borderColor: "whiteAlpha.300" }}
        _focus={{ 
          borderColor: "rgba(0, 198, 224, 0.6)",
          boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
        }}
        color="white"
      />
      {searchQuery && (
        <InputRightElement>
          <IconButton
            icon={<X size={14} />}
            size="sm"
            variant="ghost"
            colorScheme="whiteAlpha"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          />
        </InputRightElement>
      )}
    </InputGroup>
  );

  // Render main content
  const renderContent = () => {
    if (isLoading) {
      return (
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      );
    }

    // Subscribed view mode
    if (viewMode === 'subscribed') {
      const subscribedStrategiesArray = getSubscribedStrategiesArray();
      
      if (subscribedStrategiesArray.length === 0) {
        return (
          <EmptyState
            message="You haven't subscribed to any strategies yet"
            icon={BookMarked}
          />
        );
      }

      return (
        <VStack spacing={8} align="stretch">
          <StrategyGrid strategies={subscribedStrategiesArray} />
        </VStack>
      );
    }

    // All strategies view mode
    const subscribedStrategiesArray = getSubscribedStrategiesArray();
    
    return (
      <VStack spacing={8} align="stretch">
        {/* Subscribed Strategies Section */}
        {subscribedStrategiesArray.length > 0 && (
          <Box mb={8}>
            <HStack mb={4} align="center" justify="center" width="100%">
              <BookMarked size={20} color="white" />
              <Text fontSize="xl" fontWeight="bold" color="white">
                Your Subscribed Strategies
              </Text>
              <Badge
                ml={2}
                colorScheme="blue"
                bg="rgba(0, 198, 224, 0.2)"
                color="white"
              >
                {subscribedStrategiesArray.length}
              </Badge>
            </HStack>
            <StrategyGrid strategies={subscribedStrategiesArray} />
          </Box>
        )}

        {/* Category Sections */}
        {categories.map((category) => {
          const filteredStrategies = getFilteredStrategies(
            strategies[category.id],
            category.id
          );

          // Skip categories not matching filter when a specific category is selected
          if (selectedCategory !== 'all' && category.id !== selectedCategory) {
            return null;
          }

          return (
            <Box key={category.id}>
              <HStack mb={4} align="center" justify="center" width="100%">
                <category.icon size={20} color="white" />
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {category.title}
                </Text>
                <Badge
                  ml={2}
                  colorScheme="blue"
                  bg="rgba(0, 198, 224, 0.2)"
                  color="white"
                >
                  {filteredStrategies.length}
                </Badge>
              </HStack>

              <Text color="whiteAlpha.700" fontSize="sm" mb={4} textAlign="center" width="100%">
                {category.description}
              </Text>

              <StrategyGrid strategies={filteredStrategies} />
            </Box>
          );
        })}

        {/* Empty State */}
        {Object.keys(strategies).length === 0 && (
          <EmptyState
            message="No strategies found"
            icon={Layout}
          />
        )}
      </VStack>
    );
  };

  return (
    <Flex minH="100vh" bg="background" color="text.primary" fontFamily="body">
      <Menu onSelectItem={() => {}} />
      
      <Box 
        flexGrow={1} 
        ml={{ base: 0, md: 16 }}
        mb={{ base: "70px", md: 0 }}
      >
        <Box h="100vh" w="full" overflow="hidden" position="relative">
          {/* Background Effects */}
          <Box 
            position="absolute" 
            inset={0} 
            bgGradient="linear(to-br, blackAlpha.400, blackAlpha.200, blackAlpha.400)" 
            pointerEvents="none" 
          />
          <Box 
            position="absolute" 
            inset={0} 
            backdropFilter="blur(16px)" 
            bg="blackAlpha.300" 
          />
          
          {/* Content */}
          <Box 
            position="relative" 
            h="full" 
            zIndex={1} 
            overflowY="auto"
            p={4}
          >
            <Container maxW="container.xl" py={4}>
              {/* Header */}
              <Flex 
                direction={{ base: 'column', md: 'row' }} 
                justify="space-between" 
                align={{ base: 'stretch', md: 'center' }}
                gap={4}
                mb={6}
              >
                <VStack align="flex-start" spacing={1}>
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color="white"
                    textShadow="0 0 10px rgba(0, 198, 224, 0.3)"
                  >
                    Strategy Marketplace
                  </Text>
                  <Text color="whiteAlpha.700" fontSize="sm">
                    {totalStrategies} Strategies Available • {totalSubscribed} Subscribed
                  </Text>
                </VStack>

                {/* Controls */}
                <HStack spacing={4} flex={{ base: '1', md: '0' }}>
                  <ButtonGroup size="sm" isAttached variant="outline">
                    <Button
                      onClick={() => setViewMode('all')}
                      colorScheme={viewMode === 'all' ? 'blue' : 'gray'}
                      borderColor="whiteAlpha.200"
                      leftIcon={<Layout size={16} />}
                    >
                      All
                    </Button>
                    <Button
                      onClick={() => setViewMode('subscribed')}
                      colorScheme={viewMode === 'subscribed' ? 'blue' : 'gray'}
                      borderColor="whiteAlpha.200"
                      leftIcon={<BookMarked size={16} />}
                    >
                      Subscribed
                    </Button>
                  </ButtonGroup>

                  <SearchBar />

                  {viewMode === 'all' && (
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      bg="whiteAlpha.100"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      _hover={{ borderColor: "whiteAlpha.300" }}
                      _focus={{ 
                        borderColor: "rgba(0, 198, 224, 0.6)",
                        boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                      }}
                      maxW="200px"
                      color="white"
                    >
                      <option value="all">All Types</option>
                      {STRATEGY_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </HStack>
              </Flex>

              {/* Main Content with Animation */}
              <AnimatePresence mode="wait">
                {renderContent()}
              </AnimatePresence>
            </Container>
          </Box>
        </Box>
      </Box>
    </Flex>
  );
}

export default MarketplacePage;