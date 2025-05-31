import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Avatar,
  Badge,
  Button,
  Divider,
  Grid,
  GridItem,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast
} from '@chakra-ui/react';
import {
  Edit,
  Shield,
  Mail,
  Phone,
  Calendar,
  Activity,
  CreditCard,
  Users,
  TestTube,
  MoreVertical,
  ExternalLink
} from 'lucide-react';

const UserDetailModal = ({
  isOpen,
  onClose,
  user,
  availableRoles,
  onRoleAssignment,
  onRoleRemoval,
  onBetaToggle
}) => {
  const toast = useToast();

  if (!user) return null;

  const hasBetaAccess = user.roles.some(role => 
    role.toLowerCase().includes('beta')
  );

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle role assignment
  const handleRoleAssignment = (roleName) => {
    const roleColors = {
      'Admin': '#FF6B35',
      'Manager': '#F7931E',
      'Support': '#9932CC',
      'Beta Tester': '#4CAF50',
      'User': '#6B7280'
    };

    onRoleAssignment(user.id, {
      role_name: roleName,
      role_color: roleColors[roleName] || '#6B7280',
      role_priority: roleName === 'Admin' ? 10 : roleName === 'Manager' ? 8 : 5
    });
  };

  // Status badge component
  const StatusBadge = ({ isActive }) => (
    <Badge
      colorScheme={isActive ? "green" : "gray"}
      px={3}
      py={1}
      borderRadius="full"
      fontSize="sm"
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );

  // Subscription badge component
  const SubscriptionBadge = ({ subscription }) => {
    if (!subscription) {
      return <Badge colorScheme="gray">No Plan</Badge>;
    }

    const colorScheme = {
      'elite': 'purple',
      'pro': 'blue',
      'starter': 'gray'
    };

    return (
      <Badge colorScheme={colorScheme[subscription.tier?.toLowerCase()] || 'gray'}>
        {subscription.tier} - {subscription.status}
      </Badge>
    );
  };

  // Role badge component
  const RoleBadge = ({ role, onRemove }) => {
    const roleColors = {
      'Admin': '#FF6B35',
      'Manager': '#F7931E',
      'Support': '#9932CC',
      'Beta Tester': '#4CAF50',
      'User': '#6B7280'
    };

    return (
      <HStack>
        <Badge
          bg={roleColors[role] || roleColors['User']}
          color="white"
          px={2}
          py={1}
          borderRadius="md"
        >
          {role}
        </Badge>
        {role !== 'User' && onRemove && (
          <IconButton
            icon={<MoreVertical size={12} />}
            size="xs"
            variant="ghost"
            color="whiteAlpha.600"
            onClick={() => onRemove(role)}
            aria-label={`Remove ${role} role`}
          />
        )}
      </HStack>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent 
        bg="rgba(0, 0, 0, 0.9)" 
        borderColor="whiteAlpha.200" 
        borderWidth="1px"
        maxW="800px"
      >
        <ModalHeader color="white" pb={2}>
          <Flex align="center" justify="space-between">
            <HStack spacing={4}>
              <Avatar 
                src={user.profile_picture} 
                name={user.full_name || user.username}
                size="md" 
              />
              <VStack align="start" spacing={0}>
                <HStack>
                  <Text fontSize="xl" fontWeight="bold">
                    {user.full_name || user.username}
                  </Text>
                  {user.is_superuser && (
                    <Shield size={16} color="#FF6B35" />
                  )}
                </HStack>
                <Text fontSize="sm" color="whiteAlpha.600">
                  @{user.username} • ID: {user.id}
                </Text>
              </VStack>
            </HStack>
            <StatusBadge isActive={user.is_active} />
          </Flex>
        </ModalHeader>
        
        <ModalCloseButton color="white" />
        
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Basic Information */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="white" mb={3}>
                Basic Information
              </Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Mail size={14} color="rgba(255, 255, 255, 0.6)" />
                      <Text fontSize="sm" color="whiteAlpha.600">Email</Text>
                    </HStack>
                    <Text color="white">{user.email}</Text>
                  </VStack>
                </GridItem>
                
                <GridItem>
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Phone size={14} color="rgba(255, 255, 255, 0.6)" />
                      <Text fontSize="sm" color="whiteAlpha.600">Phone</Text>
                    </HStack>
                    <Text color="white">{user.phone || 'Not provided'}</Text>
                  </VStack>
                </GridItem>

                <GridItem>
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Calendar size={14} color="rgba(255, 255, 255, 0.6)" />
                      <Text fontSize="sm" color="whiteAlpha.600">Created</Text>
                    </HStack>
                    <Text color="white" fontSize="sm">
                      {formatDate(user.created_at)}
                    </Text>
                  </VStack>
                </GridItem>

                <GridItem>
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Activity size={14} color="rgba(255, 255, 255, 0.6)" />
                      <Text fontSize="sm" color="whiteAlpha.600">Last Login</Text>
                    </HStack>
                    <Text color="white" fontSize="sm">
                      {user.last_login ? formatDate(user.last_login) : 'Never'}
                    </Text>
                  </VStack>
                </GridItem>
              </Grid>
            </Box>

            <Divider borderColor="whiteAlpha.200" />

            {/* Subscription Information */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="white" mb={3}>
                Subscription
              </Text>
              <Flex align="center" justify="space-between">
                <HStack>
                  <CreditCard size={16} color="rgba(255, 255, 255, 0.6)" />
                  <SubscriptionBadge subscription={user.subscription} />
                  {user.subscription?.billing_interval && (
                    <Text fontSize="sm" color="whiteAlpha.600">
                      ({user.subscription.billing_interval})
                    </Text>
                  )}
                </HStack>
                <Button size="sm" variant="outline" borderColor="whiteAlpha.300" color="white">
                  Manage Subscription
                </Button>
              </Flex>
            </Box>

            <Divider borderColor="whiteAlpha.200" />

            {/* Roles & Permissions */}
            <Box>
              <Flex align="center" justify="space-between" mb={3}>
                <Text fontSize="lg" fontWeight="semibold" color="white">
                  Roles & Permissions
                </Text>
                <Menu>
                  <MenuButton
                    as={Button}
                    size="sm"
                    variant="outline"
                    borderColor="whiteAlpha.300"
                    color="white"
                    leftIcon={<Shield size={14} />}
                  >
                    Assign Role
                  </MenuButton>
                  <MenuList bg="rgba(0, 0, 0, 0.9)" borderColor="whiteAlpha.200">
                    {availableRoles
                      .filter(role => !user.roles.includes(role))
                      .map(role => (
                        <MenuItem 
                          key={role}
                          bg="transparent"
                          _hover={{ bg: "whiteAlpha.100" }}
                          color="white"
                          onClick={() => handleRoleAssignment(role)}
                        >
                          {role}
                        </MenuItem>
                      ))}
                  </MenuList>
                </Menu>
              </Flex>
              
              <HStack spacing={2} wrap="wrap">
                {user.roles.map(role => (
                  <RoleBadge 
                    key={role} 
                    role={role} 
                    onRemove={role !== 'User' ? onRoleRemoval : null}
                  />
                ))}
              </HStack>

              {/* Beta Access Toggle */}
              <HStack mt={4} p={3} bg="rgba(0, 0, 0, 0.3)" borderRadius="md">
                <TestTube size={16} color={hasBetaAccess ? "#4CAF50" : "rgba(255, 255, 255, 0.6)"} />
                <VStack align="start" spacing={0} flex="1">
                  <Text color="white" fontSize="sm" fontWeight="medium">
                    Beta Tester Access
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="xs">
                    {hasBetaAccess ? 'User has access to beta features' : 'User does not have beta access'}
                  </Text>
                </VStack>
                <Button
                  size="sm"
                  colorScheme={hasBetaAccess ? "red" : "green"}
                  variant="outline"
                  onClick={() => onBetaToggle(user.id, !hasBetaAccess)}
                >
                  {hasBetaAccess ? 'Remove' : 'Grant'} Beta Access
                </Button>
              </HStack>
            </Box>

            <Divider borderColor="whiteAlpha.200" />

            {/* Account Statistics */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="white" mb={3}>
                Account Statistics
              </Text>
              <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                <GridItem>
                  <VStack align="center" p={3} bg="rgba(0, 0, 0, 0.3)" borderRadius="md">
                    <Users size={20} color="#00C6E0" />
                    <Text color="#00C6E0" fontSize="xl" fontWeight="bold">
                      {user.connected_accounts}
                    </Text>
                    <Text color="whiteAlpha.600" fontSize="sm" textAlign="center">
                      Connected Accounts
                    </Text>
                  </VStack>
                </GridItem>
                
                <GridItem>
                  <VStack align="center" p={3} bg="rgba(0, 0, 0, 0.3)" borderRadius="md">
                    <Activity size={20} color="#4CAF50" />
                    <Text color="#4CAF50" fontSize="xl" fontWeight="bold">
                      0
                    </Text>
                    <Text color="whiteAlpha.600" fontSize="sm" textAlign="center">
                      Active Strategies
                    </Text>
                  </VStack>
                </GridItem>
                
                <GridItem>
                  <VStack align="center" p={3} bg="rgba(0, 0, 0, 0.3)" borderRadius="md">
                    <ExternalLink size={20} color="#F7931E" />
                    <Text color="#F7931E" fontSize="xl" fontWeight="bold">
                      0
                    </Text>
                    <Text color="whiteAlpha.600" fontSize="sm" textAlign="center">
                      Active Webhooks
                    </Text>
                  </VStack>
                </GridItem>
              </Grid>
            </Box>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <HStack spacing={3}>
            <Button 
              leftIcon={<Edit size={16} />}
              colorScheme="blue" 
              variant="outline"
            >
              Edit User
            </Button>
            <Button 
              leftIcon={<Mail size={16} />}
              variant="outline"
              borderColor="whiteAlpha.300"
              color="white"
            >
              Send Email
            </Button>
            <Button 
              variant="ghost" 
              color="white" 
              onClick={onClose}
            >
              Close
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserDetailModal;