import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Heading,
  Text,
  useToast,
  Flex,
  HStack,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import {
  Users,
  Shield,
  Settings,
  RefreshCw
} from 'lucide-react';

import UsersTable from './UsersTable';
import RoleManagement from './RoleManagement';
import BulkOperations from './BulkOperations';
import adminService from '@/services/api/admin';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    subscription: [],
    roles: [],
    limit: 50,
    offset: 0
  });
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsersComplete(filters);
      
      setUsers(response.users);
      setTotalUsers(response.total);
      setAvailableRoles(response.available_roles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0 // Reset pagination when filters change
    }));
  };

  // Handle role assignment
  const handleRoleAssignment = async (userId, roleData) => {
    try {
      await adminService.assignUserRole(userId, roleData);
      toast({
        title: 'Success',
        description: `Role ${roleData.role_name} assigned successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchUsers(); // Refresh data
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to assign role',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle role removal
  const handleRoleRemoval = async (userId, roleName) => {
    try {
      await adminService.removeUserRole(userId, roleName);
      toast({
        title: 'Success',
        description: `Role ${roleName} removed successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchUsers(); // Refresh data
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to remove role',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle beta toggle
  const handleBetaToggle = async (userId, isBeta) => {
    try {
      await adminService.toggleBetaAccess(userId, isBeta);
      toast({
        title: 'Success',
        description: `Beta access ${isBeta ? 'enabled' : 'disabled'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchUsers(); // Refresh data
    } catch (error) {
      console.error('Error toggling beta access:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to toggle beta access',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async (userIds, operation, operationData = null) => {
    try {
      await adminService.bulkUserOperations(userIds, operation, operationData);
      toast({
        title: 'Success',
        description: `Bulk operation completed for ${userIds.length} users`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchUsers(); // Refresh data
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to perform bulk operation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" color="white">User Management</Heading>
          <Text color="whiteAlpha.600">
            Unified interface for managing users, roles, and beta access
          </Text>
          <Text fontSize="sm" color="whiteAlpha.500" mt={1}>
            {totalUsers} total users
          </Text>
        </Box>
        <HStack spacing={2}>
          <Tooltip label="Refresh Data">
            <IconButton
              icon={<RefreshCw size={16} />}
              aria-label="Refresh data"
              variant="ghost"
              color="white"
              onClick={fetchUsers}
              isLoading={loading}
            />
          </Tooltip>
        </HStack>
      </Flex>

      {/* Tabbed Interface */}
      <Tabs 
        index={activeTab} 
        onChange={setActiveTab}
        variant="soft-rounded"
        colorScheme="blue"
      >
        <TabList mb={6} bg="rgba(0, 0, 0, 0.2)" p={2} borderRadius="xl">
          <Tab 
            leftIcon={<Users size={16} />}
            color="whiteAlpha.700"
            _selected={{ 
              color: 'white', 
              bg: 'rgba(0, 198, 224, 0.2)',
              borderColor: '#00C6E0'
            }}
          >
            Users ({users.length})
          </Tab>
          <Tab 
            leftIcon={<Shield size={16} />}
            color="whiteAlpha.700"
            _selected={{ 
              color: 'white', 
              bg: 'rgba(0, 198, 224, 0.2)',
              borderColor: '#00C6E0'
            }}
          >
            Roles
          </Tab>
          <Tab 
            leftIcon={<Settings size={16} />}
            color="whiteAlpha.700"
            _selected={{ 
              color: 'white', 
              bg: 'rgba(0, 198, 224, 0.2)',
              borderColor: '#00C6E0'
            }}
          >
            Bulk Operations
          </Tab>
        </TabList>

        <TabPanels>
          {/* Users Tab - Main Interface */}
          <TabPanel p={0}>
            <UsersTable
              users={users}
              availableRoles={availableRoles}
              loading={loading}
              filters={filters}
              totalUsers={totalUsers}
              onFilterChange={handleFilterChange}
              onRoleAssignment={handleRoleAssignment}
              onRoleRemoval={handleRoleRemoval}
              onBetaToggle={handleBetaToggle}
              onRefresh={fetchUsers}
            />
          </TabPanel>

          {/* Roles Tab - Simplified Role Management */}
          <TabPanel p={0}>
            <RoleManagement
              availableRoles={availableRoles}
              users={users}
              onRoleAssignment={handleRoleAssignment}
              onRoleRemoval={handleRoleRemoval}
            />
          </TabPanel>

          {/* Bulk Operations Tab */}
          <TabPanel p={0}>
            <BulkOperations
              users={users}
              availableRoles={availableRoles}
              onBulkOperation={handleBulkOperation}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default UserManagement;