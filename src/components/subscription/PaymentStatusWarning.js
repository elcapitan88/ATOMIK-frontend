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

  // Compact version for header/sidebar with glass morphism
  if (showCompact) {
    return (
      <Box
        bg="rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
        borderWidth="1px"
        borderColor={
          warningInfo.urgencyLevel >= 3 
            ? "rgba(255, 107, 107, 0.3)" 
            : warningInfo.urgencyLevel === 2 
            ? "rgba(255, 165, 0, 0.3)" 
            : "rgba(236, 201, 75, 0.3)"
        }
        borderRadius="xl"
        p={3}
        cursor="pointer"
        onClick={onToggle}
        _hover={{ 
          bg: "rgba(255, 255, 255, 0.15)",
          borderColor: warningInfo.urgencyLevel >= 3 
            ? "rgba(255, 107, 107, 0.5)" 
            : warningInfo.urgencyLevel === 2 
            ? "rgba(255, 165, 0, 0.5)" 
            : "rgba(236, 201, 75, 0.5)"
        }}
        transition="all 0.3s ease"
        boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.15)"
      >
        <HStack spacing={3}>
          <Icon 
            as={IconComponent} 
            color={
              warningInfo.urgencyLevel >= 3 
                ? "#FF6B6B" 
                : warningInfo.urgencyLevel === 2 
                ? "#FFA500" 
                : "#ECC94B"
            }
            boxSize={4}
          />
          <Text 
            fontSize="sm" 
            color="white" 
            fontWeight="medium"
            flex="1"
            isTruncated
          >
            {warningInfo.title}
          </Text>
          <Button
            size="xs"
            bg={
              warningInfo.urgencyLevel >= 3 
                ? "linear-gradient(135deg, #FF6B6B, #FF5252)" 
                : warningInfo.urgencyLevel === 2 
                ? "linear-gradient(135deg, #FFA500, #FF8C00)" 
                : "linear-gradient(135deg, #ECC94B, #D69E2E)"
            }
            color="white"
            _hover={{
              bg: warningInfo.urgencyLevel >= 3 
                ? "linear-gradient(135deg, #FF5252, #FF4444)" 
                : warningInfo.urgencyLevel === 2 
                ? "linear-gradient(135deg, #FF8C00, #FF7700)" 
                : "linear-gradient(135deg, #D69E2E, #C69E1A)"
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleUpdatePayment();
            }}
            isLoading={isLoading}
            borderRadius="lg"
            fontSize="xs"
            fontWeight="bold"
          >
            Fix Now
          </Button>
        </HStack>
      </Box>
    );
  }

  // Full version for detailed display with glass morphism
  return (
    <Box
      bg="rgba(255, 255, 255, 0.1)"
      backdropFilter="blur(16px)"
      borderWidth="1px"
      borderColor={
        warningInfo.urgencyLevel >= 3 
          ? "rgba(255, 107, 107, 0.4)" 
          : warningInfo.urgencyLevel === 2 
          ? "rgba(255, 165, 0, 0.4)" 
          : "rgba(236, 201, 75, 0.4)"
      }
      borderRadius="xl"
      p={6}
      boxShadow={`0 8px 32px 0 ${
        warningInfo.urgencyLevel >= 3 
          ? "rgba(255, 107, 107, 0.25)" 
          : warningInfo.urgencyLevel === 2 
          ? "rgba(255, 165, 0, 0.25)" 
          : "rgba(236, 201, 75, 0.25)"
      }`}
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgGradient: `linear(135deg, ${
          warningInfo.urgencyLevel >= 3 
            ? "rgba(255, 107, 107, 0.1)" 
            : warningInfo.urgencyLevel === 2 
            ? "rgba(255, 165, 0, 0.1)" 
            : "rgba(236, 201, 75, 0.1)"
        }, transparent)`,
        pointerEvents: "none"
      }}
    >
      <VStack spacing={4} align="stretch" position="relative" zIndex={1}>
        <HStack w="full" spacing={4}>
          <Icon 
            as={IconComponent} 
            boxSize={6}
            color={
              warningInfo.urgencyLevel >= 3 
                ? "#FF6B6B" 
                : warningInfo.urgencyLevel === 2 
                ? "#FFA500" 
                : "#ECC94B"
            }
          />
          
          <VStack align="start" flex="1" spacing={2}>
            <HStack spacing={3}>
              <Text fontSize="lg" fontWeight="bold" color="white" mb={0}>
                {warningInfo.title}
              </Text>
              <Badge 
                bg={
                  warningInfo.urgencyLevel >= 3 
                    ? "rgba(255, 107, 107, 0.2)" 
                    : warningInfo.urgencyLevel === 2 
                    ? "rgba(255, 165, 0, 0.2)" 
                    : "rgba(236, 201, 75, 0.2)"
                }
                color={
                  warningInfo.urgencyLevel >= 3 
                    ? "#FF6B6B" 
                    : warningInfo.urgencyLevel === 2 
                    ? "#FFA500" 
                    : "#ECC94B"
                }
                borderWidth="1px"
                borderColor={
                  warningInfo.urgencyLevel >= 3 
                    ? "rgba(255, 107, 107, 0.3)" 
                    : warningInfo.urgencyLevel === 2 
                    ? "rgba(255, 165, 0, 0.3)" 
                    : "rgba(236, 201, 75, 0.3)"
                }
                borderRadius="lg"
                px={2}
                py={1}
                fontSize="xs"
                fontWeight="bold"
              >
                {paymentStatus.dunning_stage.toUpperCase()}
              </Badge>
            </HStack>
            
            <Text fontSize="sm" color="whiteAlpha.900" lineHeight="1.5">
              {warningInfo.description}
            </Text>
          
            {paymentStatus.is_in_grace_period && paymentStatus.days_left_in_grace_period && (
              <Box w="full" mt={3}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontSize="xs" fontWeight="medium" color="whiteAlpha.800">Grace Period</Text>
                  <Text fontSize="xs" color="white" fontWeight="bold">
                    {paymentStatus.days_left_in_grace_period} day{paymentStatus.days_left_in_grace_period === 1 ? '' : 's'} remaining
                  </Text>
                </Flex>
                <Box
                  w="full"
                  h="6px"
                  bg="rgba(255, 255, 255, 0.1)"
                  borderRadius="full"
                  overflow="hidden"
                  position="relative"
                >
                  <Box
                    h="full"
                    w={`${((7 - paymentStatus.days_left_in_grace_period) / 7) * 100}%`}
                    bgGradient={
                      warningInfo.urgencyLevel >= 3 
                        ? "linear(to-r, #FF6B6B, #FF5252)" 
                        : warningInfo.urgencyLevel === 2 
                        ? "linear(to-r, #FFA500, #FF8C00)" 
                        : "linear(to-r, #ECC94B, #D69E2E)"
                    }
                    borderRadius="full"
                    transition="width 0.5s ease"
                  />
                </Box>
              </Box>
            )}
          </VStack>
          
          <Button
            bg={
              warningInfo.urgencyLevel >= 3 
                ? "linear-gradient(135deg, #FF6B6B, #FF5252)" 
                : warningInfo.urgencyLevel === 2 
                ? "linear-gradient(135deg, #FFA500, #FF8C00)" 
                : "linear-gradient(135deg, #ECC94B, #D69E2E)"
            }
            color="white"
            _hover={{
              bg: warningInfo.urgencyLevel >= 3 
                ? "linear-gradient(135deg, #FF5252, #FF4444)" 
                : warningInfo.urgencyLevel === 2 
                ? "linear-gradient(135deg, #FF8C00, #FF7700)" 
                : "linear-gradient(135deg, #D69E2E, #C69E1A)",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 20px rgba(0, 198, 224, 0.4)"
            }}
            leftIcon={<CreditCard size={16} />}
            onClick={handleUpdatePayment}
            isLoading={isLoading}
            size="md"
            borderRadius="xl"
            fontWeight="bold"
            px={6}
            py={3}
            transition="all 0.3s ease"
            border="1px solid"
            borderColor="whiteAlpha.200"
            _active={{
              transform: "translateY(0px)"
            }}
          >
            {warningInfo.actionText}
          </Button>
        </HStack>
      
        {/* Expandable details */}
        <Collapse in={isOpen} animateOpacity>
          <Box 
            mt={4} 
            pt={4} 
            borderTop="1px" 
            borderColor="whiteAlpha.200"
            bg="rgba(255, 255, 255, 0.05)"
            borderRadius="lg"
            p={3}
          >
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" fontWeight="medium" color="white">Payment Details:</Text>
              <Text fontSize="xs" color="whiteAlpha.800">
                • Status: {paymentStatus.status || 'Unknown'}
              </Text>
              {paymentStatus.payment_failed_at && (
                <Text fontSize="xs" color="whiteAlpha.800">
                  • Failed at: {new Date(paymentStatus.payment_failed_at).toLocaleDateString()}
                </Text>
              )}
              {paymentStatus.grace_period_ends_at && (
                <Text fontSize="xs" color="whiteAlpha.800">
                  • Grace period ends: {new Date(paymentStatus.grace_period_ends_at).toLocaleDateString()}
                </Text>
              )}
            </VStack>
          </Box>
        </Collapse>
        
        <Button
          size="xs"
          variant="ghost"
          mt={3}
          onClick={onToggle}
          rightIcon={isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          color="whiteAlpha.700"
          _hover={{ 
            bg: 'rgba(255, 255, 255, 0.1)',
            color: 'white'
          }}
          borderRadius="lg"
        >
          {isOpen ? 'Less details' : 'More details'}
        </Button>
      </VStack>
    </Box>
  );
};

export default PaymentStatusWarning;