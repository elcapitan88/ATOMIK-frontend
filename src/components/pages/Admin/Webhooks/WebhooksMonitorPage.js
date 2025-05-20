import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Grid,
  GridItem,
  HStack,
  VStack,
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
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useColorModeValue,
  useDisclosure,
  Tooltip,
  Link,
  Progress,
  Divider
} from '@chakra-ui/react';
import {
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Download,
  BarChart2,
  Layers,
  Activity,
  ChevronDown,
  ExternalLink,
  MoreVertical,
  Trash2,
  Copy,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

// Mock data for webhook statistics
const mockStats = {
  totalWebhooks: 86,
  totalRequests: 24653,
  successRate: 98.7,
  avgResponseTime: 42, // in ms
  activeIntegrations: 14,
  errorRate: 1.3,
  requestsToday: 843,
  // Status breakdown
  statusBreakdown: {
    active: 72,
    inactive: 8,
    error: 6
  },
  // Types breakdown
  typeBreakdown: {
    tradingview: 34,
    tradovate: 22,
    mt4: 12,
    custom: 18
  }
};

// Mock webhook logs
const mockWebhookLogs = [
  {
    id: 'wh-1234567890',
    timestamp: new Date(2025, 3, 13, 10, 45, 22).toISOString(),
    source: 'TradingView',
    endpoint: '/webhook/tv/signal/123456',
    status: 'success',
    responseTime: 38,
    userId: 'user123',
    payload: { symbol: 'ES', action: 'BUY', quantity: 2, price: 5432.75 }
  },
  {
    id: 'wh-1234567891',
    timestamp: new Date(2025, 3, 13, 10, 42, 15).toISOString(),
    source: 'Custom',
    endpoint: '/webhook/custom/alert/789012',
    status: 'success',
    responseTime: 42,
    userId: 'user456',
    payload: { symbol: 'NQ', action: 'SELL', quantity: 1, price: 18765.50 }
  },
  {
    id: 'wh-1234567892',
    timestamp: new Date(2025, 3, 13, 10, 40, 5).toISOString(),
    source: 'Tradovate',
    endpoint: '/webhook/tv/order/345678',
    status: 'error',
    responseTime: 156,
    userId: 'user789',
    error: 'Account balance insufficient',
    payload: { symbol: 'CL', action: 'BUY', quantity: 5, price: 82.35 }
  },
  {
    id: 'wh-1234567893',
    timestamp: new Date(2025, 3, 13, 10, 38, 42).toISOString(),
    source: 'MT4',
    endpoint: '/webhook/mt4/signal/901234',
    status: 'success',
    responseTime: 51,
    userId: 'user123',
    payload: { symbol: 'GC', action: 'SELL', quantity: 1, price: 2345.60 }
  },
  {
    id: 'wh-1234567894',
    timestamp: new Date(2025, 3, 13, 10, 35, 18).toISOString(),
    source: 'TradingView',
    endpoint: '/webhook/tv/signal/567890',
    status: 'warning',
    responseTime: 87,
    userId: 'user456',
    warning: 'Rate limit approaching',
    payload: { symbol: 'RTY', action: 'BUY', quantity: 3, price: 2187.25 }
  },
  {
    id: 'wh-1234567895',
    timestamp: new Date(2025, 3, 13, 10, 32, 9).toISOString(),
    source: 'Custom',
    endpoint: '/webhook/custom/alert/123789',
    status: 'success',
    responseTime: 36,
    userId: 'user789',
    payload: { symbol: 'AAPL', action: 'BUY', quantity: 100, price: 198.45 }
  },
  {
    id: 'wh-1234567896',
    timestamp: new Date(2025, 3, 13, 10, 30, 51).toISOString(),
    source: 'Tradovate',
    endpoint: '/webhook/tv/order/456789',
    status: 'error',
    responseTime: 145,
    userId: 'user123',
    error: 'Symbol not found',
    payload: { symbol: 'INVALID', action: 'BUY', quantity: 1, price: 0 }
  },
  {
    id: 'wh-1234567897',
    timestamp: new Date(2025, 3, 13, 10, 28, 37).toISOString(),
    source: 'MT4',
    endpoint: '/webhook/mt4/signal/234567',
    status: 'success',
    responseTime: 49,
    userId: 'user456',
    payload: { symbol: 'SI', action: 'SELL', quantity: 2, price: 27.85 }
  }
];

// Mock active webhooks
const mockActiveWebhooks = [
  {
    id: 'webhook-123456',
    name: 'TradingView Signal ES',
    url: 'https://api.atomiktrading.io/webhook/tv/signal/123456',
    source: 'TradingView',
    status: 'active',
    owner: 'johndoe',
    lastTrigger: new Date(2025, 3, 13, 10, 45, 22).toISOString(),
    totalTriggers: 234,
    errorRate: 0.5
  },
  {
    id: 'webhook-234567',
    name: 'Custom Alert NQ',
    url: 'https://api.atomiktrading.io/webhook/custom/alert/789012',
    source: 'Custom',
    status: 'active',
    owner: 'janesmith',
    lastTrigger: new Date(2025, 3, 13, 10, 42, 15).toISOString(),
    totalTriggers: 156,
    errorRate: 0.8
  },
  {
    id: 'webhook-345678',
    name: 'Tradovate Order',
    url: 'https://api.atomiktrading.io/webhook/tv/order/345678',
    source: 'Tradovate',
    status: 'error',
    owner: 'michaelb',
    lastTrigger: new Date(2025, 3, 13, 10, 40, 5).toISOString(),
    totalTriggers: 98,
    errorRate: 4.2
  },
  {
    id: 'webhook-456789',
    name: 'MT4 Gold Signal',
    url: 'https://api.atomiktrading.io/webhook/mt4/signal/901234',
    source: 'MT4',
    status: 'active',
    owner: 'sarahw',
    lastTrigger: new Date(2025, 3, 13, 10, 38, 42).toISOString(),
    totalTriggers: 78,
    errorRate: 1.2
  },
  {
    id: 'webhook-567890',
    name: 'TradingView Alert RTY',
    url: 'https://api.atomiktrading.io/webhook/tv/signal/567890',
    source: 'TradingView',
    status: 'warning',
    owner: 'alexm',
    lastTrigger: new Date(2025, 3, 13, 10, 35, 18).toISOString(),
    totalTriggers: 65,
    errorRate: 2.1
  }
];

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusProps = {
    success: { color: 'green', icon: CheckCircle, text: 'Success' },
    error: { color: 'red', icon: AlertTriangle, text: 'Error' },
    warning: { color: 'yellow', icon: AlertTriangle, text: 'Warning' },
    active: { color: 'green', icon: CheckCircle, text: 'Active' },
    inactive: { color: 'gray', icon: Pause, text: 'Inactive' }
  };
  
  const { color, icon, text } = statusProps[status] || statusProps.inactive;
  const Icon = icon;
  
  return (
    <Badge
      colorScheme={color}
      display="flex"
      alignItems="center"
      py={1}
      px={2}
      borderRadius="full"
    >
      <Icon size={12} style={{ marginRight: '4px' }} />
      {text}
    </Badge>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon, colorScheme = "blue", suffix = "", isPercentage = false }) => {
  const IconComponent = icon;
  const isPositive = change >= 0;
  
  return (
    <Box
      bg="rgba(0, 0, 0, 0.4)"
      borderRadius="xl"
      p={4}
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
          <StatNumber fontSize="xl" fontWeight="bold" color="white" my={1}>
            {isPercentage ? `${value}%` : value}{suffix}
          </StatNumber>
          {change !== undefined && (
            <StatHelpText mb={0} color={isPositive ? "green.400" : "red.400"}>
              <StatArrow type={isPositive ? "increase" : "decrease"} />
              {Math.abs(change)}%
            </StatHelpText>
          )}
        </Stat>
        <Flex
          w="10"
          h="10"
          bg={`${colorScheme}.900`}
          color={`${colorScheme}.400`}
          justify="center"
          align="center"
          borderRadius="lg"
        >
          <IconComponent size={18} />
        </Flex>
      </Flex>
    </Box>
  );
};

// Webhook Monitor Page
const WebhooksMonitorPage = () => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };
  
  // Filter webhook logs
  const filteredLogs = mockWebhookLogs.filter(log => {
    // Search filter
    const matchesSearch = 
      log.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    // Source filter
    const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });
  
  // Filter active webhooks
  const filteredWebhooks = mockActiveWebhooks.filter(webhook => {
    // Search filter
    const matchesSearch = 
      webhook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      webhook.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      webhook.owner.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || webhook.status === statusFilter;
    
    // Source filter
    const matchesSource = sourceFilter === 'all' || webhook.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });
  
  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" color="white">Webhook Monitoring</Heading>
          <Text color="whiteAlpha.600">Monitor webhook activity across the platform</Text>
        </Box>
        <HStack>
          <Tooltip label="Refresh Data">
            <IconButton
              icon={<RefreshCw size={16} />}
              aria-label="Refresh data"
              colorScheme="blue"
              variant="ghost"
            />
          </Tooltip>
        </HStack>
      </Flex>
      
      {/* Key Metrics */}
      <Grid 
        templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} 
        gap={4} 
        mb={8}
      >
        <GridItem>
          <MetricCard
            title="Success Rate"
            value={mockStats.successRate}
            change={0.8}
            icon={CheckCircle}
            colorScheme="green"
            isPercentage={true}
          />
        </GridItem>
        <GridItem>
          <MetricCard
            title="Avg Response Time"
            value={mockStats.avgResponseTime}
            change={-5.2}
            icon={Clock}
            colorScheme="blue"
            suffix="ms"
          />
        </GridItem>
        <GridItem>
          <MetricCard
            title="Total Webhooks"
            value={mockStats.totalWebhooks}
            change={12.5}
            icon={Zap}
            colorScheme="purple"
          />
        </GridItem>
        <GridItem>
          <MetricCard
            title="Requests Today"
            value={mockStats.requestsToday}
            change={22.3}
            icon={Activity}
            colorScheme="cyan"
          />
        </GridItem>
      </Grid>
      
      {/* Tab Navigation */}
      <Tabs 
        variant="enclosed" 
        colorScheme="blue" 
        mb={6}
        onChange={(index) => setSelectedTab(index)}
      >
        <TabList>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            Webhook Logs
          </Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            Active Webhooks
          </Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            Performance Metrics
          </Tab>
        </TabList>
        
        {/* Filters - Common to all tabs */}
        <Flex 
          justify="space-between" 
          align="center" 
          pt={6} 
          pb={4}
          borderBottom="1px solid"
          borderColor="whiteAlpha.200"
          flexDir={{ base: "column", md: "row" }}
          gap={4}
        >
          <InputGroup maxW={{ base: "full", md: "300px" }}>
            <InputLeftElement pointerEvents="none">
              <Search color="gray.300" size={18} />
            </InputLeftElement>
            <Input 
              placeholder={selectedTab === 0 ? "Search logs..." : "Search webhooks..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="rgba(0, 0, 0, 0.2)"
              border="1px solid"
              borderColor="whiteAlpha.300"
              _hover={{ borderColor: "whiteAlpha.400" }}
              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
              color="white"
            />
          </InputGroup>
          
          <HStack spacing={4}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              bg="rgba(0, 0, 0, 0.2)"
              border="1px solid"
              borderColor="whiteAlpha.300"
              _hover={{ borderColor: "whiteAlpha.400" }}
              color="white"
              size="md"
              maxW="150px"
              icon={<Filter size={12} />}
            >
              <option value="all" style={{ backgroundColor: "#1A202C" }}>All Status</option>
              <option value="success" style={{ backgroundColor: "#1A202C" }}>Success</option>
              <option value="error" style={{ backgroundColor: "#1A202C" }}>Error</option>
              <option value="warning" style={{ backgroundColor: "#1A202C" }}>Warning</option>
              <option value="active" style={{ backgroundColor: "#1A202C" }}>Active</option>
              <option value="inactive" style={{ backgroundColor: "#1A202C" }}>Inactive</option>
            </Select>
            
            <Select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              bg="rgba(0, 0, 0, 0.2)"
              border="1px solid"
              borderColor="whiteAlpha.300"
              _hover={{ borderColor: "whiteAlpha.400" }}
              color="white"
              size="md"
              maxW="150px"
              icon={<Filter size={12} />}
            >
              <option value="all" style={{ backgroundColor: "#1A202C" }}>All Sources</option>
              <option value="TradingView" style={{ backgroundColor: "#1A202C" }}>TradingView</option>
              <option value="Tradovate" style={{ backgroundColor: "#1A202C" }}>Tradovate</option>
              <option value="MT4" style={{ backgroundColor: "#1A202C" }}>MT4</option>
              <option value="Custom" style={{ backgroundColor: "#1A202C" }}>Custom</option>
            </Select>
            
            <IconButton
              icon={<Download size={16} />}
              aria-label="Export data"
              variant="ghost"
              color="white"
              _hover={{ bg: "whiteAlpha.100" }}
            />
          </HStack>
        </Flex>
        
        <TabPanels>
          {/* Webhook Logs Tab */}
          <TabPanel p={0} pt={4}>
            <Box
              bg="rgba(0, 0, 0, 0.2)"
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
              overflowX="auto"
              mb={4}
            >
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th color="whiteAlpha.600">Time</Th>
                    <Th color="whiteAlpha.600">Source</Th>
                    <Th color="whiteAlpha.600">Endpoint</Th>
                    <Th color="whiteAlpha.600">Status</Th>
                    <Th color="whiteAlpha.600" isNumeric>Response Time</Th>
                    <Th color="whiteAlpha.600">User ID</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredLogs.map(log => (
                    <Tr key={log.id} _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}>
                      <Td color="whiteAlpha.800" fontSize="sm">{formatRelativeTime(log.timestamp)}</Td>
                      <Td>
                        <Badge colorScheme={
                          log.source === 'TradingView' ? 'blue' :
                          log.source === 'Tradovate' ? 'green' :
                          log.source === 'MT4' ? 'purple' : 'gray'
                        }>
                          {log.source}
                        </Badge>
                      </Td>
                      <Td color="whiteAlpha.800" fontSize="sm" maxW="200px" isTruncated>
                        <Tooltip label={log.endpoint}>
                          <Text>{log.endpoint}</Text>
                        </Tooltip>
                      </Td>
                      <Td>
                        <StatusBadge status={log.status} />
                      </Td>
                      <Td isNumeric color={
                        log.responseTime < 50 ? 'green.400' :
                        log.responseTime < 100 ? 'yellow.400' : 'red.400'
                      }>
                        {log.responseTime}ms
                      </Td>
                      <Td color="whiteAlpha.800" fontSize="sm">{log.userId}</Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<MoreVertical size={16} />}
                            variant="ghost"
                            color="white"
                            size="sm"
                            _hover={{ bg: "whiteAlpha.100" }}
                          />
                          <MenuList bg="rgba(0, 0, 0, 0.8)" borderColor="whiteAlpha.200">
                            <MenuItem
                              icon={<Eye size={14} />}
                              _hover={{ bg: "whiteAlpha.100" }}
                              bg="transparent"
                              color="white"
                            >
                              View Details
                            </MenuItem>
                            <MenuItem
                              icon={<Copy size={14} />}
                              _hover={{ bg: "whiteAlpha.100" }}
                              bg="transparent"
                              color="white"
                            >
                              Copy Payload
                            </MenuItem>
                            <MenuItem
                              icon={<RotateCcw size={14} />}
                              _hover={{ bg: "whiteAlpha.100" }}
                              bg="transparent"
                              color="white"
                            >
                              Replay Request
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              {filteredLogs.length === 0 && (
                <Flex justify="center" align="center" p={8} direction="column">
                  <AlertTriangle size={24} color="gray" />
                  <Text mt={2} color="whiteAlpha.600">No webhook logs found matching your criteria</Text>
                </Flex>
              )}
            </Box>
          </TabPanel>
          
          {/* Active Webhooks Tab */}
          <TabPanel p={0} pt={4}>
            <Box
              bg="rgba(0, 0, 0, 0.2)"
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
              overflowX="auto"
              mb={4}
            >
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th color="whiteAlpha.600">Name</Th>
                    <Th color="whiteAlpha.600">URL</Th>
                    <Th color="whiteAlpha.600">Source</Th>
                    <Th color="whiteAlpha.600">Status</Th>
                    <Th color="whiteAlpha.600">Owner</Th>
                    <Th color="whiteAlpha.600">Last Trigger</Th>
                    <Th color="whiteAlpha.600" isNumeric>Triggers</Th>
                    <Th color="whiteAlpha.600" isNumeric>Error %</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredWebhooks.map(webhook => (
                    <Tr key={webhook.id} _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}>
                      <Td color="white" fontSize="sm" fontWeight="medium">{webhook.name}</Td>
                      <Td color="whiteAlpha.800" fontSize="sm" maxW="200px" isTruncated>
                        <Tooltip label={webhook.url}>
                          <Text>{webhook.url}</Text>
                        </Tooltip>
                      </Td>
                      <Td>
                        <Badge colorScheme={
                          webhook.source === 'TradingView' ? 'blue' :
                          webhook.source === 'Tradovate' ? 'green' :
                          webhook.source === 'MT4' ? 'purple' : 'gray'
                        }>
                          {webhook.source}
                        </Badge>
                      </Td>
                      <Td>
                        <StatusBadge status={webhook.status} />
                      </Td>
                      <Td color="whiteAlpha.800" fontSize="sm">{webhook.owner}</Td>
                      <Td color="whiteAlpha.600" fontSize="sm">{formatRelativeTime(webhook.lastTrigger)}</Td>
                      <Td isNumeric color="whiteAlpha.800">{webhook.totalTriggers}</Td>
                      <Td isNumeric color={
                        webhook.errorRate < 1 ? 'green.400' :
                        webhook.errorRate < 3 ? 'yellow.400' : 'red.400'
                      }>
                        {webhook.errorRate}%
                      </Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<MoreVertical size={16} />}
                            variant="ghost"
                            color="white"
                            size="sm"
                            _hover={{ bg: "whiteAlpha.100" }}
                          />
                          <MenuList bg="rgba(0, 0, 0, 0.8)" borderColor="whiteAlpha.200">
                            <MenuItem
                              icon={<Eye size={14} />}
                              _hover={{ bg: "whiteAlpha.100" }}
                              bg="transparent"
                              color="white"
                            >
                              View Details
                            </MenuItem>
                            <MenuItem
                              icon={<Copy size={14} />}
                              _hover={{ bg: "whiteAlpha.100" }}
                              bg="transparent"
                              color="white"
                            >
                              Copy URL
                            </MenuItem>
                            <MenuItem
                              icon={webhook.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                              _hover={{ bg: "whiteAlpha.100" }}
                              bg="transparent"
                              color="white"
                            >
                              {webhook.status === 'active' ? 'Pause Webhook' : 'Activate Webhook'}
                            </MenuItem>
                            <MenuItem
                              icon={<RotateCcw size={14} />}
                              _hover={{ bg: "whiteAlpha.100" }}
                              bg="transparent"
                              color="white"
                            >
                              Reset Statistics
                            </MenuItem>
                            <MenuItem
                              icon={<Trash2 size={14} />}
                              _hover={{ bg: "whiteAlpha.100" }}
                              bg="transparent"
                              color="red.400"
                            >
                              Delete Webhook
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              {filteredWebhooks.length === 0 && (
                <Flex justify="center" align="center" p={8} direction="column">
                  <AlertTriangle size={24} color="gray" />
                  <Text mt={2} color="whiteAlpha.600">No webhooks found matching your criteria</Text>
                </Flex>
              )}
            </Box>
          </TabPanel>
          
          {/* Performance Metrics Tab */}
          <TabPanel p={0} pt={4}>
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
              {/* Response Time Chart */}
              <GridItem>
                <Box
                  bg="rgba(0, 0, 0, 0.2)"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  p={6}
                  mb={4}
                >
                  <Heading size="md" color="white" mb={4}>Response Time (24h)</Heading>
                  
                  {/* Mock Chart - Would be replaced with actual chart component */}
                  <Flex justify="space-between" flexDirection="column" h="200px">
                    <Text color="whiteAlpha.600" textAlign="center" my="auto">
                      [Response Time Chart - Visualization would go here]
                    </Text>
                    
                    <HStack justify="space-between" pt={4}>
                      <Text color="whiteAlpha.600" fontSize="sm">Min: 28ms</Text>
                      <Text color="whiteAlpha.600" fontSize="sm">Avg: 42ms</Text>
                      <Text color="whiteAlpha.600" fontSize="sm">Max: 156ms</Text>
                    </HStack>
                  </Flex>
                </Box>
              </GridItem>
              
              {/* Error Rate Chart */}
              <GridItem>
                <Box
                  bg="rgba(0, 0, 0, 0.2)"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  p={6}
                  mb={4}
                >
                  <Heading size="md" color="white" mb={4}>Error Rate (24h)</Heading>
                  
                  {/* Mock Chart - Would be replaced with actual chart component */}
                  <Flex justify="space-between" flexDirection="column" h="200px">
                    <Text color="whiteAlpha.600" textAlign="center" my="auto">
                      [Error Rate Chart - Visualization would go here]
                    </Text>
                    
                    <HStack justify="space-between" pt={4}>
                      <Text color="green.400" fontSize="sm">Success: 98.7%</Text>
                      <Text color="yellow.400" fontSize="sm">Warning: 0.5%</Text>
                      <Text color="red.400" fontSize="sm">Error: 0.8%</Text>
                    </HStack>
                  </Flex>
                </Box>
              </GridItem>
              
              {/* Webhook Types Distribution */}
              <GridItem>
                <Box
                  bg="rgba(0, 0, 0, 0.2)"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  p={6}
                  mb={4}
                >
                  <Heading size="md" color="white" mb={4}>Webhook Types</Heading>
                  
                  <VStack spacing={3} align="stretch" mt={4}>
                    <Box>
                      <Flex justify="space-between" mb={1}>
                        <Text color="whiteAlpha.800" fontSize="sm">TradingView</Text>
                        <Text color="whiteAlpha.800" fontSize="sm">{mockStats.typeBreakdown.tradingview}</Text>
                      </Flex>
                      <Progress 
                        value={(mockStats.typeBreakdown.tradingview / mockStats.totalWebhooks) * 100} 
                        colorScheme="blue" 
                        borderRadius="full" 
                        size="sm" 
                      />
                    </Box>
                    
                    <Box>
                      <Flex justify="space-between" mb={1}>
                        <Text color="whiteAlpha.800" fontSize="sm">Tradovate</Text>
                        <Text color="whiteAlpha.800" fontSize="sm">{mockStats.typeBreakdown.tradovate}</Text>
                      </Flex>
                      <Progress 
                        value={(mockStats.typeBreakdown.tradovate / mockStats.totalWebhooks) * 100} 
                        colorScheme="green" 
                        borderRadius="full" 
                        size="sm" 
                      />
                    </Box>
                    
                    <Box>
                      <Flex justify="space-between" mb={1}>
                        <Text color="whiteAlpha.800" fontSize="sm">MT4</Text>
                        <Text color="whiteAlpha.800" fontSize="sm">{mockStats.typeBreakdown.mt4}</Text>
                      </Flex>
                      <Progress 
                        value={(mockStats.typeBreakdown.mt4 / mockStats.totalWebhooks) * 100} 
                        colorScheme="purple" 
                        borderRadius="full" 
                        size="sm" 
                      />
                    </Box>
                    
                    <Box>
                      <Flex justify="space-between" mb={1}>
                        <Text color="whiteAlpha.800" fontSize="sm">Custom</Text>
                        <Text color="whiteAlpha.800" fontSize="sm">{mockStats.typeBreakdown.custom}</Text>
                      </Flex>
                      <Progress 
                        value={(mockStats.typeBreakdown.custom / mockStats.totalWebhooks) * 100} 
                        colorScheme="gray" 
                        borderRadius="full" 
                        size="sm" 
                      />
                    </Box>
                  </VStack>
                </Box>
              </GridItem>
              
              {/* Webhook Status Distribution */}
              <GridItem>
                <Box
                  bg="rgba(0, 0, 0, 0.2)"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  p={6}
                  mb={4}
                >
                  <Heading size="md" color="white" mb={4}>Webhook Status</Heading>
                  
                  <VStack spacing={3} align="stretch" mt={4}>
                    <Box>
                      <Flex justify="space-between" mb={1}>
                        <Text color="whiteAlpha.800" fontSize="sm">Active</Text>
                        <Text color="whiteAlpha.800" fontSize="sm">{mockStats.statusBreakdown.active}</Text>
                      </Flex>
                      <Progress 
                        value={(mockStats.statusBreakdown.active / mockStats.totalWebhooks) * 100} 
                        colorScheme="green" 
                        borderRadius="full" 
                        size="sm" 
                      />
                    </Box>
                    
                    <Box>
                      <Flex justify="space-between" mb={1}>
                        <Text color="whiteAlpha.800" fontSize="sm">Inactive</Text>
                        <Text color="whiteAlpha.800" fontSize="sm">{mockStats.statusBreakdown.inactive}</Text>
                      </Flex>
                      <Progress 
                        value={(mockStats.statusBreakdown.inactive / mockStats.totalWebhooks) * 100} 
                        colorScheme="gray" 
                        borderRadius="full" 
                        size="sm" 
                      />
                    </Box>
                    
                    <Box>
                      <Flex justify="space-between" mb={1}>
                        <Text color="whiteAlpha.800" fontSize="sm">Error</Text>
                        <Text color="whiteAlpha.800" fontSize="sm">{mockStats.statusBreakdown.error}</Text>
                      </Flex>
                      <Progress 
                        value={(mockStats.statusBreakdown.error / mockStats.totalWebhooks) * 100} 
                        colorScheme="red" 
                        borderRadius="full" 
                        size="sm" 
                      />
                    </Box>
                  </VStack>
                </Box>
              </GridItem>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default WebhooksMonitorPage;