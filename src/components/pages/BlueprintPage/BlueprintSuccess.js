import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import { CheckCircle, Mail, MessageCircle, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const MotionBox = motion(Box);

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const BlueprintSuccess = () => {
  return (
    <>
      <Helmet>
        <title>Check Your Email | Atomik</title>
      </Helmet>

      <Box
        minH="100vh"
        bg="black"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        overflow="hidden"
      >
        {/* Background gradient orbs */}
        <Box
          position="absolute"
          top="-20%"
          left="-10%"
          w="50%"
          h="50%"
          bg="radial-gradient(circle, rgba(0, 198, 224, 0.15) 0%, transparent 70%)"
          filter="blur(80px)"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom="-20%"
          right="-10%"
          w="50%"
          h="50%"
          bg="radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)"
          filter="blur(80px)"
          pointerEvents="none"
        />

        <Container maxW="container.sm" py={12}>
          <MotionBox
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            bg="rgba(255, 255, 255, 0.05)"
            borderRadius="2xl"
            border="1px solid rgba(255, 255, 255, 0.1)"
            p={{ base: 8, md: 12 }}
            textAlign="center"
          >
            <VStack spacing={6}>
              {/* Success Icon */}
              <Box
                p={4}
                borderRadius="full"
                bg="rgba(16, 185, 129, 0.2)"
              >
                <Icon
                  as={CheckCircle}
                  boxSize={16}
                  color="#10B981"
                />
              </Box>

              {/* Heading */}
              <VStack spacing={2}>
                <Heading
                  as="h1"
                  fontSize={{ base: '2xl', md: '3xl' }}
                  color="white"
                >
                  You're In!
                </Heading>
                <Text color="gray.400" fontSize="lg">
                  Check your email for the blueprint.
                </Text>
              </VStack>

              {/* Instructions */}
              <Box
                bg="rgba(255, 255, 255, 0.05)"
                borderRadius="lg"
                p={6}
                w="100%"
              >
                <VStack spacing={4} align="stretch">
                  <HStack spacing={4}>
                    <Icon as={Mail} color="#00C6E0" boxSize={5} />
                    <Text color="gray.300" fontSize="sm" textAlign="left">
                      Check your inbox (and spam folder) for an email from Atomik
                    </Text>
                  </HStack>
                  <HStack spacing={4}>
                    <Icon as={ArrowRight} color="#00C6E0" boxSize={5} />
                    <Text color="gray.300" fontSize="sm" textAlign="left">
                      Click the link to access your free blueprint video
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              {/* While You Wait */}
              <VStack spacing={4} pt={4}>
                <Text color="gray.500" fontSize="sm">
                  While you wait...
                </Text>

                <Button
                  as="a"
                  href="https://discord.gg/atomik"
                  target="_blank"
                  rel="noopener noreferrer"
                  leftIcon={<MessageCircle size={18} />}
                  bg="rgba(88, 101, 242, 0.2)"
                  color="#5865F2"
                  border="1px solid rgba(88, 101, 242, 0.3)"
                  _hover={{
                    bg: 'rgba(88, 101, 242, 0.3)',
                    transform: 'translateY(-2px)'
                  }}
                  transition="all 0.2s"
                >
                  Join the Discord Community
                </Button>

                <Text color="gray.600" fontSize="xs">
                  See live trade signals and chat with other traders
                </Text>
              </VStack>

              {/* Secondary CTA */}
              <Box pt={4}>
                <Button
                  as={RouterLink}
                  to="/marketplace"
                  variant="ghost"
                  color="gray.400"
                  rightIcon={<ArrowRight size={16} />}
                  _hover={{
                    color: '#00C6E0',
                    bg: 'transparent'
                  }}
                >
                  Browse the Strategy Marketplace
                </Button>
              </Box>
            </VStack>
          </MotionBox>
        </Container>
      </Box>
    </>
  );
};

export default BlueprintSuccess;
