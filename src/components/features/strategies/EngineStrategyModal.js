import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  Input,
  VStack,
  HStack,
  Text,
  Textarea,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Box,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { Settings, Activity } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';

const EngineStrategyModal = ({
  isOpen,
  onClose,
  onSave,
  strategy,
  strategyCodes
}) => {
  const [formData, setFormData] = useState({
    strategy_code_id: '',
    ticker: '',
    strategy_type: 'single',
    account_id: '',
    quantity: 1,
    leader_account_id: '',
    leader_quantity: 1,
    follower_account_ids: [],
    follower_quantities: [],
    group_name: '',
    description: '',
    is_active: true,
    // Risk management
    stop_loss_percent: '',
    take_profit_percent: '',
    max_daily_loss: '',
    max_position_size: '',
  });
  
  const [accounts, setAccounts] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
      if (strategy) {
        // Populate form with existing strategy data
        setFormData({
          strategy_code_id: strategy.strategy_code_id || '',
          ticker: strategy.ticker || '',
          strategy_type: strategy.strategy_type || 'single',
          account_id: strategy.account_id || '',
          quantity: strategy.quantity || 1,
          leader_account_id: strategy.leader_account_id || '',
          leader_quantity: strategy.leader_quantity || 1,
          follower_account_ids: strategy.follower_accounts?.map(f => f.account_id) || [],
          follower_quantities: strategy.follower_accounts?.map(f => f.quantity) || [],
          group_name: strategy.group_name || '',
          description: strategy.description || '',
          is_active: strategy.is_active !== undefined ? strategy.is_active : true,
          stop_loss_percent: strategy.stop_loss_percent || '',
          take_profit_percent: strategy.take_profit_percent || '',
          max_daily_loss: strategy.max_daily_loss || '',
          max_position_size: strategy.max_position_size || '',
        });
      } else {
        // Reset form for new strategy
        setFormData({
          strategy_code_id: '',
          ticker: '',
          strategy_type: 'single',
          account_id: '',
          quantity: 1,
          leader_account_id: '',
          leader_quantity: 1,
          follower_account_ids: [],
          follower_quantities: [],
          group_name: '',
          description: '',
          is_active: true,
          stop_loss_percent: '',
          take_profit_percent: '',
          max_daily_loss: '',
          max_position_size: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, strategy]);

  const fetchAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const response = await axiosInstance.get('/api/v1/brokers/accounts');
      setAccounts(response.data.filter(account => account.is_active));
    } catch (error) {
      toast({
        title: "Error fetching accounts",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.strategy_code_id) {
      newErrors.strategy_code_id = 'Strategy code is required';
    }

    if (!formData.ticker) {
      newErrors.ticker = 'Ticker symbol is required';
    }

    if (formData.strategy_type === 'single') {
      if (!formData.account_id) {
        newErrors.account_id = 'Account is required';
      }
      if (!formData.quantity || formData.quantity <= 0) {
        newErrors.quantity = 'Quantity must be greater than 0';
      }
    } else if (formData.strategy_type === 'multiple') {
      if (!formData.leader_account_id) {
        newErrors.leader_account_id = 'Leader account is required';
      }
      if (!formData.leader_quantity || formData.leader_quantity <= 0) {
        newErrors.leader_quantity = 'Leader quantity must be greater than 0';
      }
      if (formData.follower_account_ids.length === 0) {
        newErrors.follower_account_ids = 'At least one follower account is required';
      }
      if (!formData.group_name) {
        newErrors.group_name = 'Group name is required for multiple strategies';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsLoading(false);
    }
  };

  const selectedStrategyCode = strategyCodes.find(code => code.id === parseInt(formData.strategy_code_id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader>
          <HStack spacing={3}>
            <Box p={2} bg="purple.500" borderRadius="md">
              <Activity size={20} />
            </Box>
            <Text>
              {strategy ? 'Edit Engine Strategy' : 'Configure Engine Strategy'}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* Strategy Code Selection */}
              <FormControl isInvalid={errors.strategy_code_id}>
                <FormLabel>Strategy Code</FormLabel>
                <Select
                  value={formData.strategy_code_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, strategy_code_id: e.target.value }))}
                  placeholder="Select a strategy code"
                  bg="whiteAlpha.100"
                >
                  {strategyCodes.filter(code => code.is_active).map(code => (
                    <option key={code.id} value={code.id} style={{ background: '#2D3748', color: 'white' }}>
                      {code.name} {code.is_validated && '✓'}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.strategy_code_id}</FormErrorMessage>
                {selectedStrategyCode && (
                  <Box mt={2} p={2} bg="whiteAlpha.100" borderRadius="md">
                    <HStack spacing={2}>
                      <Badge colorScheme={selectedStrategyCode.is_validated ? 'green' : 'orange'}>
                        {selectedStrategyCode.is_validated ? 'Validated' : 'Not Validated'}
                      </Badge>
                      <Badge colorScheme={selectedStrategyCode.is_active ? 'green' : 'red'}>
                        {selectedStrategyCode.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </HStack>
                    {selectedStrategyCode.description && (
                      <Text fontSize="sm" color="whiteAlpha.700" mt={1}>
                        {selectedStrategyCode.description}
                      </Text>
                    )}
                    {selectedStrategyCode.symbols_list && selectedStrategyCode.symbols_list.length > 0 && (
                      <Text fontSize="sm" color="whiteAlpha.600" mt={1}>
                        Supported symbols: {selectedStrategyCode.symbols_list.join(', ')}
                      </Text>
                    )}
                  </Box>
                )}
              </FormControl>

              {/* Basic Configuration */}
              <HStack spacing={4}>
                <FormControl isInvalid={errors.ticker} flex={1}>
                  <FormLabel>Ticker Symbol</FormLabel>
                  <Input
                    value={formData.ticker}
                    onChange={(e) => setFormData(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))}
                    placeholder="e.g., ES, MES, NQ"
                    bg="whiteAlpha.100"
                  />
                  <FormErrorMessage>{errors.ticker}</FormErrorMessage>
                </FormControl>

                <FormControl flex={1}>
                  <FormLabel>Strategy Type</FormLabel>
                  <Select
                    value={formData.strategy_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, strategy_type: e.target.value }))}
                    bg="whiteAlpha.100"
                  >
                    <option value="single" style={{ background: '#2D3748', color: 'white' }}>Single Account</option>
                    <option value="multiple" style={{ background: '#2D3748', color: 'white' }}>Multiple Accounts</option>
                  </Select>
                </FormControl>
              </HStack>

              {/* Single Account Configuration */}
              {formData.strategy_type === 'single' && (
                <HStack spacing={4}>
                  <FormControl isInvalid={errors.account_id} flex={2}>
                    <FormLabel>Trading Account</FormLabel>
                    <Select
                      value={formData.account_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                      placeholder="Select account"
                      bg="whiteAlpha.100"
                      isDisabled={isLoadingAccounts}
                    >
                      {accounts.map(account => (
                        <option key={account.account_id} value={account.account_id} style={{ background: '#2D3748', color: 'white' }}>
                          {account.account_id} ({account.broker_id})
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage>{errors.account_id}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={errors.quantity} flex={1}>
                    <FormLabel>Quantity</FormLabel>
                    <NumberInput
                      value={formData.quantity}
                      onChange={(value) => setFormData(prev => ({ ...prev, quantity: parseInt(value) || 1 }))}
                      min={1}
                    >
                      <NumberInputField bg="whiteAlpha.100" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormErrorMessage>{errors.quantity}</FormErrorMessage>
                  </FormControl>
                </HStack>
              )}

              {/* Multiple Account Configuration */}
              {formData.strategy_type === 'multiple' && (
                <VStack spacing={4} align="stretch">
                  <FormControl isInvalid={errors.group_name}>
                    <FormLabel>Group Name</FormLabel>
                    <Input
                      value={formData.group_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, group_name: e.target.value }))}
                      placeholder="Strategy group name"
                      bg="whiteAlpha.100"
                    />
                    <FormErrorMessage>{errors.group_name}</FormErrorMessage>
                  </FormControl>

                  <HStack spacing={4}>
                    <FormControl isInvalid={errors.leader_account_id} flex={2}>
                      <FormLabel>Leader Account</FormLabel>
                      <Select
                        value={formData.leader_account_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, leader_account_id: e.target.value }))}
                        placeholder="Select leader account"
                        bg="whiteAlpha.100"
                      >
                        {accounts.map(account => (
                          <option key={account.account_id} value={account.account_id} style={{ background: '#2D3748', color: 'white' }}>
                            {account.account_id} ({account.broker_id})
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>{errors.leader_account_id}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={errors.leader_quantity} flex={1}>
                      <FormLabel>Leader Quantity</FormLabel>
                      <NumberInput
                        value={formData.leader_quantity}
                        onChange={(value) => setFormData(prev => ({ ...prev, leader_quantity: parseInt(value) || 1 }))}
                        min={1}
                      >
                        <NumberInputField bg="whiteAlpha.100" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <FormErrorMessage>{errors.leader_quantity}</FormErrorMessage>
                    </FormControl>
                  </HStack>
                </VStack>
              )}

              {/* Risk Management */}
              <Box>
                <Text fontSize="lg" fontWeight="semibold" mb={3} color="orange.300">
                  <Settings size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Risk Management
                </Text>
                
                <VStack spacing={3} align="stretch">
                  <HStack spacing={4}>
                    <FormControl flex={1}>
                      <FormLabel fontSize="sm">Stop Loss %</FormLabel>
                      <NumberInput
                        value={formData.stop_loss_percent}
                        onChange={(value) => setFormData(prev => ({ ...prev, stop_loss_percent: value }))}
                        min={0}
                        max={100}
                        precision={2}
                      >
                        <NumberInputField bg="whiteAlpha.100" placeholder="0.00" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl flex={1}>
                      <FormLabel fontSize="sm">Take Profit %</FormLabel>
                      <NumberInput
                        value={formData.take_profit_percent}
                        onChange={(value) => setFormData(prev => ({ ...prev, take_profit_percent: value }))}
                        min={0}
                        precision={2}
                      >
                        <NumberInputField bg="whiteAlpha.100" placeholder="0.00" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </HStack>

                  <HStack spacing={4}>
                    <FormControl flex={1}>
                      <FormLabel fontSize="sm">Max Daily Loss</FormLabel>
                      <NumberInput
                        value={formData.max_daily_loss}
                        onChange={(value) => setFormData(prev => ({ ...prev, max_daily_loss: value }))}
                        min={0}
                        precision={2}
                      >
                        <NumberInputField bg="whiteAlpha.100" placeholder="0.00" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl flex={1}>
                      <FormLabel fontSize="sm">Max Position Size</FormLabel>
                      <NumberInput
                        value={formData.max_position_size}
                        onChange={(value) => setFormData(prev => ({ ...prev, max_position_size: value }))}
                        min={1}
                      >
                        <NumberInputField bg="whiteAlpha.100" placeholder="0" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </HStack>
                </VStack>
              </Box>

              {/* Description */}
              <FormControl>
                <FormLabel>Description (Optional)</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Strategy description..."
                  bg="whiteAlpha.100"
                  rows={3}
                />
              </FormControl>

              {/* Active Toggle */}
              <FormControl>
                <HStack justify="space-between">
                  <FormLabel mb={0}>Strategy Active</FormLabel>
                  <Switch
                    isChecked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    colorScheme="green"
                  />
                </HStack>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isLoading}
              loadingText={strategy ? "Updating..." : "Configuring..."}
            >
              {strategy ? 'Update Strategy' : 'Configure Strategy'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default EngineStrategyModal;