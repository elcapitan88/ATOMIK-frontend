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
  Icon,
  Badge,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { AlertTriangle, Zap, TrendingUp, Shield, Users } from 'lucide-react';
import { useOAuth } from '@/hooks/useOAuth';

const BrokerOption = ({ title, onClick, isDisabled = false }) => {
  const isDemoMode = title.toLowerCase() === 'demo';
  const icon = isDemoMode ? Shield : TrendingUp;
  const badgeColor = isDemoMode ? 'green' : 'yellow';
  const badgeText = isDemoMode ? 'Safe Practice' : 'Real Money';
  
  return (
    <Box
      as="button"
      onClick={onClick}
      disabled={isDisabled}
      p={4}
      borderRadius="lg"
      border="2px solid"
      borderColor={isDisabled ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.1)"}
      bg="rgba(255, 255, 255, 0.05)"
      backdropFilter="blur(10px)"
      transition="all 0.3s ease"
      _hover={!isDisabled ? {
        borderColor: "#00C6E0",
        bg: "rgba(0, 198, 224, 0.08)",
        transform: "translateY(-2px)",
        boxShadow: "0 8px 25px 0 rgba(0, 0, 0, 0.3)"
      } : {}}
      _disabled={{ 
        opacity: 0.5, 
        cursor: 'not-allowed'
      }}
      position="relative"
      w="full"
      maxW="200px"
    >
      <VStack spacing={3}>
        <Box position="relative">
          <Box
            w="60px"
            h="60px"
            bg="rgba(0, 198, 224, 0.15)"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="#00C6E0"
          >
            <Icon as={icon} size="24px" />
          </Box>
          <Badge
            position="absolute"
            top="-8px"
            right="-8px"
            colorScheme={badgeColor}
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="full"
          >
            {badgeText}
          </Badge>
        </Box>
        
        <VStack spacing={1}>
          <Text fontSize="md" fontWeight="semibold" color="white">
            {title} Trading
          </Text>
          <Text fontSize="xs" color="rgba(255, 255, 255, 0.7)" textAlign="center">
            {isDemoMode 
              ? 'Practice with virtual funds' 
              : 'Trade with real capital'
            }
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};

const ErrorDisplay = ({ error, onRetry }) => (
  <VStack spacing={4} align="center" py={8}>
    <AlertTriangle size={24} color="#F56565" />
    <Text color="red.400" textAlign="center">{error?.message || error?.toString() || error}</Text>
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
    <Box position="relative">
      <Spinner size="xl" color="#00C6E0" thickness="3px" />
      <Icon 
        as={Zap} 
        position="absolute" 
        top="50%" 
        left="50%" 
        transform="translate(-50%, -50%)" 
        size="20px" 
        color="#00C6E0" 
      />
    </Box>
    <VStack spacing={1}>
      <Text color="white" fontWeight="medium">Connecting to Trading Account</Text>
      <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">Please wait while we establish your connection...</Text>
    </VStack>
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
      <ModalOverlay 
        bg="blackAlpha.300" 
        backdropFilter="blur(10px)" 
      />
      <ModalContent 
        bg="rgba(0, 0, 0, 0.75)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.5)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        borderRadius="xl"
        maxW="500px"
        color="white"
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.1)" 
          pb={4}
          color="white"
        >
          <HStack spacing={3}>
            <Icon as={Zap} size="20px" color="#00C6E0" />
            <Text>Connect Trading Account</Text>
          </HStack>
        </ModalHeader>
        {!isSubmitting && <ModalCloseButton color="white" />}
        
        <ModalBody pt={6} pb={8}>
          {isSubmitting ? (
            <LoadingDisplay />
          ) : (
            <VStack spacing={6}>
              <Alert
                status="info"
                bg="rgba(66, 153, 225, 0.1)"
                border="1px solid rgba(66, 153, 225, 0.3)"
                borderRadius="md"
                color="white"
              >
                <AlertIcon color="blue.300" />
                <VStack spacing={1} align="flex-start">
                  <Text fontSize="sm" fontWeight="medium">
                    Choose your trading environment
                  </Text>
                  <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                    Demo accounts are perfect for learning and testing strategies
                  </Text>
                </VStack>
              </Alert>
              
              <HStack spacing={4} justify="center" w="full">
                <BrokerOption 
                  title="Demo" 
                  onClick={() => handleBrokerSelection('demo')}
                />
                <BrokerOption 
                  title="Live" 
                  onClick={() => handleBrokerSelection('live')}
                />
              </HStack>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BrokerConnectionModal;