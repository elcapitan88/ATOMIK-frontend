import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Stack,
  VStack,
  HStack,
  Icon,
  Flex,
  Badge,
  Image,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import {
  Radio,
  Webhook,
  TrendingUp,
  Store,
  Wallet,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Zap,
} from 'lucide-react';
import ParticleBackground from './ParticleBackground';

const MotionBox = motion(Box);

// ─── Scene Data ────────────────────────────────────────────────────────
const scenes = [
  {
    key: 'automate',
    tab: 'Automate',
    headline: (
      <>
        Automate Any Trading Strategy —{' '}
        <Text
          as="span"
          bgGradient="linear(135deg, #00C6E0 0%, #0099B8 50%, #00C6E0 100%)"
          bgClip="text"
        >
          No Code Required
        </Text>
      </>
    ),
    description:
      'Connect TradingView alerts or custom webhooks directly to your broker. Atomik executes every signal automatically.',
    inputs: [
      {
        icon: TrendingUp,
        name: 'TradingView Alert',
        label: 'Pine Script Signal',
        badge: null,
      },
      {
        icon: Webhook,
        name: 'Custom Webhook',
        label: 'HTTP POST Signal',
        badge: null,
      },
    ],
    outputs: [
      {
        name: 'Tradovate',
        label: 'Funded — 50K',
      },
    ],
  },
  {
    key: 'mirror',
    tab: 'Mirror',
    headline: (
      <>
        One Signal, Every Account —{' '}
        <Text
          as="span"
          bgGradient="linear(135deg, #00C6E0 0%, #0099B8 50%, #00C6E0 100%)"
          bgClip="text"
        >
          Trade Mirroring
        </Text>
      </>
    ),
    description:
      'Place a trade once and every connected account executes it simultaneously. Built for prop traders managing multiple funded accounts.',
    inputs: [
      {
        icon: Radio,
        name: 'Your Trade',
        label: 'Manual Order',
        badge: 'BUY 2 NQ',
      },
    ],
    outputs: [
      { name: 'Apex Account 1', label: 'Funded — 50K' },
      { name: 'TopStep Account', label: 'Funded — 150K' },
      { name: 'Apex Account 2', label: 'Funded — 50K' },
      { name: 'Personal Account', label: 'Demo' },
    ],
  },
  {
    key: 'subscribe',
    tab: 'Subscribe',
    headline: (
      <>
        Follow Expert Strategies —{' '}
        <Text
          as="span"
          bgGradient="linear(135deg, #00C6E0 0%, #0099B8 50%, #00C6E0 100%)"
          bgClip="text"
        >
          Strategy Marketplace
        </Text>
      </>
    ),
    description:
      'Subscribe to proven strategies from expert creators. Every signal auto-executes through your connected broker.',
    inputs: [
      {
        icon: Store,
        name: 'Momentum Scalper',
        label: 'by TraderMike',
        badge: 'SELL 1 ES',
      },
    ],
    outputs: [
      {
        name: 'Tradovate',
        label: 'Funded — 50K',
      },
    ],
  },
];

// ─── Pulsing Data Beam ─────────────────────────────────────────────────
const DataBeam = ({ width = 100, delay = 0, direction = 'right' }) => (
  <Box position="absolute" top="0" left="0" right="0" bottom="0" overflow="hidden">
    <MotionBox
      position="absolute"
      top="50%"
      transform="translateY(-50%)"
      w="40px"
      h="2px"
      bgGradient={
        direction === 'right'
          ? 'linear(to-r, transparent, #00C6E0, transparent)'
          : 'linear(to-l, transparent, #00C6E0, transparent)'
      }
      filter="blur(1px) drop-shadow(0 0 6px rgba(0,198,224,0.6))"
      animate={{
        x: direction === 'right' ? [-40, width + 10] : [width + 10, -40],
      }}
      transition={{
        duration: 1.5,
        delay,
        repeat: Infinity,
        ease: 'linear',
        repeatDelay: 0.5,
      }}
    />
  </Box>
);

// ─── Connection Line with Beam ─────────────────────────────────────────
const ConnectionLine = ({ delay = 0, direction = 'right', minW = '60px' }) => (
  <Box position="relative" flex="1" minW={minW} h="2px" alignSelf="center">
    {/* Static base line */}
    <Box
      position="absolute"
      top="0"
      left="0"
      right="0"
      h="2px"
      bg="rgba(0,198,224,0.12)"
      borderRadius="full"
    />
    {/* Animated beam */}
    <DataBeam width={120} delay={delay} direction={direction} />
    {/* Arrow at end */}
    <Box
      position="absolute"
      top="50%"
      transform="translateY(-50%)"
      {...(direction === 'right' ? { right: '-8px' } : { left: '-8px' })}
    >
      <Icon
        as={ArrowRight}
        color="rgba(0,198,224,0.4)"
        boxSize={3}
        transform={direction === 'left' ? 'rotate(180deg)' : undefined}
      />
    </Box>
  </Box>
);

// ─── Input Card ────────────────────────────────────────────────────────
const InputCard = ({ icon, name, label, badge, delay = 0 }) => (
  <MotionBox
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.35, delay }}
    px={4}
    py={3}
    bg="rgba(255,255,255,0.08)"
    borderRadius="lg"
    border="1px solid rgba(255,255,255,0.12)"
    w="full"
  >
    <HStack spacing={3}>
      <Box
        p={1.5}
        bg="rgba(0,198,224,0.12)"
        borderRadius="md"
        color="#00C6E0"
        flexShrink={0}
      >
        <Icon as={icon} boxSize={4} />
      </Box>
      <Box flex="1" minW="0">
        <Text color="white" fontSize="sm" fontWeight="600" noOfLines={1}>
          {name}
        </Text>
        <Text color="whiteAlpha.500" fontSize="xs" noOfLines={1}>
          {label}
        </Text>
      </Box>
      {badge && (
        <Badge
          px={2}
          py={0.5}
          borderRadius="md"
          bg="rgba(72,187,120,0.15)"
          color="green.300"
          fontSize="2xs"
          fontWeight="600"
          flexShrink={0}
        >
          {badge}
        </Badge>
      )}
    </HStack>
  </MotionBox>
);

// ─── Output Card ───────────────────────────────────────────────────────
const OutputCard = ({ name, label, delay = 0 }) => (
  <MotionBox
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ duration: 0.35, delay }}
    px={4}
    py={3}
    bg="rgba(255,255,255,0.08)"
    borderRadius="lg"
    border="1px solid rgba(255,255,255,0.12)"
    w="full"
  >
    <HStack justify="space-between">
      <HStack spacing={3}>
        <Box
          p={1.5}
          bg="rgba(0,198,224,0.12)"
          borderRadius="md"
          color="#00C6E0"
          flexShrink={0}
        >
          <Icon as={Wallet} boxSize={4} />
        </Box>
        <Box minW="0">
          <Text color="white" fontSize="sm" fontWeight="600" noOfLines={1}>
            {name}
          </Text>
          <Text color="whiteAlpha.500" fontSize="xs" noOfLines={1}>
            {label}
          </Text>
        </Box>
      </HStack>
      <MotionBox
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, delay: delay + 0.5 }}
      >
        <Icon as={CheckCircle2} color="green.400" boxSize={4} />
      </MotionBox>
    </HStack>
  </MotionBox>
);

// ─── Atomik Hub (Center) ───────────────────────────────────────────────
const AtomikHub = () => (
  <Flex
    direction="column"
    align="center"
    justify="center"
    flexShrink={0}
    mx={{ base: 0, lg: 2 }}
  >
    <Box position="relative">
      {/* Glow ring */}
      <MotionBox
        position="absolute"
        inset="-8px"
        borderRadius="full"
        border="1px solid rgba(0,198,224,0.2)"
        animate={{
          boxShadow: [
            '0 0 15px rgba(0,198,224,0.1), inset 0 0 15px rgba(0,198,224,0.05)',
            '0 0 30px rgba(0,198,224,0.25), inset 0 0 20px rgba(0,198,224,0.1)',
            '0 0 15px rgba(0,198,224,0.1), inset 0 0 15px rgba(0,198,224,0.05)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Hub circle */}
      <Flex
        w="64px"
        h="64px"
        borderRadius="full"
        bg="rgba(0,198,224,0.1)"
        border="2px solid rgba(0,198,224,0.35)"
        align="center"
        justify="center"
        position="relative"
        zIndex={1}
      >
        <Image
          src="/logos/atomik-logo.svg"
          alt="Atomik"
          w="36px"
          h="36px"
          filter="drop-shadow(0 0 8px rgba(0,198,224,0.4))"
          fallback={
            <Icon as={Zap} boxSize={6} color="#00C6E0" />
          }
        />
      </Flex>
    </Box>
    <Text
      color="rgba(0,198,224,0.7)"
      fontSize="2xs"
      fontWeight="700"
      letterSpacing="0.1em"
      textTransform="uppercase"
      mt={2}
    >
      ATOMIK
    </Text>
  </Flex>
);

// ─── Desktop Diagram ───────────────────────────────────────────────────
const DesktopDiagram = ({ scene }) => {
  const maxOutputs = Math.max(scene.inputs.length, scene.outputs.length);

  return (
    <Flex align="center" gap={0} w="full">
      {/* Input cards */}
      <VStack spacing={2} flex="0 0 180px" align="stretch">
        <AnimatePresence mode="wait">
          {scene.inputs.map((input, i) => (
            <InputCard
              key={`${scene.key}-in-${i}`}
              {...input}
              delay={i * 0.1}
            />
          ))}
        </AnimatePresence>
      </VStack>

      {/* Lines: inputs → hub */}
      <VStack spacing={2} flex="1" minW="50px" justify="center">
        {Array.from({ length: Math.max(scene.inputs.length, 1) }).map((_, i) => (
          <ConnectionLine key={`in-line-${i}`} delay={0.3 + i * 0.2} direction="right" />
        ))}
      </VStack>

      {/* Hub */}
      <AtomikHub />

      {/* Lines: hub → outputs */}
      <VStack spacing={2} flex="1" minW="50px" justify="center">
        {Array.from({ length: Math.max(scene.outputs.length, 1) }).map((_, i) => (
          <ConnectionLine key={`out-line-${i}`} delay={0.5 + i * 0.15} direction="right" />
        ))}
      </VStack>

      {/* Output cards */}
      <VStack spacing={2} flex="0 0 185px" align="stretch">
        <AnimatePresence mode="wait">
          {scene.outputs.map((output, i) => (
            <OutputCard
              key={`${scene.key}-out-${i}`}
              {...output}
              delay={0.2 + i * 0.1}
            />
          ))}
        </AnimatePresence>
      </VStack>
    </Flex>
  );
};

// ─── Mobile Diagram ────────────────────────────────────────────────────
const MobileDiagram = ({ scene }) => (
  <VStack spacing={3} align="center" w="full">
    {/* Input cards */}
    <VStack spacing={2} w="full" maxW="280px">
      <AnimatePresence mode="wait">
        {scene.inputs.map((input, i) => (
          <InputCard
            key={`${scene.key}-in-${i}`}
            {...input}
            delay={i * 0.1}
          />
        ))}
      </AnimatePresence>
    </VStack>

    {/* Vertical connector down */}
    <VStack spacing={0}>
      <Box w="2px" h="20px" bg="rgba(0,198,224,0.2)" />
      <Icon as={ChevronDown} color="rgba(0,198,224,0.4)" boxSize={4} />
    </VStack>

    {/* Hub */}
    <AtomikHub />

    {/* Vertical connector down */}
    <VStack spacing={0}>
      <Box w="2px" h="20px" bg="rgba(0,198,224,0.2)" />
      <Icon as={ChevronDown} color="rgba(0,198,224,0.4)" boxSize={4} />
    </VStack>

    {/* Output cards */}
    <VStack spacing={2} w="full" maxW="280px">
      <AnimatePresence mode="wait">
        {scene.outputs.map((output, i) => (
          <OutputCard
            key={`${scene.key}-out-${i}`}
            {...output}
            delay={0.1 + i * 0.1}
          />
        ))}
      </AnimatePresence>
    </VStack>
  </VStack>
);

// ─── Scene Tabs ────────────────────────────────────────────────────────
const SceneTabs = ({ activeIndex, onChange }) => (
  <HStack spacing={2}>
    {scenes.map((scene, i) => (
      <Button
        key={scene.key}
        size="sm"
        h="32px"
        px={4}
        fontSize="xs"
        fontWeight="600"
        letterSpacing="0.02em"
        borderRadius="full"
        border="1px solid"
        borderColor={i === activeIndex ? 'rgba(0,198,224,0.35)' : 'whiteAlpha.200'}
        bg={i === activeIndex ? 'rgba(0,198,224,0.12)' : 'transparent'}
        color={i === activeIndex ? '#00C6E0' : 'whiteAlpha.600'}
        onClick={() => onChange(i)}
        _hover={{
          bg: i === activeIndex ? 'rgba(0,198,224,0.15)' : 'rgba(0,198,224,0.06)',
          borderColor: i === activeIndex ? 'rgba(0,198,224,0.45)' : 'whiteAlpha.300',
        }}
        transition="all 0.2s"
        leftIcon={
          <Box
            w="6px"
            h="6px"
            borderRadius="full"
            bg={i === activeIndex ? '#00C6E0' : 'whiteAlpha.400'}
            transition="all 0.2s"
          />
        }
      >
        {scene.tab}
      </Button>
    ))}
  </HStack>
);

// ─── Main Hero Component ───────────────────────────────────────────────
const Hero = () => {
  const [activeScene, setActiveScene] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  const startAutoRotate = useCallback(() => {
    const id = setInterval(() => {
      setActiveScene((prev) => (prev + 1) % scenes.length);
    }, 6000);
    setIntervalId(id);
    return id;
  }, []);

  useEffect(() => {
    const id = startAutoRotate();
    return () => clearInterval(id);
  }, [startAutoRotate]);

  const handleTabChange = (index) => {
    setActiveScene(index);
    if (intervalId) clearInterval(intervalId);
    startAutoRotate();
  };

  const scene = scenes[activeScene];

  return (
    <Box
      as="section"
      position="relative"
      minH="100vh"
      display="flex"
      alignItems="center"
      bgGradient="radial(circle at 30% 20%, rgba(0,198,224,0.03) 0%, transparent 50%), radial(circle at 80% 80%, rgba(0,198,224,0.02) 0%, transparent 50%), linear(to-br, #000000, #0a0a0a, #000000)"
      overflow="hidden"
      aria-label="Hero section - Atomik Trading Platform"
    >
      {/* Particle Effect Background */}
      <ParticleBackground />

      {/* Background gradient blobs */}
      <Box
        position="absolute"
        top="10%"
        left="0%"
        width="50%"
        height="50%"
        bgGradient="conic(from 45deg, rgba(0,198,224,0.08) 0%, rgba(0,198,224,0.03) 25%, transparent 50%)"
        filter="blur(80px)"
        zIndex={0}
        pointerEvents="none"
        opacity={0.6}
      />
      <Box
        position="absolute"
        bottom="0%"
        right="0%"
        width="60%"
        height="60%"
        bgGradient="conic(from 225deg, rgba(0,198,224,0.06) 0%, rgba(0,198,224,0.02) 25%, transparent 50%)"
        filter="blur(100px)"
        zIndex={0}
        pointerEvents="none"
        opacity={0.4}
      />
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        width="80%"
        height="80%"
        bgGradient="radial(ellipse at center, rgba(0,198,224,0.02) 0%, transparent 70%)"
        filter="blur(120px)"
        zIndex={0}
        pointerEvents="none"
      />

      <Container maxW="7xl" position="relative" px={{ base: 6, md: 8 }} zIndex={1}>
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          spacing={{ base: 10, lg: 12 }}
          align="center"
          justify="space-between"
          py={{ base: 16, md: 20 }}
          position="relative"
        >
          {/* ── Left Side: Text Content ──────────────────────────── */}
          <VStack
            spacing={6}
            align={{ base: 'center', lg: 'flex-start' }}
            textAlign={{ base: 'center', lg: 'left' }}
            maxW={{ base: 'full', lg: '45%' }}
            zIndex={10}
            position="relative"
            flex={{ base: 'none', lg: '0 0 45%' }}
          >
            {/* Scene Tabs */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <SceneTabs activeIndex={activeScene} onChange={handleTabChange} />
            </MotionBox>

            {/* Headline */}
            <Box minH={{ base: 'auto', lg: '130px' }}>
              <AnimatePresence mode="wait">
                <MotionBox
                  key={scene.key + '-headline'}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  <Heading
                    as="h1"
                    fontSize={{ base: '3xl', md: '4xl', lg: '4xl', xl: '5xl' }}
                    fontWeight="700"
                    fontFamily="'Satoshi', sans-serif"
                    color="white"
                    lineHeight="1.15"
                    letterSpacing="-0.02em"
                  >
                    {scene.headline}
                  </Heading>
                </MotionBox>
              </AnimatePresence>
            </Box>

            {/* Description */}
            <Box minH={{ base: 'auto', lg: '60px' }}>
              <AnimatePresence mode="wait">
                <MotionBox
                  key={scene.key + '-desc'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                >
                  <Text
                    fontSize={{ base: 'lg', md: 'xl' }}
                    color="whiteAlpha.800"
                    maxW="550px"
                    fontWeight="400"
                    lineHeight="1.6"
                  >
                    {scene.description}
                  </Text>
                </MotionBox>
              </AnimatePresence>
            </Box>

            {/* CTA Buttons */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
            >
              <Stack
                direction={{ base: 'column', sm: 'row' }}
                spacing={4}
                w="full"
                justify={{ base: 'center', lg: 'flex-start' }}
              >
                <RouterLink to="/pricing">
                  <Button
                    size="lg"
                    h="56px"
                    px={8}
                    fontSize="md"
                    fontWeight="600"
                    bgGradient="linear(135deg, #00C6E0 0%, #0099B8 100%)"
                    color="white"
                    border="1px solid transparent"
                    position="relative"
                    overflow="hidden"
                    _hover={{
                      transform: 'translateY(-3px)',
                      boxShadow:
                        '0 10px 30px rgba(0,198,224,0.4), 0 0 0 1px rgba(0,198,224,0.3)',
                      _before: { opacity: 1 },
                    }}
                    _before={{
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgGradient: 'linear(135deg, #0099B8 0%, #00C6E0 100%)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    }}
                    _active={{
                      _after: { width: '300px', height: '300px' },
                    }}
                    _after={{
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '0',
                      height: '0',
                      borderRadius: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(255,255,255,0.1)',
                      transition: 'width 0.6s, height 0.6s',
                    }}
                  >
                    <Text position="relative" zIndex={1}>
                      Try Free for 7 Days
                    </Text>
                  </Button>
                </RouterLink>
                <Button
                  size="lg"
                  h="56px"
                  px={8}
                  fontSize="md"
                  fontWeight="500"
                  variant="ghost"
                  color="white"
                  borderWidth={2}
                  borderColor="whiteAlpha.300"
                  bg="rgba(255,255,255,0.05)"
                  backdropFilter="blur(10px)"
                  _hover={{
                    bg: 'rgba(0,198,224,0.1)',
                    borderColor: 'rgba(0,198,224,0.5)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,198,224,0.15)',
                  }}
                  as="a"
                  href="#how-to-use"
                >
                  Learn More
                </Button>
              </Stack>
            </MotionBox>

            {/* Secondary CTAs */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
              w="full"
            >
              <HStack
                spacing={2}
                justify={{ base: 'center', lg: 'flex-start' }}
                flexWrap="wrap"
                color="whiteAlpha.600"
                fontSize="sm"
              >
                <Text>Don't have a strategy?</Text>
                <RouterLink to="/pricing?source=marketplace">
                  <Text
                    as="span"
                    color="#00C6E0"
                    fontWeight="medium"
                    cursor="pointer"
                    _hover={{ textDecoration: 'underline' }}
                  >
                    Browse the Marketplace
                  </Text>
                </RouterLink>
                <Text mx={1}>•</Text>
                <Text>Want to sell strategies?</Text>
                <RouterLink to="/pricing?source=creator">
                  <Text
                    as="span"
                    color="#00C6E0"
                    fontWeight="medium"
                    cursor="pointer"
                    _hover={{ textDecoration: 'underline' }}
                  >
                    Become a Creator
                  </Text>
                </RouterLink>
              </HStack>
            </MotionBox>
          </VStack>

          {/* ── Right Side: Animated Hub Diagram ─────────────────── */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            flex={{ base: 'none', lg: '0 0 52%' }}
            w="full"
            position="relative"
            zIndex={5}
          >
            <Box
              bg="rgba(255,255,255,0.03)"
              border="1px solid rgba(0,198,224,0.12)"
              borderRadius="2xl"
              p={{ base: 5, md: 6, lg: 8 }}
              position="relative"
              overflow="hidden"
              boxShadow="0 10px 40px -10px rgba(0,198,224,0.1)"
            >
              {/* Subtle glow inside the diagram box */}
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                w="60%"
                h="60%"
                bgGradient="radial(circle, rgba(0,198,224,0.04) 0%, transparent 70%)"
                filter="blur(40px)"
                pointerEvents="none"
              />

              {/* Desktop diagram */}
              <Box display={{ base: 'none', lg: 'block' }}>
                <AnimatePresence mode="wait">
                  <MotionBox
                    key={scene.key + '-desktop'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DesktopDiagram scene={scene} />
                  </MotionBox>
                </AnimatePresence>
              </Box>

              {/* Mobile diagram */}
              <Box display={{ base: 'block', lg: 'none' }}>
                <AnimatePresence mode="wait">
                  <MotionBox
                    key={scene.key + '-mobile'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MobileDiagram scene={scene} />
                  </MotionBox>
                </AnimatePresence>
              </Box>

              {/* Progress bar at bottom */}
              <Box
                position="absolute"
                bottom="0"
                left="0"
                right="0"
                h="2px"
                bg="rgba(0,198,224,0.08)"
              >
                <MotionBox
                  key={scene.key + '-progress'}
                  h="2px"
                  bg="rgba(0,198,224,0.4)"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 6, ease: 'linear' }}
                />
              </Box>
            </Box>
          </MotionBox>
        </Stack>
      </Container>
    </Box>
  );
};

export default Hero;
