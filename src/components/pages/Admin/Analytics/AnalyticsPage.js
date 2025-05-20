import React, { useState } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Select,
  Button,
  ButtonGroup,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Tooltip,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Progress
} from '@chakra-ui/react';
import {
  BarChart2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Download,
  ChevronDown,
  Filter,
  RefreshCw,
  Share,
  AlertTriangle,
  CheckCircle,
  PieChart,
  Activity,
  UserPlus,
  ArrowUpRight,
  CreditCard
} from 'lucide-react';

// Mock Data
const mockAnalytics = {
  userStats: {
    totalUsers: 1254,
    activeUsers: 764,
    growthRate: 12.5,
    retentionRate: 87.2,
    newUsersToday: 48,
    newUsersThisWeek: 156,
    newUsersThisMonth: 342,
    // User growth by month
    userGrowth: [
      { month: 'Jan', users: 832 },
      { month: 'Feb', users: 901 },
      { month: 'Mar', users: 984 },
      { month: 'Apr', users: 1102 },
      { month: 'May', users: 1176 },
      { month: 'Jun', users: 1254 }
    ]
  },
  revenueStats: {
    monthlyRevenue: 24650,
    annualRevenue: 295800,
    avgRevenuePerUser: 19.65,
    growthRate: 15.8,
    // Revenue distribution by plan
    planDistribution: [
      { plan: 'Starter', users: 536, percentage: 42.7 },
      { plan: 'Pro', users: 486, percentage: 38.8 },
      { plan: 'Elite', users: 232, percentage: 18.5 }
    ],
    // Recent transactions
    recentTransactions: [
      { id: 'tx-12345', user: 'johndoe', amount: 49, plan: 'Pro', date: '2025-04-12T14:23:51Z', status: 'success' },
      { id: 'tx-12346', user: 'sarahw', amount: 89, plan: 'Elite', date: '2025-04-12T12:15:33Z', status: 'success' },
      { id: 'tx-12347', user: 'michaelb', amount: 49, plan: 'Pro', date: '2025-04-12T10:45:22Z', status: 'success' },
      { id: 'tx-12348', user: 'emmad', amount: 49, plan: 'Pro', date: '2025-04-12T09:12:05Z', status: 'success' },
      { id: 'tx-12349', user: 'alexm', amount: 0, plan: 'Starter', date: '2025-04-12T08:36:17Z', status: 'success' },
      { id: 'tx-12350', user: 'robertj', amount: 49, plan: 'Pro', date: '2025-04-11T23:58:42Z', status: 'failed' },
      { id: 'tx-12351', user: 'janesmith', amount: 89, plan: 'Elite', date: '2025-04-11T21:19:11Z', status: 'success' }
    ]
  },
  tradingStats: {
    totalTrades: 143527,
    tradesThisWeek: 12453,
    tradesPerUser: 114.5,
    growthRate: 22.4,
    // Trading volume by day
    volumeByDay: [
      { day: 'Mon', volume: 1245 },
      { day: 'Tue', volume: 1876 },
      { day: 'Wed', volume: 1543 },
      { day: 'Thu', volume: 2154 },
      { day: 'Fri', volume: 2876 },
      { day: 'Sat', volume: 1432 },
      { day: 'Sun', volume: 1125 }
    ],
    // Top traded instruments
    topInstruments: [
      { symbol: 'ES', name: 'E-mini S&P 500', volume: 32450, percentage: 22.6 },
      { symbol: 'NQ', name: 'E-mini NASDAQ-100', volume: 28765, percentage: 20.0 },
      { symbol: 'CL', name: 'Crude Oil', volume: 21543, percentage: 15.0 },
      { symbol: 'GC', name: 'Gold', volume: 18976, percentage: 13.2 },
      { symbol: 'RTY', name: 'E-mini Russell 2000', volume: 14325, percentage: 10.0 }
    ]
  },
  platformStats: {
    uptime: 99.98,
    avgResponseTime: 42,
    errorRate: 0.02,
    activeWebhooks: 86,
    apiRequests: 2453678,
    // System load over time
    systemLoad: [
      { time: '6am', load: 12 },
      { time: '9am', load: 45 },
      { time: '12pm', load: 65 },
      { time: '3pm', load: 85 },
      { time: '6pm', load: 72 },
      { time: '9pm', load: 38 },
      { time: '12am', load: 15 }
    ]
  }
};

// Format date to relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
};

// Format currency
const formatCurrency = (amount) => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Stats Card Component
const StatCard = ({ title, value, change, icon, suffix = '', iconColor = "blue.400", bgColor = "blue.900" }) => {
  const IconComponent = icon;
  const isPositive = change >= 0;
  
  return (
    <Box
      bg="rgba(0, 0, 0, 0.4)"
      borderRadius="xl"
      p={6}
      boxShadow="md"
      border="1px solid"
      borderColor="whiteAlpha.200"
      _hover={{
        borderColor: iconColor,
        boxShadow: '0 0 20px rgba(0, 198, 224, 0.15)'
      }}
      transition="all 0.3s"
    >
      <Flex justify="space-between" align="flex-start">
        <Stat>
          <StatLabel fontSize="sm" color="whiteAlpha.800">{title}</StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold" color="white" my={1}>
            {value}{suffix}
          </StatNumber>
          {change !== undefined && (
            <StatHelpText mb={0} color={isPositive ? "green.400" : "red.400"}>
              <StatArrow type={isPositive ? "increase" : "decrease"} />
              {Math.abs(change)}%
            </StatHelpText>
          )}
        </Stat>
        <Flex
          w="12"
          h="12"
          bg={bgColor}
          color={iconColor}
          justify="center"
          align="center"
          borderRadius="lg"
        >
          <IconComponent size={20} />
        </Flex>
      </Flex>
    </Box>
  );
};

// Chart Card Component
const ChartCard = ({ title, subtitle, children }) => (
  <Box
    bg="rgba(0, 0, 0, 0.4)"
    borderRadius="xl"
    border="1px solid"
    borderColor="whiteAlpha.200"
    p={6}
    height="100%"
  >
    <Flex justify="space-between" align="flex-start" mb={4}>
      <Box>
        <Heading size="md" color="white">{title}</Heading>
        {subtitle && <Text fontSize="sm" color="whiteAlpha.600" mt={1}>{subtitle}</Text>}
      </Box>
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<ChevronDown size={16} />}
          variant="ghost"
          color="whiteAlpha.600"
          size="sm"
          _hover={{ bg: "whiteAlpha.100", color: "white" }}
        />
        <MenuList bg="rgba(0, 0, 0, 0.8)" borderColor="whiteAlpha.200">
          <MenuItem
            icon={<Download size={14} />}
            _hover={{ bg: "whiteAlpha.100" }}
            bg="transparent"
            color="white"
          >
            Export as CSV
          </MenuItem>
          <MenuItem
            icon={<Share size={14} />}
            _hover={{ bg: "whiteAlpha.100" }}
            bg="transparent"
            color="white"
          >
            Share Report
          </MenuItem>
          <MenuItem
            icon={<RefreshCw size={14} />}
            _hover={{ bg: "whiteAlpha.100" }}
            bg="transparent"
            color="white"
          >
            Refresh Data
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
    <Box h="calc(100% - 50px)">{children}</Box>
  </Box>
);

// Placeholder Bar Chart Component
const BarChartPlaceholder = ({ data, xKey, yKey, color = "blue" }) => (
  <Box h="100%" position="relative" pt={6}>
    <Flex h="calc(100% - 30px)" align="flex-end" justify="space-between">
      {data.map((item, i) => {
        // Calculate height percentage based on max value
        const maxValue = Math.max(...data.map(d => d[yKey]));
        const heightPercentage = (item[yKey] / maxValue) * 100;
        
        return (
          <Flex 
            key={i} 
            direction="column" 
            align="center" 
            justify="flex-end"
            h="100%"
            flex="1"
          >
            <Tooltip label={`${item[xKey]}: ${item[yKey]}`} placement="top">
              <Box 
                w="80%" 
                h={`${heightPercentage}%`}
                bg={`${color}.400`}
                borderRadius="md"
                _hover={{ bg: `${color}.300` }}
                transition="all 0.2s"
              />
            </Tooltip>
            <Text fontSize="xs" color="whiteAlpha.600" mt={2}>
              {item[xKey]}
            </Text>
          </Flex>
        );
      })}
    </Flex>
  </Box>
);

// Placeholder Line Chart Component
const LineChartPlaceholder = ({ data, xKey, yKey }) => (
  <Box h="100%" w="100%" position="relative" pt={6}>
    <Box position="absolute" top={6} bottom={10} left={0} right={0}>
      {/* This would be replaced with a real chart library */}
      <Text color="whiteAlpha.600" textAlign="center" mt="30%">
        [Line Chart Visualization]
      </Text>
    </Box>
    <Flex justify="space-around" position="absolute" bottom={0} left={0} right={0}>
      {data.map((item, i) => (
        <Text key={i} fontSize="xs" color="whiteAlpha.600">
          {item[xKey]}
        </Text>
      ))}
    </Flex>
  </Box>
);

// Placeholder Pie Chart Component
const PieChartPlaceholder = ({ data, nameKey, valueKey }) => (
  <Box h="100%" position="relative">
    <Box position="absolute" top={0} bottom={0} left={0} right={0} display="flex" alignItems="center" justifyContent="center">
      {/* This would be replaced with a real chart library */}
      <Text color="whiteAlpha.600" textAlign="center">
        [Pie Chart Visualization]
      </Text>
    </Box>
    <Box mt="80%" px={4}>
      <VStack spacing={3} align="stretch">
        {data.map((item, i) => (
          <Flex key={i} align="center" justify="space-between">
            <HStack>
              <Box 
                w="12px" 
                h="12px" 
                borderRadius="sm" 
                bg={
                  i === 0 ? "blue.400" : 
                  i === 1 ? "purple.400" : 
                  i === 2 ? "cyan.400" : 
                  i === 3 ? "green.400" : 
                  i === 4 ? "yellow.400" : "gray.400"
                }
              />
              <Text fontSize="xs" color="white">{item[nameKey]}</Text>
            </HStack>
            <Text fontSize="xs" color="whiteAlpha.800">{item.percentage}%</Text>
          </Flex>
        ))}
      </VStack>
    </Box>
  </Box>
);

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState(0);
  
  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" color="white">Analytics & Reporting</Heading>
          <Text color="whiteAlpha.600">Platform usage and performance metrics</Text>
        </Box>
        <HStack spacing={4}>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            bg="rgba(0, 0, 0, 0.2)"
            border="1px solid"
            borderColor="whiteAlpha.300"
            color="white"
            size="md"
            width="180px"
            icon={<Filter size={12} />}
          >
            <option value="7d" style={{ backgroundColor: "#1A202C" }}>Last 7 days</option>
            <option value="30d" style={{ backgroundColor: "#1A202C" }}>Last 30 days</option>
            <option value="90d" style={{ backgroundColor: "#1A202C" }}>Last 90 days</option>
            <option value="1y" style={{ backgroundColor: "#1A202C" }}>Last 12 months</option>
            <option value="all" style={{ backgroundColor: "#1A202C" }}>All time</option>
          </Select>
          <ButtonGroup size="sm" isAttached variant="outline">
            <Tooltip label="Export Reports">
              <IconButton 
                icon={<Download size={16} />} 
                color="white"
                _hover={{ bg: "whiteAlpha.100" }}
              />
            </Tooltip>
            <Tooltip label="Refresh Data">
              <IconButton 
                icon={<RefreshCw size={16} />} 
                color="white"
                _hover={{ bg: "whiteAlpha.100" }}
              />
            </Tooltip>
          </ButtonGroup>
        </HStack>
      </Flex>
      
      {/* Stats Overview */}
      <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6} mb={8}>
        <StatCard 
          title="Total Users" 
          value={mockAnalytics.userStats.totalUsers} 
          change={mockAnalytics.userStats.growthRate} 
          icon={Users}
          iconColor="blue.400"
          bgColor="blue.900"
        />
        <StatCard 
          title="Monthly Revenue" 
          value={formatCurrency(mockAnalytics.revenueStats.monthlyRevenue)} 
          change={mockAnalytics.revenueStats.growthRate} 
          icon={DollarSign}
          iconColor="green.400"
          bgColor="green.900"
        />
        <StatCard 
          title="Trades (Weekly)" 
          value={mockAnalytics.tradingStats.tradesThisWeek.toLocaleString()} 
          change={mockAnalytics.tradingStats.growthRate} 
          icon={TrendingUp}
          iconColor="cyan.400"
          bgColor="cyan.900"
        />
        <StatCard 
          title="Retention Rate" 
          value={mockAnalytics.userStats.retentionRate}
          suffix="%" 
          icon={Activity}
          iconColor="purple.400"
          bgColor="purple.900"
        />
      </Grid>
      
      {/* Tabs for different analytics sections */}
      <Tabs 
        variant="enclosed" 
        colorScheme="blue"
        onChange={(index) => setActiveTab(index)}
        mb={8}
      >
        <TabList>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">User Analytics</Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">Revenue</Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">Trading Activity</Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">Platform</Tab>
        </TabList>
        
        <TabPanels mt={6}>
          {/* User Analytics Tab */}
          <TabPanel p={0}>
            <Grid templateColumns={{ base: "1fr", lg: "3fr 2fr" }} gap={6} mb={6}>
              {/* User Growth Chart */}
              <ChartCard 
                title="User Growth"
                subtitle="New user sign-ups over time"
              >
                <LineChartPlaceholder
                  data={mockAnalytics.userStats.userGrowth}
                  xKey="month"
                  yKey="users"
                />
              </ChartCard>
              
              {/* User Conversion & Acquisition */}
              <ChartCard 
                title="Acquisition Channels" 
                subtitle="Where users are coming from"
              >
                <PieChartPlaceholder
                  data={[
                    { channel: 'Organic Search', percentage: 34.5 },
                    { channel: 'Direct', percentage: 25.2 },
                    { channel: 'Referral', percentage: 18.7 },
                    { channel: 'Social Media', percentage: 15.3 },
                    { channel: 'Other', percentage: 6.3 }
                  ]}
                  nameKey="channel"
                  valueKey="percentage"
                />
              </ChartCard>
            </Grid>
            
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" }} gap={6} mb={6}>
              {/* New Users Card */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <Heading size="md" color="white" mb={4}>New Users</Heading>
                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                  <VStack align="flex-start">
                    <Text color="whiteAlpha.600" fontSize="sm">Today</Text>
                    <HStack align="flex-end">
                      <Text color="white" fontSize="xl" fontWeight="bold">{mockAnalytics.userStats.newUsersToday}</Text>
                      <Icon as={UserPlus} color="green.400" boxSize={4} />
                    </HStack>
                  </VStack>
                  <VStack align="flex-start">
                    <Text color="whiteAlpha.600" fontSize="sm">This Week</Text>
                    <Text color="white" fontSize="xl" fontWeight="bold">{mockAnalytics.userStats.newUsersThisWeek}</Text>
                  </VStack>
                  <VStack align="flex-start">
                    <Text color="whiteAlpha.600" fontSize="sm">This Month</Text>
                    <Text color="white" fontSize="xl" fontWeight="bold">{mockAnalytics.userStats.newUsersThisMonth}</Text>
                  </VStack>
                </Grid>
              </Box>
              
              {/* Active Users Card */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <Heading size="md" color="white" mb={4}>Active Users</Heading>
                <VStack align="stretch" spacing={3}>
                  <Flex justify="space-between" align="center">
                    <Text color="whiteAlpha.700" fontSize="sm">Daily Active</Text>
                    <Text color="white" fontWeight="bold">512</Text>
                  </Flex>
                  <Progress value={67} size="sm" colorScheme="blue" borderRadius="full" />
                  
                  <Flex justify="space-between" align="center">
                    <Text color="whiteAlpha.700" fontSize="sm">Weekly Active</Text>
                    <Text color="white" fontWeight="bold">764</Text>
                  </Flex>
                  <Progress value={60} size="sm" colorScheme="blue" borderRadius="full" />
                  
                  <Flex justify="space-between" align="center">
                    <Text color="whiteAlpha.700" fontSize="sm">Monthly Active</Text>
                    <Text color="white" fontWeight="bold">982</Text>
                  </Flex>
                  <Progress value={78} size="sm" colorScheme="blue" borderRadius="full" />
                </VStack>
              </Box>
              
              {/* User Behavior Card */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <Heading size="md" color="white" mb={4}>User Behavior</Heading>
                <VStack align="stretch" spacing={3}>
                  <Flex justify="space-between" align="center">
                    <Text color="whiteAlpha.700" fontSize="sm">Avg. Session Duration</Text>
                    <Text color="white" fontWeight="bold">14m 22s</Text>
                  </Flex>
                  
                  <Flex justify="space-between" align="center">
                    <Text color="whiteAlpha.700" fontSize="sm">Avg. Sessions per User</Text>
                    <Text color="white" fontWeight="bold">5.3 / week</Text>
                  </Flex>
                  
                  <Flex justify="space-between" align="center">
                    <Text color="whiteAlpha.700" fontSize="sm">Bounce Rate</Text>
                    <Text color="white" fontWeight="bold">24.8%</Text>
                  </Flex>
                  
                  <Flex justify="space-between" align="center">
                    <Text color="whiteAlpha.700" fontSize="sm">Avg. Page Views</Text>
                    <Text color="white" fontWeight="bold">8.7 / session</Text>
                  </Flex>
                </VStack>
              </Box>
            </Grid>
          </TabPanel>
          
          {/* Revenue Tab */}
          <TabPanel p={0}>
            <Grid templateColumns={{ base: "1fr", lg: "3fr 2fr" }} gap={6} mb={6}>
              {/* Revenue Chart */}
              <ChartCard 
                title="Revenue Trends"
                subtitle="Monthly revenue over time"
              >
                <LineChartPlaceholder
                  data={[
                    { month: 'Jan', revenue: 16200 },
                    { month: 'Feb', revenue: 18450 },
                    { month: 'Mar', revenue: 19850 },
                    { month: 'Apr', revenue: 21200 },
                    { month: 'May', revenue: 22900 },
                    { month: 'Jun', revenue: 24650 }
                  ]}
                  xKey="month"
                  yKey="revenue"
                />
              </ChartCard>
              
              {/* Subscription Distribution */}
              <ChartCard 
                title="Subscription Plans" 
                subtitle="Distribution of users by plan"
              >
                <PieChartPlaceholder
                  data={mockAnalytics.revenueStats.planDistribution}
                  nameKey="plan"
                  valueKey="percentage"
                />
              </ChartCard>
            </Grid>
            
            {/* Recent Transactions */}
            <Box
              bg="rgba(0, 0, 0, 0.4)"
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
              p={6}
              mb={6}
            >
              <HStack justify="space-between" mb={4}>
                <Heading size="md" color="white">Recent Transactions</Heading>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  color="blue.400" 
                  rightIcon={<ArrowUpRight size={14} />}
                  _hover={{ bg: "blackAlpha.400" }}
                >
                  View All
                </Button>
              </HStack>
              
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color="whiteAlpha.600">ID</Th>
                      <Th color="whiteAlpha.600">User</Th>
                      <Th color="whiteAlpha.600">Plan</Th>
                      <Th color="whiteAlpha.600" isNumeric>Amount</Th>
                      <Th color="whiteAlpha.600">Date</Th>
                      <Th color="whiteAlpha.600">Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {mockAnalytics.revenueStats.recentTransactions.map((tx) => (
                      <Tr key={tx.id} _hover={{ bg: "whiteAlpha.50" }}>
                        <Td color="whiteAlpha.700" fontSize="xs">{tx.id}</Td>
                        <Td color="white" fontWeight="medium">{tx.user}</Td>
                        <Td>
                          <Badge colorScheme={
                            tx.plan === 'Elite' ? 'purple' :
                            tx.plan === 'Pro' ? 'blue' : 'gray'
                          }>{tx.plan}</Badge>
                        </Td>
                        <Td isNumeric color="white">${tx.amount}</Td>
                        <Td color="whiteAlpha.700" fontSize="xs">{formatRelativeTime(tx.date)}</Td>
                        <Td>
                          <Badge colorScheme={tx.status === 'success' ? 'green' : 'red'}>
                            {tx.status}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Box>
            
            {/* Revenue Insights */}
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" }} gap={6}>
              {/* Monthly Recurring Revenue */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <HStack mb={4}>
                  <Icon as={CreditCard} color="green.400" boxSize={5} />
                  <Heading size="md" color="white">MRR</Heading>
                </HStack>
                
                <Text fontSize="2xl" fontWeight="bold" color="white" mb={1}>
                  {formatCurrency(mockAnalytics.revenueStats.monthlyRevenue)}
                </Text>
                
                <HStack color="green.400" fontSize="sm">
                  <Icon as={TrendingUp} boxSize={4} />
                  <Text>+{mockAnalytics.revenueStats.growthRate}% from last month</Text>
                </HStack>
              </Box>
              
              {/* Avg Revenue Per User */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <HStack mb={4}>
                  <Icon as={DollarSign} color="cyan.400" boxSize={5} />
                  <Heading size="md" color="white">ARPU</Heading>
                </HStack>
                
                <Text fontSize="2xl" fontWeight="bold" color="white" mb={1}>
                  ${mockAnalytics.revenueStats.avgRevenuePerUser}
                </Text>
                
                <HStack color="green.400" fontSize="sm">
                  <Icon as={TrendingUp} boxSize={4} />
                  <Text>+2.5% from last month</Text>
                </HStack>
              </Box>
              
              {/* Churn Rate */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <HStack mb={4}>
                  <Icon as={Users} color="purple.400" boxSize={5} />
                  <Heading size="md" color="white">Churn Rate</Heading>
                </HStack>
                
                <Text fontSize="2xl" fontWeight="bold" color="white" mb={1}>
                  2.8%
                </Text>
                
                <HStack color="green.400" fontSize="sm">
                  <Icon as={TrendingUp} boxSize={4} />
                  <Text>-0.5% from last month</Text>
                </HStack>
              </Box>
            </Grid>
          </TabPanel>
          
          {/* Trading Activity Tab */}
          <TabPanel p={0}>
            <Grid templateColumns={{ base: "1fr", lg: "3fr 2fr" }} gap={6} mb={6}>
              {/* Trading Volume Chart */}
              <ChartCard
                title="Trading Volume"
                subtitle="Daily trading activity"
              >
                <BarChartPlaceholder
                  data={mockAnalytics.tradingStats.volumeByDay}
                  xKey="day"
                  yKey="volume"
                  color="cyan"
                />
              </ChartCard>
              
              {/* Top Traded Instruments */}
              <ChartCard
                title="Top Traded Instruments"
                subtitle="Distribution by symbol"
              >
                <PieChartPlaceholder
                  data={mockAnalytics.tradingStats.topInstruments}
                  nameKey="symbol"
                  valueKey="percentage"
                />
              </ChartCard>
            </Grid>
            
            {/* Trading Metrics */}
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" }} gap={6} mb={6}>
              {/* Trading Volume Card */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <Heading size="md" color="white" mb={4}>Trading Volume</Heading>
                <VStack align="stretch" spacing={4}>
                  <Flex justify="space-between">
                    <Text color="whiteAlpha.700">Total Trades</Text>
                    <Text color="white" fontWeight="bold">{mockAnalytics.tradingStats.totalTrades.toLocaleString()}</Text>
                  </Flex>
                  <Divider borderColor="whiteAlpha.100" />
                  <Flex justify="space-between">
                    <Text color="whiteAlpha.700">Weekly Trades</Text>
                    <Text color="white" fontWeight="bold">{mockAnalytics.tradingStats.tradesThisWeek.toLocaleString()}</Text>
                  </Flex>
                  <Divider borderColor="whiteAlpha.100" />
                  <Flex justify="space-between">
                    <Text color="whiteAlpha.700">Avg. Trades/User</Text>
                    <Text color="white" fontWeight="bold">{mockAnalytics.tradingStats.tradesPerUser}</Text>
                  </Flex>
                </VStack>
              </Box>
              
              {/* Trading Hours Distribution */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <Heading size="md" color="white" mb={4}>Trading Hours</Heading>
                
                <VStack align="stretch" spacing={3}>
                  <Flex justify="space-between" align="center">
                    <Text color="whiteAlpha.700" fontSize="sm">Pre-Market (4am-9:30am)</Text>
                    <Text color="white" fontWeight="bold">8%</Text>
                  </Flex>
                  <Progress value={8} size="sm" colorScheme="blue" borderRadius="full" />
                  
                  <Flex justify="space-between" align="center">
                    <Text color="whiteAlpha.700" fontSize="sm">Market Hours (9:30am-4pm)</Text>
                    <Text color="white" fontWeight="bold">76%</Text>
                  </Flex>
                  <Progress value={76} size="sm" colorScheme="blue" borderRadius="full" />
                  
                  <Flex justify="space-between" align="center">
                    <Text color="whiteAlpha.700" fontSize="sm">After Hours (4pm-8pm)</Text>
                    <Text color="white" fontWeight="bold">12%</Text>
                  </Flex>
                  <Progress value={12} size="sm" colorScheme="blue" borderRadius="full" />
                  
                  <Flex justify="space-between" align="center">
                    <Text color="whiteAlpha.700" fontSize="sm">Overnight (8pm-4am)</Text>
                    <Text color="white" fontWeight="bold">4%</Text>
                  </Flex>
                  <Progress value={4} size="sm" colorScheme="blue" borderRadius="full" />
                </VStack>
              </Box>
              
              {/* Trading Performance */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <Heading size="md" color="white" mb={4}>Performance</Heading>
                <VStack align="stretch" spacing={4}>
                  <Flex justify="space-between">
                    <Text color="whiteAlpha.700">Win Rate</Text>
                    <Text color="green.400" fontWeight="bold">62.4%</Text>
                  </Flex>
                  <Divider borderColor="whiteAlpha.100" />
                  <Flex justify="space-between">
                    <Text color="whiteAlpha.700">Avg. Win</Text>
                    <Text color="white" fontWeight="bold">$342.18</Text>
                  </Flex>
                  <Divider borderColor="whiteAlpha.100" />
                  <Flex justify="space-between">
                    <Text color="whiteAlpha.700">Avg. Loss</Text>
                    <Text color="white" fontWeight="bold">$156.45</Text>
                  </Flex>
                  <Divider borderColor="whiteAlpha.100" />
                  <Flex justify="space-between">
                    <Text color="whiteAlpha.700">Average R:R</Text>
                    <Text color="white" fontWeight="bold">2.18:1</Text>
                  </Flex>
                </VStack>
              </Box>
            </Grid>
            
            {/* Top Trading Users */}
            <Box
              bg="rgba(0, 0, 0, 0.4)"
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
              p={6}
            >
              <HStack justify="space-between" mb={4}>
                <Heading size="md" color="white">Top Trading Users</Heading>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  color="blue.400" 
                  rightIcon={<ArrowUpRight size={14} />}
                  _hover={{ bg: "blackAlpha.400" }}
                >
                  View Details
                </Button>
              </HStack>
              
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color="whiteAlpha.600">User</Th>
                      <Th color="whiteAlpha.600" isNumeric>Total Trades</Th>
                      <Th color="whiteAlpha.600" isNumeric>Win Rate</Th>
                      <Th color="whiteAlpha.600" isNumeric>Volume</Th>
                      <Th color="whiteAlpha.600">Plan</Th>
                      <Th color="whiteAlpha.600">Since</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr _hover={{ bg: "whiteAlpha.50" }}>
                      <Td color="white" fontWeight="medium">johndoe</Td>
                      <Td isNumeric color="whiteAlpha.800">1,286</Td>
                      <Td isNumeric color="green.400">68.4%</Td>
                      <Td isNumeric color="whiteAlpha.800">$1.2M</Td>
                      <Td><Badge colorScheme="blue">Pro</Badge></Td>
                      <Td color="whiteAlpha.600" fontSize="xs">Sep 2024</Td>
                    </Tr>
                    <Tr _hover={{ bg: "whiteAlpha.50" }}>
                      <Td color="white" fontWeight="medium">janesmith</Td>
                      <Td isNumeric color="whiteAlpha.800">978</Td>
                      <Td isNumeric color="green.400">72.1%</Td>
                      <Td isNumeric color="whiteAlpha.800">$950K</Td>
                      <Td><Badge colorScheme="purple">Elite</Badge></Td>
                      <Td color="whiteAlpha.600" fontSize="xs">Oct 2024</Td>
                    </Tr>
                    <Tr _hover={{ bg: "whiteAlpha.50" }}>
                      <Td color="white" fontWeight="medium">michaelb</Td>
                      <Td isNumeric color="whiteAlpha.800">845</Td>
                      <Td isNumeric color="green.400">59.8%</Td>
                      <Td isNumeric color="whiteAlpha.800">$780K</Td>
                      <Td><Badge colorScheme="purple">Elite</Badge></Td>
                      <Td color="whiteAlpha.600" fontSize="xs">Sep 2024</Td>
                    </Tr>
                    <Tr _hover={{ bg: "whiteAlpha.50" }}>
                      <Td color="white" fontWeight="medium">sarahw</Td>
                      <Td isNumeric color="whiteAlpha.800">723</Td>
                      <Td isNumeric color="green.400">64.2%</Td>
                      <Td isNumeric color="whiteAlpha.800">$650K</Td>
                      <Td><Badge colorScheme="blue">Pro</Badge></Td>
                      <Td color="whiteAlpha.600" fontSize="xs">Oct 2024</Td>
                    </Tr>
                    <Tr _hover={{ bg: "whiteAlpha.50" }}>
                      <Td color="white" fontWeight="medium">robertj</Td>
                      <Td isNumeric color="whiteAlpha.800">612</Td>
                      <Td isNumeric color="yellow.400">52.7%</Td>
                      <Td isNumeric color="whiteAlpha.800">$540K</Td>
                      <Td><Badge colorScheme="gray">Starter</Badge></Td>
                      <Td color="whiteAlpha.600" fontSize="xs">Nov 2024</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Box>
            </Box>
          </TabPanel>
          
          {/* Platform Tab */}
          <TabPanel p={0}>
            <Grid templateColumns={{ base: "1fr", lg: "3fr 2fr" }} gap={6} mb={6}>
              {/* System Load Chart */}
              <ChartCard
                title="System Load"
                subtitle="Server utilization over time"
              >
                <LineChartPlaceholder
                  data={mockAnalytics.platformStats.systemLoad}
                  xKey="time"
                  yKey="load"
                />
              </ChartCard>
              
              {/* Error Rate Chart */}
              <ChartCard
                title="Error Rate"
                subtitle="System errors over time"
              >
                <BarChartPlaceholder
                  data={[
                    { day: 'Mon', errors: 0.025 },
                    { day: 'Tue', errors: 0.018 },
                    { day: 'Wed', errors: 0.022 },
                    { day: 'Thu', errors: 0.015 },
                    { day: 'Fri', errors: 0.020 },
                    { day: 'Sat', errors: 0.012 },
                    { day: 'Sun', errors: 0.010 }
                  ]}
                  xKey="day"
                  yKey="errors"
                  color="red"
                />
              </ChartCard>
            </Grid>
            
            {/* System Metrics */}
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr 1fr" }} gap={6} mb={6}>
              {/* Uptime Card */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <VStack align="center" spacing={2}>
                  <Text color="whiteAlpha.600" fontSize="sm">System Uptime</Text>
                  <Text color="green.400" fontSize="3xl" fontWeight="bold">
                    {mockAnalytics.platformStats.uptime}%
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="xs">Last 30 days</Text>
                </VStack>
              </Box>
              
              {/* Response Time Card */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <VStack align="center" spacing={2}>
                  <Text color="whiteAlpha.600" fontSize="sm">Avg Response Time</Text>
                  <Text color="cyan.400" fontSize="3xl" fontWeight="bold">
                    {mockAnalytics.platformStats.avgResponseTime}ms
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="xs">Last 24 hours</Text>
                </VStack>
              </Box>
              
              {/* Error Rate Card */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <VStack align="center" spacing={2}>
                  <Text color="whiteAlpha.600" fontSize="sm">Error Rate</Text>
                  <Text color="orange.400" fontSize="3xl" fontWeight="bold">
                    {mockAnalytics.platformStats.errorRate}%
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="xs">Last 24 hours</Text>
                </VStack>
              </Box>
              
              {/* API Requests Card */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <VStack align="center" spacing={2}>
                  <Text color="whiteAlpha.600" fontSize="sm">API Requests</Text>
                  <Text color="blue.400" fontSize="3xl" fontWeight="bold">
                    {(mockAnalytics.platformStats.apiRequests / 1000000).toFixed(1)}M
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="xs">Last 30 days</Text>
                </VStack>
              </Box>
            </Grid>
            
            {/* System Health */}
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
              {/* Service Status */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <Heading size="md" color="white" mb={4}>Service Status</Heading>
                <VStack align="stretch" spacing={3}>
                  <Flex justify="space-between" align="center">
                    <Text color="white">API Servers</Text>
                    <Badge colorScheme="green" variant="subtle">Operational</Badge>
                  </Flex>
                  <Divider borderColor="whiteAlpha.100" />
                  
                  <Flex justify="space-between" align="center">
                    <Text color="white">WebSocket Service</Text>
                    <Badge colorScheme="green" variant="subtle">Operational</Badge>
                  </Flex>
                  <Divider borderColor="whiteAlpha.100" />
                  
                  <Flex justify="space-between" align="center">
                    <Text color="white">Database</Text>
                    <Badge colorScheme="green" variant="subtle">Operational</Badge>
                  </Flex>
                  <Divider borderColor="whiteAlpha.100" />
                  
                  <Flex justify="space-between" align="center">
                    <Text color="white">Webhook Processor</Text>
                    <Badge colorScheme="yellow" variant="subtle">Degraded</Badge>
                  </Flex>
                  <Divider borderColor="whiteAlpha.100" />
                  
                  <Flex justify="space-between" align="center">
                    <Text color="white">Authentication</Text>
                    <Badge colorScheme="green" variant="subtle">Operational</Badge>
                  </Flex>
                </VStack>
              </Box>
              
              {/* Performance Alerts */}
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <Heading size="md" color="white" mb={4}>Recent Alerts</Heading>
                <VStack align="stretch" spacing={4}>
                  <Box px={3} py={2} bg="yellow.900" borderRadius="md">
                    <HStack>
                      <AlertTriangle size={16} color="#F6E05E" />
                      <Text color="white" fontSize="sm" fontWeight="medium">Webhook Processor Latency Increase</Text>
                    </HStack>
                    <Text color="whiteAlpha.800" fontSize="xs" mt={1} ml={6}>
                      30 minutes ago • Investigating increased webhook processing times
                    </Text>
                  </Box>
                  
                  <Box px={3} py={2} bg="green.900" borderRadius="md">
                    <HStack>
                      <Icon as={CheckCircle} boxSize={4} color="green.300" />
                      <Text color="white" fontSize="sm" fontWeight="medium">Database Optimization Complete</Text>
                    </HStack>
                    <Text color="whiteAlpha.800" fontSize="xs" mt={1} ml={6}>
                      2 hours ago • Successfully optimized database queries
                    </Text>
                  </Box>
                  
                  <Box px={3} py={2} bg="red.900" borderRadius="md">
                    <HStack>
                      <AlertTriangle size={16} color="#FC8181" />
                      <Text color="white" fontSize="sm" fontWeight="medium">API Rate Limiting Triggered</Text>
                    </HStack>
                    <Text color="whiteAlpha.800" fontSize="xs" mt={1} ml={6}>
                      5 hours ago • Unusual number of requests from IP 192.168.1.45
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AnalyticsPage;