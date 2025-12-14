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
  useBreakpointValue,
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
import { marketplaceApi } from '@/services/api/marketplace/marketplaceApi';
import { STRATEGY_TYPE_OPTIONS } from '@utils/constants/strategyTypes';
import StrategyCard from '../features/marketplace/components/StrategyCard';
import Wrapper from '../layout/Sidebar/Menu'; // Renaming Menu to Wrapper/Sidebar to avoid conflict if needed, or just import Navbar
import Navbar from '../Homepage/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

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
  // Auth hook
  const { user, isLoading: authLoading } = useAuth();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [strategies, setStrategies] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all');
  const [subscribedStrategies, setSubscribedStrategies] = useState(new Set());
  const [searchFocused, setSearchFocused] = useState(false);
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });

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
      const [sharedResponse, subscribedResponse, purchasedResponse] = await Promise.all([
        marketplaceApi.getMarketplaceStrategies(),
        webhookApi.getSubscribedStrategies(),
        marketplaceApi.getUserPurchases().catch((error) => {
          console.error('[MarketplacePage] getUserPurchases failed:', error);
          console.error('[MarketplacePage] Error response:', error.response?.data);
          console.error('[MarketplacePage] Error status:', error.response?.status);

          // Show user-friendly error notification for non-404 errors
          if (error.response?.status !== 404) {
            toast({
              title: "Error loading purchases",
              description: "Some purchased strategies may not display correctly. Please refresh the page.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
          }

          return { purchases: [] }; // Fallback if endpoint fails
        })
      ]);

      // Create sets for quick lookup
      const subscribedSet = new Set(subscribedResponse.map(s => s.token));
      const purchasedSet = new Set(purchasedResponse?.purchases?.map(p => p.webhook_token) || []);

      // Debug logging
      console.log('[MarketplacePage] Marketplace strategies response:', sharedResponse);
      console.log('[MarketplacePage] Marketplace strategies count:', sharedResponse.strategies?.length || 0);
      console.log('[MarketplacePage] Subscribed strategies:', subscribedResponse.length);
      console.log('[MarketplacePage] Purchased strategies:', purchasedResponse?.purchases?.length || 0);
      console.log('[MarketplacePage] Purchased tokens:', Array.from(purchasedSet));

      // Merge subscribed and purchased sets
      const allAccessSet = new Set([...subscribedSet, ...purchasedSet]);
      setSubscribedStrategies(allAccessSet);

      console.log('[MarketplacePage] Total accessible strategies:', allAccessSet.size);
      console.log('[MarketplacePage] Accessible tokens:', Array.from(allAccessSet));

      const groupedStrategies = sharedResponse.strategies.reduce((acc, strategy) => {
        // Convert category to match frontend category IDs (like production)
        const type = strategy.category ? strategy.category.toLowerCase() : 'uncategorized';
        if (!acc[type]) {
          acc[type] = [];
        }

        // Check if user has access - use API's user_has_access field or check by source_id
        const hasAccess = strategy.user_has_access || allAccessSet.has(strategy.source_id);

        // Debug logging for each strategy
        console.log(`[MarketplacePage] Processing ${strategy.name}:`, {
          source_id: strategy.source_id,
          original_category: strategy.category,
          mapped_to: type,
          pricing_type: strategy.pricing_type,
          user_has_access: strategy.user_has_access
        });

        acc[type].push({
          ...strategy,
          token: strategy.source_id, // Use source_id as token for compatibility
          name: strategy.name || 'Unnamed Strategy',
          description: strategy.description || 'No description provided',
          username: strategy.username || 'Anonymous',
          strategyType: strategy.strategy_type,
          isPublic: strategy.is_shared,
          rating: strategy.rating || 0,
          subscriberCount: strategy.subscriber_count || 0,
          isSubscribed: hasAccess, // Now includes both subscribed and purchased
          isPurchased: purchasedSet.has(strategy.source_id), // Use source_id
          isMonetized: strategy.is_monetized || strategy.usage_intent === 'monetize',
          usageIntent: strategy.usage_intent || 'personal',
          marketplacePurchaseUrl: strategy.marketplace_purchase_url,
          pricingEndpoint: strategy.pricing_endpoint
        });
        return acc;
      }, {});

      // Debug logging for grouped strategies
      console.log('[MarketplacePage] Grouped strategies by category:', Object.keys(groupedStrategies));
      Object.keys(groupedStrategies).forEach(category => {
        console.log(`[MarketplacePage] ${category}: ${groupedStrategies[category].length} strategies`);
      });

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
  }, [user]); // Re-fetch when user auth state changes (e.g. login)

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
      gap={{ base: 4, md: 6 }}
      flexWrap="wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      justify={{ base: "center", md: "center" }}
      align={{ base: "center", md: "stretch" }}
      direction={{ base: "column", md: "row" }}
      width="100%"
      minHeight={{ base: "auto", md: "260px" }}
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
              w={{ base: "auto", md: "auto" }}
            >
              <StrategyCard
                strategy={strategy}
                onSubscriptionChange={handleSubscriptionChange}
                isMobile={isMobile}
                isGuest={isGuest}
              />
            </MotionBox>
          ))
        ) : (
          <Flex align="center" justify="center" height={{ base: "150px", md: "260px" }} w="100%">
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
      maxW={{ base: "100%", md: "350px", lg: "450px" }}
      w={{ base: "100%", md: "auto" }}
      transition="all 0.3s"
      transform={searchFocused ? 'translateY(-2px)' : 'none'}
      boxShadow={searchFocused ? '0 4px 12px rgba(0, 198, 224, 0.15)' : 'none'}
    >
      <InputLeftElement pointerEvents="none" h={{ base: "44px", md: "40px" }}>
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
        h={{ base: "44px", md: "40px" }}
        fontSize={{ base: "md", md: "sm" }}
      />
      {searchQuery && (
        <InputRightElement h={{ base: "44px", md: "40px" }}>
          <IconButton
            icon={<X size={14} />}
            size="sm"
            variant="ghost"
            colorScheme="whiteAlpha"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            minH="44px"
            minW="44px"
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
          <Box mb={{ base: 4, md: 8 }}>
            <HStack mb={{ base: 2, md: 4 }} align="center" justify="center" width="100%">
              <BookMarked size={isMobile ? 16 : 20} color="white" />
              <Text fontSize={{ base: "md", md: "xl" }} fontWeight="bold" color="white">
                Your Subscribed Strategies
              </Text>
              <Badge
                ml={2}
                colorScheme="blue"
                bg="rgba(0, 198, 224, 0.2)"
                color="white"
                fontSize={{ base: "xs", md: "sm" }}
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

          // Hide empty categories - only show categories with strategies
          if (filteredStrategies.length === 0) {
            return null;
          }

          return (
            <Box key={category.id}>
              <HStack mb={{ base: 2, md: 4 }} align="center" justify="center" width="100%">
                <category.icon size={isMobile ? 16 : 20} color="white" />
                <Text fontSize={{ base: "md", md: "xl" }} fontWeight="bold" color="white">
                  {category.title}
                </Text>
                <Badge
                  ml={2}
                  colorScheme="blue"
                  bg="rgba(0, 198, 224, 0.2)"
                  color="white"
                  fontSize={{ base: "xs", md: "sm" }}
                >
                  {filteredStrategies.length}
                </Badge>
              </HStack>

              {!isMobile && (
                <Text color="whiteAlpha.700" fontSize="sm" mb={4} textAlign="center" width="100%">
                  {category.description}
                </Text>
              )}

              <StrategyGrid strategies={filteredStrategies} />
            </Box>
          );
        })}

        {/* Uncategorized Strategies Section */}
        {strategies.uncategorized && strategies.uncategorized.length > 0 && (
          <Box>
            <HStack mb={{ base: 2, md: 4 }} align="center" justify="center" width="100%">
              <Layout size={isMobile ? 16 : 20} color="white" />
              <Text fontSize={{ base: "md", md: "xl" }} fontWeight="bold" color="white">
                Other Strategies
              </Text>
              <Badge
                ml={2}
                colorScheme="blue"
                bg="rgba(0, 198, 224, 0.2)"
                color="white"
                fontSize={{ base: "xs", md: "sm" }}
              >
                {strategies.uncategorized.length}
              </Badge>
            </HStack>

            {!isMobile && (
              <Text color="whiteAlpha.700" fontSize="sm" mb={4} textAlign="center" width="100%">
                Strategies that haven't been categorized yet
              </Text>
            )}

            <StrategyGrid strategies={strategies.uncategorized} />
          </Box>
        )}

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

  // Wait for auth to load only if token exists but user not loaded
  if (authLoading) {
    return (
      <Flex justify="center" align="center" height="100vh" bg="background">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color="whiteAlpha.900">Loading marketplace...</Text>
        </VStack>
      </Flex>
    );
  }

  const isGuest = !user;

  return (
    <Flex minH="100vh" bg="background" color="text.primary" fontFamily="body" direction="column">
      {isGuest ? (
        <Box position="fixed" top={0} left={0} right={0} zIndex={1000}>
          <Navbar />
        </Box>
      ) : (
        <Wrapper onSelectItem={() => { }} />
      )}

      <Box
        flexGrow={1}
        ml={isGuest ? 0 : { base: 0, md: 16 }}
        mt={isGuest ? "80px" : 0}
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
            overflowX="hidden"
            p={{ base: 3, md: 4 }}
          >
            <Container maxW={{ base: "100%", md: "container.xl" }} px={{ base: 0, md: 4 }} py={{ base: 2, md: 4 }}>
              {/* Header */}
              <VStack spacing={{ base: 3, md: 4 }} align="stretch" mb={{ base: 4, md: 6 }}>
                {/* Title Row */}
                <Flex
                  direction={{ base: 'column', md: 'row' }}
                  justify="space-between"
                  align={{ base: 'flex-start', md: 'center' }}
                  gap={{ base: 2, md: 4 }}
                >
                  <VStack align={{ base: "center", md: "flex-start" }} spacing={0} w={{ base: "100%", md: "auto" }}>
                    <Text
                      fontSize={{ base: "xl", md: "2xl" }}
                      fontWeight="bold"
                      color="white"
                      textShadow="0 0 10px rgba(0, 198, 224, 0.3)"
                    >
                      Strategy Marketplace
                    </Text>
                    <Text color="whiteAlpha.700" fontSize={{ base: "xs", md: "sm" }}>
                      {totalStrategies} Available • {totalSubscribed} Subscribed
                    </Text>
                  </VStack>

                  {/* Desktop Controls */}
                  {!isMobile && (
                    <HStack spacing={4}>
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
                  )}
                </Flex>

                {/* Mobile Controls */}
                {isMobile && (
                  <VStack spacing={3} align="stretch" w="100%" maxW="100%">
                    {/* Search Bar - Full Width */}
                    <SearchBar />

                    {/* Toggle and Filter Row */}
                    <HStack justify="space-between" align="center" w="100%">
                      <ButtonGroup size="sm" isAttached variant="outline">
                        <Button
                          onClick={() => setViewMode('all')}
                          colorScheme={viewMode === 'all' ? 'blue' : 'gray'}
                          borderColor="whiteAlpha.200"
                          minH="44px"
                          minW="44px"
                          px={3}
                        >
                          <Layout size={18} />
                        </Button>
                        <Button
                          onClick={() => setViewMode('subscribed')}
                          colorScheme={viewMode === 'subscribed' ? 'blue' : 'gray'}
                          borderColor="whiteAlpha.200"
                          minH="44px"
                          minW="44px"
                          px={3}
                        >
                          <BookMarked size={18} />
                        </Button>
                      </ButtonGroup>

                      <Text fontSize="xs" color="whiteAlpha.600">
                        {viewMode === 'all' ? 'All Strategies' : 'Subscribed'}
                      </Text>
                    </HStack>

                    {/* Category Pills - Horizontal Scroll */}
                    {viewMode === 'all' && (
                      <HStack
                        spacing={2}
                        overflowX="auto"
                        pb={2}
                        w="100%"
                        maxW="100%"
                        css={{
                          '&::-webkit-scrollbar': { display: 'none' },
                          scrollbarWidth: 'none',
                        }}
                      >
                        <Button
                          size="sm"
                          variant={selectedCategory === 'all' ? 'solid' : 'outline'}
                          bg={selectedCategory === 'all' ? 'rgba(0, 198, 224, 0.2)' : 'transparent'}
                          color={selectedCategory === 'all' ? '#00C6E0' : 'whiteAlpha.700'}
                          borderColor="whiteAlpha.200"
                          onClick={() => setSelectedCategory('all')}
                          minH="36px"
                          flexShrink={0}
                          fontSize="xs"
                        >
                          All
                        </Button>
                        {categories.map((cat) => (
                          <Button
                            key={cat.id}
                            size="sm"
                            variant={selectedCategory === cat.id ? 'solid' : 'outline'}
                            bg={selectedCategory === cat.id ? 'rgba(0, 198, 224, 0.2)' : 'transparent'}
                            color={selectedCategory === cat.id ? '#00C6E0' : 'whiteAlpha.700'}
                            borderColor="whiteAlpha.200"
                            onClick={() => setSelectedCategory(cat.id)}
                            minH="36px"
                            flexShrink={0}
                            fontSize="xs"
                            leftIcon={<cat.icon size={14} />}
                          >
                            {cat.title.split(' ')[0]}
                          </Button>
                        ))}
                      </HStack>
                    )}
                  </VStack>
                )}
              </VStack>

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