import React from 'react';
import {
  Box,
  Container,
  SimpleGrid,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Flex,
  Badge,
} from '@chakra-ui/react';
import {
  Radio,
  MonitorSmartphone,
  Zap,
  DollarSign,
  ArrowRight,
  Wallet,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

// ─── Benefit Card ────────────────────────────────────────────────────
const BenefitCard = ({ icon, title, description }) => (
  <MotionBox
    as="article"
    whileHover={{ y: -5 }}
    p={6}
    bg="rgba(255, 255, 255, 0.1)"
    backdropFilter="blur(10px)"
    borderRadius="xl"
    border="1px solid rgba(255, 255, 255, 0.18)"
    transition="all 0.3s"
    role="group"
  >
    <VStack spacing={4} align="flex-start">
      <Box
        p={2}
        bg="rgba(0, 198, 224, 0.1)"
        borderRadius="lg"
        color="rgba(0, 198, 224, 1)"
        _groupHover={{ bg: 'rgba(0, 198, 224, 0.2)' }}
        transition="all 0.3s"
      >
        <Icon as={icon} boxSize={6} />
      </Box>
      <Heading as="h3" size="md" color="white">
        {title}
      </Heading>
      <Text color="whiteAlpha.800" fontSize="sm">
        {description}
      </Text>
    </VStack>
  </MotionBox>
);

// ─── Account Card (right side of diagram) ────────────────────────────
const AccountCard = ({ name, label, delay }) => (
  <MotionBox
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
    px={4}
    py={3}
    bg="rgba(255, 255, 255, 0.08)"
    borderRadius="lg"
    border="1px solid rgba(255, 255, 255, 0.12)"
    w="full"
  >
    <HStack justify="space-between">
      <HStack spacing={3}>
        <Box
          p={1.5}
          bg="rgba(0, 198, 224, 0.1)"
          borderRadius="md"
          color="rgba(0, 198, 224, 1)"
        >
          <Icon as={Wallet} boxSize={4} />
        </Box>
        <Box>
          <Text color="white" fontSize="sm" fontWeight="600">
            {name}
          </Text>
          <Text color="whiteAlpha.600" fontSize="xs">
            {label}
          </Text>
        </Box>
      </HStack>
      <MotionBox
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.3 }}
      >
        <Icon as={CheckCircle2} color="green.400" boxSize={4} />
      </MotionBox>
    </HStack>
  </MotionBox>
);

// ─── Animated connecting line ────────────────────────────────────────
const ConnectingLine = ({ delay }) => (
  <HStack spacing={0} w="full" align="center">
    <MotionBox
      flex="1"
      h="2px"
      bgGradient="linear(to-r, rgba(0,198,224,0.5), rgba(0,198,224,0.15))"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      style={{ originX: 0 }}
    />
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay + 0.4 }}
    >
      <Icon as={ArrowRight} color="rgba(0, 198, 224, 0.5)" boxSize={4} />
    </MotionBox>
  </HStack>
);

// ─── Data ────────────────────────────────────────────────────────────
const accounts = [
  { name: 'Apex Account 1', label: 'Funded — 50K' },
  { name: 'TopStep Account', label: 'Funded — 150K' },
  { name: 'Apex Account 2', label: 'Funded — 50K' },
  { name: 'Personal Account', label: 'Demo' },
];

const benefits = [
  {
    icon: Radio,
    title: 'One Signal, All Accounts',
    description:
      'Send a single TradingView alert or webhook and every connected account executes the same trade. No duplicating signals, no manual work.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Built for Prop Traders',
    description:
      'Managing five funded accounts? Ten? Mirror your strategy across all of them from a single source. Each account trades independently with its own position tracking.',
  },
  {
    icon: DollarSign,
    title: 'Zero Extra Cost',
    description:
      'Trade mirroring is included in every plan that supports multiple accounts. No per-account fees, no per-trade surcharges. One subscription covers everything.',
  },
  {
    icon: Zap,
    title: 'Simultaneous Execution',
    description:
      'All accounts receive and execute the signal at the same time. Sub-100ms delivery ensures your entries and exits stay in sync across every account.',
  },
];

// ─── Main Component ──────────────────────────────────────────────────
const TradeMirroring = () => {
  return (
    <Box
      as="section"
      id="trade-mirroring"
      py={20}
      bg="black"
      position="relative"
      overflow="hidden"
      aria-label="Trade mirroring — broadcast one signal to all your accounts"
    >
      {/* Background glow */}
      <Box
        position="absolute"
        top="30%"
        left="5%"
        width="40%"
        height="40%"
        bgGradient="radial(circle, rgba(0,198,224,0.08) 0%, rgba(0,0,0,0) 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="10%"
        right="8%"
        width="30%"
        height="30%"
        bgGradient="radial(circle, rgba(0,198,224,0.05) 0%, rgba(0,0,0,0) 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />

      <Container maxW="7xl" px={{ base: 4, md: 8 }}>
        <VStack spacing={12}>
          {/* ── Section Heading ──────────────────────────────────── */}
          <VStack spacing={4} textAlign="center" maxW="800px">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Heading as="h2" size="2xl" color="white" fontWeight="bold">
                One Signal, Every Account —{' '}
                <Text
                  as="span"
                  bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                  bgClip="text"
                >
                  Trade Mirroring
                </Text>
              </Heading>
            </MotionBox>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Text color="whiteAlpha.800" fontSize="lg">
                Broadcast a single webhook to all of your connected accounts
                simultaneously. Built for prop traders managing multiple funded
                accounts.
              </Text>
            </MotionBox>
          </VStack>

          {/* ── Fan-Out Diagram ──────────────────────────────────── */}
          <MotionBox
            w="full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Box
              bg="rgba(255, 255, 255, 0.05)"
              border="1px solid rgba(0, 198, 224, 0.15)"
              borderRadius="2xl"
              p={{ base: 6, md: 10 }}
            >
              {/* ── Desktop layout ─────────────────────────────── */}
              <Flex
                display={{ base: 'none', lg: 'flex' }}
                direction="row"
                align="stretch"
                gap={0}
              >
                {/* Signal source card */}
                <Flex
                  flex="0 0 260px"
                  direction="column"
                  justify="center"
                  align="center"
                >
                  <Box
                    position="relative"
                    p={8}
                    bg="rgba(255, 255, 255, 0.1)"
                    backdropFilter="blur(10px)"
                    borderRadius="xl"
                    border="1px solid rgba(0, 198, 224, 0.3)"
                    boxShadow="0 0 30px rgba(0, 198, 224, 0.1)"
                    w="full"
                    textAlign="center"
                  >
                    {/* Pulsing dot */}
                    <Box
                      position="absolute"
                      top={3}
                      left={3}
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg="rgba(0, 198, 224, 1)"
                      sx={{
                        '@keyframes pulse': {
                          '0%': {
                            boxShadow: '0 0 0 0 rgba(0, 198, 224, 0.7)',
                          },
                          '70%': {
                            boxShadow: '0 0 0 10px rgba(0, 198, 224, 0)',
                          },
                          '100%': {
                            boxShadow: '0 0 0 0 rgba(0, 198, 224, 0)',
                          },
                        },
                        animation: 'pulse 2s infinite',
                      }}
                    />

                    <VStack spacing={3}>
                      <Box
                        p={3}
                        bg="rgba(0, 198, 224, 0.15)"
                        borderRadius="lg"
                        color="rgba(0, 198, 224, 1)"
                      >
                        <Icon as={Radio} boxSize={8} />
                      </Box>
                      <Text
                        color="white"
                        fontSize="lg"
                        fontWeight="bold"
                      >
                        Your Signal
                      </Text>
                      <Text color="whiteAlpha.600" fontSize="sm">
                        TradingView Webhook
                      </Text>
                      <Badge
                        px={3}
                        py={1}
                        borderRadius="md"
                        bg="rgba(72, 187, 120, 0.15)"
                        color="green.300"
                        fontSize="xs"
                        fontWeight="600"
                      >
                        BUY 2 NQ
                      </Badge>
                    </VStack>
                  </Box>
                </Flex>

                {/* Connecting lines */}
                <Flex
                  flex="1"
                  direction="column"
                  justify="center"
                  px={4}
                  gap={3}
                  minW="120px"
                >
                  {accounts.map((_, i) => (
                    <ConnectingLine key={i} delay={0.5 + i * 0.15} />
                  ))}
                </Flex>

                {/* Account cards */}
                <Flex flex="0 0 280px" direction="column" justify="center">
                  <VStack spacing={3} w="full">
                    {accounts.map((account, i) => (
                      <AccountCard
                        key={account.name}
                        name={account.name}
                        label={account.label}
                        delay={0.7 + i * 0.15}
                      />
                    ))}
                  </VStack>
                </Flex>
              </Flex>

              {/* ── Mobile layout ──────────────────────────────── */}
              <Flex
                display={{ base: 'flex', lg: 'none' }}
                direction="column"
                align="center"
                gap={0}
              >
                {/* Signal source card */}
                <Box
                  position="relative"
                  p={6}
                  bg="rgba(255, 255, 255, 0.1)"
                  backdropFilter="blur(10px)"
                  borderRadius="xl"
                  border="1px solid rgba(0, 198, 224, 0.3)"
                  boxShadow="0 0 30px rgba(0, 198, 224, 0.1)"
                  w="full"
                  maxW="300px"
                  textAlign="center"
                >
                  {/* Pulsing dot */}
                  <Box
                    position="absolute"
                    top={3}
                    left={3}
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg="rgba(0, 198, 224, 1)"
                    sx={{
                      '@keyframes pulse': {
                        '0%': {
                          boxShadow: '0 0 0 0 rgba(0, 198, 224, 0.7)',
                        },
                        '70%': {
                          boxShadow: '0 0 0 10px rgba(0, 198, 224, 0)',
                        },
                        '100%': {
                          boxShadow: '0 0 0 0 rgba(0, 198, 224, 0)',
                        },
                      },
                      animation: 'pulse 2s infinite',
                    }}
                  />

                  <VStack spacing={3}>
                    <Box
                      p={3}
                      bg="rgba(0, 198, 224, 0.15)"
                      borderRadius="lg"
                      color="rgba(0, 198, 224, 1)"
                    >
                      <Icon as={Radio} boxSize={7} />
                    </Box>
                    <Text color="white" fontSize="md" fontWeight="bold">
                      Your Signal
                    </Text>
                    <Text color="whiteAlpha.600" fontSize="sm">
                      TradingView Webhook
                    </Text>
                    <Badge
                      px={3}
                      py={1}
                      borderRadius="md"
                      bg="rgba(72, 187, 120, 0.15)"
                      color="green.300"
                      fontSize="xs"
                      fontWeight="600"
                    >
                      BUY 2 NQ
                    </Badge>
                  </VStack>
                </Box>

                {/* Vertical connector */}
                <VStack spacing={0} py={2}>
                  <Box
                    w="2px"
                    h="30px"
                    bgGradient="linear(to-b, rgba(0,198,224,0.5), rgba(0,198,224,0.2))"
                  />
                  <Icon
                    as={ChevronDown}
                    color="rgba(0, 198, 224, 0.5)"
                    boxSize={5}
                  />
                </VStack>

                {/* Account cards */}
                <VStack spacing={3} w="full" maxW="340px">
                  {accounts.map((account, i) => (
                    <AccountCard
                      key={account.name}
                      name={account.name}
                      label={account.label}
                      delay={0.4 + i * 0.1}
                    />
                  ))}
                </VStack>
              </Flex>
            </Box>
          </MotionBox>

          {/* ── Benefit Cards ────────────────────────────────────── */}
          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 4 }}
            spacing={8}
            w="full"
          >
            {benefits.map((benefit, index) => (
              <MotionBox
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <BenefitCard {...benefit} />
              </MotionBox>
            ))}
          </SimpleGrid>

          {/* ── Clarification Callout ────────────────────────────── */}
          <MotionBox
            w="full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Box
              p={6}
              bg="rgba(0, 198, 224, 0.05)"
              borderRadius="xl"
              border="1px solid rgba(0, 198, 224, 0.15)"
              textAlign="center"
            >
              <Text color="whiteAlpha.900" fontSize="md" fontWeight="500">
                This is{' '}
                <Text
                  as="span"
                  color="rgba(0, 198, 224, 1)"
                  fontWeight="bold"
                >
                  your signal
                </Text>{' '}
                mirrored to{' '}
                <Text
                  as="span"
                  color="rgba(0, 198, 224, 1)"
                  fontWeight="bold"
                >
                  your accounts
                </Text>
                .
              </Text>
              <Text color="whiteAlpha.700" fontSize="sm" mt={2}>
                Trade mirroring is not social copy trading. You control the
                strategy. You own every account. Atomik simply broadcasts your
                signal to all of them at once.
              </Text>
            </Box>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
};

export default TradeMirroring;
