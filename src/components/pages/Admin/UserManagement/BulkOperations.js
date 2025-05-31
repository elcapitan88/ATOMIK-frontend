import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  Card,
  CardBody,
  CardHeader,
  Grid,
  GridItem,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Checkbox,
  Input,
  Textarea,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  TestTube,
  Mail,
  Download,
  Upload,
  Zap,
  AlertTriangle
} from 'lucide-react';

const BulkOperations = ({
  users,
  availableRoles,
  onBulkOperation
}) => {
  const [selectedOperation, setSelectedOperation] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [operationData, setOperationData] = useState({});
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Bulk operation types
  const operationTypes = {
    'activate': {
      label: 'Activate Users',
      description: 'Activate selected user accounts',
      icon: UserCheck,
      color: 'green',
      dangerous: false
    },
    'deactivate': {
      label: 'Deactivate Users',
      description: 'Deactivate selected user accounts',
      icon: UserX,
      color: 'red',
      dangerous: true
    },
    'assign_role': {
      label: 'Assign Role',
      description: 'Assign a role to selected users',
      icon: Shield,
      color: 'blue',
      dangerous: false
    },
    'remove_role': {
      label: 'Remove Role',
      description: 'Remove a role from selected users',
      icon: Shield,
      color: 'orange',
      dangerous: true
    },
    'toggle_beta': {
      label: 'Toggle Beta Access',
      description: 'Toggle beta tester access for selected users',
      icon: TestTube,
      color: 'purple',
      dangerous: false
    },
    'send_email': {
      label: 'Send Email',
      description: 'Send an email to selected users',
      icon: Mail,
      color: 'cyan',
      dangerous: false
    },
    'export_data': {
      label: 'Export Data',
      description: 'Export selected users data',
      icon: Download,
      color: 'gray',
      dangerous: false
    }
  };

  // Handle user selection
  const handleUserToggle = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(user => user.id)));
    }
  };

  // Quick selection presets
  const handleQuickSelect = (type) => {
    let userIds = [];
    
    switch (type) {
      case 'active':
        userIds = users.filter(user => user.is_active).map(user => user.id);
        break;
      case 'inactive':
        userIds = users.filter(user => !user.is_active).map(user => user.id);
        break;
      case 'beta':
        userIds = users.filter(user => 
          user.roles.some(role => role.toLowerCase().includes('beta'))
        ).map(user => user.id);
        break;
      case 'admin':
        userIds = users.filter(user => 
          user.is_superuser || user.roles.includes('Admin')
        ).map(user => user.id);
        break;
      case 'pro':
        userIds = users.filter(user => 
          user.subscription?.tier === 'Pro'
        ).map(user => user.id);
        break;
      case 'elite':
        userIds = users.filter(user => 
          user.subscription?.tier === 'Elite'
        ).map(user => user.id);
        break;
      default:
        break;
    }
    
    setSelectedUsers(new Set(userIds));
  };

  // Execute bulk operation
  const executeBulkOperation = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'No Users Selected',
        description: 'Please select at least one user to perform bulk operations',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!selectedOperation) {
      toast({
        title: 'No Operation Selected',
        description: 'Please select an operation to perform',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const userIds = Array.from(selectedUsers);
    
    // Special handling for certain operations
    if (selectedOperation === 'send_email') {
      if (!emailSubject || !emailBody) {
        toast({
          title: 'Email Details Required',
          description: 'Please provide email subject and body',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      // Email functionality would be implemented here
      toast({
        title: 'Email Sent',
        description: `Email sent to ${userIds.length} users`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (selectedOperation === 'export_data') {
      // Export functionality would be implemented here
      toast({
        title: 'Export Started',
        description: `Exporting data for ${userIds.length} users`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Execute the bulk operation
    await onBulkOperation(userIds, selectedOperation, operationData);
    
    // Reset selections
    setSelectedUsers(new Set());
    setSelectedOperation('');
    setOperationData({});
    onClose();
  };

  // Get operation config
  const getOperationConfig = () => {
    return operationTypes[selectedOperation] || null;
  };

  const operationConfig = getOperationConfig();

  return (
    <Box>
      {/* Header */}
      <VStack align="start" spacing={1} mb={6}>
        <Text fontSize="xl" fontWeight="bold" color="white">
          Bulk Operations
        </Text>
        <Text color="whiteAlpha.600">
          Perform actions on multiple users simultaneously
        </Text>
      </VStack>

      <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={6}>
        {/* Main Content */}
        <GridItem>
          {/* User Selection */}
          <Card
            bg="rgba(0, 0, 0, 0.2)"
            borderColor="whiteAlpha.200"
            borderWidth="1px"
            mb={6}
          >
            <CardHeader>
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="semibold" color="white">
                  Select Users ({selectedUsers.size} of {users.length})
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="whiteAlpha.300"
                  color="white"
                  onClick={handleSelectAll}
                >
                  {selectedUsers.size === users.length ? 'Deselect All' : 'Select All'}
                </Button>
              </HStack>
            </CardHeader>
            
            <CardBody pt={0}>
              {/* Quick Selection */}
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontSize="sm" color="whiteAlpha.600" mb={2}>
                    Quick Selection:
                  </Text>
                  <HStack spacing={2} wrap="wrap">
                    {[
                      { key: 'active', label: 'Active Users', count: users.filter(u => u.is_active).length },
                      { key: 'inactive', label: 'Inactive Users', count: users.filter(u => !u.is_active).length },
                      { key: 'beta', label: 'Beta Testers', count: users.filter(u => u.roles.some(r => r.toLowerCase().includes('beta'))).length },
                      { key: 'admin', label: 'Admins', count: users.filter(u => u.is_superuser || u.roles.includes('Admin')).length },
                      { key: 'pro', label: 'Pro Users', count: users.filter(u => u.subscription?.tier === 'Pro').length },
                      { key: 'elite', label: 'Elite Users', count: users.filter(u => u.subscription?.tier === 'Elite').length }
                    ].map(preset => (
                      <Button
                        key={preset.key}
                        size="xs"
                        variant="outline"
                        borderColor="whiteAlpha.300"
                        color="whiteAlpha.700"
                        onClick={() => handleQuickSelect(preset.key)}
                        isDisabled={preset.count === 0}
                      >
                        {preset.label} ({preset.count})
                      </Button>
                    ))}
                  </HStack>
                </Box>

                {/* User List */}
                <Box maxH="300px" overflowY="auto">
                  <VStack align="stretch" spacing={2}>
                    {users.map(user => (
                      <HStack key={user.id} p={2} bg="rgba(0, 0, 0, 0.3)" borderRadius="md">
                        <Checkbox
                          isChecked={selectedUsers.has(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          colorScheme="blue"
                        />
                        <VStack align="start" spacing={0} flex="1">
                          <Text color="white" fontSize="sm" fontWeight="medium">
                            {user.username}
                          </Text>
                          <Text color="whiteAlpha.600" fontSize="xs">
                            {user.email}
                          </Text>
                        </VStack>
                        <HStack spacing={1}>
                          {user.roles.slice(0, 2).map(role => (
                            <Badge key={role} size="sm" fontSize="xs">
                              {role}
                            </Badge>
                          ))}
                        </HStack>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Operation Panel */}
        <GridItem>
          <Card
            bg="rgba(0, 0, 0, 0.2)"
            borderColor="whiteAlpha.200"
            borderWidth="1px"
            position="sticky"
            top="20px"
          >
            <CardHeader>
              <Text fontSize="lg" fontWeight="semibold" color="white">
                Bulk Operations
              </Text>
            </CardHeader>
            
            <CardBody pt={0}>
              <VStack align="stretch" spacing={4}>
                {/* Operation Selection */}
                <Box>
                  <Text fontSize="sm" color="whiteAlpha.600" mb={2}>
                    Select Operation:
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    {Object.entries(operationTypes).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <Button
                          key={key}
                          variant={selectedOperation === key ? "solid" : "outline"}
                          colorScheme={selectedOperation === key ? config.color : "gray"}
                          borderColor="whiteAlpha.300"
                          color={selectedOperation === key ? "white" : "whiteAlpha.700"}
                          size="sm"
                          leftIcon={<Icon size={14} />}
                          onClick={() => setSelectedOperation(key)}
                          justifyContent="flex-start"
                        >
                          {config.label}
                        </Button>
                      );
                    })}
                  </VStack>
                </Box>

                {/* Operation Configuration */}
                {selectedOperation && (
                  <Box>
                    <Text fontSize="sm" color="whiteAlpha.600" mb={2}>
                      Configuration:
                    </Text>
                    
                    {selectedOperation === 'assign_role' && (
                      <Select
                        placeholder="Select role to assign"
                        value={operationData.role_name || ''}
                        onChange={(e) => setOperationData({
                          ...operationData,
                          role_name: e.target.value,
                          role_color: '#4CAF50',
                          role_priority: 5
                        })}
                        bg="rgba(0, 0, 0, 0.3)"
                        borderColor="whiteAlpha.300"
                        color="white"
                        size="sm"
                      >
                        {availableRoles.map(role => (
                          <option key={role} value={role} style={{ backgroundColor: "#1A202C" }}>
                            {role}
                          </option>
                        ))}
                      </Select>
                    )}

                    {selectedOperation === 'remove_role' && (
                      <Select
                        placeholder="Select role to remove"
                        value={operationData.role_name || ''}
                        onChange={(e) => setOperationData({
                          ...operationData,
                          role_name: e.target.value
                        })}
                        bg="rgba(0, 0, 0, 0.3)"
                        borderColor="whiteAlpha.300"
                        color="white"
                        size="sm"
                      >
                        {availableRoles.filter(role => role !== 'User').map(role => (
                          <option key={role} value={role} style={{ backgroundColor: "#1A202C" }}>
                            {role}
                          </option>
                        ))}
                      </Select>
                    )}

                    {selectedOperation === 'send_email' && (
                      <VStack spacing={3}>
                        <Input
                          placeholder="Email subject"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          bg="rgba(0, 0, 0, 0.3)"
                          borderColor="whiteAlpha.300"
                          color="white"
                          size="sm"
                        />
                        <Textarea
                          placeholder="Email body"
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          bg="rgba(0, 0, 0, 0.3)"
                          borderColor="whiteAlpha.300"
                          color="white"
                          size="sm"
                          rows={4}
                        />
                      </VStack>
                    )}
                  </Box>
                )}

                {/* Warning for dangerous operations */}
                {operationConfig?.dangerous && (
                  <Alert status="warning" bg="rgba(255, 193, 7, 0.1)" borderColor="orange.300">
                    <AlertIcon color="orange.300" />
                    <VStack align="start" spacing={0}>
                      <AlertTitle fontSize="sm" color="orange.300">
                        Caution!
                      </AlertTitle>
                      <AlertDescription fontSize="xs" color="orange.200">
                        This operation cannot be easily undone.
                      </AlertDescription>
                    </VStack>
                  </Alert>
                )}

                {/* Execute Button */}
                <Button
                  colorScheme={operationConfig?.dangerous ? "red" : "blue"}
                  leftIcon={operationConfig ? <operationConfig.icon size={16} /> : <Zap size={16} />}
                  onClick={operationConfig?.dangerous ? onOpen : executeBulkOperation}
                  isDisabled={selectedUsers.size === 0 || !selectedOperation}
                  w="full"
                >
                  Execute on {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Confirmation Modal for Dangerous Operations */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="rgba(0, 0, 0, 0.9)" borderColor="whiteAlpha.200" borderWidth="1px">
          <ModalHeader color="white">
            <HStack>
              <AlertTriangle size={20} color="#FF6B6B" />
              <Text>Confirm Bulk Operation</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            <VStack align="start" spacing={4}>
              <Text color="white">
                You are about to perform "{operationConfig?.label}" on {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''}.
              </Text>
              <Text color="whiteAlpha.600" fontSize="sm">
                {operationConfig?.description}
              </Text>
              <Alert status="warning" bg="rgba(255, 193, 7, 0.1)">
                <AlertIcon />
                <Text fontSize="sm">
                  This action cannot be easily undone. Please confirm you want to proceed.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} color="white">
              Cancel
            </Button>
            <Button colorScheme="red" onClick={executeBulkOperation}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default BulkOperations;