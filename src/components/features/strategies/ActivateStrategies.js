import React, { useState, useCallback } from 'react';
import {
  Box,
  Flex,
  Button,
  Text,
  useDisclosure,
  VStack,
  IconButton,
  Switch,
  Spinner,
  Alert,
  AlertIcon,
  Divider
} from '@chakra-ui/react';
import { 
  Settings,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { useStrategies } from '@/hooks/useStrategies';
import ActivateStrategyModal from './ActivateStrategyModal';
import DeleteStrategy from './DeleteStrategy';

const StrategyItem = ({ strategy, onToggle, onDelete, onUpdate, isToggling }) => (
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
            ? `Account: ${strategy.accountId ? strategy.accountId.slice(-4) : 'N/A'} • Qty: ${strategy.quantity || 0}`
            : `Leader: ${strategy.leaderAccountId ? strategy.leaderAccountId.slice(-4) : 'N/A'} • Followers: ${strategy.followerAccountIds?.length || 0}`}
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
          isDisabled={isToggling}
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

const StrategyGroup = ({ title, strategies, onToggle, onDelete, onUpdate, isToggling }) => (
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
          isToggling={isToggling}
        />
      ))}
    </VStack>
  </Box>
);

const ActivateStrategies = () => {
  const [selectedStrategy, setSelectedStrategy] = useState(null);
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

  // Use our new strategies hook
  const {
    strategies = [],
    isLoading,
    isError,
    error,
    createStrategy,
    toggleStrategy,
    deleteStrategy,
    isToggling,
    isDeleting
  } = useStrategies();

  const handleActivateStrategy = useCallback(async (strategyData) => {
    await createStrategy(strategyData);
    onActivateClose();
    setSelectedStrategy(null);
  }, [createStrategy, onActivateClose]);

  const handleUpdateStrategy = useCallback((strategy) => {
    setSelectedStrategy(strategy);
    onActivateOpen();
  }, [onActivateOpen]);

  const handleDeleteClick = useCallback((strategy) => {
    setSelectedStrategy(strategy);
    onDeleteOpen();
  }, [onDeleteOpen]);

  const handleDeleteConfirm = async () => {
    await deleteStrategy(selectedStrategy.id);
    onDeleteClose();
    setSelectedStrategy(null);
  };

  // Group strategies by type
  const groupedStrategies = (strategies || []).reduce(
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

  if (isError) {
    return (
      <Alert status="error" borderRadius="xl" bg="red.900" color="white">
        <AlertIcon />
        <Box flex="1">
          <Text fontWeight="bold">Error loading strategies</Text>
          <Text>{error?.message || 'An unexpected error occurred'}</Text>
        </Box>
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
                onToggle={toggleStrategy}
                onDelete={handleDeleteClick}
                onUpdate={handleUpdateStrategy}
                isToggling={isToggling}
              />
            )}
            
            {groupedStrategies.single.length > 0 && groupedStrategies.group.length > 0 && (
              <Divider borderColor="whiteAlpha.200" />
            )}
            
            {groupedStrategies.group.length > 0 && (
              <StrategyGroup
                title="Group Strategies"
                strategies={groupedStrategies.group}
                onToggle={toggleStrategy}
                onDelete={handleDeleteClick}
                onUpdate={handleUpdateStrategy}
                isToggling={isToggling}
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
        isLoading={isDeleting}
        strategyName={selectedStrategy?.type === 'single'
          ? `${selectedStrategy?.ticker} (${selectedStrategy?.accountId})`
          : `Group: ${selectedStrategy?.groupName}`}
        strategyType={selectedStrategy?.type}
      />
    </Box>
  );
};

export default ActivateStrategies;