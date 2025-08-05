import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Box,
  Input,
  FormControl,
  FormLabel,
  Button,
  useToast,
  Flex,
  HStack,
  Icon,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { AlertTriangle, Info, Shield, Building2, Lock } from 'lucide-react';
import { ENVIRONMENTS } from '@/utils/constants/brokers';

const IBLoginModal = ({ isOpen, onClose, onConnect }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [environment, setEnvironment] = useState(ENVIRONMENTS.PAPER); // Default to paper
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the onConnect function with the credentials and selected environment
      await onConnect({
        broker: 'interactivebrokers',
        environment: environment,
        credentials: {
          type: 'credentials',
          username,
          password
        }
      });
      
      // Clear form after successful submission
      setUsername('');
      setPassword('');
      setEnvironment(ENVIRONMENTS.PAPER);
      
      // The modal will be closed by the parent component after successful connection
    } catch (error) {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to Interactive Brokers",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered
      closeOnOverlayClick={!isSubmitting}
    >
      <ModalOverlay 
        bg="blackAlpha.300" 
        backdropFilter="blur(10px)" 
      />
      <ModalContent 
        bg="rgba(0, 0, 0, 0.75)"
        backdropFilter="blur(10px)"
        boxShadow={environment === ENVIRONMENTS.PAPER 
          ? "0 8px 32px 0 rgba(255, 0, 0, 0.37)" 
          : "0 8px 32px 0 rgba(0, 123, 255, 0.37)"
        }
        border={environment === ENVIRONMENTS.PAPER 
          ? "2px solid rgba(255, 0, 0, 0.6)" 
          : "2px solid rgba(0, 123, 255, 0.6)"
        }
        borderRadius="xl"
        maxW="500px"
        color="white"
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.1)" 
          pb={4}
        >
          <HStack spacing={3}>
            <Icon as={Building2} size="20px" color="#00C6E0" />
            <Text>Connect to Interactive Brokers</Text>
          </HStack>
        </ModalHeader>
        {!isSubmitting && <ModalCloseButton color="white" />}
        
        <ModalBody pt={6} pb={8}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your IB username"
                  bg="whiteAlpha.100"
                  border="1px solid rgba(255, 255, 255, 0.18)"
                  _hover={{ borderColor: "rgba(255, 255, 255, 0.3)" }}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your IB password"
                  bg="whiteAlpha.100"
                  border="1px solid rgba(255, 255, 255, 0.18)"
                  _hover={{ borderColor: "rgba(255, 255, 255, 0.3)" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Trading Environment</FormLabel>
                <HStack spacing={0} width="100%">
                  <Button
                    onClick={() => setEnvironment(ENVIRONMENTS.PAPER)}
                    flex={1}
                    size="md"
                    variant={environment === ENVIRONMENTS.PAPER ? "solid" : "outline"}
                    bg={environment === ENVIRONMENTS.PAPER ? "red.500" : "transparent"}
                    color={environment === ENVIRONMENTS.PAPER ? "white" : "red.300"}
                    borderColor="red.500"
                    borderRightRadius={0}
                    _hover={{
                      bg: environment === ENVIRONMENTS.PAPER ? "red.600" : "red.500",
                      color: "white"
                    }}
                  >
                    Paper Trading
                  </Button>
                  <Button
                    onClick={() => setEnvironment(ENVIRONMENTS.LIVE)}
                    flex={1}
                    size="md"
                    variant={environment === ENVIRONMENTS.LIVE ? "solid" : "outline"}
                    bg={environment === ENVIRONMENTS.LIVE ? "blue.500" : "transparent"}
                    color={environment === ENVIRONMENTS.LIVE ? "white" : "blue.300"}
                    borderColor="blue.500"
                    borderLeftRadius={0}
                    _hover={{
                      bg: environment === ENVIRONMENTS.LIVE ? "blue.600" : "blue.500",
                      color: "white"
                    }}
                  >
                    Live Trading
                  </Button>
                </HStack>
              </FormControl>
              
                <Box width="100%" pt={4}>
                  <Button
                    type="submit"
                    width="100%"
                    colorScheme={environment === ENVIRONMENTS.PAPER ? "red" : "blue"}
                    isLoading={isSubmitting}
                    loadingText="Connecting..."
                    bg={environment === ENVIRONMENTS.PAPER ? "red.500" : "blue.500"}
                    _hover={{ 
                      bg: environment === ENVIRONMENTS.PAPER ? "red.600" : "blue.600" 
                    }}
                    size="md"
                    fontWeight="semibold"
                  >
                    Connect to {environment === ENVIRONMENTS.PAPER ? "Paper" : "Live"} Account
                  </Button>
                </Box>
              </VStack>
            </form>
            
            <Box 
              p={3} 
              bg="rgba(255, 255, 255, 0.05)" 
              borderRadius="md" 
              border="1px solid rgba(255, 255, 255, 0.1)"
              w="full"
            >
              <HStack spacing={3}>
                <Icon as={Lock} size="16px" color="#00C6E0" />
                <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)">
                  Your credentials are encrypted and never stored in plaintext
                </Text>
              </HStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default IBLoginModal;