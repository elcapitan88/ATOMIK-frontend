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
  
  // Refs for cleanup and state tracking
  const mounted = useRef(true);
  const verificationAttempted = useRef(false);
  const redirectTimeout = useRef(null);

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
      logger.info('User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle starter plan registration
  useEffect(() => {
    const processStarterRegistration = async () => {
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
          
          // Get registration data from localStorage
          const pendingRegistrationStr = localStorage.getItem('pendingRegistration');
          let password;
          
          if (pendingRegistrationStr) {
            try {
              const regData = JSON.parse(pendingRegistrationStr);
              password = regData.password;
              logger.info('Successfully retrieved password from localStorage');
            } catch (e) {
              logger.error('Error parsing registration data:', e);
            }
          }
          
          if (!password) {
            logger.error('No password found in registration data');
            throw new Error('Registration data is incomplete');
          }
          
          // Prepare registration data from URL parameters
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
            
            // Clean up registration data
            localStorage.removeItem('pendingRegistration');
            localStorage.removeItem('processing_registration');
            
            // Set success status and prepare for redirect
            setStatus('success');
            
            // Schedule redirect with animation delay
            redirectTimeout.current = setTimeout(() => {
              if (mounted.current) {
                // Clear auth redirect flag right before navigation
                sessionStorage.removeItem('auth_redirect_in_progress');
                navigate('/dashboard', { replace: true });
              }
            }, AUTO_REDIRECT_DELAY);
          
          } else {
            logger.error('Registration succeeded but no access token received');
            throw new Error('Registration completed but authentication failed');
          }
        } catch (error) {
          // Always clean up the redirect flag on error
          sessionStorage.removeItem('auth_redirect_in_progress');
          
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
  useEffect(() => {
    const verifyPaymentAndLogin = async () => {
      if (verificationAttempted.current) return;
      
      // Skip if already processing starter plan registration
      const plan = searchParams.get('plan');
      if (plan === 'starter') return;
      
      // Skip if processing_registration flag is set
      const isProcessingRegistration = localStorage.getItem('processing_registration');
      if (isProcessingRegistration) return;
      
      verificationAttempted.current = true;
      
      try {
        logger.info('Starting payment verification...');
        
        // Get session ID from URL parameters
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          throw new Error('No session ID found');
        }
        
        // Fallback email from URL if available
        const emailFromUrl = searchParams.get('email');
        
        // Get registration data from localStorage
        const pendingRegistrationStr = localStorage.getItem('pendingRegistration');
        
        logger.debug('Registration data check:', {
          hasLocalStorageData: !!pendingRegistrationStr,
          hasEmailInParams: !!emailFromUrl,
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
          
          // Use email from URL if available and different from localStorage
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
          logger.error('Missing email in registration data');
          throw new Error('Invalid registration data');
        }
        
        // Verify session with retries
        logger.info('Verifying session:', sessionId);
        let verifyResponse;
        let retryAttempt = 0;
        
        while (retryAttempt < 3) {
          try {
            verifyResponse = await axiosInstance.get(`/api/v1/subscriptions/verify-session/${sessionId}`);
            break; // Exit loop if successful
          } catch (err) {
            retryAttempt++;
            if (retryAttempt >= 3) throw err;
            logger.warn(`Session verification failed (attempt ${retryAttempt}/3), retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (!verifyResponse || !verifyResponse.data.valid) {
          logger.error('Session verification failed:', verifyResponse?.data);
          throw new Error(verifyResponse?.data?.reason || 'Payment verification failed');
        }
        
        logger.info('Payment verified successfully, proceeding with registration');
        
        // Extract plan information from session verification
        const sessionMetadata = verifyResponse.data.metadata || {};
        const planTier = sessionMetadata.tier;
    
        // Validate that we have a plan tier
        if (!planTier) {
          logger.error('No plan tier found in session metadata', { 
            sessionId: sessionId,
            metadata: sessionMetadata 
          });
          throw new Error('No plan tier found in session. Unable to complete registration.');
        }
    
        const interval = sessionMetadata.interval;
        if (!interval) {
          logger.error('No interval found in session metadata', { 
            sessionId: sessionId,
            planTier: planTier
          });
          throw new Error('No billing interval found in session. Unable to complete registration.');
        }
    
        const isLifetime = interval === 'lifetime';
        const customerId = verifyResponse.data.customer_id;
        
        // Note: For subscription plans, the subscription_id might not be available yet 
        // This is okay - our webhook will catch it later
        const subscriptionId = verifyResponse.data.subscription_id;
    
        // Log subscription info
        logger.info('Subscription information:', {
          planTier,
          interval,
          isLifetime,
          hasCustomerId: !!customerId,
          hasSubscriptionId: !!subscriptionId
        });
    
        // Make registration request with plan information
        const registerResponse = await axiosInstance.post('/api/v1/auth/register', {
          email: pendingRegistration.email,
          username: pendingRegistration.username || pendingRegistration.email.split('@')[0],
          password: pendingRegistration.password,
          plan: {
            tier: planTier,
            interval: interval,
            is_lifetime: isLifetime,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId
          }
        });
    
        if (registerResponse.data?.access_token) {
          logger.info(`Registration successful for ${planTier} plan`);
          
          // Store token and set authorization header
          localStorage.setItem('access_token', registerResponse.data.access_token);
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${registerResponse.data.access_token}`;
          
          // Set auth directly if available
          if (registerResponse.data.user) {
            // Create a single session flag to indicate we're in a redirect flow
            sessionStorage.setItem('auth_redirect_in_progress', 'true');
            
            // Use the provided auth context method to set authentication state
            const success = setAuthenticatedState(registerResponse.data.user, registerResponse.data.access_token);
            logger.info(`Auth state set success: ${success}`);
          }
          
          // Update component state
          setStatus('success');
          
          // Clean up
          localStorage.removeItem('pendingRegistration');
          
          // Show success message
          toast({
            title: `Welcome to Atomik Trading ${planTier} Plan!`,
            description: 'Your account is ready. Redirecting to dashboard...',
            status: 'success',
            duration: 5000,
          });
          
          // Use a slightly longer delay to ensure authentication state is fully set
          redirectTimeout.current = setTimeout(() => {
            if (mounted.current) {
              // Remove the redirect flag right before navigation
              sessionStorage.removeItem('auth_redirect_in_progress');
              
              // Force a hard reload of dashboard to ensure auth state is fresh
              window.location.href = '/dashboard';
            }
          }, 1500); // Increased from 1000ms to 1500ms
          
          return;
        }
        
        // If we get here, registration wasn't successful, try login as fallback
        logger.info('Attempting login fallback with:', {
          email: pendingRegistration.email,
          hasPassword: !!pendingRegistration.password
        });
        
        const loginResponse = await login({
          email: pendingRegistration.email,
          password: pendingRegistration.password
        });
        
        if (!loginResponse.success) {
          throw new Error(loginResponse.error || 'Login failed');
        }
        
        // Success - update state and schedule redirect
        if (mounted.current) {
          setStatus('success');
          localStorage.removeItem('pendingRegistration');
          
          toast({
            title: 'Welcome to Atomik Trading!',
            description: 'Your account has been upgraded.',
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
            setError(error.response?.data?.detail || error.message || 'Payment verification failed');
            
            toast({
              title: 'Setup Failed',
              description: error.response?.data?.detail || error.message || 'Unable to verify your payment',
              status: 'error',
              duration: 8000,
              isClosable: true,
            });
          }
        }
      }
    };
    
    // Start verification if not authenticated and not already processing starter plan
    if (!isAuthenticated && !searchParams.get('plan')) {
      verifyPaymentAndLogin();
    }
  }, [isAuthenticated, navigate, searchParams, login, retryCount, toast, setAuthenticatedState]);

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