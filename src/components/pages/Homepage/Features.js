import React from 'react';
import { Box, Container, SimpleGrid, Heading, Text, VStack, Icon } from '@chakra-ui/react';
import { Shield, Zap, Webhook, LineChart, Users, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const FeatureCard = ({ icon, title, description }) => (
  <MotionBox
    whileHover={{ y: -5 }}
    p={6}
    bg="rgba(255, 255, 255, 0.1)"
    backdropFilter="blur(10px)"
    borderRadius="xl"
    border="1px solid rgba(255, 255, 255, 0.18)"
    transition="all 0.3s"
    role="group"
  >
    <VStack spacing={4} align="flex-start">
      <Box
        p={2}
        bg="rgba(0, 198, 224, 0.1)"
        borderRadius="lg"
        color="rgba(0, 198, 224, 1)"
        _groupHover={{ bg: 'rgba(0, 198, 224, 0.2)' }}
        transition="all 0.3s"
      >
        <Icon as={icon} boxSize={6} />
      </Box>
      <Heading size="md" color="white">
        {title}
      </Heading>
      <Text color="whiteAlpha.800" fontSize="sm">
        {description}
      </Text>
    </VStack>
  </MotionBox>
);

const Features = () => {
  const features = [
    {
      icon: Webhook,
      title: 'Webhook Integration',
      description: 'Easily integrate with any trading system using our reliable webhook endpoints. Receive and process signals in real-time.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast Execution',
      description: 'Execute trades with minimal latency. Our system is optimized for speed and reliability in volatile market conditions.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade encryption and security measures to protect your data and trading activities. Multi-factor authentication included.',
    },
    {
      icon: LineChart,
      title: 'Advanced Analytics',
      description: 'Track your strategy performance with detailed analytics. Monitor success rates, profit/loss, and other key metrics.',
    },
    {
      icon: Users,
      title: 'Multi-Account Management',
      description: 'Manage multiple trading accounts from a single dashboard. Perfect for professional traders and fund managers.',
    },
    {
      icon: Layers,
      title: 'Strategy Marketplace',
      description: 'Discover and subscribe to proven trading strategies from successful traders. Or share your own and earn.',
    },
  ];

  return (
    <Box
      id="features"
      py={20}
      bg="black"
      position="relative"
      overflow="hidden"
    >
      {/* Background Elements */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="linear-gradient(180deg, rgba(0,198,224,0.05) 0%, rgba(0,0,0,0) 100%)"
        pointerEvents="none"
      />

      <Container maxW="7xl" px={{ base: 4, md: 8 }}>
        <VStack spacing={12}>
          <VStack spacing={4} textAlign="center" maxW="800px">
            <Heading
              as="h2"
              size="2xl"
              color="white"
              fontWeight="bold"
            >
              Powerful Features for
              <Text
                as="span"
                bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                bgClip="text"
                px={2}
              >
                Professional Trading
              </Text>
            </Heading>
            <Text color="whiteAlpha.800" fontSize="lg">
              Everything you need to automate your trading strategies and scale your operations
            </Text>
          </VStack>

          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 3 }}
            spacing={8}
            w="full"
          >
            {features.map((feature, index) => (
              <MotionBox
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <FeatureCard {...feature} />
              </MotionBox>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default Features;