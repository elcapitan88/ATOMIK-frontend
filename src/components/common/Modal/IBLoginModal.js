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
} from '@chakra-ui/react';
import { AlertTriangle, Info, Shield } from 'lucide-react';
import { ENVIRONMENTS } from '@/utils/constants/brokers';

const IBLoginModal = ({ isOpen, onClose, onConnect }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      // Call the onConnect function with the credentials and default to demo environment
      await onConnect({
        broker: 'interactivebrokers',
        environment: ENVIRONMENTS.DEMO, // Using demo as default
        credentials: {
          type: 'credentials',
          username,
          password
        }
      });
      
      // Clear form after successful submission
      setUsername('');
      setPassword('');
      
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
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent 
        bg="rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="xl"
        maxW="400px"
        color="white"
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.18)" 
          pb={4}
        >
          Connect to Interactive Brokers
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
              
              <Box width="100%" pt={4}>
                <Button
                  type="submit"
                  width="100%"
                  colorScheme="blue"
                  isLoading={isSubmitting}
                  loadingText="Connecting..."
                  bg="rgba(0, 198, 224, 0.7)"
                  _hover={{ bg: "rgba(0, 198, 224, 0.9)" }}
                >
                  Connect Account
                </Button>
              </Box>
            </VStack>
          </form>
          
          <Flex mt={6} alignItems="center" justifyContent="center" color="whiteAlpha.700">
            <Shield size={14} style={{ marginRight: '8px' }} />
            <Text fontSize="sm" textAlign="center">
              Your credentials are encrypted using industry-standard SSL/TLS protocols and never stored in plaintext.
            </Text>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default IBLoginModal;