import React from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Heading,
  Icon,
  Flex
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { 
  Wrench,
  Sparkles,
  Clock
} from 'lucide-react';

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const ComingSoon = () => {
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
      {/* Central wrench icon */}
      <MotionBox
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        position="relative"
        zIndex={2}
      >
        <Icon 
          as={Wrench} 
          boxSize={20} 
          color="#00C6E0" 
          opacity={0.9}
        />
      </MotionBox>
      
      {/* Decorative icons around the central icon */}
      {[Sparkles, Clock].map((IconComponent, index) => (
        <MotionBox
          key={index}
          initial={{ 
            opacity: 0, 
            x: index % 2 === 0 ? -40 : 40, 
            y: index < 1 ? -20 : 20 
          }}
          animate={{ 
            opacity: 0.5, 
            x: index % 2 === 0 ? -60 : 60, 
            y: index < 1 ? -30 : 30 
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
            Strategy Builder Coming Soon
          </Heading>
          
          <Text color="whiteAlpha.800" fontSize="md">
            We're working hard to bring you an advanced strategy builder with drag-and-drop functionality, AI integration, and powerful automation tools.
          </Text>
          
          <Text color="whiteAlpha.600" fontSize="sm" mt={4}>
            This feature is currently in development and will be available soon.
          </Text>
          
          <Text color="#00C6E0" fontSize="sm" mt={2} fontWeight="medium">
            Stay tuned for updates!
          </Text>
        </MotionBox>
      </VStack>
    </MotionBox>
  );
};

export default ComingSoon;