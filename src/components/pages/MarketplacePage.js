import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  Container,
  Select,
  Badge,
} from '@chakra-ui/react';
import { Search, TrendingUp, BarChart2, Zap } from 'lucide-react';
import CategoryRow from '../features/marketplace/components/CategoryRow';

// Dummy data for testing
const dummyStrategies = {
  momentum: [
    {
      id: 1,
      name: "Trend Following Master",
      description: "Capture strong market trends with sophisticated momentum indicators",
      risk: "Medium",
      winRate: "65",
      rating: "4.8",
      users: "234",
      timeframe: "15m",
      author: "John Smith",
      authorTitle: "Pro Trader",
      price: 149,
      category: "momentum"
    },
    {
      id: 2,
      name: "MACD Momentum Pro",
      description: "Advanced MACD strategy for momentum trading",
      risk: "High",
      winRate: "72",
      rating: "4.6",
      users: "156",
      timeframe: "1h",
      author: "Sarah Johnson",
      authorTitle: "Strategy Expert",
      price: 199,
      category: "momentum"
    },
    // Add more momentum strategies...
  ],
  meanReversion: [
    {
      id: 3,
      name: "Mean Reversion Elite",
      description: "Statistical arbitrage using advanced mean reversion techniques",
      risk: "Low",
      winRate: "58",
      rating: "4.9",
      users: "312",
      timeframe: "5m",
      author: "Mike Chen",
      authorTitle: "Quant Developer",
      price: 299,
      category: "mean-reversion"
    },
    // Add more mean reversion strategies...
  ],
  breakout: [
    {
      id: 4,
      name: "Volatility Breakout",
      description: "Capture explosive moves with volume-based breakout detection",
      risk: "High",
      winRate: "62",
      rating: "4.7",
      users: "189",
      timeframe: "30m",
      author: "Lisa Zhang",
      authorTitle: "Technical Analyst",
      price: 179,
      category: "breakout"
    },
    // Add more breakout strategies...
  ]
};

const categories = [
  {
    id: 'momentum',
    title: 'Momentum Strategies',
    description: 'Strategies that capitalize on market momentum',
    icon: TrendingUp
  },
  {
    id: 'meanReversion',
    title: 'Mean Reversion',
    description: 'Statistical arbitrage and mean reversion strategies',
    icon: BarChart2
  },
  {
    id: 'breakout',
    title: 'Breakout Trading',
    description: 'Strategies focused on market breakouts',
    icon: Zap
  }
];

const MarketplaceLayout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <Box 
      minH="100vh" 
      bg="background" 
      color="text.primary"
      p={6}
      position="relative"
    >
      {/* Background effects */}
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
      <Container maxW="container.xl" position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            justify="space-between" 
            align={{ base: 'stretch', md: 'center' }}
            gap={4}
          >
            <VStack align="stretch" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold">
                Strategy Marketplace
              </Text>
              <Text color="whiteAlpha.700">
                Discover and implement proven trading strategies
              </Text>
            </VStack>

            {/* Search and Filter */}
            <HStack spacing={4} flex={{ base: '1', md: 'initial' }}>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <Search size={18} color="white" opacity={0.5} />
                </InputLeftElement>
                <Input
                  placeholder="Search strategies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="whiteAlpha.100"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  _hover={{ borderColor: "whiteAlpha.300" }}
                  _focus={{ 
                    borderColor: "rgba(0, 198, 224, 0.6)",
                    boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                  }}
                />
              </InputGroup>

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
              >
                <option value="all">All Categories</option>
                <option value="momentum">Momentum</option>
                <option value="mean-reversion">Mean Reversion</option>
                <option value="breakout">Breakout</option>
              </Select>
            </HStack>
          </Flex>

          {/* Categories Sections */}
          <VStack spacing={12} align="stretch">
            {categories.map((category) => (
              <Box key={category.id}>
                <HStack spacing={2} mb={4}>
                  <category.icon size={20} />
                  <Text fontSize="xl" fontWeight="bold">
                    {category.title}
                  </Text>
                  <Badge colorScheme="blue" ml={2}>
                    {dummyStrategies[category.id]?.length || 0} Strategies
                  </Badge>
                </HStack>
                
                <CategoryRow 
                  strategies={dummyStrategies[category.id] || []}
                />
              </Box>
            ))}
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default MarketplaceLayout;