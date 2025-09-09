import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Box,
  Text,
  VStack,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Input,
  Select,
  useToast,
  Divider,
  Alert,
  AlertIcon,
  ModalCloseButton,
  Badge,
} from '@chakra-ui/react';
import { Plus, Minus, Settings } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';
import { useStrategies } from '@/hooks/useStrategies';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';
import { getDisplayTickers, getContractTicker } from '@/utils/formatting/tickerUtils';

// Helper function to get broker display info
const getBrokerInfo = (brokerId) => {
  if (brokerId === 'interactivebrokers') {
    return { name: 'IB', color: 'blue' };
  }
  return { name: 'Tradovate', color: 'green' };
};

// Styles configuration
const glassEffect = {
  bg: "rgba(255, 255, 255, 0.1)",
  borderColor: "whiteAlpha.300",
  color: "white",
  _hover: { borderColor: "whiteAlpha.400" },
  _focus: { 
    borderColor: "rgba(0, 198, 224, 1)",
    boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
  },
  _placeholder: { 
    color: "whiteAlpha.700" 
  }
};

const selectStyles = {
  ...glassEffect,
  width: "100%",
  bg: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  _hover: { borderColor: "rgba(0, 198, 224, 0.6)" },
  sx: {
    backgroundColor: "rgba(255, 255, 255, 0.05) !important",
    "& option": {
      background: "rgba(26, 32, 44, 0.9)"
    }
  }
};

// Form input wrapper component
const StrategyFormInput = ({ label, children, mb = 2, flex }) => (
  <Box mb={mb} width="full" flex={flex}>
    <Text mb={1} fontSize="sm" fontWeight="medium" color="whiteAlpha.900">
      {label}
    </Text>
    {children}
  </Box>
);

const ActivateStrategyModal = ({ isOpen, onClose, onSubmit, strategy = null, marketplaceStrategy = null, strategyCodes = [] }) => {
  // Debug logging
  React.useEffect(() => {
    if (isOpen) {
      console.log('ActivateStrategyModal opened with strategyCodes:', strategyCodes);
      console.log('Active strategies:', strategyCodes?.filter(code => code.is_active));
      console.log('Active & validated strategies:', strategyCodes?.filter(code => code.is_active && code.is_validated));
    }
  }, [isOpen, strategyCodes]);

  // State management with separate validation states
  const [formData, setFormData] = useState({
    strategyType: 'webhook', // NEW: 'webhook' | 'engine'
    selectedType: 'single',
    singleAccount: {
      accountId: '',
      quantity: 1,
      ticker: '',
      webhookId: '',        // For webhook strategies
      strategyCodeId: ''    // For engine strategies
    },
    multipleAccount: {
      leaderAccountId: '',
      leaderQuantity: 1,
      followerAccounts: [], // Array of {accountId: string, quantity: number}
      ticker: '',
      webhookId: '',        // For webhook strategies
      strategyCodeId: '',   // For engine strategies
      groupName: ''
    },
    // Engine strategy specific fields
    description: '',
    isActive: true,
    stopLossPercent: '',
    takeProfitPercent: '',
    maxDailyLoss: '',
    maxPositionSize: ''
  });
  
  const [accounts, setAccounts] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChangeType, setPendingChangeType] = useState(null);
  const [errors, setErrors] = useState({});
  const { createStrategy, isCreating, createStrategyError, updateStrategy, isUpdating, updateStrategyError, deleteStrategy, isDeleting } = useStrategies();
  const toast = useToast();

  const displayTickers = getDisplayTickers();

  // Form validation functions
  const validateSingleAccount = () => {
    const { accountId, ticker, webhookId, strategyCodeId } = formData.singleAccount;
    
    // Check if we have either a webhook or strategy code selected
    const hasStrategy = Boolean(webhookId || strategyCodeId);
    return Boolean(accountId && ticker && hasStrategy);
  };

  const validateMultipleAccount = () => {
    const { 
      leaderAccountId, 
      followerAccounts, 
      ticker, 
      webhookId, 
      strategyCodeId,
      groupName 
    } = formData.multipleAccount;

    const baseValidation = Boolean(
      leaderAccountId && 
      followerAccounts.length > 0 && 
      ticker && 
      groupName &&
      followerAccounts.every(follower => 
        follower.accountId && follower.quantity > 0
      )
    );

    // Check if we have either a webhook or strategy code selected
    const hasStrategy = Boolean(webhookId || strategyCodeId);
    return baseValidation && hasStrategy;
  };

  const isFormValid = () => {
    return formData.selectedType === 'single' 
      ? validateSingleAccount() 
      : validateMultipleAccount();
  };

  // Strategy type detection from marketplace data
  const detectStrategyType = () => {
    if (marketplaceStrategy) {
      return marketplaceStrategy.strategy_type || 'webhook';
    }
    if (strategy) {
      // Check if existing strategy has webhook_id or strategy_code_id
      return strategy.webhook_id ? 'webhook' : 'engine';
    }
    return 'webhook'; // default
  };

  // Data fetching effect
  useEffect(() => {
    if (isOpen) {
      // Reset confirmation state when modal opens
      setShowConfirmation(false);
      setPendingChangeType(null);
      setErrors({});
      
      // Detect and set strategy type
      const detectedType = detectStrategyType();
      
      const fetchData = async () => {
        try {
          console.log('Fetching accounts and webhooks...');
          const promises = [
            axiosInstance.get('/api/v1/brokers/accounts')
          ];
          
          // Only fetch webhooks for webhook strategies
          if (detectedType === 'webhook') {
            promises.push(webhookApi.getAllAvailableWebhooks());
          }
          
          const responses = await Promise.all(promises);
          const accountsData = responses[0]?.data || [];
          const webhooksResponse = detectedType === 'webhook' ? (responses[1] || []) : [];
          
          // Filter for active accounts, but handle undefined/null cases
          // If is_active is not explicitly false, consider it active
          const activeAccounts = accountsData.filter(account => account.is_active !== false);
          console.log(`Accounts: Total=${accountsData.length}, Active=${activeAccounts.length}`, accountsData);
          setAccounts(activeAccounts);
          if (detectedType === 'webhook') {
            setWebhooks(webhooksResponse);
          }

          // Set initial form data based on strategy type and marketplace data
          setFormData(prev => {
            const newData = {
              ...prev,
              strategyType: detectedType
            };
            
            // Set initial webhook if available for webhook strategies
            if (detectedType === 'webhook' && webhooksResponse.length > 0) {
              const initialWebhookId = webhooksResponse[0].token;
              newData.singleAccount = { ...prev.singleAccount, webhookId: initialWebhookId };
              newData.multipleAccount = { ...prev.multipleAccount, webhookId: initialWebhookId };
            }
            
            // Set initial strategy code if available for engine strategies
            if (detectedType === 'engine' && strategyCodes && strategyCodes.length > 0) {
              const initialCodeId = strategyCodes.find(code => code.is_active)?.id || strategyCodes[0]?.id;
              if (initialCodeId) {
                newData.singleAccount = { ...prev.singleAccount, strategyCodeId: initialCodeId.toString() };
                newData.multipleAccount = { ...prev.multipleAccount, strategyCodeId: initialCodeId.toString() };
              }
            }
            
            // Populate from marketplace strategy if available
            if (marketplaceStrategy) {
              const ticker = marketplaceStrategy.ticker || '';
              newData.singleAccount = { ...newData.singleAccount, ticker };
              newData.multipleAccount = { ...newData.multipleAccount, ticker };
              
              if (detectedType === 'webhook' && marketplaceStrategy.source_id) {
                newData.singleAccount.webhookId = marketplaceStrategy.source_id;
                newData.multipleAccount.webhookId = marketplaceStrategy.source_id;
              }
              if (detectedType === 'engine' && marketplaceStrategy.source_id) {
                newData.singleAccount.strategyCodeId = marketplaceStrategy.source_id.toString();
                newData.multipleAccount.strategyCodeId = marketplaceStrategy.source_id.toString();
              }
            }
            
            return newData;
          });

          // If editing existing strategy, populate form
          if (strategy) {
            setFormData(prev => {
              const strategyType = strategy.webhook_id ? 'webhook' : 'engine';
              
              if (strategy.strategy_type === 'single') {
                return {
                  ...prev,
                  strategyType,
                  selectedType: 'single',
                  singleAccount: {
                    ...prev.singleAccount,
                    accountId: strategy.account_id || '',
                    quantity: strategy.quantity || 1,
                    ticker: strategy.ticker || '',
                    webhookId: strategy.webhook_id || '',
                    strategyCodeId: strategy.strategy_code_id?.toString() || ''
                  },
                  // Engine specific fields
                  description: strategy.description || '',
                  isActive: strategy.is_active !== undefined ? strategy.is_active : true,
                  stopLossPercent: strategy.stop_loss_percent || '',
                  takeProfitPercent: strategy.take_profit_percent || '',
                  maxDailyLoss: strategy.max_daily_loss || '',
                  maxPositionSize: strategy.max_position_size || ''
                };
              } else {
                const followerAccountsData = strategy.follower_account_ids?.map((accountId, index) => ({
                  accountId,
                  quantity: strategy.follower_quantities?.[index] || 1
                })) || [];

                return {
                  ...prev,
                  strategyType,
                  selectedType: 'multiple',
                  multipleAccount: {
                    ...prev.multipleAccount,
                    leaderAccountId: strategy.leader_account_id || '',
                    leaderQuantity: strategy.leader_quantity || 1,
                    followerAccounts: followerAccountsData,
                    ticker: strategy.ticker || '',
                    webhookId: strategy.webhook_id || '',
                    strategyCodeId: strategy.strategy_code_id?.toString() || '',
                    groupName: strategy.group_name || ''
                  },
                  // Engine specific fields
                  description: strategy.description || '',
                  isActive: strategy.is_active !== undefined ? strategy.is_active : true,
                  stopLossPercent: strategy.stop_loss_percent || '',
                  takeProfitPercent: strategy.take_profit_percent || '',
                  maxDailyLoss: strategy.max_daily_loss || '',
                  maxPositionSize: strategy.max_position_size || ''
                };
              }
            });
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          toast({
            title: "Error fetching data",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      };

      fetchData();
    }
  }, [isOpen, strategy, marketplaceStrategy, toast]); // Removed strategyCodes from deps to prevent infinite loop

  // Helper functions for multiple account management
  const handleAddFollower = () => {
    if (formData.multipleAccount.followerAccounts.length >= 19) {
      toast({
        title: "Maximum followers reached",
        description: "Cannot add more than 19 follower accounts",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const availableAccounts = accounts.filter(account => 
      account.account_id !== formData.multipleAccount.leaderAccountId &&
      !formData.multipleAccount.followerAccounts.find(f => f.accountId === account.account_id)
    );

    if (availableAccounts.length === 0) {
      toast({
        title: "No available accounts",
        description: "No more accounts available to add as followers",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      multipleAccount: {
        ...prev.multipleAccount,
        followerAccounts: [
          ...prev.multipleAccount.followerAccounts,
          { accountId: availableAccounts[0].account_id, quantity: 1 }
        ]
      }
    }));
  };

  const handleRemoveFollower = (accountId) => {
    setFormData(prev => ({
      ...prev,
      multipleAccount: {
        ...prev.multipleAccount,
        followerAccounts: prev.multipleAccount.followerAccounts.filter(
          f => f.accountId !== accountId
        )
      }
    }));
  };

  const handleFollowerQuantityChange = (accountId, newQuantity) => {
    setFormData(prev => ({
      ...prev,
      multipleAccount: {
        ...prev.multipleAccount,
        followerAccounts: prev.multipleAccount.followerAccounts.map(f => 
          f.accountId === accountId ? { ...f, quantity: parseInt(newQuantity) } : f
        )
      }
    }));
  };

  // Strategy type toggle handler
  const handleStrategyTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      selectedType: type
    }));
  };

  // Helper function to detect what type of changes are being made
  const detectChangeType = () => {
    if (!strategy) return 'create';

    const currentData = formData.selectedType === 'single' 
      ? {
          ticker: formData.singleAccount.ticker,
          account_id: formData.singleAccount.accountId,
          webhook_id: formData.singleAccount.webhookId,
          strategy_code_id: formData.singleAccount.strategyCodeId,
          quantity: Number(formData.singleAccount.quantity)
        }
      : {
          ticker: formData.multipleAccount.ticker,
          leader_account_id: formData.multipleAccount.leaderAccountId,
          webhook_id: formData.multipleAccount.webhookId,
          strategy_code_id: formData.multipleAccount.strategyCodeId,
          leader_quantity: Number(formData.multipleAccount.leaderQuantity),
          follower_account_ids: formData.multipleAccount.followerAccounts.map(f => f.accountId),
          follower_quantities: formData.multipleAccount.followerAccounts.map(f => Number(f.quantity)),
          group_name: formData.multipleAccount.groupName
        };

    // Check for core field changes that require delete + recreate
    const coreFieldsChanged = 
      currentData.ticker !== strategy.ticker ||
      currentData.webhook_id !== strategy.webhook_id ||
      currentData.strategy_code_id !== strategy.strategy_code_id?.toString() ||
      (strategy.strategy_type === 'single' && currentData.account_id !== strategy.account_id) ||
      (strategy.strategy_type === 'multiple' && currentData.leader_account_id !== strategy.leader_account_id) ||
      (strategy.strategy_type === 'multiple' && 
        JSON.stringify(currentData.follower_account_ids.sort()) !== JSON.stringify(strategy.follower_account_ids?.sort() || []));

    if (coreFieldsChanged) {
      return 'recreate';
    }

    // Check for simple updates (quantities, group name, active status, engine fields)
    const quantitiesChanged = 
      (strategy.strategy_type === 'single' && currentData.quantity !== strategy.quantity) ||
      (strategy.strategy_type === 'multiple' && 
        (currentData.leader_quantity !== strategy.leader_quantity ||
         JSON.stringify(currentData.follower_quantities) !== JSON.stringify(strategy.follower_quantities || []))) ||
      (strategy.strategy_type === 'multiple' && currentData.group_name !== strategy.group_name);
      
    // Check engine-specific field changes
    const engineFieldsChanged = formData.strategyType === 'engine' && (
      formData.description !== (strategy.description || '') ||
      formData.isActive !== strategy.is_active ||
      formData.stopLossPercent !== (strategy.stop_loss_percent || '') ||
      formData.takeProfitPercent !== (strategy.take_profit_percent || '') ||
      formData.maxDailyLoss !== (strategy.max_daily_loss || '') ||
      formData.maxPositionSize !== (strategy.max_position_size || '')
    );

    return (quantitiesChanged || engineFieldsChanged) ? 'update' : 'nochange';
  };

  // Handle confirmed recreate operation
  const handleConfirmedRecreate = async () => {
    try {
      setShowConfirmation(false);
      
      // First delete the existing strategy
      const strategyType = strategy.webhook_id ? 'webhook' : 'engine';
      await deleteStrategy({ strategyId: strategy.id, strategyType });
      
      // Then create the new strategy with updated data
      const strategyData = buildStrategyData();
      await createStrategy(strategyData);
      
      toast({
        title: "Strategy Replaced",
        description: "Your strategy has been successfully updated with the new settings",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      
      onClose();
      
    } catch (error) {
      console.error('Strategy recreate error:', error);
      toast({
        title: "Error updating strategy",
        description: "Failed to update strategy. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Build strategy data based on current form state and strategy type
  const buildStrategyData = () => {
    const baseData = {
      strategy_type: formData.selectedType,
      ticker: formData.selectedType === 'single' ? formData.singleAccount.ticker : formData.multipleAccount.ticker
    };

    // Add type-specific identification field
    if (formData.strategyType === 'webhook') {
      baseData.webhook_id = formData.selectedType === 'single' 
        ? formData.singleAccount.webhookId 
        : formData.multipleAccount.webhookId;
    } else {
      baseData.strategy_code_id = parseInt(
        formData.selectedType === 'single' 
          ? formData.singleAccount.strategyCodeId 
          : formData.multipleAccount.strategyCodeId
      );
      
      // Add engine-specific fields
      baseData.description = formData.description;
      baseData.is_active = formData.isActive;
      if (formData.stopLossPercent) baseData.stop_loss_percent = parseFloat(formData.stopLossPercent);
      if (formData.takeProfitPercent) baseData.take_profit_percent = parseFloat(formData.takeProfitPercent);
      if (formData.maxDailyLoss) baseData.max_daily_loss = parseFloat(formData.maxDailyLoss);
      if (formData.maxPositionSize) baseData.max_position_size = parseInt(formData.maxPositionSize);
    }

    if (formData.selectedType === 'single') {
      baseData.account_id = formData.singleAccount.accountId;
      baseData.quantity = Number(formData.singleAccount.quantity);
    } else {
      baseData.leader_account_id = formData.multipleAccount.leaderAccountId;
      baseData.leader_quantity = Number(formData.multipleAccount.leaderQuantity);
      baseData.group_name = formData.multipleAccount.groupName;
      baseData.follower_account_ids = formData.multipleAccount.followerAccounts.map(f => f.accountId);
      baseData.follower_quantities = formData.multipleAccount.followerAccounts.map(f => Number(f.quantity));
    }

    return baseData;
  };

  // Form submission handler
  const handleSubmit = async () => {
    try {
      const changeType = detectChangeType();
      
      if (changeType === 'nochange') {
        toast({
          title: "No Changes",
          description: "No changes were made to the strategy",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        onClose();
        return;
      }
      
      if (changeType === 'update') {
        // For updates, build update data based on strategy type
        const updateData = {};
        
        if (formData.selectedType === 'single') {
          updateData.quantity = Number(formData.singleAccount.quantity);
        } else {
          updateData.leader_quantity = Number(formData.multipleAccount.leaderQuantity);
          updateData.follower_quantities = formData.multipleAccount.followerAccounts.map(f => Number(f.quantity));
          if (formData.multipleAccount.groupName !== strategy.group_name) {
            updateData.group_name = formData.multipleAccount.groupName;
          }
        }
        
        // Add engine-specific update fields
        if (formData.strategyType === 'engine') {
          updateData.description = formData.description;
          updateData.is_active = formData.isActive;
          if (formData.stopLossPercent) updateData.stop_loss_percent = parseFloat(formData.stopLossPercent);
          if (formData.takeProfitPercent) updateData.take_profit_percent = parseFloat(formData.takeProfitPercent);
          if (formData.maxDailyLoss) updateData.max_daily_loss = parseFloat(formData.maxDailyLoss);
          if (formData.maxPositionSize) updateData.max_position_size = parseInt(formData.maxPositionSize);
        } else {
          updateData.is_active = true;
        }

        await updateStrategy({ 
          strategyId: strategy.id, 
          updateData,
          strategyType: formData.strategyType
        });
        
      } else if (changeType === 'recreate') {
        // Show confirmation modal for core field changes
        setPendingChangeType('recreate');
        setShowConfirmation(true);
        return; // Don't close the modal yet
        
      } else {
        // For creation, send all required fields
        const strategyData = buildStrategyData();
        await createStrategy(strategyData);
      }
      
      // Close the modal only after successful operation
      onClose();
      
    } catch (error) {
      console.error('Strategy submission error:', error);
      const operation = strategy ? 'updating' : 'creating';
      toast({
        title: `Error ${operation} strategy`,
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Modal render
  return (
    <>
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered
      size="xl"
      closeOnOverlayClick={!isCreating}
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent 
        bg="rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="xl"
        color="white"
        p={4}
      >
        <ModalHeader borderBottom="1px solid rgba(255, 255, 255, 0.18)" pb={4}>
          <VStack spacing={2} align="start">
            <Text fontSize="lg" fontWeight="bold">
              {strategy ? 'Update Strategy' : 'Activate Strategy'}
            </Text>
            {(marketplaceStrategy || formData.strategyType === 'engine') && (
              <Badge 
                colorScheme={formData.strategyType === 'webhook' ? 'green' : 'purple'}
                size="sm"
              >
                {formData.strategyType === 'webhook' ? 'Webhook Strategy' : 'Engine Strategy'}
              </Badge>
            )}
            {marketplaceStrategy && (
              <Text fontSize="sm" color="whiteAlpha.700">
                {marketplaceStrategy.name}
              </Text>
            )}
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
   
        <ModalBody py={4}>
          <VStack spacing={4} align="stretch">
            {createStrategyError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {createStrategyError.message}
              </Alert>
            )}
   
            <HStack width="full" spacing={4}>
              <Button
                flex={1}
                variant="ghost"
                bg={formData.selectedType === 'single' ? 'whiteAlpha.200' : 'transparent'}
                color="white"
                borderWidth={1}
                borderColor={formData.selectedType === 'single' ? "rgba(0, 198, 224, 1)" : "whiteAlpha.300"}
                onClick={() => handleStrategyTypeChange('single')}
                _hover={{ bg: 'whiteAlpha.300' }}
                transform={formData.selectedType === 'single' ? 'translateY(-2px)' : 'none'}
                boxShadow={formData.selectedType === 'single' ? 'lg' : 'none'}
                transition="all 0.2s"
              >
                Single Account
              </Button>
              <Button
                flex={1}
                variant="ghost"
                bg={formData.selectedType === 'multiple' ? 'whiteAlpha.200' : 'transparent'}
                color="white"
                borderWidth={1}
                borderColor={formData.selectedType === 'multiple' ? "rgba(0, 198, 224, 1)" : "whiteAlpha.300"}
                onClick={() => handleStrategyTypeChange('multiple')}
                _hover={{ bg: 'whiteAlpha.300' }}
                transform={formData.selectedType === 'multiple' ? 'translateY(-2px)' : 'none'}
                boxShadow={formData.selectedType === 'multiple' ? 'lg' : 'none'}
                transition="all 0.2s"
              >
                Multiple Account
              </Button>
            </HStack>
   
            <Divider borderColor="whiteAlpha.300" />

            {/* Strategy Selection - Show ALL available strategies */}
            <StrategyFormInput label="Strategy">
              <Select
                {...selectStyles}
                value={formData.selectedType === 'single' 
                  ? (formData.singleAccount.strategyCodeId || formData.singleAccount.webhookId)
                  : (formData.multipleAccount.strategyCodeId || formData.multipleAccount.webhookId)}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  // Auto-detect if this is an engine strategy (numeric) or webhook (string)
                  const isEngineStrategy = !isNaN(selectedValue);
                  
                  setFormData(prev => ({
                    ...prev,
                    strategyType: isEngineStrategy ? 'engine' : 'webhook',
                    singleAccount: {
                      ...prev.singleAccount,
                      strategyCodeId: isEngineStrategy ? selectedValue : '',
                      webhookId: isEngineStrategy ? '' : selectedValue
                    },
                    multipleAccount: {
                      ...prev.multipleAccount,
                      strategyCodeId: isEngineStrategy ? selectedValue : '',
                      webhookId: isEngineStrategy ? '' : selectedValue
                    }
                  }));
                }}
                placeholder="Select Strategy"
              >
                {/* Engine Strategies */}
                {(strategyCodes || []).filter(code => code.is_active).length > 0 && (
                  <optgroup label="Engine Strategies">
                    {(strategyCodes || []).filter(code => code.is_active).map(code => {
                      // Format the strategy name for display
                      let displayName = code.name;
                      if (code.name === 'stddev_breakout') {
                        displayName = 'Standard Deviation Breakout';
                      } else if (code.name === 'momentum_scalper') {
                        displayName = 'Momentum Scalper';
                      } else if (code.name === 'mean_reversion') {
                        displayName = 'Mean Reversion';
                      } else {
                        displayName = code.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      }
                      
                      return (
                        <option key={`engine_${code.id}`} value={code.id}>
                          {displayName} {code.is_validated ? '✓' : ''} (Engine)
                        </option>
                      );
                    })}
                  </optgroup>
                )}

                {/* Webhook Strategies */}
                {(webhooks || []).length > 0 && (
                  <optgroup label="Webhook Strategies">
                    {(webhooks || []).map(webhook => (
                      <option key={`webhook_${webhook.token}`} value={webhook.token}>
                        {webhook.name} (Webhook)
                      </option>
                    ))}
                  </optgroup>
                )}
              </Select>
                {(() => {
                  const selectedCode = (strategyCodes || []).find(code => 
                    code.id === parseInt(
                      formData.selectedType === 'single' 
                        ? formData.singleAccount.strategyCodeId 
                        : formData.multipleAccount.strategyCodeId
                    )
                  );
                  return selectedCode && (
                    <Box mt={2} p={2} bg="whiteAlpha.100" borderRadius="md">
                      <HStack spacing={2}>
                        <Badge colorScheme={selectedCode.is_validated ? 'green' : 'orange'}>
                          {selectedCode.is_validated ? 'Validated' : 'Not Validated'}
                        </Badge>
                        <Badge colorScheme={selectedCode.is_active ? 'green' : 'red'}>
                          {selectedCode.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </HStack>
                      {selectedCode.description && (
                        <Text fontSize="sm" color="whiteAlpha.700" mt={1}>
                          {selectedCode.description}
                        </Text>
                      )}
                    </Box>
                  );
                })()} 
              </StrategyFormInput>
            )}
   
            {formData.selectedType === 'single' ? (
              <VStack spacing={4} align="stretch">
                <Select
                  {...selectStyles}
                  value={formData.singleAccount.accountId}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    singleAccount: {
                      ...prev.singleAccount,
                      accountId: e.target.value
                    }
                  }))}
                  placeholder="Select Trading Account"
                >
                  {accounts.map(account => (
                    <option key={account.account_id} value={account.account_id}>
                      {account.name || account.account_id} ({getBrokerInfo(account.broker_id).name})
                    </option>
                  ))}
                </Select>

                <HStack spacing={4}>
                  <NumberInput
                    min={1}
                    value={formData.singleAccount.quantity}
                    onChange={(value) => setFormData(prev => ({
                      ...prev,
                      singleAccount: {
                        ...prev.singleAccount,
                        quantity: parseInt(value)
                      }
                    }))}
                  >
                    <NumberInputField {...glassEffect} placeholder="Quantity" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>

                  <Select
                    {...selectStyles}
                    value={formData.singleAccount.ticker}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      singleAccount: {
                        ...prev.singleAccount,
                        ticker: e.target.value
                      }
                    }))}
                    placeholder="Select Ticker"
                  >
                    {displayTickers.map(ticker => (
                      <option key={ticker} value={ticker}>{ticker}</option>
                    ))}
                  </Select>
                </HStack>
              </VStack>
            ) : (
              <VStack spacing={4} align="stretch">
                <Input
                  {...glassEffect}
                  value={formData.multipleAccount.groupName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    multipleAccount: {
                      ...prev.multipleAccount,
                      groupName: e.target.value
                    }
                  }))}
                  placeholder="Enter Group Name"
                />

                <Select
                  {...selectStyles}
                  value={formData.multipleAccount.ticker}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    multipleAccount: {
                      ...prev.multipleAccount,
                      ticker: e.target.value
                    }
                  }))}
                  placeholder="Select Ticker"
                >
                  {displayTickers.map(ticker => (
                    <option key={ticker} value={ticker}>{ticker}</option>
                  ))}
                </Select>

                <HStack spacing={4}>
                  <Select
                    {...selectStyles}
                    value={formData.multipleAccount.leaderAccountId}
                    onChange={(e) => {
                      const newLeaderId = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        multipleAccount: {
                          ...prev.multipleAccount,
                          leaderAccountId: newLeaderId,
                          followerAccounts: prev.multipleAccount.followerAccounts.filter(
                            f => f.accountId !== newLeaderId
                          )
                        }
                      }));
                    }}
                    placeholder="Select Leader Account"
                  >
                    {accounts.map(account => (
                      <option key={account.account_id} value={account.account_id}>
                        {account.name || account.account_id} ({getBrokerInfo(account.broker_id).name})
                      </option>
                    ))}
                  </Select>

                  <NumberInput
                    min={1}
                    value={formData.multipleAccount.leaderQuantity}
                    onChange={(value) => setFormData(prev => ({
                      ...prev,
                      multipleAccount: {
                        ...prev.multipleAccount,
                        leaderQuantity: parseInt(value)
                      }
                    }))}
                  >
                    <NumberInputField {...glassEffect} placeholder="Leader Quantity" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </HStack>

                <VStack spacing={2} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="whiteAlpha.900">
                    Follower Accounts ({formData.multipleAccount.followerAccounts.length}/19)
                  </Text>
                  
                  {formData.multipleAccount.followerAccounts.map((follower, index) => {
                    const account = accounts.find(a => a.account_id === follower.accountId);
                    
                    return (
                      <HStack key={follower.accountId} spacing={2}>
                        <Box flex={2} bg="whiteAlpha.100" p={2} borderRadius="md">
                          <Text fontSize="sm" color="white">
                            {account?.name || follower.accountId} ({getBrokerInfo(account?.broker_id).name})
                          </Text>
                        </Box>
                        
                        <NumberInput
                          flex={1}
                          min={1}
                          value={follower.quantity}
                          onChange={(value) => handleFollowerQuantityChange(follower.accountId, value)}
                        >
                          <NumberInputField {...glassEffect} placeholder="Quantity" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleRemoveFollower(follower.accountId)}
                        >
                          <Minus size={16} />
                        </Button>
                      </HStack>
                    );
                  })}

                  {formData.multipleAccount.followerAccounts.length < 19 && (
                    <Button
                      leftIcon={<Plus size={16} />}
                      onClick={handleAddFollower}
                      size="sm"
                      variant="ghost"
                      color="white"
                      borderWidth={1}
                      borderColor="whiteAlpha.300"
                      _hover={{ bg: 'whiteAlpha.200' }}
                      isDisabled={!formData.multipleAccount.leaderAccountId}
                    >
                      Add Follower Account
                    </Button>
                  )}
                </VStack>
              </VStack>
            )}
   

            {/* Engine Strategy Risk Management Fields */}
            {formData.strategyType === 'engine' && (
              <VStack spacing={4} align="stretch">
                <Text fontSize="md" fontWeight="semibold" color="orange.300">
                  Risk Management (Optional)
                </Text>
                
                <HStack spacing={4}>
                  <StrategyFormInput label="Stop Loss %" flex={1}>
                    <Input
                      {...glassEffect}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.stopLossPercent}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        stopLossPercent: e.target.value
                      }))}
                      placeholder="0.00"
                    />
                  </StrategyFormInput>
                  
                  <StrategyFormInput label="Take Profit %" flex={1}>
                    <Input
                      {...glassEffect}
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.takeProfitPercent}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        takeProfitPercent: e.target.value
                      }))}
                      placeholder="0.00"
                    />
                  </StrategyFormInput>
                </HStack>
                
                <HStack spacing={4}>
                  <StrategyFormInput label="Max Daily Loss" flex={1}>
                    <Input
                      {...glassEffect}
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maxDailyLoss}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        maxDailyLoss: e.target.value
                      }))}
                      placeholder="0.00"
                    />
                  </StrategyFormInput>
                  
                  <StrategyFormInput label="Max Position Size" flex={1}>
                    <Input
                      {...glassEffect}
                      type="number"
                      min="1"
                      value={formData.maxPositionSize}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        maxPositionSize: e.target.value
                      }))}
                      placeholder="0"
                    />
                  </StrategyFormInput>
                </HStack>
                
                <StrategyFormInput label="Description (Optional)">
                  <Input
                    {...glassEffect}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Strategy description..."
                  />
                </StrategyFormInput>
              </VStack>
            )}
   
            <Button
              width="full"
              colorScheme="green"
              onClick={handleSubmit}
              isLoading={strategy ? isUpdating : isCreating}
              loadingText={strategy ? "Updating..." : "Creating..."}
              isDisabled={!isFormValid()}
              size="lg"
              _hover={{ 
                bg: 'green.500',
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              }}
              _active={{
                bg: 'green.600',
                transform: 'translateY(0)',
                boxShadow: 'md'
              }}
              transition="all 0.2s"
            >
              {strategy ? 'Update Strategy' : 'Activate Strategy'}
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>

    {/* Confirmation Modal for Core Field Changes */}
    <Modal isOpen={showConfirmation} onClose={() => setShowConfirmation(false)} isCentered size="md">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent 
        bg="rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="xl"
        color="white"
        maxW="md"
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.1)"
          pb={4}
          fontSize="lg"
          fontWeight="semibold"
        >
          ⚠️ Replace Strategy?
        </ModalHeader>
        <ModalCloseButton 
          color="whiteAlpha.700"
          _hover={{ color: "white", bg: "whiteAlpha.200" }}
        />
        <ModalBody py={6}>
          <VStack spacing={5} align="stretch">
            <Text color="whiteAlpha.900" fontSize="sm" lineHeight="1.6">
              You've changed core fields (ticker, account, or webhook). This requires creating a new strategy to maintain data integrity.
            </Text>
            
            <Box 
              bg="rgba(255, 193, 7, 0.08)" 
              border="1px solid rgba(255, 193, 7, 0.25)"
              borderRadius="lg" 
              p={4}
              backdropFilter="blur(5px)"
            >
              <Text color="yellow.200" fontSize="sm" fontWeight="medium" lineHeight="1.5">
                ⚡ Your current strategy will be replaced with the new settings. This action cannot be undone.
              </Text>
            </Box>

            <HStack spacing={3} pt={3}>
              <Button
                flex={1}
                variant="ghost"
                onClick={() => setShowConfirmation(false)}
                color="whiteAlpha.700"
                _hover={{ 
                  bg: 'whiteAlpha.200',
                  color: 'white'
                }}
                _active={{
                  bg: 'whiteAlpha.300'
                }}
                borderRadius="lg"
                size="lg"
              >
                Cancel
              </Button>
              <Button
                flex={1}
                bg="linear-gradient(135deg, rgba(255, 140, 0, 0.8), rgba(255, 69, 0, 0.8))"
                color="white"
                onClick={handleConfirmedRecreate}
                isLoading={isDeleting || isCreating}
                loadingText="Replacing..."
                _hover={{ 
                  bg: "linear-gradient(135deg, rgba(255, 140, 0, 0.9), rgba(255, 69, 0, 0.9))",
                  transform: 'translateY(-1px)',
                  boxShadow: 'lg'
                }}
                _active={{
                  transform: 'translateY(0)',
                  boxShadow: 'md'
                }}
                borderRadius="lg"
                size="lg"
                fontWeight="semibold"
              >
                Replace Strategy
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
    </>
  );
};

export default ActivateStrategyModal;