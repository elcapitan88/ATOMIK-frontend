import React, { useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Text,
  Badge,
  HStack,
  VStack,
  Flex,
  Checkbox,
  useDisclosure,
  Spinner
} from '@chakra-ui/react';
import {
  Users,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';

import FilterBar from './FilterBar';
import QuickActionsMenu from './QuickActionsMenu';
import UserDetailModal from './UserDetailModal';

// Format relative time
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

// Status Badge Component
const StatusBadge = ({ status, isActive }) => {
  if (isActive) {
    return (
      <Badge
        colorScheme="green"
        display="flex"
        alignItems="center"
        py={1}
        px={2}
        borderRadius="full"
        fontSize="xs"
      >
        <CheckCircle size={10} style={{ marginRight: '4px' }} />
        Active
      </Badge>
    );
  } else {
    return (
      <Badge
        colorScheme="gray"
        display="flex"
        alignItems="center"
        py={1}
        px={2}
        borderRadius="full"
        fontSize="xs"
      >
        <XCircle size={10} style={{ marginRight: '4px' }} />
        Inactive
      </Badge>
    );
  }
};

// Subscription Badge Component
const SubscriptionBadge = ({ subscription }) => {
  if (!subscription) {
    return (
      <Badge colorScheme="gray" fontSize="xs">
        No Plan
      </Badge>
    );
  }

  const colorScheme = {
    'elite': 'purple',
    'pro': 'blue',
    'starter': 'gray'
  };

  return (
    <Badge 
      colorScheme={colorScheme[subscription.tier?.toLowerCase()] || 'gray'}
      fontSize="xs"
    >
      {subscription.tier}
    </Badge>
  );
};

// Role Badge Component
const RoleBadge = ({ role }) => {
  const roleColors = {
    'Admin': '#FF6B35',
    'Manager': '#F7931E',
    'Support': '#9932CC',
    'Beta Tester': '#4CAF50',
    'User': '#6B7280'
  };

  return (
    <Badge
      bg={roleColors[role] || roleColors['User']}
      color="white"
      fontSize="xs"
      px={2}
      py={1}
      borderRadius="md"
    >
      {role}
    </Badge>
  );
};

// User Row Component
const UserRow = ({ 
  user, 
  isSelected, 
  onSelect, 
  onUserClick, 
  availableRoles,
  onRoleAssignment,
  onRoleRemoval,
  onBetaToggle
}) => {
  const hasBetaAccess = user.roles.some(role => 
    role.toLowerCase().includes('beta')
  );

  return (
    <Tr 
      _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
      cursor="pointer"
      onClick={() => onUserClick(user)}
      bg={isSelected ? "rgba(0, 198, 224, 0.1)" : "transparent"}
    >
      <Td onClick={(e) => e.stopPropagation()}>
        <Checkbox
          isChecked={isSelected}
          onChange={() => onSelect(user.id)}
          colorScheme="blue"
        />
      </Td>
      
      {/* User Info */}
      <Td>
        <HStack spacing={3}>
          <Avatar 
            src={user.profile_picture} 
            name={user.full_name || user.username}
            size="sm" 
          />
          <VStack align="start" spacing={0}>
            <HStack>
              <Text color="white" fontWeight="semibold">
                {user.full_name || user.username}
              </Text>
              {user.is_superuser && (
                <Shield size={12} color="#FF6B35" />
              )}
            </HStack>
            <Text fontSize="sm" color="whiteAlpha.600">
              @{user.username}
            </Text>
          </VStack>
        </HStack>
      </Td>

      {/* Contact */}
      <Td>
        <VStack align="start" spacing={0}>
          <Text color="white" fontSize="sm">
            {user.email}
          </Text>
          {user.phone && (
            <Text fontSize="xs" color="whiteAlpha.600">
              {user.phone}
            </Text>
          )}
        </VStack>
      </Td>

      {/* Status */}
      <Td>
        <StatusBadge isActive={user.is_active} />
      </Td>

      {/* Subscription */}
      <Td>
        <SubscriptionBadge subscription={user.subscription} />
      </Td>

      {/* Roles */}
      <Td>
        <HStack spacing={1} wrap="wrap">
          {user.roles.slice(0, 2).map((role, index) => (
            <RoleBadge key={index} role={role} />
          ))}
          {user.roles.length > 2 && (
            <Text fontSize="xs" color="whiteAlpha.600">
              +{user.roles.length - 2} more
            </Text>
          )}
        </HStack>
      </Td>

      {/* Activity */}
      <Td>
        <VStack align="start" spacing={0}>
          <Text fontSize="sm" color="whiteAlpha.800">
            {user.last_login ? formatRelativeTime(user.last_login) : 'Never'}
          </Text>
          <Text fontSize="xs" color="whiteAlpha.600">
            <Calendar size={10} style={{ display: 'inline', marginRight: '4px' }} />
            {formatRelativeTime(user.created_at)}
          </Text>
        </VStack>
      </Td>

      {/* Connected Accounts */}
      <Td isNumeric>
        <Text color="whiteAlpha.800">
          {user.connected_accounts}
        </Text>
      </Td>

      {/* Quick Actions */}
      <Td onClick={(e) => e.stopPropagation()}>
        <QuickActionsMenu
          user={user}
          availableRoles={availableRoles}
          hasBetaAccess={hasBetaAccess}
          onRoleAssignment={onRoleAssignment}
          onRoleRemoval={onRoleRemoval}
          onBetaToggle={onBetaToggle}
          onViewDetails={() => onUserClick(user)}
        />
      </Td>
    </Tr>
  );
};

const UsersTable = ({
  users,
  availableRoles,
  loading,
  filters,
  totalUsers,
  onFilterChange,
  onRoleAssignment,
  onRoleRemoval,
  onBetaToggle,
  onRefresh
}) => {
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Handle user selection
  const handleUserSelect = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(user => user.id)));
    }
  };

  // Handle user detail view
  const handleUserClick = (user) => {
    setSelectedUser(user);
    onOpen();
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minH="400px"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="whiteAlpha.600">Loading users...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box>
      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        availableRoles={availableRoles}
        selectedCount={selectedUsers.size}
        totalUsers={totalUsers}
        onFilterChange={onFilterChange}
        onRefresh={onRefresh}
      />

      {/* Users Table */}
      <Box
        bg="rgba(0, 0, 0, 0.2)"
        borderRadius="xl"
        border="1px solid"
        borderColor="whiteAlpha.200"
        overflowX="auto"
        mt={6}
      >
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th color="whiteAlpha.600" w="50px">
                <Checkbox
                  isChecked={selectedUsers.size === users.length && users.length > 0}
                  isIndeterminate={selectedUsers.size > 0 && selectedUsers.size < users.length}
                  onChange={handleSelectAll}
                  colorScheme="blue"
                />
              </Th>
              <Th color="whiteAlpha.600">User</Th>
              <Th color="whiteAlpha.600">Contact</Th>
              <Th color="whiteAlpha.600">Status</Th>
              <Th color="whiteAlpha.600">Subscription</Th>
              <Th color="whiteAlpha.600">Roles</Th>
              <Th color="whiteAlpha.600">Activity</Th>
              <Th color="whiteAlpha.600" isNumeric>Accounts</Th>
              <Th color="whiteAlpha.600" w="100px">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map(user => (
              <UserRow
                key={user.id}
                user={user}
                isSelected={selectedUsers.has(user.id)}
                onSelect={handleUserSelect}
                onUserClick={handleUserClick}
                availableRoles={availableRoles}
                onRoleAssignment={onRoleAssignment}
                onRoleRemoval={onRoleRemoval}
                onBetaToggle={onBetaToggle}
              />
            ))}
          </Tbody>
        </Table>

        {users.length === 0 && (
          <Flex justify="center" align="center" p={8} direction="column">
            <Users size={32} color="gray" />
            <Text mt={2} color="whiteAlpha.600">
              No users found matching your criteria
            </Text>
          </Flex>
        )}
      </Box>

      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={isOpen}
        onClose={onClose}
        user={selectedUser}
        availableRoles={availableRoles}
        onRoleAssignment={onRoleAssignment}
        onRoleRemoval={onRoleRemoval}
        onBetaToggle={onBetaToggle}
      />
    </Box>
  );
};

export default UsersTable;