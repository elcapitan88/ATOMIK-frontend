import React from 'react';
import { Box, Container, Text, Image, Badge } from '@chakra-ui/react';
import { motion, useInView } from 'framer-motion';
import { keyframes } from '@emotion/react';

const MotionBox = motion(Box);

// ── Infinite scroll keyframe ──
const scroll = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

// ── Broker data ──
const brokers = [
  { name: 'Apex', logo: '/logos/apex-logo-color.webp', url: 'https://www.apextraderfunding.com' },
  { name: 'TakeProfit Trader', logo: '/logos/takeprofit.svg', url: 'https://www.takeprofittrader.com' },
  { name: 'Lucid Trading', logo: '/logos/lucid.webp', url: 'https://www.lucidtrading.com' },
  { name: 'Tradovate', logo: '/logos/Tradovate-darkbg.png', url: 'https://www.tradovate.com' },
  { name: 'NinjaTrader', logo: '/logos/tradovate-main-rbg.png', url: 'https://www.ninjatrader.com' },
  { name: 'TopStep', logo: '/logos/topstepx-login.png', url: 'https://www.topstep.com', comingSoon: true },
];

// ── Single logo item ──
const MarqueeLogo = ({ name, logo, url, comingSoon }) => (
  <Box
    flex="0 0 auto"
    px={{ base: 6, md: 10 }}
    position="relative"
    role="group"
    as="a"
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    cursor="pointer"
    _hover={{ textDecoration: 'none' }}
  >
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      {/* Coming Soon badge */}
      {comingSoon && (
        <Badge
          position="absolute"
          top={{ base: '-18px', md: '-20px' }}
          left="50%"
          transform="translateX(-50%)"
          bg="rgba(0, 198, 224, 0.12)"
          color="rgba(0, 198, 224, 0.9)"
          border="1px solid rgba(0, 198, 224, 0.2)"
          borderRadius="full"
          px={2}
          py={0.5}
          fontSize="9px"
          fontWeight="600"
          letterSpacing="0.08em"
          textTransform="uppercase"
          fontFamily="'Satoshi', sans-serif"
          whiteSpace="nowrap"
        >
          Coming Soon
        </Badge>
      )}

      <Image
        src={logo}
        alt={name}
        h={{ base: '28px', md: '38px' }}
        maxW={{ base: '100px', md: '140px' }}
        objectFit="contain"
        opacity={comingSoon ? 0.25 : 0.4}
        filter={comingSoon ? 'grayscale(0.5)' : 'none'}
        transition="opacity 0.3s ease, filter 0.3s ease, transform 0.3s ease"
        _groupHover={{
          opacity: comingSoon ? 0.5 : 1,
          filter: 'none',
          transform: 'scale(1.05)',
        }}
        userSelect="none"
        draggable="false"
      />
    </Box>
  </Box>
);

const BrokerMarquee = () => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <Box
      ref={ref}
      py={{ base: 10, md: 14 }}
      bg="black"
      position="relative"
      overflow="hidden"
    >
      {/* Subtle top/bottom edge lines */}
      <Box
        position="absolute"
        top="0"
        left="10%"
        right="10%"
        h="1px"
        bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)"
      />
      <Box
        position="absolute"
        bottom="0"
        left="10%"
        right="10%"
        h="1px"
        bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)"
      />

      <Container maxW="7xl" px={{ base: 4, md: 8 }}>
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          mb={{ base: 8, md: 10 }}
          textAlign="center"
        >
          <Text
            color="whiteAlpha.400"
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight="600"
            letterSpacing="0.15em"
            textTransform="uppercase"
            fontFamily="'Satoshi', sans-serif"
          >
            Integrated with
          </Text>
        </MotionBox>
      </Container>

      {/* Marquee */}
      <MotionBox
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
        position="relative"
      >
        {/* Fade edges */}
        <Box
          position="absolute"
          top="0"
          left="0"
          w={{ base: '40px', md: '120px' }}
          h="100%"
          bg="linear-gradient(to right, black, transparent)"
          zIndex="2"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          top="0"
          right="0"
          w={{ base: '40px', md: '120px' }}
          h="100%"
          bg="linear-gradient(to left, black, transparent)"
          zIndex="2"
          pointerEvents="none"
        />

        {/* Scrolling track */}
        <Box
          overflow="hidden"
          role="marquee"
          aria-label="Supported trading platforms"
          sx={{
            '&:hover .marquee-track': {
              animationPlayState: 'paused',
            },
            '@media (prefers-reduced-motion: reduce)': {
              '.marquee-track': {
                animation: 'none !important',
              },
            },
          }}
        >
          <Box
            className="marquee-track"
            display="flex"
            alignItems="center"
            w="max-content"
            sx={{
              animation: `${scroll} 35s linear infinite`,
            }}
          >
            {/* Original set */}
            {brokers.map((broker) => (
              <MarqueeLogo key={broker.name} {...broker} />
            ))}
            {/* Duplicate for seamless loop */}
            {brokers.map((broker) => (
              <MarqueeLogo key={`${broker.name}-dup`} {...broker} />
            ))}
          </Box>
        </Box>
      </MotionBox>
    </Box>
  );
};

export default BrokerMarquee;
