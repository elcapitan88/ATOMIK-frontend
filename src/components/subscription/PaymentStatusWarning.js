// src/components/subscription/PaymentStatusWarning.js
import React, { useMemo } from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  Flex,
  Box,
  Collapse,
  useDisclosure
} from '@chakra-ui/react';
import { 
  CreditCard, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

const PaymentStatusWarning = ({ showCompact = false }) => {
  const { paymentStatus, createPortalSession, isLoading } = useSubscription();
  const { isOpen, onToggle } = useDisclosure();

  // Calculate warning level and content based on payment status
  const warningInfo = useMemo(() => {
    if (!paymentStatus || !paymentStatus.has_payment_issues) {
      return null;
    }

    const dunningStage = paymentStatus.dunning_stage;
    const daysLeft = paymentStatus.days_left_in_grace_period || 0;
    const isInGracePeriod = paymentStatus.is_in_grace_period;

    switch (dunningStage) {
      case 'warning':
        return {
          status: 'warning',
          icon: CreditCard,
          title: 'Payment Issue Detected',
          description: isInGracePeriod 
            ? `Your recent payment failed. You have ${daysLeft} days remaining in your grace period to update your payment method.`
            : 'Your recent payment failed. Please update your payment method.',
          actionText: 'Update Payment Method',
          urgencyLevel: 1,
          colorScheme: 'yellow'
        };

      case 'urgent':
        return {
          status: 'warning',
          icon: Clock,
          title: 'Payment Required Soon',
          description: isInGracePeriod
            ? `Payment required soon! Only ${daysLeft} days left in your grace period. Update your payment method now to avoid service interruption.`
            : 'Payment is urgently required. Please update your payment method immediately.',
          actionText: 'Update Payment Now',
          urgencyLevel: 2,
          colorScheme: 'orange'
        };

      case 'final':
        return {
          status: 'warning',
          icon: AlertTriangle,
          title: 'Final Notice - Payment Required',
          description: isInGracePeriod
            ? `Final notice! Your account will be suspended in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Update your payment method immediately.`
            : 'Final notice! Update your payment method to avoid account suspension.',
          actionText: 'Update Payment Immediately',
          urgencyLevel: 3,
          colorScheme: 'red'
        };

      case 'suspended':
        return {
          status: 'error',
          icon: XCircle,
          title: 'Account Suspended - Payment Required',
          description: 'Your account has been suspended due to payment failure. Update your payment method to restore access to all features.',
          actionText: 'Restore Account',
          urgencyLevel: 4,
          colorScheme: 'red'
        };

      default:
        return null;
    }
  }, [paymentStatus]);

  // Don't render if no payment issues
  if (!warningInfo) {
    return null;
  }

  const handleUpdatePayment = async () => {
    await createPortalSession();
  };

  const IconComponent = warningInfo.icon;

  // Compact version for header/sidebar
  if (showCompact) {
    return (
      <Alert 
        status={warningInfo.status} 
        borderRadius="md" 
        size="sm"
        cursor="pointer"
        onClick={onToggle}
        _hover={{ opacity: 0.8 }}
      >
        <AlertIcon as={IconComponent} />
        <Box flex="1" textAlign="left">
          <AlertTitle fontSize="sm">{warningInfo.title}</AlertTitle>
        </Box>
        <Button
          size="xs"
          colorScheme={warningInfo.colorScheme}
          variant="solid"
          onClick={(e) => {
            e.stopPropagation();
            handleUpdatePayment();
          }}
          isLoading={isLoading}
          ml={2}
        >
          Fix Now
        </Button>
      </Alert>
    );
  }

  // Full version for detailed display
  return (
    <Alert 
      status={warningInfo.status} 
      borderRadius="lg" 
      flexDirection="column"
      p={4}
      bg={warningInfo.urgencyLevel >= 3 ? 'red.50' : warningInfo.urgencyLevel === 2 ? 'orange.50' : 'yellow.50'}
      borderColor={warningInfo.urgencyLevel >= 3 ? 'red.300' : warningInfo.urgencyLevel === 2 ? 'orange.300' : 'yellow.300'}
      borderWidth="1px"
    >
      <HStack w="full" spacing={4}>
        <AlertIcon as={IconComponent} boxSize={6} />
        
        <VStack align="start" flex="1" spacing={1}>
          <HStack>
            <AlertTitle fontSize="md" mb={0}>
              {warningInfo.title}
            </AlertTitle>
            <Badge 
              colorScheme={warningInfo.colorScheme} 
              variant="solid"
              fontSize="xs"
            >
              {paymentStatus.dunning_stage.toUpperCase()}
            </Badge>
          </HStack>
          
          <AlertDescription fontSize="sm" color="gray.600">
            {warningInfo.description}
          </AlertDescription>
          
          {paymentStatus.is_in_grace_period && paymentStatus.days_left_in_grace_period && (
            <Box w="full" mt={2}>
              <Flex justify="space-between" align="center" mb={1}>
                <Text fontSize="xs" fontWeight="medium">Grace Period</Text>
                <Text fontSize="xs">
                  {paymentStatus.days_left_in_grace_period} day{paymentStatus.days_left_in_grace_period === 1 ? '' : 's'} remaining
                </Text>
              </Flex>
              <Progress 
                value={((7 - paymentStatus.days_left_in_grace_period) / 7) * 100}
                size="sm"
                colorScheme={warningInfo.colorScheme}
                borderRadius="full"
              />
            </Box>
          )}
        </VStack>
        
        <Button
          colorScheme={warningInfo.colorScheme}
          variant="solid"
          leftIcon={<CreditCard size={16} />}
          onClick={handleUpdatePayment}
          isLoading={isLoading}
          size="md"
        >
          {warningInfo.actionText}
        </Button>
      </HStack>
      
      {/* Expandable details */}
      <Collapse in={isOpen} animateOpacity>
        <VStack align="start" mt={4} pt={4} borderTop="1px" borderColor="gray.200" spacing={2}>
          <Text fontSize="sm" fontWeight="medium">Payment Details:</Text>
          <Text fontSize="xs" color="gray.600">
            • Status: {paymentStatus.status || 'Unknown'}
          </Text>
          {paymentStatus.payment_failed_at && (
            <Text fontSize="xs" color="gray.600">
              • Failed at: {new Date(paymentStatus.payment_failed_at).toLocaleDateString()}
            </Text>
          )}
          {paymentStatus.grace_period_ends_at && (
            <Text fontSize="xs" color="gray.600">
              • Grace period ends: {new Date(paymentStatus.grace_period_ends_at).toLocaleDateString()}
            </Text>
          )}
        </VStack>
      </Collapse>
      
      <Button
        size="xs"
        variant="ghost"
        mt={2}
        onClick={onToggle}
        rightIcon={isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        _hover={{ bg: 'transparent' }}
      >
        {isOpen ? 'Less details' : 'More details'}
      </Button>
    </Alert>
  );
};

export default PaymentStatusWarning;