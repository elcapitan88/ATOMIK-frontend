import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Heading,
  Container,
  useToast,
  Spinner,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { 
  CheckCircle, 
  TrendingUp, 
  Bell, 
  ArrowRight,
  AlertCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { marketplaceApi } from '@/services/api/marketplace/marketplaceApi';

const MotionBox = motion(Box);

const StrategyPurchaseSuccess = () => {
  const [status, setStatus] = useState('loading');
  const [strategyData, setStrategyData] = useState(null);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  
  const sessionId = searchParams.get('session_id');
  const strategyToken = searchParams.get('strategy_token');

  useEffect(() => {
    const verifyPurchase = async () => {
      if (!sessionId || !strategyToken) {
        setError('Missing purchase information');
        setStatus('error');
        return;
      }

      try {
        // Verify the purchase session
        const verificationResponse = await marketplaceApi.verifyPurchaseSession(sessionId);
        
        // Get strategy information
        const strategyResponse = await marketplaceApi.getStrategyPricing(strategyToken);
        
        setStrategyData({
          ...strategyResponse,
          verification: verificationResponse
        });
        setStatus('success');
        
        toast({
          title: "Purchase Successful!",
          description: "You now have access to this strategy. You can activate it in your strategies.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
      } catch (error) {
        console.error('Error verifying purchase:', error);
        setError(error.message || 'Failed to verify purchase');
        setStatus('error');
      }
    };

    verifyPurchase();
  }, [sessionId, strategyToken, toast]);

  const handleGoToMarketplace = () => {
    navigate('/marketplace', { replace: true });
  };

  const handleActivateStrategy = () => {
    navigate('/trading-lab', { 
      replace: true,
      state: { openActivateModal: true, strategyToken }
    });
  };

  if (status === 'loading') {
    return (
      <Container maxW="md" py={20}>
        <VStack spacing={6} textAlign="center">
          <Spinner size="xl" color="cyan.400" />
          <Text color="gray.400">Verifying your purchase...</Text>
        </VStack>
      </Container>
    );
  }

  if (status === 'error') {
    return (
      <Container maxW="md" py={20}>
        <VStack spacing={6} textAlign="center">
          <Icon as={AlertCircle} boxSize={16} color="red.400" />
          <Heading size="lg" color="white">Verification Failed</Heading>
          <Text color="gray.400">{error}</Text>
          <Button onClick={handleGoToMarketplace} colorScheme="cyan">
            Return to Marketplace
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="2xl" py={10}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <VStack spacing={8} textAlign="center">
          {/* Success Icon */}
          <MotionBox
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Icon as={CheckCircle} boxSize={20} color="green.400" />
          </MotionBox>

          {/* Success Message */}
          <VStack spacing={4}>
            <Heading size="xl" color="white">
              Purchase Successful! 🎉
            </Heading>
            <Text fontSize="lg" color="gray.300" maxW="md">
              You now have access to this trading strategy. 
              You can activate it and start receiving signals.
            </Text>
          </VStack>

          {/* Strategy Info */}
          {strategyData && (
            <Box
              bg="rgba(255, 255, 255, 0.05)"
              backdropFilter="blur(10px)"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
              borderRadius="xl"
              p={6}
              w="full"
              maxW="md"
            >
              <VStack spacing={4}>
                <Text fontSize="lg" fontWeight="semibold" color="white">
                  Strategy Access Granted
                </Text>
                
                <HStack justify="space-between" w="full">
                  <Text color="gray.400">Status:</Text>
                  <Badge colorScheme="green" size="sm">
                    Active
                  </Badge>
                </HStack>
                
                <HStack justify="space-between" w="full">
                  <Text color="gray.400">Type:</Text>
                  <Text color="white" fontSize="sm">
                    {strategyData.pricing_type === 'one_time' ? 'Lifetime Access' : 'Subscription'}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          )}

          <Divider borderColor="whiteAlpha.200" />

          {/* Next Steps */}
          <VStack spacing={6} w="full" maxW="md">
            <Text fontSize="lg" fontWeight="semibold" color="white">
              What's Next?
            </Text>
            
            <VStack spacing={4} w="full">
              <Box
                bg="rgba(0, 198, 224, 0.1)"
                borderWidth="1px"
                borderColor="rgba(0, 198, 224, 0.3)"
                borderRadius="lg"
                p={4}
                w="full"
              >
                <HStack spacing={3}>
                  <Icon as={TrendingUp} color="cyan.400" />
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="semibold" color="white" fontSize="sm">
                      Activate Strategy
                    </Text>
                    <Text color="gray.400" fontSize="xs">
                      Set up your trading parameters and start receiving signals
                    </Text>
                  </VStack>
                </HStack>
              </Box>
              
              <Box
                bg="rgba(255, 255, 255, 0.05)"
                borderWidth="1px"
                borderColor="whiteAlpha.200"
                borderRadius="lg"
                p={4}
                w="full"
              >
                <HStack spacing={3}>
                  <Icon as={Bell} color="yellow.400" />
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="semibold" color="white" fontSize="sm">
                      Receive Signals
                    </Text>
                    <Text color="gray.400" fontSize="xs">
                      Get notified when new trading signals are generated
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            </VStack>
          </VStack>

          {/* Action Buttons */}
          <HStack spacing={4} pt={4}>
            <Button
              onClick={handleActivateStrategy}
              colorScheme="cyan"
              size="lg"
              rightIcon={<Icon as={ArrowRight} />}
            >
              Activate Strategy
            </Button>
            
            <Button
              onClick={handleGoToMarketplace}
              variant="outline"
              colorScheme="gray"
              size="lg"
            >
              Browse More
            </Button>
          </HStack>
          
          <Text fontSize="sm" color="gray.500" textAlign="center" maxW="md">
            Need help? Visit our documentation or contact support for assistance 
            with setting up your trading strategy.
          </Text>
        </VStack>
      </MotionBox>
    </Container>
  );
};

export default StrategyPurchaseSuccess;