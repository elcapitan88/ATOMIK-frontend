import React, { useState, useCallback, useEffect } from 'react';
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
import logger from '@/utils/logger';

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
  
  // Group selection states
  const [selectionType, setSelectionType] = useState('single');
  const [selectedGroupInfo, setSelectedGroupInfo] = useState(null);

  const {
    isOpen: isConfirmationOpen,
    onOpen: onConfirmationOpen,
    onClose: onConfirmationClose
  } = useDisclosure();

  // Debug log the current state for troubleshooting
  useEffect(() => {
    logger.debug('OrderControl state update:', {
      selectionType, 
      selectedAccounts, 
      selectedTicker, 
      quantity,
      selectedGroupInfo: selectedGroupInfo ? { 
        id: selectedGroupInfo.id,
        ticker: selectedGroupInfo.ticker,
        accountsCount: selectedAccounts.length
      } : null,
      isTradingDisabled: isTradingDisabled()
    });
  }, [selectionType, selectedAccounts, selectedTicker, quantity, selectedGroupInfo]);

  // Handle account selection change
  const handleAccountSelectionChange = (accounts, type, groupInfo = null) => {
    logger.info('Account selection changed:', { 
      accounts, 
      type, 
      hasGroupInfo: !!groupInfo 
    });
    
    // Ensure accounts is always an array
    const validAccounts = Array.isArray(accounts) ? accounts : [];
    
    setSelectedAccounts(validAccounts);
    setSelectionType(type);
    
    // Set ticker from group strategy info if available
    if (type === 'group' && groupInfo?.ticker) {
      setSelectedTicker(groupInfo.ticker);
      setSelectedGroupInfo(groupInfo);
    } else if (type === 'single') {
      // Clear group info when switching to single mode
      setSelectedGroupInfo(null);
    }
  };

  // Regular Order Execution
  const executeOrder = async (order) => {
    if (!order) {
      logger.error('Attempted to execute order with no order data');
      return;
    }
    
    if (order.type === 'close-all') {
      await executeCloseAll(order);
      return;
    }
  
    setIsSubmitting(true);
    setOrderStatus('pending');
    setPendingOrder(order);
    
    try {
      // Check if this is a group order with group info
      if (order.isGroupOrder && order.groupInfo && order.groupInfo.id) {
        logger.info(`Executing group strategy order: ${order.type} for strategy ID ${order.groupInfo.id}`);
        
        // Execute as a group strategy
        await axios.post(
          `/api/v1/strategies/${order.groupInfo.id}/execute`,
          {
            action: order.type  // 'buy' or 'sell'
          }
        );
      } else if (order.accounts && order.accounts.length > 0) {
        logger.info(`Executing single account order: ${order.type} for account ${order.accounts[0]}`);
        
        // Original single account order logic
        await axios.post(
          `/api/v1/brokers/accounts/${order.accounts[0]}/discretionary/orders`,
          {
            symbol: order.ticker,
            side: order.type,
            type: 'MARKET',
            quantity: order.quantity,
            time_in_force: 'GTC'
          }
        );
      } else {
        throw new Error('Invalid order configuration');
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
      logger.error('Order execution failed:', error);
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
    if (!order || !order.accounts || order.accounts.length === 0) {
      logger.error('Attempted to close positions with no accounts specified');
      toast({
        title: "Close All Failed",
        description: "No accounts specified for closing positions",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    setOrderStatus('pending');

    try {
      logger.info(`Closing positions for accounts: ${order.accounts.join(', ')}`);
      await axios.post(
        '/api/v1/brokers/accounts/close-all',
        { account_ids: order.accounts }
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
      logger.error('Close all positions failed:', error);
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
  const handleOrderSubmit = useCallback((orderType) => {
    // For group selection, use the group's ticker
    const orderTicker = selectionType === 'group' && selectedGroupInfo ? 
      selectedGroupInfo.ticker : selectedTicker;
      
    // For quantity, use either the group's specified quantity or the input quantity
    const orderQuantity = selectionType === 'group' && selectedGroupInfo?.leaderQuantity ? 
      selectedGroupInfo.leaderQuantity : quantity;
    
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
    
    if (!selectedAccounts || selectedAccounts.length === 0) {
      toast({
        title: "No account selected",
        description: "Please select an account or group first",
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

    logger.info('Preparing order:', order);

    if (skipConfirmation) {
      executeOrder(order);
    } else {
      setPendingOrder(order);
      onConfirmationOpen();
    }
  }, [
    quantity, 
    selectedTicker, 
    selectedAccounts, 
    skipConfirmation, 
    onConfirmationOpen, 
    toast, 
    selectionType, 
    selectedGroupInfo
  ]);

  const handleCloseAllTrades = useCallback(async () => {
    if (!selectedAccounts || selectedAccounts.length === 0) {
      toast({
        title: "No Accounts Selected",
        description: "Please select at least one account to close positions",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const order = {
      type: 'close-all',
      accounts: selectedAccounts,
      timestamp: new Date().toISOString()
    };

    if (skipConfirmation) {
      executeCloseAll(order);
    } else {
      setPendingOrder(order);
      onConfirmationOpen();
    }
  }, [selectedAccounts, skipConfirmation, onConfirmationOpen, toast]);

  // Determine if buy/sell buttons should be enabled
  const isTradingDisabled = () => {
    if (isSubmitting) return true;
    
    // No accounts selected
    if (!selectedAccounts || selectedAccounts.length === 0) return true;
    
    if (selectionType === 'single') {
      // For single account selection, need account, ticker and quantity
      return !selectedTicker || quantity <= 0;
    } else if (selectionType === 'group') {
      // For group selection, need group info with ticker
      return !selectedGroupInfo || !selectedGroupInfo.ticker;
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

        {selectionType === 'group' && selectedAccounts.length === 0 && (
          <Text fontSize="xs" color="red.300">
            Please select a valid group strategy
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
            isDisabled={isSubmitting || selectedAccounts.length === 0} 
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