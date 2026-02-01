import React, { useState, useEffect } from 'react';
import { Box, SimpleGrid, VStack, HStack, Text, Flex, Spinner, Divider } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { DollarSign, Users, TrendingUp, CreditCard } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';
import SegmentedControl from '../components/SegmentedControl';
import StripeAccountManagement from '@/components/features/creators/StripeAccountManagement';

const MotionBox = motion(Box);

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } }
};

const StatRow = ({ label, value, color = 'white' }) => (
  <Flex justify="space-between" align="center" py={2}>
    <Text color="whiteAlpha.500" fontSize="13px">{label}</Text>
    <Text color={color} fontSize="14px" fontWeight="600" fontFeatureSettings="'tnum'">{value}</Text>
  </Flex>
);

const CreatorEarningsTab = () => {
  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/api/v1/analytics/dashboard?period=${period}`);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [period]);

  const revenue = analytics?.revenue || {};
  const subscribers = analytics?.subscribers || {};
  const payouts = analytics?.payouts || {};

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" key={period}>
      {/* Time Range Selector */}
      <MotionBox variants={itemVariants} mb={6}>
        <SegmentedControl
          options={[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
            { value: '365d', label: '1 Year' }
          ]}
          value={period}
          onChange={setPeriod}
          size="sm"
        />
      </MotionBox>

      {loading ? (
        <Box py={12} textAlign="center">
          <Spinner color="#00C6E0" size="lg" />
          <Text color="whiteAlpha.500" mt={4} fontSize="sm">Loading earnings data...</Text>
        </Box>
      ) : (
        <>
          {/* Revenue & Subscriber Panels */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
            {/* Revenue Breakdown */}
            <MotionBox
              variants={itemVariants}
              bg="#121212"
              border="1px solid rgba(255,255,255,0.06)"
              borderRadius="16px"
              p={5}
            >
              <HStack mb={4} spacing={2}>
                <DollarSign size={16} color="#00C6E0" />
                <Text color="white" fontSize="14px" fontWeight="600">Revenue Breakdown</Text>
              </HStack>

              <VStack spacing={0} divider={<Divider borderColor="rgba(255,255,255,0.04)" />}>
                <StatRow
                  label="Total Revenue"
                  value={`$${(revenue.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                />
                <StatRow
                  label="Platform Fee"
                  value={`-$${(revenue.platform_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  color="whiteAlpha.400"
                />
                <StatRow
                  label="Net Revenue"
                  value={`$${(revenue.net_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  color="#10b981"
                />
              </VStack>

              <Divider my={3} borderColor="rgba(255,255,255,0.08)" />

              <Text color="whiteAlpha.400" fontSize="11px" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em" mb={2}>
                By Type
              </Text>
              <VStack spacing={0} divider={<Divider borderColor="rgba(255,255,255,0.04)" />}>
                <StatRow label="Monthly" value={`$${(revenue.breakdown?.monthly || 0).toFixed(2)}`} />
                <StatRow label="Yearly" value={`$${(revenue.breakdown?.yearly || 0).toFixed(2)}`} />
                <StatRow label="Lifetime" value={`$${(revenue.breakdown?.lifetime || 0).toFixed(2)}`} />
                <StatRow label="Setup Fees" value={`$${(revenue.breakdown?.setup_fee || 0).toFixed(2)}`} />
              </VStack>
            </MotionBox>

            {/* Subscriber Distribution */}
            <MotionBox
              variants={itemVariants}
              bg="#121212"
              border="1px solid rgba(255,255,255,0.06)"
              borderRadius="16px"
              p={5}
            >
              <HStack mb={4} spacing={2}>
                <Users size={16} color="#00C6E0" />
                <Text color="white" fontSize="14px" fontWeight="600">Subscribers</Text>
              </HStack>

              <VStack spacing={0} divider={<Divider borderColor="rgba(255,255,255,0.04)" />}>
                <StatRow label="Active" value={subscribers.total_active || 0} />
                <StatRow label="Trials" value={subscribers.total_trials || 0} />
              </VStack>

              <Divider my={3} borderColor="rgba(255,255,255,0.08)" />

              <Text color="whiteAlpha.400" fontSize="11px" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em" mb={2}>
                By Plan
              </Text>
              <VStack spacing={0} divider={<Divider borderColor="rgba(255,255,255,0.04)" />}>
                <StatRow label="Monthly" value={subscribers.breakdown?.monthly || 0} />
                <StatRow label="Yearly" value={subscribers.breakdown?.yearly || 0} />
                <StatRow label="Lifetime" value={subscribers.breakdown?.lifetime || 0} />
              </VStack>

              <Divider my={3} borderColor="rgba(255,255,255,0.08)" />

              <VStack spacing={0} divider={<Divider borderColor="rgba(255,255,255,0.04)" />}>
                <StatRow
                  label="MRR"
                  value={`$${(subscribers.mrr || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  color="#00C6E0"
                />
                <StatRow
                  label="ARR"
                  value={`$${(subscribers.arr || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  color="#00C6E0"
                />
              </VStack>
            </MotionBox>
          </SimpleGrid>

          {/* Payout History */}
          <MotionBox
            variants={itemVariants}
            bg="#121212"
            border="1px solid rgba(255,255,255,0.06)"
            borderRadius="16px"
            p={5}
            mb={6}
          >
            <HStack mb={4} spacing={2}>
              <CreditCard size={16} color="#00C6E0" />
              <Text color="white" fontSize="14px" fontWeight="600">Payout History</Text>
            </HStack>

            {payouts.recent_payouts?.length > 0 ? (
              <VStack spacing={0}>
                {payouts.recent_payouts.map((payout, i) => (
                  <Flex
                    key={payout.id || i}
                    justify="space-between"
                    align="center"
                    py={3}
                    borderBottom={i < payouts.recent_payouts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                    w="100%"
                  >
                    <HStack spacing={3}>
                      <Box
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        bg={payout.status === 'paid' ? '#10b981' : payout.status === 'pending' ? '#f59e0b' : '#6b7280'}
                      />
                      <VStack align="start" spacing={0}>
                        <Text color="white" fontSize="13px" fontWeight="500">{payout.status?.toUpperCase()}</Text>
                        <Text color="whiteAlpha.400" fontSize="12px">
                          {new Date(payout.arrival_date).toLocaleDateString()}
                        </Text>
                      </VStack>
                    </HStack>
                    <Text color="white" fontSize="14px" fontWeight="600" fontFeatureSettings="'tnum'">
                      ${payout.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            ) : (
              <Box py={6} textAlign="center">
                <Text color="whiteAlpha.300" fontSize="sm">No payouts recorded yet</Text>
              </Box>
            )}

            <Flex justify="space-between" mt={3} pt={3} borderTop="1px solid rgba(255,255,255,0.04)">
              <StatRow label="Total Paid" value={`$${(payouts.total_paid || 0).toFixed(2)}`} color="#10b981" />
              <StatRow label="Pending" value={`$${(payouts.pending_payouts || 0).toFixed(2)}`} color="#f59e0b" />
            </Flex>
          </MotionBox>
        </>
      )}

      {/* Stripe Account Management */}
      <MotionBox variants={itemVariants}>
        <Text color="whiteAlpha.400" fontSize="11px" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em" mb={3}>
          Stripe Account Management
        </Text>
        <StripeAccountManagement />
      </MotionBox>
    </motion.div>
  );
};

export default CreatorEarningsTab;
