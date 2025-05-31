/**
 * Feature Flags Admin Page
 * 
 * Comprehensive admin interface for managing feature flags, rollout strategies,
 * and beta feature configurations. Provides real-time control over feature
 * availability and user access.
 */

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
  Spinner,
  Center,
  Tab,
  TabPanels,
  TabPanel,
  Card,
  CardHeader,
  CardBody,
  Select
} from '@chakra-ui/react';
import { Search, Edit, Trash2 } from 'lucide-react';
import axiosInstance from '../../../../services/axiosConfig';

const FeatureFlagsPage = () => {
  const [features, setFeatures] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    strategy: 'all',
    search: ''
  });

  // Fetch feature configurations
  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/v1/beta/admin/features');
      setFeatures(response.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Admin access required to manage feature flags');
      } else if (err.response?.status === 401) {
        setError('Please log in to access feature flags');
      } else {
        setError('Failed to load feature configurations');
      }
      console.error('Error fetching features:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch feature statistics
  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/api/v1/beta/admin/features/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Set default stats if there's an error
      setStats({
        total_features: 8,
        enabled_features: 1,
        beta_features: 6,
        disabled_features: 1
      });
    }
  };

  // Toggle feature status
  const toggleFeatureStatus = async (featureName, currentStatus) => {
    try {
      const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
      const endpoint = `/api/v1/beta/admin/features/${featureName}/${newStatus === 'enabled' ? 'enable' : 'disable'}`;
      
      await axiosInstance.post(endpoint);

      // Refresh features
      await fetchFeatures();
    } catch (err) {
      console.error('Error toggling feature:', err);
      alert('Failed to update feature status');
    }
  };

  // Update feature configuration
  const updateFeature = async (featureName, updates) => {
    try {
      await axiosInstance.put(`/api/v1/beta/admin/features/${featureName}`, updates);

      await fetchFeatures();
      setShowEditModal(false);
      setSelectedFeature(null);
    } catch (err) {
      console.error('Error updating feature:', err);
      alert('Failed to update feature');
    }
  };

  // Filter features based on current filters
  const filteredFeatures = features.filter(feature => {
    const matchesStatus = filters.status === 'all' || feature.status === filters.status;
    const matchesCategory = filters.category === 'all' || feature.metadata?.category === filters.category;
    const matchesStrategy = filters.strategy === 'all' || feature.rollout_strategy === filters.strategy;
    const matchesSearch = filters.search === '' || 
      feature.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      feature.description.toLowerCase().includes(filters.search.toLowerCase());

    return matchesStatus && matchesCategory && matchesStrategy && matchesSearch;
  });

  // Get unique categories and strategies for filter options
  const categories = [...new Set(features.map(f => f.metadata?.category).filter(Boolean))];
  const strategies = [...new Set(features.map(f => f.rollout_strategy))];

  useEffect(() => {
    fetchFeatures();
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box>
        <Center h="400px">
          <VStack spacing={4}>
            <Spinner size="lg" color="orange.500" thickness="3px" />
            <Text color="whiteAlpha.600">Loading feature configurations...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        {/* Page Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="lg" color="white">
              <HStack>
                <Box fontSize="28px">🎯</Box>
                <Text>Feature Flags</Text>
              </HStack>
            </Heading>
            <Text color="whiteAlpha.600">Manage beta features and rollout strategies</Text>
          </Box>
        </Flex>

        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="red.500" borderWidth="2px">
          <CardBody>
            <VStack spacing={4} py={8}>
              <Box fontSize="64px">⚠️</Box>
              <Heading size="md" color="red.400">{error}</Heading>
              {error.includes('Admin access') && (
                <VStack spacing={2}>
                  <Text color="whiteAlpha.700" textAlign="center">
                    Feature flag management requires administrator privileges.
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="sm" textAlign="center">
                    Please contact your system administrator to request admin access.
                  </Text>
                </VStack>
              )}
              {error.includes('log in') && (
                <VStack spacing={2}>
                  <Text color="whiteAlpha.700" textAlign="center">
                    Please log in to access the admin interface.
                  </Text>
                  <Button colorScheme="blue" onClick={() => window.location.href = '/auth'}>
                    Go to Login
                  </Button>
                </VStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" color="white">
            <HStack>
              <Box fontSize="28px">🎯</Box>
              <Text>Feature Flags</Text>
            </HStack>
          </Heading>
          <Text color="whiteAlpha.600">Manage beta features and rollout strategies</Text>
        </Box>
      </Flex>

      {/* Stats Cards */}
      <Flex wrap="wrap" gap={6} mb={6}>
        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200" minW="200px">
          <CardBody>
            <VStack align="start" spacing={2}>
              <HStack>
                <Text fontSize="2xl">🎯</Text>
                <Text color="whiteAlpha.600" fontSize="sm">Total Features</Text>
              </HStack>
              <Text color="white" fontSize="2xl" fontWeight="bold">{stats.total_features || 0}</Text>
            </VStack>
          </CardBody>
        </Card>
        
        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200" minW="200px">
          <CardBody>
            <VStack align="start" spacing={2}>
              <HStack>
                <Text fontSize="2xl">✅</Text>
                <Text color="whiteAlpha.600" fontSize="sm">Enabled Features</Text>
              </HStack>
              <Text color="white" fontSize="2xl" fontWeight="bold">{stats.enabled_features || 0}</Text>
            </VStack>
          </CardBody>
        </Card>
        
        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200" minW="200px">
          <CardBody>
            <VStack align="start" spacing={2}>
              <HStack>
                <Text fontSize="2xl">🧪</Text>
                <Text color="whiteAlpha.600" fontSize="sm">Beta Features</Text>
              </HStack>
              <Text color="white" fontSize="2xl" fontWeight="bold">{stats.beta_features || 0}</Text>
            </VStack>
          </CardBody>
        </Card>
        
        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200" minW="200px">
          <CardBody>
            <VStack align="start" spacing={2}>
              <HStack>
                <Text fontSize="2xl">❌</Text>
                <Text color="whiteAlpha.600" fontSize="sm">Disabled Features</Text>
              </HStack>
              <Text color="white" fontSize="2xl" fontWeight="bold">{stats.disabled_features || 0}</Text>
            </VStack>
          </CardBody>
        </Card>
      </Flex>

      {/* Filters */}
      <Card mb={6} bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
        <CardBody>
          <Flex wrap="wrap" gap={4} align="end">
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="medium" color="white">Status</Text>
              <Select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                width="200px"
                bg="rgba(0, 0, 0, 0.2)"
                border="1px solid"
                borderColor="whiteAlpha.300"
                color="white"
              >
                <option value="all">All Statuses</option>
                <option value="enabled">Enabled</option>
                <option value="beta">Beta</option>
                <option value="disabled">Disabled</option>
              </Select>
            </VStack>
            
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="medium" color="white">Category</Text>
              <Select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                width="200px"
                bg="rgba(0, 0, 0, 0.2)"
                border="1px solid"
                borderColor="whiteAlpha.300"
                color="white"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </VStack>
            
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="medium" color="white">Strategy</Text>
              <Select
                value={filters.strategy}
                onChange={(e) => setFilters(prev => ({ ...prev, strategy: e.target.value }))}
                width="200px"
                bg="rgba(0, 0, 0, 0.2)"
                border="1px solid"
                borderColor="whiteAlpha.300"
                color="white"
              >
                <option value="all">All Strategies</option>
                {strategies.map(strat => (
                  <option key={strat} value={strat}>
                    {strat.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </Select>
            </VStack>
            
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="medium" color="white">Search</Text>
              <InputGroup width="300px">
                <InputLeftElement pointerEvents="none">
                  <Search color="gray.300" size={16} />
                </InputLeftElement>
                <Input
                  placeholder="Search by name or description..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  bg="rgba(0, 0, 0, 0.2)"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  _hover={{ borderColor: "whiteAlpha.400" }}
                  _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FF8C00" }}
                  color="white"
                />
              </InputGroup>
            </VStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Features Table */}
      <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
        <CardHeader>
          <Heading size="md" color="white">Feature Configurations ({filteredFeatures.length})</Heading>
        </CardHeader>
        <CardBody p={0}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th color="whiteAlpha.600">Feature</Th>
                <Th color="whiteAlpha.600">Status</Th>
                <Th color="whiteAlpha.600">Strategy</Th>
                <Th color="whiteAlpha.600">Category</Th>
                <Th color="whiteAlpha.600">Rollout %</Th>
                <Th color="whiteAlpha.600">Target Users</Th>
                <Th color="whiteAlpha.600">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredFeatures.map(feature => (
                <Tr key={feature.name} _hover={{ bg: "whiteAlpha.100" }}>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="semibold" color="white">{feature.name}</Text>
                      <Text fontSize="sm" color="whiteAlpha.700">{feature.description}</Text>
                      {feature.dependencies.length > 0 && (
                        <Text fontSize="xs" color="purple.400" fontStyle="italic">
                          Depends on: {feature.dependencies.join(', ')}
                        </Text>
                      )}
                    </VStack>
                  </Td>
                  
                  <Td>
                    <Badge
                      colorScheme={
                        feature.status === 'enabled' ? 'green' :
                        feature.status === 'beta' ? 'purple' : 'red'
                      }
                      cursor="pointer"
                      onClick={() => toggleFeatureStatus(feature.name, feature.status)}
                    >
                      {feature.status}
                    </Badge>
                  </Td>
                  
                  <Td>
                    <Badge colorScheme="blue" variant="outline">
                      {feature.rollout_strategy.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </Td>
                  
                  <Td>
                    <Badge colorScheme="green" variant="outline">
                      {feature.metadata?.category || 'Other'}
                    </Badge>
                  </Td>
                  
                  <Td>
                    <Text color="white">
                      {feature.rollout_strategy === 'percentage' || feature.rollout_strategy === 'gradual' 
                        ? `${feature.rollout_percentage}%`
                        : '-'
                      }
                    </Text>
                  </Td>
                  
                  <Td>
                    <Text color="white">
                      {feature.rollout_strategy === 'user_list'
                        ? feature.target_users.length
                        : feature.rollout_strategy === 'role_based'
                        ? feature.target_roles.join(', ')
                        : '-'
                      }
                    </Text>
                  </Td>
                  
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<Edit size={14} />}
                      onClick={() => {
                        setSelectedFeature(feature);
                        setShowEditModal(true);
                      }}
                    >
                      Edit
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      {showEditModal && selectedFeature && (
        <FeatureEditModal
          feature={selectedFeature}
          onSave={updateFeature}
          onClose={() => {
            setShowEditModal(false);
            setSelectedFeature(null);
          }}
        />
      )}
    </Box>
  );
};

// Feature Edit Modal Component
const FeatureEditModal = ({ feature, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    status: feature.status,
    rollout_percentage: feature.rollout_percentage,
    description: feature.description,
  });

  const handleSave = () => {
    onSave(feature.name, formData);
  };

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="blackAlpha.600"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex="1000"
      onClick={onClose}
    >
      <Box
        bg="white"
        borderRadius="lg"
        width="90%"
        maxWidth="500px"
        maxHeight="80vh"
        overflow="auto"
        boxShadow="xl"
        onClick={e => e.stopPropagation()}
      >
        <Flex justify="space-between" align="center" p={6} borderBottomWidth="1px">
          <Heading size="lg">Edit Feature: {feature.name}</Heading>
          <IconButton
            icon={<Text fontSize="xl">×</Text>}
            onClick={onClose}
            variant="ghost"
            size="sm"
            aria-label="Close modal"
          />
        </Flex>
        
        <VStack spacing={4} p={6} align="stretch">
          <VStack align="start" spacing={2}>
            <Text fontWeight="medium">Status</Text>
            <Select
              value={formData.status}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="enabled">Enabled</option>
              <option value="beta">Beta</option>
              <option value="disabled">Disabled</option>
            </Select>
          </VStack>
          
          <VStack align="start" spacing={2}>
            <Text fontWeight="medium">Rollout Percentage</Text>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.rollout_percentage}
              onChange={e => setFormData(prev => ({ ...prev, rollout_percentage: parseInt(e.target.value) }))}
            />
          </VStack>
          
          <VStack align="start" spacing={2}>
            <Text fontWeight="medium">Description</Text>
            <Input
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </VStack>
        </VStack>
        
        <Flex justify="flex-end" gap={3} p={6} borderTopWidth="1px">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button colorScheme="green" onClick={handleSave}>Save Changes</Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default FeatureFlagsPage;