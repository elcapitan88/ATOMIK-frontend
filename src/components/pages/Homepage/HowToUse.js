import React from 'react';
import { Box, Container, Heading, Text, VStack, HStack, Flex, Circle, useBreakpointValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const StepCard = ({ title, description, number }) => (
  <MotionFlex
    whileHover={{ y: -5 }}
    direction="column"
    position="relative"
    zIndex={2}
    h="full"
  >
    {/* Card content */}
    <Box
      p={6}
      pt={8}
      bg="rgba(255, 255, 255, 0.1)"
      backdropFilter="blur(10px)"
      borderRadius="xl"
      border="1px solid rgba(255, 255, 255, 0.18)"
      transition="all 0.3s"
      role="group"
      h="full"
      boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.2)"
      _hover={{
        boxShadow: "0 8px 32px 0 rgba(0, 198, 224, 0.1)",
        borderColor: "rgba(0, 198, 224, 0.3)"
      }}
    >
      <VStack spacing={4} align="flex-start" h="full">
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          w="36px"
          h="36px"
          fontSize="lg"
          fontWeight="bold"
          color="rgba(0, 198, 224, 1)"
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            inset: '0',
            borderRadius: 'full',
            padding: '1px',
            background: 'linear-gradient(to right, rgba(0, 198, 224, 1), rgba(0, 198, 224, 0.6))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            boxShadow: '0 0 20px 2px rgba(0, 198, 224, 0.3)',
            opacity: 0.9,
          }}
          _after={{
            content: '""',
            position: 'absolute',
            inset: '-2px',
            borderRadius: 'full',
            background: 'transparent',
            boxShadow: '0 0 10px 2px rgba(0, 198, 224, 0.15)',
            filter: 'blur(3px)',
            opacity: 0.6,
          }}
        >
          {number}
        </Box>
        <Heading size="md" color="white">
          {title}
        </Heading>
        <Text color="whiteAlpha.800" fontSize="sm">
          {description}
        </Text>
      </VStack>
    </Box>
  </MotionFlex>
);

const ProcessPath = () => {
  const display = useBreakpointValue({ base: 'none', lg: 'block' });
  
  return (
    <Box 
      position="absolute" 
      top="50%" 
      left="0"
      right="0"
      height="2px"
      bg="rgba(0, 198, 224, 0.3)"
      transform="translateY(-50%)"
      display={display}
    />
  );
};

const HowToUse = () => {
  const steps = [
    {
      title: 'Create or Subscribe',
      description: 'Generate custom signals or subscribe to proven strategies. All webhooks are secured with enterprise-grade encryption.',
    },
    {
      title: 'Connect Broker',
      description: 'Link your preferred broker account seamlessly. We handle authentication and maintain secure connections.',
    },
    {
      title: 'Configure Strategy',
      description: 'Set up your trading parameters, risk management rules, and customize automation preferences.',
    },
    {
      title: 'Start Trading',
      description: 'Your strategy is now live! Monitor performance and receive real-time notifications from your dashboard.',
    },
  ];

  const columns = useBreakpointValue({ base: 1, md: 2, lg: 4 });

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
        <VStack spacing={16}>
          {/* Section Title */}
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

          {/* Process Flow */}
          <Box w="full" position="relative">
            {/* Connecting Line */}
            <ProcessPath />
            
            {/* Step Cards */}
            <Flex 
              direction={{ base: 'column', md: columns === 2 ? 'row' : 'column', lg: 'row' }}
              wrap={{ md: columns === 2 ? 'wrap' : 'nowrap', lg: 'nowrap' }}
              justify="space-between"
              align="stretch"
              gap={{ base: 10, md: 6, lg: 4 }}
              position="relative"
            >
              {steps.map((step, index) => (
                <Box 
                  key={step.title} 
                  flex="1" 
                  position="relative"
                  pb={columns === 2 && index < 2 ? { md: 10, lg: 0 } : 0}
                >
                  <MotionBox
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    h="full"
                  >
                    <StepCard {...step} number={index + 1} />
                  </MotionBox>
                </Box>
              ))}
            </Flex>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default HowToUse;