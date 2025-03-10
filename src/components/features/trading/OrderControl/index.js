import React, { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  useDisclosure,
  Tooltip,
  useToast,
  Select,
  Text,
} from '@chakra-ui/react';
import { 
  ArrowBigUp, 
  AlertTriangle,
  ArrowBigDown, 
  Ban,
} from 'lucide-react';

import AccountSelection from './AccountSelection';
import OrderConfirmationModal from './OrderConfirmationModal';
import axios from '@/services/axiosConfig';

// Sample tickers - replace with your actual ticker data source
const AVAILABLE_TICKERS = ['ESH5', 'NQH5', 'RTYH5', 'CLH5', 'GCH5', 'SIH5','BITH5','BTIH5','MESH5', 'MNQH5']

const OrderControl = () => {
  // State Management
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [skipConfirmation, setSkipConfirmation] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState('');
  const [orderStatus, setOrderStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  
  // New states for handling group selection
  const [selectionType, setSelectionType] = useState('single');
  const [selectedGroupInfo, setSelectedGroupInfo] = useState(null);

  const {
    isOpen: isConfirmationOpen,
    onOpen: onConfirmationOpen,
    onClose: onConfirmationClose
  } = useDisclosure();

  // Handle account selection change
  const handleAccountSelectionChange = (accounts, type, groupInfo = null) => {
    console.log('Selection changed:', { accounts, type, groupInfo });
    setSelectedAccounts(accounts);
    setSelectionType(type);
    setSelectedGroupInfo(groupInfo);
    
    // If a group is selected, automatically set the ticker from group
    if (type === 'group' && groupInfo?.ticker) {
      setSelectedTicker(groupInfo.ticker);
    }
  };

  // Regular Order Execution
  const executeOrder = async (order) => {
    if (order.type === 'close-all') {
      await executeCloseAll(order);
      return;
    }
  
    setIsSubmitting(true);
    setOrderStatus('pending');
    setPendingOrder(order);
    
    try {
      // Check if this is a group order with group info
      if (order.groupInfo && order.groupInfo.id) {
        // Execute as a group strategy
        await axios.post(
          `/api/v1/strategies/${order.groupInfo.id}/execute`,
          {
            action: order.type  // 'buy' or 'sell'
          },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          }
        );
      } else {
        // Original single account order logic
        await axios.post(
          `/api/v1/brokers/accounts/${order.accounts[0]}/discretionary/orders`,
          {
            symbol: order.ticker,
            side: order.type,
            type: 'MARKET',
            quantity: order.quantity,
            time_in_force: 'GTC'
          },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          }
        );
      }
    
      setOrderStatus('success');
      toast({
        title: `${order.type.toUpperCase()} Order Executed`,
        description: order.groupInfo ? 
          `Successfully executed group ${order.type.toUpperCase()} for ${order.ticker}` : 
          `Successfully ${order.type === 'buy' ? 'bought' : 'sold'} ${order.quantity} ${order.ticker} contracts`,
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    
    } catch (error) {
      setOrderStatus('error');
      toast({
        title: "Order Failed",
        description: error.response?.data?.detail || "Failed to execute order",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setOrderStatus(null);
        setPendingOrder(null);
      }, 1000);
    }
  };

  // Close All Orders Execution
  const executeCloseAll = async (order) => {
    setIsSubmitting(true);
    setOrderStatus('pending');

    try {
      const response = await axios.post(
        '/api/v1/brokers/accounts/close-all',
        { account_ids: order.accounts },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      setOrderStatus('success');
      toast({
        title: "Positions Closed",
        description: "Successfully closed all positions",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });

    } catch (error) {
      setOrderStatus('error');
      toast({
        title: "Close All Failed",
        description: error.response?.data?.detail || "Failed to close positions",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setOrderStatus(null);
        setPendingOrder(null);
      }, 1000);
    }
  };

  // Order Submission Handlers
  const handleOrderSubmit = useCallback(async (orderType) => {
    // For group selection, use the group's ticker
    const orderTicker = selectionType === 'group' ? 
      selectedGroupInfo?.ticker : selectedTicker;
      
    // For quantity, use either the group's specified quantity or the input quantity
    const orderQuantity = selectionType === 'group' ? 
      (selectedGroupInfo?.quantity || quantity) : quantity;
    
    if (!orderTicker) {
      toast({
        title: "No ticker selected",
        description: "Please select a ticker first",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const order = {
      type: orderType,
      quantity: orderQuantity,
      ticker: orderTicker,
      accounts: selectedAccounts,
      timestamp: new Date().toISOString()
    };

    // Add group info if this is a group order
    if (selectionType === 'group' && selectedGroupInfo) {
      order.isGroupOrder = true;
      order.groupInfo = selectedGroupInfo;
    }

    if (skipConfirmation) {
      executeOrder(order);
    } else {
      setPendingOrder(order);
      onConfirmationOpen();
    }
  }, [quantity, selectedTicker, selectedAccounts, skipConfirmation, onConfirmationOpen, toast, selectionType, selectedGroupInfo]);

  const handleCloseAllTrades = useCallback(async () => {
    try {
        let accountsToClose;
        setIsSubmitting(true);
        
        if (selectedAccounts.length > 0) {
            accountsToClose = selectedAccounts;
        } else {
            // Fetch all connected accounts if none selected
            const response = await fetch('/api/v1/brokers/accounts', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            const data = await response.json();
            accountsToClose = data.map(account => account.account_id);
        }

        if (accountsToClose.length === 0) {
            toast({
                title: "No Connected Accounts",
                description: "No trading accounts available to close positions",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const response = await fetch('/api/v1/brokers/accounts/close-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({ account_ids: accountsToClose })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === "success") {
            toast({
                title: "Positions Closed",
                description: "Successfully closed all positions",
                status: "success",
                duration: 2000,
                isClosable: true,
            });
        }

    } catch (error) {
        console.error('Error in handleCloseAllTrades:', error);
        toast({
            title: "Error",
            description: "Failed to close positions",
            status: "error",
            duration: 4000,
            isClosable: true,
        });
    } finally {
        setIsSubmitting(false);
    }
}, [selectedAccounts, toast]);

  // Determine if buy/sell buttons should be enabled
  const isTradingDisabled = () => {
    if (isSubmitting) return true;
    
    if (selectionType === 'single') {
      return !selectedAccounts.length || !selectedTicker || quantity <= 0;
    } else if (selectionType === 'group') {
      return !selectedAccounts.length || !selectedGroupInfo || !selectedGroupInfo.ticker;
    }
    
    return true;
  };

  return (
    <Box h="full" display="flex" flexDirection="column">
      {/* Header Section */}
      <Box p={3} borderBottom="1px solid" borderColor="whiteAlpha.200">
        <HStack width="full" spacing={2}>
          <Box flex={1}>
            <AccountSelection
              selectedAccounts={selectedAccounts}
              onChange={handleAccountSelectionChange}
            />
          </Box>
          <Tooltip
            label={skipConfirmation ? 
              "Orders will execute immediately" : 
              "Orders require confirmation"
            }
            placement="top"
            hasArrow
          >
            <HStack spacing={2}>
              {skipConfirmation && (
                <AlertTriangle size={12} color="#ED8936" />
              )}
              <Switch
                size="sm"
                isChecked={skipConfirmation}
                onChange={(e) => setSkipConfirmation(e.target.checked)}
                colorScheme="blue"
              />
            </HStack>
          </Tooltip>
        </HStack>
      </Box>

      {/* Main Trading Controls */}
      <VStack p={3} spacing={3} flex="1">
        {/* Only show inputs row for single account selection */}
        {selectionType === 'single' && (
          <HStack width="full" spacing={2}>
            <Select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              placeholder="Select Ticker"
              size="sm"
              bg="whiteAlpha.50"
              borderColor="whiteAlpha.200"
              flex="1.5"
              _hover={{ borderColor: "whiteAlpha.300" }}
              _focus={{ 
                borderColor: "rgba(0, 198, 224, 0.6)",
                boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
              }}
            >
              {AVAILABLE_TICKERS.map(ticker => (
                <option key={ticker} value={ticker}>{ticker}</option>
              ))}
            </Select>

            <NumberInput 
              value={quantity} 
              onChange={(value) => setQuantity(Number(value))}
              min={1}
              max={100}
              size="sm"
              bg="whiteAlpha.50"
              borderColor="whiteAlpha.200"
              flex="1"
              _hover={{ borderColor: "whiteAlpha.300" }}
              _focus={{ 
                borderColor: "rgba(0, 198, 224, 0.6)",
                boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
              }}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </HStack>
        )}
        
        {/* Display selected group info when a group is selected */}
        {selectionType === 'group' && selectedGroupInfo && (
          <Box 
            width="full" 
            p={3} 
            bg="whiteAlpha.100" 
            borderRadius="md"
          >
            <Text fontSize="sm" fontWeight="medium" mb={1}>Selected Strategy Group</Text>
            <HStack spacing={4}>
              <Box>
                <Text fontSize="xs" color="whiteAlpha.700">Ticker</Text>
                <Text fontWeight="bold">{selectedGroupInfo.ticker}</Text>
              </Box>
              {selectedGroupInfo.groupName && (
                <Box>
                  <Text fontSize="xs" color="whiteAlpha.700">Group</Text>
                  <Text fontWeight="bold">{selectedGroupInfo.groupName}</Text>
                </Box>
              )}
            </HStack>
          </Box>
        )}

        {/* Required fields validation messages */}
        {selectionType === 'single' && selectedAccounts.length > 0 && !selectedTicker && (
          <Text fontSize="xs" color="red.300">
            Please select a ticker to continue
          </Text>
        )}

        {selectionType === 'group' && selectedAccounts.length === 0 && selectedGroupInfo && (
          <Text fontSize="xs" color="red.300">
            The selected group has no valid accounts
          </Text>
        )}

        {/* Trading Buttons */}
        <VStack spacing={2} width="full" mt="auto">
          <HStack width="full" spacing={2}>
            <Button
              flex={1}
              h="40px"
              leftIcon={orderStatus === 'pending' && pendingOrder?.type === 'buy' ? null : <ArrowBigUp />}
              onClick={() => handleOrderSubmit('buy')}
              isDisabled={isTradingDisabled()}
              isLoading={orderStatus === 'pending' && pendingOrder?.type === 'buy'}
              loadingText="Buying..."
              spinnerPlacement="start"
              color="white"
              bgGradient="linear(to-r, #22c55e, #16a34a)"
              _hover={{ 
                bgGradient: "linear(to-r, #16a34a, #15803d)",
                transform: "translateY(-1px)",
                boxShadow: "lg"
              }}
              _active={{
                bgGradient: "linear(to-r, #15803d, #166534)",
                transform: "translateY(0)",
                boxShadow: "md"
              }}
            >
              Buy
            </Button>

            <Button
              flex={1}
              h="40px"
              leftIcon={orderStatus === 'pending' && pendingOrder?.type === 'sell' ? null : <ArrowBigDown />}
              onClick={() => handleOrderSubmit('sell')}
              isDisabled={isTradingDisabled()}
              isLoading={orderStatus === 'pending' && pendingOrder?.type === 'sell'}
              loadingText="Selling..."
              spinnerPlacement="start"
              color="white"
              bgGradient="linear(to-r, #ef4444, #dc2626)"
              _hover={{ 
                bgGradient: "linear(to-r, #dc2626, #b91c1c)",
                transform: "translateY(-1px)",
                boxShadow: "lg"
              }}
              _active={{
                bgGradient: "linear(to-r, #b91c1c, #991b1b)",
                transform: "translateY(0)",
                boxShadow: "md"
              }}
            >
              Sell
            </Button>
          </HStack>

          {/* Close All Trades Button */}
          <Button
            width="full"
            h="32px"
            leftIcon={orderStatus === 'pending' && pendingOrder?.type === 'close-all' ? null : <Ban size={14} />}
            size="sm"
            onClick={handleCloseAllTrades}
            isDisabled={isSubmitting} // Remove the selectedAccounts.length check
            isLoading={orderStatus === 'pending' && pendingOrder?.type === 'close-all'}
            loadingText="Closing All..."
            spinnerPlacement="start"
            color="white"
            bgGradient="linear(to-r, #dc2626, #991b1b)"
            _hover={{ 
                bgGradient: "linear(to-r, #991b1b, #7f1d1d)",
                transform: "translateY(-1px)",
                boxShadow: "lg"
            }}
            _active={{
                bgGradient: "linear(to-r, #7f1d1d, #450a0a)",
                transform: "translateY(0)",
                boxShadow: "md"
            }}
          >
            Close All Trades
        </Button>
        </VStack>
      </VStack>

      {/* Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={onConfirmationClose}
        order={pendingOrder}
        onConfirm={executeOrder}
      />
    </Box>
  );
};

export default OrderControl;