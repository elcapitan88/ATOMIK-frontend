import React, { useEffect, useRef, useState } from 'react';
import { Box, Container, Heading, Text, VStack, HStack, Icon, Flex, useBreakpointValue } from '@chakra-ui/react';
import { Radio, Zap, Landmark, CheckCircle } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { keyframes } from '@emotion/react';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

// ── Trail-expand keyframes ──────────────────────────────────────────
// Each trail expands during its slot and STAYS illuminated until the
// entire cycle resets at 100%.  Total cycle: 6s.

// Trail 1: expands 0 → 28%, stays lit until fade at 96-100%
const trailExpandH1 = keyframes`
  0%           { width: 0%;   opacity: 0; }
  2%           { width: 0%;   opacity: 1; }
  25%          { width: 95%;  opacity: 1; }
  28%          { width: 100%; opacity: 1; }
  96%          { width: 100%; opacity: 1; }
  100%         { width: 100%; opacity: 0; }
`;

// Trail 2: expands 33 → 61%, stays lit
const trailExpandH2 = keyframes`
  0%, 33%      { width: 0%;   opacity: 0; }
  35%          { width: 0%;   opacity: 1; }
  58%          { width: 95%;  opacity: 1; }
  61%          { width: 100%; opacity: 1; }
  96%          { width: 100%; opacity: 1; }
  100%         { width: 100%; opacity: 0; }
`;

// Trail 3: expands 66 → 94%, stays lit briefly
const trailExpandH3 = keyframes`
  0%, 66%      { width: 0%;   opacity: 0; }
  68%          { width: 0%;   opacity: 1; }
  91%          { width: 95%;  opacity: 1; }
  94%          { width: 100%; opacity: 1; }
  96%          { width: 100%; opacity: 1; }
  100%         { width: 100%; opacity: 0; }
`;

// ── Arrowhead position keyframes ────────────────────────────────────
// Arrowhead travels with the leading edge, then disappears on arrival.

const arrowTipH1 = keyframes`
  0%           { left: 0%;   opacity: 0; }
  2%           { left: 0%;   opacity: 1; }
  25%          { left: 95%;  opacity: 1; }
  28%          { left: 100%; opacity: 1; }
  30%          { left: 100%; opacity: 0; }
  30.1%, 100%  { left: 0%;   opacity: 0; }
`;

const arrowTipH2 = keyframes`
  0%, 33%      { left: 0%;   opacity: 0; }
  35%          { left: 0%;   opacity: 1; }
  58%          { left: 95%;  opacity: 1; }
  61%          { left: 100%; opacity: 1; }
  63%          { left: 100%; opacity: 0; }
  63.1%, 100%  { left: 0%;   opacity: 0; }
`;

const arrowTipH3 = keyframes`
  0%, 66%      { left: 0%;   opacity: 0; }
  68%          { left: 0%;   opacity: 1; }
  91%          { left: 95%;  opacity: 1; }
  94%          { left: 100%; opacity: 1; }
  96%          { left: 100%; opacity: 0; }
  96.1%, 100%  { left: 0%;   opacity: 0; }
`;

// ── Vertical versions (mobile) ──────────────────────────────────────

const trailExpandV1 = keyframes`
  0%           { height: 0%;   opacity: 0; }
  2%           { height: 0%;   opacity: 1; }
  25%          { height: 95%;  opacity: 1; }
  28%          { height: 100%; opacity: 1; }
  96%          { height: 100%; opacity: 1; }
  100%         { height: 100%; opacity: 0; }
`;

const trailExpandV2 = keyframes`
  0%, 33%      { height: 0%;   opacity: 0; }
  35%          { height: 0%;   opacity: 1; }
  58%          { height: 95%;  opacity: 1; }
  61%          { height: 100%; opacity: 1; }
  96%          { height: 100%; opacity: 1; }
  100%         { height: 100%; opacity: 0; }
`;

const trailExpandV3 = keyframes`
  0%, 66%      { height: 0%;   opacity: 0; }
  68%          { height: 0%;   opacity: 1; }
  91%          { height: 95%;  opacity: 1; }
  94%          { height: 100%; opacity: 1; }
  96%          { height: 100%; opacity: 1; }
  100%         { height: 100%; opacity: 0; }
`;

const arrowTipV1 = keyframes`
  0%           { top: 0%;   opacity: 0; }
  2%           { top: 0%;   opacity: 1; }
  25%          { top: 95%;  opacity: 1; }
  28%          { top: 100%; opacity: 1; }
  30%          { top: 100%; opacity: 0; }
  30.1%, 100%  { top: 0%;   opacity: 0; }
`;

const arrowTipV2 = keyframes`
  0%, 33%      { top: 0%;   opacity: 0; }
  35%          { top: 0%;   opacity: 1; }
  58%          { top: 95%;  opacity: 1; }
  61%          { top: 100%; opacity: 1; }
  63%          { top: 100%; opacity: 0; }
  63.1%, 100%  { top: 0%;   opacity: 0; }
`;

const arrowTipV3 = keyframes`
  0%, 66%      { top: 0%;   opacity: 0; }
  68%          { top: 0%;   opacity: 1; }
  91%          { top: 95%;  opacity: 1; }
  94%          { top: 100%; opacity: 1; }
  96%          { top: 100%; opacity: 0; }
  96.1%, 100%  { top: 0%;   opacity: 0; }
`;

const trailExpandH = [trailExpandH1, trailExpandH2, trailExpandH3];
const trailExpandV = [trailExpandV1, trailExpandV2, trailExpandV3];
const arrowTipH = [arrowTipH1, arrowTipH2, arrowTipH3];
const arrowTipV = [arrowTipV1, arrowTipV2, arrowTipV3];

// ── Sequential node glow ────────────────────────────────────────────
// Each node lights up when the arrow arrives and STAYS glowing
// until the cycle resets.

// Node 0 — "Your Signal": glows at cycle start, stays lit
const nodeGlow0 = keyframes`
  0%          { box-shadow: 0 0 15px 2px rgba(0,198,224,0.1); }
  1%          { box-shadow: 0 0 35px 10px rgba(0,198,224,0.55); }
  8%          { box-shadow: 0 0 25px 6px rgba(0,198,224,0.35); }
  96%         { box-shadow: 0 0 25px 6px rgba(0,198,224,0.35); }
  100%        { box-shadow: 0 0 15px 2px rgba(0,198,224,0.1); }
`;

// Node 1 — "Atomik Processes": glows at ~28%, stays lit
const nodeGlow1 = keyframes`
  0%, 26%     { box-shadow: 0 0 15px 2px rgba(0,198,224,0.1); }
  28%         { box-shadow: 0 0 35px 10px rgba(0,198,224,0.55); }
  35%         { box-shadow: 0 0 25px 6px rgba(0,198,224,0.35); }
  96%         { box-shadow: 0 0 25px 6px rgba(0,198,224,0.35); }
  100%        { box-shadow: 0 0 15px 2px rgba(0,198,224,0.1); }
`;

// Node 2 — "Broker Executes": glows at ~61%, stays lit
const nodeGlow2 = keyframes`
  0%, 59%     { box-shadow: 0 0 15px 2px rgba(0,198,224,0.1); }
  61%         { box-shadow: 0 0 35px 10px rgba(0,198,224,0.55); }
  68%         { box-shadow: 0 0 25px 6px rgba(0,198,224,0.35); }
  96%         { box-shadow: 0 0 25px 6px rgba(0,198,224,0.35); }
  100%        { box-shadow: 0 0 15px 2px rgba(0,198,224,0.1); }
`;

// Node 3 — "Trade Complete": glows at ~94%, stays lit briefly
const nodeGlow3 = keyframes`
  0%, 92%     { box-shadow: 0 0 15px 2px rgba(0,198,224,0.1); }
  94%         { box-shadow: 0 0 35px 10px rgba(0,198,224,0.55); }
  97%         { box-shadow: 0 0 25px 6px rgba(0,198,224,0.35); }
  100%        { box-shadow: 0 0 15px 2px rgba(0,198,224,0.1); }
`;

const nodeGlows = [nodeGlow0, nodeGlow1, nodeGlow2, nodeGlow3];

// Flow Node Component
const FlowNode = ({ icon, title, description, tags, delay, isInView, nodeIndex }) => (
  <MotionBox
    initial={{ opacity: 0, scale: 0.8, y: 20 }}
    animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    display="flex"
    flexDirection="column"
    alignItems="center"
    textAlign="center"
    flex="1"
    minW={{ base: "auto", lg: "180px" }}
    maxW={{ base: "100%", lg: "220px" }}
  >
    {/* Node Circle */}
    <Box
      w={{ base: "72px", md: "80px" }}
      h={{ base: "72px", md: "80px" }}
      borderRadius="full"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="rgba(0, 198, 224, 0.1)"
      border="2px solid rgba(0, 198, 224, 0.4)"
      position="relative"
      mb={4}
      sx={isInView ? {
        animation: `${nodeGlows[nodeIndex]} 6s ease-in-out infinite`,
      } : {}}
    >
      <Icon as={icon} boxSize={{ base: 7, md: 8 }} color="rgba(0, 198, 224, 1)" />
    </Box>

    {/* Title */}
    <Text
      color="white"
      fontSize={{ base: "md", md: "lg" }}
      fontWeight="600"
      fontFamily="'Satoshi', sans-serif"
      mb={2}
    >
      {title}
    </Text>

    {/* Description */}
    <Text
      color="whiteAlpha.700"
      fontSize={{ base: "xs", md: "sm" }}
      lineHeight="tall"
      mb={3}
      px={2}
    >
      {description}
    </Text>

    {/* Tags */}
    <HStack spacing={2} flexWrap="wrap" justifyContent="center" gap={1}>
      {tags.map((tag) => (
        <Box
          key={tag}
          px={2}
          py={0.5}
          borderRadius="full"
          bg="rgba(0, 198, 224, 0.08)"
          border="1px solid rgba(0, 198, 224, 0.2)"
        >
          <Text color="rgba(0, 198, 224, 0.9)" fontSize="2xs" fontWeight="500">
            {tag}
          </Text>
        </Box>
      ))}
    </HStack>
  </MotionBox>
);

// Horizontal Connector — arrow with persistent trail (desktop)
const HorizontalConnector = ({ delay, isInView, connectorIndex }) => (
  <MotionBox
    initial={{ scaleX: 0 }}
    animate={isInView ? { scaleX: 1 } : {}}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    position="relative"
    h="4px"
    flex="1"
    maxW="120px"
    minW="40px"
    alignSelf="center"
    mb={{ base: 0, md: "120px" }}
    display={{ base: "none", lg: "block" }}
    transformOrigin="left"
  >
    {/* Trail — expands and stays illuminated */}
    {isInView && (
      <Box
        position="absolute"
        top="0"
        left="0"
        h="4px"
        bg="rgba(0,198,224,0.6)"
        borderRadius="2px 0 0 2px"
        boxShadow="0 0 8px 1px rgba(0,198,224,0.25)"
        sx={{
          animation: `${trailExpandH[connectorIndex]} 6s ease-in-out infinite`,
        }}
      />
    )}
    {/* Arrowhead — travels to next node, disappears on arrival */}
    {isInView && (
      <Box
        position="absolute"
        top="-4px"
        sx={{
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderLeft: '8px solid rgba(0,198,224,0.9)',
          filter: 'drop-shadow(0 0 4px rgba(0,198,224,0.5))',
          animation: `${arrowTipH[connectorIndex]} 6s ease-in-out infinite`,
        }}
      />
    )}
  </MotionBox>
);

// Vertical Connector — arrow with persistent trail (mobile)
const VerticalConnector = ({ delay, isInView, connectorIndex }) => (
  <MotionBox
    initial={{ scaleY: 0 }}
    animate={isInView ? { scaleY: 1 } : {}}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    position="relative"
    w="4px"
    h="40px"
    alignSelf="center"
    display={{ base: "block", lg: "none" }}
    transformOrigin="top"
  >
    {/* Trail — expands and stays illuminated */}
    {isInView && (
      <Box
        position="absolute"
        left="0"
        top="0"
        w="4px"
        bg="rgba(0,198,224,0.6)"
        borderRadius="2px 2px 0 0"
        boxShadow="0 0 8px 1px rgba(0,198,224,0.25)"
        sx={{
          animation: `${trailExpandV[connectorIndex]} 6s ease-in-out infinite`,
        }}
      />
    )}
    {/* Arrowhead — travels to next node, disappears on arrival */}
    {isInView && (
      <Box
        position="absolute"
        left="-4px"
        sx={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '8px solid rgba(0,198,224,0.9)',
          filter: 'drop-shadow(0 0 4px rgba(0,198,224,0.5))',
          animation: `${arrowTipV[connectorIndex]} 6s ease-in-out infinite`,
        }}
      />
    )}
  </MotionBox>
);

const HowToUse = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const nodes = [
    {
      icon: Radio,
      title: 'Your Signal',
      description: 'Use a strategy from our marketplace, send TradingView alerts, or trigger webhooks from anywhere.',
      tags: ['Marketplace', 'TradingView', 'Webhooks', 'API'],
    },
    {
      icon: Zap,
      title: 'Atomik Processes',
      description: 'Your rules are applied instantly — risk checks, position sizing, order routing.',
      tags: ['Risk Management', 'Position Sizing'],
    },
    {
      icon: Landmark,
      title: 'Broker Executes',
      description: 'Orders are sent directly to your broker account. You stay in full control.',
      tags: ['Tradovate', 'NinjaTrader', 'Binance', 'Apex'],
    },
    {
      icon: CheckCircle,
      title: 'Trade Complete',
      description: 'Executed automatically. Monitor everything in real-time from your dashboard.',
      tags: ['Real-time Logs', 'Dashboard'],
    },
  ];

  return (
    <>
      <Helmet>
        {/* HowTo Structured Data */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "HowTo",
              "name": "How to Automate Your Trading with Atomik",
              "description": "Complete step-by-step guide to automate your trading by connecting any signal source to your broker. No programming required.",
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
                  "name": "Signal Source",
                  "description": "TradingView, custom webhook, or any API-based signal source"
                },
                {
                  "@type": "HowToSupply",
                  "name": "Broker Account",
                  "description": "Supported broker with API access (Tradovate, NinjaTrader, etc.)"
                },
                {
                  "@type": "HowToSupply",
                  "name": "Atomik Trading Account",
                  "description": "Free account to connect your signals to your broker"
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
                  "name": "Send Your Signal",
                  "text": "Use a strategy from our marketplace, send TradingView alerts, or trigger webhooks from anywhere.",
                  "url": "https://atomiktrading.io#how-to-use"
                },
                {
                  "@type": "HowToStep",
                  "position": 2,
                  "name": "Atomik Processes",
                  "text": "Your rules are applied instantly — risk checks, position sizing, and order routing.",
                  "url": "https://atomiktrading.io#how-to-use"
                },
                {
                  "@type": "HowToStep",
                  "position": 3,
                  "name": "Broker Executes",
                  "text": "Orders are sent directly to your broker account via Tradovate, NinjaTrader, Binance, or Apex.",
                  "url": "https://atomiktrading.io#how-to-use"
                },
                {
                  "@type": "HowToStep",
                  "position": 4,
                  "name": "Trade Complete",
                  "text": "Executed automatically. Monitor everything in real-time from your dashboard.",
                  "url": "https://atomiktrading.io#how-to-use"
                }
              ],
              "about": {
                "@type": "Thing",
                "name": "Trading Automation"
              },
              "keywords": ["automated trading", "TradingView alerts", "trading automation", "custom webhooks", "no code automation"],
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
        py={{ base: 16, md: 20 }}
        bg="black"
        position="relative"
        overflow="hidden"
        ref={sectionRef}
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
          <VStack spacing={{ base: 12, md: 16 }}>
            {/* Section Title */}
            <VStack spacing={4} textAlign="center" maxW="800px">
              <Heading
                as="h2"
                size={{ base: "xl", md: "2xl" }}
                color="white"
                fontWeight="bold"
                fontFamily="'Satoshi', sans-serif"
              >
                How It
                <Text
                  as="span"
                  bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                  bgClip="text"
                  px={2}
                >
                  Works
                </Text>
              </Heading>
              <Text color="whiteAlpha.800" fontSize={{ base: "md", md: "lg" }}>
                From signal to execution — fully automated, no code needed.
              </Text>
            </VStack>

            {/* Flow Pipeline */}
            {/* Desktop: Horizontal */}
            <Flex
              display={{ base: "none", lg: "flex" }}
              align="flex-start"
              justify="center"
              w="full"
              gap={0}
            >
              {nodes.map((node, index) => (
                <React.Fragment key={node.title}>
                  <FlowNode
                    {...node}
                    delay={index * 0.3}
                    isInView={isInView}
                    nodeIndex={index}
                  />
                  {index < nodes.length - 1 && (
                    <HorizontalConnector
                      delay={index * 0.3 + 0.2}
                      isInView={isInView}
                      connectorIndex={index}
                    />
                  )}
                </React.Fragment>
              ))}
            </Flex>

            {/* Mobile/Tablet: Vertical */}
            <Flex
              display={{ base: "flex", lg: "none" }}
              direction="column"
              align="center"
              w="full"
            >
              {nodes.map((node, index) => (
                <React.Fragment key={node.title}>
                  <FlowNode
                    {...node}
                    delay={index * 0.25}
                    isInView={isInView}
                    nodeIndex={index}
                  />
                  {index < nodes.length - 1 && (
                    <VerticalConnector
                      delay={index * 0.25 + 0.15}
                      isInView={isInView}
                      connectorIndex={index}
                    />
                  )}
                </React.Fragment>
              ))}
            </Flex>
          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default HowToUse;
