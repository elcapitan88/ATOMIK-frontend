import React from 'react';
import { Box, Container, Heading, Text, VStack, HStack, Button, Icon } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { keyframes } from '@emotion/react';
import { ArrowRight, Check } from 'lucide-react';

const MotionBox = motion(Box);

// Pulsing glow on the card border
const borderPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(0,198,224,0.08), inset 0 0 20px rgba(0,198,224,0.02);
    border-color: rgba(0,198,224,0.15);
  }
  50% {
    box-shadow: 0 0 40px rgba(0,198,224,0.18), inset 0 0 30px rgba(0,198,224,0.04);
    border-color: rgba(0,198,224,0.35);
  }
`;

// Subtle glow pulse on the CTA button
const ctaGlow = keyframes`
  0%, 100% { box-shadow: 0 4px 15px rgba(0,198,224,0.3); }
  50% { box-shadow: 0 4px 25px rgba(0,198,224,0.5), 0 0 40px rgba(0,198,224,0.15); }
`;

const valueProps = [
  "7-day free trial",
  "No credit card required",
  "Cancel anytime"
];

const PricingCTA = () => {
  return (
    <Box
      py={{ base: 12, md: 20 }}
      bg="black"
      position="relative"
      overflow="hidden"
    >
      {/* Background glow */}
      <Box
        position="absolute"
        inset="0"
        bg="radial-gradient(ellipse at 50% 50%, rgba(0,198,224,0.06) 0%, transparent 60%)"
        pointerEvents="none"
      />

      <Container maxW="5xl" px={{ base: 4, md: 8 }}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <VStack
            spacing={8}
            textAlign="center"
            p={{ base: 8, md: 14 }}
            bg="rgba(255, 255, 255, 0.02)"
            borderRadius="2xl"
            border="1px solid rgba(0, 198, 224, 0.15)"
            position="relative"
            sx={{ animation: `${borderPulse} 4s ease-in-out infinite` }}
          >
            {/* Heading */}
            <VStack spacing={4}>
              <Heading
                as="h2"
                size={{ base: "xl", md: "2xl" }}
                color="white"
                fontWeight="bold"
                fontFamily="'Satoshi', sans-serif"
              >
                Ready to Automate Your
                <Text
                  as="span"
                  bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                  bgClip="text"
                  px={2}
                >
                  Trading?
                </Text>
              </Heading>
              <Text
                color="whiteAlpha.700"
                fontSize={{ base: "md", md: "lg" }}
                maxW="500px"
              >
                Join traders automating their strategies with zero per-trade fees
              </Text>
            </VStack>

            {/* Value proposition pills */}
            <HStack
              spacing={{ base: 2, md: 4 }}
              flexWrap="wrap"
              justify="center"
            >
              {valueProps.map((prop) => (
                <HStack
                  key={prop}
                  spacing={1.5}
                  px={3}
                  py={1.5}
                  borderRadius="full"
                  bg="rgba(0, 198, 224, 0.06)"
                  border="1px solid rgba(0, 198, 224, 0.12)"
                >
                  <Icon as={Check} boxSize={3.5} color="rgba(0, 198, 224, 0.8)" />
                  <Text color="whiteAlpha.700" fontSize="sm" fontWeight="500">
                    {prop}
                  </Text>
                </HStack>
              ))}
            </HStack>

            {/* CTA */}
            <VStack spacing={3} pt={2}>
              <RouterLink to="/pricing">
                <Button
                  size="lg"
                  h="56px"
                  px={10}
                  fontSize="md"
                  fontWeight="600"
                  bgGradient="linear(135deg, #00C6E0 0%, #0099B8 100%)"
                  color="white"
                  borderRadius="xl"
                  rightIcon={<Icon as={ArrowRight} boxSize={5} />}
                  sx={{ animation: `${ctaGlow} 3s ease-in-out infinite` }}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 30px rgba(0, 198, 224, 0.5)',
                  }}
                  transition="all 0.2s"
                >
                  Start Free Trial
                </Button>
              </RouterLink>
              <RouterLink to="/pricing">
                <Text
                  color="whiteAlpha.500"
                  fontSize="sm"
                  fontWeight="500"
                  cursor="pointer"
                  transition="color 0.2s"
                  _hover={{ color: 'rgba(0, 198, 224, 0.8)' }}
                >
                  View pricing details →
                </Text>
              </RouterLink>
            </VStack>

            {/* Risk disclaimer */}
            <Text
              color="whiteAlpha.400"
              fontSize="xs"
            >
              Trading involves risk. See our full risk disclosure below.
            </Text>
          </VStack>
        </MotionBox>
      </Container>
    </Box>
  );
};

export default PricingCTA;
