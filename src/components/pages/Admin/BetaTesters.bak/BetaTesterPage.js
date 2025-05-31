// frontend/src/components/pages/Admin/BetaTesters/BetaTesterPage.js
import React, { useState, useEffect } from 'react';
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
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  HStack,
  VStack,
  useDisclosure,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton
} from '@chakra-ui/react';
import {
  Search,
  UserPlus,
  TestTube,
  MoreVertical,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  TrendingUp,
  Users,
  Activity,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useBetaAccess } from '../../../../hooks/useBetaAccess';
import { BetaBadge } from '../../../../components/common/beta';
import AddBetaTesterModal from './AddBetaTesterModal';
import BetaTesterAnalytics from './BetaTesterAnalytics';

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

// Beta Tester Detail Modal
const BetaTesterDetailModal = ({ isOpen, onClose, betaTester }) => {
  const { betaFeatures } = useBetaAccess();

  if (!betaTester) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg="rgba(0, 0, 0, 0.8)" borderColor="whiteAlpha.200" borderWidth="1px">
        <ModalHeader color="white">
          <HStack>
            <TestTube size={20} color="#9932CC" />
            <Text>Beta Tester Details</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Box>
                <Text color="whiteAlpha.600">Username</Text>
                <Text color="white" fontWeight="bold">{betaTester.username}</Text>
              </Box>
              <BetaBadge variant="subtle" />
            </Flex>
            
            <Box>
              <Text color="whiteAlpha.600">Email</Text>
              <Text color="white">{betaTester.email}</Text>
            </Box>
            
            <Flex justify="space-between">
              <Box>
                <Text color="whiteAlpha.600">Role Assigned</Text>
                <Text color="white">{formatRelativeTime(betaTester.assigned_at)}</Text>
              </Box>
              <Box>
                <Text color="whiteAlpha.600">Assigned By</Text>
                <Text color="white">{betaTester.assigned_by_username || 'System'}</Text>
              </Box>
            </Flex>
            
            <Box>
              <Text color="whiteAlpha.600" mb={2}>Available Beta Features</Text>
              <VStack align="stretch" spacing={2}>
                {betaFeatures.length > 0 ? (
                  betaFeatures.map(feature => (
                    <HStack key={feature} justify="space-between" 
                           bg="rgba(153, 50, 204, 0.1)" p={2} borderRadius="md">
                      <Text color="white" fontSize="sm">• {feature}</Text>
                      <CheckCircle size={16} color="#9932CC" />
                    </HStack>
                  ))
                ) : (
                  <Text color="whiteAlpha.500" fontSize="sm">No beta features available</Text>
                )}
              </VStack>
            </Box>
            
            <Box>
              <Text color="whiteAlpha.600">Last Activity</Text>
              <Text color="white">{formatRelativeTime(betaTester.last_activity)}</Text>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="red" mr={3} leftIcon={<Trash2 size={16} />}>
            Remove Beta Role
          </Button>
          <Button variant="ghost" color="white" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Remove Beta Tester Confirmation Modal
const RemoveBetaTesterModal = ({ isOpen, onClose, betaTester, onConfirm }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleConfirm = async () => {
    setIsRemoving(true);
    try {
      await onConfirm(betaTester.user_id);
      onClose();
    } catch (error) {
      console.error('Error removing beta tester:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg="rgba(0, 0, 0, 0.8)" borderColor="whiteAlpha.200" color="white">
        <ModalHeader>Remove Beta Tester</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text>
              Are you sure you want to remove <strong>{betaTester?.username}</strong> from the beta testing program?
            </Text>
            
            <Box bg="orange.900" p={3} borderRadius="md">
              <HStack>
                <AlertTriangle size={18} color="#FBD38D" />
                <Text color="white" fontWeight="medium">
                  This action will immediately remove their access to all beta features
                </Text>
              </HStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            color="white"
            isDisabled={isRemoving}
          >
            Cancel
          </Button>
          <Button 
            colorScheme="red" 
            onClick={handleConfirm}
            isLoading={isRemoving}
            loadingText="Removing..."
          >
            Remove Beta Role
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const BetaTesterPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBetaTester, setSelectedBetaTester] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [betaTesters, setBetaTesters] = useState([]);
  
  const {
    getAllBetaTesters,
    removeBetaTesterRole,
    loading: betaLoading
  } = useBetaAccess();
  
  const { 
    isOpen: isDetailOpen, 
    onOpen: onDetailOpen, 
    onClose: onDetailClose 
  } = useDisclosure();
  
  const { 
    isOpen: isAddOpen, 
    onOpen: onAddOpen, 
    onClose: onAddClose 
  } = useDisclosure();
  
  const { 
    isOpen: isRemoveOpen, 
    onOpen: onRemoveOpen, 
    onClose: onRemoveClose 
  } = useDisclosure();
  
  const toast = useToast();

  // Fetch beta testers on component mount
  useEffect(() => {
    fetchBetaTesters();
  }, []);

  // Fetch beta testers function
  const fetchBetaTesters = async () => {
    setIsLoading(true);
    try {
      const testers = await getAllBetaTesters();
      setBetaTesters(testers);
    } catch (error) {
      console.error('Error fetching beta testers:', error);
      toast({
        title: "Error",
        description: "Failed to load beta testers. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter beta testers based on search
  const filteredBetaTesters = betaTesters.filter(tester =>
    tester.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tester.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle beta tester selection for details
  const handleBetaTesterSelect = (tester) => {
    setSelectedBetaTester(tester);
    onDetailOpen();
  };

  // Handle remove beta tester
  const handleRemoveBetaTester = async (userId) => {
    try {
      await removeBetaTesterRole(userId);
      
      // Remove from local state
      setBetaTesters(prev => prev.filter(tester => tester.user_id !== userId));
      
      toast({
        title: "Beta Tester Removed",
        description: "The user has been successfully removed from the beta testing program.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove beta tester. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle successful beta tester addition
  const handleBetaTesterAdded = () => {
    fetchBetaTesters(); // Refresh the list
    toast({
      title: "Beta Tester Added",
      description: "The user has been successfully added to the beta testing program.",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  // Calculate stats
  const totalBetaTesters = betaTesters.length;
  const activeBetaTesters = betaTesters.filter(t => 
    t.last_activity && new Date(t.last_activity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  const recentlyAdded = betaTesters.filter(t => 
    t.assigned_at && new Date(t.assigned_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  if (isLoading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="lg" color="#9932CC" thickness="3px" />
          <Text color="whiteAlpha.600">Loading beta testers...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" color="white">
            <HStack>
              <TestTube size={28} color="#9932CC" />
              <Text>Beta Testers</Text>
            </HStack>
          </Heading>
          <Text color="whiteAlpha.600">Manage users with access to experimental features</Text>
        </Box>
        <Button 
          leftIcon={<UserPlus size={16} />} 
          colorScheme="purple"
          size="sm"
          onClick={onAddOpen}
        >
          Add Beta Tester
        </Button>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.600">Total Beta Testers</StatLabel>
              <StatNumber color="white">{totalBetaTesters}</StatNumber>
              <StatHelpText color="whiteAlpha.500">
                <StatArrow type="increase" />
                {recentlyAdded} added this week
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.600">Active This Week</StatLabel>
              <StatNumber color="white">{activeBetaTesters}</StatNumber>
              <StatHelpText color="whiteAlpha.500">
                {totalBetaTesters > 0 ? Math.round((activeBetaTesters / totalBetaTesters) * 100) : 0}% of all beta testers
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.600">Engagement Rate</StatLabel>
              <StatNumber color="white">
                {totalBetaTesters > 0 ? Math.round((activeBetaTesters / totalBetaTesters) * 100) : 0}%
              </StatNumber>
              <StatHelpText color="whiteAlpha.500">
                <StatArrow type="increase" />
                Based on weekly activity
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Main Content Tabs */}
      <Tabs variant="enclosed" colorScheme="purple">
        <TabList>
          <Tab _selected={{ color: "purple.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            Beta Testers List
          </Tab>
          <Tab _selected={{ color: "purple.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            Analytics
          </Tab>
        </TabList>
        
        <TabPanels mt={6}>
          {/* Beta Testers List Tab */}
          <TabPanel p={0}>
            {/* Search and Controls */}
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
              <InputGroup maxW={{ base: "full", md: "300px" }}>
                <InputLeftElement pointerEvents="none">
                  <Search color="gray.300" size={18} />
                </InputLeftElement>
                <Input 
                  placeholder="Search beta testers..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="rgba(0, 0, 0, 0.2)"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  _hover={{ borderColor: "whiteAlpha.400" }}
                  _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px #9932CC" }}
                  color="white"
                />
              </InputGroup>
              
              <HStack spacing={2}>
                <Tooltip label="Refresh List">
                  <IconButton
                    icon={<RefreshCw size={16} />}
                    aria-label="Refresh beta testers"
                    variant="ghost"
                    color="white"
                    onClick={fetchBetaTesters}
                    isLoading={betaLoading}
                  />
                </Tooltip>
                
                <Tooltip label="Export List">
                  <IconButton
                    icon={<Download size={16} />}
                    aria-label="Export beta testers"
                    variant="ghost"
                    color="white"
                  />
                </Tooltip>
              </HStack>
            </Flex>

            {/* Beta Testers Table */}
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
                    <Th color="whiteAlpha.600">User</Th>
                    <Th color="whiteAlpha.600">Email</Th>
                    <Th color="whiteAlpha.600">Assigned</Th>
                    <Th color="whiteAlpha.600">Last Activity</Th>
                    <Th color="whiteAlpha.600">Status</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredBetaTesters.map(tester => (
                    <Tr 
                      key={tester.user_id} 
                      _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                      cursor="pointer"
                      onClick={() => handleBetaTesterSelect(tester)}
                    >
                      <Td>
                        <HStack>
                          <Text color="white" fontWeight="medium">{tester.username}</Text>
                          <BetaBadge size="sm" variant="subtle" />
                        </HStack>
                      </Td>
                      <Td color="whiteAlpha.800">{tester.email}</Td>
                      <Td color="whiteAlpha.700">{formatRelativeTime(tester.assigned_at)}</Td>
                      <Td color="whiteAlpha.700">{formatRelativeTime(tester.last_activity)}</Td>
                      <Td>
                        <Badge 
                          colorScheme={
                            tester.last_activity && 
                            new Date(tester.last_activity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            ? "green" : "gray"
                          }
                        >
                          {tester.last_activity && 
                           new Date(tester.last_activity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                           ? "Active" : "Inactive"}
                        </Badge>
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
                              onClick={() => handleBetaTesterSelect(tester)}
                              _hover={{ bg: "whiteAlpha.100" }}
                              bg="transparent"
                              color="white"
                            >
                              View Details
                            </MenuItem>
                            <MenuItem 
                              icon={<Mail size={14} />}
                              _hover={{ bg: "whiteAlpha.100" }}
                              bg="transparent"
                              color="white"
                            >
                              Send Email
                            </MenuItem>
                            <MenuItem 
                              icon={<Trash2 size={14} />}
                              onClick={() => {
                                setSelectedBetaTester(tester);
                                onRemoveOpen();
                              }}
                              _hover={{ bg: "whiteAlpha.100" }}
                              bg="transparent"
                              color="red.400"
                            >
                              Remove Beta Role
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              {filteredBetaTesters.length === 0 && (
                <Flex justify="center" align="center" p={8} direction="column">
                  <TestTube size={48} color="#666" />
                  <Text mt={4} color="whiteAlpha.600">
                    {searchQuery ? 'No beta testers found matching your search' : 'No beta testers yet'}
                  </Text>
                  {!searchQuery && (
                    <Button mt={4} leftIcon={<UserPlus size={16} />} colorScheme="purple" onClick={onAddOpen}>
                      Add First Beta Tester
                    </Button>
                  )}
                </Flex>
              )}
            </Box>
          </TabPanel>
          
          {/* Analytics Tab */}
          <TabPanel p={0}>
            <BetaTesterAnalytics betaTesters={betaTesters} />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modals */}
      <BetaTesterDetailModal
        isOpen={isDetailOpen}
        onClose={onDetailClose}
        betaTester={selectedBetaTester}
      />
      
      <AddBetaTesterModal
        isOpen={isAddOpen}
        onClose={onAddClose}
        onSuccess={handleBetaTesterAdded}
      />
      
      <RemoveBetaTesterModal
        isOpen={isRemoveOpen}
        onClose={onRemoveClose}
        betaTester={selectedBetaTester}
        onConfirm={handleRemoveBetaTester}
      />
    </Box>
  );
};

export default BetaTesterPage;