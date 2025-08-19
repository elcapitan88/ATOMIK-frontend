import React from 'react';
import {
  Box,
  VStack,
  Text,
  SimpleGrid,
  HStack,
  Button,
  Skeleton
} from '@chakra-ui/react';
import { TrendingUp, ExternalLink } from 'lucide-react';
import { BillingMetrics } from '../shared';

const UsageLimitsPanel = ({ subscription, resources }) => {
  if (!subscription || !resources) {
    return (
      <Box bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
        <VStack spacing={4} align="stretch">
          <Skeleton height="20px" width="50%" />
          <SimpleGrid columns={1} spacing={3}>
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </SimpleGrid>
        </VStack>
      </Box>
    );
  }

  const { limits } = subscription;
  const isProPlan = subscription.tier === 'pro';
  const isElitePlan = subscription.tier === 'elite';

  const getUpgradeMessage = () => {
    if (isElitePlan) return null;
    if (isProPlan) return "Upgrade to Pro for unlimited access";
    return "Upgrade to Starter for more resources";
  };

  const shouldShowUpgrade = () => {
    if (isElitePlan) return false;
    
    // Show upgrade if approaching limits
    const accountsUsage = resources.connected_accounts / limits.connected_accounts.limit;
    const webhooksUsage = resources.active_webhooks / limits.active_webhooks.limit;
    const strategiesUsage = resources.active_strategies / limits.active_strategies.limit;
    
    return accountsUsage > 0.7 || webhooksUsage > 0.7 || strategiesUsage > 0.7;
  };

  return (
    <Box bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Text color="white" fontSize="md" fontWeight="semibold">
            Usage & Limits
          </Text>
          <HStack spacing={1}>
            <TrendingUp size={16} color="#00C6E0" />
            <Text color="#00C6E0" fontSize="sm" fontWeight="medium">
              {subscription.tier.toUpperCase()}
            </Text>
          </HStack>
        </HStack>

        {/* Metrics Grid */}
        <SimpleGrid columns={1} spacing={4}>
          <BillingMetrics
            title="Trading Accounts"
            current={resources.connected_accounts}
            limit={limits.connected_accounts.limit}
            showProgress={true}
          />
          
          <BillingMetrics
            title="Active Webhooks"
            current={resources.active_webhooks}
            limit={limits.active_webhooks.limit}
            showProgress={true}
          />
          
          <BillingMetrics
            title="Active Strategies"
            current={resources.active_strategies}
            limit={limits.active_strategies.limit}
            showProgress={true}
          />
        </SimpleGrid>

        {/* Upgrade Prompt */}
        {shouldShowUpgrade() && getUpgradeMessage() && (
          <Box
            bg="rgba(0, 198, 224, 0.05)"
            p={4}
            borderRadius="md"
            border="1px solid rgba(0, 198, 224, 0.2)"
          >
            <VStack spacing={3}>
              <Text color="#00C6E0" fontSize="sm" fontWeight="medium" textAlign="center">
                {getUpgradeMessage()}
              </Text>
              <Button
                size="sm"
                bg="#00C6E0"
                color="white"
                _hover={{ bg: "#00A3B8" }}
                rightIcon={<ExternalLink size={14} />}
                onClick={() => {
                  // Navigate to pricing page or upgrade flow
                  window.open('/pricing', '_blank');
                }}
              >
                View Plans
              </Button>
            </VStack>
          </Box>
        )}

        {/* Elite Benefits */}
        {isElitePlan && (
          <Box
            bg="rgba(128, 90, 213, 0.05)"
            p={4}
            borderRadius="md"
            border="1px solid rgba(128, 90, 213, 0.2)"
          >
            <Text color="purple.300" fontSize="sm" textAlign="center" fontWeight="medium">
              🚀 Pro Plan: Unlimited resources available
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default UsageLimitsPanel;