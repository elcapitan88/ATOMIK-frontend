import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Skeleton
} from '@chakra-ui/react';
import { CreditCard, Calendar, DollarSign } from 'lucide-react';
import { SubscriptionStatusBadge, PaymentMethodDisplay } from '../shared';

const SubscriptionOverview = ({ subscription, user }) => {
  if (!subscription) {
    return (
      <Box bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
        <VStack spacing={4} align="stretch">
          <Skeleton height="20px" width="60%" />
          <Skeleton height="16px" width="40%" />
          <Skeleton height="40px" />
        </VStack>
      </Box>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTierDisplayName = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'pro':
        return 'Starter';
      case 'elite':
        return 'Pro';
      case 'starter':
        return 'Starter';
      default:
        return tier || 'Free';
    }
  };

  return (
    <Box
      bg="linear-gradient(135deg, rgba(0, 198, 224, 0.1) 0%, rgba(0, 198, 224, 0.05) 100%)"
      p={6}
      borderRadius="lg"
      border="1px solid rgba(0, 198, 224, 0.3)"
      position="relative"
      overflow="hidden"
    >
      {/* Background decoration */}
      <Box
        position="absolute"
        top="-50%"
        right="-20%"
        width="200px"
        height="200px"
        bg="radial-gradient(circle, rgba(0, 198, 224, 0.2) 0%, transparent 70%)"
        borderRadius="full"
        filter="blur(40px)"
      />

      <VStack spacing={4} align="stretch" position="relative">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={2}>
            <Box color="#00C6E0">
              <CreditCard size={20} />
            </Box>
            <Text color="#00C6E0" fontSize="sm" fontWeight="semibold">
              CURRENT PLAN
            </Text>
          </HStack>
          <SubscriptionStatusBadge 
            status={subscription.status} 
            isLifetime={subscription.is_lifetime}
          />
        </HStack>

        {/* Plan Details */}
        <Box>
          <Text color="white" fontSize="2xl" fontWeight="bold">
            {getTierDisplayName(subscription.tier)} Plan
          </Text>
          <Text color="whiteAlpha.700" fontSize="sm" mt={1}>
            {subscription.is_lifetime 
              ? 'Lifetime access' 
              : `${subscription.status === 'active' ? 'Active' : 'Inactive'} subscription`
            }
          </Text>
        </Box>

        {/* Billing Info */}
        {!subscription.is_lifetime && (
          <VStack spacing={3} align="stretch">
            {/* Next Billing */}
            {subscription.next_billing_date && (
              <HStack justify="space-between">
                <HStack spacing={2} color="whiteAlpha.700">
                  <Calendar size={16} />
                  <Text fontSize="sm">Next billing:</Text>
                </HStack>
                <Text color="white" fontSize="sm" fontWeight="medium">
                  {formatDate(subscription.next_billing_date)}
                </Text>
              </HStack>
            )}

            {/* Next Amount */}
            {subscription.next_billing_amount && (
              <HStack justify="space-between">
                <HStack spacing={2} color="whiteAlpha.700">
                  <DollarSign size={16} />
                  <Text fontSize="sm">Amount:</Text>
                </HStack>
                <Text color="white" fontSize="sm" fontWeight="medium">
                  {formatCurrency(subscription.next_billing_amount)}
                </Text>
              </HStack>
            )}

            {/* Payment Method */}
            {subscription.payment_method && (
              <HStack justify="space-between">
                <Text color="whiteAlpha.700" fontSize="sm">Payment method:</Text>
                <PaymentMethodDisplay 
                  paymentMethod={subscription.payment_method}
                  showIcon={false}
                />
              </HStack>
            )}
          </VStack>
        )}

        {/* Lifetime Badge */}
        {subscription.is_lifetime && (
          <Box
            bg="rgba(128, 90, 213, 0.2)"
            p={3}
            borderRadius="md"
            border="1px solid rgba(128, 90, 213, 0.3)"
          >
            <Text color="purple.300" fontSize="sm" textAlign="center" fontWeight="medium">
              🎉 You have lifetime access to AtomikTrading!
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default SubscriptionOverview;