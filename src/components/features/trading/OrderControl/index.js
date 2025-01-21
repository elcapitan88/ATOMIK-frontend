// src/components/features/trading/OrderControl/OrderControl.js
import React, { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  ButtonGroup,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  useDisclosure,
  Switch,
  Tooltip,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { 
  ArrowBigUp, 
  ArrowBigDown, 
  Ban, 
  Info,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import AccountSelection from './AccountSelection';
import OrderConfirmationModal from './OrderConfirmationModal';
import OrderFeedback from './OrderFeedback';

const QUANTITY_PRESETS = [1, 5, 10];

const OrderControl = () => {
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [skipConfirmation, setSkipConfirmation] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [orderStatus, setOrderStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    isOpen: isConfirmationOpen,
    onOpen: onConfirmationOpen,
    onClose: onConfirmationClose
  } = useDisclosure();

  const [pendingOrder, setPendingOrder] = useState(null);

  const handleOrderSubmit = useCallback(async (orderType) => {
    const order = {
      type: orderType,
      quantity,
      accounts: selectedAccounts,
      timestamp: new Date().toISOString()
    };

    if (skipConfirmation) {
      executeOrder(order);
    } else {
      setPendingOrder(order);
      onConfirmationOpen();
    }
  }, [quantity, selectedAccounts, skipConfirmation, onConfirmationOpen]);

  const executeOrder = async (order) => {
    setIsSubmitting(true);
    setOrderStatus('pending');
    
    try {
      // Here you would make your API call to execute the order
      await new Promise(resolve => setTimeout(resolve, 1000));

      setOrderStatus('success');
      toast({
        title: "Order Executed",
        description: `Successfully placed ${order.type} order for ${order.quantity} contracts`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      setOrderStatus('error');
      toast({
        title: "Order Failed",
        description: error.message || "Failed to execute order",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setOrderStatus(null), 3000);
    }
  };

  const handleQuantityPresetClick = (preset) => {
    setQuantity(preset);
  };

  const handleQuantityAdjust = (action) => {
    switch (action) {
      case 'double':
        setQuantity(prev => prev * 2);
        break;
      case 'half':
        setQuantity(prev => Math.max(1, Math.floor(prev / 2)));
        break;
      case 'reset':
        setQuantity(1);
        break;
      default:
        break;
    }
  };

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

    if (!skipConfirmation) {
      setPendingOrder({ type: 'close-all', accounts: selectedAccounts });
      onConfirmationOpen();
      return;
    }

    setIsSubmitting(true);
    setOrderStatus('pending');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrderStatus('success');
      toast({
        title: "Trades Closed",
        description: "Successfully closed all trades",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      setOrderStatus('error');
      toast({
        title: "Failed to close trades",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setOrderStatus(null), 3000);
    }
  };

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
      <VStack p={4} color="white" spacing={4}>
        <Text fontSize="lg" fontWeight="semibold">Order Entry</Text>
        
        {/* Account Selection */}
        <AccountSelection
          selectedAccounts={selectedAccounts}
          onChange={setSelectedAccounts}
        />

        <Divider borderColor="whiteAlpha.200" />

        {/* Quantity Controls */}
        <VStack width="full" spacing={2}>
          <HStack width="full" spacing={2}>
            <NumberInput 
              value={quantity} 
              onChange={(value) => setQuantity(Number(value))}
              min={1}
              max={100}
              flex={1}
              bg="whiteAlpha.50"
              borderColor="whiteAlpha.200"
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

            <ButtonGroup size="sm" isAttached variant="outline">
              <Button 
                onClick={() => handleQuantityAdjust('half')}
                leftIcon={<Minus size={14} />}
                _hover={{ bg: 'whiteAlpha.100' }}
              >
                ½
              </Button>
              <Button 
                onClick={() => handleQuantityAdjust('double')}
                leftIcon={<Plus size={14} />}
                _hover={{ bg: 'whiteAlpha.100' }}
              >
                2×
              </Button>
              <Button 
                onClick={() => handleQuantityAdjust('reset')}
                leftIcon={<RotateCcw size={14} />}
                _hover={{ bg: 'whiteAlpha.100' }}
              >
                Reset
              </Button>
            </ButtonGroup>
          </HStack>

          <ButtonGroup size="sm" width="full">
            {QUANTITY_PRESETS.map(preset => (
              <Button
                key={preset}
                onClick={() => handleQuantityPresetClick(preset)}
                flex={1}
                variant="ghost"
                _hover={{ bg: 'whiteAlpha.100' }}
              >
                {preset}
              </Button>
            ))}
          </ButtonGroup>
        </VStack>

        {/* Trading Actions */}
        <HStack width="full" spacing={4}>
          <Button
            flex={1}
            leftIcon={<ArrowBigUp />}
            onClick={() => handleOrderSubmit('buy')}
            isDisabled={!selectedAccounts.length || isSubmitting}
            bgGradient="linear(to-r, green.500, green.600)"
            _hover={{ 
              bgGradient: "linear(to-r, green.600, green.700)",
              transform: "translateY(-1px)",
              boxShadow: "lg"
            }}
            _active={{
              bgGradient: "linear(to-r, green.700, green.800)",
              transform: "translateY(0)",
              boxShadow: "md"
            }}
            transition="all 0.2s"
          >
            Buy
          </Button>

          <Button
            flex={1}
            leftIcon={<ArrowBigDown />}
            onClick={() => handleOrderSubmit('sell')}
            isDisabled={!selectedAccounts.length || isSubmitting}
            bgGradient="linear(to-r, red.500, red.600)"
            _hover={{ 
              bgGradient: "linear(to-r, red.600, red.700)",
              transform: "translateY(-1px)",
              boxShadow: "lg"
            }}
            _active={{
              bgGradient: "linear(to-r, red.700, red.800)",
              transform: "translateY(0)",
              boxShadow: "md"
            }}
            transition="all 0.2s"
          >
            Sell
          </Button>
        </HStack>

        {/* Close All Trades */}
        <Button
          width="full"
          leftIcon={<Ban />}
          onClick={handleCloseAllTrades}
          isDisabled={!selectedAccounts.length || isSubmitting}
          bgGradient="linear(to-r, orange.500, orange.600)"
          _hover={{ 
            bgGradient: "linear(to-r, orange.600, orange.700)",
            transform: "translateY(-1px)",
            boxShadow: "lg"
          }}
          _active={{
            bgGradient: "linear(to-r, orange.700, orange.800)",
            transform: "translateY(0)",
            boxShadow: "md"
          }}
          transition="all 0.2s"
        >
          Close All Trades
        </Button>

        <Divider borderColor="whiteAlpha.200" />

        {/* Settings */}
        <HStack width="full" justify="space-between">
          <HStack>
            <Text fontSize="sm">Skip Confirmation</Text>
            <Tooltip 
              label="Bypass order confirmation modal" 
              placement="top"
              hasArrow
            >
              <Box display="inline-block">
                <Info size={14} />
              </Box>
            </Tooltip>
          </HStack>
          <Switch
            isChecked={skipConfirmation}
            onChange={(e) => setSkipConfirmation(e.target.checked)}
            colorScheme="blue"
          />
        </HStack>

        {/* Order Status Feedback */}
        <OrderFeedback status={orderStatus} />
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