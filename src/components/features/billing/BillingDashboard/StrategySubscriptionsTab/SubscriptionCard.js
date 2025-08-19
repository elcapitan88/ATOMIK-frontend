import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  useDisclosure,
  Tooltip,
  IconButton
} from '@chakra-ui/react';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  X, 
  ExternalLink,
  BarChart3 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SubscriptionStatusBadge } from '../shared';
import CancelSubscriptionModal from './CancelSubscriptionModal';

const MotionBox = motion(Box);

const SubscriptionCard = ({ subscription, onRefresh, delay = 0 }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isHovered, setIsHovered] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: subscription.currency || 'USD'
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

  const getIntervalText = (interval) => {
    switch (interval) {
      case 'month':
        return 'Monthly';
      case 'year':
        return 'Yearly';
      case 'week':
        return 'Weekly';
      default:
        return interval || 'One-time';
    }
  };

  const handleViewStrategy = () => {
    // Navigate to strategy details page
    window.open(`/marketplace/strategy/${subscription.strategy_id}`, '_blank');
  };

  const handleViewPerformance = () => {
    // Navigate to strategy performance page
    window.open(`/strategies/${subscription.strategy_id}/performance`, '_blank');
  };

  const canCancel = subscription.status === 'active' && !subscription.cancel_at_period_end;

  return (
    <>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Box
          bg="#1a1a1a"
          border="1px solid #333"
          borderRadius="lg"
          p={6}
          position="relative"
          overflow="hidden"
          _hover={{
            borderColor: "#00C6E0",
            transform: "translateY(-2px)",
            boxShadow: "0 8px 25px -8px rgba(0, 198, 224, 0.3)"
          }}
          transition="all 0.2s"
        >
          {/* Header */}
          <HStack justify="space-between" align="start" mb={4}>
            <VStack align="start" spacing={1} flex={1}>
              <Text color="white" fontSize="lg" fontWeight="semibold" noOfLines={1}>
                {subscription.strategy_name}
              </Text>
              <Text color="whiteAlpha.600" fontSize="sm">
                by {subscription.creator_name}
              </Text>
            </VStack>
            
            <HStack spacing={2}>
              <SubscriptionStatusBadge 
                status={subscription.status}
                size="sm"
              />
              
              {canCancel && (
                <Tooltip label="Cancel subscription">
                  <IconButton
                    aria-label="Cancel subscription"
                    icon={<X size={16} />}
                    size="sm"
                    variant="ghost"
                    color="red.400"
                    _hover={{ color: "red.300", bg: "rgba(229, 62, 62, 0.1)" }}
                    onClick={onOpen}
                  />
                </Tooltip>
              )}
            </HStack>
          </HStack>

          {/* Subscription Details */}
          <VStack spacing={3} align="stretch" mb={4}>
            {/* Amount & Interval */}
            <HStack justify="space-between">
              <HStack spacing={2} color="whiteAlpha.700">
                <DollarSign size={16} />
                <Text fontSize="sm">Amount:</Text>
              </HStack>
              <Text color="white" fontSize="sm" fontWeight="medium">
                {formatCurrency(subscription.amount)} / {getIntervalText(subscription.interval)}
              </Text>
            </HStack>

            {/* Current Period */}
            {subscription.current_period_end && (
              <HStack justify="space-between">
                <HStack spacing={2} color="whiteAlpha.700">
                  <Calendar size={16} />
                  <Text fontSize="sm">
                    {subscription.cancel_at_period_end ? 'Expires:' : 'Next billing:'}
                  </Text>
                </HStack>
                <Text color="white" fontSize="sm" fontWeight="medium">
                  {formatDate(subscription.current_period_end)}
                </Text>
              </HStack>
            )}

            {/* Trial End */}
            {subscription.trial_end && subscription.trial_end > Date.now() / 1000 && (
              <HStack justify="space-between">
                <HStack spacing={2} color="yellow.400">
                  <Calendar size={16} />
                  <Text fontSize="sm">Trial ends:</Text>
                </HStack>
                <Text color="yellow.400" fontSize="sm" fontWeight="medium">
                  {formatDate(subscription.trial_end)}
                </Text>
              </HStack>
            )}

            {/* Cancellation Notice */}
            {subscription.cancel_at_period_end && (
              <Box
                bg="rgba(229, 62, 62, 0.1)"
                p={3}
                borderRadius="md"
                border="1px solid rgba(229, 62, 62, 0.3)"
              >
                <Text color="red.400" fontSize="sm" textAlign="center">
                  ⚠️ This subscription will not renew
                </Text>
              </Box>
            )}
          </VStack>

          <Divider borderColor="#333" mb={4} />

          {/* Actions */}
          <HStack spacing={2}>
            <Button
              variant="outline"
              size="sm"
              borderColor="#333"
              color="whiteAlpha.700"
              _hover={{
                borderColor: "#00C6E0",
                color: "#00C6E0"
              }}
              leftIcon={<ExternalLink size={14} />}
              onClick={handleViewStrategy}
              flex={1}
            >
              View Strategy
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              borderColor="#333"
              color="whiteAlpha.700"
              _hover={{
                borderColor: "#00C6E0",
                color: "#00C6E0"
              }}
              leftIcon={<BarChart3 size={14} />}
              onClick={handleViewPerformance}
              flex={1}
            >
              Performance
            </Button>
          </HStack>

          {/* Hover Overlay */}
          {isHovered && (
            <Box
              position="absolute"
              top="0"
              right="0"
              width="100px"
              height="100px"
              bg="radial-gradient(circle, rgba(0, 198, 224, 0.1) 0%, transparent 70%)"
              pointerEvents="none"
              borderRadius="full"
              filter="blur(20px)"
            />
          )}
        </Box>
      </MotionBox>

      {/* Cancel Modal */}
      <CancelSubscriptionModal
        isOpen={isOpen}
        onClose={onClose}
        subscription={subscription}
        onSuccess={onRefresh}
      />
    </>
  );
};

export default SubscriptionCard;