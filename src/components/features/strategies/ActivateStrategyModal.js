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
import { Plus, Minus } from 'lucide-react';
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

const ActivateStrategyModal = ({ isOpen, onClose, onSubmit, strategy = null }) => {
  // State management with separate validation states
  const [formData, setFormData] = useState({
    selectedType: 'single',
    singleAccount: {
      accountId: '',
      quantity: 1,
      ticker: '',
      webhookId: ''
    },
    multipleAccount: {
      leaderAccountId: '',
      leaderQuantity: 1,
      followerAccounts: [], // Array of {accountId: string, quantity: number}
      ticker: '',
      webhookId: '',
      groupName: ''
    }
  });
  
  const [accounts, setAccounts] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChangeType, setPendingChangeType] = useState(null);
  const { createStrategy, isCreating, createStrategyError, updateStrategy, isUpdating, updateStrategyError, deleteStrategy, isDeleting } = useStrategies();
  const toast = useToast();

  const displayTickers = getDisplayTickers();

  // Form validation functions
  const validateSingleAccount = () => {
    const { accountId, ticker, webhookId } = formData.singleAccount;
    return Boolean(accountId && ticker && webhookId);
  };

  const validateMultipleAccount = () => {
    const { 
      leaderAccountId, 
      followerAccounts, 
      ticker, 
      webhookId, 
      groupName 
    } = formData.multipleAccount;

    return Boolean(
      leaderAccountId && 
      followerAccounts.length > 0 && 
      ticker && 
      webhookId && 
      groupName &&
      followerAccounts.every(follower => 
        follower.accountId && follower.quantity > 0
      )
    );
  };

  const isFormValid = () => {
    return formData.selectedType === 'single' 
      ? validateSingleAccount() 
      : validateMultipleAccount();
  };

  // Data fetching effect
  useEffect(() => {
    if (isOpen) {
      // Reset confirmation state when modal opens
      setShowConfirmation(false);
      setPendingChangeType(null);
      
      const fetchData = async () => {
        try {
          console.log('Fetching accounts and webhooks...');
          const [accountsResponse, webhooksResponse] = await Promise.all([
            axiosInstance.get('/api/v1/brokers/accounts'),
            webhookApi.getAllAvailableWebhooks()
          ]);

          console.log('Raw accounts response:', accountsResponse);
          const accountsData = accountsResponse?.data || [];
          setAccounts(accountsData);
          setWebhooks(webhooksResponse);


          // Set initial webhook if available
          if (webhooksResponse.length > 0) {
            const initialWebhookId = webhooksResponse[0].token;
            setFormData(prev => ({
              ...prev,
              singleAccount: { ...prev.singleAccount, webhookId: initialWebhookId },
              multipleAccount: { ...prev.multipleAccount, webhookId: initialWebhookId }
            }));
          }

          // If editing existing strategy, populate form
          if (strategy) {
            if (strategy.strategy_type === 'single') {
              setFormData(prev => ({
                selectedType: 'single',
                singleAccount: {
                  accountId: strategy.account_id || '',
                  quantity: strategy.quantity || 1,
                  ticker: strategy.ticker || '',
                  webhookId: strategy.webhook_id
                },
                multipleAccount: prev.multipleAccount
              }));
            } else {
              const followerAccountsData = strategy.follower_account_ids?.map((accountId, index) => ({
                accountId,
                quantity: strategy.follower_quantities?.[index] || 1
              })) || [];

              setFormData(prev => ({
                selectedType: 'multiple',
                singleAccount: prev.singleAccount,
                multipleAccount: {
                  leaderAccountId: strategy.leader_account_id || '',
                  leaderQuantity: strategy.leader_quantity || 1,
                  followerAccounts: followerAccountsData,
                  ticker: strategy.ticker || '',
                  webhookId: strategy.webhook_id,
                  groupName: strategy.group_name || ''
                }
              }));
            }
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
          quantity: Number(formData.singleAccount.quantity)
        }
      : {
          ticker: formData.multipleAccount.ticker,
          leader_account_id: formData.multipleAccount.leaderAccountId,
          webhook_id: formData.multipleAccount.webhookId,
          leader_quantity: Number(formData.multipleAccount.leaderQuantity),
          follower_account_ids: formData.multipleAccount.followerAccounts.map(f => f.accountId),
          follower_quantities: formData.multipleAccount.followerAccounts.map(f => Number(f.quantity)),
          group_name: formData.multipleAccount.groupName
        };

    // Check for core field changes that require delete + recreate
    const coreFieldsChanged = 
      currentData.ticker !== strategy.ticker ||
      currentData.webhook_id !== strategy.webhook_id ||
      (strategy.strategy_type === 'single' && currentData.account_id !== strategy.account_id) ||
      (strategy.strategy_type === 'multiple' && currentData.leader_account_id !== strategy.leader_account_id) ||
      (strategy.strategy_type === 'multiple' && 
        JSON.stringify(currentData.follower_account_ids.sort()) !== JSON.stringify(strategy.follower_account_ids?.sort() || []));

    if (coreFieldsChanged) {
      return 'recreate';
    }

    // Check for simple updates (quantities, group name, active status)
    const quantitiesChanged = 
      (strategy.strategy_type === 'single' && currentData.quantity !== strategy.quantity) ||
      (strategy.strategy_type === 'multiple' && 
        (currentData.leader_quantity !== strategy.leader_quantity ||
         JSON.stringify(currentData.follower_quantities) !== JSON.stringify(strategy.follower_quantities || []))) ||
      (strategy.strategy_type === 'multiple' && currentData.group_name !== strategy.group_name);

    return quantitiesChanged ? 'update' : 'nochange';
  };

  // Handle confirmed recreate operation
  const handleConfirmedRecreate = async () => {
    try {
      setShowConfirmation(false);
      
      // First delete the existing strategy
      await deleteStrategy(strategy.id);
      
      // Then create the new strategy with updated data
      const strategyData = formData.selectedType === 'single' 
        ? {
            strategy_type: 'single',
            webhook_id: formData.singleAccount.webhookId,
            ticker: formData.singleAccount.ticker,
            account_id: formData.singleAccount.accountId,
            quantity: Number(formData.singleAccount.quantity)
          }
        : {
            strategy_type: 'multiple',
            webhook_id: formData.multipleAccount.webhookId,
            ticker: formData.multipleAccount.ticker,
            leader_account_id: formData.multipleAccount.leaderAccountId,
            leader_quantity: Number(formData.multipleAccount.leaderQuantity),
            group_name: formData.multipleAccount.groupName,
            follower_account_ids: formData.multipleAccount.followerAccounts.map(f => f.accountId),
            follower_quantities: formData.multipleAccount.followerAccounts.map(f => Number(f.quantity))
          };

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
        // For updates, only send the fields that can be updated
        const updateData = formData.selectedType === 'single' 
          ? {
              quantity: Number(formData.singleAccount.quantity),
              is_active: true
            }
          : {
              leader_quantity: Number(formData.multipleAccount.leaderQuantity),
              follower_quantities: formData.multipleAccount.followerAccounts.map(f => Number(f.quantity)),
              is_active: true
            };

        await updateStrategy({ 
          strategyId: strategy.id, 
          updateData 
        });
        
      } else if (changeType === 'recreate') {
        // Show confirmation modal for core field changes
        setPendingChangeType('recreate');
        setShowConfirmation(true);
        return; // Don't close the modal yet
        
      } else {
        // For creation, send all required fields
        const strategyData = formData.selectedType === 'single' 
          ? {
              strategy_type: 'single',
              webhook_id: formData.singleAccount.webhookId,
              ticker: formData.singleAccount.ticker, // Let backend convert to display ticker
              account_id: formData.singleAccount.accountId,
              quantity: Number(formData.singleAccount.quantity)
            }
          : {
              strategy_type: 'multiple',
              webhook_id: formData.multipleAccount.webhookId,
              ticker: formData.multipleAccount.ticker, // Let backend convert to display ticker
              leader_account_id: formData.multipleAccount.leaderAccountId,
              leader_quantity: Number(formData.multipleAccount.leaderQuantity),
              group_name: formData.multipleAccount.groupName,
              follower_account_ids: formData.multipleAccount.followerAccounts.map(f => f.accountId),
              follower_quantities: formData.multipleAccount.followerAccounts.map(f => Number(f.quantity))
            };

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
   
            <Select
              {...selectStyles}
              value={formData.selectedType === 'single' 
                ? formData.singleAccount.webhookId 
                : formData.multipleAccount.webhookId}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                singleAccount: {
                  ...prev.singleAccount,
                  webhookId: e.target.value
                },
                multipleAccount: {
                  ...prev.multipleAccount,
                  webhookId: e.target.value
                }
              }))}
              placeholder="Select Webhook"
            >
              {webhooks.map(webhook => (
                <option key={webhook.token} value={webhook.token}>
                  {webhook.name || webhook.token}
                </option>
              ))}
            </Select>
   
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
    <Modal isOpen={showConfirmation} onClose={() => setShowConfirmation(false)} isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent 
        bg="rgba(26, 32, 44, 0.95)"
        borderColor="rgba(255, 255, 255, 0.18)"
        borderWidth={1}
        boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
        backdropFilter="blur(20px)"
        maxW="md"
      >
        <ModalHeader color="white" pb={2}>
          ⚠️ Replace Strategy?
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Text color="whiteAlpha.900" fontSize="sm">
              You've changed core fields (ticker, account, or webhook). This requires creating a new strategy to maintain data integrity.
            </Text>
            
            <Box 
              bg="rgba(255, 193, 7, 0.1)" 
              border="1px solid rgba(255, 193, 7, 0.3)"
              borderRadius="md" 
              p={3}
            >
              <Text color="yellow.200" fontSize="xs" fontWeight="medium">
                Your current strategy will be replaced with the new settings. This action cannot be undone.
              </Text>
            </Box>

            <HStack spacing={3} pt={2}>
              <Button
                flex={1}
                variant="ghost"
                onClick={() => setShowConfirmation(false)}
                color="whiteAlpha.700"
                _hover={{ bg: 'whiteAlpha.100' }}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                colorScheme="orange"
                onClick={handleConfirmedRecreate}
                isLoading={isDeleting || isCreating}
                loadingText="Replacing..."
                _hover={{ bg: 'orange.500' }}
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