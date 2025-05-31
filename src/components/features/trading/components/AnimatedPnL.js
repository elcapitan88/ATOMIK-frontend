import React, { useState, useEffect } from 'react';
import { Text, Box, keyframes } from '@chakra-ui/react';
import { formatCurrency } from '@/utils/formatting/currency';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const flash = keyframes`
  0% { background-color: transparent; }
  50% { background-color: rgba(72, 187, 120, 0.2); }
  100% { background-color: transparent; }
`;

const flashRed = keyframes`
  0% { background-color: transparent; }
  50% { background-color: rgba(245, 101, 101, 0.2); }
  100% { background-color: transparent; }
`;

const AnimatedPnL = ({ value, previousValue, isUpdating = false }) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [animationType, setAnimationType] = useState(null);
  
  useEffect(() => {
    if (isUpdating && previousValue !== undefined && previousValue !== value) {
      setShouldAnimate(true);
      
      // Determine animation type based on P&L change
      const change = value - previousValue;
      if (Math.abs(change) > 10) {
        setAnimationType('flash');
      } else {
        setAnimationType('pulse');
      }
      
      // Reset animation after duration
      const timer = setTimeout(() => {
        setShouldAnimate(false);
        setAnimationType(null);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [value, previousValue, isUpdating]);
  
  const getAnimation = () => {
    if (!shouldAnimate || !animationType) return 'none';
    
    if (animationType === 'flash') {
      return value > previousValue 
        ? `${flash} 0.5s ease-in-out`
        : `${flashRed} 0.5s ease-in-out`;
    }
    
    return `${pulse} 0.5s ease-in-out`;
  };
  
  const getColor = () => {
    if (value >= 0) return 'green.400';
    return 'red.400';
  };
  
  const getChangeIndicator = () => {
    if (!shouldAnimate || previousValue === undefined) return null;
    
    const change = value - previousValue;
    if (Math.abs(change) < 0.01) return null;
    
    return (
      <Text
        as="span"
        fontSize="xs"
        ml={1}
        color={change > 0 ? 'green.300' : 'red.300'}
        opacity={shouldAnimate ? 1 : 0}
        transition="opacity 0.5s"
      >
        {change > 0 ? '+' : ''}{formatCurrency(change)}
      </Text>
    );
  };
  
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      animation={getAnimation()}
      borderRadius="md"
      px={shouldAnimate ? 2 : 0}
      transition="all 0.3s"
    >
      <Text
        color={getColor()}
        fontWeight="medium"
        fontSize={shouldAnimate && animationType === 'flash' ? 'md' : 'sm'}
        transition="font-size 0.3s"
      >
        {formatCurrency(value)}
      </Text>
      {getChangeIndicator()}
    </Box>
  );
};

export default AnimatedPnL;