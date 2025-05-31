// frontend/src/components/pages/Admin/Users/UserDetail.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Badge,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Switch,
  FormControl,
  FormLabel,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Spinner,
  Center,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Tooltip
} from '@chakra-ui/react';
import {
  User,
  Mail,
  Calendar,
  Activity,
  TestTube,
  Shield,
  CreditCard,
  Settings,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useBetaAccess } from '../../../../hooks/useBetaAccess';
import { BetaBadge } from '../../../../components/common/beta';
import { formatRelativeTime } from '../../../../utils/formatters';

// Mock user data - In real app, this would come from API
const mockUserData = {
  id: 1,
  username: 'johndoe',
  email: 'john.doe@example.com',
  fullName: 'John Doe',
  subscription: 'Pro',
  status: 'active',
  createdAt: '2024-09-15T10:00:00Z',
  lastLogin: '2025-04-12T14:32:21Z',
  connectedAccounts: 3,
  totalTrades: 156,
  successRate: 68.5,
  roles: ['User'],
  isBetaTester: false,
  betaAssignedAt: null,
  betaAssignedBy: null,
  betaFeaturesUsed: [],
  betaFeedbackSubmitted: 0,
  profilePicture: null,
  phoneNumber: '+1 (555) 123-4567',
  preferences: {
    emailNotifications: true,
    pushNotifications: false,
    newsletter: true
  }
};

// Format date helper
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

const UserDetail = ({ userId, onClose }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingBetaRole, setIsUpdatingBetaRole] = useState(false);
  
  const { 
    assignBetaTesterRole, 
    removeBetaTesterRole,
    betaFeatures 
  } = useBetaAccess();
  
  const toast = useToast();

  // Load user data
  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // In real app, fetch user data from API
      // const response = await axiosConfig.get(`/api/v1/admin/users/${userId}`);
      // setUser(response.data);
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUser(mockUserData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user details.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle beta tester role
  const handleBetaRoleToggle = async (isBetaTester) => {
    setIsUpdatingBetaRole(true);
    try {
      if (isBetaTester) {
        await assignBetaTesterRole(userId);
        setUser(prev => ({
          ...prev,
          isBetaTester: true,
          roles: [...prev.roles, 'Beta Tester'],
          betaAssignedAt: new Date().toISOString(),
          betaAssignedBy: 'Current Admin' // In real app, get from auth context
        }));
        
        toast({
          title: "Beta Tester Role Assigned",
          description: `${user.username} now has access to beta features.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        await removeBetaTesterRole(userId);
        setUser(prev => ({
          ...prev,
          isBetaTester: false,
          roles: prev.roles.filter(role => role !== 'Beta Tester'),
          betaAssignedAt: null,
          betaAssignedBy: null
        }));
        
        toast({
          title: "Beta Tester Role Removed",
          description: `${user.username} no longer has access to beta features.`,
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update beta tester role.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingBetaRole(false);
    }
  };

  if (isLoading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="lg" color="#00C6E0" thickness="3px" />
          <Text color="whiteAlpha.600">Loading user details...</Text>
        </VStack>
      </Center>
    );
  }

  if (!user) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>User not found</AlertTitle>
        <AlertDescription>Unable to load user details.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Box>
      {/* User Header */}
      <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200" mb={6}>
        <CardBody>
          <Flex justify="space-between" align="start">
            <HStack spacing={4} align="start">
              <Box
                w={16}
                h={16}
                bg="gray.600"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <User size={32} color="white" />
              </Box>
              <VStack align="start" spacing={1}>
                <HStack>
                  <Heading size="lg" color="white">{user.fullName || user.username}</Heading>
                  {user.isBetaTester && <BetaBadge size="md" />}
                </HStack>
                <Text color="whiteAlpha.600">@{user.username}</Text>
                <HStack spacing={2}>
                  <Badge
                    colorScheme={
                      user.subscription === 'Elite' ? 'purple' : 
                      user.subscription === 'Pro' ? 'blue' : 'gray'
                    }
                  >
                    {user.subscription}
                  </Badge>
                  <Badge
                    colorScheme={
                      user.status === 'active' ? 'green' : 
                      user.status === 'suspended' ? 'red' : 'gray'
                    }
                  >
                    {user.status}
                  </Badge>
                  {user.roles.map(role => (
                    <Badge key={role} colorScheme={role === 'Admin' ? 'red' : 'gray'}>
                      {role}
                    </Badge>
                  ))}
                </HStack>
              </VStack>
            </HStack>
            
            <VStack align="end" spacing={2}>
              <Text color="whiteAlpha.600" fontSize="sm">Member since</Text>
              <Text color="white">{formatDate(user.createdAt).split(',')[0]}</Text>
            </VStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Main Content Tabs */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            Overview
          </Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            Beta Testing
          </Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            Activity
          </Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            Settings
          </Tab>
        </TabList>

        <TabPanels mt={6}>
          {/* Overview Tab */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {/* User Information */}
              <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
                <CardHeader>
                  <Heading size="sm" color="white">
                    <HStack>
                      <User size={18} />
                      <Text>User Information</Text>
                    </HStack>
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text color="whiteAlpha.600">Email</Text>
                      <Text color="white">{user.email}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="whiteAlpha.600">Phone</Text>
                      <Text color="white">{user.phoneNumber || 'Not provided'}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="whiteAlpha.600">Last Login</Text>
                      <Text color="white">{formatRelativeTime(user.lastLogin)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="whiteAlpha.600">Connected Accounts</Text>
                      <Badge colorScheme="blue">{user.connectedAccounts}</Badge>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Trading Stats */}
              <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
                <CardHeader>
                  <Heading size="sm" color="white">
                    <HStack>
                      <TrendingUp size={18} />
                      <Text>Trading Performance</Text>
                    </HStack>
                  </Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat>
                      <StatLabel color="whiteAlpha.600">Total Trades</StatLabel>
                      <StatNumber color="white">{user.totalTrades}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel color="whiteAlpha.600">Success Rate</StatLabel>
                      <StatNumber color="white">{user.successRate}%</StatNumber>
                      <StatHelpText color="whiteAlpha.500">
                        {user.successRate > 60 ? 'Excellent' : user.successRate > 40 ? 'Good' : 'Needs improvement'}
                      </StatHelpText>
                    </Stat>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>

          {/* Beta Testing Tab */}
          <TabPanel p={0}>
            <VStack spacing={6} align="stretch">
              {/* Beta Role Management */}
              <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
                <CardHeader>
                  <Heading size="sm" color="white">
                    <HStack>
                      <TestTube size={18} color="#9932CC" />
                      <Text>Beta Tester Management</Text>
                    </HStack>
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <FormLabel htmlFor="beta-tester-toggle" mb="0" color="white">
                        <VStack align="start" spacing={1}>
                          <Text>Beta Tester Role</Text>
                          <Text fontSize="sm" color="whiteAlpha.600">
                            Grant access to experimental features and beta testing program
                          </Text>
                        </VStack>
                      </FormLabel>
                      <Switch
                        id="beta-tester-toggle"
                        isChecked={user.isBetaTester}
                        onChange={(e) => handleBetaRoleToggle(e.target.checked)}
                        colorScheme="purple"
                        size="lg"
                        isDisabled={isUpdatingBetaRole}
                      />
                    </FormControl>

                    {user.isBetaTester && (
                      <Alert status="success" bg="rgba(153, 50, 204, 0.1)" border="1px solid rgba(153, 50, 204, 0.3)">
                        <AlertIcon color="#9932CC" />
                        <Box>
                          <AlertTitle color="#9932CC">Beta Tester Active</AlertTitle>
                          <AlertDescription color="whiteAlpha.800">
                            This user has access to all beta features and can submit feedback.
                            {user.betaAssignedAt && (
                              <Text mt={1} fontSize="sm">
                                Assigned {formatRelativeTime(user.betaAssignedAt)} by {user.betaAssignedBy}
                              </Text>
                            )}
                          </AlertDescription>
                        </Box>
                      </Alert>
                    )}

                    {!user.isBetaTester && (
                      <Alert status="info" bg="rgba(0, 198, 224, 0.1)" border="1px solid rgba(0, 198, 224, 0.3)">
                        <AlertIcon color="#00C6E0" />
                        <Box>
                          <AlertTitle color="#00C6E0">Standard User</AlertTitle>
                          <AlertDescription color="whiteAlpha.800">
                            This user does not have access to beta features. Enable beta testing to grant access to experimental functionality.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Beta Features Access */}
              {user.isBetaTester && (
                <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
                  <CardHeader>
                    <Heading size="sm" color="white">
                      <HStack>
                        <Zap size={18} />
                        <Text>Available Beta Features</Text>
                      </HStack>
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      {betaFeatures.length > 0 ? (
                        betaFeatures.map(feature => (
                          <HStack key={feature} justify="space-between" p={3} bg="rgba(153, 50, 204, 0.1)" borderRadius="md">
                            <HStack>
                              <CheckCircle size={16} color="#9932CC" />
                              <Text color="white">{feature}</Text>
                            </HStack>
                            <Badge colorScheme="purple" variant="subtle">Active</Badge>
                          </HStack>
                        ))
                      ) : (
                        <Text color="whiteAlpha.600" textAlign="center" py={4}>
                          No beta features currently available
                        </Text>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              )}

              {/* Beta Testing Stats */}
              {user.isBetaTester && (
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
                    <CardBody>
                      <Stat>
                        <StatLabel color="whiteAlpha.600">Features Used</StatLabel>
                        <StatNumber color="white">{user.betaFeaturesUsed.length}</StatNumber>
                        <StatHelpText color="whiteAlpha.500">Beta features accessed</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                  
                  <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
                    <CardBody>
                      <Stat>
                        <StatLabel color="whiteAlpha.600">Feedback Submitted</StatLabel>
                        <StatNumber color="white">{user.betaFeedbackSubmitted}</StatNumber>
                        <StatHelpText color="whiteAlpha.500">Total submissions</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                  
                  <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
                    <CardBody>
                      <Stat>
                        <StatLabel color="whiteAlpha.600">Beta Since</StatLabel>
                        <StatNumber color="white" fontSize="md">
                          {formatRelativeTime(user.betaAssignedAt)}
                        </StatNumber>
                        <StatHelpText color="whiteAlpha.500">Duration as beta tester</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              )}
            </VStack>
          </TabPanel>

          {/* Activity Tab */}
          <TabPanel p={0}>
            <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
              <CardHeader>
                <Heading size="sm" color="white">
                  <HStack>
                    <Activity size={18} />
                    <Text>Recent Activity</Text>
                  </HStack>
                </Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" p={3} bg="whiteAlpha.50" borderRadius="md">
                    <HStack>
                      <Icon as={Clock} color="blue.400" />
                      <Text color="white">Last login</Text>
                    </HStack>
                    <Text color="whiteAlpha.700">{formatRelativeTime(user.lastLogin)}</Text>
                  </HStack>
                  
                  <Text color="whiteAlpha.600" textAlign="center" py={8}>
                    More activity details would be shown here in the full implementation
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Settings Tab */}
          <TabPanel p={0}>
            <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
              <CardHeader>
                <Heading size="sm" color="white">
                  <HStack>
                    <Settings size={18} />
                    <Text>User Settings</Text>
                  </HStack>
                </Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <FormLabel htmlFor="email-notifications" mb="0" color="white">
                      Email Notifications
                    </FormLabel>
                    <Switch
                      id="email-notifications"
                      isChecked={user.preferences.emailNotifications}
                      colorScheme="blue"
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <FormLabel htmlFor="push-notifications" mb="0" color="white">
                      Push Notifications
                    </FormLabel>
                    <Switch
                      id="push-notifications"
                      isChecked={user.preferences.pushNotifications}
                      colorScheme="blue"
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <FormLabel htmlFor="newsletter" mb="0" color="white">
                      Newsletter Subscription
                    </FormLabel>
                    <Switch
                      id="newsletter"
                      isChecked={user.preferences.newsletter}
                      colorScheme="blue"
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default UserDetail;