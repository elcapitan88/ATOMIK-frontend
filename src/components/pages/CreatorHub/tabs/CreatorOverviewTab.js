import React, { useState, useEffect } from 'react';
import { Box, SimpleGrid, VStack, HStack, Text, Flex, Spinner } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { DollarSign, Users, TrendingUp, Layers, ExternalLink, Eye } from 'lucide-react';
import { useCreator } from '@/hooks/useCreator';
import AnimatedStatCard from '../components/AnimatedStatCard';
import TierProgressRing from '../components/TierProgressRing';
import axiosInstance from '@/services/axiosConfig';

const MotionBox = motion(Box);

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } }
};

const CreatorOverviewTab = ({ creatorProfile }) => {
  const [analytics, setAnalytics] = useState(null);
  const [tierProgress, setTierProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [analyticsRes, tierRes] = await Promise.all([
          axiosInstance.get('/api/v1/analytics/dashboard?period=30d').catch(() => ({ data: null })),
          axiosInstance.get('/api/v1/creators/tier-progress').catch(() => ({ data: null }))
        ]);
        setAnalytics(analyticsRes.data);
        setTierProgress(tierRes.data);
      } catch (error) {
        console.error('Failed to load overview data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <Box py={12} textAlign="center">
        <Spinner color="#00C6E0" size="lg" />
        <Text color="whiteAlpha.500" mt={4} fontSize="sm">Loading dashboard...</Text>
      </Box>
    );
  }

  const totalEarnings = analytics?.revenue?.total_revenue || 0;
  const mrr = analytics?.subscribers?.mrr || 0;
  const totalSubscribers = analytics?.subscribers?.total_active || 0;
  const totalStrategies = analytics?.strategies?.total_strategies || 0;
  const recentPayouts = analytics?.payouts?.recent_payouts || [];

  const tier = tierProgress || {
    currentTier: creatorProfile?.current_tier || creatorProfile?.currentTier || 'bronze',
    currentSubscribers: totalSubscribers,
    nextTierThreshold: 100,
    progressPercentage: 0
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Hero Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
        <AnimatedStatCard
          label="Total Earnings"
          value={totalEarnings}
          prefix="$"
          decimals={2}
          icon={DollarSign}
          delay={0}
        />
        <AnimatedStatCard
          label="MRR"
          value={mrr}
          prefix="$"
          decimals={2}
          icon={TrendingUp}
          delay={0.06}
        />
        <AnimatedStatCard
          label="Subscribers"
          value={totalSubscribers}
          icon={Users}
          delay={0.12}
        />
        <AnimatedStatCard
          label="Strategies"
          value={totalStrategies}
          icon={Layers}
          delay={0.18}
        />
      </SimpleGrid>

      {/* Tier Progress */}
      <MotionBox variants={itemVariants} mb={6}>
        <TierProgressRing
          currentTier={tier.currentTier}
          currentSubscribers={tier.currentSubscribers}
          nextTierThreshold={tier.nextTierThreshold}
          progressPercentage={tier.progressPercentage}
        />
      </MotionBox>

      {/* Quick Actions */}
      <MotionBox variants={itemVariants} mb={6}>
        <Text color="whiteAlpha.400" fontSize="11px" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em" mb={3}>
          Quick Actions
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
          {[
            {
              icon: Layers,
              title: 'Monetize a Strategy',
              desc: 'Set pricing for your strategies',
              action: () => {}
            },
            {
              icon: Eye,
              title: 'View Public Profile',
              desc: 'See how others see you',
              action: () => {
                const username = creatorProfile?.username || creatorProfile?.display_name;
                if (username) window.open(`/creator/${username}`, '_blank');
              }
            },
            {
              icon: ExternalLink,
              title: 'Stripe Dashboard',
              desc: 'Manage payments directly',
              action: () => window.open('https://dashboard.stripe.com', '_blank')
            }
          ].map((action) => (
            <Box
              key={action.title}
              as="button"
              bg="#121212"
              border="1px solid rgba(255,255,255,0.06)"
              borderRadius="12px"
              p={4}
              textAlign="left"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                borderColor: 'rgba(0, 198, 224, 0.2)',
                transform: 'translateY(-1px)',
                bg: 'rgba(18,18,18,0.8)'
              }}
              onClick={action.action}
              w="100%"
            >
              <HStack spacing={3}>
                <Box color="#00C6E0" opacity={0.7}>
                  <action.icon size={18} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text color="white" fontSize="13px" fontWeight="600">{action.title}</Text>
                  <Text color="whiteAlpha.400" fontSize="12px">{action.desc}</Text>
                </VStack>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      </MotionBox>

      {/* Recent Payouts */}
      <MotionBox variants={itemVariants}>
        <Text color="whiteAlpha.400" fontSize="11px" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em" mb={3}>
          Recent Payouts
        </Text>
        <Box
          bg="#121212"
          border="1px solid rgba(255,255,255,0.06)"
          borderRadius="12px"
          overflow="hidden"
        >
          {recentPayouts.length > 0 ? (
            recentPayouts.slice(0, 5).map((payout, i) => (
              <Flex
                key={payout.id || i}
                justify="space-between"
                align="center"
                px={4}
                py={3}
                borderBottom={i < recentPayouts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
              >
                <HStack spacing={3}>
                  <Box
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg={payout.status === 'paid' ? '#10b981' : payout.status === 'pending' ? '#f59e0b' : '#6b7280'}
                  />
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontSize="13px" fontWeight="500">
                      {payout.status?.toUpperCase()}
                    </Text>
                    <Text color="whiteAlpha.400" fontSize="12px">
                      {new Date(payout.arrival_date).toLocaleDateString()}
                    </Text>
                  </VStack>
                </HStack>
                <Text color="white" fontSize="14px" fontWeight="600" fontFeatureSettings="'tnum'">
                  ${payout.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </Flex>
            ))
          ) : (
            <Box p={8} textAlign="center">
              <Text color="whiteAlpha.300" fontSize="sm">No payouts yet. Start earning to see them here.</Text>
            </Box>
          )}
        </Box>
      </MotionBox>
    </motion.div>
  );
};

export default CreatorOverviewTab;
