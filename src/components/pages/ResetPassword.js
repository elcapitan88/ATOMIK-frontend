// src/components/pages/ResetPassword.js
import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/auth/authService';

const glassEffect = {
  background: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px 0 rgba(0, 198, 224, 0.37)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  borderRadius: "xl",
};

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.requestPasswordReset(email);
      setIsSubmitted(true);
      toast({
        title: "Reset Link Sent",
        description: "Check your email for password reset instructions",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bg="black">
      <Box
        {...glassEffect}
        p={8}
        width="100%"
        maxWidth="400px"
      >
        <VStack spacing={6} align="stretch">
          <Heading color="white" textAlign="center" size="lg">
            Reset Password
          </Heading>
          
          {!isSubmitted ? (
            <>
              <Text color="whiteAlpha.800" fontSize="sm" textAlign="center">
                Enter your email address and we'll send you instructions to reset your password.
              </Text>
              
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isInvalid={!!error}>
                    <FormLabel color="white">Email Address</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      bg="whiteAlpha.200"
                      color="white"
                      borderColor="whiteAlpha.400"
                      _hover={{ borderColor: "whiteAlpha.500" }}
                      _focus={{ borderColor: "blue.300", boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.6)" }}
                    />
                    <FormErrorMessage>{error}</FormErrorMessage>
                  </FormControl>
                  
                  <Button
                    type="submit"
                    width="full"
                    bg="transparent"
                    color="white"
                    fontWeight="medium"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="rgba(0, 198, 224, 1)"
                    position="relative"
                    overflow="hidden"
                    isLoading={isLoading}
                    _before={{
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bg: 'linear-gradient(90deg, transparent, rgba(0, 198, 224, 1) 20%, rgba(0, 198, 224, 1) 80%, transparent)',
                      opacity: 0.3,
                    }}
                    _hover={{
                      _before: {
                        opacity: 0.5,
                      }
                    }}
                    _active={{
                      _before: {
                        opacity: 0.7,
                      }
                    }}
                  >
                    Send Reset Link
                  </Button>
                </VStack>
              </form>
            </>
          ) : (
            <VStack spacing={4}>
              <Text color="green.400" textAlign="center">
                If an account exists with this email, you will receive password reset instructions shortly.
              </Text>
              <Text color="whiteAlpha.800" fontSize="sm" textAlign="center">
                Don't forget to check your spam folder.
              </Text>
            </VStack>
          )}
          
          <Text 
            color="white" 
            textAlign="center" 
            cursor="pointer" 
            fontSize="sm"
            onClick={() => navigate('/auth')}
          >
            Back to Login
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default ResetPassword;