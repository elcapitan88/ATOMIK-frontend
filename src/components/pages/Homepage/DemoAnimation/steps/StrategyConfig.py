import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Button, 
  VStack, 
  HStack, 
  Badge, 
  Switch,
  Divider,
  IconButton
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, MoreVertical, Check } from 'lucide-react';
import { useDemoAnimation } from '../DemoController';

const StrategyConfig = () => {
  // Get animation state from context
  const { isAnimating } = useDemoAnimation();
  
  // Local state
  const [strategies, setStrategies] = useState([]);
  const [activeStrategy, setActiveStrategy] = useState(null);
  
  // Reset and coordinate animations when this step becomes active
  useEffect(() => {
    if (isAnimating) {
      // Reset state
      setStrategies([
        {
          id: 'strategy1',
          name: 'ESH5',
          type: 'single',
          source: 'tradingview',
          accountId: '1058524',
          quantity: 1,
          isActive: false
        },
        {
          id: 'strategy2',
          name: 'NQH5',
          type: 'single',
          source: 'tradingview',
          accountId: '1058524',
          quantity: 2,
          isActive: true
        }
      ]);
      
      setActiveStrategy(null);
      
      // After delay, highlight a strategy
      const timer1 = setTimeout(() => {
        setActiveStrategy('strategy1');
      }, 1500);
      
      // After highlighting, toggle the strategy active
      const timer2 = setTimeout(() => {
        setStrategies(prev => 
          prev.map(s => 
            s.id === 'strategy1' ? { ...s, isActive: true } : s
          )
        );
      }, 3000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isAnimating]);
  
  return (
    <Flex direction="column" h="100%" p={2}>
      {/* Header with action button */}
      <Flex justify="space-between" align="center" mb={4} px={2}>
        <Text color="white" fontSize="lg" fontWeight="bold">
          Trading Strategies
        </Text>
        
        <Button
          as={motion.button}
          size="sm"
          bg="rgba(0, 198, 224, 0.2)"
          color="white"
          borderWidth="1px"
          borderColor="rgba(0, 198, 224, 0.6)"
          _hover={{ bg: "rgba(0, 198, 224, 0.3)" }}
          fontSize="sm"
          px={3}
        >
          Activate Strategy
        </Button>
      </Flex>
      
      {/* Strategy categories */}
      <Box mb={2}>
        <HStack spacing={0}>
          <Box 
            px={4} 
            py={2} 
            borderBottom="2px solid" 
            borderColor="rgba(0, 198, 224, 0.8)"
            color="white"
            fontWeight="medium"
            fontSize="sm"
          >
            Single Account Strategies ({strategies.filter(s => s.type === 'single').length})
          </Box>
          <Box 
            px={4} 
            py={2} 
            borderBottom="1px solid" 
            borderColor="whiteAlpha.200"
            color="whiteAlpha.600"
            fontSize="sm"
          >
            Group Strategies (0)
          </Box>
        </HStack>
        <Divider borderColor="whiteAlpha.200" />
      </Box>
      
      {/* Strategies list */}
      <Box 
        flex="1" 
        overflowY="auto" 
        bg="rgba(30, 30, 30, 0.3)" 
        borderRadius="lg"
        borderWidth="1px"
        borderColor="rgba(255, 255, 255, 0.1)"
        p={2}
      >
        <VStack spacing={2} align="stretch">
          <AnimatePresence>
            {strategies.map(strategy => (
              <StrategyItem 
                key={strategy.id} 
                strategy={strategy} 
                isHighlighted={strategy.id === activeStrategy}
                onToggle={() => {
                  setStrategies(prev => 
                    prev.map(s => 
                      s.id === strategy.id ? { ...s, isActive: !s.isActive } : s
                    )
                  );
                }}
              />
            ))}
          </AnimatePresence>
        </VStack>
      </Box>
    </Flex>
  );
};

// Strategy item component
const StrategyItem = ({ strategy, isHighlighted, onToggle }) => {
  return (
    <Box
      as={motion.div}
      bg={isHighlighted ? "rgba(0, 198, 224, 0.1)" : "rgba(40, 40, 40, 0.5)"}
      borderRadius="md"
      overflow="hidden"
      borderWidth="1px"
      borderColor={isHighlighted ? "rgba(0, 198, 224, 0.3)" : "transparent"}
      animate={{
        y: isHighlighted ? [0, -5, 0] : 0,
        boxShadow: isHighlighted ? 
          ["0 0 0 rgba(0, 198, 224, 0)", "0 0 15px rgba(0, 198, 224, 0.3)", "0 0 0 rgba(0, 198, 224, 0)"] :
          "none"
      }}
      transition={{ duration: 1, repeat: isHighlighted ? 1 : 0 }}
    >
      {/* Strategy header */}
      <Flex p={3} justify="space-between" align="center">
        <HStack spacing={3}>
          <Box
            bg={strategy.isActive ? "rgba(0, 198, 224, 0.2)" : "whiteAlpha.100"}
            p={2}
            borderRadius="md"
            color={strategy.isActive ? "rgba(0, 198, 224, 1)" : "white"}
          >
            <Zap size={16} />
          </Box>
          
          <VStack spacing={0} align="flex-start">
            <HStack>
              <Text color="white" fontWeight="medium" fontSize="sm">
                {strategy.name}
              </Text>
              <Badge 
                colorScheme={strategy.isActive ? "green" : "gray"} 
                variant="subtle" 
                fontSize="xs"
              >
                {strategy.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </HStack>
            <HStack spacing={1}>
              <Text color="whiteAlpha.600" fontSize="xs">
                {strategy.source}
              </Text>
              <Text color="whiteAlpha.400" fontSize="xs">•</Text>
              <Text color="whiteAlpha.600" fontSize="xs">
                Account: {strategy.accountId}
              </Text>
              <Text color="whiteAlpha.400" fontSize="xs">•</Text>
              <Text color="whiteAlpha.600" fontSize="xs">
                Qty: {strategy.quantity}
              </Text>
            </HStack>
          </VStack>
        </HStack>
        
        <HStack spacing={2}>
          <Switch
            as={motion.div}
            size="sm"
            colorScheme="green"
            isChecked={strategy.isActive}
            onChange={onToggle}
            animate={isHighlighted && !strategy.isActive ? { scale: [1, 1.2, 1] } : {}}
          />
          
          <IconButton
            icon={<MoreVertical size={14} />}
            variant="ghost"
            size="xs"
            color="whiteAlpha.600"
            _hover={{ bg: "whiteAlpha.100" }}
          />
        </HStack>
      </Flex>
    </Box>
  );
};

export default StrategyConfig;