import React from 'react';
import { Box, Container, SimpleGrid, Text, VStack, HStack, Icon } from '@chakra-ui/react';
import { TrendingUp, Users, Zap, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const MotionBox = motion(Box);

const StatBox = ({ icon, value, label, prefix = '', suffix = '' }) => (
  <VStack
    spacing={4}
    p={8}
    bg="rgba(255, 255, 255, 0.1)"
    backdropFilter="blur(10px)"
    borderRadius="xl"
    border="1px solid rgba(255, 255, 255, 0.18)"
  >
    <Box
      p={3}
      bg="rgba(0, 198, 224, 0.1)"
      borderRadius="full"
      color="rgba(0, 198, 224, 1)"
    >
      <Icon as={icon} boxSize={6} />
    </Box>
    <VStack spacing={1}>
      <HStack spacing={1} align="center">
        {prefix && <Text color="white" fontSize="3xl" fontWeight="bold">{prefix}</Text>}
        <Text color="white" fontSize="3xl" fontWeight="bold">
          <CountUp end={value} duration={2.5} separator="," />
        </Text>
        {suffix && <Text color="white" fontSize="3xl" fontWeight="bold">{suffix}</Text>}
      </HStack>
      <Text color="whiteAlpha.800" fontSize="sm">
        {label}
      </Text>
    </VStack>
  </VStack>
);

const Statistics = () => {
  const stats = [
    {
      icon: TrendingUp,
      value: 1000000,
      label: 'Trades Executed',
      prefix: '',
      suffix: '+'
    },
    {
      icon: Users,
      value: 500,
      label: 'Active Traders',
      prefix: '',
      suffix: '+'
    },
    {
      icon: Zap,
      value: 50,
      label: 'Millisecond Latency',
      prefix: '<',
      suffix: 'ms'
    },
    {
      icon: DollarSign,
      value: 100,
      label: 'Million in Volume',
      prefix: '$',
      suffix: 'M+'
    }
  ];

  return (
    <Box py={16} bg="black" position="relative">
      <Container maxW="7xl" px={{ base: 4, md: 8 }}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
          {stats.map((stat, index) => (
            <MotionBox
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <StatBox {...stat} />
            </MotionBox>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default Statistics;