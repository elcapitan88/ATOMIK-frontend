import React, { useRef } from 'react';
import { Box, Container, Heading, Text, VStack, SimpleGrid, Image } from '@chakra-ui/react';
import { motion, useInView } from 'framer-motion';
import { keyframes } from '@emotion/react';

const MotionBox = motion(Box);

// ── Keyframe Animations ──

// Hub breathing glow
const hubGlow = keyframes`
  0%, 100% { box-shadow: 0 0 30px rgba(0,198,224,0.12), 0 0 60px rgba(0,198,224,0.04); }
  50% { box-shadow: 0 0 50px rgba(0,198,224,0.22), 0 0 90px rgba(0,198,224,0.08); }
`;

// Slow-rotating dashed orbit ring
const ringRotate = keyframes`
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
`;

// Connection line pulse
const linePulse = keyframes`
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.65; }
`;

// Gentle floating bob for nodes
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
`;

// Data pulse dots traveling along connection lines
const pulseUp = keyframes`
  0% { bottom: -4px; opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { bottom: calc(100% + 4px); opacity: 0; }
`;

const pulseDown = keyframes`
  0% { top: -4px; opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { top: calc(100% + 4px); opacity: 0; }
`;

const pulseLeft = keyframes`
  0% { right: -4px; opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { right: calc(100% + 4px); opacity: 0; }
`;

const pulseRight = keyframes`
  0% { left: -4px; opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { left: calc(100% + 4px); opacity: 0; }
`;

// ── Platform Node Component ──

const PlatformNode = ({ name, logo, abbreviation, delay, isInView, floatDelay = 0 }) => (
  <MotionBox
    initial={{ opacity: 0, scale: 0.5 }}
    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
    transition={{ duration: 0.5, delay, ease: "backOut" }}
    textAlign="center"
  >
    <VStack spacing={3}>
      <Box
        w={{ base: "60px", md: "72px" }}
        h={{ base: "60px", md: "72px" }}
        borderRadius="full"
        bg="rgba(255, 255, 255, 0.03)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        transition="border 0.3s, background 0.3s, box-shadow 0.3s"
        sx={isInView ? {
          animation: `${float} 4s ease-in-out infinite`,
          animationDelay: `${floatDelay}s`,
        } : {}}
        _hover={{
          border: '1px solid rgba(0, 198, 224, 0.4)',
          bg: 'rgba(0, 198, 224, 0.06)',
          boxShadow: '0 0 25px rgba(0, 198, 224, 0.2), 0 0 50px rgba(0, 198, 224, 0.05)',
        }}
        _before={{
          content: '""',
          position: 'absolute',
          inset: '-6px',
          borderRadius: 'full',
          border: '1px solid rgba(0, 198, 224, 0.06)',
        }}
      >
        {logo ? (
          <Image
            src={logo}
            alt={name}
            maxW={{ base: "32px", md: "38px" }}
            maxH={{ base: "32px", md: "38px" }}
            objectFit="contain"
            opacity={0.9}
          />
        ) : (
          <Text
            color="rgba(0, 198, 224, 0.9)"
            fontSize={{ base: "sm", md: "md" }}
            fontWeight="800"
            letterSpacing="0.05em"
            fontFamily="'Satoshi', sans-serif"
          >
            {abbreviation || name}
          </Text>
        )}
      </Box>
      <Text color="whiteAlpha.500" fontSize="xs" fontWeight="500" letterSpacing="0.02em">
        {name}
      </Text>
    </VStack>
  </MotionBox>
);

// ── Data Pulse Dot ──

const DataPulseDot = ({ animation, position }) => (
  <Box
    position="absolute"
    {...position}
    w="5px"
    h="5px"
    borderRadius="full"
    bg="rgba(0, 198, 224, 1)"
    boxShadow="0 0 8px rgba(0, 198, 224, 0.8), 0 0 16px rgba(0, 198, 224, 0.3)"
    sx={{ animation }}
  />
);

const IntegrationPartners = () => {
  const diagramRef = useRef(null);
  const isInView = useInView(diagramRef, { once: true, margin: "-80px" });

  return (
    <Box
      py={{ base: 16, md: 24 }}
      bg="black"
      position="relative"
      overflow="hidden"
    >
      {/* Radial background glow centered on diagram */}
      <Box
        position="absolute"
        inset="0"
        bg="radial-gradient(circle at 50% 50%, rgba(0,198,224,0.04) 0%, transparent 50%)"
        pointerEvents="none"
      />

      <Container maxW="7xl" px={{ base: 4, md: 8 }}>
        <VStack spacing={{ base: 10, md: 14 }}>
          {/* Header */}
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
                Supported
                <Text
                  as="span"
                  bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                  bgClip="text"
                  px={2}
                >
                  Platforms
                </Text>
              </Heading>
              <Text color="whiteAlpha.600" fontSize={{ base: "md", md: "lg" }}>
                Your central hub for automated trading across platforms
              </Text>
            </VStack>
          </MotionBox>

          {/* Network Diagram */}
          <Box ref={diagramRef} w="full" maxW="550px" mx="auto">

            {/* ═══════════════════════════════════════ */}
            {/* DESKTOP: Orbital network diagram        */}
            {/* ═══════════════════════════════════════ */}
            <Box
              display={{ base: 'none', md: 'block' }}
              position="relative"
              h="480px"
            >
              {/* ── Orbital Rings ── */}

              {/* Static orbit ring */}
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                w="300px"
                h="300px"
                borderRadius="full"
                border="1px solid rgba(0, 198, 224, 0.06)"
                pointerEvents="none"
              />

              {/* Slowly rotating dashed ring */}
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                w="320px"
                h="320px"
                borderRadius="full"
                border="1px dashed rgba(0, 198, 224, 0.04)"
                pointerEvents="none"
                sx={isInView ? {
                  animation: `${ringRotate} 60s linear infinite`,
                } : {}}
              />

              {/* ── Connection Lines with Data Pulse Dots ── */}

              {/* Top line — hub to Tradovate */}
              <Box
                position="absolute"
                bottom="58%"
                left="50%"
                transform="translateX(-50%)"
                w="1px"
                h={isInView ? "22%" : "0%"}
                borderRadius="full"
                transition="height 0.7s ease-out 0.35s"
                overflow="visible"
                sx={isInView ? {
                  background: 'linear-gradient(to top, rgba(0,198,224,0.5), rgba(0,198,224,0.08))',
                  animation: `${linePulse} 3s ease-in-out infinite 1.2s`,
                } : { bg: 'rgba(0,198,224,0.3)' }}
              >
                {isInView && (
                  <DataPulseDot
                    animation={`${pulseUp} 2.5s ease-in-out infinite 2s`}
                    position={{ left: '-2px' }}
                  />
                )}
              </Box>

              {/* Bottom line — hub to Apex */}
              <Box
                position="absolute"
                top="58%"
                left="50%"
                transform="translateX(-50%)"
                w="1px"
                h={isInView ? "22%" : "0%"}
                borderRadius="full"
                transition="height 0.7s ease-out 0.45s"
                overflow="visible"
                sx={isInView ? {
                  background: 'linear-gradient(to bottom, rgba(0,198,224,0.5), rgba(0,198,224,0.08))',
                  animation: `${linePulse} 3s ease-in-out infinite 1.5s`,
                } : { bg: 'rgba(0,198,224,0.3)' }}
              >
                {isInView && (
                  <DataPulseDot
                    animation={`${pulseDown} 2.5s ease-in-out infinite 2.5s`}
                    position={{ left: '-2px' }}
                  />
                )}
              </Box>

              {/* Left line — hub to Binance */}
              <Box
                position="absolute"
                top="50%"
                right="58%"
                transform="translateY(-50%)"
                h="1px"
                w={isInView ? "24%" : "0%"}
                borderRadius="full"
                transition="width 0.7s ease-out 0.4s"
                overflow="visible"
                sx={isInView ? {
                  background: 'linear-gradient(to left, rgba(0,198,224,0.5), rgba(0,198,224,0.08))',
                  animation: `${linePulse} 3s ease-in-out infinite 1.8s`,
                } : { bg: 'rgba(0,198,224,0.3)' }}
              >
                {isInView && (
                  <DataPulseDot
                    animation={`${pulseLeft} 2.5s ease-in-out infinite 3s`}
                    position={{ top: '-2px' }}
                  />
                )}
              </Box>

              {/* Right line — hub to NinjaTrader */}
              <Box
                position="absolute"
                top="50%"
                left="58%"
                transform="translateY(-50%)"
                h="1px"
                w={isInView ? "24%" : "0%"}
                borderRadius="full"
                transition="width 0.7s ease-out 0.5s"
                overflow="visible"
                sx={isInView ? {
                  background: 'linear-gradient(to right, rgba(0,198,224,0.5), rgba(0,198,224,0.08))',
                  animation: `${linePulse} 3s ease-in-out infinite 2s`,
                } : { bg: 'rgba(0,198,224,0.3)' }}
              >
                {isInView && (
                  <DataPulseDot
                    animation={`${pulseRight} 2.5s ease-in-out infinite 3.5s`}
                    position={{ top: '-2px' }}
                  />
                )}
              </Box>

              {/* ── Center Hub: ATOMIK ── */}
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
              >
                <MotionBox
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.1, ease: "backOut" }}
                >
                  <Box position="relative" display="flex" alignItems="center" justifyContent="center">
                    {/* Outer decorative ring */}
                    <Box
                      position="absolute"
                      w="155px"
                      h="155px"
                      borderRadius="full"
                      border="1px solid rgba(0, 198, 224, 0.08)"
                      pointerEvents="none"
                    />
                    {/* Hub circle */}
                    <Box
                      w="120px"
                      h="120px"
                      borderRadius="full"
                      bg="rgba(0, 198, 224, 0.06)"
                      border="1.5px solid rgba(0, 198, 224, 0.3)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      sx={isInView ? { animation: `${hubGlow} 4s ease-in-out infinite 0.8s` } : {}}
                    >
                      <Image
                        src="/logos/atomik-logo.svg"
                        alt="Atomik Trading"
                        maxW="68px"
                        maxH="68px"
                        objectFit="contain"
                        fallback={
                          <Text
                            color="rgba(0,198,224,1)"
                            fontSize="sm"
                            fontWeight="bold"
                            fontFamily="'Satoshi', sans-serif"
                          >
                            ATOMIK
                          </Text>
                        }
                      />
                    </Box>
                  </Box>
                </MotionBox>
              </Box>

              {/* ── Platform Nodes ── */}

              {/* Top: Tradovate */}
              <Box position="absolute" top="0" left="50%" transform="translateX(-50%)">
                <PlatformNode name="Tradovate" logo="/logos/tradovate.svg" delay={0.7} isInView={isInView} floatDelay={0} />
              </Box>

              {/* Right: NinjaTrader */}
              <Box position="absolute" top="50%" right="0" transform="translateY(-50%)">
                <PlatformNode name="NinjaTrader" logo="/logos/ninjalogo.webp" delay={0.8} isInView={isInView} floatDelay={1} />
              </Box>

              {/* Bottom: Apex */}
              <Box position="absolute" bottom="0" left="50%" transform="translateX(-50%)">
                <PlatformNode name="Apex" logo="/logos/apex.svg" delay={0.9} isInView={isInView} floatDelay={2} />
              </Box>

              {/* Left: Binance */}
              <Box position="absolute" top="50%" left="0" transform="translateY(-50%)">
                <PlatformNode name="Binance" logo="/logos/binancelogo.svg" delay={1.0} isInView={isInView} floatDelay={3} />
              </Box>
            </Box>

            {/* ═══════════════════════════════════════ */}
            {/* MOBILE: Hub + grid                      */}
            {/* ═══════════════════════════════════════ */}
            <VStack display={{ base: 'flex', md: 'none' }} spacing={8}>
              {/* Mobile hub */}
              <MotionBox
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Box position="relative" display="flex" justifyContent="center">
                  {/* Outer ring */}
                  <Box
                    position="absolute"
                    w="88px"
                    h="88px"
                    borderRadius="full"
                    border="1px solid rgba(0, 198, 224, 0.08)"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                  />
                  <Box
                    w="72px"
                    h="72px"
                    borderRadius="full"
                    bg="rgba(0, 198, 224, 0.06)"
                    border="1.5px solid rgba(0, 198, 224, 0.3)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    sx={isInView ? { animation: `${hubGlow} 4s ease-in-out infinite` } : {}}
                  >
                    <Image
                      src="/logos/atomik-logo.svg"
                      alt="Atomik Trading"
                      maxW="40px"
                      maxH="40px"
                      objectFit="contain"
                      fallback={
                        <Text
                          color="rgba(0,198,224,1)"
                          fontSize="xs"
                          fontWeight="bold"
                          fontFamily="'Satoshi', sans-serif"
                        >
                          ATOMIK
                        </Text>
                      }
                    />
                  </Box>
                </Box>
              </MotionBox>

              {/* Connecting indicator */}
              <Box
                w="1px"
                h="24px"
                bg="linear-gradient(to bottom, rgba(0,198,224,0.3), rgba(0,198,224,0.05))"
                borderRadius="full"
                mx="auto"
                mt={-4}
                mb={-4}
              />

              {/* Mobile 2x2 grid */}
              <SimpleGrid columns={2} spacing={6} maxW="260px" mx="auto">
                <PlatformNode name="Tradovate" logo="/logos/tradovate.svg" delay={0.3} isInView={isInView} />
                <PlatformNode name="NinjaTrader" logo="/logos/ninjalogo.webp" delay={0.4} isInView={isInView} />
                <PlatformNode name="Binance" logo="/logos/binancelogo.svg" delay={0.5} isInView={isInView} />
                <PlatformNode name="Apex" logo="/logos/apex.svg" delay={0.6} isInView={isInView} />
              </SimpleGrid>
            </VStack>
          </Box>

          {/* Coming Soon */}
          <MotionBox
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Text
              color="whiteAlpha.400"
              fontSize="sm"
              textAlign="center"
            >
              Additional broker integrations coming soon. Contact us for specific requests.
            </Text>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
};

export default IntegrationPartners;
