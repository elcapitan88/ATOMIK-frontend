import React from 'react';
import { Box, Container, Flex, Text, VStack, HStack, Icon, SimpleGrid } from '@chakra-ui/react';
import { TrendingUp, Users, Zap, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const MotionBox = motion(Box);

const StatBox = ({ icon, value, label, prefix = '', suffix = '' }) => (
  <Flex
    direction={{ base: "row", md: "column" }}
    align={{ base: "center", md: "center" }}
    p={{ base: 4, md: 8 }}
    bg="rgba(255, 255, 255, 0.1)"
    backdropFilter="blur(10px)"
    borderRadius="xl"
    border="1px solid rgba(255, 255, 255, 0.18)"
    gap={{ base: 4, md: 0 }}
  >
    <Box
      p={3}
      bg="rgba(0, 198, 224, 0.1)"
      borderRadius="full"
      color="rgba(0, 198, 224, 1)"
      flexShrink={0}
      mb={{ base: 0, md: 4 }}
    >
      <Icon as={icon} boxSize={6} />
    </Box>
    <VStack 
      spacing={{ base: 0, md: 1 }} 
      align={{ base: "flex-start", md: "center" }}
    >
      <HStack spacing={1} align="center">
        {prefix && <Text color="white" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">{prefix}</Text>}
        <Text color="white" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
          <CountUp end={value} duration={2.5} separator="," />
        </Text>
        {suffix && <Text color="white" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">{suffix}</Text>}
      </HStack>
      <Text 
        color="whiteAlpha.800" 
        fontSize={{ base: "xs", md: "sm" }}
        textAlign={{ base: "left", md: "center" }}
      >
        {label}
      </Text>
    </VStack>
  </Flex>
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
    <Box py={{ base: 10, md: 16 }} bg="black" position="relative">
      <Container maxW="7xl" px={{ base: 4, md: 8 }}>
        {/* On small screens, show stats in 2 rows of 2 */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 4, md: 8 }}>
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