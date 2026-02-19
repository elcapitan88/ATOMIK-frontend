import React, { useState, useEffect, useCallback } from 'react';
import { Box, Container, Heading, Text, VStack, HStack, Icon, Stack, List, ListItem, ListIcon } from '@chakra-ui/react';
import { Shield, Lock, KeyRound, Activity, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const trustPillars = [
  {
    icon: Shield,
    label: 'Non-Custodial',
    title: 'Your Funds Never Leave Your Broker',
    description: 'We connect to your broker via read and trade API access only. You can revoke permissions at any time. We never have withdrawal access to your accounts.',
    points: [
      'Funds remain in your broker account at all times',
      'Read and trade API access only — no withdrawal permissions',
      'Revoke access instantly from your broker settings',
      'You stay in full control of your capital'
    ]
  },
  {
    icon: Lock,
    label: 'Encrypted',
    title: 'Data Protected at Every Layer',
    description: 'All connections use TLS encryption in transit. API keys are stored with AES-256 encryption at rest. Your broker credentials are never stored on our servers.',
    points: [
      'TLS encryption for all data in transit',
      'AES-256 encryption for stored API keys',
      'Secure webhook endpoints with validation',
      'Broker credentials never stored'
    ]
  },
  {
    icon: KeyRound,
    label: '2FA Protected',
    title: 'Multi-Layer Access Protection',
    description: 'Every account is protected with two-factor authentication, secure session management, and real-time activity monitoring.',
    points: [
      'Two-factor authentication on every account',
      'Secure session management with auto-expiry',
      'API key authentication for all connections',
      'Account activity monitoring and alerts'
    ]
  },
  {
    icon: Activity,
    label: 'Reliable',
    title: 'Built for Uptime',
    description: 'Real-time system monitoring, automated failsafes, and redundant infrastructure keep your automations running. Check our live status page anytime.',
    points: [
      'Real-time system health monitoring',
      'Automated failsafes and error handling',
      'Redundant infrastructure',
      'Live status page available 24/7'
    ]
  }
];

const TrustSecurity = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % trustPillars.length);
  }, []);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goToNext, 5000);
    return () => clearInterval(timer);
  }, [isPaused, goToNext]);

  const activePillar = trustPillars[activeIndex];

  return (
    <Box
      id="security"
      py={{ base: 16, md: 24 }}
      bg="black"
      position="relative"
      overflow="hidden"
    >
      {/* Background */}
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(180deg, transparent 0%, rgba(0,198,224,0.03) 50%, transparent 100%)"
        pointerEvents="none"
      />

      <Container maxW="7xl" px={{ base: 4, md: 8 }}>
        <VStack spacing={{ base: 10, md: 14 }}>
          {/* Section Header */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <VStack spacing={4} textAlign="center" maxW="800px">
              <Heading
                as="h2"
                size={{ base: "xl", md: "2xl" }}
                color="white"
                fontWeight="bold"
                fontFamily="'Satoshi', sans-serif"
              >
                Built on Trust &
                <Text
                  as="span"
                  bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                  bgClip="text"
                  px={2}
                >
                  Transparency
                </Text>
              </Heading>
              <Text color="whiteAlpha.600" fontSize={{ base: "md", md: "lg" }}>
                We never hold your funds or store your broker credentials. You stay in full control.
              </Text>
            </VStack>
          </MotionBox>

          {/* Interactive Tabbed Showcase */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            w="full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <Stack
              direction={{ base: 'column', lg: 'row' }}
              spacing={{ base: 6, lg: 0 }}
              w="full"
              bg="rgba(255, 255, 255, 0.02)"
              borderRadius="2xl"
              border="1px solid rgba(255, 255, 255, 0.06)"
              overflow="hidden"
            >
              {/* Left: Tab Navigation */}
              <VStack
                spacing={0}
                align="stretch"
                w={{ base: 'full', lg: '280px' }}
                flexShrink={0}
                bg="rgba(0, 0, 0, 0.3)"
                display={{ base: 'none', lg: 'flex' }}
              >
                {trustPillars.map((pillar, index) => (
                  <Box
                    key={pillar.label}
                    as="button"
                    onClick={() => setActiveIndex(index)}
                    px={6}
                    py={5}
                    textAlign="left"
                    position="relative"
                    bg={index === activeIndex ? 'rgba(0, 198, 224, 0.05)' : 'transparent'}
                    borderLeft="3px solid"
                    borderLeftColor={index === activeIndex ? 'rgba(0, 198, 224, 1)' : 'transparent'}
                    transition="all 0.3s"
                    cursor="pointer"
                    _hover={{
                      bg: 'rgba(0, 198, 224, 0.03)',
                    }}
                  >
                    <HStack spacing={3}>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg={index === activeIndex ? 'rgba(0, 198, 224, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
                        color={index === activeIndex ? 'rgba(0, 198, 224, 1)' : 'whiteAlpha.500'}
                        transition="all 0.3s"
                      >
                        <Icon as={pillar.icon} boxSize={5} />
                      </Box>
                      <Text
                        color={index === activeIndex ? 'white' : 'whiteAlpha.600'}
                        fontWeight={index === activeIndex ? '600' : '400'}
                        fontSize="sm"
                        transition="all 0.3s"
                      >
                        {pillar.label}
                      </Text>
                    </HStack>

                    {/* Active indicator glow */}
                    {index === activeIndex && (
                      <Box
                        position="absolute"
                        left="0"
                        top="50%"
                        transform="translateY(-50%)"
                        w="3px"
                        h="60%"
                        bg="rgba(0, 198, 224, 1)"
                        boxShadow="0 0 10px rgba(0, 198, 224, 0.5)"
                        borderRadius="full"
                      />
                    )}
                  </Box>
                ))}
              </VStack>

              {/* Mobile: Horizontal pill navigation */}
              <HStack
                spacing={2}
                px={4}
                pt={4}
                pb={2}
                display={{ base: 'flex', lg: 'none' }}
                overflowX="auto"
                sx={{
                  '&::-webkit-scrollbar': { display: 'none' },
                  scrollbarWidth: 'none',
                }}
              >
                {trustPillars.map((pillar, index) => (
                  <Box
                    key={pillar.label}
                    as="button"
                    onClick={() => setActiveIndex(index)}
                    px={4}
                    py={2}
                    borderRadius="full"
                    bg={index === activeIndex ? 'rgba(0, 198, 224, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
                    border="1px solid"
                    borderColor={index === activeIndex ? 'rgba(0, 198, 224, 0.4)' : 'rgba(255, 255, 255, 0.1)'}
                    color={index === activeIndex ? 'rgba(0, 198, 224, 1)' : 'whiteAlpha.500'}
                    fontSize="sm"
                    fontWeight={index === activeIndex ? '600' : '400'}
                    whiteSpace="nowrap"
                    flexShrink={0}
                    transition="all 0.3s"
                    cursor="pointer"
                    _hover={{
                      bg: 'rgba(0, 198, 224, 0.1)',
                      borderColor: 'rgba(0, 198, 224, 0.3)',
                    }}
                  >
                    {pillar.label}
                  </Box>
                ))}
              </HStack>

              {/* Right: Content Panel */}
              <Box
                flex="1"
                p={{ base: 6, md: 10 }}
                position="relative"
                minH={{ base: "auto", lg: "320px" }}
              >
                <AnimatePresence mode="wait">
                  <MotionBox
                    key={activeIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                  >
                    <VStack spacing={6} align="flex-start">
                      {/* Icon + Title */}
                      <HStack spacing={4} align="center">
                        <Box
                          p={3}
                          borderRadius="xl"
                          bg="rgba(0, 198, 224, 0.1)"
                          color="rgba(0, 198, 224, 1)"
                          boxShadow="0 0 20px rgba(0, 198, 224, 0.15)"
                        >
                          <Icon as={activePillar.icon} boxSize={7} />
                        </Box>
                        <Heading
                          as="h3"
                          size={{ base: "md", md: "lg" }}
                          color="white"
                          fontFamily="'Satoshi', sans-serif"
                          fontWeight="600"
                        >
                          {activePillar.title}
                        </Heading>
                      </HStack>

                      {/* Description */}
                      <Text
                        color="whiteAlpha.800"
                        fontSize={{ base: "sm", md: "md" }}
                        lineHeight="1.7"
                        maxW="600px"
                      >
                        {activePillar.description}
                      </Text>

                      {/* Proof Points */}
                      <List spacing={3} pt={1}>
                        {activePillar.points.map((point) => (
                          <ListItem
                            key={point}
                            display="flex"
                            alignItems="center"
                            color="whiteAlpha.900"
                            fontSize="sm"
                          >
                            <ListIcon
                              as={CheckCircle}
                              color="rgba(0, 198, 224, 0.8)"
                              boxSize={4}
                            />
                            {point}
                          </ListItem>
                        ))}
                      </List>
                    </VStack>
                  </MotionBox>
                </AnimatePresence>

                {/* Progress bar for auto-rotation */}
                <Box
                  position="absolute"
                  bottom="0"
                  left="0"
                  right="0"
                  h="2px"
                  bg="rgba(255, 255, 255, 0.05)"
                >
                  <Box
                    h="full"
                    bg="rgba(0, 198, 224, 0.4)"
                    borderRadius="full"
                    sx={!isPaused ? {
                      animation: 'progressFill 5s linear infinite',
                      '@keyframes progressFill': {
                        '0%': { width: '0%' },
                        '100%': { width: '100%' },
                      },
                    } : {}}
                    transition="width 0.3s"
                  />
                </Box>
              </Box>
            </Stack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
};

export default TrustSecurity;
