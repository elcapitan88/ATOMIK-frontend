import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  useToast,
  Spinner,
  Container,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/utils/logger';

const MotionBox = motion(Box);

const pageVariants = {
  initial: { 
    opacity: 0,
    y: 20
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const PricingPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const stripeInitialized = useRef(false);
  const mounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Auth check
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Initialize Stripe once
  useEffect(() => {
    const initializeStripe = () => {
      try {
        // Get registration data
        const registrationData = localStorage.getItem('pendingRegistration');
        if (!registrationData) {
          navigate('/auth', { replace: true });
          return;
        }

        const registration = JSON.parse(registrationData);
        if (!registration?.email) {
          throw new Error('Invalid registration data');
        }

        // Get container
        const container = document.getElementById('pricing-table-container');
        if (!container) return;

        // Set up pricing table
        const pricingTable = document.createElement('stripe-pricing-table');
        const successUrl = `${process.env.REACT_APP_STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = process.env.REACT_APP_STRIPE_CANCEL_URL || `${window.location.origin}/pricing`;

        // Required configuration
        pricingTable.setAttribute('pricing-table-id', process.env.REACT_APP_STRIPE_PRICING_TABLE_ID);
        pricingTable.setAttribute('publishable-key', process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
        pricingTable.setAttribute('customer-email', registration.email);
        pricingTable.setAttribute('success-url', successUrl);
        pricingTable.setAttribute('cancel-url', cancelUrl);

        // Clean up existing table if any
        container.innerHTML = '';
        container.appendChild(pricingTable);

      } catch (error) {
        logger.error('Pricing table initialization failed:', error);
        
        if (mounted.current) {
          toast({
            title: "Error",
            description: "Failed to load payment options. Please try again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });

          navigate('/auth', { replace: true });
        }
      }
    };

    if (!isAuthenticated && !stripeInitialized.current) {
      stripeInitialized.current = true;
      // Small delay to ensure DOM is ready
      setTimeout(initializeStripe, 100);
    }
  }, [isAuthenticated, navigate, toast]);

  return (
    <MotionBox 
      minH="100vh" 
      bg="background" 
      py={10} 
      px={4}
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      <Container maxW="7xl">
        <VStack spacing={8}>
          {/* Header */}
          <VStack spacing={4}>
            <Text 
              fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
              fontWeight="bold"
              color="white"
              textAlign="center"
            >
              Choose Your Plan
            </Text>
            <Text
              fontSize={{ base: "md", md: "lg" }}
              color="whiteAlpha.800"
              textAlign="center"
              maxW="2xl"
            >
              Get started with our flexible pricing options. Cancel anytime.
            </Text>
          </VStack>
          
          {/* Pricing Table */}
          <Box 
            id="pricing-table-container"
            w="full" 
            maxW="1200px"
            position="relative"
            backdropFilter="blur(10px)"
            bg="whiteAlpha.50"
            borderRadius="xl"
            overflow="hidden"
            minH="500px"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Spinner 
              size="xl" 
              color="blue.400" 
              thickness="4px"
              position="absolute"
              zIndex={0}
            />
          </Box>

          {/* Footer */}
          <VStack spacing={2} mt={4}>
            <Text
              fontSize="sm"
              color="whiteAlpha.700"
              textAlign="center"
            >
              Secure payments powered by Stripe
            </Text>
            <Text
              fontSize="sm"
              color="whiteAlpha.600"
              textAlign="center"
            >
              SSL encrypted payment
            </Text>
          </VStack>
        </VStack>
      </Container>
    </MotionBox>
  );
};

export default PricingPage;