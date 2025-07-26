// frontend/src/components/features/creator/CreatorDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Select,
  Grid,
  GridItem,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  useToast,
  Button,
  Divider,
  Badge,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Clock,
  CreditCard,
  Download,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';
import { formatCurrency } from '../../../utils/formatters';

const CreatorDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const response = await api.get(`/analytics/dashboard?period=${selectedPeriod}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error loading dashboard',
        description: error.response?.data?.detail || 'Failed to load analytics data',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  // Calculate percentage changes
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (isLoading) {
    return (
      <Box p={8}>
        <VStack spacing={4} align="center">
          <Spinner size="xl" color="blue.500" />
          <Text>Loading analytics...</Text>
        </VStack>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box p={8}>
        <Alert status="warning">
          <AlertIcon />
          <Text>No analytics data available. Start monetizing your strategies to see analytics.</Text>
        </Alert>
      </Box>
    );
  }

  const { revenue, subscribers, metrics, payouts } = dashboardData;

  return (
    <Box p={6}>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Text fontSize="2xl" fontWeight="bold">Creator Dashboard</Text>
          <Text color="gray.500">Track your performance and earnings</Text>
        </VStack>
        
        <HStack spacing={4}>
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            width="150px"
            bg="white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </Select>
          
          <Button
            leftIcon={<RefreshCw size={16} />}
            onClick={() => fetchDashboardData(false)}
            isLoading={isRefreshing}
            variant="outline"
          >
            Refresh
          </Button>
        </HStack>
      </HStack>

      {/* Key Metrics Grid */}
      <Grid templateColumns="repeat(4, 1fr)" gap={6} mb={8}>
        <GridItem>
          <Stat
            bg="white"
            p={6}
            borderRadius="lg"
            boxShadow="sm"
            borderWidth={1}
            borderColor="gray.200"
          >
            <StatLabel color="gray.600">Total Revenue</StatLabel>
            <StatNumber fontSize="3xl" color="green.600">
              {formatCurrency(revenue.total_revenue)}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              15% vs last period
            </StatHelpText>
          </Stat>
        </GridItem>

        <GridItem>
          <Stat
            bg="white"
            p={6}
            borderRadius="lg"
            boxShadow="sm"
            borderWidth={1}
            borderColor="gray.200"
          >
            <StatLabel color="gray.600">Net Earnings</StatLabel>
            <StatNumber fontSize="3xl" color="blue.600">
              {formatCurrency(revenue.net_revenue)}
            </StatNumber>
            <StatHelpText>
              After 15% platform fee
            </StatHelpText>
          </Stat>
        </GridItem>

        <GridItem>
          <Stat
            bg="white"
            p={6}
            borderRadius="lg"
            boxShadow="sm"
            borderWidth={1}
            borderColor="gray.200"
          >
            <StatLabel color="gray.600">Active Subscribers</StatLabel>
            <StatNumber fontSize="3xl">{subscribers.total_active}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {subscribers.total_trials} in trial
            </StatHelpText>
          </Stat>
        </GridItem>

        <GridItem>
          <Stat
            bg="white"
            p={6}
            borderRadius="lg"
            boxShadow="sm"
            borderWidth={1}
            borderColor="gray.200"
          >
            <StatLabel color="gray.600">MRR</StatLabel>
            <StatNumber fontSize="3xl" color="purple.600">
              {formatCurrency(subscribers.mrr)}
            </StatNumber>
            <StatHelpText>
              ARR: {formatCurrency(subscribers.arr)}
            </StatHelpText>
          </Stat>
        </GridItem>
      </Grid>

      {/* Detailed Tabs */}
      <Tabs colorScheme="blue">
        <TabList>
          <Tab>Revenue</Tab>
          <Tab>Strategies</Tab>
          <Tab>Subscribers</Tab>
          <Tab>Payouts</Tab>
        </TabList>

        <TabPanels>
          {/* Revenue Tab */}
          <TabPanel>
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <GridItem>
                <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
                  <Text fontSize="lg" fontWeight="semibold" mb={4}>
                    Revenue Breakdown
                  </Text>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text color="gray.600">Monthly Subscriptions</Text>
                      <Text fontWeight="semibold">
                        {formatCurrency(revenue.breakdown.monthly)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.600">Yearly Subscriptions</Text>
                      <Text fontWeight="semibold">
                        {formatCurrency(revenue.breakdown.yearly)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.600">Lifetime Purchases</Text>
                      <Text fontWeight="semibold">
                        {formatCurrency(revenue.breakdown.lifetime)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.600">Setup Fees</Text>
                      <Text fontWeight="semibold">
                        {formatCurrency(revenue.breakdown.setup_fee)}
                      </Text>
                    </HStack>
                    <Divider />
                    <HStack justify="space-between">
                      <Text color="gray.600">Platform Fee (15%)</Text>
                      <Text color="red.500" fontWeight="semibold">
                        -{formatCurrency(revenue.platform_fee)}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              </GridItem>

              <GridItem>
                <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
                  <Text fontSize="lg" fontWeight="semibold" mb={4}>
                    Balance Information
                  </Text>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text color="gray.600">Available Balance</Text>
                      <Text fontWeight="semibold" color="green.600">
                        {formatCurrency(revenue.available_balance)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.600">Pending Balance</Text>
                      <Text fontWeight="semibold" color="orange.600">
                        {formatCurrency(revenue.pending_balance)}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              </GridItem>
            </Grid>
          </TabPanel>

          {/* Strategies Tab */}
          <TabPanel>
            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <HStack justify="space-between" mb={4}>
                <Text fontSize="lg" fontWeight="semibold">
                  Strategy Performance
                </Text>
                <HStack spacing={2}>
                  <Icon as={Eye} color="gray.500" />
                  <Text color="gray.600">
                    Total Views: {metrics.total_views.toLocaleString()}
                  </Text>
                </HStack>
              </HStack>

              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Strategy</Th>
                      <Th isNumeric>Views</Th>
                      <Th isNumeric>Unique Viewers</Th>
                      <Th isNumeric>Trial Starts</Th>
                      <Th isNumeric>Conversion Rate</Th>
                      <Th isNumeric>Avg. Duration</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {metrics.top_strategies.map((strategy) => (
                      <Tr key={strategy.strategy_id}>
                        <Td fontWeight="medium">{strategy.strategy_name}</Td>
                        <Td isNumeric>{strategy.views.toLocaleString()}</Td>
                        <Td isNumeric>{strategy.unique_viewers.toLocaleString()}</Td>
                        <Td isNumeric>{strategy.trial_starts}</Td>
                        <Td isNumeric>
                          <Badge colorScheme={strategy.conversion_rate > 5 ? 'green' : 'orange'}>
                            {strategy.conversion_rate}%
                          </Badge>
                        </Td>
                        <Td isNumeric>{strategy.avg_view_duration}s</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>

              <HStack mt={4} justify="space-between">
                <Text color="gray.600" fontSize="sm">
                  Showing top {metrics.top_strategies.length} of {metrics.strategy_count} strategies
                </Text>
                <Text color="blue.600" fontSize="sm">
                  Overall Conversion Rate: {metrics.overall_conversion_rate}%
                </Text>
              </HStack>
            </Box>
          </TabPanel>

          {/* Subscribers Tab */}
          <TabPanel>
            <Grid templateColumns="repeat(3, 1fr)" gap={6}>
              <GridItem colSpan={2}>
                <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
                  <Text fontSize="lg" fontWeight="semibold" mb={4}>
                    Subscriber Distribution
                  </Text>
                  
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text color="gray.600">Monthly Subscribers</Text>
                        <Text fontWeight="semibold">{subscribers.breakdown.monthly}</Text>
                      </HStack>
                      <Progress value={(subscribers.breakdown.monthly / subscribers.total_active) * 100} colorScheme="blue" />
                    </Box>
                    
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text color="gray.600">Yearly Subscribers</Text>
                        <Text fontWeight="semibold">{subscribers.breakdown.yearly}</Text>
                      </HStack>
                      <Progress value={(subscribers.breakdown.yearly / subscribers.total_active) * 100} colorScheme="green" />
                    </Box>
                    
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text color="gray.600">Lifetime Subscribers</Text>
                        <Text fontWeight="semibold">{subscribers.breakdown.lifetime}</Text>
                      </HStack>
                      <Progress value={(subscribers.breakdown.lifetime / subscribers.total_active) * 100} colorScheme="purple" />
                    </Box>
                  </VStack>
                </Box>
              </GridItem>

              <GridItem>
                <VStack spacing={4}>
                  <Box bg="green.50" p={6} borderRadius="lg" width="100%">
                    <VStack spacing={2}>
                      <Icon as={TrendingUp} size={32} color="green.600" />
                      <Text fontSize="2xl" fontWeight="bold" color="green.700">
                        {formatCurrency(subscribers.mrr)}
                      </Text>
                      <Text color="green.600" fontWeight="medium">Monthly Recurring</Text>
                    </VStack>
                  </Box>
                  
                  <Box bg="blue.50" p={6} borderRadius="lg" width="100%">
                    <VStack spacing={2}>
                      <Icon as={Activity} size={32} color="blue.600" />
                      <Text fontSize="2xl" fontWeight="bold" color="blue.700">
                        {formatCurrency(subscribers.arr)}
                      </Text>
                      <Text color="blue.600" fontWeight="medium">Annual Recurring</Text>
                    </VStack>
                  </Box>
                </VStack>
              </GridItem>
            </Grid>
          </TabPanel>

          {/* Payouts Tab */}
          <TabPanel>
            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <HStack justify="space-between" mb={6}>
                <Text fontSize="lg" fontWeight="semibold">
                  Payout History
                </Text>
                <HStack spacing={4}>
                  <VStack align="end" spacing={0}>
                    <Text fontSize="sm" color="gray.600">Total Paid</Text>
                    <Text fontSize="xl" fontWeight="bold" color="green.600">
                      {formatCurrency(payouts.total_paid)}
                    </Text>
                  </VStack>
                  <VStack align="end" spacing={0}>
                    <Text fontSize="sm" color="gray.600">Pending</Text>
                    <Text fontSize="xl" fontWeight="bold" color="orange.600">
                      {formatCurrency(payouts.pending_payouts)}
                    </Text>
                  </VStack>
                </HStack>
              </HStack>

              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                      <Th>Arrival Date</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {payouts.recent_payouts.map((payout) => (
                      <Tr key={payout.id}>
                        <Td>{new Date(payout.created).toLocaleDateString()}</Td>
                        <Td fontWeight="medium">{formatCurrency(payout.amount)}</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              payout.status === 'paid' ? 'green' : 
                              payout.status === 'pending' ? 'orange' : 'gray'
                            }
                          >
                            {payout.status}
                          </Badge>
                        </Td>
                        <Td>{new Date(payout.arrival_date).toLocaleDateString()}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>

              <HStack mt={4} justify="space-between">
                <Text color="gray.600" fontSize="sm">
                  Payout Schedule: {payouts.payout_schedule}
                </Text>
                <Button
                  size="sm"
                  leftIcon={<Download size={16} />}
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: 'Export coming soon',
                      description: 'Financial report export will be available in the next update',
                      status: 'info',
                      duration: 3000
                    });
                  }}
                >
                  Export Report
                </Button>
              </HStack>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default CreatorDashboard;