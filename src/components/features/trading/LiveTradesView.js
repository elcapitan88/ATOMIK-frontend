// src/components/features/trading/LiveTradesView.js
import React, { useState, useEffect } from 'react';
import {
  Box, 
  Flex,
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
  Text,
  InputGroup,
  Input,
  InputRightElement,
  Spinner
} from '@chakra-ui/react';
import { 
  RefreshCw,
  X,
  AlertCircle,
  Clock,
  Search,
  MoreVertical,
  BarChart2
} from 'lucide-react';
import { useTradeData } from '@/hooks/useTradeData';

// Format date helper
const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format currency helper
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

// Calculate elapsed time
const getElapsedTime = (dateString) => {
  const startTime = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - startTime) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m`;
  }
  return `${Math.floor(diffInMinutes / 1440)}d ${Math.floor((diffInMinutes % 1440) / 60)}h`;
};

// Custom scrollbar styles (keeping existing styling)
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

const LiveTradesView = () => {
  // Get data from our custom hook
  const { openPositions, isLoading, error, activeAccounts, refreshData } = useTradeData();
  
  // State
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [filter, setFilter] = useState({ symbol: 'all', side: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'timeEntered', direction: 'desc' });

  // Create a flat array of all positions from all accounts
  const allPositions = Object.values(openPositions).flat();

  // Filter positions based on current filters
  const filteredPositions = allPositions.filter(position => {
    // Apply account filter
    if (selectedAccount !== 'all' && position.accountId !== selectedAccount) return false;
    
    // Apply symbol filter
    if (filter.symbol !== 'all' && position.symbol !== filter.symbol) return false;
    
    // Apply side filter
    if (filter.side !== 'all' && position.side !== filter.side) return false;
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        position.symbol.toLowerCase().includes(query) ||
        position.side.toLowerCase().includes(query) ||
        position.accountId.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Sort positions
  const sortedPositions = [...filteredPositions].sort((a, b) => {
    switch (sortConfig.field) {
      case 'symbol':
        return sortConfig.direction === 'asc' 
          ? a.symbol.localeCompare(b.symbol)
          : b.symbol.localeCompare(a.symbol);
      case 'timeEntered':
        return sortConfig.direction === 'asc' 
          ? new Date(a.timeEntered) - new Date(b.timeEntered)
          : new Date(b.timeEntered) - new Date(a.timeEntered);
      default:
        return sortConfig.direction === 'asc' 
          ? new Date(a.timeEntered) - new Date(b.timeEntered)
          : new Date(b.timeEntered) - new Date(a.timeEntered);
    }
  });

  // Handle sort
  const handleSort = (field) => {
    setSortConfig(prevSort => ({
      field,
      direction: prevSort.field === field && prevSort.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Get unique symbols for filter
  const uniqueSymbols = [...new Set(allPositions.map(p => p.symbol))];

  return (
    <Box height="100%" overflow="hidden" display="flex" flexDirection="column">
      {/* Header with filters */}
      <Flex justify="flex-end" px={4} pt={2} pb={2} gap={2}>
        <HStack spacing={3} flexWrap="wrap">
          {/* Account selector */}
          <Select
            size="sm"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
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
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </Select>
          
          {/* Search input */}
          <InputGroup size="sm" width="180px" h="32px">
            <Input
              placeholder="Search positions..."
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
              aria-label="Refresh positions"
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

      {/* Positions table */}
      <Box 
        flex="1" 
        overflowY="auto"
        px={4}
        sx={customScrollbarStyle}
      >
        {isLoading && allPositions.length === 0 ? (
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
                  onClick={() => handleSort('timeEntered')}
                  borderColor="transparent" 
                  fontSize="xs"
                >
                  <HStack spacing={1}>
                    <Text>Time</Text>
                    {sortConfig.field === 'timeEntered' && (
                      <Box 
                        as="span" 
                        transform={sortConfig.direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)'} 
                        transition="transform 0.2s"
                        display="inline-block"
                      >
                        ▼
                      </Box>
                    )}
                  </HStack>
                </Th>
                <Th 
                  color="rgba(255, 255, 255, 0.6)" 
                  cursor="pointer"
                  onClick={() => handleSort('symbol')}
                  borderColor="transparent"
                  fontSize="xs"
                >
                  <HStack spacing={1}>
                    <Text>Symbol</Text>
                    {sortConfig.field === 'symbol' && (
                      <Box 
                        as="span" 
                        transform={sortConfig.direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)'} 
                        transition="transform 0.2s"
                        display="inline-block"
                      >
                        ▼
                      </Box>
                    )}
                  </HStack>
                </Th>
                <Th color="rgba(255, 255, 255, 0.6)" borderColor="transparent" fontSize="xs">Side</Th>
                <Th color="rgba(255, 255, 255, 0.6)" isNumeric borderColor="transparent" fontSize="xs">Qty</Th>
                <Th color="rgba(255, 255, 255, 0.6)" isNumeric borderColor="transparent" fontSize="xs">Entry</Th>
                <Th color="rgba(255, 255, 255, 0.6)" borderColor="transparent" fontSize="xs">Duration</Th>
                <Th color="rgba(255, 255, 255, 0.6)" borderColor="transparent" fontSize="xs">Account</Th>
                <Th width="80px" borderColor="transparent"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {sortedPositions.length === 0 ? (
                <Tr>
                  <Td colSpan={8} borderColor="transparent">
                    <Flex justify="center" align="center" py={4}>
                      <HStack color="rgba(255, 255, 255, 0.6)">
                        <AlertCircle size={16} />
                        <Text>No open positions</Text>
                      </HStack>
                    </Flex>
                  </Td>
                </Tr>
              ) : (
                sortedPositions.map((position) => (
                  <Tr 
                    key={position.id}
                    _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
                    transition="background 0.2s"
                  >
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      {formatTime(position.timeEntered)}
                    </Td>
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      <Text fontWeight="medium">{position.symbol}</Text>
                    </Td>
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      <Badge
                        bg={position.side === 'LONG' ? 'rgba(72, 187, 120, 0.2)' : 'rgba(245, 101, 101, 0.2)'}
                        color={position.side === 'LONG' ? 'green.400' : 'red.400'}
                        borderRadius="md"
                        fontSize="xs"
                        px={2}
                        py={0.5}
                      >
                        {position.side}
                      </Badge>
                    </Td>
                    <Td isNumeric borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      {position.quantity}
                    </Td>
                    <Td isNumeric borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      {formatCurrency(position.entryPrice)}
                    </Td>
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      <HStack spacing={1}>
                        <Clock size={14} color="rgba(255, 255, 255, 0.6)" />
                        <Text>{getElapsedTime(position.timeEntered)}</Text>
                      </HStack>
                    </Td>
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      <Text fontSize="sm" color="white">
                        {position.accountName || position.accountId}
                      </Text>
                    </Td>
                    <Td borderColor="rgba(255, 255, 255, 0.05)" py={2}>
                      <HStack>
                        <IconButton
                          icon={<X size={14} />}
                          aria-label="Close position"
                          size="xs"
                          color="rgba(255, 255, 255, 0.6)"
                          _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.1)' }}
                          bg="rgba(0, 0, 0, 0.3)"
                          variant="solid"
                        />
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<MoreVertical size={14} />}
                            variant="ghost"
                            size="xs"
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
                              icon={<BarChart2 size={14} />}
                              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                              fontSize="sm"
                              color="white"
                            >
                              View Details
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </HStack>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        )}
      </Box>

      {/* Footer Stats - No PnL displayed for open trades per requirements */}
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
            <Text>Open Positions:</Text>
            <Text color="white" fontWeight="medium">{filteredPositions.length}</Text>
          </HStack>
        </HStack>
      </Flex>
    </Box>
  );
};

export default LiveTradesView;