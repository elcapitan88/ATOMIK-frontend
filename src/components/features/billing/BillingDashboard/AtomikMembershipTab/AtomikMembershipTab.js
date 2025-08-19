import React, { useState, useEffect } from 'react';
import {
  VStack,
  SimpleGrid,
  Box,
  Text,
  Button,
  HStack,
  Divider,
  Spinner,
  Center,
  useToast
} from '@chakra-ui/react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import SubscriptionOverview from './SubscriptionOverview';
import UsageLimitsPanel from './UsageLimitsPanel';
import TrialStatusCard from './TrialStatusCard';
import QuickActionsPanel from './QuickActionsPanel';
import StripePortalButton from './StripePortalButton';

import axiosInstance from '@/services/axiosConfig';

const MotionBox = motion(Box);

const AtomikMembershipTab = ({ user }) => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const fetchSubscriptionData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);
      
      const response = await axiosInstance.get('/api/v1/subscriptions/status');
      setSubscriptionData(response.data);
      
      if (showRefreshIndicator) {
        toast({
          title: "Subscription data refreshed",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast({
        title: "Failed to load subscription data",
        description: error.response?.data?.detail || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const handleRefresh = () => {
    fetchSubscriptionData(true);
  };

  if (isLoading) {
    return (
      <Center py={12}>
        <VStack spacing={4}>
          <Spinner size="lg" color="#00C6E0" />
          <Text color="whiteAlpha.600">Loading subscription details...</Text>
        </VStack>
      </Center>
    );
  }

  const { subscription, resources } = subscriptionData || {};

  return (
    <VStack spacing={6} align="stretch">
      {/* Header with Refresh */}
      <HStack justify="space-between" align="center">
        <Text color="white" fontSize="lg" fontWeight="semibold">
          Membership Details
        </Text>
        <Button
          variant="ghost"
          size="sm"
          color="whiteAlpha.700"
          _hover={{ color: "#00C6E0" }}
          leftIcon={<RefreshCw size={16} />}
          onClick={handleRefresh}
          isLoading={isRefreshing}
          loadingText="Refreshing"
        >
          Refresh
        </Button>
      </HStack>

      {/* Main Content Grid */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Left Column */}
        <VStack spacing={6} align="stretch">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SubscriptionOverview 
              subscription={subscription}
              user={user}
            />
          </MotionBox>

          {/* Trial Status (if applicable) */}
          {subscription?.is_in_trial && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <TrialStatusCard subscription={subscription} />
            </MotionBox>
          )}

          {/* Quick Actions */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <QuickActionsPanel 
              subscription={subscription}
              onRefresh={handleRefresh}
            />
          </MotionBox>
        </VStack>

        {/* Right Column */}
        <VStack spacing={6} align="stretch">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <UsageLimitsPanel 
              subscription={subscription}
              resources={resources}
            />
          </MotionBox>

          {/* Stripe Portal Section */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Box
              bg="#1a1a1a"
              p={6}
              borderRadius="lg"
              border="1px solid #333"
            >
              <VStack spacing={4} align="stretch">
                <Text color="white" fontSize="md" fontWeight="semibold">
                  Advanced Billing Management
                </Text>
                <Text color="whiteAlpha.700" fontSize="sm">
                  Access Stripe's secure portal for payment methods, invoices, and detailed billing history.
                </Text>
                <Divider borderColor="#333" />
                <StripePortalButton />
              </VStack>
            </Box>
          </MotionBox>
        </VStack>
      </SimpleGrid>

      {/* Security Notice */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Box
          bg="rgba(0, 198, 224, 0.05)"
          p={4}
          borderRadius="lg"
          border="1px solid rgba(0, 198, 224, 0.2)"
        >
          <HStack spacing={3} align="start">
            <Text color="#00C6E0" fontSize="xs" fontWeight="semibold">
              🔒 SECURE
            </Text>
            <Text color="whiteAlpha.700" fontSize="xs">
              All payment information is securely processed by Stripe. We never store your credit card details.
            </Text>
          </HStack>
        </Box>
      </MotionBox>
    </VStack>
  );
};

export default AtomikMembershipTab;