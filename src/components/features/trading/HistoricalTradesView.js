// src/components/features/trading/HistoricalTradesView.js
import React, { useState, useMemo, useCallback } from 'react';
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
  Spinner,
  Button,
  useBreakpointValue,
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
import { useTrades } from '@/hooks/useTrades';

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

// Mobile Trade Card Component
const MobileTradeCard = ({ trade, formatDate, formatCurrency }) => {
  const pnl = Number(trade.realized_pnl || 0);
  const isProfit = pnl >= 0;

  return (
    <Box
      bg="whiteAlpha.50"
      borderRadius="lg"
      p={3}
      borderLeft="3px solid"
      borderLeftColor={isProfit ? 'green.400' : 'red.400'}
    >
      <Flex justify="space-between" align="flex-start" mb={2}>
        <VStack align="flex-start" spacing={0}>
          <HStack spacing={2}>
            <Text color="white" fontWeight="bold" fontSize="md">
              {trade.symbol}
            </Text>
            <Badge
              bg={trade.side === 'BUY' ? 'rgba(72, 187, 120, 0.2)' : 'rgba(245, 101, 101, 0.2)'}
              color={trade.side === 'BUY' ? 'green.400' : 'red.400'}
              fontSize="xs"
              px={2}
              borderRadius="md"
            >
              {trade.side}
            </Badge>
          </HStack>
          <Text color="whiteAlpha.600" fontSize="xs">
            {trade.total_quantity} @ {formatCurrency(trade.average_entry_price)}
          </Text>
        </VStack>
        <VStack align="flex-end" spacing={0}>
          <HStack spacing={1}>
            <Text
              color={isProfit ? 'green.400' : 'red.400'}
              fontWeight="bold"
              fontSize="md"
            >
              {formatCurrency(pnl)}
            </Text>
            {isProfit ? (
              <TrendingUp size={14} color="#48BB78" />
            ) : (
              <TrendingDown size={14} color="#F56565" />
            )}
          </HStack>
          <Text color="whiteAlpha.500" fontSize="xs">
            {trade.duration_seconds ? `${Math.floor(trade.duration_seconds / 60)}m` : '-'}
          </Text>
        </VStack>
      </Flex>
      <Text color="whiteAlpha.500" fontSize="xs">
        {formatDate(trade.close_time)}
      </Text>
    </Box>
  );
};

const HistoricalTradesView = () => {
  // Get data from our new trades hook
  const {
    historicalTrades,
    tradedSymbols,
    tradeStrategies,
    performanceData,
    isLoading,
    isRefreshing,
    error,
    pagination,
    filters,
    refreshData,
    updateFilters,
    loadPage
  } = useTrades();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // State for UI filters (separate from API filters)
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'close_time', direction: 'desc' });

  // Map API filters to local state for UI
  const [uiFilters, setUiFilters] = useState({
    symbol: filters.symbol || 'all',
    strategy: filters.strategy_id || 'all',
    profitable_only: filters.profitable_only === null ? 'all' : filters.profitable_only.toString(),
    timeRange: filters.days_back || 30
  });

  // Handle filter changes and apply to API
  const handleFilterChange = useCallback(async (filterType, value) => {
    const newUiFilters = { ...uiFilters, [filterType]: value };
    setUiFilters(newUiFilters);

    // Convert UI filters to API filters
    const apiFilters = {};
    
    if (newUiFilters.symbol !== 'all') {
      apiFilters.symbol = newUiFilters.symbol;
    }
    
    if (newUiFilters.strategy !== 'all') {
      apiFilters.strategy_id = parseInt(newUiFilters.strategy);
    }
    
    if (newUiFilters.profitable_only !== 'all') {
      apiFilters.profitable_only = newUiFilters.profitable_only === 'true';
    }
    
    if (newUiFilters.timeRange) {
      apiFilters.days_back = parseInt(newUiFilters.timeRange);
    }

    // Update API filters
    await updateFilters(apiFilters);
  }, [uiFilters, updateFilters]);

  // Client-side filtering for search query (since API doesn't support search)
  const filteredTrades = useMemo(() => {
    if (!searchQuery) return historicalTrades;
    
    const query = searchQuery.toLowerCase();
    return historicalTrades.filter(trade => 
      trade.symbol?.toLowerCase().includes(query) ||
      trade.side?.toLowerCase().includes(query) ||
      trade.position_id?.toLowerCase().includes(query)
    );
  }, [historicalTrades, searchQuery]);

  // Sort trades
  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => {
      if (sortConfig.key === 'close_time') {
        return sortConfig.direction === 'asc' 
          ? new Date(a.close_time) - new Date(b.close_time)
          : new Date(b.close_time) - new Date(a.close_time);
      }
      
      if (sortConfig.key === 'realized_pnl') {
        return sortConfig.direction === 'asc' 
          ? Number(a.realized_pnl || 0) - Number(b.realized_pnl || 0)
          : Number(b.realized_pnl || 0) - Number(a.realized_pnl || 0);
      }
      
      if (sortConfig.key === 'duration_seconds') {
        return sortConfig.direction === 'asc' 
          ? Number(a.duration_seconds || 0) - Number(b.duration_seconds || 0)
          : Number(b.duration_seconds || 0) - Number(a.duration_seconds || 0);
      }
      
      if (sortConfig.key === 'symbol') {
        return sortConfig.direction === 'asc' 
          ? a.symbol.localeCompare(b.symbol)
          : b.symbol.localeCompare(a.symbol);
      }
      
      // Default to close_time sort
      return sortConfig.direction === 'asc' 
        ? new Date(a.close_time) - new Date(b.close_time)
        : new Date(b.close_time) - new Date(a.close_time);
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
      .filter(trade => new Date(trade.close_time) >= today)
      .reduce((sum, trade) => sum + Number(trade.realized_pnl || 0), 0);
  }, [filteredTrades]);

  // Calculate stats - use performance data from API when available
  const stats = useMemo(() => {
    if (performanceData) {
      return {
        totalTrades: performanceData.total_trades,
        winningTrades: performanceData.winning_trades,
        losingTrades: performanceData.losing_trades,
        totalPnL: performanceData.total_pnl,
        winRate: performanceData.win_rate,
        avgWin: performanceData.average_win,
        avgLoss: performanceData.average_loss,
        profitFactor: performanceData.profit_factor
      };
    }
    
    // Fallback to client-side calculation if no performance data
    return {
      totalTrades: filteredTrades.length,
      winningTrades: filteredTrades.filter(t => Number(t.realized_pnl || 0) > 0).length,
      losingTrades: filteredTrades.filter(t => Number(t.realized_pnl || 0) < 0).length,
      totalPnL: filteredTrades.reduce((sum, trade) => sum + Number(trade.realized_pnl || 0), 0),
      winRate: filteredTrades.length > 0 ? (filteredTrades.filter(t => Number(t.realized_pnl || 0) > 0).length / filteredTrades.length * 100) : 0
    };
  }, [filteredTrades]);

  return (
    <Box height="100%" overflow="hidden" display="flex" flexDirection="column">
      {/* Header with filters - Hidden on mobile */}
      {!isMobile && (
        <Flex justify="flex-end" px={4} pt={2} pb={2} gap={2}>
          <HStack spacing={3} flexWrap="wrap">
            {/* Time range selector */}
            <Select
              size="sm"
              value={uiFilters.timeRange}
              onChange={(e) => handleFilterChange('timeRange', e.target.value)}
              bg="rgba(0, 0, 0, 0.3)"
              borderColor="rgba(255, 255, 255, 0.1)"
              color="white"
              width="120px"
              h="32px"
              fontSize="xs"
              _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
              _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
            >
              <option value="1">Today</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">All Time</option>
            </Select>

            {/* Symbol filter */}
            <Select
              size="sm"
              value={uiFilters.symbol}
              onChange={(e) => handleFilterChange('symbol', e.target.value)}
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
              {tradedSymbols.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </Select>

            {/* Strategy filter */}
            <Select
              size="sm"
              value={uiFilters.strategy}
              onChange={(e) => handleFilterChange('strategy', e.target.value)}
              bg="rgba(0, 0, 0, 0.3)"
              borderColor="rgba(255, 255, 255, 0.1)"
              color="white"
              width="120px"
              h="32px"
              fontSize="xs"
              _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
              _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
            >
              <option value="all">All Strategies</option>
              {tradeStrategies.map(strategy => (
                <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
              ))}
            </Select>

            {/* Profitability filter */}
            <Select
              size="sm"
              value={uiFilters.profitable_only}
              onChange={(e) => handleFilterChange('profitable_only', e.target.value)}
              bg="rgba(0, 0, 0, 0.3)"
              borderColor="rgba(255, 255, 255, 0.1)"
              color="white"
              width="110px"
              h="32px"
              fontSize="xs"
              _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
              _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
            >
              <option value="all">All Trades</option>
              <option value="true">Profitable Only</option>
              <option value="false">Losing Only</option>
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
                isLoading={isRefreshing}
                _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.1)' }}
                h="32px"
                w="32px"
                minW="32px"
              />
            </Tooltip>
          </HStack>
        </Flex>
      )}

      {/* Trades table */}
      <Box
        flex="1"
        overflowY="auto"
        px={{ base: 3, md: 4 }}
        maxH={{ base: '300px', md: 'none' }}
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
        ) : isMobile ? (
          /* Mobile Card View */
          <VStack spacing={3} align="stretch" pb={4}>
            {sortedTrades.length === 0 ? (
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
                  >
                    <FileText size={24} color="#00C6E0" />
                  </Box>
                  <VStack spacing={2}>
                    <Text color="white" fontSize="md" fontWeight="bold">
                      No trades yet
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                      Your trade history will appear here
                    </Text>
                  </VStack>
                </VStack>
              </Flex>
            ) : (
              sortedTrades.map((trade) => (
                <MobileTradeCard
                  key={trade.id}
                  trade={trade}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                />
              ))
            )}
          </VStack>
        ) : (
          /* Desktop Table View */
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
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      {formatDate(trade.close_time)}
                    </Td>
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
                    <Td isNumeric borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      {trade.total_quantity}
                    </Td>
                    <Td isNumeric borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      {formatCurrency(trade.average_entry_price)}
                    </Td>
                    <Td isNumeric borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      {trade.exit_price ? formatCurrency(trade.exit_price) : '-'}
                    </Td>
                    <Td isNumeric borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      <HStack justify="flex-end" spacing={1}>
                        <Text
                          color={Number(trade.realized_pnl || 0) >= 0 ? 'green.400' : 'red.400'}
                          fontWeight="medium"
                        >
                          {formatCurrency(trade.realized_pnl || 0)}
                        </Text>
                        {Number(trade.realized_pnl || 0) > 0 ? (
                          <TrendingUp size={14} color="#48BB78" />
                        ) : (
                          <TrendingDown size={14} color="#F56565" />
                        )}
                      </HStack>
                    </Td>
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      {trade.duration_seconds ? `${Math.floor(trade.duration_seconds / 60)}m` : '-'}
                    </Td>
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      <Text fontSize="sm" color="white">
                        {trade.broker_id || 'Trading Account'}
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

      {/* Footer with Stats and Pagination */}
      <VStack spacing={2} mt={2}>
        {/* Stats Row */}
        <Flex
          w="100%"
          px={{ base: 3, md: 4 }}
          py={2}
          borderTop="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <HStack spacing={{ base: 2, md: 4 }} color="rgba(255, 255, 255, 0.6)" fontSize={{ base: 'xs', md: 'sm' }}>
            <HStack>
              <Text>{isMobile ? 'Trades:' : 'Total Trades:'}</Text>
              <Text color="white" fontWeight="medium">{stats.totalTrades}</Text>
            </HStack>
            {!isMobile && (
              <HStack>
                <Text>Win/Loss:</Text>
                <Text color="white" fontWeight="medium">
                  {stats.winningTrades}/{stats.losingTrades}
                </Text>
              </HStack>
            )}
            {!isMobile && stats.winRate !== undefined && (
              <HStack>
                <Text>Win Rate:</Text>
                <Text color="white" fontWeight="medium">
                  {stats.winRate.toFixed(1)}%
                </Text>
              </HStack>
            )}
          </HStack>

          <HStack>
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="rgba(255, 255, 255, 0.6)">{isMobile ? 'P&L:' : 'Total P&L:'}</Text>
            <Text
              fontSize={{ base: 'xs', md: 'sm' }}
              fontWeight="bold"
              color={stats.totalPnL >= 0 ? 'green.400' : 'red.400'}
            >
              {formatCurrency(stats.totalPnL)}
            </Text>
          </HStack>
        </Flex>

        {/* Pagination Row */}
        {pagination.total > pagination.per_page && (
          <Flex
            w="100%"
            px={{ base: 3, md: 4 }}
            py={2}
            borderTop="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            {!isMobile && (
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
                Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
                {pagination.total} trades
              </Text>
            )}

            <HStack spacing={2} flex={isMobile ? 1 : 'none'} justify={isMobile ? 'space-between' : 'flex-end'} w={isMobile ? '100%' : 'auto'}>
              <Button
                size="sm"
                variant="ghost"
                isDisabled={!pagination.has_prev}
                onClick={() => loadPage(pagination.page - 1)}
                color="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                fontSize={{ base: 'xs', md: 'sm' }}
              >
                {isMobile ? '←' : 'Previous'}
              </Button>

              <Text fontSize={{ base: 'xs', md: 'sm' }} color="white" px={{ base: 1, md: 3 }}>
                {pagination.page}/{Math.ceil(pagination.total / pagination.per_page)}
              </Text>

              <Button
                size="sm"
                variant="ghost"
                isDisabled={!pagination.has_next}
                onClick={() => loadPage(pagination.page + 1)}
                color="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                fontSize={{ base: 'xs', md: 'sm' }}
              >
                {isMobile ? '→' : 'Next'}
              </Button>
            </HStack>
          </Flex>
        )}
      </VStack>
    </Box>
  );
};

export default HistoricalTradesView;