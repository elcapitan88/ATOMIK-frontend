// frontend/src/components/pages/Admin/BetaTesters/AddBetaTesterModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Badge,
  Box,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Textarea
} from '@chakra-ui/react';
import {
  Search,
  TestTube,
  UserPlus,
  Mail,
  Upload,
  AlertTriangle,
  CheckCircle,
  Users
} from 'lucide-react';
import { useBetaAccess } from '../../../../hooks/useBetaAccess';
import axiosConfig from '../../../../services/axiosConfig';

// Mock users data - In real app, this would come from API
const mockUsers = [
  {
    id: 1,
    username: 'johndoe',
    email: 'john.doe@example.com',
    subscription: 'Pro',
    isBetaTester: false,
    lastLogin: '2025-04-12T14:32:21'
  },
  {
    id: 2,
    username: 'janesmith',
    email: 'jane.smith@example.com',
    subscription: 'Elite',
    isBetaTester: false,
    lastLogin: '2025-04-13T09:45:18'
  },
  {
    id: 3,
    username: 'testuser',
    email: 'test@example.com',
    subscription: 'Starter',
    isBetaTester: true,
    lastLogin: '2025-04-11T16:22:45'
  },
  {
    id: 4,
    username: 'sarah.williams',
    email: 'sarah.williams@example.com',
    subscription: 'Pro',
    isBetaTester: false,
    lastLogin: '2025-04-12T20:17:09'
  },
  {
    id: 5,
    username: 'michaelb',
    email: 'michael.brown@example.com',
    subscription: 'Elite',
    isBetaTester: false,
    lastLogin: '2025-04-10T11:08:54'
  }
];

const AddBetaTesterModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkEmails, setBulkEmails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  
  const { assignBetaTesterRole } = useBetaAccess();
  const toast = useToast();

  // Load available users when modal opens
  useEffect(() => {
    if (isOpen) {
      // Filter out users who are already beta testers
      const nonBetaUsers = mockUsers.filter(user => !user.isBetaTester);
      setAvailableUsers(nonBetaUsers);
      setSelectedUsers([]);
      setSearchQuery('');
      setBulkEmails('');
    }
  }, [isOpen]);

  // Filter users based on search query
  const filteredUsers = availableUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Select all filtered users
  const selectAllUsers = () => {
    const allFilteredIds = filteredUsers.map(user => user.id);
    setSelectedUsers(allFilteredIds);
  };

  // Deselect all users
  const deselectAllUsers = () => {
    setSelectedUsers([]);
  };

  // Handle individual user assignment
  const handleIndividualAssignment = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to assign beta tester role.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Assign beta role to each selected user
      await Promise.all(
        selectedUsers.map(async (userId) => {
          try {
            await assignBetaTesterRole(userId);
            successCount++;
          } catch (error) {
            console.error(`Failed to assign beta role to user ${userId}:`, error);
            errorCount++;
          }
        })
      );

      if (successCount > 0) {
        toast({
          title: "Beta testers assigned",
          description: `Successfully assigned beta tester role to ${successCount} user(s).`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        onSuccess();
        onClose();
      }

      if (errorCount > 0) {
        toast({
          title: "Partial success",
          description: `${errorCount} user(s) could not be assigned beta tester role.`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }

    } catch (error) {
      toast({
        title: "Assignment failed",
        description: "Failed to assign beta tester roles. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk email assignment
  const handleBulkAssignment = async () => {
    if (!bulkEmails.trim()) {
      toast({
        title: "No emails provided",
        description: "Please enter email addresses to assign beta tester roles.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Parse email addresses
    const emails = bulkEmails
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emails.length === 0) {
      toast({
        title: "Invalid emails",
        description: "Please provide valid email addresses.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Find users by email and assign beta role
      for (const email of emails) {
        try {
          // In real app, you'd search for user by email via API
          const user = mockUsers.find(u => u.email === email);
          if (user && !user.isBetaTester) {
            await assignBetaTesterRole(user.id);
            successCount++;
          } else if (!user) {
            console.warn(`User with email ${email} not found`);
            errorCount++;
          } else {
            console.warn(`User with email ${email} is already a beta tester`);
          }
        } catch (error) {
          console.error(`Failed to assign beta role to ${email}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Beta testers assigned",
          description: `Successfully assigned beta tester role to ${successCount} user(s).`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        onSuccess();
        onClose();
      }

      if (errorCount > 0) {
        toast({
          title: "Partial success",
          description: `${errorCount} email(s) could not be processed.`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }

    } catch (error) {
      toast({
        title: "Assignment failed",
        description: "Failed to assign beta tester roles. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" closeOnOverlayClick={!isLoading}>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg="rgba(0, 0, 0, 0.8)" borderColor="whiteAlpha.200" color="white">
        <ModalHeader>
          <HStack>
            <TestTube size={20} color="#9932CC" />
            <Text>Add Beta Testers</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Information Alert */}
            <Alert status="info" bg="rgba(0, 198, 224, 0.1)" border="1px solid rgba(0, 198, 224, 0.3)">
              <AlertIcon color="#00C6E0" />
              <Box>
                <AlertTitle color="#00C6E0">Beta Tester Access</AlertTitle>
                <AlertDescription color="whiteAlpha.800">
                  Beta testers will immediately gain access to all experimental features and can provide feedback.
                </AlertDescription>
              </Box>
            </Alert>

            {/* Tabs for different assignment methods */}
            <Tabs 
              variant="enclosed" 
              colorScheme="purple" 
              index={activeTab}
              onChange={setActiveTab}
            >
              <TabList>
                <Tab _selected={{ color: "purple.400", bg: "rgba(0, 0, 0, 0.4)" }}>
                  <HStack>
                    <Users size={16} />
                    <Text>Select Users</Text>
                  </HStack>
                </Tab>
                <Tab _selected={{ color: "purple.400", bg: "rgba(0, 0, 0, 0.4)" }}>
                  <HStack>
                    <Mail size={16} />
                    <Text>Bulk Email</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Individual User Selection Tab */}
                <TabPanel p={0} pt={4}>
                  <VStack spacing={4} align="stretch">
                    {/* Search Input */}
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Search color="gray.300" size={18} />
                      </InputLeftElement>
                      <Input 
                        placeholder="Search by username or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        bg="whiteAlpha.100"
                      />
                    </InputGroup>

                    {/* Selection Controls */}
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="whiteAlpha.600">
                        {filteredUsers.length} user(s) available • {selectedUsers.length} selected
                      </Text>
                      <HStack spacing={2}>
                        <Button size="sm" variant="ghost" onClick={selectAllUsers} color="white">
                          Select All
                        </Button>
                        <Button size="sm" variant="ghost" onClick={deselectAllUsers} color="white">
                          Clear Selection
                        </Button>
                      </HStack>
                    </HStack>

                    {/* Users Table */}
                    <Box maxH="300px" overflowY="auto" border="1px solid" borderColor="whiteAlpha.200" borderRadius="md">
                      <Table size="sm" variant="simple">
                        <Thead position="sticky" top={0} bg="blackAlpha.700" zIndex={1}>
                          <Tr>
                            <Th width="50px" px={2}></Th>
                            <Th color="whiteAlpha.600">Username</Th>
                            <Th color="whiteAlpha.600">Email</Th>
                            <Th color="whiteAlpha.600">Subscription</Th>
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
                                  colorScheme="purple"
                                />
                              </Td>
                              <Td color="white">{user.username}</Td>
                              <Td color="whiteAlpha.800">{user.email}</Td>
                              <Td>
                                <Badge
                                  colorScheme={
                                    user.subscription === 'Elite' ? 'purple' : 
                                    user.subscription === 'Pro' ? 'blue' : 'gray'
                                  }
                                >
                                  {user.subscription}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                      
                      {filteredUsers.length === 0 && (
                        <Flex justify="center" py={8}>
                          <Text color="whiteAlpha.600">
                            {searchQuery ? 'No users found matching your search' : 'No users available for beta testing'}
                          </Text>
                        </Flex>
                      )}
                    </Box>

                    {/* Selected Users Summary */}
                    {selectedUsers.length > 0 && (
                      <Box bg="rgba(153, 50, 204, 0.1)" p={3} borderRadius="md" border="1px solid rgba(153, 50, 204, 0.3)">
                        <Text color="whiteAlpha.700" fontSize="sm" mb={2}>Selected Users:</Text>
                        <HStack spacing={2} wrap="wrap">
                          {selectedUsers.map(userId => {
                            const user = availableUsers.find(u => u.id === userId);
                            return user ? (
                              <Badge key={userId} colorScheme="purple" variant="subtle">
                                {user.username}
                              </Badge>
                            ) : null;
                          })}
                        </HStack>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Bulk Email Assignment Tab */}
                <TabPanel p={0} pt={4}>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Email Addresses</FormLabel>
                      <Textarea
                        placeholder="Enter email addresses (one per line or comma-separated)&#10;&#10;john.doe@example.com&#10;jane.smith@example.com&#10;user@company.com"
                        value={bulkEmails}
                        onChange={(e) => setBulkEmails(e.target.value)}
                        bg="whiteAlpha.100"
                        minH="150px"
                        resize="vertical"
                      />
                    </FormControl>

                    <Alert status="warning" bg="rgba(255, 165, 0, 0.1)" border="1px solid rgba(255, 165, 0, 0.3)">
                      <AlertIcon color="orange.400" />
                      <Box>
                        <AlertTitle color="orange.400">Note</AlertTitle>
                        <AlertDescription color="whiteAlpha.800">
                          Only users with existing accounts can be assigned beta tester roles. Non-existent email addresses will be skipped.
                        </AlertDescription>
                      </Box>
                    </Alert>

                    {/* Email parsing preview */}
                    {bulkEmails.trim() && (
                      <Box bg="blackAlpha.400" p={3} borderRadius="md">
                        <Text color="whiteAlpha.700" fontSize="sm" mb={2}>
                          Preview ({bulkEmails.split(/[,\n]/).filter(e => e.trim()).length} email addresses):
                        </Text>
                        <HStack spacing={1} wrap="wrap">
                          {bulkEmails
                            .split(/[,\n]/)
                            .map(email => email.trim())
                            .filter(email => email.length > 0)
                            .slice(0, 10) // Show first 10
                            .map((email, index) => (
                              <Badge key={index} colorScheme="blue" variant="subtle" fontSize="xs">
                                {email}
                              </Badge>
                            ))}
                          {bulkEmails.split(/[,\n]/).filter(e => e.trim()).length > 10 && (
                            <Badge colorScheme="gray" variant="subtle" fontSize="xs">
                              +{bulkEmails.split(/[,\n]/).filter(e => e.trim()).length - 10} more
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            color="white"
            isDisabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            colorScheme="purple" 
            onClick={activeTab === 0 ? handleIndividualAssignment : handleBulkAssignment}
            isLoading={isLoading}
            loadingText="Assigning..."
            leftIcon={<UserPlus size={16} />}
            isDisabled={
              activeTab === 0 
                ? selectedUsers.length === 0 
                : !bulkEmails.trim()
            }
          >
            {activeTab === 0 
              ? `Add ${selectedUsers.length} Beta Tester${selectedUsers.length !== 1 ? 's' : ''}`
              : 'Add Beta Testers'
            }
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddBetaTesterModal;