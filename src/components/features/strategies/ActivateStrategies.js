import React, { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Button,
  VStack,
  Switch,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { MoreVertical, Settings, Trash2, SlidersHorizontal } from 'lucide-react';
import ActivateStrategyModal from './ActivateStrategyModal';
import DeleteStrategy from './DeleteStrategy';
import { useStrategies } from '@/hooks/useStrategies';

const ActivateStrategies = () => {
  // React Query hooks
  const {
    strategies,
    isLoading,
    isError,
    error,
    toggleStrategy,
    isToggling,
    createStrategy,
    deleteStrategy,
    isDeleting
  } = useStrategies();

  // Local state for UI
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  

  const sortOptions = [
    { label: 'Strategy Name', value: 'name' },
    { label: 'Type', value: 'type' },
    { label: 'Status', value: 'status' },
    { label: 'Ticker', value: 'ticker' }
  ];

  
  // Chakra UI hooks
  const toast = useToast();
  const [sortBy, setSortBy] = useState(null);

  const sortedStrategies = useMemo(() => {
    if (!strategies || !sortBy) return strategies;
  
    return [...strategies].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const aName = a.strategy_type === 'single' ? (a.ticker || '') : (a.group_name || '');
          const bName = b.strategy_type === 'single' ? (b.ticker || '') : (b.group_name || '');
          return aName.localeCompare(bName);
        case 'type':
          return a.strategy_type.localeCompare(b.strategy_type);
        case 'status':
          return (b.is_active === a.is_active) ? 0 : a.is_active ? -1 : 1;
        case 'ticker':
          return (a.ticker || '').localeCompare(b.ticker || '');
        default:
          return 0;
      }
    });
  }, [strategies, sortBy]);

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

  // Group strategies by type
  const groupedStrategies = (sortedStrategies || []).reduce((acc, strategy) => {
    if (strategy.strategy_type === 'single') {
      acc.single.push(strategy);
    } else {
      acc.group.push(strategy);
    }
    return acc;
  }, { single: [], group: [] });

  const handleSort = (sortKey) => {
    setSortBy(sortKey);
  };

  // Handle strategy activation
  const handleActivateStrategy = async (strategyData) => {
    try {
      await createStrategy(strategyData);
      onActivateClose();
      toast({
        title: "Strategy Activated",
        description: "Strategy has been successfully activated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error activating strategy",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle strategy toggle
  const handleToggleStrategy = async (strategyId) => {
    try {
      await toggleStrategy(strategyId);
      toast({
        title: "Strategy Updated",
        description: "Strategy status has been updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error updating strategy",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle strategy update
  const handleUpdateStrategy = (strategy) => {
    setSelectedStrategy(strategy);
    onActivateOpen();
  };

  // Handle strategy deletion
  const handleDeleteClick = (strategy) => {
    setSelectedStrategy(strategy);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteStrategy(selectedStrategy.id);
      onDeleteClose();
      setSelectedStrategy(null);
      toast({
        title: "Strategy Deleted",
        description: "Strategy has been successfully removed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error deleting strategy",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const SortButton = ({ onSort }) => {
    return (
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<SlidersHorizontal size={18} />}
          variant="ghost"
          color="white"
          aria-label="Sort strategies"
          size="sm"
          _hover={{
            bg: 'whiteAlpha.100'
          }}
        />
        <MenuList
          bg="rgba(255, 255, 255, 0.1)"
          backdropFilter="blur(10px)"
          borderColor="rgba(255, 255, 255, 0.18)"
          boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
          borderRadius="xl"
        >
          {sortOptions.map((option) => (
            <MenuItem
              key={option.value}
              onClick={() => onSort(option.value)}
              _hover={{ bg: "whiteAlpha.200" }}
              bg="transparent"
              color="white"
            >
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    );
  };

  return (
    <Box h="full" bg="whiteAlpha.100" borderRadius="xl" borderWidth="1px" borderColor="whiteAlpha.200" boxShadow="lg" overflow="hidden">
      <VStack p={4} color="white" h="full" spacing={4} align="stretch">
        <Flex justify="space-between" align="center">
          <Button
            bg="transparent"
            color="white"
            fontWeight="medium"
            borderWidth={1}
            borderColor="rgba(0, 198, 224, 1)"
            onClick={onActivateOpen}
            _hover={{
              bg: 'whiteAlpha.100'
            }}
          >
            Activate Strategy
          </Button>

          <SortButton onSort={handleSort} />
        </Flex>
    
        {isLoading ? (
          <Flex justify="center" align="center" height="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : isError ? (
          <Alert status="error" borderRadius="xl" bg="red.900" color="white">
            <AlertIcon />
            <Box flex="1">
              <Text fontWeight="bold">Error loading strategies</Text>
              <Text>{error || 'An unexpected error occurred'}</Text>
            </Box>
          </Alert>
        ) : strategies.length === 0 ? (
          <Flex justify="center" align="center" height="100%">
            <Text color="whiteAlpha.600">No Active Strategies</Text>
          </Flex>
        ) : (
          <VStack align="stretch" spacing={4}>
            {groupedStrategies.single.length > 0 && (
              <Box>
                <Text fontSize="sm" color="whiteAlpha.600" mb={2}>
                  Single Account Strategies ({groupedStrategies.single.length})
                </Text>
                <VStack align="stretch" spacing={1}>
                  {groupedStrategies.single.map(strategy => (
                    <Box 
                      key={strategy.id}
                      bg="whiteAlpha.100" 
                      borderRadius="lg"
                      p={2}
                      transition="all 0.3s"
                      _hover={{ bg: "whiteAlpha.200" }}
                    >
                      <Flex justifyContent="space-between" alignItems="center" gap={2}>
                        <Flex flex={1} flexDirection="column" gap={1}>
                          <Flex alignItems="center" gap={2}>
                            <Text fontWeight="bold">
                              {strategy.ticker || 'Unknown Ticker'}
                            </Text>
                            <Text fontSize="xs" color="whiteAlpha.700">
                              {strategy.webhook?.name || 'Unnamed Webhook'}
                            </Text>
                            <Text fontSize="xs" color="whiteAlpha.500">
                              ({strategy.webhook?.source_type?.toLowerCase() || 'custom'})
                            </Text>
                          </Flex>
                          <Text fontSize="xs" color="whiteAlpha.700">
                            Account: {String(strategy.broker_account?.account_id || 'N/A')} • 
                            Qty: {strategy.quantity || 0}
                          </Text>
                        </Flex>
  
                        <Flex gap={0.5} alignItems="center">
                          <Switch
                            colorScheme="green"
                            isChecked={strategy.is_active}
                            onChange={() => handleToggleStrategy(strategy.id)}
                            isDisabled={isToggling}
                            size="sm"
                            mx={1}
                          />
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<MoreVertical size={16} color="white" />}
                              variant="ghost"
                              size="sm"
                              _hover={{ bg: 'transparent' }}
                              _active={{ bg: 'transparent' }}
                              _expanded={{ bg: 'transparent' }}
                            />
                            <MenuList 
                              bg="rgba(255, 255, 255, 0.1)"
                              backdropFilter="blur(10px)"
                              borderColor="rgba(255, 255, 255, 0.18)"
                              boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
                              borderRadius="xl"
                            >
                              <MenuItem
                                onClick={() => handleUpdateStrategy(strategy)}
                                _hover={{ bg: "whiteAlpha.200" }}
                                bg="transparent"
                                color="white"
                                icon={<Settings size={14} />}
                              >
                                Update Strategy
                              </MenuItem>
                              <MenuItem
                                onClick={() => handleDeleteClick(strategy)}
                                _hover={{ bg: "whiteAlpha.200" }}
                                bg="transparent"
                                color="red.400"
                                icon={<Trash2 size={14} />}
                              >
                                Delete
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Flex>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
            
            {groupedStrategies.single.length > 0 && groupedStrategies.group.length > 0 && (
              <Divider borderColor="whiteAlpha.200" />
            )}
            
            {groupedStrategies.group.length > 0 && (
              <Box>
                <Text fontSize="sm" color="whiteAlpha.600" mb={2}>
                  Group Strategies ({groupedStrategies.group.length})
                </Text>
                <VStack align="stretch" spacing={1}>
                  {groupedStrategies.group.map(strategy => (
                    <Box 
                      key={strategy.id}
                      bg="whiteAlpha.100" 
                      borderRadius="lg"
                      p={2}
                      transition="all 0.3s"
                      _hover={{ bg: "whiteAlpha.200" }}
                    >
                      <Flex justifyContent="space-between" alignItems="center" gap={2}>
                        <Flex flex={1} flexDirection="column" gap={1}>
                          <Flex alignItems="center" gap={2}>
                            <Text fontWeight="bold">
                              {strategy.group_name || 'Unnamed Group'}
                            </Text>
                            <Text fontSize="xs" color="whiteAlpha.700">
                              {strategy.webhook?.name || 'Unnamed Webhook'}
                            </Text>
                            <Text fontSize="xs" color="whiteAlpha.500">
                              ({strategy.webhook?.source_type?.toLowerCase() || 'custom'})
                            </Text>
                          </Flex>
                          <Text fontSize="xs" color="whiteAlpha.700">
                            Leader: {String(strategy.leader_broker_account?.account_id || 'N/A')} • 
                            Followers: {strategy.follower_accounts?.length || 0} • 
                            Ticker: {strategy.ticker || 'N/A'}
                          </Text>
                        </Flex>
  
                        <Flex gap={0.5} alignItems="center">
                          <Switch
                            colorScheme="green"
                            isChecked={strategy.is_active}
                            onChange={() => handleToggleStrategy(strategy.id)}
                            isDisabled={isToggling}
                            size="sm"
                            mx={1}
                          />
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<MoreVertical size={16} color="white" />}
                              variant="ghost"
                              size="sm"
                              _hover={{ bg: 'transparent' }}
                              _active={{ bg: 'transparent' }}
                              _expanded={{ bg: 'transparent' }}
                            />
                            <MenuList 
                              bg="rgba(255, 255, 255, 0.1)"
                              backdropFilter="blur(10px)"
                              borderColor="rgba(255, 255, 255, 0.18)"
                              boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
                              borderRadius="xl"
                            >
                              <MenuItem
                                onClick={() => handleUpdateStrategy(strategy)}
                                _hover={{ bg: "whiteAlpha.200" }}
                                bg="transparent"
                                color="white"
                                icon={<Settings size={14} />}
                              >
                                Update Strategy
                              </MenuItem>
                              <MenuItem
                                onClick={() => handleDeleteClick(strategy)}
                                _hover={{ bg: "whiteAlpha.200" }}
                                bg="transparent"
                                color="red.400"
                                icon={<Trash2 size={14} />}
                              >
                                Delete
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Flex>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </Box>
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
        isLoading={isDeleting}
        strategyName={selectedStrategy?.strategy_type === 'single'
          ? `${selectedStrategy?.ticker || 'Unknown'} (${String(selectedStrategy?.broker_account?.account_id || 'N/A')})`
          : `Group: ${selectedStrategy?.group_name || 'Unnamed Group'}`}
        strategyType={selectedStrategy?.strategy_type}
      />
    </Box>
  );
};

export default ActivateStrategies;