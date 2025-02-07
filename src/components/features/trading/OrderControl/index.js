// src/components/features/trading/OrderControl/index.js
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
} from '@chakra-ui/react';
import { 
  ArrowBigUp, 
  AlertTriangle,
  ArrowBigDown, 
  Ban,
} from 'lucide-react';

import AccountSelection from './AccountSelection';
import OrderConfirmationModal from './OrderConfirmationModal';


// Sample tickers - replace with your actual ticker data source
const AVAILABLE_TICKERS = ['ES', 'NQ', 'RTY', 'CL', 'GC', 'SI'];

const OrderControl = () => {
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [skipConfirmation, setSkipConfirmation] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState('');
  const [orderStatus, setOrderStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

  const {
    isOpen: isConfirmationOpen,
    onOpen: onConfirmationOpen,
    onClose: onConfirmationClose
  } = useDisclosure();

  const handleOrderSubmit = useCallback(async (orderType) => {
    if (!selectedTicker) {
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
      quantity,
      ticker: selectedTicker,
      accounts: selectedAccounts,
      timestamp: new Date().toISOString()
    };

    if (skipConfirmation) {
      executeOrder(order);
    } else {
      setPendingOrder(order);
      onConfirmationOpen();
    }
  }, [quantity, selectedTicker, selectedAccounts, skipConfirmation, onConfirmationOpen, toast]);

  const handleCloseAllTrades = async () => {
    if (!selectedAccounts.length) {
      toast({
        title: "No accounts selected",
        description: "Please select at least one account",
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

    if (!skipConfirmation) {
      setPendingOrder(order);
      onConfirmationOpen();
      return;
    }

    executeOrder(order);
  };

  const executeOrder = async (order) => {
    setIsSubmitting(true);
    setOrderStatus('pending');
    setPendingOrder(order);
    
    try {
      // Here you would make your API call to execute the order
      await new Promise(resolve => setTimeout(resolve, 1000));

      setOrderStatus('success');
      const title = order.type === 'buy' ? "Buy Order Executed" : 
                   order.type === 'sell' ? "Sell Order Executed" : 
                   "Positions Closed";
      const description = order.type === 'close-all' ? 
                         "Successfully closed all positions" :
                         `Successfully ${order.type === 'buy' ? 'bought' : 'sold'} ${order.quantity} ${order.ticker} contracts`;

      toast({
        title,
        description,
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      setOrderStatus('error');
      toast({
        title: "Order Failed",
        description: error.message || "Failed to execute order",
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

  return (
    <Box h="full" display="flex" flexDirection="column">
      {/* Header Section */}
      <Box p={3} borderBottom="1px solid" borderColor="whiteAlpha.200">
        <HStack width="full" spacing={2}>
          <Box flex={1}>
            <AccountSelection
              selectedAccounts={selectedAccounts}
              onChange={setSelectedAccounts}
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
        {/* Inputs Row */}
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

        

        {/* Trading Buttons */}
        <VStack spacing={2} width="full" mt="auto">
          <HStack width="full" spacing={2}>
            <Button
              flex={1}
              h="40px"
              leftIcon={orderStatus === 'pending' && pendingOrder?.type === 'buy' ? null : <ArrowBigUp />}
              onClick={() => handleOrderSubmit('buy')}
              isDisabled={!selectedAccounts.length || isSubmitting}
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
              isDisabled={!selectedAccounts.length || isSubmitting}
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
            isDisabled={!selectedAccounts.length || isSubmitting}
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