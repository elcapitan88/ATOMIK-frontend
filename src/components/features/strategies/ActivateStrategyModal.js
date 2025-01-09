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
  Select,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Input,
  useToast,
  Divider,
  Alert,
  AlertIcon,
  ModalCloseButton,
} from '@chakra-ui/react';
import axiosInstance from '@/services/axiosConfig';
import { useStrategies } from '@/hooks/useStrategies';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';



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

const StrategyFormInput = ({ label, children, mb = 2 }) => (
  <Box mb={mb} width="full">
    <Text mb={1} fontSize="sm" fontWeight="medium" color="whiteAlpha.900">
      {label}
    </Text>
    {children}
  </Box>
);

const ActivateStrategyModal = ({ isOpen, onClose, onSubmit, strategy = null }) => {
  const [formData, setFormData] = useState({
    selectedType: 'single',
    selectedAccount: '',
    selectedLeaderAccount: '',
    selectedFollowerAccounts: [],
    selectedWebhook: '',
    quantity: 1,
    leaderQuantity: 1,
    followerQuantity: 1,
    selectedTicker: '',
    groupName: ''
  });
  
  const [accounts, setAccounts] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const { createStrategy, isCreating, createStrategyError } = useStrategies();
  const toast = useToast();

  const tickers = ['ESZ4', 'NQZ4', 'MNQ24', 'MESZ4']; // Your available tickers

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          console.log('Fetching accounts and webhooks...');
          const [accountsResponse, webhooksResponse] = await Promise.all([
            axiosInstance.get('/api/v1/brokers/tradovate/accounts'),
            webhookApi.listWebhooks()
          ]);

          // Log the raw response
          console.log('Raw accounts response:', accountsResponse);

          // Make sure we're using the data property and it's an array
          const accountsData = accountsResponse?.data || [];
          console.log('Accounts data to be set:', accountsData);

          // Set the accounts state
          setAccounts(accountsData);
          setWebhooks(webhooksResponse);

          if (webhooksResponse.length > 0) {
            setFormData(prev => ({
              ...prev,
              selectedWebhook: webhooksResponse[0].token
            }));
          }

          // If editing, populate form data
          if (strategy) {
            // ... strategy population code ...
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
  }, [isOpen, strategy, toast]);

  const handleSubmit = async () => {
    try {
        const strategyData = {
            strategy_type: formData.selectedType,
            webhook_id: formData.selectedWebhook,
            ticker: formData.selectedTicker,
            ...(formData.selectedType === 'single' 
                ? {
                    account_id: formData.selectedAccount,
                    quantity: Number(formData.quantity)
                } 
                : {
                    leader_account_id: formData.selectedLeaderAccount,
                    follower_account_ids: formData.selectedFollowerAccounts,
                    leader_quantity: Number(formData.leaderQuantity),
                    follower_quantity: Number(formData.followerQuantity),
                    group_name: formData.groupName
                }
            )
        };

        console.log('Submitting strategy data:', strategyData);
        
        // Use createStrategy instead of onSubmit
        await createStrategy(strategyData);
        onClose();
        
        // Show success message
        toast({
            title: "Strategy Created",
            description: "Strategy has been successfully activated",
            status: "success",
            duration: 3000,
            isClosable: true,
        });

        // Close modal and reset form
        onClose();
        setFormData({
            selectedType: 'single',
            selectedAccount: '',
            selectedLeaderAccount: '',
            selectedFollowerAccounts: [],
            selectedWebhook: webhooks[0]?.token || '',
            quantity: 1,
            leaderQuantity: 1,
            followerQuantity: 1,
            selectedTicker: '',
            groupName: ''
        });
        
      } catch (error) {
        console.error('Strategy submission error:', error);
        toast({
            title: "Error creating strategy",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
        });
    }
};

  const validateForm = () => {
    if (formData.selectedType === 'single') {
      return formData.selectedAccount && formData.selectedTicker && formData.selectedWebhook;
    }
    return (
      formData.selectedLeaderAccount && 
      formData.selectedFollowerAccounts.length > 0 && 
      formData.selectedTicker &&
      formData.selectedWebhook &&
      formData.groupName
    );
  };

  return (
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
          {strategy ? 'Update Strategy' : 'Create New Strategy'}
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
                onClick={() => setFormData(prev => ({ ...prev, selectedType: 'single' }))}
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
                onClick={() => setFormData(prev => ({ ...prev, selectedType: 'multiple' }))}
                _hover={{ bg: 'whiteAlpha.300' }}
                transform={formData.selectedType === 'multiple' ? 'translateY(-2px)' : 'none'}
                boxShadow={formData.selectedType === 'multiple' ? 'lg' : 'none'}
                transition="all 0.2s"
              >
                Multiple Account
              </Button>
            </HStack>
   
            <Divider borderColor="whiteAlpha.300" />
   
            {console.log('Rendering with accounts:', accounts)}
   
            {formData.selectedType === 'single' ? (
              <VStack spacing={3} align="stretch">
                <StrategyFormInput label="Trading Account">
                  <Select
                    {...selectStyles}
                    value={formData.selectedAccount}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      selectedAccount: e.target.value 
                    }))}
                    placeholder="Select Trading Account"
                  >
                    {console.log('Accounts before mapping:', accounts)}
                    {(accounts || []).map(account => {
                      console.log('Mapping account:', account);
                      return (
                        <option key={account.account_id} value={account.account_id}>
                          {account.name || account.account_id}
                        </option>
                      );
                    })}
                  </Select>
                </StrategyFormInput>
   
                <HStack spacing={6} align="flex-start">
                  <StrategyFormInput label="Quantity" flex={1}>
                    <NumberInput
                      min={1}
                      value={formData.quantity}
                      onChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        quantity: parseInt(value) 
                      }))}
                    >
                      <NumberInputField {...glassEffect} />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </StrategyFormInput>
   
                  <StrategyFormInput label="Ticker" flex={1}>
                    <Select
                      {...selectStyles}
                      value={formData.selectedTicker}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        selectedTicker: e.target.value 
                      }))}
                      placeholder="Select Ticker"
                    >
                      {tickers.map(ticker => (
                        <option key={ticker} value={ticker}>{ticker}</option>
                      ))}
                    </Select>
                  </StrategyFormInput>
                </HStack>
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                <StrategyFormInput label="Group Name">
                  <Input
                    {...glassEffect}
                    value={formData.groupName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      groupName: e.target.value
                    }))}
                    placeholder="Enter group name"
                  />
                </StrategyFormInput>
   
                <HStack spacing={4} align="flex-start">
                  <StrategyFormInput label="Leader Account" flex={2}>
                    <Select
                      {...selectStyles}
                      value={formData.selectedLeaderAccount}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        selectedLeaderAccount: e.target.value
                      }))}
                      placeholder="Select Leader Account"
                    >
                      {(accounts || []).map(account => (
                        <option key={account.account_id} value={account.account_id}>
                          {account.name || account.account_id}
                        </option>
                      ))}
                    </Select>
                  </StrategyFormInput>
   
                  <StrategyFormInput label="Leader Quantity" flex={1}>
                    <NumberInput
                      min={1}
                      value={formData.leaderQuantity}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        leaderQuantity: parseInt(value)
                      }))}
                    >
                      <NumberInputField {...glassEffect} />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </StrategyFormInput>
                </HStack>
   
                <HStack spacing={4} align="flex-start">
                  <StrategyFormInput label="Follower Accounts" flex={2}>
                    <Select
                      {...selectStyles}
                      multiple
                      value={formData.selectedFollowerAccounts}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        selectedFollowerAccounts: Array.from(e.target.selectedOptions, option => option.value)
                      }))}
                      height="100px"
                    >
                      {(accounts || [])
                        .filter(account => account.account_id !== formData.selectedLeaderAccount)
                        .map(account => (
                          <option 
                            key={account.account_id} 
                            value={account.account_id}
                          >
                            {account.name || account.account_id}
                          </option>
                        ))
                      }
                    </Select>
                  </StrategyFormInput>
   
                  <StrategyFormInput label="Follower Quantity" flex={1}>
                    <NumberInput
                      min={1}
                      value={formData.followerQuantity}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        followerQuantity: parseInt(value)
                      }))}
                    >
                      <NumberInputField {...glassEffect} />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </StrategyFormInput>
                </HStack>
   
                <StrategyFormInput label="Ticker">
                  <Select
                    {...selectStyles}
                    value={formData.selectedTicker}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      selectedTicker: e.target.value
                    }))}
                    placeholder="Select Ticker"
                  >
                    {tickers.map(ticker => (
                      <option key={ticker} value={ticker}>{ticker}</option>
                    ))}
                  </Select>
                </StrategyFormInput>
              </VStack>
            )}
   
            <StrategyFormInput label="Webhook">
              <Select
                {...selectStyles}
                value={formData.selectedWebhook}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  selectedWebhook: e.target.value 
                }))}
                placeholder="Select Webhook"
              >
                {webhooks.map(webhook => (
                  <option key={webhook.token} value={webhook.token}>
                    {webhook.name || webhook.token}
                  </option>
                ))}
              </Select>
            </StrategyFormInput>
   
            <Button
              width="full"
              colorScheme="green"
              onClick={handleSubmit}
              isLoading={isCreating}
              loadingText={strategy ? "Updating..." : "Creating..."}
              isDisabled={!validateForm()}
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
   );
};

export default ActivateStrategyModal;