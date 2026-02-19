import React from 'react';
import { Box, Container, SimpleGrid, Heading, Text, VStack, Icon } from '@chakra-ui/react';
import { User, TrendingUp, Store } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const AudienceCard = ({ icon, title, description }) => (
  <MotionBox
    whileHover={{ y: -5 }}
    p={6}
    bg="rgba(255, 255, 255, 0.1)"
    backdropFilter="blur(10px)"
    borderRadius="xl"
    border="1px solid rgba(255, 255, 255, 0.18)"
    transition="all 0.3s"
    h="full"
  >
    <VStack spacing={4} align="flex-start">
      <Box
        p={2}
        bg="rgba(0, 198, 224, 0.1)"
        borderRadius="lg"
        color="rgba(0, 198, 224, 1)"
      >
        <Icon as={icon} boxSize={6} />
      </Box>
      <Heading as="h3" size="md" color="white">
        {title}
      </Heading>
      <Text color="whiteAlpha.800" fontSize="sm" lineHeight="tall">
        {description}
      </Text>
    </VStack>
  </MotionBox>
);

const WhoItsFor = () => {
  const audiences = [
    {
      icon: User,
      title: 'Beginner Traders',
      description: "New to automation? Connect TradingView alerts to your broker without writing a single line of code. Our platform handles the technical complexity so you can focus on learning."
    },
    {
      icon: TrendingUp,
      title: 'Prop & Funded Traders',
      description: "Automate your funded account strategies across Apex and other prop firms. Manage multiple accounts from a single dashboard."
    },
    {
      icon: Store,
      title: 'Strategy Creators',
      description: "Share your trading strategies on our marketplace. Build a subscriber base and earn recurring revenue from your expertise."
    }
  ];

  return (
    <Box
      py={{ base: 12, md: 20 }}
      bg="black"
      position="relative"
      overflow="hidden"
    >
      {/* Background Elements */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="linear-gradient(180deg, rgba(0,198,224,0.05) 0%, rgba(0,0,0,0) 100%)"
        pointerEvents="none"
      />

      <Container maxW="7xl" px={{ base: 4, md: 8 }}>
        <VStack spacing={{ base: 8, md: 12 }}>
          <VStack spacing={4} textAlign="center" maxW="800px">
            <Heading
              as="h2"
              size={{ base: "xl", md: "2xl" }}
              color="white"
              fontWeight="bold"
              fontFamily="'Satoshi', sans-serif"
            >
              Built For
              <Text
                as="span"
                bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                bgClip="text"
                px={2}
              >
                Every Trader
              </Text>
            </Heading>
            <Text color="whiteAlpha.800" fontSize={{ base: "md", md: "lg" }}>
              Whether you're just starting out or scaling your trading business
            </Text>
          </VStack>

          <SimpleGrid
            columns={{ base: 1, md: 3 }}
            spacing={{ base: 4, md: 8 }}
            w="full"
          >
            {audiences.map((audience, index) => (
              <MotionBox
                key={audience.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <AudienceCard {...audience} />
              </MotionBox>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default WhoItsFor;
