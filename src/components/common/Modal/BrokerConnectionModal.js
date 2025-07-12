import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Box,
  Spinner,
  useToast,
  Button,
} from '@chakra-ui/react';
import { AlertTriangle, Settings } from 'lucide-react';
import { useOAuth } from '@/hooks/useOAuth';
import { getBrokerById, CONNECTION_METHODS } from '@/utils/constants/brokers';
import { useNavigate } from 'react-router-dom';

const BrokerOption = ({ title, onClick, isDisabled = false }) => (
  <VStack spacing={2} align="center">
    <Box
      as="button"
      w="100px"
      h="100px"
      borderRadius="md"
      border="1px solid rgba(255, 255, 255, 0.18)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClick}
      disabled={isDisabled}
      bg="rgba(255, 255, 255, 0.05)"
      _hover={{ 
        bg: isDisabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)' 
      }}
      _disabled={{ 
        opacity: 0.5, 
        cursor: 'not-allowed',
      }}
      transition="all 0.3s"
      backdropFilter="blur(5px)"
    >
      <Box 
        w="60px" 
        h="60px" 
        bg="whiteAlpha.300" 
        borderRadius="md" 
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="sm"
        color="whiteAlpha.900"
      >
        {title}
      </Box>
    </Box>
    <Text fontSize="sm" color="whiteAlpha.900">
      {title} Trading
    </Text>
  </VStack>
);

const ErrorDisplay = ({ error, onRetry }) => (
  <VStack spacing={4} align="center" py={8}>
    <AlertTriangle size={24} color="#F56565" />
    <Text color="red.400" textAlign="center">{error}</Text>
    {onRetry && (
      <Box
        as="button"
        px={4}
        py={2}
        bg="transparent"
        color="white"
        borderWidth={1}
        borderColor="red.400"
        borderRadius="md"
        onClick={onRetry}
        _hover={{ bg: 'whiteAlpha.100' }}
      >
        Try Again
      </Box>
    )}
  </VStack>
);

const LoadingDisplay = () => (
  <VStack spacing={4} align="center" py={8}>
    <Spinner size="xl" color="blue.500" />
    <Text color="white">Connecting to Trading Account...</Text>
  </VStack>
);

const BrokerConnectionModal = ({ isOpen, onClose, brokerId = 'tradovate' }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { initiateBrokerAuth } = useOAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  const brokerConfig = getBrokerById(brokerId);
  const isApiKeyBroker = brokerConfig?.connectionMethod === CONNECTION_METHODS.API_KEY;

  const handleBrokerSelection = async (environment) => {
    try {
      setIsSubmitting(true);
      await initiateBrokerAuth(brokerId, environment);
      
      // If successful, modal will be closed when redirection happens
      // No need to explicitly close here
    } catch (error) {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect broker account",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
    }
  };

  const handleGoToSettings = () => {
    onClose();
    navigate('/settings');
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      closeOnOverlayClick={!isSubmitting}
      isCentered
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent 
        bg="rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(255, 255, 255, 0.1)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="xl"
        maxW="400px"
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.18)" 
          pb={4}
          color="white"
        >
          Connect {brokerConfig?.name || 'Trading'} Account
        </ModalHeader>
        {!isSubmitting && <ModalCloseButton color="white" />}
        
        <ModalBody pt={6} pb={8}>
          {isSubmitting ? (
            <LoadingDisplay />
          ) : isApiKeyBroker ? (
            <VStack spacing={6} align="center">
              <VStack spacing={3} textAlign="center">
                <Settings size={48} color="#00C6E0" />
                <Text fontSize="lg" fontWeight="semibold" color="white">
                  API Key Required
                </Text>
                <Text fontSize="sm" color="whiteAlpha.700" maxW="300px">
                  {brokerConfig?.name} requires an API key for connection. Please add your API key in the settings page.
                </Text>
              </VStack>
              
              <Button
                bg="#00C6E0"
                color="white"
                size="lg"
                leftIcon={<Settings size={18} />}
                onClick={handleGoToSettings}
                _hover={{ bg: "#00A3B8" }}
                _active={{ bg: "#008A9B" }}
              >
                Go to Settings
              </Button>
              
              <Text fontSize="xs" color="whiteAlpha.500" textAlign="center">
                Navigate to Settings → Broker Options to configure your API key
              </Text>
            </VStack>
          ) : (
            <>
              <HStack spacing={8} justify="center">
                <BrokerOption 
                  title="Demo" 
                  onClick={() => handleBrokerSelection('demo')}
                />
                <BrokerOption 
                  title="Live" 
                  onClick={() => handleBrokerSelection('live')}
                />
              </HStack>
              
              <Text 
                mt={6} 
                fontSize="sm" 
                color="whiteAlpha.600" 
                textAlign="center"
              >
                Select Demo for practice or Live for real trading
              </Text>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BrokerConnectionModal;