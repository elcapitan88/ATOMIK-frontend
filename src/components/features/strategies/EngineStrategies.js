import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  Grid,
  Badge,
  useToast,
  Spinner,
  Button,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  Tooltip,
  Card,
  CardHeader,
  CardBody,
  Divider,
} from '@chakra-ui/react';
import { 
  Plus,
  Code,
  Settings,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { strategiesApi } from '@/services/api/strategies';
import { strategyCodesApi } from '@/services/api/strategies/strategyCodesApi';
import { formatCurrency } from '@/utils/formatting/currency';
import EngineStrategyModal from './EngineStrategyModal';
import StrategyCodeModal from './StrategyCodeModal';

const EngineStrategyCard = ({ strategy, onEdit, onDelete, onToggle, isLoading }) => {
  const winRate = strategy.total_trades > 0 
    ? (strategy.successful_trades / strategy.total_trades * 100).toFixed(1)
    : 0;

  return (
    <Card
      bg="whiteAlpha.100"
      borderRadius="xl"
      backdropFilter="blur(10px)"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      transition="all 0.3s"
      _hover={{ bg: 'whiteAlpha.200' }}
    >
      <CardHeader>
        <Flex justify="space-between" align="center">
          <HStack spacing={2}>
            <Box p={2} bg="blue.500" borderRadius="md">
              <Activity size={16} color="white" />
            </Box>
            <VStack spacing={0} align="start">
              <Text fontWeight="bold" color="white" fontSize="lg">
                {strategy.strategy_code?.name || 'Unknown Strategy'}
              </Text>
              <Text fontSize="sm" color="whiteAlpha.600">
                {strategy.ticker} • {strategy.strategy_type} strategy
              </Text>
            </VStack>
          </HStack>
          <HStack spacing={2}>
            <Badge colorScheme={strategy.is_active ? 'green' : 'red'}>
              {strategy.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge colorScheme="purple">
              Engine
            </Badge>
          </HStack>
        </Flex>
      </CardHeader>

      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          <Grid templateColumns="1fr 1fr 1fr" gap={4}>
            <Box>
              <Text fontSize="xs" color="whiteAlpha.600">Win Rate</Text>
              <Text 
                fontSize="lg" 
                color={parseFloat(winRate) >= 50 ? 'green.400' : 'red.400'}
                fontWeight="bold"
              >
                {winRate}%
              </Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="whiteAlpha.600">Trades</Text>
              <Text fontSize="lg" color="white" fontWeight="bold">
                {strategy.total_trades || 0}
              </Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="whiteAlpha.600">P&L</Text>
              <Text 
                fontSize="lg" 
                color={strategy.total_pnl > 0 ? 'green.400' : 'red.400'}
                fontWeight="bold"
              >
                {formatCurrency(strategy.total_pnl || 0)}
              </Text>
            </Box>
          </Grid>

          <Divider />

          <Box>
            <Text fontSize="xs" color="whiteAlpha.600" mb={1}>Configuration</Text>
            <Grid templateColumns="1fr 1fr" gap={4}>
              <Box>
                <Text fontSize="sm" color="whiteAlpha.800">
                  Account: {strategy.broker_account?.account_id || 'N/A'}
                </Text>
                <Text fontSize="sm" color="whiteAlpha.800">
                  Quantity: {strategy.quantity || 0}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="whiteAlpha.800">
                  Last Signal: {strategy.last_triggered 
                    ? new Date(strategy.last_triggered).toLocaleString()
                    : 'Never'}
                </Text>
              </Box>
            </Grid>
          </Box>

          <HStack spacing={2} justify="flex-end">
            <Tooltip label="Edit Configuration">
              <IconButton
                icon={<Settings size={16} />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={() => onEdit(strategy)}
              />
            </Tooltip>
            <Tooltip label={strategy.is_active ? 'Deactivate' : 'Activate'}>
              <IconButton
                icon={strategy.is_active ? <Pause size={16} /> : <Play size={16} />}
                size="sm"
                variant="ghost"
                colorScheme={strategy.is_active ? 'orange' : 'green'}
                onClick={() => onToggle(strategy.id)}
                isLoading={isLoading}
              />
            </Tooltip>
            <Tooltip label="Delete Strategy">
              <IconButton
                icon={<Trash2 size={16} />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => onDelete(strategy.id)}
              />
            </Tooltip>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

const EngineStrategies = () => {
  const [engineStrategies, setEngineStrategies] = useState([]);
  const [strategyCodes, setStrategyCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const toast = useToast();
  
  const {
    isOpen: isStrategyModalOpen,
    onOpen: onStrategyModalOpen,
    onClose: onStrategyModalClose
  } = useDisclosure();

  const {
    isOpen: isCodeModalOpen,
    onOpen: onCodeModalOpen,
    onClose: onCodeModalClose
  } = useDisclosure();

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [strategiesResponse, codesResponse] = await Promise.all([
        strategiesApi.listEngineStrategies(),
        strategyCodesApi.listStrategyCodes()
      ]);
      
      setEngineStrategies(strategiesResponse);
      setStrategyCodes(codesResponse);
    } catch (error) {
      toast({
        title: "Error fetching data",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData(false);
    setIsRefreshing(false);
  };

  const handleCreateStrategy = () => {
    setSelectedStrategy(null);
    onStrategyModalOpen();
  };

  const handleEditStrategy = (strategy) => {
    setSelectedStrategy(strategy);
    onStrategyModalOpen();
  };

  const handleToggleStrategy = async (strategyId) => {
    setActionLoading(prev => ({ ...prev, [strategyId]: true }));
    try {
      await strategiesApi.updateEngineStrategy(strategyId, { 
        is_active: !engineStrategies.find(s => s.id === strategyId)?.is_active 
      });
      await fetchData(false);
      toast({
        title: "Strategy updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error updating strategy",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [strategyId]: false }));
    }
  };

  const handleDeleteStrategy = async (strategyId) => {
    if (!window.confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) {
      return;
    }

    try {
      await strategiesApi.deleteEngineStrategy(strategyId);
      await fetchData(false);
      toast({
        title: "Strategy deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error deleting strategy",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleStrategyModalSave = async (strategyData) => {
    try {
      if (selectedStrategy) {
        await strategiesApi.updateEngineStrategy(selectedStrategy.id, strategyData);
        toast({
          title: "Strategy updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await strategiesApi.configureEngineStrategy(strategyData);
        toast({
          title: "Strategy configured",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      await fetchData(false);
      onStrategyModalClose();
    } catch (error) {
      toast({
        title: "Error saving strategy",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCodeModalSave = async () => {
    await fetchData(false);
    onCodeModalClose();
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box 
      minH="100vh" 
      bg="background" 
      color="text.primary"
      p={6}
    >
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <HStack spacing={3}>
            <Box p={3} bg="purple.500" borderRadius="lg">
              <Code size={24} color="white" />
            </Box>
            <VStack spacing={0} align="start">
              <Text fontSize="2xl" fontWeight="bold" color="white">
                Strategy Engine
              </Text>
              <Text color="whiteAlpha.600" fontSize="sm">
                Automated trading strategies powered by live market data
              </Text>
            </VStack>
          </HStack>
          
          <HStack spacing={3}>
            <Button
              leftIcon={<Code size={16} />}
              onClick={onCodeModalOpen}
              bg="transparent"
              color="white"
              borderWidth={1}
              borderColor="whiteAlpha.200"
              _hover={{ bg: 'whiteAlpha.100' }}
            >
              Manage Code
            </Button>
            <Button
              leftIcon={<RefreshCw size={16} />}
              onClick={handleRefresh}
              isLoading={isRefreshing}
              bg="transparent"
              color="white"
              borderWidth={1}
              borderColor="whiteAlpha.200"
              _hover={{ bg: 'whiteAlpha.100' }}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<Plus size={16} />}
              onClick={handleCreateStrategy}
              colorScheme="blue"
              size="md"
            >
              Configure Strategy
            </Button>
          </HStack>
        </Flex>

        <Grid templateColumns="repeat(4, 1fr)" gap={6}>
          <Card bg="whiteAlpha.100" borderRadius="xl" borderColor="whiteAlpha.200">
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="3xl" fontWeight="bold" color="white">
                  {engineStrategies.length}
                </Text>
                <Text color="whiteAlpha.600" textAlign="center">
                  Total Engine Strategies
                </Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card bg="whiteAlpha.100" borderRadius="xl" borderColor="whiteAlpha.200">
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="3xl" fontWeight="bold" color="green.400">
                  {engineStrategies.filter(s => s.is_active).length}
                </Text>
                <Text color="whiteAlpha.600" textAlign="center">
                  Active Strategies
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="whiteAlpha.100" borderRadius="xl" borderColor="whiteAlpha.200">
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="3xl" fontWeight="bold" color="blue.400">
                  {strategyCodes.filter(c => c.is_active).length}
                </Text>
                <Text color="whiteAlpha.600" textAlign="center">
                  Active Strategy Codes
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="whiteAlpha.100" borderRadius="xl" borderColor="whiteAlpha.200">
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="3xl" fontWeight="bold" color="orange.400">
                  {engineStrategies.reduce((sum, s) => sum + (s.total_trades || 0), 0)}
                </Text>
                <Text color="whiteAlpha.600" textAlign="center">
                  Total Trades
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {engineStrategies.length === 0 ? (
          <Card bg="whiteAlpha.100" borderRadius="xl" borderColor="whiteAlpha.200">
            <CardBody py={12}>
              <VStack spacing={4}>
                <AlertTriangle size={48} color="white" opacity={0.6} />
                <Text color="white" fontSize="xl" textAlign="center">
                  No Engine Strategies Configured
                </Text>
                <Text color="whiteAlpha.600" textAlign="center" maxW="md">
                  Configure your first Strategy Engine strategy to start automated trading 
                  based on live market data and custom algorithms.
                </Text>
                <Button
                  leftIcon={<Plus size={16} />}
                  onClick={handleCreateStrategy}
                  colorScheme="blue"
                  size="lg"
                  mt={4}
                >
                  Configure Strategy
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <Grid 
            templateColumns="repeat(auto-fill, minmax(400px, 1fr))" 
            gap={6}
          >
            {engineStrategies.map(strategy => (
              <EngineStrategyCard
                key={strategy.id}
                strategy={strategy}
                onEdit={handleEditStrategy}
                onDelete={handleDeleteStrategy}
                onToggle={handleToggleStrategy}
                isLoading={actionLoading[strategy.id]}
              />
            ))}
          </Grid>
        )}
      </VStack>

      {/* Strategy Configuration Modal */}
      <EngineStrategyModal
        isOpen={isStrategyModalOpen}
        onClose={onStrategyModalClose}
        onSave={handleStrategyModalSave}
        strategy={selectedStrategy}
        strategyCodes={strategyCodes}
      />

      {/* Strategy Code Management Modal */}
      <StrategyCodeModal
        isOpen={isCodeModalOpen}
        onClose={onCodeModalClose}
        onSave={handleCodeModalSave}
        strategyCodes={strategyCodes}
      />
    </Box>
  );
};

export default EngineStrategies;