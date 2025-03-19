import React, { useRef } from 'react';
import { Box, Flex, Text, HStack, IconButton } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoAnimation } from './DemoController';
import StepIndicators from './common/StepIndicators';
import { MoreVertical } from 'lucide-react';

// URLs for each step - matching your app's sections
const STEP_TITLES = [
  "Connect Trading Account",
  "Create Webhook",
  "Activate Strategy",
  "Trading Dashboard"
];

const BrowserMockup = ({ children }) => {
  // Get animation state from context
  const { currentStep, isAnimating } = useDemoAnimation();
  const mockupRef = useRef(null);
  
  return (
    <Box
      ref={mockupRef}
      w="full"
      h="500px"
      aspectRatio="16/9"
      bg="#121212"
      borderRadius="xl"
      position="relative"
      overflow="hidden"
      boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
      border="1px solid rgba(255,255,255,0.18)"
    >
      {/* App Header - instead of browser bar */}
      <Flex
        bg="#1A1A1A"
        h="48px"
        align="center"
        px={4}
        borderBottom="1px solid rgba(255,255,255,0.1)"
        justify="space-between"
      >
        <Text color="white" fontSize="md" fontWeight="medium">
          Atomik Trading
        </Text>
        
        <Text color="rgba(0, 198, 224, 1)" fontSize="sm">
          {STEP_TITLES[currentStep]}
        </Text>
        
        <HStack spacing={2}>
          <IconButton
            icon={<MoreVertical size={16} />}
            variant="ghost"
            size="sm"
            color="whiteAlpha.700"
          />
        </HStack>
      </Flex>
      
      {/* Content Area */}
      <Box p={4} h="calc(100% - 48px)" position="relative" overflow="hidden" bg="#121212">
        {/* Content with Step Animations */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        
        {/* Mouse Cursor Element */}
        <MouseCursor />
        
        {/* Step Indicators at Bottom */}
        <Box position="absolute" bottom="16px" left="0" right="0">
          <StepIndicators />
        </Box>
      </Box>
    </Box>
  );
};

// Mouse cursor component that will follow a path based on the current step
const MouseCursor = () => {
  const { currentStep, isAnimating, animationProgress } = useDemoAnimation();
  
  // Define cursor positions for each step (these will need to be tuned)
  const cursorPositions = {
    0: [
      { x: 100, y: 100, duration: 0.5, delay: 0.5 },
      { x: 400, y: 150, duration: 1, delay: 1 },
      { x: 400, y: 150, scale: 0.9, duration: 0.1, delay: 0 }, // Click effect
      { x: 400, y: 150, scale: 1, duration: 0.1, delay: 0 },
    ],
    1: [
      { x: 150, y: 120, duration: 0.5, delay: 0.5 },
      { x: 350, y: 200, duration: 1, delay: 1 },
      { x: 350, y: 200, scale: 0.9, duration: 0.1, delay: 0 }, // Click effect
      { x: 350, y: 200, scale: 1, duration: 0.1, delay: 0 },
    ],
    // Add positions for other steps
  };
  
  // Get the current set of positions
  const positions = cursorPositions[currentStep] || [];
  
  // Calculate current position based on animation progress
  const totalDuration = positions.reduce((total, pos) => total + pos.duration + (pos.delay || 0), 0);
  const position = isAnimating ? calculateCursorPosition(positions, animationProgress * totalDuration) : positions[0];
  
  return (
    <Box
      as={motion.div}
      position="absolute"
      left={0}
      top={0}
      w="18px"
      h="18px"
      zIndex={10}
      pointerEvents="none"
      animate={{
        x: position?.x || 0,
        y: position?.y || 0,
        scale: position?.scale || 1,
      }}
      transition={{
        duration: 0.2,
        ease: "linear"
      }}
      style={{
        clipPath: "polygon(0% 0%, 60% 60%, 40% 100%, 100% 40%, 100% 30%, 40% 0%)",
        background: "rgba(255, 255, 255, 0.9)",
      }}
    />
  );
};

// Helper function to calculate cursor position at a specific time
const calculateCursorPosition = (positions, currentTime) => {
  let elapsedTime = 0;
  
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i];
    const positionTime = (position.duration || 0) + (position.delay || 0);
    
    if (currentTime <= elapsedTime + positionTime) {
      // We're in this position's time range
      const progress = (currentTime - elapsedTime) / positionTime;
      
      // If we're in the delay period, return the current position
      if (progress < (position.delay || 0) / positionTime) {
        return i > 0 ? positions[i-1] : position;
      }
      
      // If we're between this position and the next
      if (i < positions.length - 1) {
        return {
          x: position.x + (positions[i+1].x - position.x) * progress,
          y: position.y + (positions[i+1].y - position.y) * progress,
          scale: position.scale || 1,
        };
      }
      
      return position;
    }
    
    elapsedTime += positionTime;
  }
  
  // If we've exceeded all positions, return the last one
  return positions[positions.length - 1] || { x: 0, y: 0 };
};

export default BrowserMockup;