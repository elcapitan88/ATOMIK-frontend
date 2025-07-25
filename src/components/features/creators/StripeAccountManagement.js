import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { 
  ConnectAccountManagement,
  ConnectPayments,
  ConnectPayouts,
  ConnectComponentsProvider 
} from '@stripe/react-connect-js';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { CreditCard, DollarSign, Users, ExternalLink, RefreshCw } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';

// Singleton instance management to prevent multiple Connect.js loads
let stripeConnectInstanceSingleton = null;
let isInitializing = false;
const initializationPromises = [];

const StripeAccountManagement = () => {
  const [stripeConnectInstance, setStripeConnectInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();

  console.log('🔵 *** StripeAccountManagement component mounted ***');

  // Initialize Stripe Connect with singleton pattern
  useEffect(() => {
    console.log('🔵 *** StripeAccountManagement useEffect triggered ***');
    getStripeConnectInstance();
    checkAccountStatus();
  }, []);

  // Check account status
  const checkAccountStatus = async () => {
    try {
      const response = await axiosInstance.get('/api/v1/creators/stripe-status');
      setAccountStatus(response.data);
      console.log('🔵 Account status:', response.data);
      
      return response.data;
    } catch (err) {
      console.error('Error checking account status:', err);
      return null;
    }
  };

  // Get or create Stripe Connect instance (reusing existing logic)
  const getStripeConnectInstance = async () => {
    try {
      console.log('🔵 Getting Stripe Connect instance for account management...');
      setLoading(true);
      setError(null);

      // Return existing instance if available
      if (stripeConnectInstanceSingleton) {
        console.log('🔵 Using existing Stripe Connect instance');
        setStripeConnectInstance(stripeConnectInstanceSingleton);
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
          console.log('🔵 Stripe requesting fresh client secret for account management...');
          try {
            const response = await axiosInstance.post('/api/v1/creators/create-account-session', {
              timestamp: Date.now()
            });
            const { client_secret } = response.data;
            console.log('🔵 Received fresh client secret for management:', client_secret ? 'Yes' : 'No');
            return client_secret;
          } catch (error) {
            console.error('❌ Failed to get client secret for management:', error);
            throw error;
          }
        },
        appearance: {
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

      console.log('🔵 Stripe Connect instance created for management:', !!instance);
      
      // Store singleton instance
      stripeConnectInstanceSingleton = instance;
      setStripeConnectInstance(instance);

      // Resolve all waiting promises
      initializationPromises.forEach(({ resolve }) => resolve(instance));
      initializationPromises.length = 0;

    } catch (err) {
      console.error('❌ Stripe Connect initialization error for management:', err);
      setError(err.message || 'Failed to initialize account management');
      
      // Reject all waiting promises
      initializationPromises.forEach(({ reject }) => reject(err));
      initializationPromises.length = 0;
    } finally {
      isInitializing = false;
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Center py={12}>
        <VStack spacing={4}>
          <Spinner size="xl" color="#00C6E0" thickness="4px" />
          <Text color="whiteAlpha.700">Loading account management...</Text>
        </VStack>
      </Center>
    );
  }

  // Error state
  if (error) {
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
          Management Error
        </AlertTitle>
        <AlertDescription maxWidth="sm" color="whiteAlpha.800">
          {error}
        </AlertDescription>
        <Button
          mt={4}
          size="sm"
          variant="outline"
          color="white"
          borderColor="whiteAlpha.300"
          leftIcon={<RefreshCw size={16} />}
          onClick={() => window.location.reload()}
          _hover={{ borderColor: "#00C6E0", color: "#00C6E0" }}
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  // Account not ready state
  if (!accountStatus?.onboarding_complete) {
    return (
      <Box
        bg="rgba(245, 101, 101, 0.05)"
        p={8}
        borderRadius="lg"
        border="1px solid rgba(245, 101, 101, 0.2)"
        textAlign="center"
      >
        <VStack spacing={4}>
          <Text color="white" fontSize="lg" fontWeight="semibold">
            Account Setup Required
          </Text>
          <Text color="whiteAlpha.700" fontSize="sm">
            Please complete your Stripe account setup before accessing management features.
          </Text>
          <Button
            size="sm"
            bg="#00C6E0"
            color="white"
            _hover={{ bg: "#00A3B8" }}
            leftIcon={<CreditCard size={16} />}
            onClick={() => window.location.reload()}
          >
            Complete Setup
          </Button>
        </VStack>
      </Box>
    );
  }

  const tabStyles = {
    color: "whiteAlpha.600",
    fontWeight: "medium",
    _selected: {
      color: "#00C6E0",
      borderBottomColor: "#00C6E0",
    },
    _hover: {
      color: "whiteAlpha.800",
    },
  };

  const tabPanelStyles = {
    p: 0,
    pt: 6,
  };

  return (
    <Box>
      {/* Header */}
      <VStack spacing={4} align="stretch" mb={6}>
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Text color="white" fontSize="xl" fontWeight="semibold">
              Account Management
            </Text>
            <Text color="whiteAlpha.600" fontSize="sm">
              Manage your Stripe account, payments, and payouts
            </Text>
          </VStack>
          
          <HStack spacing={2}>
            <Badge
              bg="rgba(0, 198, 224, 0.2)"
              color="#00C6E0"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="medium"
            >
              Active Account
            </Badge>
            <Button
              size="sm"
              variant="outline"
              color="whiteAlpha.600"
              borderColor="whiteAlpha.300"
              leftIcon={<ExternalLink size={16} />}
              onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
              _hover={{ borderColor: "#00C6E0", color: "#00C6E0" }}
            >
              Stripe Dashboard
            </Button>
          </HStack>
        </HStack>
      </VStack>

      {/* Tabbed Interface */}
      {stripeConnectInstance ? (
        <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
          <Tabs 
            index={activeTab} 
            onChange={setActiveTab}
            variant="line"
            colorScheme="cyan"
          >
            <TabList borderColor="#333">
              <Tab {...tabStyles}>
                <HStack spacing={2}>
                  <Users size={16} />
                  <Text>Account</Text>
                </HStack>
              </Tab>
              <Tab {...tabStyles}>
                <HStack spacing={2}>
                  <CreditCard size={16} />
                  <Text>Payments</Text>
                </HStack>
              </Tab>
              <Tab {...tabStyles}>
                <HStack spacing={2}>
                  <DollarSign size={16} />
                  <Text>Payouts</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Account Management Tab */}
              <TabPanel {...tabPanelStyles}>
                <Box
                  bg="#1a1a1a"
                  borderRadius="lg"
                  border="1px solid #333"
                  minH="500px"
                  overflow="hidden"
                >
                  <ConnectAccountManagement />
                </Box>
              </TabPanel>

              {/* Payments Tab */}
              <TabPanel {...tabPanelStyles}>
                <Box
                  bg="#1a1a1a"
                  borderRadius="lg"
                  border="1px solid #333"
                  minH="500px"
                  overflow="hidden"
                >
                  <ConnectPayments />
                </Box>
              </TabPanel>

              {/* Payouts Tab */}
              <TabPanel {...tabPanelStyles}>
                <Box
                  bg="#1a1a1a"
                  borderRadius="lg"
                  border="1px solid #333"
                  minH="500px"
                  overflow="hidden"
                >
                  <ConnectPayouts />
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
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
            Stripe Connect instance not available. Please refresh the page.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default StripeAccountManagement;