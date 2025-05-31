import React, { useState } from 'react';
import {
  Box,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Avatar,
  Input,
  Select,
  useToast
} from '@chakra-ui/react';
import {
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  Search
} from 'lucide-react';

const RoleManagement = ({
  availableRoles,
  users,
  onRoleAssignment,
  onRoleRemoval
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const toast = useToast();

  // Role templates with predefined settings
  const roleTemplates = {
    "Admin": {
      color: "#FF6B35",
      description: "Full system access and user management",
      permissions: ["all"],
      priority: 10
    },
    "Manager": {
      color: "#F7931E",
      description: "User management and analytics access",
      permissions: ["users.view", "users.edit", "analytics"],
      priority: 8
    },
    "Support": {
      color: "#9932CC",
      description: "Customer support and ticket management",
      permissions: ["users.view", "support_tickets"],
      priority: 5
    },
    "Beta Tester": {
      color: "#4CAF50",
      description: "Access to beta features and testing",
      permissions: ["beta_features"],
      priority: 3
    },
    "User": {
      color: "#6B7280",
      description: "Standard user access",
      permissions: ["basic_access"],
      priority: 1
    }
  };

  // Get users by role
  const getUsersByRole = (roleName) => {
    return users.filter(user => user.roles.includes(roleName));
  };

  // Handle role assignment
  const handleRoleAssignment = (userId, roleName) => {
    const roleTemplate = roleTemplates[roleName];
    onRoleAssignment(userId, {
      role_name: roleName,
      role_color: roleTemplate.color,
      role_priority: roleTemplate.priority
    });
  };

  // Filter users for assignment
  const getAvailableUsersForRole = (roleName) => {
    return users.filter(user => 
      !user.roles.includes(roleName) && 
      (user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={1}>
          <Text fontSize="xl" fontWeight="bold" color="white">
            Role Management
          </Text>
          <Text color="whiteAlpha.600">
            Manage user roles and permissions using simplified templates
          </Text>
        </VStack>
      </Flex>

      {/* Role Overview Cards */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6} mb={8}>
        {Object.entries(roleTemplates).map(([roleName, template]) => {
          const usersWithRole = getUsersByRole(roleName);
          
          return (
            <GridItem key={roleName}>
              <Card
                bg="rgba(0, 0, 0, 0.3)"
                borderColor="whiteAlpha.200"
                borderWidth="1px"
                _hover={{ borderColor: "whiteAlpha.400", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <CardHeader pb={2}>
                  <HStack justify="space-between">
                    <HStack>
                      <Box
                        w={3}
                        h={3}
                        borderRadius="full"
                        bg={template.color}
                      />
                      <Text fontWeight="bold" color="white">
                        {roleName}
                      </Text>
                    </HStack>
                    <Badge
                      bg={template.color}
                      color="white"
                      borderRadius="full"
                      px={2}
                    >
                      {usersWithRole.length}
                    </Badge>
                  </HStack>
                </CardHeader>
                
                <CardBody pt={0}>
                  <VStack align="start" spacing={3}>
                    <Text fontSize="sm" color="whiteAlpha.700">
                      {template.description}
                    </Text>
                    
                    {/* Users with this role */}
                    {usersWithRole.length > 0 ? (
                      <VStack align="start" spacing={2} w="full">
                        <Text fontSize="xs" color="whiteAlpha.600" fontWeight="semibold">
                          USERS ({usersWithRole.length})
                        </Text>
                        {usersWithRole.slice(0, 3).map(user => (
                          <HStack key={user.id} w="full" justify="space-between">
                            <HStack>
                              <Avatar 
                                src={user.profile_picture} 
                                name={user.full_name || user.username}
                                size="xs" 
                              />
                              <Text fontSize="sm" color="white">
                                {user.username}
                              </Text>
                            </HStack>
                            {roleName !== 'User' && (
                              <Button
                                size="xs"
                                variant="ghost"
                                color="red.400"
                                onClick={() => onRoleRemoval(user.id, roleName)}
                                p={1}
                              >
                                <Trash2 size={12} />
                              </Button>
                            )}
                          </HStack>
                        ))}
                        {usersWithRole.length > 3 && (
                          <Text fontSize="xs" color="whiteAlpha.600">
                            +{usersWithRole.length - 3} more users
                          </Text>
                        )}
                      </VStack>
                    ) : (
                      <Text fontSize="sm" color="whiteAlpha.500" fontStyle="italic">
                        No users assigned
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
          );
        })}
      </Grid>

      {/* Role Assignment Section */}
      <Box
        bg="rgba(0, 0, 0, 0.2)"
        borderRadius="xl"
        border="1px solid"
        borderColor="whiteAlpha.200"
        p={6}
      >
        <VStack align="stretch" spacing={4}>
          <Text fontSize="lg" fontWeight="semibold" color="white">
            Assign Roles to Users
          </Text>
          
          <HStack spacing={4}>
            {/* Role Selection */}
            <Select
              placeholder="Select a role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              bg="rgba(0, 0, 0, 0.3)"
              border="1px solid"
              borderColor="whiteAlpha.300"
              color="white"
              maxW="200px"
            >
              {availableRoles.map(role => (
                <option key={role} value={role} style={{ backgroundColor: "#1A202C" }}>
                  {role}
                </option>
              ))}
            </Select>

            {/* User Search */}
            <Input
              placeholder="Search users to assign role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="rgba(0, 0, 0, 0.3)"
              border="1px solid"
              borderColor="whiteAlpha.300"
              color="white"
              leftIcon={<Search size={16} />}
              flex="1"
            />
          </HStack>

          {/* Available Users */}
          {selectedRole && (
            <Box>
              <Text fontSize="md" fontWeight="semibold" color="white" mb={3}>
                Available Users for {selectedRole} Role
              </Text>
              
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={3}>
                {getAvailableUsersForRole(selectedRole).slice(0, 9).map(user => (
                  <GridItem key={user.id}>
                    <Flex
                      p={3}
                      bg="rgba(0, 0, 0, 0.3)"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      justify="space-between"
                      align="center"
                      _hover={{ borderColor: "whiteAlpha.400" }}
                    >
                      <HStack>
                        <Avatar 
                          src={user.profile_picture} 
                          name={user.full_name || user.username}
                          size="sm" 
                        />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" color="white" fontWeight="medium">
                            {user.username}
                          </Text>
                          <Text fontSize="xs" color="whiteAlpha.600">
                            {user.email}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        leftIcon={<Plus size={12} />}
                        onClick={() => handleRoleAssignment(user.id, selectedRole)}
                      >
                        Assign
                      </Button>
                    </Flex>
                  </GridItem>
                ))}
              </Grid>
              
              {getAvailableUsersForRole(selectedRole).length === 0 && (
                <Flex justify="center" align="center" p={8} direction="column">
                  <Users size={32} color="gray" />
                  <Text mt={2} color="whiteAlpha.600">
                    No available users found for this role
                  </Text>
                </Flex>
              )}
              
              {getAvailableUsersForRole(selectedRole).length > 9 && (
                <Text fontSize="sm" color="whiteAlpha.600" mt={3} textAlign="center">
                  Showing 9 of {getAvailableUsersForRole(selectedRole).length} available users
                </Text>
              )}
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default RoleManagement;