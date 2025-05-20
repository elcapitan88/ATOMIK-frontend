import React from 'react';
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
  useColorModeValue
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
  // In a real application, this data would come from API calls
  const metrics = [
    { title: "Total Users", value: "1,254", change: 12.5, icon: Users, colorScheme: "blue" },
    { title: "New Signups", value: "48", change: 22.0, icon: UserPlus, colorScheme: "green" },
    { title: "Active Users", value: "764", change: 5.3, icon: Activity, colorScheme: "purple" },
    { title: "Trades Today", value: "8,652", change: -2.4, icon: TrendingUp, colorScheme: "orange" }
  ];
  
  const systemStatus = [
    { name: "API Servers", status: "healthy", uptime: "99.99%" },
    { name: "WebSocket Service", status: "healthy", uptime: "99.95%" },
    { name: "Database", status: "healthy", uptime: "100%" },
    { name: "Webhook Processor", status: "warning", uptime: "98.76%" }
  ];
  
  const recentActivity = [
    { type: "signup", message: "New user registered", time: "2 min ago" },
    { type: "webhook", message: "Webhook processing delay detected", time: "15 min ago", status: "warning" },
    { type: "trade", message: "Large trade executed ($25,000)", time: "32 min ago" },
    { type: "user", message: "User password reset requested", time: "1 hour ago" },
    { type: "webhook", message: "TradingView webhook integration updated", time: "3 hours ago" },
    { type: "signup", message: "5 new users from marketing campaign", time: "5 hours ago" }
  ];
  
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
              {systemStatus.map((system, idx) => (
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