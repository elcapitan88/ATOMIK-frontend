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
  Switch,
  Collapse,
  RadioGroup,
  Radio,
  Flex,
  Checkbox,
  CheckboxGroup,
} from '@chakra-ui/react';
import { Plus, Minus, Settings, Clock } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';
import { useUnifiedStrategies as useStrategies } from '@/hooks/useUnifiedStrategies';
import { unifiedAccessibleApi } from '@/services/api/strategies/unifiedAccessibleApi';
import { getDisplayTickers, getContractTicker } from '@/utils/formatting/tickerUtils';

// Helper function to get broker display info
const getBrokerInfo = (brokerId) => {
  if (brokerId === 'interactivebrokers') {
    return { name: 'IB', color: 'blue' };
  }
  return { name: 'Tradovate', color: 'green' };
};

// Helper function to determine if a webhook is an engine strategy
const isEngineStrategy = (webhookId) => {
  return webhookId && !isNaN(parseInt(webhookId));
};

const ActivateStrategyModal = ({
  isOpen,
  onClose,
  strategy = null,
  marketplaceStrategy = null
}) => {
  const toast = useToast();
  const displayTickers = getDisplayTickers();

  // React Query hooks
  const {
    createStrategy,
    isCreating,
    createStrategyError,
    updateStrategy,
    isUpdating,
    deleteStrategy,
    isDeleting
  } = useStrategies();

  // State for webhook creation
  const [creatingWebhook, setCreatingWebhook] = useState(false);

  // Form state - initialize from strategy if provided
  const [formData, setFormData] = useState(() => {
    if (strategy) {
      return {
        selectedType: strategy.strategy_type || 'single',
        singleAccount: {
          webhookId: strategy.webhook_id || '',
          strategyCodeId: strategy.strategy_code_id || '',
          ticker: strategy.ticker || '',
          accountId: strategy.account_id || '',
          quantity: strategy.quantity || 1
        },
        multipleAccount: {
          webhookId: strategy.webhook_id || '',
          strategyCodeId: strategy.strategy_code_id || '',
          ticker: strategy.ticker || '',
          leaderAccountId: strategy.leader_account_id || '',
          leaderQuantity: strategy.leader_quantity || 1,
          followerAccounts: strategy.follower_account_ids?.map((id, index) => ({
            accountId: id,
            quantity: strategy.follower_quantities?.[index] || 1
          })) || [],
          groupName: strategy.group_name || 'Strategy Group'
        },
        description: strategy.description || '',
        isActive: strategy.is_active !== undefined ? strategy.is_active : true
      };
    }

    // Default state for new strategy
    return {
      selectedType: 'single',
      singleAccount: {
        webhookId: marketplaceStrategy?.webhook_id || '',
        strategyCodeId: marketplaceStrategy?.strategy_code_id || '',
        ticker: 'MES',
        accountId: '',
        quantity: 1
      },
      multipleAccount: {
        webhookId: marketplaceStrategy?.webhook_id || '',
        strategyCodeId: marketplaceStrategy?.strategy_code_id || '',
        ticker: 'MES',
        leaderAccountId: '',
        leaderQuantity: 1,
        followerAccounts: [],
        groupName: 'Strategy Group'
      },
      description: '',
      isActive: true
    };
  });

  const [accounts, setAccounts] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  // Removed confirmation modal state - no longer needed with unified API
  const [errors, setErrors] = useState({});

  // Schedule state
  const [enableSchedule, setEnableSchedule] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState([]);

  // Initialize schedule state from strategy
  useEffect(() => {
    if (strategy && strategy.market_schedule && strategy.market_schedule.length > 0) {
      setEnableSchedule(true);
      setSelectedMarkets(strategy.market_schedule);
    } else {
      setEnableSchedule(false);
      setSelectedMarkets([]);
    }
  }, [strategy]);

  // Available markets for scheduling
  const availableMarkets = [
    { value: 'us_equity', label: 'US Equity (9:30 AM - 4:00 PM ET)' },
    { value: 'us_equity_premarket', label: 'US Pre-Market (4:00 AM - 9:30 AM ET)' },
    { value: 'us_equity_afterhours', label: 'US After Hours (4:00 PM - 8:00 PM ET)' },
    { value: 'futures_regular', label: 'Futures Regular (6:00 PM - 5:00 PM ET)' },
    { value: 'futures_overnight', label: 'Futures Overnight (5:00 PM - 8:30 AM ET)' },
    { value: 'forex', label: 'Forex (24/5 Sunday 5 PM - Friday 5 PM ET)' },
    { value: 'crypto', label: 'Crypto (24/7)' }
  ];

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    const data = formData.selectedType === 'single'
      ? formData.singleAccount
      : formData.multipleAccount;

    if (!data.webhookId && !data.strategyCodeId) {
      newErrors.strategy = 'Please select a strategy';
    }
    if (!data.ticker) {
      newErrors.ticker = 'Please select a ticker';
    }

    if (formData.selectedType === 'single') {
      if (!data.accountId) {
        newErrors.account = 'Please select an account';
      }
      if (!data.quantity || data.quantity < 1) {
        newErrors.quantity = 'Quantity must be at least 1';
      }
    } else {
      if (!data.leaderAccountId) {
        newErrors.leaderAccount = 'Please select a leader account';
      }
      if (!data.leaderQuantity || data.leaderQuantity < 1) {
        newErrors.leaderQuantity = 'Leader quantity must be at least 1';
      }
      if (data.followerAccounts.length === 0) {
        newErrors.followers = 'Please add at least one follower account';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Data fetching effect
  useEffect(() => {
    if (isOpen) {
      // Reset confirmation state when modal opens
      // Reset form state
      setErrors({});

      const fetchData = async () => {
        try {
          // Fetch accounts (still needed separately for account selection)
          const accountsResponse = await axiosInstance.get('/api/v1/brokers/accounts');
          setAccounts(accountsResponse.data || []);

          // Single unified API call to get all accessible strategies
          console.log('Fetching all accessible strategies using unified API...');
          const accessibleStrategies = await unifiedAccessibleApi.getAccessibleStrategies();

          // Separate strategies by type
          const { webhooks, engines } = unifiedAccessibleApi.separateByType(accessibleStrategies);

          // Transform webhook strategies to match existing format
          const formattedWebhooks = webhooks.map(strategy => ({
            token: strategy.source_id,
            name: strategy.name,
            details: strategy.description,
            strategy_type: strategy.category.toUpperCase(),
            is_active: strategy.is_active,
            usage_intent: strategy.is_premium ? 'monetize' : 'personal',
            subscriber_count: strategy.subscriber_count,
            rating: strategy.rating,
            created_at: strategy.created_at,
            // Add access info for UI display
            accessType: strategy.access_type,
            creator: strategy.creator
          }));

          console.log('Unified API Results:', {
            totalStrategies: accessibleStrategies.length,
            webhooks: webhooks.length,
            engines: engines.length,
            byAccess: {
              owned: accessibleStrategies.filter(s => s.access_type === 'owned').length,
              subscribed: accessibleStrategies.filter(s => s.access_type === 'subscribed').length,
              purchased: accessibleStrategies.filter(s => s.access_type === 'purchased').length
            }
          });

          setWebhooks(formattedWebhooks);

          // Transform engine strategies to match existing format
          const formattedEngines = engines.map(strategy => ({
            id: strategy.source_id,
            name: strategy.name,
            description: strategy.description,
            is_active: strategy.is_active,
            is_validated: true,
            created_at: strategy.created_at,
            // Add access info for UI display
            accessType: strategy.access_type,
            creator: strategy.creator
          }));

          // Set engine strategies (this replaces the separate fetch below)
          setStrategyCodes(formattedEngines);
        } catch (error) {
          console.error('Error fetching data:', error);
          toast({
            title: "Error loading data",
            description: "Failed to load accounts or strategies",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      };

      fetchData();
    }
  }, [isOpen, toast]);

  // Strategy code state - now populated from unified API
  const [strategyCodes, setStrategyCodes] = useState([]);
  const [loadingStrategyCodes, setLoadingStrategyCodes] = useState(false);

  // NOTE: Strategy codes are now fetched via the unified API in the main fetchData function above
  // This separate fetching is no longer needed and has been removed to avoid duplicate API calls

  // Set default webhook/strategy code when modal opens with marketplaceStrategy
  useEffect(() => {
    if (marketplaceStrategy && isOpen && !strategy) {
      setFormData(prev => ({
        ...prev,
        singleAccount: {
          ...prev.singleAccount,
          webhookId: marketplaceStrategy.webhook_id || '',
          strategyCodeId: marketplaceStrategy.strategy_code_id || ''
        },
        multipleAccount: {
          ...prev.multipleAccount,
          webhookId: marketplaceStrategy.webhook_id || '',
          strategyCodeId: marketplaceStrategy.strategy_code_id || ''
        }
      }));
    }
  }, [marketplaceStrategy, isOpen, strategy]);

  // Handle account selection
  const handleAccountChange = (accountId) => {
    setFormData(prev => ({
      ...prev,
      singleAccount: {
        ...prev.singleAccount,
        accountId
      }
    }));
  };

  // Handle leader account change
  const handleLeaderAccountChange = (leaderAccountId) => {
    setFormData(prev => ({
      ...prev,
      multipleAccount: {
        ...prev.multipleAccount,
        leaderAccountId
      }
    }));
  };

  // Handle follower accounts
  const addFollowerAccount = () => {
    setFormData(prev => ({
      ...prev,
      multipleAccount: {
        ...prev.multipleAccount,
        followerAccounts: [
          ...prev.multipleAccount.followerAccounts,
          { accountId: '', quantity: 1 }
        ]
      }
    }));
  };

  const removeFollowerAccount = (index) => {
    setFormData(prev => ({
      ...prev,
      multipleAccount: {
        ...prev.multipleAccount,
        followerAccounts: prev.multipleAccount.followerAccounts.filter((_, i) => i !== index)
      }
    }));
  };

  const updateFollowerAccount = (index, field, value) => {
    setFormData(prev => {
      const newFollowers = [...prev.multipleAccount.followerAccounts];
      newFollowers[index] = {
        ...newFollowers[index],
        [field]: value
      };
      return {
        ...prev,
        multipleAccount: {
          ...prev.multipleAccount,
          followerAccounts: newFollowers
        }
      };
    });
  };

  // Handle strategy type change
  const handleStrategyTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      selectedType: type
    }));
  };

  // Helper function to check if any fields have changed that need updating
  const hasChanges = () => {
    if (!strategy) return true; // New strategy always has changes

    // Check for quantity changes
    if (formData.selectedType === 'single') {
      if (Number(formData.singleAccount.quantity) !== strategy.quantity) return true;
    } else {
      if (Number(formData.multipleAccount.leaderQuantity) !== strategy.leader_quantity) return true;
      const newFollowerQuantities = formData.multipleAccount.followerAccounts.map(f => Number(f.quantity));
      if (JSON.stringify(newFollowerQuantities) !== JSON.stringify(strategy.follower_quantities || [])) return true;
      if (formData.multipleAccount.groupName !== strategy.group_name) return true;
    }

    // Check engine-specific fields
    const selectedValue = formData.selectedType === 'single'
      ? (formData.singleAccount.strategyCodeId || formData.singleAccount.webhookId)
      : (formData.multipleAccount.strategyCodeId || formData.multipleAccount.webhookId);

    if (isEngineStrategy(selectedValue)) {
      if (formData.description !== (strategy.description || '')) return true;
      if (formData.isActive !== strategy.is_active) return true;
    }

    // Check market schedule changes
    const strategyHasSchedule = strategy.market_schedule && strategy.market_schedule.length > 0;
    const formHasSchedule = enableSchedule && selectedMarkets.length > 0;
    if (strategyHasSchedule !== formHasSchedule) return true;
    if (formHasSchedule && JSON.stringify(selectedMarkets.sort()) !== JSON.stringify((strategy.market_schedule || []).sort())) return true;

    return false;
  };

  // Removed handleConfirmedRecreate - no longer needed with unified API that supports proper updates

  // Build strategy data based on current form state and strategy type
  const buildStrategyData = () => {
    console.log('Building strategy data from formData:', formData);

    const baseData = {
      strategy_type: formData.selectedType,
      ticker: formData.selectedType === 'single' ? formData.singleAccount.ticker : formData.multipleAccount.ticker
    };

    // Determine strategy type and add appropriate fields
    const selectedValue = formData.selectedType === 'single'
      ? (formData.singleAccount.strategyCodeId || formData.singleAccount.webhookId)
      : (formData.multipleAccount.strategyCodeId || formData.multipleAccount.webhookId);

    if (isEngineStrategy(selectedValue)) {
      baseData.execution_type = 'engine'; // Add execution_type for engine strategies
      baseData.strategy_code_id = parseInt(selectedValue);
      baseData.webhook_id = null; // Explicitly set to null for engine strategies
      baseData.description = formData.description;
      baseData.is_active = formData.isActive;
      console.log('Creating ENGINE strategy with code_id:', baseData.strategy_code_id);
    } else {
      baseData.execution_type = 'webhook'; // Add execution_type for webhook strategies
      baseData.webhook_id = selectedValue;
      baseData.strategy_code_id = null; // Explicitly set to null for webhook strategies
      console.log('Creating WEBHOOK strategy with webhook_id:', baseData.webhook_id);
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

    // Add market schedule if enabled
    console.log('Building strategy - enableSchedule:', enableSchedule, 'selectedMarkets:', selectedMarkets);
    if (enableSchedule && selectedMarkets.length > 0) {
      baseData.market_schedule = selectedMarkets;
      console.log('Including market schedule:', selectedMarkets);
    } else {
      baseData.market_schedule = null;
      console.log('No market schedule - manual mode');
    }

    console.log('Final strategy data being sent:', baseData);
    console.log('Schedule state at submission - enabled:', enableSchedule, 'markets:', selectedMarkets);
    return baseData;
  };

  // Form submission handler - Simplified with unified API (no more delete+recreate!)
  const handleSubmit = async () => {
    try {
      if (strategy) {
        // UPDATE existing strategy
        if (!hasChanges()) {
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

        console.log('Updating strategy:', strategy.id);
        const updateData = {};

        // Add quantity updates
        if (formData.selectedType === 'single') {
          updateData.quantity = Number(formData.singleAccount.quantity);
        } else {
          updateData.leader_quantity = Number(formData.multipleAccount.leaderQuantity);
          updateData.follower_quantities = formData.multipleAccount.followerAccounts.map(f => Number(f.quantity));
          if (formData.multipleAccount.groupName !== strategy.group_name) {
            updateData.group_name = formData.multipleAccount.groupName;
          }
        }

        // Add engine-specific fields
        const selectedValue = formData.selectedType === 'single'
          ? (formData.singleAccount.strategyCodeId || formData.singleAccount.webhookId)
          : (formData.multipleAccount.strategyCodeId || formData.multipleAccount.webhookId);

        if (isEngineStrategy(selectedValue)) {
          updateData.description = formData.description;
          updateData.is_active = formData.isActive;
        } else {
          updateData.is_active = true;
        }

        // Add market schedule
        if (enableSchedule && selectedMarkets.length > 0) {
          updateData.market_schedule = selectedMarkets;
        } else {
          updateData.market_schedule = null;
        }

        console.log('Sending update data:', updateData);
        await updateStrategy({
          strategyId: strategy.id,
          updateData,
        });

        toast({
          title: "Strategy Updated",
          description: "Your strategy has been successfully updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // CREATE new strategy
        const strategyData = buildStrategyData();
        console.log('Creating new strategy:', strategyData);
        await createStrategy(strategyData);

        toast({
          title: "Strategy Created",
          description: "Your strategy has been successfully activated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      // Close the modal after successful operation
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
                transition="all 0.2s"
                isDisabled={!!strategy}
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
                transition="all 0.2s"
                isDisabled={!!strategy}
              >
                Multiple Accounts
              </Button>
            </HStack>

            {formData.selectedType === 'single' ? (
              // Single Account Configuration
              <VStack spacing={4}>
                <Box width="full">
                  <Text fontSize="sm" mb={2} color="whiteAlpha.700">Strategy</Text>
                  <Select
                    value={formData.singleAccount.strategyCodeId || formData.singleAccount.webhookId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const isEngine = isEngineStrategy(value);
                      setFormData(prev => ({
                        ...prev,
                        singleAccount: {
                          ...prev.singleAccount,
                          webhookId: isEngine ? '' : value,
                          strategyCodeId: isEngine ? value : ''
                        }
                      }));
                    }}
                    bg="whiteAlpha.100"
                    border="1px solid"
                    borderColor={errors.strategy ? "red.300" : "whiteAlpha.300"}
                    _hover={{ borderColor: 'whiteAlpha.400' }}
                    _focus={{ borderColor: 'rgba(0, 198, 224, 0.6)', boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.6)' }}
                    isDisabled={!!strategy}
                  >
                    <option value="" style={{ background: '#1a1a1a' }}>Select Strategy</option>
                    {webhooks.length > 0 && (
                      <optgroup label="Webhook Strategies" style={{ background: '#1a1a1a' }}>
                        {webhooks.map(webhook => (
                          <option key={webhook.token} value={webhook.token} style={{ background: '#1a1a1a' }}>
                            {webhook.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {strategyCodes.length > 0 && (
                      <optgroup label="Engine Strategies" style={{ background: '#1a1a1a' }}>
                        {strategyCodes.map(code => (
                          <option key={code.id} value={code.id.toString()} style={{ background: '#1a1a1a' }}>
                            {code.name} {code.is_premium && '⭐'}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </Select>
                  {errors.strategy && <Text fontSize="xs" color="red.300" mt={1}>{errors.strategy}</Text>}
                </Box>

                <Box width="full">
                  <Text fontSize="sm" mb={2} color="whiteAlpha.700">Ticker</Text>
                  <Select
                    value={formData.singleAccount.ticker}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      singleAccount: { ...prev.singleAccount, ticker: e.target.value }
                    }))}
                    bg="whiteAlpha.100"
                    border="1px solid"
                    borderColor={errors.ticker ? "red.300" : "whiteAlpha.300"}
                    _hover={{ borderColor: 'whiteAlpha.400' }}
                    _focus={{ borderColor: 'rgba(0, 198, 224, 0.6)', boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.6)' }}
                    isDisabled={!!strategy}
                  >
                    {Object.entries(displayTickers).map(([symbol, name]) => (
                      <option key={symbol} value={symbol} style={{ background: '#1a1a1a' }}>
                        {symbol} - {name}
                      </option>
                    ))}
                  </Select>
                  {errors.ticker && <Text fontSize="xs" color="red.300" mt={1}>{errors.ticker}</Text>}
                </Box>

                <Box width="full">
                  <Text fontSize="sm" mb={2} color="whiteAlpha.700">Account</Text>
                  <Select
                    value={formData.singleAccount.accountId}
                    onChange={(e) => handleAccountChange(e.target.value)}
                    bg="whiteAlpha.100"
                    border="1px solid"
                    borderColor={errors.account ? "red.300" : "whiteAlpha.300"}
                    _hover={{ borderColor: 'whiteAlpha.400' }}
                    _focus={{ borderColor: 'rgba(0, 198, 224, 0.6)', boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.6)' }}
                    isDisabled={!!strategy}
                  >
                    <option value="" style={{ background: '#1a1a1a' }}>Select Account</option>
                    {accounts.map(account => {
                      const broker = getBrokerInfo(account.broker_id);
                      return (
                        <option key={account.account_id} value={account.account_id} style={{ background: '#1a1a1a' }}>
                          {account.display_name} ({broker.name})
                        </option>
                      );
                    })}
                  </Select>
                  {errors.account && <Text fontSize="xs" color="red.300" mt={1}>{errors.account}</Text>}
                </Box>

                <Box width="full">
                  <Text fontSize="sm" mb={2} color="whiteAlpha.700">Quantity</Text>
                  <NumberInput
                    value={formData.singleAccount.quantity}
                    onChange={(valueString) => setFormData(prev => ({
                      ...prev,
                      singleAccount: { ...prev.singleAccount, quantity: parseInt(valueString) || 1 }
                    }))}
                    min={1}
                  >
                    <NumberInputField
                      bg="whiteAlpha.100"
                      border="1px solid"
                      borderColor={errors.quantity ? "red.300" : "whiteAlpha.300"}
                      _hover={{ borderColor: 'whiteAlpha.400' }}
                      _focus={{ borderColor: 'rgba(0, 198, 224, 0.6)', boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.6)' }}
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper color="whiteAlpha.600" />
                      <NumberDecrementStepper color="whiteAlpha.600" />
                    </NumberInputStepper>
                  </NumberInput>
                  {errors.quantity && <Text fontSize="xs" color="red.300" mt={1}>{errors.quantity}</Text>}
                </Box>
              </VStack>
            ) : (
              // Multiple Account Configuration
              <VStack spacing={4}>
                {/* Strategy, Ticker, Leader Account, Leader Quantity - same as single */}
                <Box width="full">
                  <Text fontSize="sm" mb={2} color="whiteAlpha.700">Strategy</Text>
                  <Select
                    value={formData.multipleAccount.strategyCodeId || formData.multipleAccount.webhookId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const isEngine = isEngineStrategy(value);
                      setFormData(prev => ({
                        ...prev,
                        multipleAccount: {
                          ...prev.multipleAccount,
                          webhookId: isEngine ? '' : value,
                          strategyCodeId: isEngine ? value : ''
                        }
                      }));
                    }}
                    bg="whiteAlpha.100"
                    border="1px solid"
                    borderColor={errors.strategy ? "red.300" : "whiteAlpha.300"}
                    _hover={{ borderColor: 'whiteAlpha.400' }}
                    _focus={{ borderColor: 'rgba(0, 198, 224, 0.6)', boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.6)' }}
                    isDisabled={!!strategy}
                  >
                    <option value="" style={{ background: '#1a1a1a' }}>Select Strategy</option>
                    {webhooks.length > 0 && (
                      <optgroup label="Webhook Strategies" style={{ background: '#1a1a1a' }}>
                        {webhooks.map(webhook => (
                          <option key={webhook.token} value={webhook.token} style={{ background: '#1a1a1a' }}>
                            {webhook.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {strategyCodes.length > 0 && (
                      <optgroup label="Engine Strategies" style={{ background: '#1a1a1a' }}>
                        {strategyCodes.map(code => (
                          <option key={code.id} value={code.id.toString()} style={{ background: '#1a1a1a' }}>
                            {code.name} {code.is_premium && '⭐'}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </Select>
                  {errors.strategy && <Text fontSize="xs" color="red.300" mt={1}>{errors.strategy}</Text>}
                </Box>

                <Box width="full">
                  <Text fontSize="sm" mb={2} color="whiteAlpha.700">Ticker</Text>
                  <Select
                    value={formData.multipleAccount.ticker}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      multipleAccount: { ...prev.multipleAccount, ticker: e.target.value }
                    }))}
                    bg="whiteAlpha.100"
                    border="1px solid"
                    borderColor={errors.ticker ? "red.300" : "whiteAlpha.300"}
                    _hover={{ borderColor: 'whiteAlpha.400' }}
                    _focus={{ borderColor: 'rgba(0, 198, 224, 0.6)', boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.6)' }}
                    isDisabled={!!strategy}
                  >
                    {Object.entries(displayTickers).map(([symbol, name]) => (
                      <option key={symbol} value={symbol} style={{ background: '#1a1a1a' }}>
                        {symbol} - {name}
                      </option>
                    ))}
                  </Select>
                  {errors.ticker && <Text fontSize="xs" color="red.300" mt={1}>{errors.ticker}</Text>}
                </Box>

                <Box width="full">
                  <Text fontSize="sm" mb={2} color="whiteAlpha.700">Leader Account</Text>
                  <Select
                    value={formData.multipleAccount.leaderAccountId}
                    onChange={(e) => handleLeaderAccountChange(e.target.value)}
                    bg="whiteAlpha.100"
                    border="1px solid"
                    borderColor={errors.leaderAccount ? "red.300" : "whiteAlpha.300"}
                    _hover={{ borderColor: 'whiteAlpha.400' }}
                    _focus={{ borderColor: 'rgba(0, 198, 224, 0.6)', boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.6)' }}
                    isDisabled={!!strategy}
                  >
                    <option value="" style={{ background: '#1a1a1a' }}>Select Leader Account</option>
                    {accounts.map(account => {
                      const broker = getBrokerInfo(account.broker_id);
                      return (
                        <option key={account.account_id} value={account.account_id} style={{ background: '#1a1a1a' }}>
                          {account.display_name} ({broker.name})
                        </option>
                      );
                    })}
                  </Select>
                  {errors.leaderAccount && <Text fontSize="xs" color="red.300" mt={1}>{errors.leaderAccount}</Text>}
                </Box>

                <Box width="full">
                  <Text fontSize="sm" mb={2} color="whiteAlpha.700">Leader Quantity</Text>
                  <NumberInput
                    value={formData.multipleAccount.leaderQuantity}
                    onChange={(valueString) => setFormData(prev => ({
                      ...prev,
                      multipleAccount: { ...prev.multipleAccount, leaderQuantity: parseInt(valueString) || 1 }
                    }))}
                    min={1}
                  >
                    <NumberInputField
                      bg="whiteAlpha.100"
                      border="1px solid"
                      borderColor={errors.leaderQuantity ? "red.300" : "whiteAlpha.300"}
                      _hover={{ borderColor: 'whiteAlpha.400' }}
                      _focus={{ borderColor: 'rgba(0, 198, 224, 0.6)', boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.6)' }}
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper color="whiteAlpha.600" />
                      <NumberDecrementStepper color="whiteAlpha.600" />
                    </NumberInputStepper>
                  </NumberInput>
                  {errors.leaderQuantity && <Text fontSize="xs" color="red.300" mt={1}>{errors.leaderQuantity}</Text>}
                </Box>

                <Divider borderColor="whiteAlpha.200" />

                <Box width="full">
                  <HStack justify="space-between" mb={3}>
                    <Text fontSize="sm" color="whiteAlpha.700">Follower Accounts</Text>
                    <Button
                      size="sm"
                      leftIcon={<Plus size={16} />}
                      onClick={addFollowerAccount}
                      variant="ghost"
                      color="white"
                      _hover={{ bg: 'whiteAlpha.200' }}
                      isDisabled={!!strategy && formData.multipleAccount.followerAccounts.length > 0}
                    >
                      Add Follower
                    </Button>
                  </HStack>

                  {formData.multipleAccount.followerAccounts.length === 0 ? (
                    <Box
                      p={4}
                      borderRadius="md"
                      border="1px dashed"
                      borderColor="whiteAlpha.300"
                      textAlign="center"
                    >
                      <Text fontSize="sm" color="whiteAlpha.500">
                        No follower accounts added
                      </Text>
                    </Box>
                  ) : (
                    <VStack spacing={3}>
                      {formData.multipleAccount.followerAccounts.map((follower, index) => (
                        <HStack key={index} width="full" spacing={2}>
                          <Select
                            value={follower.accountId}
                            onChange={(e) => updateFollowerAccount(index, 'accountId', e.target.value)}
                            bg="whiteAlpha.100"
                            border="1px solid"
                            borderColor="whiteAlpha.300"
                            _hover={{ borderColor: 'whiteAlpha.400' }}
                            _focus={{ borderColor: 'rgba(0, 198, 224, 0.6)', boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.6)' }}
                            flex={2}
                            isDisabled={!!strategy}
                          >
                            <option value="" style={{ background: '#1a1a1a' }}>Select Account</option>
                            {accounts
                              .filter(acc =>
                                acc.account_id !== formData.multipleAccount.leaderAccountId &&
                                !formData.multipleAccount.followerAccounts.some((f, i) => i !== index && f.accountId === acc.account_id)
                              )
                              .map(account => {
                                const broker = getBrokerInfo(account.broker_id);
                                return (
                                  <option key={account.account_id} value={account.account_id} style={{ background: '#1a1a1a' }}>
                                    {account.display_name} ({broker.name})
                                  </option>
                                );
                              })}
                          </Select>
                          <NumberInput
                            value={follower.quantity}
                            onChange={(valueString) => updateFollowerAccount(index, 'quantity', parseInt(valueString) || 1)}
                            min={1}
                            flex={1}
                          >
                            <NumberInputField
                              bg="whiteAlpha.100"
                              border="1px solid"
                              borderColor="whiteAlpha.300"
                              _hover={{ borderColor: 'whiteAlpha.400' }}
                              _focus={{ borderColor: 'rgba(0, 198, 224, 0.6)', boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.6)' }}
                            />
                            <NumberInputStepper>
                              <NumberIncrementStepper color="whiteAlpha.600" />
                              <NumberDecrementStepper color="whiteAlpha.600" />
                            </NumberInputStepper>
                          </NumberInput>
                          <Button
                            size="sm"
                            variant="ghost"
                            color="red.300"
                            onClick={() => removeFollowerAccount(index)}
                            _hover={{ bg: 'whiteAlpha.200', color: 'red.400' }}
                            p={1}
                            isDisabled={!!strategy}
                          >
                            <Minus size={16} />
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                  {errors.followers && <Text fontSize="xs" color="red.300" mt={2}>{errors.followers}</Text>}
                </Box>

                <Box width="full">
                  <Text fontSize="sm" mb={2} color="whiteAlpha.700">Group Name (Optional)</Text>
                  <Input
                    value={formData.multipleAccount.groupName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      multipleAccount: { ...prev.multipleAccount, groupName: e.target.value }
                    }))}
                    placeholder="e.g., Conservative Group"
                    bg="whiteAlpha.100"
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    _hover={{ borderColor: 'whiteAlpha.400' }}
                    _focus={{ borderColor: 'rgba(0, 198, 224, 0.6)', boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.6)' }}
                  />
                </Box>
              </VStack>
            )}

            {/* Market Schedule Section */}
            <Box width="full" borderTop="1px solid" borderColor="whiteAlpha.200" pt={4}>
              <HStack justify="space-between" align="center" mb={3}>
                <HStack spacing={2}>
                  <Clock size={16} color="rgba(0, 198, 224, 1)" />
                  <Text fontSize="sm" fontWeight="medium" color="whiteAlpha.900">
                    Market Schedule
                  </Text>
                  <Badge colorScheme={enableSchedule ? "green" : "gray"} fontSize="xs">
                    {enableSchedule ? "Auto" : "Manual"}
                  </Badge>
                </HStack>
                <Switch
                  isChecked={enableSchedule}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    console.log('Schedule toggle changed to:', newValue);
                    setEnableSchedule(newValue);
                    if (!newValue) {
                      console.log('Schedule disabled - clearing markets');
                      setSelectedMarkets([]);
                    }
                  }}
                  colorScheme="cyan"
                  size="sm"
                />
              </HStack>

              <Collapse in={enableSchedule} animateOpacity>
                <VStack spacing={3} align="stretch">
                  <Text fontSize="xs" color="whiteAlpha.600">
                    Strategy will automatically activate/deactivate based on selected market hours
                  </Text>
                  <CheckboxGroup value={selectedMarkets} onChange={(values) => {
                    console.log('Markets selected:', values);
                    setSelectedMarkets(values);
                  }}>
                    <VStack align="start" spacing={2}>
                      {availableMarkets.map((market) => (
                        <Checkbox
                          key={market.value}
                          value={market.value}
                          colorScheme="cyan"
                          size="sm"
                        >
                          <Text fontSize="xs" color="whiteAlpha.800">{market.label}</Text>
                        </Checkbox>
                      ))}
                    </VStack>
                  </CheckboxGroup>
                  {enableSchedule && selectedMarkets.length === 0 && (
                    <Alert status="warning" variant="subtle" borderRadius="md" size="sm">
                      <AlertIcon />
                      <Text fontSize="xs">Please select at least one market schedule</Text>
                    </Alert>
                  )}
                  <Text fontSize="xs" color="whiteAlpha.500" fontStyle="italic">
                    Current state at save: Schedule {enableSchedule ? 'enabled' : 'disabled'} with {selectedMarkets.length} markets selected
                  </Text>
                </VStack>
              </Collapse>
            </Box>

            {/* Engine-specific fields */}
            {(isEngineStrategy(formData.selectedType === 'single'
              ? (formData.singleAccount.strategyCodeId || formData.singleAccount.webhookId)
              : (formData.multipleAccount.strategyCodeId || formData.multipleAccount.webhookId))) && (
              <>
                <Divider borderColor="whiteAlpha.200" />
                <Box width="full">
                  <Text fontSize="sm" mb={2} color="whiteAlpha.700">Description (Optional)</Text>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Strategy description..."
                    bg="whiteAlpha.100"
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    _hover={{ borderColor: 'whiteAlpha.400' }}
                    _focus={{ borderColor: 'rgba(0, 198, 224, 0.6)', boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.6)' }}
                  />
                </Box>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="whiteAlpha.700">Active on Creation</Text>
                  <Switch
                    isChecked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    colorScheme="green"
                  />
                </HStack>
              </>
            )}

            <Divider borderColor="whiteAlpha.200" />

            <Button
              width="full"
              bg="linear-gradient(135deg, rgba(0, 198, 224, 0.8), rgba(0, 140, 255, 0.8))"
              color="white"
              size="lg"
              onClick={handleSubmit}
              isLoading={isCreating || isUpdating}
              loadingText={strategy ? "Updating..." : "Activating..."}
              _hover={{
                bg: "linear-gradient(135deg, rgba(0, 198, 224, 1), rgba(0, 140, 255, 1))",
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              }}
              _active={{ transform: 'translateY(0)' }}
              borderRadius="lg"
            >
              {strategy ? 'Update Strategy' : 'Activate Strategy'}
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>

    {/* Removed Confirmation Modal - no longer needed with unified API that properly handles updates */}
    </>
  );
};

export default ActivateStrategyModal;