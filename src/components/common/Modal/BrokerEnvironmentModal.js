import React from 'react';
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
  useToast,
  Icon,
  Badge,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { AlertTriangle, Shield, TrendingUp, Zap } from 'lucide-react';
import { doesBrokerSupportEnvironment } from '@/utils/constants/brokers';
import { brokerAuthService } from '@/services/api/auth/brokerAuth';

const EnvironmentOption = ({ title, onClick, isDisabled = false }) => {
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
              ? 'For funded programs and demo trading' 
              : 'Trade with real capital'
            }
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};

const ErrorDisplay = ({ error }) => (
  <VStack spacing={4} align="center" py={8}>
    <AlertTriangle size={24} color="#F56565" />
    <Text color="red.400" textAlign="center">{error?.message || error?.toString() || error}</Text>
  </VStack>
);

const BrokerEnvironmentModal = ({ isOpen, onClose, selectedBroker, onEnvironmentSelect }) => {
  const toast = useToast();

  const handleEnvironmentSelection = async (environment) => {
    try {
      console.log('Initiating broker connection:', { 
        broker: selectedBroker?.id, 
        environment 
      });

      if (!selectedBroker) {
        throw new Error('No broker selected');
      }

      // Call broker service to initiate OAuth
      const response = await brokerAuthService.initiateTradovateOAuth(environment);
      console.log('OAuth initialization response:', response);

      if (response?.auth_url) {
        // Store selection in sessionStorage for after redirect
        sessionStorage.setItem('selected_broker', JSON.stringify({
          id: selectedBroker.id,
          environment: environment,
          timestamp: Date.now()
        }));

        // Redirect to OAuth page
        window.location.href = response.auth_url;
      } else {
        throw new Error('No authentication URL received');
      }

      onClose();
    } catch (error) {
      console.error('OAuth initiation error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('already connected')) {
        toast({
          title: "Account Already Connected",
          description: "This account is already connected and active.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Connection Error",
          description: error.message || "Failed to connect to trading environment",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  if (!selectedBroker) return null;

  const environments = ['Demo', 'Live'];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
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
        >
          <HStack spacing={3}>
            <Icon as={Zap} size="20px" color="#00C6E0" />
            <Text>Select Environment for {selectedBroker.name}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pt={6} pb={8}>
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
                  Choose your {selectedBroker.name} environment
                </Text>
                <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                  Demo accounts are required for funded programs. You can connect to both environments.
                </Text>
              </VStack>
            </Alert>
            
            <HStack spacing={4} justify="center" w="full">
              {environments.map((env) => (
                <EnvironmentOption
                  key={env}
                  title={env}
                  onClick={() => handleEnvironmentSelection(env.toLowerCase())}
                  isDisabled={!doesBrokerSupportEnvironment(selectedBroker.id, env.toLowerCase())}
                />
              ))}
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BrokerEnvironmentModal;