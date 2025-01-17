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
} from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';
import { useOAuth } from '@/hooks/useOAuth';

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

const BrokerConnectionModal = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { initiateBrokerAuth } = useOAuth();
  const toast = useToast();

  const handleBrokerSelection = async (environment) => {
    try {
      setIsSubmitting(true);
      await initiateBrokerAuth('tradovate', environment);
      
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
        boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="xl"
        maxW="400px"
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.18)" 
          pb={4}
          color="white"
        >
          Connect Trading Account
        </ModalHeader>
        {!isSubmitting && <ModalCloseButton color="white" />}
        
        <ModalBody pt={6} pb={8}>
          {isSubmitting ? (
            <LoadingDisplay />
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