import React from 'react';
import { Box, Container, Grid, GridItem, Heading, Text, VStack, HStack, Icon, Tag } from '@chakra-ui/react';
import { Shield, DollarSign, Webhook, Layers, Store, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const Features = () => {
  return (
    <Box
      as="section"
      id="features"
      py={{ base: 16, md: 24 }}
      bg="black"
      position="relative"
      overflow="hidden"
      aria-label="Features section - Why choose Atomik"
    >
      {/* Background */}
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(180deg, rgba(0,198,224,0.03) 0%, transparent 50%)"
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
              <Text color="whiteAlpha.700" fontSize={{ base: "md", md: "lg" }}>
                Everything you need to automate — nothing you don't
              </Text>
            </VStack>
          </MotionBox>

          {/* Bento Grid */}
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
            gap={6}
            w="full"
          >
            {/* ═══════════════════════════════════════════ */}
            {/* ROW 1: Two hero cards                       */}
            {/* ═══════════════════════════════════════════ */}

            {/* Non-Custodial — spans 2 columns */}
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <MotionBox
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                h="full"
              >
                <Box
                  p={{ base: 6, md: 8 }}
                  bg="rgba(255, 255, 255, 0.03)"
                  backdropFilter="blur(10px)"
                  borderRadius="2xl"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  h="full"
                  position="relative"
                  overflow="hidden"
                  role="group"
                  transition="all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                  _hover={{
                    border: '1px solid rgba(0, 198, 224, 0.3)',
                    bg: 'rgba(0, 198, 224, 0.03)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 30px -5px rgba(0, 198, 224, 0.15)',
                  }}
                >
                  {/* Corner glow on hover */}
                  <Box
                    position="absolute"
                    top="-20px"
                    right="-20px"
                    w="120px"
                    h="120px"
                    bgGradient="radial(circle, rgba(0,198,224,0.06) 0%, transparent 70%)"
                    filter="blur(20px)"
                    pointerEvents="none"
                    opacity={0}
                    transition="opacity 0.4s"
                    _groupHover={{ opacity: 1 }}
                  />

                  <VStack spacing={4} align="flex-start">
                    <HStack spacing={4}>
                      <Box
                        p={3}
                        bg="rgba(0, 198, 224, 0.1)"
                        borderRadius="xl"
                        color="rgba(0, 198, 224, 1)"
                        transition="all 0.4s"
                        _groupHover={{
                          bg: 'rgba(0, 198, 224, 0.15)',
                          boxShadow: '0 0 20px rgba(0, 198, 224, 0.2)',
                          transform: 'scale(1.1)',
                        }}
                      >
                        <Icon as={Shield} boxSize={7} />
                      </Box>
                      <Tag
                        size="sm"
                        bg="rgba(0, 198, 224, 0.1)"
                        color="rgba(0, 198, 224, 1)"
                        border="1px solid rgba(0, 198, 224, 0.2)"
                        fontWeight="500"
                        fontSize="xs"
                      >
                        Key Differentiator
                      </Tag>
                    </HStack>

                    <Heading
                      as="h3"
                      size="lg"
                      color="white"
                      fontFamily="'Satoshi', sans-serif"
                      fontWeight="600"
                    >
                      Your Funds, Your Control
                    </Heading>
                    <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.7">
                      Your funds never leave your broker account. We connect via read/trade API access you can revoke anytime — no withdrawal access, ever. You stay in full control.
                    </Text>
                  </VStack>
                </Box>
              </MotionBox>
            </GridItem>

            {/* Zero Per-Trade Fees — 1 column */}
            <GridItem colSpan={1}>
              <MotionBox
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
                h="full"
              >
                <Box
                  p={{ base: 6, md: 8 }}
                  bg="rgba(255, 255, 255, 0.03)"
                  backdropFilter="blur(10px)"
                  borderRadius="2xl"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  h="full"
                  position="relative"
                  overflow="hidden"
                  role="group"
                  transition="all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                  _hover={{
                    border: '1px solid rgba(0, 198, 224, 0.3)',
                    bg: 'rgba(0, 198, 224, 0.03)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 30px -5px rgba(0, 198, 224, 0.15)',
                  }}
                >
                  <Box
                    position="absolute"
                    top="-20px"
                    right="-20px"
                    w="100px"
                    h="100px"
                    bgGradient="radial(circle, rgba(0,198,224,0.06) 0%, transparent 70%)"
                    filter="blur(20px)"
                    pointerEvents="none"
                    opacity={0}
                    transition="opacity 0.4s"
                    _groupHover={{ opacity: 1 }}
                  />

                  <VStack spacing={4} align="flex-start">
                    <Box
                      p={3}
                      bg="rgba(0, 198, 224, 0.1)"
                      borderRadius="xl"
                      color="rgba(0, 198, 224, 1)"
                      transition="all 0.4s"
                      _groupHover={{
                        bg: 'rgba(0, 198, 224, 0.15)',
                        boxShadow: '0 0 20px rgba(0, 198, 224, 0.2)',
                        transform: 'scale(1.1)',
                      }}
                    >
                      <Icon as={DollarSign} boxSize={7} />
                    </Box>

                    <Heading
                      as="h3"
                      size="lg"
                      color="white"
                      fontFamily="'Satoshi', sans-serif"
                      fontWeight="600"
                    >
                      Zero Per-Trade Fees
                    </Heading>
                    <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.7">
                      One flat monthly price. No per-execution fees, no hidden costs. Automate unlimited trades across all your accounts.
                    </Text>
                  </VStack>
                </Box>
              </MotionBox>
            </GridItem>

            {/* ═══════════════════════════════════════════ */}
            {/* ROW 2: Three standard cards                 */}
            {/* ═══════════════════════════════════════════ */}

            {/* Multi-Account Control */}
            <GridItem colSpan={1}>
              <MotionBox
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.15 }}
                h="full"
              >
                <Box
                  p={6}
                  bg="rgba(255, 255, 255, 0.03)"
                  backdropFilter="blur(10px)"
                  borderRadius="xl"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  h="full"
                  role="group"
                  transition="all 0.3s"
                  _hover={{
                    border: '1px solid rgba(0, 198, 224, 0.3)',
                    bg: 'rgba(0, 198, 224, 0.03)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px -5px rgba(0, 198, 224, 0.12)',
                  }}
                >
                  <VStack spacing={4} align="flex-start">
                    <Box
                      p={2.5}
                      bg="rgba(0, 198, 224, 0.1)"
                      borderRadius="lg"
                      color="rgba(0, 198, 224, 1)"
                      transition="all 0.3s"
                      _groupHover={{
                        bg: 'rgba(0, 198, 224, 0.15)',
                        boxShadow: '0 0 15px rgba(0, 198, 224, 0.15)',
                      }}
                    >
                      <Icon as={Layers} boxSize={6} />
                    </Box>
                    <Heading as="h3" size="md" color="white" fontWeight="600">
                      Multi-Account Control
                    </Heading>
                    <Text color="whiteAlpha.800" fontSize="sm" lineHeight="1.7">
                      Run strategies across multiple accounts simultaneously. One dashboard for all your funded and personal accounts.
                    </Text>
                  </VStack>
                </Box>
              </MotionBox>
            </GridItem>

            {/* Strategy Marketplace */}
            <GridItem colSpan={1}>
              <MotionBox
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.25 }}
                h="full"
              >
                <Box
                  p={6}
                  bg="rgba(255, 255, 255, 0.03)"
                  backdropFilter="blur(10px)"
                  borderRadius="xl"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  h="full"
                  role="group"
                  transition="all 0.3s"
                  _hover={{
                    border: '1px solid rgba(0, 198, 224, 0.3)',
                    bg: 'rgba(0, 198, 224, 0.03)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px -5px rgba(0, 198, 224, 0.12)',
                  }}
                >
                  <VStack spacing={4} align="flex-start">
                    <Box
                      p={2.5}
                      bg="rgba(0, 198, 224, 0.1)"
                      borderRadius="lg"
                      color="rgba(0, 198, 224, 1)"
                      transition="all 0.3s"
                      _groupHover={{
                        bg: 'rgba(0, 198, 224, 0.15)',
                        boxShadow: '0 0 15px rgba(0, 198, 224, 0.15)',
                      }}
                    >
                      <Icon as={Store} boxSize={6} />
                    </Box>
                    <Heading as="h3" size="md" color="white" fontWeight="600">
                      Strategy Marketplace
                    </Heading>
                    <Text color="whiteAlpha.800" fontSize="sm" lineHeight="1.7">
                      Browse strategies from experienced traders. Subscribe with one click and start automating.
                    </Text>
                  </VStack>
                </Box>
              </MotionBox>
            </GridItem>

            {/* Any Signal Source */}
            <GridItem colSpan={1}>
              <MotionBox
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.35 }}
                h="full"
              >
                <Box
                  p={6}
                  bg="rgba(255, 255, 255, 0.03)"
                  backdropFilter="blur(10px)"
                  borderRadius="xl"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  h="full"
                  role="group"
                  transition="all 0.3s"
                  _hover={{
                    border: '1px solid rgba(0, 198, 224, 0.3)',
                    bg: 'rgba(0, 198, 224, 0.03)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px -5px rgba(0, 198, 224, 0.12)',
                  }}
                >
                  <VStack spacing={4} align="flex-start">
                    <Box
                      p={2.5}
                      bg="rgba(0, 198, 224, 0.1)"
                      borderRadius="lg"
                      color="rgba(0, 198, 224, 1)"
                      transition="all 0.3s"
                      _groupHover={{
                        bg: 'rgba(0, 198, 224, 0.15)',
                        boxShadow: '0 0 15px rgba(0, 198, 224, 0.15)',
                      }}
                    >
                      <Icon as={Webhook} boxSize={6} />
                    </Box>
                    <Heading as="h3" size="md" color="white" fontWeight="600">
                      Any Signal Source
                    </Heading>
                    <Text color="whiteAlpha.800" fontSize="sm" lineHeight="1.7">
                      TradingView alerts, custom webhooks, or any API. Connect whatever signal source you already use.
                    </Text>
                  </VStack>
                </Box>
              </MotionBox>
            </GridItem>

            {/* ═══════════════════════════════════════════ */}
            {/* ROW 3: Full-width prop firm card            */}
            {/* ═══════════════════════════════════════════ */}

            <GridItem colSpan={{ base: 1, md: 3 }}>
              <MotionBox
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Box
                  p={{ base: 6, md: 8 }}
                  bg="rgba(255, 255, 255, 0.03)"
                  backdropFilter="blur(10px)"
                  borderRadius="2xl"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  position="relative"
                  overflow="hidden"
                  role="group"
                  transition="all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                  _hover={{
                    border: '1px solid rgba(0, 198, 224, 0.3)',
                    bg: 'rgba(0, 198, 224, 0.03)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 30px -5px rgba(0, 198, 224, 0.15)',
                  }}
                >
                  {/* Corner glow on hover */}
                  <Box
                    position="absolute"
                    top="-20px"
                    right="-20px"
                    w="150px"
                    h="150px"
                    bgGradient="radial(circle, rgba(0,198,224,0.05) 0%, transparent 70%)"
                    filter="blur(25px)"
                    pointerEvents="none"
                    opacity={0}
                    transition="opacity 0.4s"
                    _groupHover={{ opacity: 1 }}
                  />

                  <HStack
                    spacing={{ base: 4, md: 8 }}
                    align="flex-start"
                    flexDirection={{ base: 'column', md: 'row' }}
                  >
                    <Box
                      p={3}
                      bg="rgba(0, 198, 224, 0.1)"
                      borderRadius="xl"
                      color="rgba(0, 198, 224, 1)"
                      transition="all 0.4s"
                      flexShrink={0}
                      _groupHover={{
                        bg: 'rgba(0, 198, 224, 0.15)',
                        boxShadow: '0 0 20px rgba(0, 198, 224, 0.2)',
                        transform: 'scale(1.1)',
                      }}
                    >
                      <Icon as={TrendingUp} boxSize={7} />
                    </Box>

                    <VStack spacing={3} align="flex-start" flex="1">
                      <Heading
                        as="h3"
                        size="lg"
                        color="white"
                        fontFamily="'Satoshi', sans-serif"
                        fontWeight="600"
                      >
                        Built for Prop Firms
                      </Heading>
                      <Text
                        color="whiteAlpha.800"
                        fontSize="md"
                        lineHeight="1.7"
                        maxW="700px"
                      >
                        Automate funded accounts from Apex and other prop firms. Manage multiple evaluations and funded accounts from a single dashboard with full control.
                      </Text>
                      <HStack spacing={2} flexWrap="wrap" pt={1}>
                        {['Apex', 'Tradovate', 'NinjaTrader', 'Binance'].map(tag => (
                          <Tag
                            key={tag}
                            size="sm"
                            bg="rgba(0, 198, 224, 0.08)"
                            color="rgba(0, 198, 224, 0.8)"
                            border="1px solid rgba(0, 198, 224, 0.15)"
                            fontSize="xs"
                          >
                            {tag}
                          </Tag>
                        ))}
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              </MotionBox>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
};

export default Features;
