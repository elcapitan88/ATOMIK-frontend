import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Badge,
  Select,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import {
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  AlertCircle,
  Check,
  X,
  Filter,
  Download,
  RefreshCw,
  Mail,
  Eye,
  UserPlus,
  Clock
} from 'lucide-react';

// Mock data for development
const mockUsers = [
  {
    id: 1,
    email: 'john.doe@example.com',
    username: 'johndoe',
    subscription: 'Pro',
    lastLogin: '2025-04-10T14:32:21',
    status: 'active',
    createdAt: '2024-09-15T10:00:00',
    connectedAccounts: 3,
    role: 'user'
  },
  {
    id: 2,
    email: 'jane.smith@example.com',
    username: 'janesmith',
    subscription: 'Elite',
    lastLogin: '2025-04-12T09:45:18',
    status: 'active',
    createdAt: '2024-10-02T14:22:00',
    connectedAccounts: 5,
    role: 'user'
  },
  {
    id: 3,
    email: 'admin@atomiktrading.io',
    username: 'admin',
    subscription: 'Elite',
    lastLogin: '2025-04-13T08:15:32',
    status: 'active',
    createdAt: '2024-08-01T09:30:00',
    connectedAccounts: 1,
    role: 'admin'
  },
  {
    id: 4,
    email: 'robert.johnson@example.com',
    username: 'robertj',
    subscription: 'Starter',
    lastLogin: '2025-04-05T16:22:45',
    status: 'inactive',
    createdAt: '2024-11-12T11:15:00',
    connectedAccounts: 0,
    role: 'user'
  },
  {
    id: 5,
    email: 'sarah.williams@example.com',
    username: 'sarahw',
    subscription: 'Pro',
    lastLogin: '2025-04-11T20:17:09',
    status: 'active',
    createdAt: '2024-10-22T15:45:00',
    connectedAccounts: 2,
    role: 'user'
  },
  {
    id: 6,
    email: 'michael.brown@example.com',
    username: 'michaelb',
    subscription: 'Elite',
    lastLogin: '2025-04-09T11:08:54',
    status: 'suspended',
    createdAt: '2024-09-18T08:30:00',
    connectedAccounts: 4,
    role: 'user'
  },
  {
    id: 7,
    email: 'emma.davis@example.com',
    username: 'emmad',
    subscription: 'Pro',
    lastLogin: '2025-04-12T14:36:27',
    status: 'active',
    createdAt: '2024-11-05T13:20:00',
    connectedAccounts: 1,
    role: 'user'
  },
  {
    id: 8,
    email: 'alex.martin@example.com',
    username: 'alexm',
    subscription: 'Starter',
    lastLogin: null,
    status: 'pending',
    createdAt: '2025-04-12T09:15:00',
    connectedAccounts: 0,
    role: 'user'
  }
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

// User Detail Modal
const UserDetailModal = ({ isOpen, onClose, user }) => {
  if (!user) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg="rgba(0, 0, 0, 0.8)" borderColor="whiteAlpha.200" borderWidth="1px">
        <ModalHeader color="white">User Details</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between">
              <Box>
                <Text color="whiteAlpha.600">Username</Text>
                <Text color="white" fontWeight="bold">{user.username}</Text>
              </Box>
              <Badge colorScheme={
                user.status === 'active' ? 'green' : 
                user.status === 'suspended' ? 'red' : 
                user.status === 'pending' ? 'yellow' : 'gray'
              }>
                {user.status.toUpperCase()}
              </Badge>
            </Flex>
            
            <Box>
              <Text color="whiteAlpha.600">Email</Text>
              <Text color="white">{user.email}</Text>
            </Box>
            
            <Flex justify="space-between">
              <Box>
                <Text color="whiteAlpha.600">Subscription</Text>
                <Badge colorScheme={
                  user.subscription === 'Elite' ? 'purple' : 
                  user.subscription === 'Pro' ? 'blue' : 'gray'
                } mt={1}>
                  {user.subscription}
                </Badge>
              </Box>
              <Box>
                <Text color="whiteAlpha.600">Role</Text>
                <Badge colorScheme={user.role === 'admin' ? 'red' : 'gray'} mt={1}>
                  {user.role.toUpperCase()}
                </Badge>
              </Box>
            </Flex>
            
            <Flex justify="space-between">
              <Box>
                <Text color="whiteAlpha.600">Created</Text>
                <Text color="white">{new Date(user.createdAt).toLocaleDateString()}</Text>
              </Box>
              <Box>
                <Text color="whiteAlpha.600">Last Login</Text>
                <Text color="white">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</Text>
              </Box>
            </Flex>
            
            <Box>
              <Text color="whiteAlpha.600">Connected Accounts</Text>
              <Text color="white">{user.connectedAccounts}</Text>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} leftIcon={<Edit size={16} />}>
            Edit User
          </Button>
          <Button variant="ghost" color="white" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusProps = {
    active: { color: 'green', icon: Check },
    inactive: { color: 'gray', icon: Clock },
    suspended: { color: 'red', icon: X },
    pending: { color: 'yellow', icon: AlertCircle }
  };
  
  const { color, icon } = statusProps[status] || statusProps.inactive;
  
  return (
    <Badge
      colorScheme={color}
      display="flex"
      alignItems="center"
      py={1}
      px={2}
      borderRadius="full"
    >
      <Icon as={icon} boxSize={3} mr={1} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const UsersPage = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Filter users based on search and filters
  const filteredUsers = mockUsers.filter(user => {
    // Search filter
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    // Subscription filter
    const matchesSubscription = 
      subscriptionFilter === 'all' || user.subscription === subscriptionFilter;
    
    return matchesSearch && matchesStatus && matchesSubscription;
  });
  
  // Handle user selection for details view
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    onOpen();
  };
  
  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" color="white">Users</Heading>
          <Text color="whiteAlpha.600">Manage platform users</Text>
        </Box>
        <Button 
          leftIcon={<UserPlus size={16} />} 
          colorScheme="blue"
          size="sm"
        >
          Add User
        </Button>
      </Flex>
      
      {/* Filters */}
      <Flex 
        direction={{ base: "column", md: "row" }} 
        justify="space-between" 
        align={{ base: "stretch", md: "center" }}
        gap={4}
        mb={6}
        pb={4}
        borderBottom="1px solid"
        borderColor="whiteAlpha.200"
      >
        {/* Search */}
        <InputGroup maxW={{ base: "full", md: "300px" }}>
          <InputLeftElement pointerEvents="none">
            <Search color="gray.300" size={18} />
          </InputLeftElement>
          <Input 
            placeholder="Search users..." 
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
        
        {/* Filter Controls */}
        <HStack spacing={4}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            bg="rgba(0, 0, 0, 0.2)"
            border="1px solid"
            borderColor="whiteAlpha.300"
            _hover={{ borderColor: "whiteAlpha.400" }}
            color="white"
            maxW="150px"
            size="md"
            icon={<Filter size={12} />}
          >
            <option value="all" style={{ backgroundColor: "#1A202C" }}>All Status</option>
            <option value="active" style={{ backgroundColor: "#1A202C" }}>Active</option>
            <option value="inactive" style={{ backgroundColor: "#1A202C" }}>Inactive</option>
            <option value="suspended" style={{ backgroundColor: "#1A202C" }}>Suspended</option>
            <option value="pending" style={{ backgroundColor: "#1A202C" }}>Pending</option>
          </Select>
          
          <Select
            value={subscriptionFilter}
            onChange={(e) => setSubscriptionFilter(e.target.value)}
            bg="rgba(0, 0, 0, 0.2)"
            border="1px solid"
            borderColor="whiteAlpha.300"
            _hover={{ borderColor: "whiteAlpha.400" }}
            color="white"
            maxW="150px"
            size="md"
            icon={<Filter size={12} />}
          >
            <option value="all" style={{ backgroundColor: "#1A202C" }}>All Plans</option>
            <option value="Starter" style={{ backgroundColor: "#1A202C" }}>Starter</option>
            <option value="Pro" style={{ backgroundColor: "#1A202C" }}>Pro</option>
            <option value="Elite" style={{ backgroundColor: "#1A202C" }}>Elite</option>
          </Select>
          
          <Tooltip label="Refresh Users">
            <IconButton
              icon={<RefreshCw size={16} />}
              aria-label="Refresh users"
              variant="ghost"
              color="white"
            />
          </Tooltip>
          
          <Tooltip label="Export Users">
            <IconButton
              icon={<Download size={16} />}
              aria-label="Export users"
              variant="ghost"
              color="white"
            />
          </Tooltip>
        </HStack>
      </Flex>
      
      {/* Users Table */}
      <Box
        bg="rgba(0, 0, 0, 0.2)"
        borderRadius="xl"
        border="1px solid"
        borderColor="whiteAlpha.200"
        overflowX="auto"
      >
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th color="whiteAlpha.600">Username</Th>
              <Th color="whiteAlpha.600">Email</Th>
              <Th color="whiteAlpha.600">Subscription</Th>
              <Th color="whiteAlpha.600">Status</Th>
              <Th color="whiteAlpha.600">Last Login</Th>
              <Th color="whiteAlpha.600">Accounts</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredUsers.map(user => (
              <Tr 
                key={user.id} 
                _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                cursor="pointer"
                onClick={() => handleUserSelect(user)}
              >
                <Td>
                  <Flex align="center">
                    <Text color="white">{user.username}</Text>
                    {user.role === 'admin' && (
                      <Tooltip label="Admin User">
                        <Box ml={2} color="red.400">
                          <Shield size={14} />
                        </Box>
                      </Tooltip>
                    )}
                  </Flex>
                </Td>
                <Td color="whiteAlpha.800">{user.email}</Td>
                <Td>
                  <Badge colorScheme={
                    user.subscription === 'Elite' ? 'purple' : 
                    user.subscription === 'Pro' ? 'blue' : 'gray'
                  }>
                    {user.subscription}
                  </Badge>
                </Td>
                <Td>
                  <StatusBadge status={user.status} />
                </Td>
                <Td color="whiteAlpha.700">
                  {user.lastLogin ? formatRelativeTime(user.lastLogin) : 'Never'}
                </Td>
                <Td color="whiteAlpha.800" isNumeric>
                  {user.connectedAccounts}
                </Td>
                <Td onClick={(e) => e.stopPropagation()}>
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
                        icon={<Eye size={14} />} 
                        onClick={() => handleUserSelect(user)}
                        _hover={{ bg: "whiteAlpha.100" }}
                        bg="transparent"
                        color="white"
                      >
                        View Details
                      </MenuItem>
                      <MenuItem 
                        icon={<Edit size={14} />}
                        _hover={{ bg: "whiteAlpha.100" }}
                        bg="transparent"
                        color="white"
                      >
                        Edit User
                      </MenuItem>
                      <MenuItem 
                        icon={<Mail size={14} />}
                        _hover={{ bg: "whiteAlpha.100" }}
                        bg="transparent"
                        color="white"
                      >
                        Email User
                      </MenuItem>
                      <MenuItem 
                        icon={<Trash2 size={14} />}
                        _hover={{ bg: "whiteAlpha.100" }}
                        bg="transparent"
                        color="red.400"
                      >
                        Delete User
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        
        {filteredUsers.length === 0 && (
          <Flex justify="center" align="center" p={8} direction="column">
            <AlertCircle size={24} color="gray" />
            <Text mt={2} color="whiteAlpha.600">No users found matching your criteria</Text>
          </Flex>
        )}
      </Box>
      
      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={isOpen}
        onClose={onClose}
        user={selectedUser}
      />
    </Box>
  );
};

export default UsersPage;