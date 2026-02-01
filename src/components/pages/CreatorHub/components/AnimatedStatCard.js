import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

const MotionBox = motion(Box);

const AnimatedStatCard = ({
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon: Icon,
  accentColor = '#00C6E0',
  delay = 0
}) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <MotionBox
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
      bg="#121212"
      border="1px solid rgba(255,255,255,0.06)"
      borderRadius="16px"
      p={6}
      position="relative"
      overflow="hidden"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 24px -8px rgba(0, 198, 224, 0.15)`,
        borderColor: 'rgba(255,255,255,0.1)'
      }}
      transition="all 0.2s ease"
      cursor="default"
    >
      {/* Subtle gradient accent */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        h="2px"
        bg={`linear-gradient(90deg, ${accentColor}, transparent)`}
        opacity={0.6}
      />

      <VStack align="start" spacing={3}>
        {Icon && (
          <Box color={accentColor} opacity={0.8}>
            <Icon size={20} />
          </Box>
        )}
        <Text
          color="white"
          fontSize="36px"
          fontWeight="800"
          letterSpacing="-0.02em"
          lineHeight="1"
          fontFeatureSettings="'tnum'"
        >
          {inView ? (
            <CountUp
              start={0}
              end={value}
              duration={1.5}
              separator=","
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
              delay={0.2}
            />
          ) : (
            `${prefix}0${suffix}`
          )}
        </Text>
        <Text
          color="whiteAlpha.500"
          fontSize="12px"
          fontWeight="600"
          textTransform="uppercase"
          letterSpacing="0.05em"
        >
          {label}
        </Text>
      </VStack>
    </MotionBox>
  );
};

export default AnimatedStatCard;
