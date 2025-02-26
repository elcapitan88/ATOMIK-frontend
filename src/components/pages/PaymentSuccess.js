import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Icon,
  useToast,
  Spinner,
  Button,
  Heading,
  Container,
} from '@chakra-ui/react';
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Home 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/services/axiosConfig';
import logger from '@/utils/logger';

const MotionBox = motion(Box);

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const AUTO_REDIRECT_DELAY = 2000; // 2 seconds

const PaymentSuccess = () => {
  // State
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Hooks
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  
  // Refs for cleanup and state tracking
  const mounted = useRef(true);
  const verificationAttempted = useRef(false);
  const redirectTimeout = useRef(null);

  // Detect incorrect URL and redirect if necessary
  useEffect(() => {
    const isProduction = window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1';
    
    const urlContainsLocalhost = window.location.href.includes('localhost');
    
    // If we're in production but the URL contains localhost, redirect to production
    if (isProduction && urlContainsLocalhost) {
      logger.warning('Detected localhost URL in production environment, redirecting...');
      
      // Get all current URL parameters
      const params = new URLSearchParams(searchParams);
      
      // Create the correct production URL
      const productionUrl = new URL('/payment/success', 'https://atomiktrading.io');
      
      // Add all current parameters to the new URL
      params.forEach((value, key) => {
        productionUrl.searchParams.append(key, value);
      });
      
      logger.info(`Redirecting to: ${productionUrl.toString()}`);
      
      // Redirect to the correct URL
      window.location.href = productionUrl.toString();
      return;
    }
    
    // Log environment info
    logger.info('PaymentSuccess component mounted', {
      hostname: window.location.hostname,
      url: window.location.href,
      isProduction: isProduction,
      params: Object.fromEntries(searchParams.entries())
    });
  }, [searchParams]);

  // Setup & Cleanup
  useEffect(() => {
    mounted.current = true;
    
    // Clear any existing timeouts
    return () => {
      mounted.current = false;
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, []);

  // Handle authentication redirect
  useEffect(() => {
    if (isAuthenticated) {
      logger.info('User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Main verification logic
  useEffect(() => {
    const verifyPaymentAndLogin = async () => {
      if (verificationAttempted.current) return;
      verificationAttempted.current = true;

      try {
        logger.info('Starting payment verification...');

        // Get and validate session ID
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          throw new Error('No session ID found');
        }

        // Get email from URL (our fallback mechanism)
        const emailFromUrl = searchParams.get('email');
        
        // Get registration data from localStorage
        const pendingRegistrationStr = localStorage.getItem('pendingRegistration');
        
        logger.debug('Registration data check:', {
          hasLocalStorageData: !!pendingRegistrationStr,
          hasEmailInParams: !!emailFromUrl,
          localStorage: pendingRegistrationStr ? '[EXISTS]' : '[MISSING]'
        });
        
        if (!pendingRegistrationStr && !emailFromUrl) {
          throw new Error('No registration data found');
        }

        // Parse registration data with fallbacks
        let pendingRegistration;
        try {
          pendingRegistration = pendingRegistrationStr 
            ? JSON.parse(pendingRegistrationStr) 
            : { email: emailFromUrl ? decodeURIComponent(emailFromUrl) : null };
          
          // If we have email from URL but not in localStorage, use the URL email
          if (emailFromUrl && (!pendingRegistration.email || pendingRegistration.email !== decodeURIComponent(emailFromUrl))) {
            logger.info('Using email from URL instead of localStorage:', emailFromUrl);
            pendingRegistration.email = decodeURIComponent(emailFromUrl);
          }
        } catch (e) {
          logger.error('Failed to parse registration data:', e);
          
          // Fallback to email from URL if available
          if (emailFromUrl) {
            pendingRegistration = { email: decodeURIComponent(emailFromUrl) };
            logger.info('Using email from URL as fallback:', emailFromUrl);
          } else {
            throw new Error('Invalid registration data format');
          }
        }

        // Validate registration data
        if (!pendingRegistration?.email) {
          logger.error('Missing registration fields:', pendingRegistration);
          throw new Error('Invalid registration data');
        }

        // If we don't have password but have email, we might need to prompt user
        if (!pendingRegistration?.password && pendingRegistration?.email) {
          logger.warning('Missing password in registration data. Would need user input in a production scenario');
          // For now, just use the email as password for demo purposes
          pendingRegistration.password = pendingRegistration.email; // DEMO ONLY
        }

        // Verify session
        logger.info('Verifying session:', sessionId);
        const verifyResponse = await axiosInstance.get(
          `/api/v1/subscriptions/verify-session/${sessionId}`
        );

        if (!verifyResponse.data.valid) {
          logger.error('Session verification failed:', verifyResponse.data);
          throw new Error(verifyResponse.data.reason || 'Payment verification failed');
        }

        // Attempt login
        logger.info('Payment verified, attempting login with:', {
          email: pendingRegistration.email,
          hasPassword: !!pendingRegistration.password
        });
        
        const loginResult = await login({
          email: pendingRegistration.email,
          password: pendingRegistration.password
        });

        if (!loginResult.success) {
          throw new Error(loginResult.error || 'Login failed');
        }

        // Success - update state and schedule redirect
        if (mounted.current) {
          setStatus('success');
          localStorage.removeItem('pendingRegistration');
          
          toast({
            title: 'Welcome to Atomik Trading!',
            description: 'Your account is ready.',
            status: 'success',
            duration: 5000,
          });

          // Schedule redirect with animation delay
          redirectTimeout.current = setTimeout(() => {
            if (mounted.current) {
              navigate('/dashboard', { replace: true });
            }
          }, AUTO_REDIRECT_DELAY);
        }

      } catch (error) {
        logger.error('Payment verification error:', error);
        
        if (mounted.current) {
          // Check if we should retry
          if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1);
            setIsRetrying(true);
            setError(`Verification failed. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            
            // Schedule retry
            setTimeout(() => {
              if (mounted.current) {
                setIsRetrying(false);
                verificationAttempted.current = false;
                verifyPaymentAndLogin();
              }
            }, RETRY_DELAY);
          } else {
            setStatus('error');
            setError(error.message);
            
            toast({
              title: 'Setup Failed',
              description: error.message,
              status: 'error',
              duration: null,
              isClosable: true,
            });
          }
        }
      }
    };

    // Start verification if not authenticated
    if (!isAuthenticated) {
      verifyPaymentAndLogin();
    }
  }, [isAuthenticated, navigate, searchParams, login, retryCount, toast]);

  // Manual retry handler
  const handleRetry = () => {
    if (isRetrying) return;
    
    setRetryCount(0);
    verificationAttempted.current = false;
    setStatus('loading');
    setError(null);
    
    const sessionId = searchParams.get('session_id');
    const pendingRegistrationStr = localStorage.getItem('pendingRegistration');
    const emailFromUrl = searchParams.get('email');
    
    if ((sessionId && pendingRegistrationStr) || (sessionId && emailFromUrl)) {
      verificationAttempted.current = false;
    } else {
      navigate('/auth', { replace: true });
    }
  };

  // Loading State
  if (status === 'loading') {
    return (
      <Container maxW="xl" centerContent minH="100vh" py={20}>
        <AnimatePresence>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <VStack spacing={6}>
              <Spinner
                size="xl"
                color="blue.400"
                thickness="4px"
                speed="0.65s"
              />
              <Heading
                fontSize="2xl"
                color="white"
                textAlign="center"
              >
                {isRetrying ? 'Retrying Verification...' : 'Setting Up Your Account'}
              </Heading>
              <Text
                color="whiteAlpha.800"
                fontSize="md"
                textAlign="center"
                maxW="sm"
              >
                {error || 'Please wait while we complete your registration'}
              </Text>
            </VStack>
          </MotionBox>
        </AnimatePresence>
      </Container>
    );
  }

  // Success State
  if (status === 'success') {
    return (
      <Container maxW="xl" centerContent minH="100vh" py={20}>
        <AnimatePresence>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <VStack spacing={8}>
              <Icon 
                as={CheckCircle} 
                w={16} 
                h={16} 
                color="green.400"
                className="animate-pulse"
              />
              <VStack spacing={4}>
                <Heading
                  fontSize="3xl"
                  color="green.400"
                  textAlign="center"
                >
                  Setup Complete!
                </Heading>
                <Text
                  color="whiteAlpha.900"
                  fontSize="lg"
                  textAlign="center"
                >
                  Redirecting to your dashboard...
                </Text>
              </VStack>
            </VStack>
          </MotionBox>
        </AnimatePresence>
      </Container>
    );
  }

  // Error State
  return (
    <Container maxW="xl" centerContent minH="100vh" py={20}>
      <AnimatePresence>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Box
            bg="whiteAlpha.50"
            backdropFilter="blur(10px)"
            borderRadius="xl"
            p={8}
            maxW="md"
            w="full"
            boxShadow="lg"
            border="1px solid"
            borderColor="whiteAlpha.100"
          >
            <VStack spacing={8}>
              <Icon as={AlertCircle} w={16} h={16} color="red.400" />
              <VStack spacing={4}>
                <Heading
                  fontSize="2xl"
                  color="red.400"
                  textAlign="center"
                >
                  Setup Failed
                </Heading>
                <Text
                  color="whiteAlpha.800"
                  fontSize="md"
                  textAlign="center"
                >
                  {error || 'An unexpected error occurred'}
                </Text>
                <Text
                  color="whiteAlpha.600"
                  fontSize="sm"
                  textAlign="center"
                >
                  Please try again or contact support if this issue persists
                </Text>
              </VStack>
              
              <VStack spacing={4} w="full">
                <Button
                  leftIcon={<RefreshCw size={16} />}
                  onClick={handleRetry}
                  variant="outline"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={isRetrying}
                  loadingText="Retrying..."
                >
                  Try Again
                </Button>
                
                <Button
                  as={RouterLink}
                  to="/auth"
                  leftIcon={<Home size={16} />}
                  variant="ghost"
                  size="md"
                  width="full"
                  replace
                >
                  Return to Login
                </Button>
              </VStack>
            </VStack>
          </Box>
        </MotionBox>
      </AnimatePresence>
    </Container>
  );
};

export default PaymentSuccess;