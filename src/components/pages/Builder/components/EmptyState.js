import React from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Button, 
  Icon, 
  Flex, 
  Heading 
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { 
  PanelRight, 
  TrendingUp, 
  ArrowRight,
  LayoutGrid 
} from 'lucide-react';
import useStrategyBuilder from '@/hooks/useStrategyBuilder';

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const EmptyState = () => {
  const { startCreatingComponent, COMPONENT_TYPES } = useStrategyBuilder();

  const handleCreateEntry = () => {
    startCreatingComponent(COMPONENT_TYPES.ENTRY);
  };

  // Decorative elements for the visual design
  const DecorativeIcons = () => (
    <MotionFlex
      justify="center"
      align="center"
      position="relative"
      w="100%"
      h="150px"
      mb={6}
    >
      {/* Central layout grid icon */}
      <MotionBox
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        position="relative"
        zIndex={2}
      >
        <Icon 
          as={LayoutGrid} 
          boxSize={20} 
          color="#00C6E0" 
          opacity={0.9}
        />
      </MotionBox>
      
      {/* Decorative icons around the central icon */}
      {[TrendingUp, PanelRight].map((IconComponent, index) => (
        <MotionBox
          key={index}
          initial={{ 
            opacity: 0, 
            x: index % 2 === 0 ? -40 : 40, 
            y: index < 2 ? -20 : 20 
          }}
          animate={{ 
            opacity: 0.5, 
            x: index % 2 === 0 ? -60 : 60, 
            y: index < 2 ? -30 : 30 
          }}
          transition={{ 
            delay: 0.3 + (index * 0.1), 
            duration: 0.5 
          }}
          position="absolute"
        >
          <Icon 
            as={IconComponent} 
            boxSize={10} 
            color="whiteAlpha.600" 
          />
        </MotionBox>
      ))}
    </MotionFlex>
  );

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      maxW="600px"
      w="100%"
      textAlign="center"
      p={8}
    >
      <VStack spacing={6}>
        <DecorativeIcons />
        
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Heading size="lg" color="white" mb={2}>
            Build Your Trading Strategy
          </Heading>
          
          <Text color="whiteAlpha.800" fontSize="md">
            Start by creating components that define the rules for your trading strategy.
          </Text>
          
          <Text color="whiteAlpha.600" fontSize="sm" mt={2}>
            Add entry and exit conditions, stop losses, take profit targets, and risk management rules.
          </Text>
        </MotionBox>
        
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          mt={4}
        >
          <Button
            onClick={handleCreateEntry}
            bg="#00C6E0"
            color="black"
            _hover={{ bg: "#00D7F2", transform: "translateY(-2px)" }}
            _active={{ bg: "#00B4CC" }}
            size="lg"
            rightIcon={<ArrowRight size={16} />}
            boxShadow="0 4px 14px rgba(0, 198, 224, 0.4)"
            transition="all 0.2s"
          >
            Create Entry Condition
          </Button>
          
          <Text color="whiteAlpha.600" fontSize="xs" mt={4}>
            Or use the + button in the bottom right to create any component type
          </Text>
        </MotionBox>
      </VStack>
    </MotionBox>
  );
};

export default EmptyState;