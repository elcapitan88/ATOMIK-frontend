import React from 'react';
import { Box, Container, Heading, Text, Button, Stack, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import ParticleBackground from './ParticleBackground';

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
      {/* Gradient Background */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="linear-gradient(45deg, rgba(0,0,0,0.95) 0%, rgba(0,198,224,0.1) 100%)"
        pointerEvents="none"
      />

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
                >
                  Learn More
                </Button>
              </Stack>
            </MotionBox>
          </VStack>

          {/* Right Side - Placeholder for image/animation */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            w={{ base: 'full', lg: '50%' }}
            display={{ base: 'none', lg: 'block' }}
          >
            <Box
              w="full"
              h="500px"
              bg="rgba(255,255,255,0.1)"
              borderRadius="2xl"
              position="relative"
              overflow="hidden"
              boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(255,255,255,0.18)"
            >
              {/* You can add a trading chart or platform preview here */}
            </Box>
          </MotionBox>
        </Stack>
      </Container>
    </Box>
  );
};

export default Hero;