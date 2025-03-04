import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  useToast,
  Spinner,
  Container,
  Flex,
  Center,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/utils/logger';
import { ShieldCheck, Lock, CreditCard } from 'lucide-react';

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
        // Log environment info for debugging
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        logger.info('Initializing Stripe pricing table', {
          hostname: window.location.hostname,
          origin: window.location.origin,
          isLocalHost: isLocalHost,
          nodeEnv: process.env.NODE_ENV
        });
        
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
        
        // Force correct success URL based on current hostname
        let successUrl;
        if (isLocalHost) {
          successUrl = `http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(registration.email)}`;
        } else {
          // Force production URL regardless of environment variable
          successUrl = `https://www.atomiktrading.io/payment/success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(registration.email)}`;
        }

        // Force correct cancel URL based on current hostname
        let cancelUrl;
        if (isLocalHost) {
          cancelUrl = 'http://localhost:3000/pricing';
        } else {
          // Force production URL regardless of environment variable
          cancelUrl = 'https://www.atomiktrading.io/pricing';
        }

        // Required configuration
        pricingTable.setAttribute('pricing-table-id', process.env.REACT_APP_STRIPE_PRICING_TABLE_ID);
        pricingTable.setAttribute('publishable-key', process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
        pricingTable.setAttribute('customer-email', registration.email);
        pricingTable.setAttribute('success-url', successUrl);
        pricingTable.setAttribute('cancel-url', cancelUrl);

        // Clean up existing table if any
        container.innerHTML = '';
        container.appendChild(pricingTable);

        // Debug info
        logger.info('Stripe table initialized with:', {
          email: registration.email,
          successUrl,
          cancelUrl,
          tableId: process.env.REACT_APP_STRIPE_PRICING_TABLE_ID,
          // Don't log the publishable key for security
        });
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
      <Container maxW="100%" px={0}>
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
          
          {/* Direct Pricing Table Container */}
          <div id="pricing-table-container" style={{width: '100%', minHeight: '500px', position: 'relative'}}>
            <Spinner 
              size="xl" 
              color="#00c6e0" 
              thickness="4px"
              position="absolute"
              left="50%"
              top="50%"
              transform="translate(-50%, -50%)"
              zIndex={0}
            />
          </div>

          {/* Security Badges */}
          <Box 
            mt={8} 
            py={4} 
            px={8} 
            borderRadius="xl"
            maxW="3xl"
            mx="auto"
            w="full"
          >
            <VStack spacing={5}>
              <Text
                fontSize="lg"
                fontWeight="medium"
                color="white"
                textAlign="center"
              >
                Your Security Is Our Priority
              </Text>
              
              <Flex 
                w="full" 
                justify="space-around" 
                direction={{ base: 'column', sm: 'row' }} 
                align="center"
                wrap="wrap"
                gap={6}
              >
                <VStack spacing={2}>
                  <Center 
                    w={12} 
                    h={12} 
                    borderRadius="full" 
                    bg="rgba(0, 0, 0, 0.4)" 
                    color="#00c6e0"
                    border="1px solid rgba(0, 198, 224, 0.3)"
                    boxShadow="0 0 15px rgba(0, 198, 224, 0.1)"
                  >
                    <Lock size={22} />
                  </Center>
                  <Text color="whiteAlpha.900" fontSize="sm" fontWeight="medium" textAlign="center">
                    256-bit SSL Encryption
                  </Text>
                </VStack>
                
                <VStack spacing={2}>
                  <Center 
                    w={12} 
                    h={12} 
                    borderRadius="full" 
                    bg="rgba(0, 0, 0, 0.4)" 
                    color="#00c6e0"
                    border="1px solid rgba(0, 198, 224, 0.3)"
                    boxShadow="0 0 15px rgba(0, 198, 224, 0.1)"
                  >
                    <ShieldCheck size={22} />
                  </Center>
                  <Text color="whiteAlpha.900" fontSize="sm" fontWeight="medium" textAlign="center">
                    PCI DSS Compliant
                  </Text>
                </VStack>
                
                <VStack spacing={2}>
                  <Center 
                    w={12} 
                    h={12} 
                    borderRadius="full" 
                    bg="rgba(0, 0, 0, 0.4)" 
                    color="#00c6e0"
                    border="1px solid rgba(0, 198, 224, 0.3)"
                    boxShadow="0 0 15px rgba(0, 198, 224, 0.1)"
                  >
                    <CreditCard size={22} />
                  </Center>
                  <Text color="whiteAlpha.900" fontSize="sm" fontWeight="medium" textAlign="center">
                    Secure Payment Processing
                  </Text>
                </VStack>
              </Flex>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </MotionBox>
  );
};

export default PricingPage;