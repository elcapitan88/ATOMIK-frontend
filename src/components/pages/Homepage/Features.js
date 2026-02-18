import React from 'react';
import { Box, Container, SimpleGrid, Heading, Text, VStack, Icon } from '@chakra-ui/react';
import { Shield, Zap, Webhook, LineChart, Radio, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const FeatureCard = ({ icon, title, description }) => (
  <MotionBox
    as="article"
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
        aria-hidden="true"
      >
        <Icon as={icon} boxSize={6} />
      </Box>
      <Heading as="h3" size="md" color="white">
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
      title: 'TradingView Alerts to Broker',
      description: 'Connect TradingView alerts directly to your broker for automated trading. No coding required - just set up webhooks and start automating.',
    },
    {
      icon: Zap,
      title: 'Instant Trade Automation',
      description: 'Execute automated trades in milliseconds. Perfect for beginners who want reliable automated trading without complex setups.',
    },
    {
      icon: Shield,
      title: 'Secure Prop Trading Support',
      description: 'Trade safely with funded accounts from TopStep, Apex, and other prop firms. Bank-grade security for your automated strategies.',
    },
    {
      icon: LineChart,
      title: 'Real-Time Performance Tracking',
      description: 'Monitor every automated trade across all your accounts in real time. See which strategies perform best and optimize with live analytics.',
    },
    {
      icon: Radio,
      title: 'Trade Mirroring',
      description: 'Broadcast one signal to every account you own. Built for prop traders managing multiple funded accounts — one webhook, all accounts, simultaneous execution.',
    },
    {
      icon: Layers,
      title: 'No Per-Trade Fees',
      description: 'Simple, transparent pricing with no per-execution fees. Automate unlimited trades for one flat monthly price.',
    },
  ];

  return (
    <Box
      as="section"
      id="features"
      py={20}
      bg="black"
      position="relative"
      overflow="hidden"
      aria-label="Features section - Automated trading capabilities"
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
              Why Choose Atomik for
              <Text
                as="span"
                bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                bgClip="text"
                px={2}
              >
                Automated Trading
              </Text>
            </Heading>
            <Text color="whiteAlpha.800" fontSize="lg">
              The only platform beginners need to automate trading - no coding, no per-trade fees, works with prop firms
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