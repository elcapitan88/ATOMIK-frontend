// src/components/features/trading/HistoricalTradesView.js
import React, { useState, useMemo } from 'react';
import {
  Box, 
  Flex,
  Text,
  VStack,
  HStack,
  Select,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  InputGroup,
  Input,
  InputRightElement,
  Spinner
} from '@chakra-ui/react';
import { 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Search,
  MoreVertical,
  FileText,
  Download,
  ChevronDown,
} from 'lucide-react';
import { useTradeData } from '@/hooks/useTradeData';

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
};

// Format currency helper
const formatCurrency = (value) => {
  const numValue = Number(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(numValue);
};

// Custom scrollbar styles
const customScrollbarStyle = {
  '&::-webkit-scrollbar': {
    width: '6px',
    height: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 198, 224, 0.3)',
    borderRadius: '3px',
    transition: 'background 0.2s ease-in-out',
    '&:hover': {
      background: 'rgba(0, 198, 224, 0.5)',
    },
  },
  // Firefox support
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(0, 198, 224, 0.3) rgba(0, 0, 0, 0.2)',
};

const HistoricalTradesView = () => {
  // Get data from our custom hook
  const { historicalTrades, isLoading, error, activeAccounts, refreshData } = useTradeData();
  
  // State
  const [filter, setFilter] = useState({ symbol: 'all', side: 'all', account: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [timeRange, setTimeRange] = useState('7days');

  // Get unique symbols for filter
  const uniqueSymbols = [...new Set(historicalTrades.map(t => t.symbol))];

  // Filter trades based on current filters and time range
  const filteredTrades = useMemo(() => {
    return historicalTrades.filter(trade => {
      // Time range filter
      const tradeDate = new Date(trade.date);
      const now = new Date();
      
      if (timeRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (tradeDate < today) return false;
      } else if (timeRange === '7days') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        if (tradeDate < lastWeek) return false;
      } else if (timeRange === '30days') {
        const lastMonth = new Date();
        lastMonth.setDate(lastMonth.getDate() - 30);
        if (tradeDate < lastMonth) return false;
      } else if (timeRange === '90days') {
        const last3Months = new Date();
        last3Months.setDate(last3Months.getDate() - 90);
        if (tradeDate < last3Months) return false;
      }
      
      // Apply symbol filter
      if (filter.symbol !== 'all' && trade.symbol !== filter.symbol) return false;
      
      // Apply side filter
      if (filter.side !== 'all' && trade.side !== filter.side) return false;
      
      // Apply account filter
      if (filter.account !== 'all' && trade.accountId !== filter.account) return false;
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          trade.symbol.toLowerCase().includes(query) ||
          trade.side.toLowerCase().includes(query) ||
          trade.accountId?.toLowerCase().includes(query) ||
          trade.accountName?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [historicalTrades, filter, searchQuery, timeRange]);

  // Sort trades
  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => {
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc' 
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }
      
      if (sortConfig.key === 'pnl') {
        return sortConfig.direction === 'asc' 
          ? Number(a.pnl) - Number(b.pnl)
          : Number(b.pnl) - Number(a.pnl);
      }
      
      if (sortConfig.key === 'duration') {
        return sortConfig.direction === 'asc' 
          ? a.duration.localeCompare(b.duration)
          : b.duration.localeCompare(a.duration);
      }
      
      // Default to date sort
      return sortConfig.direction === 'asc' 
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    });
  }, [filteredTrades, sortConfig]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Calculate total PnL for today's trades
  const todaysPnL = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return filteredTrades
      .filter(trade => new Date(trade.date) >= today)
      .reduce((sum, trade) => sum + Number(trade.pnl), 0);
  }, [filteredTrades]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      totalTrades: filteredTrades.length,
      winningTrades: filteredTrades.filter(t => Number(t.pnl) > 0).length,
      losingTrades: filteredTrades.filter(t => Number(t.pnl) < 0).length,
      totalPnL: filteredTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0)
    };
  }, [filteredTrades]);

  return (
    <Box height="100%" overflow="hidden" display="flex" flexDirection="column">
      {/* Header with filters */}
      <Flex justify="flex-end" px={4} pt={2} pb={2} gap={2}>
        <HStack spacing={3} flexWrap="wrap">
          {/* Time range selector */}
          <Select
            size="sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            bg="rgba(0, 0, 0, 0.3)"
            borderColor="rgba(255, 255, 255, 0.1)"
            color="white"
            width="120px"
            h="32px"
            fontSize="xs"
            _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
            _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="all">All Time</option>
          </Select>
          
          {/* Symbol filter */}
          <Select
            size="sm"
            value={filter.symbol}
            onChange={(e) => setFilter(prev => ({ ...prev, symbol: e.target.value }))}
            bg="rgba(0, 0, 0, 0.3)"
            borderColor="rgba(255, 255, 255, 0.1)"
            color="white"
            width="110px"
            h="32px"
            fontSize="xs"
            _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
            _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
          >
            <option value="all">All Symbols</option>
            {uniqueSymbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </Select>
          
          {/* Side filter */}
          <Select
            size="sm"
            value={filter.side}
            onChange={(e) => setFilter(prev => ({ ...prev, side: e.target.value }))}
            bg="rgba(0, 0, 0, 0.3)"
            borderColor="rgba(255, 255, 255, 0.1)"
            color="white"
            width="100px"
            h="32px"
            fontSize="xs"
            _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
            _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
          >
            <option value="all">All Sides</option>
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
          </Select>
          
          {/* Account filter */}
          <Select
            size="sm"
            value={filter.account}
            onChange={(e) => setFilter(prev => ({ ...prev, account: e.target.value }))}
            bg="rgba(0, 0, 0, 0.3)"
            borderColor="rgba(255, 255, 255, 0.1)"
            color="white"
            width="140px"
            h="32px"
            fontSize="xs"
            _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
            _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
          >
            <option value="all">All Accounts</option>
            {activeAccounts.map(account => (
              <option key={account.account_id} value={account.account_id}>
                {account.nickname || account.name || account.account_id}
              </option>
            ))}
          </Select>
          
          {/* Search input */}
          <InputGroup size="sm" width="180px" h="32px">
            <Input
              placeholder="Search trades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="rgba(0, 0, 0, 0.3)"
              borderColor="rgba(255, 255, 255, 0.1)"
              color="white"
              fontSize="xs"
              _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
              _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
            />
            <InputRightElement h="32px">
              <Search size={14} color="rgba(255, 255, 255, 0.4)" />
            </InputRightElement>
          </InputGroup>
          
          {/* Refresh button */}
          <Tooltip label="Refresh">
            <IconButton
              icon={<RefreshCw size={16} />}
              variant="ghost"
              size="sm"
              aria-label="Refresh trades"
              color="rgba(255, 255, 255, 0.6)"
              onClick={refreshData}
              isLoading={isLoading}
              _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.1)' }}
              h="32px"
              w="32px"
              minW="32px"
            />
          </Tooltip>
        </HStack>
      </Flex>

      {/* Trades table */}
      <Box 
        flex="1" 
        overflowY="auto"
        px={4}
        sx={customScrollbarStyle}
      >
        {isLoading && historicalTrades.length === 0 ? (
          <Flex justify="center" align="center" h="200px">
            <Spinner size="xl" color="blue.400" />
          </Flex>
        ) : error ? (
          <Flex justify="center" align="center" h="200px" color="red.400">
            <AlertCircle size={20} />
            <Text ml={2}>{error}</Text>
          </Flex>
        ) : (
          <Table variant="unstyled" size="sm">
            <Thead>
              <Tr>
                <Th 
                  color="rgba(255, 255, 255, 0.6)" 
                  cursor="pointer"
                  onClick={() => handleSort('date')}
                  borderColor="transparent"
                  fontSize="xs"
                >
                  <HStack spacing={1}>
                    <Text>Date</Text>
                    {sortConfig.key === 'date' && (
                      <ChevronDown 
                        size={14} 
                        style={{ 
                          transform: sortConfig.direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }} 
                      />
                    )}
                  </HStack>
                </Th>
                <Th color="rgba(255, 255, 255, 0.6)" borderColor="transparent" fontSize="xs">Symbol</Th>
                <Th color="rgba(255, 255, 255, 0.6)" borderColor="transparent" fontSize="xs">Side</Th>
                <Th color="rgba(255, 255, 255, 0.6)" isNumeric borderColor="transparent" fontSize="xs">Qty</Th>
                <Th color="rgba(255, 255, 255, 0.6)" isNumeric borderColor="transparent" fontSize="xs">Entry</Th>
                <Th color="rgba(255, 255, 255, 0.6)" isNumeric borderColor="transparent" fontSize="xs">Exit</Th>
                <Th 
                  color="rgba(255, 255, 255, 0.6)" 
                  isNumeric
                  cursor="pointer"
                  onClick={() => handleSort('pnl')}
                  borderColor="transparent"
                  fontSize="xs"
                >
                  <HStack spacing={1} justifyContent="flex-end">
                    <Text>P&L</Text>
                    {sortConfig.key === 'pnl' && (
                      <ChevronDown 
                        size={14} 
                        style={{ 
                          transform: sortConfig.direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }} 
                      />
                    )}
                  </HStack>
                </Th>
                <Th 
                  color="rgba(255, 255, 255, 0.6)"
                  cursor="pointer"
                  onClick={() => handleSort('duration')}
                  borderColor="transparent"
                  fontSize="xs"
                >
                  <HStack spacing={1}>
                    <Text>Duration</Text>
                    {sortConfig.key === 'duration' && (
                      <ChevronDown 
                        size={14} 
                        style={{ 
                          transform: sortConfig.direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }} 
                      />
                    )}
                  </HStack>
                </Th>
                <Th color="rgba(255, 255, 255, 0.6)" borderColor="transparent" fontSize="xs">Account</Th>
                <Th width="50px" borderColor="transparent"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {sortedTrades.length === 0 ? (
                <Tr>
                  <Td colSpan={10} borderColor="transparent">
                    <Flex justify="center" align="center" py={8}>
                      <VStack spacing={4} textAlign="center">
                        <Box
                          w="50px"
                          h="50px"
                          borderRadius="full"
                          bg="linear-gradient(135deg, rgba(0, 198, 224, 0.1), rgba(153, 50, 204, 0.1))"
                          border="2px solid"
                          borderColor="rgba(0, 198, 224, 0.3)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          animation="pulse 2s infinite"
                        >
                          <FileText size={24} color="#00C6E0" />
                        </Box>
                        <VStack spacing={2}>
                          <Text color="white" fontSize="lg" fontWeight="bold">
                            Trade History Coming Soon!
                          </Text>
                          <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm" maxW="280px">
                            Comprehensive trade analytics, detailed performance reports, 
                            and advanced filtering options are on the way!
                          </Text>
                        </VStack>
                      </VStack>
                    </Flex>
                  </Td>
                </Tr>
              ) : (
                sortedTrades.map((trade) => (
                  <Tr 
                    key={trade.id}
                    _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
                    transition="background 0.2s"
                  >
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>{formatDate(trade.date)}</Td>
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      <Text>{trade.symbol}</Text>
                    </Td>
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      <Badge
                        bg={trade.side === 'BUY' ? 'rgba(72, 187, 120, 0.2)' : 'rgba(245, 101, 101, 0.2)'}
                        color={trade.side === 'BUY' ? 'green.400' : 'red.400'}
                        borderRadius="md"
                        fontSize="xs"
                        px={2}
                        py={0.5}
                      >
                        {trade.side}
                      </Badge>
                    </Td>
                    <Td isNumeric borderColor="rgba(255, 255, 255, 0.05)" py={2}>{trade.quantity}</Td>
                    <Td isNumeric borderColor="rgba(255, 255, 255, 0.05)" py={2}>{formatCurrency(trade.entryPrice)}</Td>
                    <Td isNumeric borderColor="rgba(255, 255, 255, 0.05)" py={2}>{formatCurrency(trade.exitPrice)}</Td>
                    <Td isNumeric borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      <HStack justify="flex-end" spacing={1}>
                        <Text
                          color={Number(trade.pnl) >= 0 ? 'green.400' : 'red.400'}
                          fontWeight="medium"
                        >
                          {formatCurrency(trade.pnl)}
                        </Text>
                        {Number(trade.pnl) > 0 ? (
                          <TrendingUp size={14} color="#48BB78" />
                        ) : (
                          <TrendingDown size={14} color="#F56565" />
                        )}
                      </HStack>
                    </Td>
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>{trade.duration}</Td>
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      <Text fontSize="sm" color="white">
                        {trade.accountName || trade.accountId}
                      </Text>
                    </Td>
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<MoreVertical size={14} />}
                          variant="ghost"
                          size="sm"
                          color="rgba(255, 255, 255, 0.6)"
                          _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                        />
                        <MenuList 
                          bg="#121212" 
                          borderColor="rgba(255, 255, 255, 0.1)"
                          boxShadow="0 4px 6px rgba(0, 0, 0, 0.4)"
                          py={1}
                        >
                          <MenuItem
                            icon={<FileText size={14} />}
                            _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                            fontSize="sm"
                            color="white"
                          >
                            View Details
                          </MenuItem>
                          <MenuItem
                            icon={<Download size={14} />}
                            _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                            fontSize="sm"
                            color="white"
                          >
                            Export
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        )}
      </Box>

      {/* Footer Stats - Modified to show total trades for today */}
      <Flex 
        mt={2} 
        px={4}
        py={3}
        borderTop="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        justifyContent="space-between"
        alignItems="center"
      >
        <HStack spacing={4} color="rgba(255, 255, 255, 0.6)" fontSize="sm">
          <HStack>
            <Text>Total Trades:</Text>
            <Text color="white" fontWeight="medium">{stats.totalTrades}</Text>
          </HStack>
          <HStack>
            <Text>Win/Loss:</Text>
            <Text color="white" fontWeight="medium">
              {stats.winningTrades}/{stats.losingTrades}
            </Text>
          </HStack>
        </HStack>
        
        <HStack>
          <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">Today's P&L:</Text>
          <Text 
            fontSize="sm" 
            fontWeight="bold"
            color={todaysPnL >= 0 ? 'green.400' : 'red.400'}
          >
            {formatCurrency(todaysPnL)}
          </Text>
        </HStack>
      </Flex>
    </Box>
  );
};

export default HistoricalTradesView;