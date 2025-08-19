import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  SimpleGrid,
  Skeleton
} from '@chakra-ui/react';
import { 
  TrendingUp, 
  Download, 
  Settings, 
  ExternalLink,
  RefreshCw 
} from 'lucide-react';

const QuickActionsPanel = ({ subscription, onRefresh }) => {
  if (!subscription) {
    return (
      <Box bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
        <VStack spacing={4} align="stretch">
          <Skeleton height="20px" width="40%" />
          <SimpleGrid columns={2} spacing={3}>
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
          </SimpleGrid>
        </VStack>
      </Box>
    );
  }

  const canUpgrade = subscription.tier !== 'elite';
  const isActive = subscription.status === 'active';

  const handleUpgrade = () => {
    // Navigate to pricing page
    window.open('/pricing', '_blank');
  };

  const handleDownloadInvoices = () => {
    // Open Stripe portal directly to invoices section
    // This would typically be handled by the StripePortalButton
    console.log('Download invoices clicked');
  };

  const handleManagePayment = () => {
    // Open Stripe portal for payment method management
    console.log('Manage payment clicked');
  };

  const handleAccountSettings = () => {
    // Navigate to account settings
    window.location.href = '/settings?tab=profile';
  };

  return (
    <Box bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Text color="white" fontSize="md" fontWeight="semibold">
          Quick Actions
        </Text>

        {/* Actions Grid */}
        <SimpleGrid columns={2} spacing={3}>
          {/* Upgrade Plan */}
          {canUpgrade && (
            <Button
              variant="outline"
              size="sm"
              borderColor="#00C6E0"
              color="#00C6E0"
              _hover={{
                bg: "rgba(0, 198, 224, 0.1)",
                borderColor: "#00A3B8"
              }}
              leftIcon={<TrendingUp size={16} />}
              onClick={handleUpgrade}
            >
              Upgrade Plan
            </Button>
          )}

          {/* Download Invoices */}
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              borderColor="#333"
              color="whiteAlpha.700"
              _hover={{
                borderColor: "#00C6E0",
                color: "#00C6E0"
              }}
              leftIcon={<Download size={16} />}
              onClick={handleDownloadInvoices}
            >
              Invoices
            </Button>
          )}

          {/* Manage Payment */}
          {isActive && !subscription.is_lifetime && (
            <Button
              variant="outline"
              size="sm"
              borderColor="#333"
              color="whiteAlpha.700"
              _hover={{
                borderColor: "#00C6E0",
                color: "#00C6E0"
              }}
              leftIcon={<Settings size={16} />}
              onClick={handleManagePayment}
            >
              Payment
            </Button>
          )}

          {/* Account Settings */}
          <Button
            variant="outline"
            size="sm"
            borderColor="#333"
            color="whiteAlpha.700"
            _hover={{
              borderColor: "#00C6E0",
              color: "#00C6E0"
            }}
            leftIcon={<Settings size={16} />}
            onClick={handleAccountSettings}
          >
            Settings
          </Button>

          {/* Refresh Data */}
          <Button
            variant="outline"
            size="sm"
            borderColor="#333"
            color="whiteAlpha.700"
            _hover={{
              borderColor: "#00C6E0",
              color: "#00C6E0"
            }}
            leftIcon={<RefreshCw size={16} />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </SimpleGrid>

        {/* Tier-specific Messages */}
        {subscription.tier === 'starter' && (
          <Box
            bg="rgba(0, 198, 224, 0.05)"
            p={3}
            borderRadius="md"
            border="1px solid rgba(0, 198, 224, 0.2)"
          >
            <Text color="#00C6E0" fontSize="xs" textAlign="center">
              💡 Upgrade to Starter for more trading accounts and webhooks
            </Text>
          </Box>
        )}

        {subscription.tier === 'pro' && (
          <Box
            bg="rgba(0, 198, 224, 0.05)"
            p={3}
            borderRadius="md"
            border="1px solid rgba(0, 198, 224, 0.2)"
          >
            <Text color="#00C6E0" fontSize="xs" textAlign="center">
              🚀 Upgrade to Pro for unlimited accounts and advanced features
            </Text>
          </Box>
        )}

        {subscription.tier === 'elite' && (
          <Box
            bg="rgba(128, 90, 213, 0.05)"
            p={3}
            borderRadius="md"
            border="1px solid rgba(128, 90, 213, 0.2)"
          >
            <Text color="purple.300" fontSize="xs" textAlign="center">
              👑 You're on our highest tier with unlimited access to everything!
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default QuickActionsPanel;