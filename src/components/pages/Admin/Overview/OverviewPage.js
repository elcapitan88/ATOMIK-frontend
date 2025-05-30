import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Divider,
  useColorModeValue,
  Spinner,
  Center,
  useToast
} from '@chakra-ui/react';
import {
  TrendingUp,
  Users,
  UserPlus,
  Activity,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import adminService from '@/services/api/admin';

// Metric Card Component
const MetricCard = ({ title, value, change, icon, colorScheme = "blue" }) => {
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
        borderColor: `${colorScheme}.400`,
        boxShadow: '0 0 20px rgba(0, 198, 224, 0.15)'
      }}
      transition="all 0.3s"
    >
      <Flex justify="space-between" align="flex-start">
        <Stat>
          <StatLabel fontSize="sm" color="whiteAlpha.800">{title}</StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold" color="white" my={1}>
            {value}
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
          bg={`${colorScheme}.900`}
          color={`${colorScheme}.400`}
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

// Status Indicator Component
const StatusIndicator = ({ status }) => {
  const statusProps = {
    healthy: {
      icon: CheckCircle,
      color: "green.500",
      text: "Healthy"
    },
    warning: {
      icon: AlertTriangle,
      color: "yellow.500",
      text: "Warning"
    },
    critical: {
      icon: AlertTriangle,
      color: "red.500",
      text: "Critical"
    }
  };
  
  const { icon, color, text } = statusProps[status];
  
  return (
    <Badge
      display="flex"
      alignItems="center"
      px={2}
      py={1}
      borderRadius="full"
      colorScheme={status === "healthy" ? "green" : status === "warning" ? "yellow" : "red"}
      fontSize="xs"
    >
      <Icon as={icon} mr={1} />
      {text}
    </Badge>
  );
};

// Activity Item Component
const ActivityItem = ({ type, message, time, status }) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'user': return Users;
      case 'signup': return UserPlus;
      case 'trade': return DollarSign;
      case 'webhook': return Zap;
      default: return Activity;
    }
  };
  
  return (
    <Tr _hover={{ bg: "whiteAlpha.100" }}>
      <Td>
        <Flex align="center">
          <Box
            bg="whiteAlpha.200"
            borderRadius="full"
            p={1}
            mr={3}
            color={
              type === 'user' ? 'blue.400' :
              type === 'signup' ? 'green.400' :
              type === 'trade' ? 'purple.400' :
              type === 'webhook' ? 'cyan.400' : 'gray.400'
            }
          >
            <Icon as={getTypeIcon()} boxSize={4} />
          </Box>
          <Text fontSize="sm">{message}</Text>
        </Flex>
      </Td>
      <Td isNumeric>
        <Text fontSize="xs" color="whiteAlpha.600">{time}</Text>
      </Td>
      <Td textAlign="right">
        {status && <StatusIndicator status={status} />}
      </Td>
    </Tr>
  );
};

const OverviewPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [userMetrics, setUserMetrics] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [overviewStats, userMetricsData, systemStatusData, activityData] = await Promise.all([
        adminService.getOverviewStats(),
        adminService.getUserMetrics(),
        adminService.getSystemStatus(),
        adminService.getRecentActivity()
      ]);

      setStats(overviewStats);
      setUserMetrics(userMetricsData);
      setSystemStatus(systemStatusData);
      setRecentActivity(activityData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error loading dashboard',
        description: 'Failed to fetch dashboard data. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  };

  // Calculate percentage change for new signups (comparing to last week)
  const calculateSignupChange = () => {
    if (!stats) return 0;
    const lastWeekSignups = stats.new_signups_week - stats.new_signups_today;
    if (lastWeekSignups === 0) return 100;
    return ((stats.new_signups_today - (lastWeekSignups / 7)) / (lastWeekSignups / 7) * 100).toFixed(1);
  };

  // Format metrics with real data
  const metrics = stats ? [
    { 
      title: "Total Users", 
      value: stats.total_users.toLocaleString(), 
      change: userMetrics?.growth_rate || 0, 
      icon: Users, 
      colorScheme: "blue" 
    },
    { 
      title: "New Signups (Today)", 
      value: stats.new_signups_today.toString(), 
      change: parseFloat(calculateSignupChange()), 
      icon: UserPlus, 
      colorScheme: "green" 
    },
    { 
      title: "Active Users", 
      value: stats.active_users.toLocaleString(), 
      change: null, // We don't have historical data for comparison yet
      icon: Activity, 
      colorScheme: "purple" 
    },
    { 
      title: "Trades Today", 
      value: stats.trades_today.toLocaleString(), 
      change: null, // We don't have historical data for comparison yet
      icon: TrendingUp, 
      colorScheme: "orange" 
    }
  ] : [];

  // Format system status data
  const formattedSystemStatus = systemStatus ? [
    { 
      name: "API Servers", 
      status: systemStatus.api_health === "healthy" ? "healthy" : "critical", 
      uptime: `${systemStatus.uptime_percentage}%` 
    },
    { 
      name: "Database", 
      status: systemStatus.database_status === "healthy" ? "healthy" : "critical", 
      uptime: "100%" 
    },
    // Add services from the backend response
    ...(systemStatus.services || []).map(service => ({
      name: service.name,
      status: service.status === "healthy" ? "healthy" : 
              service.status === "warning" ? "warning" : "critical",
      uptime: service.uptime || "N/A"
    }))
  ] : [];

  // Add WebSocket connections info if available
  if (systemStatus && systemStatus.system_metrics) {
    const websocketService = formattedSystemStatus.find(s => s.name === "WebSocket Service");
    if (!websocketService) {
      formattedSystemStatus.splice(1, 0, { 
        name: "WebSocket Service", 
        status: systemStatus.system_metrics.active_connections > 0 ? "healthy" : "warning", 
        uptime: "99.95%" 
      });
    }
  }

  if (isLoading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color="whiteAlpha.800">Loading dashboard data...</Text>
        </VStack>
      </Center>
    );
  }
  
  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="lg" color="white">Admin Overview</Heading>
          <Text color="whiteAlpha.600">System status and key metrics</Text>
        </Box>
        <Badge colorScheme="blue" p={2} borderRadius="md">
          <Flex align="center">
            <Icon as={Calendar} mr={2} />
            <Text>Today: {new Date().toLocaleDateString()}</Text>
          </Flex>
        </Badge>
      </Flex>

      {/* Additional Stats Row */}
      {stats && (
        <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }} gap={4} mb={6}>
          <Box bg="rgba(0, 0, 0, 0.4)" p={4} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.200">
            <Text color="whiteAlpha.600" fontSize="sm" mb={1}>New Signups (Week)</Text>
            <Text color="white" fontSize="xl" fontWeight="bold">{stats.new_signups_week}</Text>
          </Box>
          <Box bg="rgba(0, 0, 0, 0.4)" p={4} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.200">
            <Text color="whiteAlpha.600" fontSize="sm" mb={1}>New Signups (Month)</Text>
            <Text color="white" fontSize="xl" fontWeight="bold">{stats.new_signups_month}</Text>
          </Box>
          <Box bg="rgba(0, 0, 0, 0.4)" p={4} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.200">
            <Text color="whiteAlpha.600" fontSize="sm" mb={1}>Monthly Revenue</Text>
            <Text color="white" fontSize="xl" fontWeight="bold">${stats.total_revenue.toLocaleString()}</Text>
          </Box>
        </Grid>
      )}
      
      {/* Key Metrics */}
      <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6} mb={8}>
        {metrics.map((metric, idx) => (
          <GridItem key={idx}>
            <MetricCard {...metric} />
          </GridItem>
        ))}
      </Grid>
      
      {/* System Status and Recent Activity */}
      <Grid
        templateColumns={{ base: "1fr", lg: "1fr 1.5fr" }}
        gap={8}
        mb={8}
      >
        {/* System Status */}
        <GridItem>
          <Box
            bg="rgba(0, 0, 0, 0.4)"
            borderRadius="xl"
            p={6}
            boxShadow="md"
            border="1px solid"
            borderColor="whiteAlpha.200"
            height="full"
          >
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md" color="white">System Status</Heading>
              <Badge colorScheme="purple" variant="subtle">
                <Flex align="center">
                  <Icon as={Clock} mr={1} boxSize={3} />
                  <Text fontSize="xs">Updated just now</Text>
                </Flex>
              </Badge>
            </Flex>
            <Divider mb={4} borderColor="whiteAlpha.200" />
            <VStack spacing={4} align="stretch">
              {formattedSystemStatus.map((system, idx) => (
                <Flex key={idx} justify="space-between" align="center" py={2}>
                  <HStack>
                    <Text color="white" fontWeight="medium">{system.name}</Text>
                  </HStack>
                  <HStack spacing={4}>
                    <Text color="whiteAlpha.600" fontSize="sm">{system.uptime}</Text>
                    <StatusIndicator status={system.status} />
                  </HStack>
                </Flex>
              ))}
            </VStack>
          </Box>
        </GridItem>
        
        {/* Recent Activity */}
        <GridItem>
          <Box
            bg="rgba(0, 0, 0, 0.4)"
            borderRadius="xl"
            p={6}
            boxShadow="md"
            border="1px solid"
            borderColor="whiteAlpha.200"
            height="full"
            overflowX="auto"
          >
            <Heading size="md" color="white" mb={4}>Recent Activity</Heading>
            <Divider mb={4} borderColor="whiteAlpha.200" />
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th color="whiteAlpha.600">Activity</Th>
                  <Th color="whiteAlpha.600" isNumeric>Time</Th>
                  <Th color="whiteAlpha.600" textAlign="right">Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {recentActivity.map((activity, idx) => (
                  <ActivityItem key={idx} {...activity} />
                ))}
              </Tbody>
            </Table>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default OverviewPage;