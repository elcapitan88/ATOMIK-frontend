import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import {
  Box,
  Flex,
  Button,
  ButtonGroup,
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
  useToast,
  Badge,
  HStack,
  Tooltip
} from '@chakra-ui/react';
import { MoreVertical, Settings, Trash2, SlidersHorizontal, Zap, Activity, Plus, Users } from 'lucide-react';
import ActivateStrategyModal from './ActivateStrategyModal';
import DeleteStrategy from './DeleteStrategy';
import { useUnifiedStrategies as useStrategies } from '@/hooks/useUnifiedStrategies';
import { strategyCodesApi } from '@/services/api/strategies/strategyCodesApi';

const WebhooksView = lazy(() => import('@/components/features/trading/WebhooksView'));

// Helper function to get broker display info
const getBrokerInfo = (brokerId) => {
  if (brokerId === 'interactivebrokers') {
    return { name: 'IB', color: 'blue' };
  }
  return { name: 'Tradovate', color: 'green' };
};

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

  // Chakra UI hooks
  const toast = useToast();

  // Local state for UI
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [strategyCodes, setStrategyCodes] = useState([]);
  
  const sortOptions = [
    { label: 'Strategy Name', value: 'name' },
    { label: 'Type', value: 'type' },
    { label: 'Status', value: 'status' },
    { label: 'Ticker', value: 'ticker' }
  ];

  // Fetch strategy codes for the activate modal
  useEffect(() => {
    const fetchStrategyCodes = async () => {
      try {
        const codes = await strategyCodesApi.listStrategyCodes();
        console.log('Fetched strategy codes:', codes); // Debug log
        setStrategyCodes(codes);
      } catch (error) {
        console.error('Error fetching strategy codes:', error);
        toast({
          title: "Error loading strategy codes",
          description: error.message || "Failed to load available strategies",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };
    
    fetchStrategyCodes();
  }, [toast]);
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
          bg="rgba(0, 0, 0, 0.85)"
          backdropFilter="blur(20px)"
          borderColor="rgba(255, 255, 255, 0.1)"
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.4)"
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

  const [panelView, setPanelView] = useState('strategies');

  return (
    <Box h="full" bg="whiteAlpha.100" borderRadius="xl" borderWidth="1px" borderColor="whiteAlpha.200" boxShadow="lg" overflow="hidden" display="flex" flexDirection="column">
      {/* Header: Tabs + Sort */}
      <Flex px={4} pt={4} pb={2} justify="center" align="center" flexShrink={0} position="relative">
        <ButtonGroup size="xs" isAttached variant="ghost" spacing={0}>
          <Button
            onClick={() => setPanelView('strategies')}
            bg={panelView === 'strategies' ? 'whiteAlpha.200' : 'transparent'}
            color={panelView === 'strategies' ? 'white' : 'whiteAlpha.600'}
            _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
            leftIcon={<Activity size={13} />}
            fontWeight={panelView === 'strategies' ? 'semibold' : 'normal'}
            borderRadius="md"
            px={3}
          >
            Strategies
          </Button>
          <Button
            onClick={() => setPanelView('webhooks')}
            bg={panelView === 'webhooks' ? 'whiteAlpha.200' : 'transparent'}
            color={panelView === 'webhooks' ? 'white' : 'whiteAlpha.600'}
            _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
            leftIcon={<Zap size={13} />}
            fontWeight={panelView === 'webhooks' ? 'semibold' : 'normal'}
            borderRadius="md"
            px={3}
          >
            Webhooks
          </Button>
        </ButtonGroup>

        {panelView === 'strategies' && <Box position="absolute" right={4}><SortButton onSort={handleSort} /></Box>}
      </Flex>

      {/* Scrollable Content */}
      <Box flex="1" overflowY="auto" px={4} pb={2} color="white">
        {/* Webhooks View */}
        {panelView === 'webhooks' && (
          <Suspense fallback={<Flex justify="center" py={6}><Spinner size="md" color="cyan.400" /></Flex>}>
            <WebhooksView />
          </Suspense>
        )}

        {/* Strategies View */}
        {panelView === 'strategies' && (
        <>
        {isLoading ? (
          <Flex justify="center" align="center" height="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : isError ? (
          <Alert status="error" borderRadius="xl" bg="red.900" color="white">
            <AlertIcon />
            <Box flex="1">
              <Text fontWeight="bold">Error loading strategies</Text>
              <Text>{error?.message || error?.toString() || 'An unexpected error occurred'}</Text>
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
                  {groupedStrategies.single.map(strategy => {
                    const strategyName = strategy.name || strategy.webhook?.name || 'Unnamed Strategy';
                    const execType = strategy.execution_type === 'engine' ? 'engine' : 'webhook';
                    return (
                    <Box
                      key={strategy.id}
                      bg="whiteAlpha.100"
                      borderRadius="lg"
                      p={3}
                      pl={4}
                      transition="all 0.3s"
                      _hover={{ bg: "whiteAlpha.200" }}
                      position="relative"
                      overflow="hidden"
                    >
                      {/* Left accent bar — green if active, gray if not */}
                      <Box
                        position="absolute"
                        left={0}
                        top={0}
                        bottom={0}
                        w="3px"
                        bg={strategy.is_active ? 'green.400' : 'whiteAlpha.300'}
                        transition="background 0.3s"
                      />

                      <Flex justifyContent="space-between" alignItems="center" gap={2}>
                        <Flex flex={1} flexDirection="column" gap={1.5} minW={0}>
                          {/* Row 1: Ticker + Strategy Name (truncated) + Type badge */}
                          <HStack spacing={2} minW={0}>
                            <Text fontWeight="bold" fontSize="sm" flexShrink={0}>
                              {strategy.ticker || 'N/A'}
                            </Text>
                            <Tooltip label={strategyName} placement="top" hasArrow openDelay={500}>
                              <Text
                                fontSize="xs"
                                color="whiteAlpha.600"
                                isTruncated
                                flex={1}
                                minW={0}
                              >
                                {strategyName}
                              </Text>
                            </Tooltip>
                            <Badge
                              fontSize="9px"
                              px={1.5}
                              py={0.5}
                              borderRadius="md"
                              bg={execType === 'engine' ? 'purple.900' : 'whiteAlpha.100'}
                              color={execType === 'engine' ? 'purple.200' : 'whiteAlpha.500'}
                              fontWeight="medium"
                              textTransform="lowercase"
                              flexShrink={0}
                            >
                              {execType}
                            </Badge>
                          </HStack>

                          {/* Row 2: Account + Broker badge + Qty — separate elements */}
                          <HStack spacing={2} fontSize="xs">
                            <Text color="whiteAlpha.500" flexShrink={0}>
                              {String(strategy.broker_account?.account_id || 'N/A')}
                            </Text>
                            <Badge
                              colorScheme={getBrokerInfo(strategy.broker_account?.broker_id).color}
                              fontSize="9px"
                              px={1.5}
                              borderRadius="sm"
                            >
                              {getBrokerInfo(strategy.broker_account?.broker_id).name}
                            </Badge>
                            <Text color="whiteAlpha.400">|</Text>
                            <Text color="whiteAlpha.600" fontWeight="medium">
                              Qty: {strategy.quantity || 0}
                            </Text>
                          </HStack>
                        </Flex>

                        {/* Right side: Toggle + Menu */}
                        <HStack spacing={1} flexShrink={0}>
                          <Switch
                            colorScheme="green"
                            isChecked={strategy.is_active}
                            onChange={() => handleToggleStrategy(strategy.id)}
                            isDisabled={isToggling}
                            size="sm"
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
                              bg="rgba(0, 0, 0, 0.85)"
                              backdropFilter="blur(20px)"
                              borderColor="rgba(255, 255, 255, 0.1)"
                              boxShadow="0 4px 20px rgba(0, 0, 0, 0.4)"
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
                        </HStack>
                      </Flex>
                    </Box>
                    );
                  })}
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
                  {groupedStrategies.group.map(strategy => {
                    const strategyName = strategy.name || strategy.webhook?.name || 'Unnamed Strategy';
                    const execType = strategy.execution_type === 'engine' ? 'engine' : 'webhook';
                    const followerCount = strategy.follower_accounts?.length || 0;
                    return (
                    <Box
                      key={strategy.id}
                      bg="whiteAlpha.100"
                      borderRadius="lg"
                      p={3}
                      pl={4}
                      transition="all 0.3s"
                      _hover={{ bg: "whiteAlpha.200" }}
                      position="relative"
                      overflow="hidden"
                    >
                      {/* Left accent bar — green if active, gray if not */}
                      <Box
                        position="absolute"
                        left={0}
                        top={0}
                        bottom={0}
                        w="3px"
                        bg={strategy.is_active ? 'green.400' : 'whiteAlpha.300'}
                        transition="background 0.3s"
                      />

                      <Flex justifyContent="space-between" alignItems="center" gap={2}>
                        <Flex flex={1} flexDirection="column" gap={1.5} minW={0}>
                          {/* Row 1: Group name + Strategy Name (truncated) + Type badge */}
                          <HStack spacing={2} minW={0}>
                            <Text fontWeight="bold" fontSize="sm" flexShrink={0}>
                              {strategy.group_name || 'Unnamed Group'}
                            </Text>
                            <Tooltip label={strategyName} placement="top" hasArrow openDelay={500}>
                              <Text
                                fontSize="xs"
                                color="whiteAlpha.600"
                                isTruncated
                                flex={1}
                                minW={0}
                              >
                                {strategyName}
                              </Text>
                            </Tooltip>
                            <Badge
                              fontSize="9px"
                              px={1.5}
                              py={0.5}
                              borderRadius="md"
                              bg={execType === 'engine' ? 'purple.900' : 'whiteAlpha.100'}
                              color={execType === 'engine' ? 'purple.200' : 'whiteAlpha.500'}
                              fontWeight="medium"
                              textTransform="lowercase"
                              flexShrink={0}
                            >
                              {execType}
                            </Badge>
                          </HStack>

                          {/* Row 2: Ticker + Leader account + Broker badge + Followers */}
                          <HStack spacing={2} fontSize="xs">
                            <Text color="whiteAlpha.600" fontWeight="medium" flexShrink={0}>
                              {strategy.ticker || 'N/A'}
                            </Text>
                            <Text color="whiteAlpha.400">|</Text>
                            <Text color="whiteAlpha.500" flexShrink={0}>
                              {String(strategy.leader_broker_account?.account_id || 'N/A')}
                            </Text>
                            <Badge
                              colorScheme={getBrokerInfo(strategy.leader_broker_account?.broker_id).color}
                              fontSize="9px"
                              px={1.5}
                              borderRadius="sm"
                            >
                              {getBrokerInfo(strategy.leader_broker_account?.broker_id).name}
                            </Badge>
                            <Text color="whiteAlpha.400">|</Text>
                            <HStack spacing={1} color="whiteAlpha.500">
                              <Users size={11} />
                              <Text>{followerCount}</Text>
                            </HStack>
                          </HStack>
                        </Flex>

                        {/* Right side: Toggle + Menu */}
                        <HStack spacing={1} flexShrink={0}>
                          <Switch
                            colorScheme="green"
                            isChecked={strategy.is_active}
                            onChange={() => handleToggleStrategy(strategy.id)}
                            isDisabled={isToggling}
                            size="sm"
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
                              bg="rgba(0, 0, 0, 0.85)"
                              backdropFilter="blur(20px)"
                              borderColor="rgba(255, 255, 255, 0.1)"
                              boxShadow="0 4px 20px rgba(0, 0, 0, 0.4)"
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
                        </HStack>
                      </Flex>
                    </Box>
                    );
                  })}
                </VStack>
              </Box>
            )}
          </VStack>
        )}
        </>
        )}
      </Box>

      {/* Bottom Button — pinned like Connect Account */}
      {panelView === 'strategies' && (
        <Box px={4} py={3} borderTop="1px solid" borderColor="whiteAlpha.100" flexShrink={0}>
          <Button
            w="100%"
            size="sm"
            variant="outline"
            borderColor="whiteAlpha.300"
            color="whiteAlpha.800"
            leftIcon={<Plus size={14} />}
            onClick={onActivateOpen}
            _hover={{ bg: 'whiteAlpha.100', borderColor: 'cyan.400', color: 'cyan.400' }}
          >
            Activate Strategy
          </Button>
        </Box>
      )}

      <ActivateStrategyModal
        isOpen={isActivateOpen}
        onClose={() => {
          onActivateClose();
          setSelectedStrategy(null);
        }}
        onSubmit={handleActivateStrategy}
        strategy={selectedStrategy}
        strategyCodes={strategyCodes}
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