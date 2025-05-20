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
  Flex,
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
// Import the ticker utilities
import { getDisplayTickers, getContractTicker } from '@/utils/formatting/tickerUtils';

const OrderControl = () => {
  const toast = useToast();
  const {
    isOpen: isConfirmationOpen,
    onOpen: onConfirmationOpen,
    onClose: onConfirmationClose
  } = useDisclosure();

  // Get the display tickers from our utility
  const AVAILABLE_TICKERS = getDisplayTickers();

  // Core state
  const [quantity, setQuantity] = useState(1);
  const [skipConfirmation, setSkipConfirmation] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState('single');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [groupInfo, setGroupInfo] = useState(null);
  
  // Order state
  const [pendingOrder, setPendingOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);

  // Handle account selection change from AccountSelection component
  const handleAccountSelectionChange = (accounts, type, selectedGroupInfo = null) => {
    logger.info(`Account selection changed: accounts=${JSON.stringify(accounts)}, type=${type}, hasGroupInfo=${!!selectedGroupInfo}`);
    
    setSelectedAccounts(accounts || []);
    setSelectionMode(type);
    
    // If group info is provided and this is a group selection, update the ticker
    if (type === 'group' && selectedGroupInfo?.ticker) {
      setGroupInfo(selectedGroupInfo);
      setSelectedTicker(selectedGroupInfo.ticker);
    } else if (type === 'single') {
      // When switching to single, clear group info
      setGroupInfo(null);
    }
  };

  // Execute order
  const executeOrder = async (order) => {
    if (!order) return;
    
    setIsSubmitting(true);
    setOrderStatus('pending');
    
    try {
      if (order.type === 'close-all') {
        // Execute close all positions
        await axios.post('/api/v1/brokers/accounts/close-all', { 
          account_ids: order.accounts 
        });
        
        toast({
          title: "Positions Closed",
          description: "Successfully closed all positions",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else if (order.isGroupOrder && order.groupInfo?.id) {
        // Execute group strategy order
        await axios.post(`/api/v1/strategies/${order.groupInfo.id}/execute`, {
          action: order.type
        });
        
        toast({
          title: `Group ${order.type.toUpperCase()} Executed`,
          description: `Successfully executed ${order.type} for group ${order.groupInfo.groupName}`,
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else if (order.accounts?.[0]) {
        // Execute single account order - Use contract ticker format
        const contractTicker = getContractTicker(order.ticker);
        
        await axios.post(`/api/v1/brokers/accounts/${order.accounts[0]}/discretionary/orders`, {
          symbol: contractTicker, // Use full contract specification
          side: order.type,
          type: 'MARKET',
          quantity: order.quantity,
          time_in_force: 'GTC'
        });
        
        toast({
          title: `Order ${order.type.toUpperCase()} Executed`,
          description: `Successfully placed ${order.type} order for ${order.quantity} ${order.ticker}`,
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
      
      setOrderStatus('success');
    } catch (error) {
      logger.error('Order execution failed:', error);
      
      setOrderStatus('error');
      toast({
        title: "Order Failed",
        description: error.response?.data?.detail || "Failed to execute order",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      
      // Reset order status after a delay
      setTimeout(() => {
        setOrderStatus(null);
        setPendingOrder(null);
      }, 1000);
    }
  };

  // Handle order submission (buy/sell)
  const handleOrderSubmit = useCallback((orderType) => {
    // Validation
    if (selectedAccounts.length === 0) {
      toast({
        title: "No Account Selected",
        description: "Please select an account or group first",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // For group selection, use group ticker; otherwise use selected ticker
    const orderTicker = selectionMode === 'group' && groupInfo ? 
      groupInfo.ticker : selectedTicker;
      
    if (!orderTicker) {
      toast({
        title: "No Ticker Selected",
        description: "Please select a ticker first",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // For group, use leader quantity; otherwise use input quantity
    const orderQuantity = selectionMode === 'group' && groupInfo ? 
      groupInfo.leaderQuantity : quantity;
    
    // Create order
    const order = {
      type: orderType,
      ticker: orderTicker,
      quantity: orderQuantity,
      accounts: selectedAccounts,
      timestamp: new Date().toISOString()
    };
    
    // Add group info if applicable
    if (selectionMode === 'group' && groupInfo) {
      order.isGroupOrder = true;
      order.groupInfo = groupInfo;
    }
    
    logger.info(`Preparing ${orderType} order:`, order);
    
    if (skipConfirmation) {
      executeOrder(order);
    } else {
      setPendingOrder(order);
      onConfirmationOpen();
    }
  }, [
    selectedAccounts, 
    selectionMode, 
    groupInfo, 
    selectedTicker, 
    quantity, 
    skipConfirmation, 
    toast, 
    onConfirmationOpen
  ]);

  // Handle close all positions
  const handleCloseAll = useCallback(() => {
    if (selectedAccounts.length === 0) {
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
      executeOrder(order);
    } else {
      setPendingOrder(order);
      onConfirmationOpen();
    }
  }, [selectedAccounts, skipConfirmation, toast, onConfirmationOpen]);

  // Check if trading buttons should be disabled
  const isTradingDisabled = () => {
    if (isSubmitting) return true;
    
    // We need accounts
    if (selectedAccounts.length === 0) return true;
    
    if (selectionMode === 'single') {
      // Single mode needs ticker and quantity
      return !selectedTicker || quantity <= 0;
    } else {
      // Group mode needs group info with ticker
      return !groupInfo || !groupInfo.ticker;
    }
  };

  return (
    <Box h="full" display="flex" flexDirection="column">
      {/* Header Section */}
      <Box p={3} borderBottom="1px solid" borderColor="whiteAlpha.200">
        <Flex 
          width="full" 
          spacing={2} 
          direction={{ base: "column", sm: "row" }}
          align={{ base: "stretch", sm: "center" }}
          gap={2}
        >
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
            <HStack spacing={2} justify={{ base: "flex-end", sm: "flex-start" }}>
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
        </Flex>
      </Box>

      {/* Main Trading Controls */}
      <VStack p={3} spacing={3} flex="1">
        {/* Only show inputs for single account selection */}
        {selectionMode === 'single' && (
          <Flex 
            width="full" 
            spacing={2} 
            direction={{ base: "column", sm: "row" }}
            gap={2}
          >
            <Select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              placeholder="Select Ticker"
              size="sm"
              bg="whiteAlpha.50"
              borderColor="whiteAlpha.200"
              flex={{ base: "1", sm: "1.5" }}
              mb={{ base: 2, sm: 0 }}
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
          </Flex>
        )}
        
        {/* Display group info for group selection */}
        {selectionMode === 'group' && groupInfo && (
          <Box 
            width="full" 
            p={3} 
            bg="whiteAlpha.100" 
            borderRadius="md"
          >
            <Text fontSize="sm" fontWeight="medium" mb={1}>Selected Strategy Group</Text>
            <HStack spacing={4} flexWrap="wrap">
              <Box>
                <Text fontSize="xs" color="whiteAlpha.700">Ticker</Text>
                <Text fontWeight="bold">{groupInfo.ticker}</Text>
              </Box>
              {groupInfo.groupName && (
                <Box>
                  <Text fontSize="xs" color="whiteAlpha.700">Group</Text>
                  <Text fontWeight="bold">{groupInfo.groupName}</Text>
                </Box>
              )}
            </HStack>
          </Box>
        )}

        {/* Validation messages */}
        {selectionMode === 'single' && selectedAccounts.length > 0 && !selectedTicker && (
          <Text fontSize="xs" color="red.300">
            Please select a ticker to continue
          </Text>
        )}

        {/* Trading Buttons */}
        <VStack spacing={2} width="full" mt="auto">
          <HStack width="full" spacing={2}>
            <Button
              flex={1}
              h={{ base: "48px", md: "40px" }} // Taller buttons on mobile for better touch
              leftIcon={orderStatus === 'pending' && pendingOrder?.type === 'buy' ? null : <ArrowBigUp />}
              onClick={() => handleOrderSubmit('buy')}
              isDisabled={isTradingDisabled()}
              isLoading={orderStatus === 'pending' && pendingOrder?.type === 'buy'}
              loadingText="Buying..."
              spinnerPlacement="start"
              color={isTradingDisabled() ? "whiteAlpha.500" : "green.400"}
              bg="gray.800"
              boxShadow={isTradingDisabled() ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)"}
              _hover={{ 
                bg: "gray.700",
                transform: isTradingDisabled() ? "none" : "translateY(-1px)",
                boxShadow: isTradingDisabled() ? "none" : "0 6px 10px -1px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
              }}
              _active={{
                bg: "gray.900",
                transform: "translateY(0)",
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.3)"
              }}
              transition="all 0.2s"
            >
              Buy
            </Button>

            <Button
              flex={1}
              h={{ base: "48px", md: "40px" }} // Taller buttons on mobile for better touch
              leftIcon={orderStatus === 'pending' && pendingOrder?.type === 'sell' ? null : <ArrowBigDown />}
              onClick={() => handleOrderSubmit('sell')}
              isDisabled={isTradingDisabled()}
              isLoading={orderStatus === 'pending' && pendingOrder?.type === 'sell'}
              loadingText="Selling..."
              spinnerPlacement="start"
              color={isTradingDisabled() ? "whiteAlpha.500" : "red.400"}
              bg="gray.800"
              boxShadow={isTradingDisabled() ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)"}
              _hover={{ 
                bg: "gray.700",
                transform: isTradingDisabled() ? "none" : "translateY(-1px)",
                boxShadow: isTradingDisabled() ? "none" : "0 6px 10px -1px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
              }}
              _active={{
                bg: "gray.900",
                transform: "translateY(0)",
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.3)"
              }}
              transition="all 0.2s"
            >
              Sell
            </Button>
          </HStack>

          {/* Close All Trades Button */}
          <Button
            width="full"
            h={{ base: "40px", md: "32px" }}
            leftIcon={orderStatus === 'pending' && pendingOrder?.type === 'close-all' ? null : <Ban size={14} />}
            size="sm"
            onClick={handleCloseAll}
            isDisabled={isSubmitting || selectedAccounts.length === 0} 
            isLoading={orderStatus === 'pending' && pendingOrder?.type === 'close-all'}
            loadingText="Closing All..."
            spinnerPlacement="start"
            color="white"
            bg="transparent"
            bgGradient={isSubmitting || selectedAccounts.length === 0 ? "none" : "linear(to-r, rgba(220, 38, 38, 0.1), rgba(153, 27, 27, 0.1))"}
            boxShadow={isSubmitting || selectedAccounts.length === 0 ? "none" : "0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.05)"}
            _hover={{ 
              bgGradient: isSubmitting || selectedAccounts.length === 0 ? "none" : "linear(to-r, rgba(220, 38, 38, 0.15), rgba(153, 27, 27, 0.15))",
              transform: isSubmitting || selectedAccounts.length === 0 ? "none" : "translateY(-1px)",
              boxShadow: isSubmitting || selectedAccounts.length === 0 ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }}
            _active={{
              bgGradient: "linear(to-r, rgba(220, 38, 38, 0.2), rgba(153, 27, 27, 0.2))",
              transform: "translateY(0)",
              boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.2)"
            }}
            transition="all 0.2s"
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