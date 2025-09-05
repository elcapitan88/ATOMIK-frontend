import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  useToast,
  Spinner,
  Select,
  Button,
  HStack,
} from '@chakra-ui/react';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { strategiesApi } from '@/services/api/strategies';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatCurrency } from '@/utils/formatting/currency';

const StatCard = ({ title, value, subtext, trend, isLoading }) => (
  <Box
    bg="whiteAlpha.100"
    p={4}
    borderRadius="xl"
    backdropFilter="blur(10px)"
    borderWidth="1px"
    borderColor="whiteAlpha.200"
  >
    <Stat>
      <StatLabel color="whiteAlpha.700">{title}</StatLabel>
      {isLoading ? (
        <Spinner size="sm" mt={2} />
      ) : (
        <>
          <StatNumber fontSize="2xl" color="white">
            {value}
          </StatNumber>
          <StatHelpText
            color={trend === 'up' ? 'green.400' : trend === 'down' ? 'red.400' : 'whiteAlpha.600'}
            display="flex"
            alignItems="center"
            gap={1}
          >
            {trend === 'up' && <TrendingUp size={14} />}
            {trend === 'down' && <TrendingDown size={14} />}
            {subtext}
          </StatHelpText>
        </>
      )}
    </Stat>
  </Box>
);

const StrategyCard = ({ strategy, onSelect }) => {
  const winRate = strategy.total_trades > 0 
    ? (strategy.successful_trades / strategy.total_trades * 100).toFixed(1)
    : 0;

  return (
    <Box
      bg="whiteAlpha.100"
      p={4}
      borderRadius="xl"
      backdropFilter="blur(10px)"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      cursor="pointer"
      transition="all 0.3s"
      _hover={{ bg: 'whiteAlpha.200' }}
      onClick={() => onSelect(strategy)}
    >
      <VStack spacing={3} align="stretch">
        <Flex justify="space-between" align="center">
          <HStack spacing={2}>
            <Text fontWeight="bold" color="white">
              {strategy.type === 'single' ? strategy.ticker : strategy.groupName}
            </Text>
            <Badge colorScheme={strategy.type === 'single' ? 'blue' : 'purple'}>
              {strategy.type}
            </Badge>
          </HStack>
          <Badge colorScheme={strategy.isActive ? 'green' : 'red'}>
            {strategy.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </Flex>

        <Grid templateColumns="1fr 1fr" gap={4}>
          <Box>
            <Text fontSize="xs" color="whiteAlpha.600">Win Rate</Text>
            <Text 
              fontSize="lg" 
              color={parseFloat(winRate) >= 50 ? 'green.400' : 'red.400'}
              display="flex"
              alignItems="center"
              gap={1}
            >
              {winRate}%
              {parseFloat(winRate) >= 50 ? 
                <TrendingUp size={14} /> : 
                <TrendingDown size={14} />
              }
            </Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="whiteAlpha.600">Total Trades</Text>
            <Text fontSize="lg" color="white">{strategy.total_trades}</Text>
          </Box>
        </Grid>

        <Box>
          <Text fontSize="xs" color="whiteAlpha.600">Performance</Text>
          <Text fontSize="sm" color="white">
            {formatCurrency(strategy.total_pnl || 0)}
          </Text>
        </Box>

        <Box>
          <Text fontSize="xs" color="whiteAlpha.600">Last Signal</Text>
          <Text fontSize="sm" color="whiteAlpha.900">
            {strategy.last_triggered 
              ? new Date(strategy.last_triggered).toLocaleString()
              : 'No signals yet'}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

const Strategies = () => {
  const [strategies, setStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    totalStrategies: 0,
    activeStrategies: 0,
    totalTrades: 0,
    successRate: 0,
    totalPnL: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toast = useToast();
  const { status: wsStatus } = useWebSocket('tradovate');

  const calculateStats = useCallback((strategiesData) => {
    const activeStrategies = strategiesData.filter(s => s.isActive);
    const totalTrades = strategiesData.reduce((sum, s) => sum + s.total_trades, 0);
    const successfulTrades = strategiesData.reduce((sum, s) => sum + s.successful_trades, 0);
    const totalPnL = strategiesData.reduce((sum, s) => sum + (s.total_pnl || 0), 0);
    
    setStats({
      totalStrategies: strategiesData.length,
      activeStrategies: activeStrategies.length,
      totalTrades,
      successRate: totalTrades > 0 ? (successfulTrades / totalTrades * 100).toFixed(1) : 0,
      totalPnL
    });
  }, []);

  const fetchStrategies = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await strategiesApi.listStrategies();
      setStrategies(response);
      calculateStats(response);
    } catch (error) {
      toast({
        title: "Error fetching strategies",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, calculateStats]);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStrategies(false);
    setIsRefreshing(false);
  };

  const filteredStrategies = strategies.filter(strategy => {
    switch (filter) {
      case 'active':
        return strategy.isActive;
      case 'inactive':
        return !strategy.isActive;
      case 'single':
        return strategy.type === 'single';
      case 'multiple':
        return strategy.type === 'multiple';
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box 
      minH="100vh" 
      bg="background" 
      color="text.primary"
      p={6}
    >
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <Text fontSize="2xl" fontWeight="bold" color="white">
            Strategy Overview
          </Text>
          <HStack spacing={4}>
            <Select
              width="200px"
              bg="whiteAlpha.100"
              borderColor="whiteAlpha.200"
              color="white"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Strategies</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="single">Single Account</option>
              <option value="multiple">Multiple Account</option>
            </Select>
            <Button
              leftIcon={<RefreshCw size={16} />}
              onClick={handleRefresh}
              isLoading={isRefreshing}
              bg="transparent"
              color="white"
              borderWidth={1}
              borderColor="whiteAlpha.200"
              _hover={{ bg: 'whiteAlpha.100' }}
            >
              Refresh
            </Button>
          </HStack>
        </Flex>

        <Grid templateColumns="repeat(4, 1fr)" gap={6}>
          <StatCard
            title="Total Strategies"
            value={stats.totalStrategies}
            subtext={`${stats.activeStrategies} Active`}
            isLoading={isLoading}
          />
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            subtext="Overall Performance"
            trend={stats.successRate > 50 ? 'up' : 'down'}
            isLoading={isLoading}
          />
          <StatCard
            title="Total P&L"
            value={formatCurrency(stats.totalPnL)}
            subtext="Across All Strategies"
            trend={stats.totalPnL > 0 ? 'up' : 'down'}
            isLoading={isLoading}
          />
          <StatCard
            title="WebSocket Status"
            value={wsStatus === 'connected' ? 'Connected' : 'Disconnected'}
            subtext={wsStatus === 'connected' ? 'Real-time updates active' : 'Reconnecting...'}
            trend={wsStatus === 'connected' ? 'up' : 'down'}
            isLoading={false}
          />
        </Grid>

        {filteredStrategies.length === 0 ? (
          <Flex 
            justify="center" 
            align="center" 
            height="200px"
            bg="whiteAlpha.100"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
          >
            <VStack spacing={2}>
              <AlertTriangle size={24} color="white" opacity={0.6} />
              <Text color="whiteAlpha.600">
                No strategies found
              </Text>
            </VStack>
          </Flex>
        ) : (
          <Grid 
            templateColumns="repeat(auto-fill, minmax(300px, 1fr))" 
            gap={6}
          >
            {filteredStrategies.map(strategy => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onSelect={() => {/* Handle strategy selection */}}
              />
            ))}
          </Grid>
        )}
      </VStack>
    </Box>
  );
};

export default Strategies;