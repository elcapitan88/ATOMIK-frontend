import React, { useState, useEffect } from 'react';
import {
  VStack,
  Box,
  Text,
  HStack,
  Button,
  Spinner,
  Center,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { RefreshCw, Plus, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

import SubscriptionsList from './SubscriptionsList';
import axiosInstance from '@/services/axiosConfig';

const MotionBox = motion(Box);

const StrategySubscriptionsTab = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const fetchStrategySubscriptions = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);
      
      const response = await axiosInstance.get('/api/v1/subscriptions/strategy-subscriptions');
      setSubscriptions(response.data);
      
      if (showRefreshIndicator) {
        toast({
          title: "Strategy subscriptions refreshed",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching strategy subscriptions:', error);
      toast({
        title: "Failed to load strategy subscriptions",
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
    fetchStrategySubscriptions();
  }, []);

  const handleRefresh = () => {
    fetchStrategySubscriptions(true);
  };

  const handleBrowseStrategies = () => {
    // Navigate to strategy marketplace
    window.location.href = '/marketplace';
  };

  if (isLoading) {
    return (
      <Center py={12}>
        <VStack spacing={4}>
          <Spinner size="lg" color="#00C6E0" />
          <Text color="whiteAlpha.600">Loading strategy subscriptions...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <VStack align="start" spacing={1}>
          <Text color="white" fontSize="lg" fontWeight="semibold">
            Strategy Subscriptions
          </Text>
          <Text color="whiteAlpha.600" fontSize="sm">
            Manage your subscribed trading strategies
          </Text>
        </VStack>
        
        <HStack spacing={2}>
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
          
          <Button
            size="sm"
            bg="#00C6E0"
            color="white"
            _hover={{ bg: "#00A3B8" }}
            leftIcon={<Plus size={16} />}
            onClick={handleBrowseStrategies}
          >
            Browse Strategies
          </Button>
        </HStack>
      </HStack>

      {/* Content */}
      {subscriptions.length === 0 ? (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert
            status="info"
            bg="rgba(0, 198, 224, 0.05)"
            border="1px solid rgba(0, 198, 224, 0.2)"
            borderRadius="lg"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            p={8}
          >
            <AlertIcon color="#00C6E0" boxSize="40px" mb={4} />
            <AlertTitle color="white" fontSize="lg" mb={2}>
              No Strategy Subscriptions
            </AlertTitle>
            <AlertDescription color="whiteAlpha.700" mb={6} maxW="md">
              You haven't subscribed to any trading strategies yet. 
              Explore our marketplace to find strategies that match your trading style.
            </AlertDescription>
            <Button
              bg="#00C6E0"
              color="white"
              _hover={{ bg: "#00A3B8" }}
              rightIcon={<ExternalLink size={16} />}
              onClick={handleBrowseStrategies}
            >
              Explore Strategy Marketplace
            </Button>
          </Alert>
        </MotionBox>
      ) : (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SubscriptionsList 
            subscriptions={subscriptions}
            onRefresh={handleRefresh}
          />
        </MotionBox>
      )}

      {/* Info Box */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Box
          bg="rgba(0, 198, 224, 0.05)"
          p={4}
          borderRadius="lg"
          border="1px solid rgba(0, 198, 224, 0.2)"
        >
          <HStack spacing={3} align="start">
            <Text color="#00C6E0" fontSize="xs" fontWeight="semibold">
              💡 TIP
            </Text>
            <Text color="whiteAlpha.700" fontSize="xs">
              Strategy subscriptions are separate from your Atomik membership. 
              You can cancel individual strategy subscriptions without affecting your main account.
            </Text>
          </HStack>
        </Box>
      </MotionBox>
    </VStack>
  );
};

export default StrategySubscriptionsTab;