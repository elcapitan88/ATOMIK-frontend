import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useToast,
  HStack,
  Progress,
} from '@chakra-ui/react';
import { 
  ConnectAccountOnboarding, 
  ConnectComponentsProvider 
} from '@stripe/react-connect-js';
// Import with explicit script loading to avoid Cloudflare Rocket Loader conflicts
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';

// Singleton instance management to prevent multiple Connect.js loads
let stripeConnectInstanceSingleton = null;
let isInitializing = false;
const initializationPromises = [];

const StripeConnectEmbed = ({ onComplete, onError }) => {
  const [stripeConnectInstance, setStripeConnectInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);
  const toast = useToast();

  // Initialize Stripe Connect with singleton pattern
  useEffect(() => {
    getStripeConnectInstance();
  }, []);

  // Check account status
  const checkAccountStatus = async () => {
    try {
      const response = await axiosInstance.get('/api/v1/creators/stripe-status');
      setAccountStatus(response.data);

      // If onboarding is complete, notify parent
      if (response.data.onboarding_complete && onComplete) {
        onComplete(response.data);
      }
    } catch (err) {
      console.error('Error checking account status:', err);
    }
  };

  // Handle onboarding exit
  const handleOnboardingExit = async (exitEvent = {}) => {
    console.log('🔵 Stripe onboarding exit event:', exitEvent);
    
    // Check the account status after any exit
    await checkAccountStatus();
    
    // Check if this was a completion (submission) vs just closing
    if (exitEvent.reason === 'exit_completed' || exitEvent.reason === 'requirements_completed') {
      console.log('🎉 Stripe onboarding appears to be completed!');
      
      // Wait a moment for Stripe to process, then check status again
      setTimeout(async () => {
        await checkAccountStatus();
        
        // Check if onboarding is truly complete
        const statusResponse = await axiosInstance.get('/api/v1/creators/stripe-status');
        if (statusResponse.data.onboarding_complete) {
          toast({
            title: "Setup complete!",
            description: "Your payment account is ready. Welcome to the creator program!",
            status: "success",
            duration: 6000,
            isClosable: true,
          });
          
          if (onComplete) {
            onComplete(statusResponse.data);
          }
        } else {
          toast({
            title: "Almost there!",
            description: "Please complete all required fields to finish setup",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        }
      }, 2000);
    } else {
      toast({
        title: "Progress saved",
        description: "You can complete setup anytime from your creator settings",
        status: "info",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  // Handle manual refresh for account session errors
  const handleRefreshSession = () => {
    // Clear the existing instance
    stripeConnectInstanceSingleton = null;
    setStripeConnectInstance(null);
    setLoading(true);
    setError(null);
    
    // Get fresh instance
    getStripeConnectInstance();
  };

  // Get or create Stripe Connect instance
  const getStripeConnectInstance = async () => {
    try {
      console.log('🔵 Getting Stripe Connect instance...');
      setLoading(true);
      setError(null);

      // Return existing instance if available
      if (stripeConnectInstanceSingleton) {
        console.log('🔵 Using existing Stripe Connect instance');
        setStripeConnectInstance(stripeConnectInstanceSingleton);
        checkAccountStatus();
        setLoading(false);
        return;
      }

      // If initialization is in progress, wait for it
      if (isInitializing) {
        console.log('🔵 Waiting for existing initialization...');
        const instance = await new Promise((resolve, reject) => {
          initializationPromises.push({ resolve, reject });
        });
        setStripeConnectInstance(instance);
        checkAccountStatus();
        setLoading(false);
        return;
      }

      // Start initialization
      console.log('🔵 Starting new Stripe Connect initialization...');
      isInitializing = true;

      // Check publishable key
      const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
      console.log('🔵 Publishable key found:', publishableKey ? 'Yes' : 'No');
      
      if (!publishableKey) {
        throw new Error('Stripe publishable key not found in environment variables');
      }

      // Initialize Stripe Connect (only once)
      console.log('🔵 Loading Stripe Connect library...');
      const instance = loadConnectAndInitialize({
        publishableKey,
        fetchClientSecret: async () => {
          console.log('🔵 Stripe requesting fresh client secret from backend...');
          try {
            // Add timestamp to prevent caching issues
            const response = await axiosInstance.post('/api/v1/creators/create-account-session', {
              timestamp: Date.now()
            });
            const { client_secret } = response.data;
            console.log('🔵 Received fresh client secret:', client_secret ? 'Yes' : 'No');
            console.log('🔵 Client secret preview:', client_secret ? `${client_secret.substring(0, 20)}...` : 'None');
            return client_secret;
          } catch (error) {
            console.error('❌ Failed to get client secret:', error);
            throw error;
          }
        },
        appearance: {
          // Remove overlays setting to embed the form instead of opening a dialog
          variables: {
            colorPrimary: '#00C6E0',
            colorBackground: '#1a1a1a',
            colorText: '#ffffff',
            colorDanger: '#df1b41',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
            colorBorder: '#333333',
          }
        },
      });

      console.log('🔵 Stripe Connect instance created:', !!instance);
      
      // Store singleton instance
      stripeConnectInstanceSingleton = instance;
      setStripeConnectInstance(instance);

      // Resolve all waiting promises
      initializationPromises.forEach(({ resolve }) => resolve(instance));
      initializationPromises.length = 0;

      // Check initial account status
      console.log('🔵 Checking initial account status...');
      checkAccountStatus();

    } catch (err) {
      console.error('❌ Stripe Connect initialization error:', err);
      setError(err.message || 'Failed to initialize payment setup');
      
      // Reject all waiting promises
      initializationPromises.forEach(({ reject }) => reject(err));
      initializationPromises.length = 0;
      
      if (onError) onError(err);
    } finally {
      isInitializing = false;
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Center py={12}>
        <VStack spacing={4}>
          <Spinner size="xl" color="#00C6E0" thickness="4px" />
          <Text color="whiteAlpha.700">Initializing payment setup...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    const isSessionError = error.includes('Failed to claim account session') || 
                           error.includes('account session') ||
                           error.includes('session');
    
    return (
      <Alert
        status="error"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="200px"
        bg="rgba(245, 101, 101, 0.1)"
        borderRadius="lg"
        border="1px solid rgba(245, 101, 101, 0.3)"
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg" color="white">
          {isSessionError ? 'Session Expired' : 'Setup Error'}
        </AlertTitle>
        <AlertDescription maxWidth="sm" color="whiteAlpha.800">
          {isSessionError ? 'Your payment setup session has expired. Click below to get a fresh session.' : error}
        </AlertDescription>
        <Button
          mt={4}
          size="sm"
          variant="outline"
          color="white"
          borderColor="whiteAlpha.300"
          leftIcon={<RefreshCw size={16} />}
          onClick={isSessionError ? handleRefreshSession : handleRefresh}
          _hover={{ borderColor: "#00C6E0", color: "#00C6E0" }}
        >
          {isSessionError ? 'Get Fresh Session' : 'Try Again'}
        </Button>
      </Alert>
    );
  }

  // Show completion state if already onboarded
  if (accountStatus?.onboarding_complete) {
    return (
      <Box
        bg="rgba(0, 198, 224, 0.05)"
        p={8}
        borderRadius="lg"
        border="1px solid rgba(0, 198, 224, 0.2)"
      >
        <VStack spacing={6} align="center">
          <Box color="#00C6E0">
            <CheckCircle size={48} />
          </Box>
          
          <VStack spacing={2} textAlign="center">
            <Text color="white" fontSize="xl" fontWeight="semibold">
              Payment Setup Complete!
            </Text>
            <Text color="whiteAlpha.700" fontSize="sm">
              Your Stripe account is active and ready to receive payments
            </Text>
          </VStack>

          <HStack spacing={4}>
            <Button
              size="sm"
              variant="outline"
              color="white"
              borderColor="#333"
              leftIcon={<ExternalLink size={16} />}
              onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
              _hover={{ borderColor: "#00C6E0", color: "#00C6E0" }}
            >
              View Stripe Dashboard
            </Button>
            <Button
              size="sm"
              bg="#00C6E0"
              color="white"
              _hover={{ bg: "#00A3B8" }}
              onClick={() => window.location.href = '/creator-hub'}
            >
              Go to Creator Hub
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  }

  console.log('🔵 Rendering StripeConnectEmbed, instance available:', !!stripeConnectInstance);

  return (
    <Box>
      {stripeConnectInstance ? (
        <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
          <Box
            bg="#1a1a1a"
            p={6}
            borderRadius="lg"
            border="1px solid #333"
            minH="400px"
          >
            {console.log('🔵 Rendering ConnectAccountOnboarding component')}
            <ConnectAccountOnboarding
              onExit={handleOnboardingExit}
              // Collection options for embedded onboarding
              collectionOptions={{
                fields: 'currently_due',
                futureRequirements: 'include',
              }}
            />
          </Box>
          
          {/* Progress indicator */}
          {accountStatus && !accountStatus.onboarding_complete && (
            <Box mt={4}>
              <HStack justify="space-between" mb={2}>
                <Text color="whiteAlpha.700" fontSize="sm">
                  Setup Progress
                </Text>
                <Text color="whiteAlpha.600" fontSize="xs">
                  {accountStatus.details_submitted ? 'Almost done!' : 'In progress...'}
                </Text>
              </HStack>
              <Progress
                value={accountStatus.details_submitted ? 90 : 50}
                size="sm"
                colorScheme="cyan"
                bg="#333"
                borderRadius="full"
              />
            </Box>
          )}
        </ConnectComponentsProvider>
      ) : (
        <Box
          bg="#1a1a1a"
          p={6}
          borderRadius="lg"
          border="1px solid #333"
          minH="400px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text color="whiteAlpha.600" fontSize="sm">
            Stripe Connect instance not available. Check browser console for details.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default StripeConnectEmbed;