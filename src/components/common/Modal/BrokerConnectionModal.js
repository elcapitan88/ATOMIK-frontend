import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useOAuth } from '@/hooks/useOAuth';

const glassEffect = {
  background: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px 0 rgba(0, 198, 224, 0.37)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  borderRadius: "xl",
};

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
  </VStack>
);

const LoadingDisplay = () => (
  <VStack spacing={4} align="center" py={8}>
    <Spinner size="xl" color="blue.500" />
    <Text color="white">Connecting to Trading Account...</Text>
  </VStack>
);

const BrokerConnectionModal = ({ isOpen, onClose, onAccountConnected }) => {
  const [initialLoad, setInitialLoad] = useState(true);
  const location = useLocation();
  const { 
    isProcessing, 
    error, 
    initiateBrokerAuth, 
    handleCallback, 
    clearError 
  } = useOAuth();

  useEffect(() => {
    if (initialLoad) {
      const code = new URLSearchParams(location.search).get('code');
      if (code) {
        handleCallback('tradovate', code).then(response => {
          if (response?.accounts) {
            onAccountConnected(response.accounts);
          }
        });
      }
      setInitialLoad(false);
    }
  }, [location, handleCallback, onAccountConnected, initialLoad]);

  const handleBrokerSelection = (environment) => {
    initiateBrokerAuth('tradovate', environment);
    onClose();
  };

  const handleModalClose = () => {
    if (!isProcessing) {
      clearError();
      onClose();
    }
  };

  const getModalContent = () => {
    if (isProcessing) {
      return <LoadingDisplay />;
    }

    if (error) {
      return <ErrorDisplay error={error} onRetry={clearError} />;
    }

    return (
      <>
        <HStack spacing={8} justify="center">
          <BrokerOption 
            title="Demo" 
            onClick={() => handleBrokerSelection('demo')}
            isDisabled={isProcessing}
          />
          <BrokerOption 
            title="Live" 
            onClick={() => handleBrokerSelection('live')}
            isDisabled={isProcessing}
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
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleModalClose} 
      isCentered
      closeOnOverlayClick={!isProcessing}
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent {...glassEffect} maxW="400px">
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.18)" 
          pb={4}
          color="white"
        >
          Connect Trading Account
        </ModalHeader>
        {!isProcessing && <ModalCloseButton color="white" />}
        <ModalBody pt={6} pb={8}>
          {getModalContent()}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BrokerConnectionModal;