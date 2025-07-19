// Test component to verify PaymentStatusWarning rendering
import React from 'react';
import { Box, VStack, Text, Button, Code, Divider } from '@chakra-ui/react';
import PaymentStatusWarning from './PaymentStatusWarning';
import { useSubscription } from '@/contexts/SubscriptionContext';

const PaymentStatusWarningTest = () => {
  const { paymentStatus, refreshSubscription, isLoading } = useSubscription();
  
  // Mock data for testing
  const mockPaymentStatus = {
    has_payment_issues: true,
    dunning_stage: 'warning',
    is_in_grace_period: true,
    days_left_in_grace_period: 7,
    payment_failed_at: '2025-07-19 19:09:48.271156',
    grace_period_ends_at: '2025-07-26 19:09:48.271156',
    status: 'active'
  };
  
  return (
    <VStack spacing={6} p={8} align="stretch" bg="gray.50" borderRadius="lg">
      <Text fontSize="2xl" fontWeight="bold">Payment Status Warning Test</Text>
      
      <Box>
        <Text fontSize="lg" mb={2}>Current Payment Status from Context:</Text>
        <Code p={4} display="block" whiteSpace="pre" overflowX="auto">
          {JSON.stringify(paymentStatus, null, 2)}
        </Code>
      </Box>
      
      <Button 
        onClick={() => refreshSubscription(true)} 
        isLoading={isLoading}
        colorScheme="blue"
      >
        Refresh Payment Status
      </Button>
      
      <Divider />
      
      <Box>
        <Text fontSize="lg" mb={2}>Live Component (using real data):</Text>
        <PaymentStatusWarning />
      </Box>
      
      <Divider />
      
      <Box>
        <Text fontSize="lg" mb={2}>Test Component (using mock data):</Text>
        <Text fontSize="sm" color="gray.600" mb={2}>
          This shows what the warning should look like with the expected data
        </Text>
        {/* Temporarily override the context for testing */}
        <Box sx={{ '& > *': { width: '100%' } }}>
          {React.createElement(() => {
            // Create a fake hook that returns our mock data
            const originalHook = React.useContext;
            React.useContext = (context) => {
              const value = originalHook(context);
              if (value && value.paymentStatus !== undefined) {
                return { ...value, paymentStatus: mockPaymentStatus };
              }
              return value;
            };
            
            const component = <PaymentStatusWarning />;
            
            // Restore original hook
            React.useContext = originalHook;
            
            return component;
          })}
        </Box>
      </Box>
      
      <Divider />
      
      <Box>
        <Text fontSize="lg" mb={2}>Compact Version Test:</Text>
        <PaymentStatusWarning showCompact={true} />
      </Box>
      
      <Box bg="yellow.50" p={4} borderRadius="md">
        <Text fontSize="sm">
          <strong>Debug Info:</strong><br />
          - If "Live Component" shows nothing but "Test Component" shows a warning, the issue is with the API data<br />
          - If both show nothing, there might be a React rendering issue<br />
          - Check browser console for errors<br />
          - The payment status should have has_payment_issues: true for the warning to show
        </Text>
      </Box>
    </VStack>
  );
};

export default PaymentStatusWarningTest;