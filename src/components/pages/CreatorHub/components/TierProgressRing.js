import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700'
};

const TIER_THRESHOLDS = {
  bronze: { next: 'Silver', target: 100 },
  silver: { next: 'Gold', target: 500 },
  gold: { next: 'Diamond', target: 2000 }
};

const TierProgressRing = ({
  currentTier = 'bronze',
  currentSubscribers = 0,
  nextTierThreshold = 100,
  progressPercentage = 0,
  size = 160,
  strokeWidth = 10
}) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(progressPercentage, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const tierColor = TIER_COLORS[currentTier] || TIER_COLORS.bronze;
  const tierInfo = TIER_THRESHOLDS[currentTier] || TIER_THRESHOLDS.bronze;
  const remaining = Math.max(nextTierThreshold - currentSubscribers, 0);

  return (
    <Box
      ref={ref}
      bg="#121212"
      border="1px solid rgba(255,255,255,0.06)"
      borderRadius="16px"
      p={6}
      display="flex"
      alignItems="center"
      gap={6}
      flexWrap={{ base: 'wrap', md: 'nowrap' }}
      justifyContent={{ base: 'center', md: 'flex-start' }}
    >
      {/* Ring */}
      <Box flexShrink={0} position="relative" width={`${size}px`} height={`${size}px`}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Animated progress */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tierColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={inView ? { strokeDashoffset } : { strokeDashoffset: circumference }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        {/* Center text */}
        <VStack
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          spacing={0}
        >
          <Text
            fontSize="28px"
            fontWeight="800"
            color="white"
            lineHeight="1"
            letterSpacing="-0.02em"
          >
            {Math.round(progress)}%
          </Text>
          <Text
            fontSize="10px"
            fontWeight="600"
            color="whiteAlpha.500"
            textTransform="uppercase"
            letterSpacing="0.05em"
          >
            Progress
          </Text>
        </VStack>
      </Box>

      {/* Info */}
      <VStack align="start" spacing={3} flex={1} minW="180px">
        <Box
          bg={`${tierColor}22`}
          border={`1px solid ${tierColor}44`}
          px={3}
          py={1}
          borderRadius="full"
        >
          <Text
            fontSize="12px"
            fontWeight="700"
            color={tierColor}
            textTransform="uppercase"
            letterSpacing="0.05em"
          >
            {currentTier} Tier
          </Text>
        </Box>
        <VStack align="start" spacing={1}>
          <Text color="white" fontSize="md" fontWeight="600">
            {currentSubscribers} subscriber{currentSubscribers !== 1 ? 's' : ''}
          </Text>
          <Text color="whiteAlpha.500" fontSize="sm">
            {remaining > 0
              ? `${remaining} more to reach ${tierInfo.next}`
              : `${tierInfo.next} tier reached!`
            }
          </Text>
        </VStack>

        {/* Benefits */}
        <VStack align="start" spacing={1} pt={1}>
          <Text color="whiteAlpha.400" fontSize="11px" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
            Current Benefits
          </Text>
          <Text color="whiteAlpha.600" fontSize="13px">
            {currentTier === 'gold' ? '10%' : currentTier === 'silver' ? '15%' : '20%'} platform fee
          </Text>
          {currentTier !== 'bronze' && (
            <Text color="whiteAlpha.600" fontSize="13px">Featured placement</Text>
          )}
          {currentTier === 'gold' && (
            <Text color="whiteAlpha.600" fontSize="13px">Custom branding</Text>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};

export default TierProgressRing;
