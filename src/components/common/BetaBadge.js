// frontend/src/components/common/BetaBadge.js
import React from 'react';
import { 
  Badge,
  Box,
  Tooltip,
  HStack,
  VStack,
  Text,
  Icon
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { 
  TestTube,
  Sparkles,
  Zap,
  Star,
  Eye,
  Info
} from 'lucide-react';

// Motion components
const MotionBadge = motion(Badge);
const MotionBox = motion(Box);

/**
 * BetaBadge component for visually indicating beta features
 * 
 * @param {string} variant - Badge style variant ('solid', 'outline', 'subtle', 'pill', 'floating')
 * @param {string} size - Badge size ('sm', 'md', 'lg')
 * @param {string} label - Custom label text (default: 'BETA')
 * @param {string} description - Tooltip description
 * @param {boolean} animated - Whether to show sparkle animation
 * @param {boolean} showIcon - Whether to show icon
 * @param {string} iconType - Icon type ('test-tube', 'sparkles', 'zap', 'star', 'eye')
 * @param {string} position - Position for floating variant ('top-right', 'top-left', 'bottom-right', 'bottom-left')
 * @param {Object} ...props - Additional props passed to Badge
 * 
 * @example
 * // Basic usage
 * <BetaBadge />
 * 
 * @example
 * // With tooltip
 * <BetaBadge 
 *   description="This feature is currently in beta testing" 
 *   animated={true}
 * />
 * 
 * @example
 * // Floating badge
 * <Box position="relative">
 *   <YourComponent />
 *   <BetaBadge variant="floating" position="top-right" />
 * </Box>
 */
const BetaBadge = ({
  variant = 'solid',
  size = 'md',
  label = 'BETA',
  description = 'This feature is currently in beta testing',
  animated = false,
  showIcon = true,
  iconType = 'test-tube',
  position = 'top-right',
  ...props
}) => {
  
  // Icon mapping
  const iconMap = {
    'test-tube': TestTube,
    'sparkles': Sparkles,
    'zap': Zap,
    'star': Star,
    'eye': Eye
  };

  const IconComponent = iconMap[iconType] || TestTube;

  // Size configurations
  const sizeConfig = {
    sm: {
      fontSize: 'xs',
      px: 2,
      py: 1,
      iconSize: 3,
      height: 'auto'
    },
    md: {
      fontSize: 'sm',
      px: 3,
      py: 1,
      iconSize: 4,
      height: 'auto'
    },
    lg: {
      fontSize: 'md',
      px: 4,
      py: 2,
      iconSize: 5,
      height: 'auto'
    }
  };

  const config = sizeConfig[size];

  // Floating position styles
  const positionStyles = {
    'top-right': { top: 2, right: 2 },
    'top-left': { top: 2, left: 2 },
    'bottom-right': { bottom: 2, right: 2 },
    'bottom-left': { bottom: 2, left: 2 }
  };

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          bg: '#9932CC',
          color: 'white',
          border: 'none'
        };
      
      case 'outline':
        return {
          bg: 'transparent',
          color: '#9932CC',
          border: '1px solid #9932CC'
        };
      
      case 'subtle':
        return {
          bg: 'rgba(153, 50, 204, 0.15)',
          color: '#9932CC',
          border: '1px solid rgba(153, 50, 204, 0.3)'
        };
      
      case 'pill':
        return {
          bg: 'rgba(153, 50, 204, 0.15)',
          color: '#9932CC',
          border: '1px solid rgba(153, 50, 204, 0.3)',
          borderRadius: 'full'
        };
      
      case 'floating':
        return {
          bg: 'rgba(153, 50, 204, 0.9)',
          color: 'white',
          border: '1px solid rgba(153, 50, 204, 0.3)',
          position: 'absolute',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(153, 50, 204, 0.4)',
          backdropFilter: 'blur(8px)',
          ...positionStyles[position]
        };
      
      default:
        return {
          bg: '#9932CC',
          color: 'white'
        };
    }
  };

  // Badge content
  const BadgeContent = () => (
    <HStack spacing={1}>
      {showIcon && (
        <Icon 
          as={IconComponent} 
          boxSize={config.iconSize} 
        />
      )}
      <Text 
        fontSize={config.fontSize} 
        fontWeight="bold" 
        letterSpacing="0.5px"
      >
        {label}
      </Text>
    </HStack>
  );

  // Animated sparkles for floating badges
  const AnimatedSparkles = () => (
    <>
      {[...Array(3)].map((_, i) => (
        <MotionBox
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 0], 
            scale: [0, 1, 0],
            x: [0, (i - 1) * 15],
            y: [0, -10 - (i * 5)]
          }}
          transition={{ 
            delay: i * 0.2, 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
          position="absolute"
          top="-10px"
          left={`${20 + (i * 20)}%`}
          pointerEvents="none"
        >
          <Icon as={Sparkles} boxSize={2} color="#9932CC" opacity={0.7} />
        </MotionBox>
      ))}
    </>
  );

  // Pulse animation for solid badges
  const pulseAnimation = animated ? {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      boxShadow: [
        '0 0 0 0 rgba(153, 50, 204, 0.4)',
        '0 0 0 8px rgba(153, 50, 204, 0)',
        '0 0 0 0 rgba(153, 50, 204, 0)'
      ]
    },
    transition: { 
      duration: 2,
      repeat: Infinity,
      repeatDelay: 3
    }
  } : {};

  const badge = (
    <MotionBadge
      {...pulseAnimation}
      {...config}
      {...getVariantStyles()}
      borderRadius={variant === 'pill' ? 'full' : 'md'}
      fontFamily="mono"
      position="relative"
      overflow="visible"
      display="inline-flex"
      alignItems="center"
      {...props}
    >
      <BadgeContent />
      {animated && variant === 'floating' && <AnimatedSparkles />}
    </MotionBadge>
  );

  // Wrap with tooltip if description provided
  if (description) {
    return (
      <Tooltip
        label={
          <VStack spacing={2} p={2}>
            <HStack spacing={2}>
              <Icon as={Info} boxSize={4} color="#9932CC" />
              <Text fontWeight="bold" color="white">Beta Feature</Text>
            </HStack>
            <Text fontSize="sm" textAlign="center" color="whiteAlpha.800">
              {description}
            </Text>
            <Text fontSize="xs" color="whiteAlpha.600" fontStyle="italic">
              Help us improve by providing feedback!
            </Text>
          </VStack>
        }
        placement="top"
        bg="rgba(0, 0, 0, 0.9)"
        border="1px solid rgba(153, 50, 204, 0.3)"
        borderRadius="lg"
        p={3}
        maxW="280px"
      >
        {badge}
      </Tooltip>
    );
  }

  return badge;
};

export default BetaBadge;