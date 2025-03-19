import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Grid, HStack, VStack, Badge } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, DollarSign, Activity, Clock, BarChart2 } from 'lucide-react';
import { useDemoAnimation } from '../DemoController';
import TypeWriter from '../common/Typewriter';

const LiveTrading = () => {
  // Get animation state from context
  const { isAnimating, typingText, typeText } = useDemoAnimation();
  
  // Track animation state
  const [showTrade, setShowTrade] = useState(false);
  const [showProfit, setShowProfit] = useState(false);
  
  // Coordinate animations
  useEffect(() => {
    if (isAnimating) {
      // Reset state
      setShowTrade(false);
      setShowProfit(false);
      
      // Start typing after a delay
      setTimeout(() => {
        typeText('Executing BUY order: ESH5 × 1 @ market');
      }, 800);
      
      // Show trade notification after typing
      setTimeout(() => {
        setShowTrade(true);
      }, 2000);
      
      // Show profit update
      setTimeout(() => {
        setShowProfit(true);
      }, 3500);
    }
  }, [isAnimating, typeText]);
  
  return (
    <Flex h="100%" direction="column">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={3}>
        <Text color="white" fontSize="lg" fontWeight="bold">
          Trading Dashboard
        </Text>
        
        <Badge colorScheme="green" variant="subtle">
          Connected: Trading Account
        </Badge>
      </Flex>
      
      {/* Main grid layout */}
      <Grid templateColumns="1.5fr 1fr" gap={3} h="calc(100% - 40px)">
        {/* Chart area */}
        <Box
          bg="rgba(20, 23, 31, 0.6)"
          borderRadius="lg"
          border="1px solid rgba(255, 255, 255, 0.1)"
          overflow="hidden"
          position="relative"
        >
          {/* Chart header */}
          <Flex 
            bg="rgba(15, 17, 23, 0.8)" 
            p={2} 
            justify="space-between" 
            align="center"
            borderBottom="1px solid rgba(255, 255, 255, 0.1)"
          >
            <HStack>
              <Text color="white" fontSize="xs" fontWeight="bold">ES1!</Text>
              <Badge colorScheme="blue" variant="subtle" fontSize="xs">5min</Badge>
            </HStack>
            
            <HStack spacing={2}>
              <Box w="6px" h="6px" borderRadius="full" bg="red.400"></Box>
              <Box w="6px" h="6px" borderRadius="full" bg="yellow.400"></Box>
              <Box w="6px" h="6px" borderRadius="full" bg="green.400"></Box>
            </HStack>
          </Flex>
          
          {/* Chart mockup */}
          <Box h="calc(100% - 32px)" p={2} position="relative">
            {/* Horizontal line representing current price */}
            <Box
              as={motion.div}
              position="absolute"
              left={0}
              right={0}
              top="50%"
              h="1px"
              bg="whiteAlpha.400"
            />
            
            {/* Price labels */}
            <Text
              position="absolute"
              right={2}
              top="calc(50% - 10px)"
              fontSize="xs"
              color="whiteAlpha.800"
            >
              4,825.50
            </Text>
            
            {/* Simple chart line */}
            <Box
              as={motion.div}
              position="absolute"
              bottom="30%"
              left={0}
              right={0}
              h="60px"
            >
              <svg width="100%" height="100%" viewBox="0 0 100 60">
                <path
                  d="M0,30 C10,35 20,25 30,28 C40,31 50,20 60,25 C70,30 80,20 90,15 C95,12 100,20 100,20"
                  fill="none"
                  stroke="rgba(0, 198, 224, 0.6)"
                  strokeWidth="2"
                />
              </svg>
            </Box>
            
            {/* Trade execution point */}
            <Box
              as={motion.div}
              position="absolute"
              bottom="30%"
              right="10%"
              w="12px"
              h="12px"
              borderRadius="full"
              bg="green.500"
              transform="translate(-50%, 50%)"
              opacity={showTrade ? 1 : 0}
              animate={showTrade ? {
                scale: [0, 1.5, 1],
                opacity: [0, 1, 1]
              } : {}}
              transition={{ duration: 0.8 }}
            />
            
            {/* Time markers */}
            <Flex
              position="absolute"
              bottom={2}
              left={2}
              right={2}
              justify="space-between"
            >
              <Text fontSize="xs" color="whiteAlpha.600">09:30</Text>
              <Text fontSize="xs" color="whiteAlpha.600">10:00</Text>
              <Text fontSize="xs" color="whiteAlpha.600">10:30</Text>
              <Text fontSize="xs" color="whiteAlpha.600">11:00</Text>
            </Flex>
          </Box>
        </Box>
        
        {/* Right panel */}
        <VStack spacing={3} align="stretch">
          {/* Incoming signal notification */}
          <Box
            bg="rgba(20, 23, 31, 0.6)"
            borderRadius="lg"
            border="1px solid rgba(255, 255, 255, 0.1)"
            overflow="hidden"
          >
            <Flex
              bg="rgba(15, 17, 23, 0.8)"
              px={3}
              py={2}
              borderBottom="1px solid rgba(255, 255, 255, 0.1)"
              align="center"
            >
              <Activity size={14} color="#00C6E0" style={{ marginRight: '8px' }} />
              <Text color="white" fontSize="sm" fontWeight="bold">
                Signal Activity
              </Text>
            </Flex>
            
            <Box p={3}>
              <VStack align="stretch" spacing={3}>
                {/* Latest signal */}
                <Box
                  as={motion.div}
                  bg="rgba(39, 174, 96, 0.1)"
                  borderRadius="md"
                  borderLeft="3px solid rgba(39, 174, 96, 0.6)"
                  p={3}
                  animate={showTrade ? {
                    y: [10, 0],
                    opacity: [0, 1]
                  } : {}}
                  opacity={showTrade ? 1 : 0}
                >
                  <Flex justify="space-between" align="center" mb={1}>
                    <HStack>
                      <ArrowUp size={14} color="#2ecc71" />
                      <Text color="green.400" fontWeight="bold" fontSize="sm">
                        BUY
                      </Text>
                    </HStack>
                    <HStack>
                      <Clock size={12} color="rgba(255, 255, 255, 0.6)" />
                      <Text color="whiteAlpha.600" fontSize="xs">
                        Just now
                      </Text>
                    </HStack>
                  </Flex>
                  
                  <TypeWriter
                    text={typingText || 'Executing BUY order: ESH5 × 1 @ market'}
                    textColor="white"
                    fontSize="xs"
                    isComplete={!isAnimating && !!typingText}
                    fontFamily="mono"
                  />
                </Box>
                
                {/* Previous signal */}
                <Box
                  bg="rgba(20, 25, 35, 0.5)"
                  borderRadius="md"
                  borderLeft="3px solid rgba(255, 255, 255, 0.2)"
                  p={3}
                  opacity={0.6}
                >
                  <Flex justify="space-between" align="center" mb={1}>
                    <HStack>
                      <ArrowDown size={14} color="#e74c3c" />
                      <Text color="red.400" fontWeight="bold" fontSize="sm">
                        SELL
                      </Text>
                    </HStack>
                    <HStack>
                      <Clock size={12} color="rgba(255, 255, 255, 0.6)" />
                      <Text color="whiteAlpha.600" fontSize="xs">
                        2h ago
                      </Text>
                    </HStack>
                  </Flex>
                  
                  <Text color="whiteAlpha.800" fontSize="xs" fontFamily="mono">
                    SELL order executed: ESH5 × 1 @ 4,810.25
                  </Text>
                </Box>
              </VStack>
            </Box>
          </Box>
          
          {/* Account overview */}
          <Box
            bg="rgba(20, 23, 31, 0.6)"
            borderRadius="lg"
            border="1px solid rgba(255, 255, 255, 0.1)"
            overflow="hidden"
            flex={1}
          >
            <Flex
              bg="rgba(15, 17, 23, 0.8)"
              px={3}
              py={2}
              borderBottom="1px solid rgba(255, 255, 255, 0.1)"
              align="center"
            >
              <BarChart2 size={14} color="#00C6E0" style={{ marginRight: '8px' }} />
              <Text color="white" fontSize="sm" fontWeight="bold">
                Account Overview
              </Text>
            </Flex>
            
            <Box p={4}>
              <VStack align="stretch" spacing={4}>
                {/* Balance row */}
                <Flex justify="space-between" align="center">
                  <Text color="whiteAlpha.700" fontSize="sm">
                    Account Balance
                  </Text>
                  <HStack>
                    <DollarSign size={14} color="white" />
                    <Text color="white" fontSize="md" fontWeight="bold">
                      10,254.75
                    </Text>
                  </HStack>
                </Flex>
                
                {/* P&L row */}
                <Flex justify="space-between" align="center">
                  <Text color="whiteAlpha.700" fontSize="sm">
                    Open P&L
                  </Text>
                  <HStack
                    as={motion.div}
                    animate={showProfit ? {
                      x: [-10, 0],
                      opacity: [0, 1]
                    } : {}}
                    opacity={showProfit ? 1 : 0}
                  >
                    <ArrowUp size={14} color="#2ecc71" />
                    <Text 
                      color="green.400" 
                      fontSize="md" 
                      fontWeight="bold"
                    >
                      +$145.50
                    </Text>
                  </HStack>
                </Flex>
                
                {/* Positions row */}
                <Flex justify="space-between" align="center">
                  <Text color="whiteAlpha.700" fontSize="sm">
                    Open Positions
                  </Text>
                  <Badge
                    colorScheme="green"
                    variant="subtle"
                    fontSize="sm"
                    opacity={showTrade ? 1 : 0.5}
                    animate={showTrade ? {
                      opacity: [0.5, 1]
                    } : {}}
                  >
                    {showTrade ? '1 Active' : '0 Active'}
                  </Badge>
                </Flex>
                
                {/* Position details - appears when position is opened */}
                <Box
                  as={motion.div}
                  bg="rgba(0, 198, 224, 0.1)"
                  borderRadius="md"
                  p={3}
                  border="1px solid rgba(0, 198, 224, 0.2)"
                  opacity={showTrade ? 1 : 0}
                  animate={showTrade ? {
                    y: [20, 0],
                    opacity: [0, 1]
                  } : {}}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <HStack justify="space-between" mb={2}>
                    <HStack>
                      <Text color="white" fontSize="sm" fontWeight="bold">ESH5</Text>
                      <Badge colorScheme="green">LONG</Badge>
                    </HStack>
                    <Text 
                      color="green.400" 
                      fontSize="sm"
                      fontWeight="bold"
                    >
                      +$145.50
                    </Text>
                  </HStack>
                  
                  <SimpleGrid columns={2} spacing={2} fontSize="xs">
                    <HStack>
                      <Text color="whiteAlpha.700">Quantity:</Text>
                      <Text color="white">1</Text>
                    </HStack>
                    <HStack>
                      <Text color="whiteAlpha.700">Entry:</Text>
                      <Text color="white">4,825.50</Text>
                    </HStack>
                    <HStack>
                      <Text color="whiteAlpha.700">Current:</Text>
                      <Text color="white">4,834.50</Text>
                    </HStack>
                    <HStack>
                      <Text color="whiteAlpha.700">P&L:</Text>
                      <Text color="green.400">+9.00 pts</Text>
                    </HStack>
                  </SimpleGrid>
                </Box>
              </VStack>
            </Box>
          </Box>
        </VStack>
      </Grid>
    </Flex>
  );
};

const SimpleGrid = ({ columns, spacing, children, ...props }) => {
  return (
    <Grid
      templateColumns={`repeat(${columns}, 1fr)`}
      gap={spacing}
      {...props}
    >
      {children}
    </Grid>
  );
};

export default LiveTrading;