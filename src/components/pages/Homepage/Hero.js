import React from 'react';
import { Box, Container, Heading, Text, Button, Stack, VStack, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import ParticleBackground from './ParticleBackground';
import { ArrowRight } from 'lucide-react';

// Import animation components with correct paths
import DemoController from './DemoAnimation/DemoController';
import BrowserMockup from './DemoAnimation/BrowserMockup';
import BrokerConnect from './DemoAnimation/steps/BrokerConnect';
import WebhookCreation from './DemoAnimation/steps/WebhookCreation';
import LiveTrading from './DemoAnimation/steps/LiveTrading';

// Note: StrategyConfig.py needs to be renamed to StrategyConfig.js
// For now, let's use a placeholder component
const StrategyConfig = () => (
  <Flex direction="column" h="100%" justify="center" align="center">
    <Text color="white" fontWeight="bold" fontSize="lg">Strategy Configuration</Text>
    <Text color="whiteAlpha.700" fontSize="sm">Configure your trading strategies</Text>
  </Flex>
);

const MotionBox = motion(Box);

const Hero = () => {
  return (
    <Box
      position="relative"
      minH="100vh"
      display="flex"
      alignItems="center"
      bg="black"
      overflow="hidden"
    >
      {/* Particle Effect */}
      <ParticleBackground />

      <Container maxW="7xl" position="relative" px={{ base: 4, md: 8 }}>
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          spacing={{ base: 8, lg: 20 }}
          align="center"
          justify="space-between"
        >
          {/* Content - Left Side */}
          <VStack
            spacing={6}
            align={{ base: 'center', lg: 'flex-start' }}
            textAlign={{ base: 'center', lg: 'left' }}
            maxW={{ base: 'full', lg: '50%' }}
          >
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Heading
                as="h1"
                size={{ base: "2xl", md: "3xl", lg: "4xl" }}
                fontWeight="bold"
                color="white"
                lineHeight="shorter"
              >
                Automate Your Strategy with
                <Text
                  as="span"
                  bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                  bgClip="text"
                  px={2}
                >
                  Precision
                </Text>
              </Heading>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Text
                fontSize={{ base: 'lg', md: 'xl' }}
                color="whiteAlpha.900"
                maxW="600px"
              >
                Connect your favorite broker, set up webhooks, and automate your trading strategies with enterprise-grade reliability. Start trading smarter today.
              </Text>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Stack
                direction={{ base: 'column', sm: 'row' }}
                spacing={4}
                w="full"
                justify={{ base: 'center', lg: 'flex-start' }}
              >
                <RouterLink to="/auth">
                  <Button
                    size="lg"
                    bg="rgba(0, 198, 224, 1)"
                    color="white"
                    _hover={{
                      bg: 'rgba(0, 198, 224, 0.8)',
                    }}
                    px={8}
                  >
                    Get Started Free
                  </Button>
                </RouterLink>
                <Button
                  size="lg"
                  variant="ghost"
                  color="white"
                  borderWidth={1}
                  borderColor="whiteAlpha.400"
                  _hover={{
                    bg: 'whiteAlpha.100',
                  }}
                  px={8}
                  as="a"
                  href="#how-to-use"
                  rightIcon={<ArrowRight size={16} />}
                >
                  Learn More
                </Button>
              </Stack>
            </MotionBox>
          </VStack>

          {/* Right Side - Interactive Browser Demo */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            w={{ base: 'full', lg: '50%' }}
            display={{ base: 'none', lg: 'block' }}
          >
            {/* Animation Controller wrapper for the browser mockup */}
            <DemoController initialStep={0} autoPlay={true} stepDuration={8000}>
              <BrowserMockup>
                <BrokerConnect />
                <WebhookCreation />
                <StrategyConfig />
                <LiveTrading />
              </BrowserMockup>
            </DemoController>
          </MotionBox>
        </Stack>
      </Container>
    </Box>
  );
};

export default Hero;