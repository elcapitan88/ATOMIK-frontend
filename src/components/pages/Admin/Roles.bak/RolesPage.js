import React, { useState } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Switch,
  Tooltip,
  Divider,
  SimpleGrid,
  Tabs,
  Select,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useToast
} from '@chakra-ui/react';
import {
  Search,
  ShieldCheck,
  UserPlus,
  Edit,
  Trash2,
  Users,
  Plus,
  Lock,
  Settings,
  MoreVertical,
  Save,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// Mock data for roles
const mockRoles = [
  {
    id: 1,
    name: 'Admin',
    description: 'Full access to all system features and settings',
    userCount: 2,
    permissions: {
      users: { view: true, create: true, edit: true, delete: true },
      webhooks: { view: true, create: true, edit: true, delete: true },
      strategies: { view: true, create: true, edit: true, delete: true },
      billing: { view: true, manage: true },
      settings: { view: true, edit: true }
    },
    createdAt: '2024-08-01T10:00:00Z',
    lastUpdated: '2025-03-15T14:30:00Z'
  },
  {
    id: 2,
    name: 'Manager',
    description: 'Can manage users and view all data, but cannot change system settings',
    userCount: 4,
    permissions: {
      users: { view: true, create: true, edit: true, delete: false },
      webhooks: { view: true, create: true, edit: true, delete: false },
      strategies: { view: true, create: true, edit: true, delete: false },
      billing: { view: true, manage: false },
      settings: { view: true, edit: false }
    },
    createdAt: '2024-08-15T11:30:00Z',
    lastUpdated: '2025-02-20T09:15:00Z'
  },
  {
    id: 3,
    name: 'Support',
    description: 'Can view and help customers, but cannot modify system data',
    userCount: 6,
    permissions: {
      users: { view: true, create: false, edit: false, delete: false },
      webhooks: { view: true, create: false, edit: false, delete: false },
      strategies: { view: true, create: false, edit: false, delete: false },
      billing: { view: true, manage: false },
      settings: { view: false, edit: false }
    },
    createdAt: '2024-09-05T09:45:00Z',
    lastUpdated: '2025-01-10T16:20:00Z'
  },
  {
    id: 4,
    name: 'User',
    description: 'Standard user with basic permissions',
    userCount: 1242,
    permissions: {
      users: { view: false, create: false, edit: false, delete: false },
      webhooks: { view: true, create: true, edit: true, delete: true },
      strategies: { view: true, create: true, edit: true, delete: true },
      billing: { view: true, manage: false },
      settings: { view: false, edit: false }
    },
    createdAt: '2024-08-01T10:15:00Z',
    lastUpdated: '2025-04-01T11:45:00Z'
  }
];

// Mock data for users with roles
const mockUsers = [
  { id: 1, username: 'admin', email: 'admin@atomiktrading.io', role: 'Admin', lastActive: '2025-04-13T08:15:32Z' },
  { id: 2, username: 'johndoe', email: 'john.doe@example.com', role: 'User', lastActive: '2025-04-12T14:32:21Z' },
  { id: 3, username: 'janesmith', email: 'jane.smith@example.com', role: 'User', lastActive: '2025-04-13T09:45:18Z' },
  { id: 4, username: 'support1', email: 'support1@atomiktrading.io', role: 'Support', lastActive: '2025-04-13T07:22:45Z' },
  { id: 5, username: 'support2', email: 'support2@atomiktrading.io', role: 'Support', lastActive: '2025-04-12T16:18:33Z' },
  { id: 6, username: 'manager1', email: 'manager1@atomiktrading.io', role: 'Manager', lastActive: '2025-04-13T11:05:12Z' }
];

// Format date to relative time
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

// Role Edit Modal Component
const RoleEditModal = ({ isOpen, onClose, role, onSave }) => {
  const [formData, setFormData] = useState(
    role ? { ...role } : {
      name: '',
      description: '',
      permissions: {
        users: { view: false, create: false, edit: false, delete: false },
        webhooks: { view: false, create: false, edit: false, delete: false },
        strategies: { view: false, create: false, edit: false, delete: false },
        billing: { view: false, manage: false },
        settings: { view: false, edit: false }
      }
    }
  );
  
  const handlePermissionChange = (category, permission, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: {
          ...prev.permissions[category],
          [permission]: value
        }
      }
    }));
    
    // If turning off "view", also turn off all other permissions in that category
    if (permission === 'view' && !value) {
      const updatedCategoryPermissions = {};
      Object.keys(formData.permissions[category]).forEach(p => {
        updatedCategoryPermissions[p] = false;
      });
      
      setFormData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [category]: updatedCategoryPermissions
        }
      }));
    }
    
    // If turning on any other permission, ensure "view" is also on
    if (permission !== 'view' && value) {
      setFormData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [category]: {
            ...prev.permissions[category],
            view: true
          }
        }
      }));
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg="rgba(0, 0, 0, 0.8)" borderColor="whiteAlpha.200" color="white">
        <ModalHeader>{role ? 'Edit Role' : 'Create New Role'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Basic Information */}
            <Box>
              <Heading size="sm" mb={4} color="blue.400">Basic Information</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>Role Name</FormLabel>
                  <Input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter role name"
                    bg="whiteAlpha.100"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Input 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of this role"
                    bg="whiteAlpha.100"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>
            
            {/* Permissions Section */}
            <Box>
              <Heading size="sm" mb={4} color="blue.400">Permissions</Heading>
              
              {/* Users Permissions */}
              <Box mb={6}>
                <Flex justify="space-between" align="center" mb={2}>
                  <HStack>
                    <Users size={16} />
                    <Text fontWeight="medium">User Management</Text>
                  </HStack>
                </Flex>
                <SimpleGrid columns={4} gap={4} bg="blackAlpha.400" p={3} borderRadius="md">
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="user-view" mb="0" fontSize="sm">
                      View
                    </FormLabel>
                    <Switch
                      id="user-view"
                      isChecked={formData.permissions.users.view}
                      onChange={(e) => handlePermissionChange('users', 'view', e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="user-create" mb="0" fontSize="sm">
                      Create
                    </FormLabel>
                    <Switch
                      id="user-create"
                      isChecked={formData.permissions.users.create}
                      onChange={(e) => handlePermissionChange('users', 'create', e.target.checked)}
                      colorScheme="blue"
                      isDisabled={!formData.permissions.users.view}
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="user-edit" mb="0" fontSize="sm">
                      Edit
                    </FormLabel>
                    <Switch
                      id="user-edit"
                      isChecked={formData.permissions.users.edit}
                      onChange={(e) => handlePermissionChange('users', 'edit', e.target.checked)}
                      colorScheme="blue"
                      isDisabled={!formData.permissions.users.view}
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="user-delete" mb="0" fontSize="sm">
                      Delete
                    </FormLabel>
                    <Switch
                      id="user-delete"
                      isChecked={formData.permissions.users.delete}
                      onChange={(e) => handlePermissionChange('users', 'delete', e.target.checked)}
                      colorScheme="blue"
                      isDisabled={!formData.permissions.users.view}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>
              
              {/* Webhooks Permissions */}
              <Box mb={6}>
                <Flex justify="space-between" align="center" mb={2}>
                  <HStack>
                    <Lock size={16} />
                    <Text fontWeight="medium">Webhooks</Text>
                  </HStack>
                </Flex>
                <SimpleGrid columns={4} gap={4} bg="blackAlpha.400" p={3} borderRadius="md">
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="webhook-view" mb="0" fontSize="sm">
                      View
                    </FormLabel>
                    <Switch
                      id="webhook-view"
                      isChecked={formData.permissions.webhooks.view}
                      onChange={(e) => handlePermissionChange('webhooks', 'view', e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="webhook-create" mb="0" fontSize="sm">
                      Create
                    </FormLabel>
                    <Switch
                      id="webhook-create"
                      isChecked={formData.permissions.webhooks.create}
                      onChange={(e) => handlePermissionChange('webhooks', 'create', e.target.checked)}
                      colorScheme="blue"
                      isDisabled={!formData.permissions.webhooks.view}
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="webhook-edit" mb="0" fontSize="sm">
                      Edit
                    </FormLabel>
                    <Switch
                      id="webhook-edit"
                      isChecked={formData.permissions.webhooks.edit}
                      onChange={(e) => handlePermissionChange('webhooks', 'edit', e.target.checked)}
                      colorScheme="blue"
                      isDisabled={!formData.permissions.webhooks.view}
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="webhook-delete" mb="0" fontSize="sm">
                      Delete
                    </FormLabel>
                    <Switch
                      id="webhook-delete"
                      isChecked={formData.permissions.webhooks.delete}
                      onChange={(e) => handlePermissionChange('webhooks', 'delete', e.target.checked)}
                      colorScheme="blue"
                      isDisabled={!formData.permissions.webhooks.view}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>
              
              {/* Strategies Permissions */}
              <Box mb={6}>
                <Flex justify="space-between" align="center" mb={2}>
                  <HStack>
                    <Settings size={16} />
                    <Text fontWeight="medium">Strategies</Text>
                  </HStack>
                </Flex>
                <SimpleGrid columns={4} gap={4} bg="blackAlpha.400" p={3} borderRadius="md">
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="strategy-view" mb="0" fontSize="sm">
                      View
                    </FormLabel>
                    <Switch
                      id="strategy-view"
                      isChecked={formData.permissions.strategies.view}
                      onChange={(e) => handlePermissionChange('strategies', 'view', e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="strategy-create" mb="0" fontSize="sm">
                      Create
                    </FormLabel>
                    <Switch
                      id="strategy-create"
                      isChecked={formData.permissions.strategies.create}
                      onChange={(e) => handlePermissionChange('strategies', 'create', e.target.checked)}
                      colorScheme="blue"
                      isDisabled={!formData.permissions.strategies.view}
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="strategy-edit" mb="0" fontSize="sm">
                      Edit
                    </FormLabel>
                    <Switch
                      id="strategy-edit"
                      isChecked={formData.permissions.strategies.edit}
                      onChange={(e) => handlePermissionChange('strategies', 'edit', e.target.checked)}
                      colorScheme="blue"
                      isDisabled={!formData.permissions.strategies.view}
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="strategy-delete" mb="0" fontSize="sm">
                      Delete
                    </FormLabel>
                    <Switch
                      id="strategy-delete"
                      isChecked={formData.permissions.strategies.delete}
                      onChange={(e) => handlePermissionChange('strategies', 'delete', e.target.checked)}
                      colorScheme="blue"
                      isDisabled={!formData.permissions.strategies.view}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>
              
              {/* Billing Permissions */}
              <Box mb={6}>
                <Flex justify="space-between" align="center" mb={2}>
                  <HStack>
                    <Users size={16} />
                    <Text fontWeight="medium">Billing</Text>
                  </HStack>
                </Flex>
                <SimpleGrid columns={2} gap={4} bg="blackAlpha.400" p={3} borderRadius="md">
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="billing-view" mb="0" fontSize="sm">
                      View
                    </FormLabel>
                    <Switch
                      id="billing-view"
                      isChecked={formData.permissions.billing.view}
                      onChange={(e) => handlePermissionChange('billing', 'view', e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="billing-manage" mb="0" fontSize="sm">
                      Manage
                    </FormLabel>
                    <Switch
                      id="billing-manage"
                      isChecked={formData.permissions.billing.manage}
                      onChange={(e) => handlePermissionChange('billing', 'manage', e.target.checked)}
                      colorScheme="blue"
                      isDisabled={!formData.permissions.billing.view}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>
              
              {/* Settings Permissions */}
              <Box mb={6}>
                <Flex justify="space-between" align="center" mb={2}>
                  <HStack>
                    <Settings size={16} />
                    <Text fontWeight="medium">System Settings</Text>
                  </HStack>
                </Flex>
                <SimpleGrid columns={2} gap={4} bg="blackAlpha.400" p={3} borderRadius="md">
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="settings-view" mb="0" fontSize="sm">
                      View
                    </FormLabel>
                    <Switch
                      id="settings-view"
                      isChecked={formData.permissions.settings.view}
                      onChange={(e) => handlePermissionChange('settings', 'view', e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="settings-edit" mb="0" fontSize="sm">
                      Edit
                    </FormLabel>
                    <Switch
                      id="settings-edit"
                      isChecked={formData.permissions.settings.edit}
                      onChange={(e) => handlePermissionChange('settings', 'edit', e.target.checked)}
                      colorScheme="blue"
                      isDisabled={!formData.permissions.settings.view}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button 
            leftIcon={<X size={18} />} 
            mr={3} 
            onClick={onClose} 
            variant="ghost"
            color="white"
            _hover={{ bg: "whiteAlpha.100" }}
          >
            Cancel
          </Button>
          <Button 
            leftIcon={<Save size={18} />} 
            colorScheme="blue" 
            onClick={handleSubmit}
          >
            {role ? 'Update Role' : 'Create Role'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// User Role Assignment Modal
const UserRoleModal = ({ isOpen, onClose, onSave }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  
  // Filter users based on search query
  const filteredUsers = mockUsers.filter(user => 
    user.username.includes(searchQuery) || 
    user.email.includes(searchQuery)
  );
  
  // Toggle user selection
  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!selectedRole || selectedUsers.length === 0) return;
    
    onSave({
      roleId: selectedRole,
      userIds: selectedUsers
    });
    
    // Reset form
    setSelectedUsers([]);
    setSelectedRole('');
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg="rgba(0, 0, 0, 0.8)" borderColor="whiteAlpha.200" color="white">
        <ModalHeader>Assign Role to Users</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Role Selection */}
            <FormControl>
              <FormLabel>Select Role</FormLabel>
              <Select 
                placeholder="Choose a role" 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                bg="whiteAlpha.100"
              >
                {mockRoles.map(role => (
                  <option key={role.id} value={role.id} style={{ backgroundColor: "#1A202C" }}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            {/* User Search */}
            <FormControl>
              <FormLabel>Find Users</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Search color="gray.300" size={18} />
                </InputLeftElement>
                <Input 
                  placeholder="Search by username or email" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="whiteAlpha.100"
                />
              </InputGroup>
            </FormControl>
            
            {/* User Selection */}
            <Box maxH="300px" overflowY="auto">
              <Table variant="simple" size="sm">
                <Thead position="sticky" top={0} bg="blackAlpha.700" zIndex={1}>
                  <Tr>
                    <Th width="50px" px={2}></Th>
                    <Th color="whiteAlpha.600">Username</Th>
                    <Th color="whiteAlpha.600">Email</Th>
                    <Th color="whiteAlpha.600">Current Role</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredUsers.map(user => (
                    <Tr 
                      key={user.id} 
                      _hover={{ bg: "whiteAlpha.50" }}
                      cursor="pointer"
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <Td px={2}>
                        <Checkbox 
                          isChecked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          colorScheme="blue"
                        />
                      </Td>
                      <Td color="white">{user.username}</Td>
                      <Td color="whiteAlpha.800">{user.email}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            user.role === 'Admin' ? 'red' :
                            user.role === 'Manager' ? 'orange' :
                            user.role === 'Support' ? 'purple' : 'blue'
                          }
                        >
                          {user.role}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              {filteredUsers.length === 0 && (
                <Flex justify="center" py={4}>
                  <Text color="whiteAlpha.600">No users found</Text>
                </Flex>
              )}
            </Box>
            
            {/* Selected Users Summary */}
            {selectedUsers.length > 0 && (
              <HStack spacing={2} wrap="wrap">
                <Text color="whiteAlpha.700">Selected:</Text>
                {selectedUsers.map(userId => {
                  const user = mockUsers.find(u => u.id === userId);
                  return (
                    <Badge key={userId} colorScheme="blue" variant="subtle">
                      {user?.username}
                    </Badge>
                  );
                })}
              </HStack>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="ghost"
            color="white"
            mr={3} 
            onClick={onClose}
            _hover={{ bg: "whiteAlpha.100" }}
          >
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isDisabled={!selectedRole || selectedUsers.length === 0}
          >
            Assign Role
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Delete Role Confirmation Modal
const DeleteRoleModal = ({ isOpen, onClose, role, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg="rgba(0, 0, 0, 0.8)" borderColor="whiteAlpha.200" color="white">
        <ModalHeader>Delete Role</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text>
              Are you sure you want to delete the <b>{role?.name}</b> role?
            </Text>
            
            {role?.userCount > 0 && (
              <Box bg="red.900" p={3} borderRadius="md">
                <HStack>
                  <AlertTriangle size={18} color="#FC8181" />
                  <Text color="white" fontWeight="medium">
                    Warning: {role.userCount} users are currently assigned to this role
                  </Text>
                </HStack>
                <Text color="whiteAlpha.800" fontSize="sm" mt={2}>
                  These users will be automatically assigned to the default "User" role.
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            color="white"
            _hover={{ bg: "whiteAlpha.100" }}
          >
            Cancel
          </Button>
          <Button 
            colorScheme="red" 
            onClick={() => {
              onConfirm(role.id);
              onClose();
            }}
          >
            Delete Role
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const RolesPage = () => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState(mockRoles);
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Modal controls
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
  
  // Toast
  const toast = useToast();
  
  // Filter roles based on search
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle role edit/create
  const handleRoleSave = (roleData) => {
    if (selectedRole) {
      // Update existing role
      setRoles(roles.map(role => 
        role.id === selectedRole.id ? { ...role, ...roleData, lastUpdated: new Date().toISOString() } : role
      ));
      
      toast({
        title: "Role updated",
        description: `The ${roleData.name} role has been updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Create new role
      const newRole = {
        ...roleData,
        id: roles.length + 1,
        userCount: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      setRoles([...roles, newRole]);
      
      toast({
        title: "Role created",
        description: `The ${roleData.name} role has been created successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Handle role deletion
  const handleRoleDelete = (roleId) => {
    setRoles(roles.filter(role => role.id !== roleId));
    
    toast({
      title: "Role deleted",
      description: "The role has been deleted and affected users have been reassigned.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Handle role assignment
  const handleRoleAssignment = (assignmentData) => {
    const { roleId, userIds } = assignmentData;
    const roleName = roles.find(r => r.id === parseInt(roleId))?.name;
    
    toast({
      title: "Role assigned",
      description: `${userIds.length} user(s) have been assigned to the ${roleName} role.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };
  
  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" color="white">Roles & Permissions</Heading>
          <Text color="whiteAlpha.600">Manage user access and security roles</Text>
        </Box>
        <HStack>
          <Button 
            leftIcon={<Plus size={16} />} 
            colorScheme="blue"
            onClick={() => {
              setSelectedRole(null); // Clear any selected role
              onEditOpen(); // Open the create dialog
            }}
          >
            Create Role
          </Button>
          <Button 
            leftIcon={<UserPlus size={16} />} 
            variant="outline" 
            colorScheme="blue"
            onClick={onAssignOpen}
          >
            Assign Role
          </Button>
        </HStack>
      </Flex>
      
      {/* Main Content Tabs */}
      <Tabs 
        variant="enclosed" 
        colorScheme="blue" 
        onChange={(index) => setActiveTab(index)}
        mb={6}
      >
        <TabList>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">Roles</Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">Users with Roles</Tab>
        </TabList>
        
        <TabPanels mt={6}>
          {/* Roles Management Tab */}
          <TabPanel p={0}>
            {/* Search Input */}
            <InputGroup mb={6} maxW="400px">
              <InputLeftElement pointerEvents="none">
                <Search color="gray.300" size={18} />
              </InputLeftElement>
              <Input 
                placeholder="Search roles..." 
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
            
            {/* Roles Table */}
            <Box
              bg="rgba(0, 0, 0, 0.2)"
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
              overflow="hidden"
              mb={8}
            >
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th color="whiteAlpha.600">Role Name</Th>
                    <Th color="whiteAlpha.600">Description</Th>
                    <Th color="whiteAlpha.600" isNumeric>Users</Th>
                    <Th color="whiteAlpha.600">Last Updated</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredRoles.map(role => (
                    <Tr key={role.id} _hover={{ bg: "whiteAlpha.50" }}>
                      <Td>
                        <HStack>
                          <Box 
                            color={
                              role.name === 'Admin' ? 'red.400' :
                              role.name === 'Manager' ? 'orange.400' :
                              role.name === 'Support' ? 'purple.400' : 'blue.400'
                            }
                          >
                            <ShieldCheck size={16} />
                          </Box>
                          <Text color="white" fontWeight="medium">{role.name}</Text>
                        </HStack>
                      </Td>
                      <Td color="whiteAlpha.800" maxW="400px" isTruncated>
                        <Tooltip label={role.description}>
                          <Text>{role.description}</Text>
                        </Tooltip>
                      </Td>
                      <Td isNumeric>
                        <Badge colorScheme="blue">{role.userCount}</Badge>
                      </Td>
                      <Td color="whiteAlpha.600">
                        {formatRelativeTime(role.lastUpdated)}
                      </Td>
                      <Td>
                        <HStack spacing={1} justify="flex-end">
                          <Tooltip label="Edit Role">
                            <IconButton
                              icon={<Edit size={16} />}
                              variant="ghost"
                              color="blue.400"
                              size="sm"
                              onClick={() => {
                                setSelectedRole(role);
                                onEditOpen();
                              }}
                              aria-label="Edit role"
                              _hover={{ bg: "whiteAlpha.100" }}
                            />
                          </Tooltip>
                          
                          <Tooltip label="Delete Role">
                            <IconButton
                              icon={<Trash2 size={16} />}
                              variant="ghost"
                              color="red.400"
                              size="sm"
                              onClick={() => {
                                setSelectedRole(role);
                                onDeleteOpen();
                              }}
                              aria-label="Delete role"
                              isDisabled={role.name === 'User'} // Prevent deleting default role
                              _hover={{ bg: "whiteAlpha.100" }}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              {filteredRoles.length === 0 && (
                <Flex justify="center" align="center" p={8}>
                  <Text color="whiteAlpha.600">No roles found</Text>
                </Flex>
              )}
            </Box>
            
            {/* Role Details Card */}
            {selectedRole && (
              <Box
                bg="rgba(0, 0, 0, 0.4)"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
              >
                <Heading size="md" color="white" mb={4}>
                  {selectedRole.name} Role Permissions
                </Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {/* User Management Permissions */}
                  <Box>
                    <Text fontWeight="medium" color="white" mb={2}>User Management</Text>
                    <VStack align="stretch" spacing={2} bg="blackAlpha.400" p={3} borderRadius="md">
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">View Users</Text>
                        <Box color={selectedRole.permissions.users.view ? "green.400" : "red.400"}>
                          {selectedRole.permissions.users.view ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">Create Users</Text>
                        <Box color={selectedRole.permissions.users.create ? "green.400" : "red.400"}>
                          {selectedRole.permissions.users.create ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">Edit Users</Text>
                        <Box color={selectedRole.permissions.users.edit ? "green.400" : "red.400"}>
                          {selectedRole.permissions.users.edit ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">Delete Users</Text>
                        <Box color={selectedRole.permissions.users.delete ? "green.400" : "red.400"}>
                          {selectedRole.permissions.users.delete ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>
                  
                  {/* Webhook Permissions */}
                  <Box>
                    <Text fontWeight="medium" color="white" mb={2}>Webhooks</Text>
                    <VStack align="stretch" spacing={2} bg="blackAlpha.400" p={3} borderRadius="md">
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">View Webhooks</Text>
                        <Box color={selectedRole.permissions.webhooks.view ? "green.400" : "red.400"}>
                          {selectedRole.permissions.webhooks.view ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">Create Webhooks</Text>
                        <Box color={selectedRole.permissions.webhooks.create ? "green.400" : "red.400"}>
                          {selectedRole.permissions.webhooks.create ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">Edit Webhooks</Text>
                        <Box color={selectedRole.permissions.webhooks.edit ? "green.400" : "red.400"}>
                          {selectedRole.permissions.webhooks.edit ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">Delete Webhooks</Text>
                        <Box color={selectedRole.permissions.webhooks.delete ? "green.400" : "red.400"}>
                          {selectedRole.permissions.webhooks.delete ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>
                  
                  {/* Strategy Permissions */}
                  <Box>
                    <Text fontWeight="medium" color="white" mb={2}>Strategies</Text>
                    <VStack align="stretch" spacing={2} bg="blackAlpha.400" p={3} borderRadius="md">
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">View Strategies</Text>
                        <Box color={selectedRole.permissions.strategies.view ? "green.400" : "red.400"}>
                          {selectedRole.permissions.strategies.view ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">Create Strategies</Text>
                        <Box color={selectedRole.permissions.strategies.create ? "green.400" : "red.400"}>
                          {selectedRole.permissions.strategies.create ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">Edit Strategies</Text>
                        <Box color={selectedRole.permissions.strategies.edit ? "green.400" : "red.400"}>
                          {selectedRole.permissions.strategies.edit ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">Delete Strategies</Text>
                        <Box color={selectedRole.permissions.strategies.delete ? "green.400" : "red.400"}>
                          {selectedRole.permissions.strategies.delete ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>
                  
                  {/* Billing Permissions */}
                  <Box>
                    <Text fontWeight="medium" color="white" mb={2}>Billing</Text>
                    <VStack align="stretch" spacing={2} bg="blackAlpha.400" p={3} borderRadius="md">
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">View Billing</Text>
                        <Box color={selectedRole.permissions.billing.view ? "green.400" : "red.400"}>
                          {selectedRole.permissions.billing.view ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">Manage Billing</Text>
                        <Box color={selectedRole.permissions.billing.manage ? "green.400" : "red.400"}>
                          {selectedRole.permissions.billing.manage ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>
                  
                  {/* Settings Permissions */}
                  <Box>
                    <Text fontWeight="medium" color="white" mb={2}>System Settings</Text>
                    <VStack align="stretch" spacing={2} bg="blackAlpha.400" p={3} borderRadius="md">
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">View Settings</Text>
                        <Box color={selectedRole.permissions.settings.view ? "green.400" : "red.400"}>
                          {selectedRole.permissions.settings.view ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">Edit Settings</Text>
                        <Box color={selectedRole.permissions.settings.edit ? "green.400" : "red.400"}>
                          {selectedRole.permissions.settings.edit ? <CheckCircle size={16} /> : <X size={16} />}
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>
                </SimpleGrid>
              </Box>
            )}
          </TabPanel>
          
          {/* Users with Roles Tab */}
          <TabPanel p={0}>
            {/* Search Input */}
            <InputGroup mb={6} maxW="400px">
              <InputLeftElement pointerEvents="none">
                <Search color="gray.300" size={18} />
              </InputLeftElement>
              <Input 
                placeholder="Search users..." 
                bg="rgba(0, 0, 0, 0.2)"
                border="1px solid"
                borderColor="whiteAlpha.300"
                _hover={{ borderColor: "whiteAlpha.400" }}
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                color="white"
              />
            </InputGroup>
            
            {/* Users Table */}
            <Box
              bg="rgba(0, 0, 0, 0.2)"
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
              overflow="hidden"
            >
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th color="whiteAlpha.600">Username</Th>
                    <Th color="whiteAlpha.600">Email</Th>
                    <Th color="whiteAlpha.600">Role</Th>
                    <Th color="whiteAlpha.600">Last Active</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {mockUsers.map(user => (
                    <Tr key={user.id} _hover={{ bg: "whiteAlpha.50" }}>
                      <Td color="white">{user.username}</Td>
                      <Td color="whiteAlpha.800">{user.email}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            user.role === 'Admin' ? 'red' :
                            user.role === 'Manager' ? 'orange' :
                            user.role === 'Support' ? 'purple' : 'blue'
                          }
                        >
                          {user.role}
                        </Badge>
                      </Td>
                      <Td color="whiteAlpha.600">{formatRelativeTime(user.lastActive)}</Td>
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
                              icon={<Edit size={14} />}
                              _hover={{ bg: "whiteAlpha.100" }}
                              bg="transparent"
                              color="white"
                            >
                              Change Role
                            </MenuItem>
                            <MenuItem
                              icon={<Users size={14} />}
                              _hover={{ bg: "whiteAlpha.100" }}
                              bg="transparent"
                              color="white"
                            >
                              View User Details
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Role Edit/Create Modal */}
      <RoleEditModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        role={selectedRole}
        onSave={handleRoleSave}
      />
      
      {/* Delete Role Modal */}
      {selectedRole && (
        <DeleteRoleModal
          isOpen={isDeleteOpen}
          onClose={onDeleteClose}
          role={selectedRole}
          onConfirm={handleRoleDelete}
        />
      )}
      
      {/* Assign Role Modal */}
      <UserRoleModal
        isOpen={isAssignOpen}
        onClose={onAssignClose}
        onSave={handleRoleAssignment}
      />
    </Box>
  );
};

export default RolesPage;