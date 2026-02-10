import React from 'react';
import { Box, Container, Heading, Text, VStack, HStack, Flex, Circle, useBreakpointValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

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
      title: 'Connect Your Broker Account',
      description: 'Link your trading account in minutes. Works with any broker, including prop firms. No coding or technical setup required.',
    },
    {
      title: 'Set Up TradingView Alerts',
      description: 'Connect your favorite TradingView strategies. Our simple webhook setup turns any alert into automated trades.',
    },
    {
      title: 'Automate Your Trading Strategy',
      description: 'Configure position sizing, risk management, and automation rules with our beginner-friendly interface.',
    },
    {
      title: 'Monitor Performance & Scale',
      description: 'Watch your automated trading in real-time. Track performance, copy successful strategies, and scale your profits.',
    },
  ];

  const columns = useBreakpointValue({ base: 1, md: 2, lg: 4 });

  return (
    <>
      <Helmet>
        {/* HowTo Structured Data */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "HowTo",
              "name": "How to Automate Your Trading with TradingView Alerts",
              "description": "Complete step-by-step guide to automate your trading by connecting TradingView alerts to your broker. Perfect for beginners, no programming required.",
              "image": {
                "@type": "ImageObject",
                "url": "https://atomiktrading.io/images/dashboard.png",
                "caption": "Atomik Trading dashboard showing automated trading setup"
              },
              "totalTime": "PT30M",
              "estimatedCost": {
                "@type": "MonetaryAmount",
                "currency": "USD",
                "value": "0"
              },
              "supply": [
                {
                  "@type": "HowToSupply",
                  "name": "TradingView Account",
                  "description": "Pro, Pro+, or Premium subscription required for webhook alerts"
                },
                {
                  "@type": "HowToSupply", 
                  "name": "Broker Account",
                  "description": "Supported broker with API access (Interactive Brokers, Tradovate, etc.)"
                },
                {
                  "@type": "HowToSupply",
                  "name": "Atomik Trading Account",
                  "description": "Free account to connect TradingView alerts to your broker"
                }
              ],
              "tool": [
                {
                  "@type": "HowToTool",
                  "name": "Computer or Mobile Device",
                  "description": "Any device with internet browser access"
                },
                {
                  "@type": "HowToTool",
                  "name": "Internet Connection",
                  "description": "Stable internet connection for real-time trading"
                }
              ],
              "step": [
                {
                  "@type": "HowToStep",
                  "position": 1,
                  "name": "Connect Your Broker Account",
                  "text": "Link your trading account in minutes. Works with any broker, including prop firms. No coding or technical setup required.",
                  "url": "https://atomiktrading.io#how-to-use",
                  "image": {
                    "@type": "ImageObject",
                    "url": "https://atomiktrading.io/images/dashboard.png",
                    "caption": "Broker connection interface"
                  }
                },
                {
                  "@type": "HowToStep",
                  "position": 2,
                  "name": "Set Up TradingView Alerts",
                  "text": "Connect your favorite TradingView strategies. Our simple webhook setup turns any alert into automated trades.",
                  "url": "https://atomiktrading.io#how-to-use",
                  "image": {
                    "@type": "ImageObject",
                    "url": "https://atomiktrading.io/images/dashboard.png",
                    "caption": "TradingView alert configuration"
                  }
                },
                {
                  "@type": "HowToStep",
                  "position": 3,
                  "name": "Automate Your Trading Strategy",
                  "text": "Configure position sizing, risk management, and automation rules with our beginner-friendly interface.",
                  "url": "https://atomiktrading.io#how-to-use",
                  "image": {
                    "@type": "ImageObject",
                    "url": "https://atomiktrading.io/images/dashboard.png",
                    "caption": "Strategy automation settings"
                  }
                },
                {
                  "@type": "HowToStep",
                  "position": 4,
                  "name": "Monitor Performance & Scale",
                  "text": "Watch your automated trading in real-time. Track performance, copy successful strategies, and scale your profits.",
                  "url": "https://atomiktrading.io#how-to-use",
                  "image": {
                    "@type": "ImageObject",
                    "url": "https://atomiktrading.io/images/dashboard.png",
                    "caption": "Performance monitoring dashboard"
                  }
                }
              ],
              "about": {
                "@type": "Thing",
                "name": "Automated Trading for Beginners"
              },
              "keywords": ["automated trading", "TradingView alerts", "trading automation", "beginner trading", "no code automation"],
              "author": {
                "@type": "Organization",
                "name": "Atomik Trading",
                "url": "https://atomiktrading.io"
              }
            }
          `}
        </script>
      </Helmet>
      
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
              How to Automate Your Trading in
              <Text
                as="span"
                bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                bgClip="text"
                px={2}
              >
                4 Easy Steps
              </Text>
            </Heading>
            <Text color="whiteAlpha.800" fontSize="lg">
              Perfect for beginners - no programming skills needed. Start automating your TradingView alerts today.
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
    </>
  );
};

export default HowToUse;