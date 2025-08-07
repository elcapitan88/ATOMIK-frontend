import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  Icon,
  Container,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PurchaseSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  
  const sessionId = searchParams.get('session_id');
  const strategyToken = searchParams.get('strategy_token');

  useEffect(() => {
    const verifyPurchase = async () => {
      if (!sessionId) {
        setVerificationStatus('error');
        setIsVerifying(false);
        return;
      }

      try {
        // Verify the Stripe session and purchase
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/marketplace/verify-purchase-session/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setVerificationStatus('success');
        } else {
          setVerificationStatus('error');
        }
      } catch (error) {
        console.error('Purchase verification error:', error);
        setVerificationStatus('error');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPurchase();
  }, [sessionId]);

  const handleBackToMarketplace = () => {
    navigate('/marketplace');
  };

  if (isVerifying) {
    return (
      <Container maxW="md" py={20}>
        <VStack spacing={6} textAlign="center">
          <Spinner size="xl" color="green.500" thickness="4px" />
          <Text fontSize="lg" color="white">
            Verifying your purchase...
          </Text>
        </VStack>
      </Container>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <Container maxW="md" py={20}>
        <VStack spacing={6}>
          <Alert status="error" bg="red.900" color="white">
            <AlertIcon />
            There was an issue verifying your purchase. Please contact support if you were charged.
          </Alert>
          <Button
            leftIcon={<ArrowLeft size={16} />}
            onClick={handleBackToMarketplace}
            colorScheme="blue"
          >
            Back to Marketplace
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg="background" color="text.primary" py={20}>
      <Container maxW="md">
        <VStack spacing={8} textAlign="center">
          {/* Success Icon */}
          <Box
            p={4}
            borderRadius="full"
            bg="green.500"
            color="white"
          >
            <Icon as={CheckCircle} boxSize={12} />
          </Box>
          
          {/* Success Message */}
          <VStack spacing={4}>
            <Text fontSize="3xl" fontWeight="bold" color="green.400">
              🎉 Purchase Successful!
            </Text>
            <Text fontSize="lg" color="whiteAlpha.800">
              Your strategy purchase has been completed successfully.
            </Text>
            <Text fontSize="md" color="whiteAlpha.600">
              You now have access to this trading strategy and can start receiving signals.
            </Text>
          </VStack>
          
          {/* Success Details */}
          <Box
            p={6}
            bg="whiteAlpha.100"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            w="full"
          >
            <VStack spacing={3} align="start">
              <Text fontWeight="semibold" color="white">
                What's Next?
              </Text>
              <VStack spacing={2} align="start" fontSize="sm" color="whiteAlpha.700">
                <Text>✅ Your subscription is now active</Text>
                <Text>✅ You'll receive trading signals for this strategy</Text>
                <Text>✅ Access strategy performance and analytics</Text>
                <Text>✅ Manage your subscription in your account settings</Text>
              </VStack>
            </VStack>
          </Box>
          
          {/* Action Buttons */}
          <VStack spacing={4} w="full">
            <Button
              onClick={handleBackToMarketplace}
              colorScheme="blue"
              size="lg"
              w="full"
            >
              Continue to Marketplace
            </Button>
            <Button
              variant="outline"
              borderColor="whiteAlpha.200"
              color="whiteAlpha.700"
              size="md"
              onClick={() => navigate('/dashboard')}
            >
              View My Dashboard
            </Button>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default PurchaseSuccessPage;