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
import { useNavigate, useSearchParams, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/services/axiosConfig';
import logger from '@/utils/logger';
import affiliateService from '@/services/affiliateService';

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
  const { isAuthenticated, login, register, setAuthenticatedState } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const location = useLocation();
  const registrationDataRef = useRef(null);
  
  // Refs for cleanup and state tracking
  const mounted = useRef(true);
  const verificationAttempted = useRef(false);
  const redirectTimeout = useRef(null);

  useEffect(() => {
    // Immediately cache registration data from localStorage when component mounts
    const pendingData = localStorage.getItem('pendingRegistration');
    if (pendingData) {
      try {
        registrationDataRef.current = JSON.parse(pendingData);
        console.log('Cached registration data on component mount');
      } catch (e) {
        console.error('Failed to parse and cache registration data:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Track successful subscription conversion
    if (window.dataLayer) {
      // Push conversion event to dataLayer
      window.dataLayer.push({
        event: 'subscription_complete',
        ecommerce: {
          purchase: {
            actionField: {
              id: new Date().getTime().toString(), // Generate transaction ID if you don't have one
              revenue: localStorage.getItem('subscriptionValue') || '0',
              tax: '0',
              shipping: '0'
            },
            products: [{
              name: localStorage.getItem('selectedPlan') || 'Subscription',
              id: localStorage.getItem('planId') || 'default_plan',
              price: localStorage.getItem('subscriptionValue') || '0',
              variant: localStorage.getItem('planInterval') || 'monthly',
              quantity: 1
            }]
          }
        }
      });
    }
    
    // Track affiliate conversion if referral code exists
    try {
      const sessionId = searchParams.get('session_id');
      const email = searchParams.get('email') || 
                   (registrationDataRef.current && registrationDataRef.current.email) ||
                   (localStorage.getItem('pendingRegistration') && JSON.parse(localStorage.getItem('pendingRegistration')).email);
      
      if (sessionId && email) {
        const conversionData = {
          amount: parseFloat(localStorage.getItem('subscriptionValue') || '0'),
          email: decodeURIComponent(email),
          orderId: sessionId,
          planName: localStorage.getItem('selectedPlan') || 'Subscription',
          planInterval: localStorage.getItem('planInterval') || 'monthly'
        };
        
        const wasTracked = affiliateService.trackConversion(conversionData);
        if (wasTracked) {
          logger.info('Affiliate conversion tracked successfully', conversionData);
        }
      }
    } catch (error) {
      logger.error('Error tracking affiliate conversion:', error);
    }
    
    // Clean up localStorage items if needed
    localStorage.removeItem('pendingRegistration');
    // Other cleanup as needed
  }, [searchParams]);
  

  // Setup & Cleanup
  useEffect(() => {
    mounted.current = true;
    logger.info('PaymentSuccess component mounted', {
      params: Object.fromEntries(searchParams.entries()),
      timestamp: new Date().toISOString()
    });
    
    // Clear any existing timeouts
    return () => {
      mounted.current = false;
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, [searchParams]);

  // Handle authentication redirect
  useEffect(() => {
    if (isAuthenticated) {
      logger.info('User already authenticated, redirecting to Trading Lab');
      navigate('/trading-lab/payment-success-loading', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle starter plan registration
  useEffect(() => {
    const processStarterRegistration = async () => {
      console.log('DEBUG: Processing starter registration:', {
        hasRefData: !!registrationDataRef.current,
        pendingInLocalStorage: !!localStorage.getItem('pendingRegistration'),
        processingFlag: !!localStorage.getItem('processing_registration')
      });
      
      // Get parameters from URL
      const plan = searchParams.get('plan');
      const email = searchParams.get('email');
      const username = searchParams.get('username');
      const isProcessingRegistration = localStorage.getItem('processing_registration');
      
      // Check if we're processing a starter plan registration
      if (isProcessingRegistration && plan === 'starter' && email) {
        setStatus('loading');
        
        try {
          logger.info(`Processing starter plan registration for: ${decodeURIComponent(email)}`);
          
          // Get password - prioritize the cached ref data
          let password;
          let userData = {};
          
          // 1. Try the ref first (most reliable since we cached it on mount)
          if (registrationDataRef.current && registrationDataRef.current.password) {
            password = registrationDataRef.current.password;
            userData = registrationDataRef.current;
            console.log('DEBUG: Using cached ref registration data with password length:', password.length);
            logger.info('Retrieved password from cached ref data');
          }
          
          // 2. If no ref data, try localStorage as fallback
          if (!password) {
            const pendingRegistrationStr = localStorage.getItem('pendingRegistration');
            if (pendingRegistrationStr) {
              try {
                userData = JSON.parse(pendingRegistrationStr);
                password = userData.password;
                console.log('DEBUG: Using localStorage registration data with password length:', password?.length);
                logger.info('Retrieved password from localStorage');
              } catch (e) {
                logger.error('Error parsing registration data from localStorage:', e);
              }
            }
          }
          
          // Validation and error handling
          if (!password) {
            logger.error('No password found in registration data');
            throw new Error('Registration data is incomplete');
          }
          
          // Prepare registration data from URL parameters + password
          const registrationData = {
            email: decodeURIComponent(email),
            username: username ? decodeURIComponent(username) : undefined,
            password: password
          };
          
          logger.info(`Attempting registration for ${registrationData.email} with username ${registrationData.username || '(derived from email)'}`);
          
          // Complete registration with starter plan
          const regResponse = await axiosInstance.post('/api/v1/auth/register-starter', registrationData);
          
          logger.info('Registration response received', {
            status: regResponse.status,
            hasToken: !!regResponse.data?.access_token
          });
          
          if (regResponse.data && regResponse.data.access_token) {
            // Set auth redirect flag to prevent auth page flash
            sessionStorage.setItem('auth_redirect_in_progress', 'true');
            
            // Store token and set authentication state
            localStorage.setItem('access_token', regResponse.data.access_token);
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${regResponse.data.access_token}`;
            
            // Set authenticated state directly
            if (regResponse.data.user) {
              setAuthenticatedState(regResponse.data.user, regResponse.data.access_token);
            }
            
            // IMPORTANT: Only clear data after successful registration
            localStorage.removeItem('pendingRegistration');
            localStorage.removeItem('processing_registration');
            registrationDataRef.current = null; // Also clear the ref
            
            // Set success status and prepare for redirect
            setStatus('success');
            
            // Schedule redirect with animation delay
            redirectTimeout.current = setTimeout(() => {
              if (mounted.current) {
                // Clear auth redirect flag right before navigation
                sessionStorage.removeItem('auth_redirect_in_progress');
                navigate('/trading-lab/payment-success-loading', { replace: true });
              }
            }, AUTO_REDIRECT_DELAY);
          
          } else {
            logger.error('Registration succeeded but no access token received');
            throw new Error('Registration completed but authentication failed');
          }
        } catch (error) {
          // Always clean up the redirect flag on error
          sessionStorage.removeItem('auth_redirect_in_progress');
          
          // Don't clear registration data on error to allow retries
          
          logger.error('Registration process error:', error);
          setStatus('error');
          setError(error.response?.data?.detail || error.message || 'Registration failed');
          
          toast({
            title: "Registration Failed",
            description: error.response?.data?.detail || error.message || "Failed to complete registration",
            status: "error",
            duration: 5000,
          });
        }
        
        // Return to prevent further processing
        return true;
      }
      
      return false;
    };
    
    // Execute starter plan registration handler
    processStarterRegistration();
  }, [searchParams, navigate, toast, setAuthenticatedState]);

  // Main verification logic
  // In PaymentSuccess.js, replace the main useEffect for verification with this:

useEffect(() => {
  const verifyPaymentAndLogin = async () => {
    if (verificationAttempted.current || isAuthenticated) return;
    verificationAttempted.current = true;
    
    try {
      logger.info('Starting payment verification...');
      
      // Get session ID from URL
      const sessionId = searchParams.get('session_id');
      const sessionToken = searchParams.get('session_token');
      
      if (!sessionId) {
        throw new Error('No session ID found');
      }
      
      // Step 1: Verify the payment session
      logger.info('Verifying session:', sessionId);
      const verifyResponse = await axiosInstance.get(`/api/v1/subscriptions/verify-session/${sessionId}`);
      
      if (!verifyResponse.data.valid) {
        throw new Error(verifyResponse.data.reason || 'Payment verification failed');
      }
      
      // Step 2: Check if user already exists (webhook might have created it)
      if (verifyResponse.data.user_exists) {
        logger.info('User account already exists, attempting login');
        
        // Get session token from URL or sessionStorage
        const token = sessionToken || sessionStorage.getItem('registration_session_token');
        
        if (token) {
          // Try to get credentials and login
          const credResponse = await axiosInstance.post('/api/v1/auth/get-credentials-by-token', {
            session_token: token
          });
          
          if (credResponse.data) {
            const loginResponse = await login({
              email: credResponse.data.email,
              password: credResponse.data.temp_password
            });
            
            if (loginResponse.success) {
              setStatus('success');
              sessionStorage.removeItem('registration_session_token');
              
              toast({
                title: 'Welcome to Atomik Trading!',
                description: 'Your account is ready. Redirecting to dashboard...',
                status: 'success',
                duration: 5000,
              });
              
              redirectTimeout.current = setTimeout(() => {
                if (mounted.current) {
                  navigate('/trading-lab/payment-success-loading', { replace: true });
                }
              }, AUTO_REDIRECT_DELAY);
              return;
            }
          }
        }
        
        // If we can't auto-login, redirect to login page
        setStatus('success');
        toast({
          title: 'Payment Successful!',
          description: 'Your account is ready. Please login with your credentials.',
          status: 'success',
          duration: 8000,
        });
        
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 3000);
        
      } else {
        // Account doesn't exist - this means webhook hasn't processed yet
        logger.warn('Account not created by webhook, waiting...');
        
        // Retry after a delay
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setIsRetrying(true);
          setError(`Account setup in progress... (${retryCount + 1}/${MAX_RETRIES})`);
          
          setTimeout(() => {
            if (mounted.current) {
              setIsRetrying(false);
              verificationAttempted.current = false;
            }
          }, RETRY_DELAY);
        } else {
          throw new Error('Account creation is taking longer than expected. Please contact support.');
        }
      }
      
    } catch (error) {
      logger.error('Payment verification error:', error);
      
      if (mounted.current) {
        setStatus('error');
        setError(error.message || 'Payment verification failed');
        
        toast({
          title: 'Setup Error',
          description: error.message || 'Unable to complete setup',
          status: 'error',
          duration: 8000,
          isClosable: true,
        });
      }
    }
  };
  
  verifyPaymentAndLogin();
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
            transition={{ duration: 0.5 }}
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
            transition={{ duration: 0.5 }}
          >
            <VStack spacing={8}>
              <Icon 
                as={CheckCircle} 
                w={16} 
                h={16} 
                color="green.400"
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
          transition={{ duration: 0.5 }}
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