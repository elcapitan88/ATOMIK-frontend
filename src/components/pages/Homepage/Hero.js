import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// ─── Data Pipe — Railway-style network flow ────────────────────────────
// Soft blurred glow conduit with tiny bright dots flowing through
const DataPipe = ({ delay = 0, dotCount = 4 }) => {
  const pipeRef = useRef(null);
  const [pipeWidth, setPipeWidth] = useState(200);

  useEffect(() => {
    const measure = () => {
      if (pipeRef.current) {
        const w = pipeRef.current.offsetWidth;
        if (w > 0) setPipeWidth(w);
      }
    };
    measure();
    // Re-measure on resize for accurate dot travel distance
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Stagger dots with slight variation so they feel organic
  const dotDuration = 3.5;
  const dotSpacing = dotDuration / dotCount;

  return (
    <Box
      ref={pipeRef}
      position="relative"
      flex="1"
      minW="50px"
      h="24px"
      alignSelf="center"
    >
      {/* Pipe glow — soft blurred conduit (Railway-style) */}
      <Box
        position="absolute"
        top="50%"
        left="-2px"
        right="-2px"
        h="14px"
        transform="translateY(-50%)"
        borderRadius="full"
        bg="rgba(0,198,224,0.06)"
        filter="blur(6px)"
        pointerEvents="none"
      />
      {/* Pipe core — thin visible track */}
      <Box
        position="absolute"
        top="50%"
        left="0"
        right="0"
        h="1px"
        transform="translateY(-50%)"
        bg="rgba(0,198,224,0.12)"
      />

      {/* Data dots — tiny bright circles flowing through the pipe */}
      <Box position="absolute" inset="0" overflow="hidden">
        {Array.from({ length: dotCount }).map((_, i) => (
          <MotionBox
            key={i}
            position="absolute"
            top="50%"
            left="0"
            w="3px"
            h="3px"
            borderRadius="full"
            bg="#00C6E0"
            transform="translateY(-50%)"
            opacity={0.9}
            sx={{
              boxShadow:
                '0 0 4px rgba(0,198,224,0.9), 0 0 8px rgba(0,198,224,0.6)',
            }}
            animate={{
              x: [-4, pipeWidth + 4],
            }}
            transition={{
              duration: dotDuration + (i % 2 === 0 ? 0 : 0.3),
              delay: delay + i * dotSpacing,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

// ─── Vertical Data Pipe (mobile) — same Railway style ─────────────────
const VerticalPipe = ({ delay = 0, height = 50, dotCount = 3 }) => {
  const dotDuration = 2.5;
  const dotSpacing = dotDuration / dotCount;

  return (
    <Box position="relative" w="24px" h={`${height}px`} mx="auto">
      {/* Pipe glow */}
      <Box
        position="absolute"
        left="50%"
        top="-2px"
        bottom="-2px"
        w="14px"
        transform="translateX(-50%)"
        borderRadius="full"
        bg="rgba(0,198,224,0.06)"
        filter="blur(6px)"
        pointerEvents="none"
      />
      {/* Pipe core */}
      <Box
        position="absolute"
        left="50%"
        top="0"
        bottom="0"
        w="1px"
        transform="translateX(-50%)"
        bg="rgba(0,198,224,0.12)"
      />
      {/* Data dots */}
      <Box position="absolute" inset="0" overflow="hidden">
        {Array.from({ length: dotCount }).map((_, i) => (
          <MotionBox
            key={i}
            position="absolute"
            left="50%"
            top="0"
            w="3px"
            h="3px"
            borderRadius="full"
            bg="#00C6E0"
            transform="translateX(-50%)"
            opacity={0.9}
            sx={{
              boxShadow:
                '0 0 4px rgba(0,198,224,0.9), 0 0 8px rgba(0,198,224,0.6)',
            }}
            animate={{
              y: [-4, height + 4],
            }}
            transition={{
              duration: dotDuration + (i % 2 === 0 ? 0 : 0.2),
              delay: delay + i * dotSpacing,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

// ─── Input Card (3D depth: appears further away) ──────────────────────
const InputCard = ({ icon, name, label, badge, delay = 0 }) => (
  <MotionBox
    initial={{ opacity: 0, x: -25 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -15 }}
    transition={{ duration: 0.4, delay }}
    px={4}
    py={3}
    bg="rgba(255,255,255,0.05)"
    backdropFilter="blur(8px)"
    borderRadius="xl"
    border="1px solid rgba(255,255,255,0.08)"
    w="full"
    // 3D depth — further away: smaller, slightly muted
    transform="scale(0.92)"
    opacity={0.85}
  >
    <HStack spacing={3}>
      <Box
        p={2}
        bg="rgba(0,198,224,0.08)"
        borderRadius="lg"
        color="rgba(0,198,224,0.8)"
        flexShrink={0}
      >
        <Icon as={icon} boxSize={4} />
      </Box>
      <Box flex="1" minW="0">
        <Text color="whiteAlpha.800" fontSize="sm" fontWeight="600" noOfLines={1}>
          {name}
        </Text>
        <Text color="whiteAlpha.400" fontSize="xs" noOfLines={1}>
          {label}
        </Text>
      </Box>
      {badge && (
        <Badge
          px={2}
          py={0.5}
          borderRadius="md"
          bg="rgba(72,187,120,0.12)"
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

// ─── Output Card (3D depth: appears closer) ───────────────────────────
const OutputCard = ({ name, label, delay = 0 }) => (
  <MotionBox
    initial={{ opacity: 0, x: 25 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 15 }}
    transition={{ duration: 0.4, delay }}
    px={5}
    py={4}
    bg="rgba(255,255,255,0.08)"
    backdropFilter="blur(12px)"
    borderRadius="xl"
    border="1px solid rgba(0,198,224,0.15)"
    w="full"
    // 3D depth — closer: larger, brighter, subtle cyan border glow
    transform="scale(1.04)"
    boxShadow="0 4px 20px rgba(0,198,224,0.08)"
  >
    <HStack justify="space-between">
      <HStack spacing={3}>
        <Box
          p={2}
          bg="rgba(0,198,224,0.12)"
          borderRadius="lg"
          color="#00C6E0"
          flexShrink={0}
        >
          <Icon as={Wallet} boxSize={5} />
        </Box>
        <Box minW="0">
          <Text color="white" fontSize="sm" fontWeight="700" noOfLines={1}>
            {name}
          </Text>
          <Text color="whiteAlpha.600" fontSize="xs" noOfLines={1}>
            {label}
          </Text>
        </Box>
      </HStack>
      <MotionBox
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.6 }}
      >
        <Icon as={CheckCircle2} color="green.400" boxSize={5} />
      </MotionBox>
    </HStack>
  </MotionBox>
);

// ─── Atomik Hub — Just the logo, big and prominent ─────────────────────
const AtomikHub = () => (
  <Flex
    align="center"
    justify="center"
    flexShrink={0}
    mx={{ base: 0, lg: 3 }}
    my={{ base: 2, lg: 0 }}
    position="relative"
  >
    {/* Radial glow behind logo */}
    <Box
      position="absolute"
      w="140px"
      h="140px"
      borderRadius="full"
      bgGradient="radial(circle, rgba(0,198,224,0.12) 0%, rgba(0,198,224,0.04) 40%, transparent 70%)"
      filter="blur(8px)"
      pointerEvents="none"
    />
    {/* The logo itself */}
    <Image
      src="/logos/atomik-logo.svg"
      alt="Atomik"
      w={{ base: '80px', lg: '100px' }}
      h={{ base: '80px', lg: '100px' }}
      filter="drop-shadow(0 0 20px rgba(0,198,224,0.4)) drop-shadow(0 0 40px rgba(0,198,224,0.15))"
      position="relative"
      zIndex={1}
      fallback={
        <Icon
          as={Zap}
          boxSize={{ base: 12, lg: 14 }}
          color="#00C6E0"
          filter="drop-shadow(0 0 20px rgba(0,198,224,0.4))"
        />
      }
    />
  </Flex>
);

// ─── Desktop Diagram — 3D perspective depth ────────────────────────────
const DesktopDiagram = ({ scene }) => (
  <Flex
    align="center"
    gap={0}
    w="full"
    py={6}
    // 3D perspective container — creates the depth illusion
    style={{ perspective: '800px' }}
  >
    {/* Input cards — further away */}
    <VStack
      spacing={3}
      flex="0 0 190px"
      align="stretch"
      style={{ transformStyle: 'preserve-3d', transform: 'translateZ(-30px)' }}
    >
      {scene.inputs.map((input, i) => (
        <InputCard
          key={`${scene.key}-in-${i}`}
          {...input}
          delay={i * 0.12}
        />
      ))}
    </VStack>

    {/* Pipes: inputs → hub */}
    <VStack spacing={3} flex="1" minW="50px" justify="center">
      {Array.from({ length: Math.max(scene.inputs.length, 1) }).map((_, i) => (
        <DataPipe key={`in-pipe-${i}`} delay={i * 0.6} dotCount={4} />
      ))}
    </VStack>

    {/* Hub — center, full presence */}
    <AtomikHub />

    {/* Pipes: hub → outputs */}
    <VStack spacing={3} flex="1" minW="50px" justify="center">
      {Array.from({ length: Math.max(scene.outputs.length, 1) }).map((_, i) => (
        <DataPipe key={`out-pipe-${i}`} delay={0.4 + i * 0.5} dotCount={4} />
      ))}
    </VStack>

    {/* Output cards — closer to viewer */}
    <VStack
      spacing={3}
      flex="0 0 210px"
      align="stretch"
      style={{ transformStyle: 'preserve-3d', transform: 'translateZ(20px)' }}
    >
      {scene.outputs.map((output, i) => (
        <OutputCard
          key={`${scene.key}-out-${i}`}
          {...output}
          delay={0.15 + i * 0.1}
        />
      ))}
    </VStack>
  </Flex>
);

// ─── Mobile Diagram ────────────────────────────────────────────────────
const MobileDiagram = ({ scene }) => (
  <VStack spacing={0} align="center" w="full">
    {/* Input cards */}
    <VStack spacing={2} w="full" maxW="280px" opacity={0.85} transform="scale(0.93)">
      {scene.inputs.map((input, i) => (
        <InputCard key={`${scene.key}-in-${i}`} {...input} delay={i * 0.1} />
      ))}
    </VStack>

    <VerticalPipe delay={0.2} height={50} dotCount={2} />

    <AtomikHub />

    <VerticalPipe delay={0.5} height={50} dotCount={2} />

    {/* Output cards */}
    <VStack spacing={2} w="full" maxW="300px">
      {scene.outputs.map((output, i) => (
        <OutputCard key={`${scene.key}-out-${i}`} {...output} delay={0.1 + i * 0.1} />
      ))}
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
        h="34px"
        px={4}
        fontSize="xs"
        fontWeight="600"
        letterSpacing="0.02em"
        borderRadius="full"
        border="1px solid"
        borderColor={
          i === activeIndex ? 'rgba(0,198,224,0.35)' : 'whiteAlpha.200'
        }
        bg={i === activeIndex ? 'rgba(0,198,224,0.12)' : 'transparent'}
        color={i === activeIndex ? '#00C6E0' : 'whiteAlpha.600'}
        onClick={() => onChange(i)}
        _hover={{
          bg:
            i === activeIndex
              ? 'rgba(0,198,224,0.15)'
              : 'rgba(0,198,224,0.06)',
          borderColor:
            i === activeIndex
              ? 'rgba(0,198,224,0.45)'
              : 'whiteAlpha.300',
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

// ─── Progress Dots ─────────────────────────────────────────────────────
const ProgressDots = ({ activeIndex, total, sceneKey }) => (
  <HStack spacing={2} justify="center" mt={6}>
    {Array.from({ length: total }).map((_, i) => (
      <Box
        key={i}
        position="relative"
        w="24px"
        h="3px"
        borderRadius="full"
        bg="whiteAlpha.200"
      >
        {i === activeIndex && (
          <MotionBox
            key={sceneKey + '-dot'}
            position="absolute"
            top="0"
            left="0"
            h="3px"
            borderRadius="full"
            bg="#00C6E0"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 6, ease: 'linear' }}
            sx={{ boxShadow: '0 0 6px rgba(0,198,224,0.5)' }}
          />
        )}
      </Box>
    ))}
  </HStack>
);

// ─── Main Hero Component ───────────────────────────────────────────────
const Hero = () => {
  const [activeScene, setActiveScene] = useState(0);
  const intervalRef = useRef(null);

  const startAutoRotate = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveScene((prev) => (prev + 1) % scenes.length);
    }, 6000);
  }, []);

  useEffect(() => {
    startAutoRotate();
    return () => clearInterval(intervalRef.current);
  }, [startAutoRotate]);

  const handleTabChange = (index) => {
    setActiveScene(index);
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

      <Container maxW="8xl" position="relative" px={{ base: 4, md: 8 }} zIndex={1}>
        <VStack
          spacing={{ base: 8, lg: 0 }}
          align="stretch"
          py={{ base: 20, md: 16 }}
        >
          <Stack
            direction={{ base: 'column', lg: 'row' }}
            spacing={{ base: 8, lg: 12 }}
            align="center"
            justify="space-between"
          >
            {/* Left: Text Content */}
            <VStack
              spacing={6}
              align={{ base: 'center', lg: 'flex-start' }}
              textAlign={{ base: 'center', lg: 'left' }}
              maxW={{ base: 'full', lg: '40%' }}
              flex={{ base: 'none', lg: '0 0 40%' }}
              zIndex={10}
            >
              {/* Scene Tabs */}
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <SceneTabs
                  activeIndex={activeScene}
                  onChange={handleTabChange}
                />
              </MotionBox>

              {/* Headline */}
              <Box minH={{ base: 'auto', lg: '120px' }}>
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
                      fontSize={{
                        base: '3xl',
                        md: '4xl',
                        lg: '4xl',
                        xl: '5xl',
                      }}
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
              <Box minH={{ base: 'auto', lg: '56px' }}>
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
                      maxW="500px"
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
                        bgGradient:
                          'linear(135deg, #0099B8 0%, #00C6E0 100%)',
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

            {/* Right: Animated Hub Diagram — fills remaining space */}
            <MotionBox
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
              flex={{ base: 'none', lg: '1' }}
              w="full"
              zIndex={5}
            >
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

              {/* Progress dots */}
              <ProgressDots
                activeIndex={activeScene}
                total={scenes.length}
                sceneKey={scene.key}
              />
            </MotionBox>
          </Stack>
        </VStack>
      </Container>
    </Box>
  );
};

export default Hero;
