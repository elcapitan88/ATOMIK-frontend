import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, 
  Flex,
  Button,
  Text,
  useDisclosure,
  useToast,
  VStack,
  IconButton,
  Switch,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider
} from '@chakra-ui/react';
import { 
  Settings,
  Trash2,
  PlusCircle,
  RefreshCw
} from 'lucide-react';
import { strategiesApi } from '@/services/api/strategies/strategiesApi';
import ActivateStrategyModal from './ActivateStrategyModal';
import DeleteStrategy from './DeleteStrategy';

const StrategyItem = ({ strategy, onToggle, onDelete, onUpdate }) => (
  <Box 
    bg="whiteAlpha.100" 
    borderRadius="lg"
    p={2}
    mb={1}
    transition="all 0.3s"
    _hover={{ bg: "whiteAlpha.200" }}
  >
    <Flex justifyContent="space-between" alignItems="center">
      <Flex flex={1} alignItems="center" gap={4}>
        <Text fontSize="sm" fontWeight="bold">
          {strategy.type === 'single' ? strategy.ticker : strategy.groupName}
        </Text>
        <Text fontSize="xs" color="whiteAlpha.700">
          {strategy.type === 'single' 
            ? `Account: ${strategy.accountId.slice(-4)} • Qty: ${strategy.quantity}`
            : `Leader: ${strategy.leaderAccountId.slice(-4)} • Followers: ${strategy.followerAccountIds?.length || 0}`}
        </Text>
      </Flex>

      <Flex gap={0.5} alignItems="center">
        <IconButton
          icon={<Settings size={16} />}
          variant="ghost"
          size="sm"
          color="whiteAlpha.700"
          onClick={() => onUpdate(strategy)}
          _hover={{ color: 'white' }}
          aria-label="Settings"
        />
        <Switch
          colorScheme="green"
          isChecked={strategy.isActive}
          onChange={() => onToggle(strategy.id)}
          size="sm"
          mx={1}
        />
        <IconButton
          icon={<Trash2 size={16} />}
          variant="ghost"
          size="sm"
          color="red.500"
          onClick={() => onDelete(strategy)}
          _hover={{ color: 'red.400' }}
          aria-label="Delete"
        />
      </Flex>
    </Flex>
  </Box>
);

const StrategyGroup = ({ title, strategies, onToggle, onDelete, onUpdate }) => (
  <Box mb={4}>
    <Text fontSize="sm" color="whiteAlpha.600" mb={2}>
      {title} ({strategies.length})
    </Text>
    <VStack align="stretch" spacing={1}>
      {strategies.map(strategy => (
        <StrategyItem
          key={strategy.id}
          strategy={strategy}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </VStack>
  </Box>
);

const ActivateStrategies = () => {
  const [strategies, setStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { 
    isOpen: isActivateOpen, 
    onOpen: onActivateOpen, 
    onClose: onActivateClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();

  const toast = useToast();

  const fetchStrategies = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);
      const response = await strategiesApi.listStrategies();
      setStrategies(response);
      
      localStorage.setItem('cachedStrategies', JSON.stringify({
        data: response,
        timestamp: Date.now()
      }));

    } catch (error) {
      setError(error.message);
      toast({
        title: "Error fetching strategies",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const loadStrategies = async () => {
      const cached = localStorage.getItem('cachedStrategies');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isCacheValid = Date.now() - timestamp < 5 * 60 * 1000;

        if (isCacheValid) {
          setStrategies(data);
          setIsLoading(false);
          fetchStrategies(false);
          return;
        }
      }
      await fetchStrategies();
    };

    loadStrategies();
  }, [fetchStrategies]);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchStrategies(false);
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [fetchStrategies]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStrategies(false);
    setIsRefreshing(false);
  };

  const handleActivateStrategy = useCallback(async (strategyData) => {
    try {
      const response = await strategiesApi.activateStrategy(strategyData);
      setStrategies(prev => [...prev, response]);
      toast({
        title: "Strategy Activated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return response;
    } catch (error) {
      toast({
        title: "Error activating strategy",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  }, [toast]);

  const handleUpdateStrategy = useCallback((strategy) => {
    setSelectedStrategy(strategy);
    onActivateOpen();
  }, [onActivateOpen]);

  const handleToggleStrategy = async (strategyId) => {
    try {
      await strategiesApi.toggleStrategy(strategyId);
      setStrategies(prev =>
        prev.map(strategy =>
          strategy.id === strategyId
            ? { ...strategy, isActive: !strategy.isActive }
            : strategy
        )
      );
      toast({
        title: "Strategy Updated",
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
    }
  };

  const handleDeleteClick = useCallback((strategy) => {
    setSelectedStrategy(strategy);
    onDeleteOpen();
  }, [onDeleteOpen]);

  const handleDeleteConfirm = async () => {
    try {
      await strategiesApi.deleteStrategy(selectedStrategy.id);
      setStrategies(prev =>
        prev.filter(strategy => strategy.id !== selectedStrategy.id)
      );
      toast({
        title: "Strategy Deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
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

  // Group strategies by type
  const groupedStrategies = strategies.reduce(
    (acc, strategy) => {
      if (strategy.type === 'single') {
        acc.single.push(strategy);
      } else {
        acc.group.push(strategy);
      }
      return acc;
    },
    { single: [], group: [] }
  );

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="xl" bg="red.900" color="white">
        <AlertIcon />
        <Box flex="1">
          <AlertTitle>Error loading strategies</AlertTitle>
          <AlertDescription display="block">
            {error}
          </AlertDescription>
        </Box>
        <Button onClick={() => fetchStrategies()} ml={3} variant="outline">
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box 
      h="full" 
      bg="whiteAlpha.100" 
      borderRadius="xl" 
      borderWidth="1px" 
      borderColor="whiteAlpha.200" 
      boxShadow="lg" 
      overflow="hidden"
    >
      <VStack p={4} color="white" h="full" spacing={4} align="stretch">
        <Flex justify="space-between" align="center">
          <Text fontSize="xl" fontWeight="semibold">Active Strategies</Text>
          <Button
            bg="transparent"
            color="white"
            fontWeight="medium"
            borderWidth={1}
            borderColor="rgba(0, 198, 224, 1)"
            leftIcon={<PlusCircle size={16} />}
            onClick={onActivateOpen}
            _hover={{
              bg: 'whiteAlpha.100'
            }}
          >
            Activate Strategy
          </Button>
        </Flex>

        {strategies.length === 0 ? (
          <Flex justify="center" align="center" height="100%">
            <Text color="whiteAlpha.600">No Active Strategies</Text>
          </Flex>
        ) : (
          <VStack align="stretch" spacing={4}>
            {groupedStrategies.single.length > 0 && (
              <StrategyGroup
                title="Single Account Strategies"
                strategies={groupedStrategies.single}
                onToggle={handleToggleStrategy}
                onDelete={handleDeleteClick}
                onUpdate={handleUpdateStrategy}
              />
            )}
            
            {groupedStrategies.single.length > 0 && groupedStrategies.group.length > 0 && (
              <Divider borderColor="whiteAlpha.200" />
            )}
            
            {groupedStrategies.group.length > 0 && (
              <StrategyGroup
                title="Group Strategies"
                strategies={groupedStrategies.group}
                onToggle={handleToggleStrategy}
                onDelete={handleDeleteClick}
                onUpdate={handleUpdateStrategy}
              />
            )}
          </VStack>
        )}
      </VStack>

      <ActivateStrategyModal
        isOpen={isActivateOpen}
        onClose={() => {
          onActivateClose();
          setSelectedStrategy(null);
        }}
        onSubmit={handleActivateStrategy}
        strategy={selectedStrategy}
      />
      
      <DeleteStrategy
        isOpen={isDeleteOpen}
        onClose={() => {
          onDeleteClose();
          setSelectedStrategy(null);
        }}
        onConfirm={handleDeleteConfirm}
        strategyName={selectedStrategy?.type === 'single'
          ? `${selectedStrategy?.ticker} (${selectedStrategy?.accountId})`
          : `Group: ${selectedStrategy?.groupName}`}
        strategyType={selectedStrategy?.type}
      />
    </Box>
  );
};

export default ActivateStrategies;