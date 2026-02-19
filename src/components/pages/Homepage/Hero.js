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

// ─── Scanning Pulse Beam ───────────────────────────────────────────────
// A glowing beam of light that travels along a dark track line
const ScanningBeam = ({ delay = 0 }) => {
  const lineRef = useRef(null);
  const [lineWidth, setLineWidth] = useState(200);

  useEffect(() => {
    if (lineRef.current) {
      const w = lineRef.current.offsetWidth;
      if (w > 0) setLineWidth(w);
    }
  }, []);

  return (
    <Box
      ref={lineRef}
      position="relative"
      flex="1"
      minW="60px"
      h="20px"
      alignSelf="center"
      overflow="hidden"
    >
      {/* Dark track line */}
      <Box
        position="absolute"
        top="50%"
        left="0"
        right="0"
        h="1px"
        bg="whiteAlpha.100"
        transform="translateY(-50%)"
      />
      {/* Glowing beam that travels along the track */}
      <MotionBox
        position="absolute"
        top="50%"
        left="0"
        w="60px"
        h="3px"
        transform="translateY(-50%)"
        bgGradient="linear(to-r, transparent, rgba(0,198,224,0.6), #00C6E0, rgba(0,198,224,0.6), transparent)"
        filter="blur(1.5px)"
        sx={{
          boxShadow: '0 0 12px rgba(0,198,224,0.5), 0 0 4px rgba(0,198,224,0.8)',
        }}
        animate={{
          x: [-60, lineWidth + 10],
        }}
        transition={{
          duration: 2,
          delay,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </Box>
  );
};

// ─── Vertical Scanning Beam (mobile) ──────────────────────────────────
const VerticalBeam = ({ delay = 0, height = 40 }) => (
  <Box position="relative" w="20px" h={`${height}px`} overflow="hidden" mx="auto">
    {/* Dark track */}
    <Box
      position="absolute"
      top="0"
      bottom="0"
      left="50%"
      w="1px"
      bg="whiteAlpha.100"
      transform="translateX(-50%)"
    />
    {/* Glowing beam */}
    <MotionBox
      position="absolute"
      left="50%"
      top="0"
      w="3px"
      h="30px"
      transform="translateX(-50%)"
      bgGradient="linear(to-b, transparent, rgba(0,198,224,0.6), #00C6E0, rgba(0,198,224,0.6), transparent)"
      filter="blur(1.5px)"
      sx={{
        boxShadow: '0 0 12px rgba(0,198,224,0.5), 0 0 4px rgba(0,198,224,0.8)',
      }}
      animate={{
        y: [-30, height + 10],
      }}
      transition={{
        duration: 1.5,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  </Box>
);

// ─── Input Card ────────────────────────────────────────────────────────
const InputCard = ({ icon, name, label, badge, delay = 0 }) => (
  <MotionBox
    initial={{ opacity: 0, x: -25 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -15 }}
    transition={{ duration: 0.4, delay }}
    px={4}
    py={3}
    bg="rgba(255,255,255,0.06)"
    backdropFilter="blur(8px)"
    borderRadius="xl"
    border="1px solid rgba(255,255,255,0.1)"
    w="full"
    _hover={{
      bg: 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(0,198,224,0.2)',
    }}
    transition2="all 0.3s"
  >
    <HStack spacing={3}>
      <Box
        p={2}
        bg="rgba(0,198,224,0.1)"
        borderRadius="lg"
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
    initial={{ opacity: 0, x: 25 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 15 }}
    transition={{ duration: 0.4, delay }}
    px={4}
    py={3}
    bg="rgba(255,255,255,0.06)"
    backdropFilter="blur(8px)"
    borderRadius="xl"
    border="1px solid rgba(255,255,255,0.1)"
    w="full"
  >
    <HStack justify="space-between">
      <HStack spacing={3}>
        <Box
          p={2}
          bg="rgba(0,198,224,0.1)"
          borderRadius="lg"
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
        transition={{ duration: 0.3, delay: delay + 0.6 }}
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
    mx={{ base: 0, lg: 4 }}
    my={{ base: 2, lg: 0 }}
  >
    <Box position="relative">
      {/* Outer glow ring */}
      <MotionBox
        position="absolute"
        inset="-12px"
        borderRadius="full"
        border="1px solid rgba(0,198,224,0.15)"
        animate={{
          boxShadow: [
            '0 0 20px rgba(0,198,224,0.08), inset 0 0 20px rgba(0,198,224,0.04)',
            '0 0 40px rgba(0,198,224,0.2), inset 0 0 25px rgba(0,198,224,0.08)',
            '0 0 20px rgba(0,198,224,0.08), inset 0 0 20px rgba(0,198,224,0.04)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Hub circle */}
      <Flex
        w="72px"
        h="72px"
        borderRadius="full"
        bg="rgba(0,198,224,0.08)"
        border="2px solid rgba(0,198,224,0.3)"
        align="center"
        justify="center"
        position="relative"
        zIndex={1}
      >
        <Image
          src="/logos/atomik-logo.svg"
          alt="Atomik"
          w="40px"
          h="40px"
          filter="drop-shadow(0 0 10px rgba(0,198,224,0.5))"
          fallback={<Icon as={Zap} boxSize={7} color="#00C6E0" />}
        />
      </Flex>
    </Box>
    <Text
      color="rgba(0,198,224,0.6)"
      fontSize="2xs"
      fontWeight="700"
      letterSpacing="0.12em"
      textTransform="uppercase"
      mt={2}
    >
      ATOMIK
    </Text>
  </Flex>
);

// ─── Desktop Diagram (full-width, no container box) ────────────────────
const DesktopDiagram = ({ scene }) => (
  <Flex align="center" gap={0} w="full" py={4}>
    {/* Input cards */}
    <VStack spacing={3} flex="0 0 200px" align="stretch">
      {scene.inputs.map((input, i) => (
        <InputCard
          key={`${scene.key}-in-${i}`}
          {...input}
          delay={i * 0.12}
        />
      ))}
    </VStack>

    {/* Beams: inputs → hub (staggered) */}
    <VStack spacing={3} flex="1" minW="60px" justify="center">
      {Array.from({ length: Math.max(scene.inputs.length, 1) }).map((_, i) => (
        <ScanningBeam key={`in-beam-${i}`} delay={i * 0.4} />
      ))}
    </VStack>

    {/* Hub */}
    <AtomikHub />

    {/* Beams: hub → outputs (staggered) */}
    <VStack spacing={3} flex="1" minW="60px" justify="center">
      {Array.from({ length: Math.max(scene.outputs.length, 1) }).map((_, i) => (
        <ScanningBeam key={`out-beam-${i}`} delay={0.3 + i * 0.35} />
      ))}
    </VStack>

    {/* Output cards */}
    <VStack spacing={3} flex="0 0 200px" align="stretch">
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
    <VStack spacing={2} w="full" maxW="300px">
      {scene.inputs.map((input, i) => (
        <InputCard
          key={`${scene.key}-in-${i}`}
          {...input}
          delay={i * 0.1}
        />
      ))}
    </VStack>

    {/* Vertical beam down */}
    <VerticalBeam delay={0.2} height={50} />

    {/* Hub */}
    <AtomikHub />

    {/* Vertical beam down */}
    <VerticalBeam delay={0.5} height={50} />

    {/* Output cards */}
    <VStack spacing={2} w="full" maxW="300px">
      {scene.outputs.map((output, i) => (
        <OutputCard
          key={`${scene.key}-out-${i}`}
          {...output}
          delay={0.1 + i * 0.1}
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
          {/* ── Top Row: Text + Diagram side by side on desktop ── */}
          <Stack
            direction={{ base: 'column', lg: 'row' }}
            spacing={{ base: 8, lg: 16 }}
            align="center"
            justify="space-between"
          >
            {/* Left: Text Content */}
            <VStack
              spacing={6}
              align={{ base: 'center', lg: 'flex-start' }}
              textAlign={{ base: 'center', lg: 'left' }}
              maxW={{ base: 'full', lg: '42%' }}
              flex={{ base: 'none', lg: '0 0 42%' }}
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

            {/* Right: Animated Hub Diagram — no container box */}
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

              {/* Progress dots under diagram */}
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
