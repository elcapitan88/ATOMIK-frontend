import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Icon,
  useDisclosure,
  Spacer
} from '@chakra-ui/react';
import { Settings, DollarSign, Calendar, User } from 'lucide-react';
import { SubscriptionStatusBadge } from '../shared';
import ManageSubscriptionModal from './ManageSubscriptionModal';

const SubscriptionCard = ({ subscription, onRefresh }) => {
  const {
    isOpen: isManageOpen,
    onOpen: onManageOpen,
    onClose: onManageClose
  } = useDisclosure();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: subscription?.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getNextBillingText = () => {
    if (subscription.cancel_at_period_end) {
      return `Expires: ${formatDate(subscription.current_period_end)}`;
    }
    if (subscription.current_period_end) {
      return `Next billing: ${formatDate(subscription.current_period_end)}`;
    }
    return 'Billing date unavailable';
  };

  return (
    <>
      <Box
        bg="gray.900"
        border="1px solid"
        borderColor="gray.700"
        borderRadius="lg"
        p={5}
        position="relative"
        transition="all 0.2s"
        _hover={{
          borderColor: 'blue.500',
          transform: 'translateY(-2px)',
          shadow: 'lg',
          cursor: 'pointer'
        }}
        onClick={onManageOpen}
      >
        <VStack align="stretch" spacing={4}>
          {/* Header with Strategy Name and Status */}
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color="white">
                {subscription.strategy_name}
              </Text>
              <HStack spacing={2} color="gray.400" fontSize="sm">
                <Icon as={User} boxSize={3} />
                <Text>by {subscription.creator_name}</Text>
              </HStack>
            </VStack>
            <SubscriptionStatusBadge status={subscription.status} />
          </HStack>

          {/* Pricing Information */}
          <HStack spacing={4} color="gray.300" fontSize="sm">
            <HStack spacing={1}>
              <Icon as={DollarSign} boxSize={4} />
              <Text fontWeight="semibold">
                {formatCurrency(subscription.amount)}/{subscription.interval}
              </Text>
            </HStack>
          </HStack>

          {/* Billing Date */}
          <HStack spacing={1} color="gray.400" fontSize="sm">
            <Icon as={Calendar} boxSize={4} />
            <Text>{getNextBillingText()}</Text>
          </HStack>

          {/* Action Button */}
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            leftIcon={<Settings size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              onManageOpen();
            }}
            _hover={{
              bg: 'blue.900',
              borderColor: 'blue.400'
            }}
          >
            Manage Subscription
          </Button>
        </VStack>

        {/* Cancel Warning Badge */}
        {subscription.cancel_at_period_end && (
          <Badge
            colorScheme="yellow"
            position="absolute"
            top={2}
            right={2}
            fontSize="xs"
          >
            Canceling
          </Badge>
        )}
      </Box>

      {/* Management Modal */}
      <ManageSubscriptionModal
        isOpen={isManageOpen}
        onClose={onManageClose}
        subscription={subscription}
        onRefresh={onRefresh}
      />
    </>
  );
};

export default SubscriptionCard;