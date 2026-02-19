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
      { icon: TrendingUp, name: 'TradingView Alert', label: 'Pine Script Signal', badge: null },
      { icon: Webhook, name: 'Custom Webhook', label: 'HTTP POST Signal', badge: null },
    ],
    outputs: [
      { name: 'Tradovate', label: 'Funded — 50K' },
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
      { icon: Radio, name: 'Your Trade', label: 'Manual Order', badge: 'BUY 2 NQ' },
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
      { icon: Store, name: 'Momentum Scalper', label: 'by TraderMike', badge: 'SELL 1 ES' },
    ],
    outputs: [
      { name: 'Tradovate', label: 'Funded — 50K' },
    ],
  },
];

// ─── Data Pipe — Railway-style glow conduit with flowing dots ──────────
// Each pipe connects directly from a card to the hub (or hub to card)
const DataPipe = ({ delay = 0, dotCount = 2 }) => {
  const pipeRef = useRef(null);
  const [pipeWidth, setPipeWidth] = useState(120);

  useEffect(() => {
    const measure = () => {
      if (pipeRef.current) {
        const w = pipeRef.current.offsetWidth;
        if (w > 0) setPipeWidth(w);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const dotDuration = 4.5;

  return (
    <Box ref={pipeRef} position="relative" flex="1" minW="60px" h="20px" alignSelf="center">
      {/* Glow conduit — soft blurred aura like Railway */}
      <Box
        position="absolute"
        top="50%"
        left="0"
        right="0"
        h="16px"
        transform="translateY(-50%)"
        borderRadius="full"
        bg="rgba(0,198,224,0.08)"
        filter="blur(8px)"
        pointerEvents="none"
      />
      {/* Thin core line */}
      <Box
        position="absolute"
        top="50%"
        left="0"
        right="0"
        h="2px"
        transform="translateY(-50%)"
        borderRadius="full"
        bg="rgba(0,198,224,0.15)"
      />
      {/* Flowing dots */}
      <Box position="absolute" inset="0" overflow="hidden">
        {Array.from({ length: dotCount }).map((_, i) => (
          <MotionBox
            key={i}
            position="absolute"
            top="50%"
            left="0"
            w="5px"
            h="5px"
            borderRadius="full"
            bg="#00C6E0"
            style={{ marginTop: '-2.5px' }}
            sx={{
              boxShadow:
                '0 0 3px #00C6E0, 0 0 8px rgba(0,198,224,0.8), 0 0 16px rgba(0,198,224,0.3)',
            }}
            animate={{ x: [-8, pipeWidth + 8] }}
            transition={{
              duration: dotDuration + (i % 2 === 0 ? 0 : 0.4),
              delay: delay + i * (dotDuration / dotCount),
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

// ─── Vertical Pipe (mobile) ───────────────────────────────────────────
const VerticalPipe = ({ delay = 0, height = 40, dotCount = 1 }) => {
  const dotDuration = 3.5;
  return (
    <Box position="relative" w="20px" h={`${height}px`} mx="auto">
      <Box
        position="absolute"
        left="50%"
        top="0"
        bottom="0"
        w="16px"
        transform="translateX(-50%)"
        borderRadius="full"
        bg="rgba(0,198,224,0.08)"
        filter="blur(8px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        left="50%"
        top="0"
        bottom="0"
        w="2px"
        transform="translateX(-50%)"
        borderRadius="full"
        bg="rgba(0,198,224,0.15)"
      />
      <Box position="absolute" inset="0" overflow="hidden">
        {Array.from({ length: dotCount }).map((_, i) => (
          <MotionBox
            key={i}
            position="absolute"
            left="50%"
            top="0"
            w="5px"
            h="5px"
            borderRadius="full"
            bg="#00C6E0"
            style={{ marginLeft: '-2.5px' }}
            sx={{
              boxShadow:
                '0 0 3px #00C6E0, 0 0 8px rgba(0,198,224,0.8), 0 0 16px rgba(0,198,224,0.3)',
            }}
            animate={{ y: [-8, height + 8] }}
            transition={{
              duration: dotDuration,
              delay: delay + i * (dotDuration / dotCount),
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

// ─── Card component (shared for input and output) ─────────────────────
const FlowCard = ({ icon, name, label, badge, checkmark, delay = 0, side = 'left' }) => (
  <MotionBox
    initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: side === 'left' ? -10 : 10 }}
    transition={{ duration: 0.4, delay }}
    px={5}
    py={4}
    bg={side === 'right' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.05)'}
    backdropFilter="blur(8px)"
    borderRadius="xl"
    border={
      side === 'right'
        ? '1px solid rgba(0,198,224,0.15)'
        : '1px solid rgba(255,255,255,0.08)'
    }
    boxShadow={side === 'right' ? '0 4px 20px rgba(0,198,224,0.06)' : 'none'}
    flexShrink={0}
    w={side === 'right' ? '220px' : '210px'}
  >
    <HStack spacing={3}>
      <Box
        p={2}
        bg={side === 'right' ? 'rgba(0,198,224,0.12)' : 'rgba(0,198,224,0.08)'}
        borderRadius="lg"
        color={side === 'right' ? '#00C6E0' : 'rgba(0,198,224,0.8)'}
        flexShrink={0}
      >
        <Icon as={icon} boxSize={5} />
      </Box>
      <Box flex="1" minW="0">
        <Text
          color={side === 'right' ? 'white' : 'whiteAlpha.800'}
          fontSize="sm"
          fontWeight="600"
          noOfLines={1}
        >
          {name}
        </Text>
        <Text color={side === 'right' ? 'whiteAlpha.600' : 'whiteAlpha.400'} fontSize="xs" noOfLines={1}>
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
          fontSize="xs"
          fontWeight="600"
          flexShrink={0}
        >
          {badge}
        </Badge>
      )}
      {checkmark && (
        <MotionBox
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: delay + 0.8 }}
          flexShrink={0}
        >
          <Icon as={CheckCircle2} color="green.400" boxSize={5} />
        </MotionBox>
      )}
    </HStack>
  </MotionBox>
);

// ─── Atomik Hub — Logo only, prominent ────────────────────────────────
const AtomikHub = () => (
  <Flex align="center" justify="center" flexShrink={0} position="relative">
    {/* Radial glow */}
    <Box
      position="absolute"
      w="180px"
      h="180px"
      borderRadius="full"
      bgGradient="radial(circle, rgba(0,198,224,0.15) 0%, rgba(0,198,224,0.05) 35%, transparent 70%)"
      filter="blur(8px)"
      pointerEvents="none"
    />
    <Image
      src="/logos/atomik-logo.svg"
      alt="Atomik"
      w="120px"
      h="120px"
      filter="drop-shadow(0 0 20px rgba(0,198,224,0.5)) drop-shadow(0 0 50px rgba(0,198,224,0.15))"
      position="relative"
      zIndex={1}
      fallback={
        <Icon as={Zap} boxSize={16} color="#00C6E0" filter="drop-shadow(0 0 20px rgba(0,198,224,0.5))" />
      }
    />
  </Flex>
);

// ─── Desktop Diagram — each card has its own pipe, 3D perspective ──────
const DesktopDiagram = ({ scene }) => {
  const rows = Math.max(scene.inputs.length, scene.outputs.length);

  return (
    <Flex
      align="center"
      w="full"
      py={4}
      // 3D perspective: left recedes, right comes forward
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* ── Left side: input cards + their pipes ── */}
      <VStack
        spacing={6}
        align="stretch"
        flexShrink={0}
        // 3D: further away — smaller, slightly receded
        style={{ transform: 'translateZ(-40px) scale(0.93)' }}
        opacity={0.85}
      >
        {scene.inputs.map((input, i) => (
          <HStack key={`${scene.key}-in-${i}`} spacing={0}>
            <FlowCard
              icon={input.icon}
              name={input.name}
              label={input.label}
              badge={input.badge}
              delay={i * 0.12}
              side="left"
            />
            <DataPipe delay={0.3 + i * 1.2} dotCount={2} />
          </HStack>
        ))}
      </VStack>

      {/* ── Center: Atomik Hub ── */}
      <AtomikHub />

      {/* ── Right side: pipes + output cards ── */}
      <VStack
        spacing={6}
        align="stretch"
        flexShrink={0}
        // 3D: closer — larger, brighter
        style={{ transform: 'translateZ(30px) scale(1.05)' }}
      >
        {scene.outputs.map((output, i) => (
          <HStack key={`${scene.key}-out-${i}`} spacing={0}>
            <DataPipe delay={0.8 + i * 1.0} dotCount={2} />
            <FlowCard
              icon={Wallet}
              name={output.name}
              label={output.label}
              checkmark
              delay={0.15 + i * 0.1}
              side="right"
            />
          </HStack>
        ))}
      </VStack>
    </Flex>
  );
};

// ─── Mobile Diagram ────────────────────────────────────────────────────
const MobileDiagram = ({ scene }) => (
  <VStack spacing={0} align="center" w="full">
    <VStack spacing={2} w="full" maxW="260px">
      {scene.inputs.map((input, i) => (
        <FlowCard
          key={`${scene.key}-in-${i}`}
          icon={input.icon}
          name={input.name}
          label={input.label}
          badge={input.badge}
          delay={i * 0.1}
          side="left"
        />
      ))}
    </VStack>

    <VerticalPipe delay={0.2} height={40} dotCount={2} />
    <AtomikHub />
    <VerticalPipe delay={0.5} height={40} dotCount={2} />

    <VStack spacing={2} w="full" maxW="260px">
      {scene.outputs.map((output, i) => (
        <FlowCard
          key={`${scene.key}-out-${i}`}
          icon={Wallet}
          name={output.name}
          label={output.label}
          checkmark
          delay={0.1 + i * 0.1}
          side="right"
        />
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

// ─── Progress Dots ─────────────────────────────────────────────────────
const ProgressDots = ({ activeIndex, total, sceneKey }) => (
  <HStack spacing={2} justify="center" mt={6}>
    {Array.from({ length: total }).map((_, i) => (
      <Box key={i} position="relative" w="24px" h="3px" borderRadius="full" bg="whiteAlpha.200">
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
      <Box position="absolute" top="10%" left="0%" width="50%" height="50%" bgGradient="conic(from 45deg, rgba(0,198,224,0.08) 0%, rgba(0,198,224,0.03) 25%, transparent 50%)" filter="blur(80px)" zIndex={0} pointerEvents="none" opacity={0.6} />
      <Box position="absolute" bottom="0%" right="0%" width="60%" height="60%" bgGradient="conic(from 225deg, rgba(0,198,224,0.06) 0%, rgba(0,198,224,0.02) 25%, transparent 50%)" filter="blur(100px)" zIndex={0} pointerEvents="none" opacity={0.4} />
      <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" width="80%" height="80%" bgGradient="radial(ellipse at center, rgba(0,198,224,0.02) 0%, transparent 70%)" filter="blur(120px)" zIndex={0} pointerEvents="none" />

      <Container maxW="8xl" position="relative" px={{ base: 4, md: 8 }} zIndex={1}>
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          spacing={{ base: 8, lg: 12 }}
          align="center"
          justify="space-between"
          py={{ base: 20, md: 16 }}
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
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <SceneTabs activeIndex={activeScene} onChange={handleTabChange} />
            </MotionBox>

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
                      boxShadow: '0 10px 30px rgba(0,198,224,0.4), 0 0 0 1px rgba(0,198,224,0.3)',
                      _before: { opacity: 1 },
                    }}
                    _before={{
                      content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      bgGradient: 'linear(135deg, #0099B8 0%, #00C6E0 100%)',
                      opacity: 0, transition: 'opacity 0.3s ease',
                    }}
                    _active={{ _after: { width: '300px', height: '300px' } }}
                    _after={{
                      content: '""', position: 'absolute', top: '50%', left: '50%',
                      width: '0', height: '0', borderRadius: '50%',
                      transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.1)',
                      transition: 'width 0.6s, height 0.6s',
                    }}
                  >
                    <Text position="relative" zIndex={1}>Try Free for 7 Days</Text>
                  </Button>
                </RouterLink>
                <Button
                  size="lg" h="56px" px={8} fontSize="md" fontWeight="500"
                  variant="ghost" color="white" borderWidth={2} borderColor="whiteAlpha.300"
                  bg="rgba(255,255,255,0.05)" backdropFilter="blur(10px)"
                  _hover={{
                    bg: 'rgba(0,198,224,0.1)', borderColor: 'rgba(0,198,224,0.5)',
                    transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,198,224,0.15)',
                  }}
                  as="a" href="#how-to-use"
                >
                  Learn More
                </Button>
              </Stack>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
              w="full"
            >
              <HStack
                spacing={2} justify={{ base: 'center', lg: 'flex-start' }}
                flexWrap="wrap" color="whiteAlpha.600" fontSize="sm"
              >
                <Text>Don't have a strategy?</Text>
                <RouterLink to="/pricing?source=marketplace">
                  <Text as="span" color="#00C6E0" fontWeight="medium" cursor="pointer" _hover={{ textDecoration: 'underline' }}>
                    Browse the Marketplace
                  </Text>
                </RouterLink>
                <Text mx={1}>•</Text>
                <Text>Want to sell strategies?</Text>
                <RouterLink to="/pricing?source=creator">
                  <Text as="span" color="#00C6E0" fontWeight="medium" cursor="pointer" _hover={{ textDecoration: 'underline' }}>
                    Become a Creator
                  </Text>
                </RouterLink>
              </HStack>
            </MotionBox>
          </VStack>

          {/* Right: Animated Hub Diagram */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            flex={{ base: 'none', lg: '1' }}
            w="full"
            zIndex={5}
          >
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

            <ProgressDots activeIndex={activeScene} total={scenes.length} sceneKey={scene.key} />
          </MotionBox>
        </Stack>
      </Container>
    </Box>
  );
};

export default Hero;
