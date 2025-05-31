import React, { useState } from 'react';
import {
  Box,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  IconButton,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Checkbox,
  Divider,
  useBreakpointValue
} from '@chakra-ui/react';
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  X,
  ChevronDown,
  Users,
  Activity
} from 'lucide-react';

const FilterBar = ({
  filters,
  availableRoles,
  selectedCount,
  totalUsers,
  onFilterChange,
  onRefresh
}) => {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Quick filter presets
  const quickFilters = [
    { label: 'All Users', filters: { status: 'all', subscription: [], roles: [] } },
    { label: 'Active Users', filters: { status: 'active', subscription: [], roles: [] } },
    { label: 'Beta Testers', filters: { status: 'all', subscription: [], roles: ['Beta Tester'] } },
    { label: 'Admins', filters: { status: 'all', subscription: [], roles: ['Admin'] } },
    { label: 'Pro Users', filters: { status: 'all', subscription: ['Pro'], roles: [] } },
    { label: 'Elite Users', filters: { status: 'all', subscription: ['Elite'], roles: [] } },
    { label: 'Inactive Users', filters: { status: 'inactive', subscription: [], roles: [] } }
  ];

  // Handle search input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      onFilterChange({ search: value });
    }, 300);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  // Handle quick filter
  const handleQuickFilter = (quickFilter) => {
    onFilterChange(quickFilter.filters);
    setLocalSearch('');
  };

  // Handle subscription filter toggle
  const handleSubscriptionToggle = (tier) => {
    const newSubscriptions = filters.subscription.includes(tier)
      ? filters.subscription.filter(s => s !== tier)
      : [...filters.subscription, tier];
    handleFilterChange('subscription', newSubscriptions);
  };

  // Handle role filter toggle
  const handleRoleToggle = (role) => {
    const newRoles = filters.roles.includes(role)
      ? filters.roles.filter(r => r !== role)
      : [...filters.roles, role];
    handleFilterChange('roles', newRoles);
  };

  // Clear all filters
  const clearFilters = () => {
    setLocalSearch('');
    onFilterChange({
      search: '',
      status: 'all',
      subscription: [],
      roles: []
    });
  };

  // Count active filters
  const activeFilterCount = [
    filters.search && filters.search.length > 0,
    filters.status !== 'all',
    filters.subscription.length > 0,
    filters.roles.length > 0
  ].filter(Boolean).length;

  return (
    <Box>
      {/* Main Filter Row */}
      <Flex 
        direction={{ base: "column", lg: "row" }} 
        gap={4} 
        align={{ base: "stretch", lg: "center" }}
        justify="space-between"
        mb={4}
      >
        {/* Search */}
        <InputGroup maxW={{ base: "full", lg: "400px" }} flex="1">
          <InputLeftElement pointerEvents="none">
            <Search color="gray.300" size={18} />
          </InputLeftElement>
          <Input 
            placeholder="Search users by name, email, or username..." 
            value={localSearch}
            onChange={handleSearchChange}
            bg="rgba(0, 0, 0, 0.3)"
            border="1px solid"
            borderColor="whiteAlpha.300"
            _hover={{ borderColor: "whiteAlpha.400" }}
            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
            color="white"
            _placeholder={{ color: "whiteAlpha.500" }}
          />
        </InputGroup>

        {/* Filter Controls */}
        <HStack spacing={3} wrap="wrap">
          {/* Status Filter */}
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            bg="rgba(0, 0, 0, 0.3)"
            border="1px solid"
            borderColor="whiteAlpha.300"
            _hover={{ borderColor: "whiteAlpha.400" }}
            color="white"
            minW="120px"
            size="sm"
          >
            <option value="all" style={{ backgroundColor: "#1A202C" }}>All Status</option>
            <option value="active" style={{ backgroundColor: "#1A202C" }}>Active</option>
            <option value="inactive" style={{ backgroundColor: "#1A202C" }}>Inactive</option>
            <option value="admin" style={{ backgroundColor: "#1A202C" }}>Admins</option>
          </Select>

          {/* Subscription Filter */}
          <Menu closeOnSelect={false}>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDown size={14} />}
              variant="outline"
              borderColor="whiteAlpha.300"
              color="white"
              bg="rgba(0, 0, 0, 0.3)"
              _hover={{ borderColor: "whiteAlpha.400", bg: "rgba(0, 0, 0, 0.4)" }}
              size="sm"
              minW="120px"
            >
              Subscription
              {filters.subscription.length > 0 && (
                <Badge ml={2} colorScheme="blue" size="sm">
                  {filters.subscription.length}
                </Badge>
              )}
            </MenuButton>
            <MenuList bg="rgba(0, 0, 0, 0.9)" borderColor="whiteAlpha.200">
              {['Starter', 'Pro', 'Elite'].map(tier => (
                <MenuItem 
                  key={tier}
                  bg="transparent"
                  _hover={{ bg: "whiteAlpha.100" }}
                  color="white"
                  onClick={() => handleSubscriptionToggle(tier)}
                >
                  <Checkbox
                    isChecked={filters.subscription.includes(tier)}
                    onChange={() => handleSubscriptionToggle(tier)}
                    colorScheme="blue"
                    mr={3}
                  />
                  {tier}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Role Filter */}
          <Menu closeOnSelect={false}>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDown size={14} />}
              variant="outline"
              borderColor="whiteAlpha.300"
              color="white"
              bg="rgba(0, 0, 0, 0.3)"
              _hover={{ borderColor: "whiteAlpha.400", bg: "rgba(0, 0, 0, 0.4)" }}
              size="sm"
              minW="100px"
            >
              Roles
              {filters.roles.length > 0 && (
                <Badge ml={2} colorScheme="blue" size="sm">
                  {filters.roles.length}
                </Badge>
              )}
            </MenuButton>
            <MenuList bg="rgba(0, 0, 0, 0.9)" borderColor="whiteAlpha.200">
              {availableRoles.map(role => (
                <MenuItem 
                  key={role}
                  bg="transparent"
                  _hover={{ bg: "whiteAlpha.100" }}
                  color="white"
                  onClick={() => handleRoleToggle(role)}
                >
                  <Checkbox
                    isChecked={filters.roles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    colorScheme="blue"
                    mr={3}
                  />
                  {role}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <Tooltip label="Clear all filters">
              <IconButton
                icon={<X size={16} />}
                aria-label="Clear filters"
                variant="ghost"
                color="white"
                size="sm"
                onClick={clearFilters}
              />
            </Tooltip>
          )}

          {/* Refresh */}
          <Tooltip label="Refresh">
            <IconButton
              icon={<RefreshCw size={16} />}
              aria-label="Refresh"
              variant="ghost"
              color="white"
              size="sm"
              onClick={onRefresh}
            />
          </Tooltip>

          {/* Export */}
          <Tooltip label="Export users">
            <IconButton
              icon={<Download size={16} />}
              aria-label="Export users"
              variant="ghost"
              color="white"
              size="sm"
            />
          </Tooltip>
        </HStack>
      </Flex>

      {/* Quick Filters */}
      <Box mb={4}>
        <Text fontSize="sm" color="whiteAlpha.600" mb={2}>Quick Filters:</Text>
        <HStack spacing={2} wrap="wrap">
          {quickFilters.map((quickFilter, index) => (
            <Button
              key={index}
              size="xs"
              variant="outline"
              borderColor="whiteAlpha.300"
              color="whiteAlpha.700"
              bg="transparent"
              _hover={{ 
                borderColor: "blue.400", 
                color: "white",
                bg: "rgba(0, 198, 224, 0.1)"
              }}
              onClick={() => handleQuickFilter(quickFilter)}
            >
              {quickFilter.label}
            </Button>
          ))}
        </HStack>
      </Box>

      {/* Status Bar */}
      <Flex 
        justify="space-between" 
        align="center" 
        py={3}
        borderTop="1px solid"
        borderColor="whiteAlpha.200"
      >
        <HStack spacing={4}>
          <HStack>
            <Users size={16} color="rgba(255, 255, 255, 0.6)" />
            <Text fontSize="sm" color="whiteAlpha.600">
              {totalUsers} total users
            </Text>
          </HStack>
          
          {selectedCount > 0 && (
            <HStack>
              <Activity size={16} color="#00C6E0" />
              <Text fontSize="sm" color="#00C6E0">
                {selectedCount} selected
              </Text>
            </HStack>
          )}

          {activeFilterCount > 0 && (
            <HStack>
              <Filter size={16} color="#F7931E" />
              <Text fontSize="sm" color="#F7931E">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </Text>
            </HStack>
          )}
        </HStack>

        {/* Active Filters Display */}
        {(filters.subscription.length > 0 || filters.roles.length > 0) && (
          <HStack spacing={2}>
            {filters.subscription.map(tier => (
              <Badge 
                key={tier} 
                colorScheme="blue" 
                variant="outline"
                fontSize="xs"
              >
                {tier}
              </Badge>
            ))}
            {filters.roles.map(role => (
              <Badge 
                key={role} 
                colorScheme="green" 
                variant="outline"
                fontSize="xs"
              >
                {role}
              </Badge>
            ))}
          </HStack>
        )}
      </Flex>
    </Box>
  );
};

export default FilterBar;