import React from 'react';
import { Box, Container, Heading, Text, VStack, HStack, Icon, Divider, SimpleGrid } from '@chakra-ui/react';
import { ArrowRight, Webhook, Link, Zap, Binary } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const StepCard = ({ icon, title, description, isLast }) => (
  <VStack align="stretch" spacing={0} position="relative">
    <MotionBox
      whileHover={{ y: -5 }}
      p={6}
      bg="rgba(255, 255, 255, 0.1)"
      backdropFilter="blur(10px)"
      borderRadius="xl"
      border="1px solid rgba(255, 255, 255, 0.18)"
      transition="all 0.3s"
      role="group"
      position="relative"
      zIndex={2}
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
    
    {!isLast && (
      <HStack 
        position="absolute" 
        right="-30px" 
        top="50%" 
        transform="translateY(-50%)"
        zIndex={1}
        spacing={1}
        display={{ base: 'none', md: 'flex' }}
      >
        <Icon as={ArrowRight} boxSize={5} color="rgba(0, 198, 224, 0.6)" />
      </HStack>
    )}
  </VStack>
);

const HowToUse = () => {
  const steps = [
    {
      icon: Webhook,
      title: 'Create Webhook',
      description: 'Generate a unique webhook URL for your trading strategy. Each webhook is secured with a secret key.',
    },
    {
      icon: Link,
      title: 'Connect Broker',
      description: 'Link your preferred broker account. We handle the authentication and maintain secure connections.',
    },
    {
      icon: Binary,
      title: 'Configure Strategy',
      description: 'Set up your trading parameters, risk management rules, and automation preferences.',
    },
    {
      icon: Zap,
      title: 'Start Trading',
      description: 'Your strategy is now live! Receive real-time notifications and monitor performance from your dashboard.',
    },
  ];

  return (
    <Box
      id="how-to-use"
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
        bg="radial-gradient(circle at 50% 50%, rgba(0,198,224,0.05) 0%, rgba(0,0,0,0) 50%)"
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
              Start Trading in
              <Text
                as="span"
                bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                bgClip="text"
                px={2}
              >
                Minutes
              </Text>
            </Heading>
            <Text color="whiteAlpha.800" fontSize="lg">
              Follow these simple steps to automate your trading strategy
            </Text>
          </VStack>

          <Box w="full">
            <SimpleGrid
              columns={{ base: 1, md: 4 }}
              spacing={{ base: 8, md: 12 }}
              w="full"
            >
              {steps.map((step, index) => (
                <MotionBox
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <StepCard {...step} isLast={index === steps.length - 1} />
                </MotionBox>
              ))}
            </SimpleGrid>
          </Box>

          {/* Mobile Step Indicators */}
          <VStack spacing={4} display={{ base: 'flex', md: 'none' }}>
            {steps.map((_, index) => (
              <Box
                key={index}
                h="20px"
                w="2px"
                bg={index === steps.length - 1 ? 'transparent' : 'rgba(0, 198, 224, 0.6)'}
              />
            ))}
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default HowToUse;