import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Input,
  FormControl,
  FormErrorMessage,
  useToast,
  SimpleGrid,
  Icon,
  Flex
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Clock, ShieldCheck, TrendingUp, Bot } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import axiosInstance from '@/services/axiosConfig';

// Motion components
const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// Email Capture Form Component
const EmailCaptureForm = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);

    try {
      // Get UTM parameters
      const urlParams = new URLSearchParams(window.location.search);

      const response = await axiosInstance.post('/api/v1/leads/blueprint', {
        email: email,
        utm_source: urlParams.get('utm_source') || 'direct',
        utm_medium: urlParams.get('utm_medium') || 'website',
        utm_campaign: urlParams.get('utm_campaign') || 'blueprint'
      });

      if (response.data.success) {
        toast({
          title: "You're in!",
          description: "Check your email for the blueprint.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        navigate('/blueprint/success');
      }
    } catch (err) {
      console.error('Error submitting lead:', err);
      // Still navigate to success even if there's an API error
      // (the backend might have still processed it)
      navigate('/blueprint/success');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack as="form" onSubmit={handleSubmit} spacing={4} w="100%" maxW="400px">
      <FormControl isInvalid={!!error}>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          size="lg"
          bg="rgba(255, 255, 255, 0.1)"
          border="1px solid rgba(255, 255, 255, 0.2)"
          color="white"
          _placeholder={{ color: 'gray.400' }}
          _hover={{ border: '1px solid rgba(0, 198, 224, 0.5)' }}
          _focus={{
            border: '1px solid #00C6E0',
            boxShadow: '0 0 0 1px #00C6E0'
          }}
        />
        {error && <FormErrorMessage>{error}</FormErrorMessage>}
      </FormControl>
      <Button
        type="submit"
        size="lg"
        w="100%"
        bg="#00C6E0"
        color="black"
        fontWeight="bold"
        isLoading={isLoading}
        loadingText="Getting Access..."
        _hover={{
          bg: '#00B0C8',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0, 198, 224, 0.4)'
        }}
        transition="all 0.2s"
      >
        Get Free Access
      </Button>
      <Text fontSize="xs" color="gray.500" textAlign="center">
        No spam. Unsubscribe anytime.
      </Text>
    </VStack>
  );
};

// Feature Item Component
const FeatureItem = ({ icon, text }) => (
  <HStack spacing={3} align="flex-start">
    <Icon as={Check} color="#00C6E0" boxSize={5} mt={0.5} />
    <Text color="gray.300" fontSize="md">{text}</Text>
  </HStack>
);

// Audience Item Component
const AudienceItem = ({ text }) => (
  <HStack spacing={3} align="flex-start">
    <Box
      w={2}
      h={2}
      borderRadius="full"
      bg="#00C6E0"
      mt={2}
      flexShrink={0}
    />
    <Text color="gray.300" fontSize="md">{text}</Text>
  </HStack>
);

const BlueprintPage = () => {
  return (
    <>
      <Helmet>
        <title>Free Trading Automation Blueprint | Atomik</title>
        <meta
          name="description"
          content="Learn how to automate your first trading strategy in 30 minutes. Free 20-minute video guide - no coding required."
        />
      </Helmet>

      <Box
        minH="100vh"
        bg="black"
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
          bg="radial-gradient(circle, rgba(0, 198, 224, 0.1) 0%, transparent 70%)"
          filter="blur(80px)"
          pointerEvents="none"
        />

        <Container maxW="container.lg" py={{ base: 12, md: 20 }} position="relative">
          <MotionVStack
            spacing={{ base: 12, md: 16 }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Hero Section */}
            <MotionBox variants={itemVariants} textAlign="center" maxW="700px">
              <VStack spacing={6}>
                <Heading
                  as="h1"
                  fontSize={{ base: '3xl', md: '5xl' }}
                  fontWeight="bold"
                  color="white"
                  lineHeight="1.2"
                >
                  Automate Your First Trading Strategy in{' '}
                  <Text
                    as="span"
                    bgGradient="linear(to-r, #00C6E0, #0099B8)"
                    bgClip="text"
                  >
                    30 Minutes
                  </Text>
                </Heading>

                <Text
                  fontSize={{ base: 'lg', md: 'xl' }}
                  color="gray.400"
                  maxW="600px"
                >
                  Free 20-minute video guide. No fluff, just the exact steps to connect
                  TradingView alerts to your broker.
                </Text>

                <EmailCaptureForm />
              </VStack>
            </MotionBox>

            {/* What You'll Learn Section */}
            <MotionBox
              variants={itemVariants}
              w="100%"
              bg="rgba(255, 255, 255, 0.05)"
              borderRadius="xl"
              border="1px solid rgba(255, 255, 255, 0.1)"
              p={{ base: 6, md: 8 }}
            >
              <VStack spacing={6} align="stretch">
                <Heading
                  as="h2"
                  fontSize={{ base: 'xl', md: '2xl' }}
                  color="white"
                  textAlign="center"
                >
                  What You'll Learn
                </Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FeatureItem text="The 3 components every automated strategy needs" />
                  <FeatureItem text="Step-by-step TradingView webhook setup" />
                  <FeatureItem text="Live demo connecting to your broker" />
                  <FeatureItem text="Common mistakes that blow up accounts" />
                </SimpleGrid>
              </VStack>
            </MotionBox>

            {/* Who This Is For Section */}
            <MotionBox
              variants={itemVariants}
              w="100%"
              bg="rgba(255, 255, 255, 0.05)"
              borderRadius="xl"
              border="1px solid rgba(255, 255, 255, 0.1)"
              p={{ base: 6, md: 8 }}
            >
              <VStack spacing={6} align="stretch">
                <Heading
                  as="h2"
                  fontSize={{ base: 'xl', md: '2xl' }}
                  color="white"
                  textAlign="center"
                >
                  Who This Is For
                </Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <AudienceItem text="Traders tired of watching charts all day" />
                  <AudienceItem text="TradingView users who want to automate alerts" />
                  <AudienceItem text="Prop traders managing multiple accounts" />
                  <AudienceItem text="Anyone who's lost money from emotional decisions" />
                </SimpleGrid>
              </VStack>
            </MotionBox>

            {/* Trust Indicators */}
            <MotionBox variants={itemVariants}>
              <HStack
                spacing={{ base: 4, md: 8 }}
                justify="center"
                flexWrap="wrap"
                color="gray.500"
                fontSize="sm"
              >
                <HStack>
                  <Icon as={ShieldCheck} />
                  <Text>No coding required</Text>
                </HStack>
                <HStack>
                  <Icon as={Clock} />
                  <Text>20-minute guide</Text>
                </HStack>
                <HStack>
                  <Icon as={Zap} />
                  <Text>Instant access</Text>
                </HStack>
              </HStack>
            </MotionBox>

            {/* Second CTA Section */}
            <MotionBox variants={itemVariants} textAlign="center">
              <VStack spacing={6}>
                <Heading
                  as="h2"
                  fontSize={{ base: 'xl', md: '2xl' }}
                  color="white"
                >
                  Ready to automate your trading?
                </Heading>

                <EmailCaptureForm />
              </VStack>
            </MotionBox>

            {/* Footer */}
            <MotionBox variants={itemVariants}>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                © {new Date().getFullYear()} Atomik Trading. All rights reserved.
              </Text>
            </MotionBox>
          </MotionVStack>
        </Container>
      </Box>
    </>
  );
};

export default BlueprintPage;
