import React, { useState, useCallback } from 'react';
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
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const glassEffect = {
  background: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px 0 rgba(0, 198, 224, 0.37)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  borderRadius: "xl",
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const isFormValid = useCallback(() => {
    if (isLogin) {
      return email.trim() !== '' && password.trim() !== '';
    } else {
      return username.trim() !== '' && email.trim() !== '' && password.trim() !== '';
    }
  }, [isLogin, email, password, username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Form submitted:', { email, password, username });  // Debug log

      const endpoint = isLogin ? '/api/auth/login/' : '/api/auth/register/';
      const payload = isLogin ? { email, password } : { username, email, password };

      const response = await axios.post(
        `http://localhost:8000${endpoint}`, 
        payload,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Response:', response.data);  // Debug log
        
      // Store access token
      localStorage.setItem('access_token', response.data.tokens.access);
        
      toast({
        title: isLogin ? "Login Successful" : "Registration Successful",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Add a small delay before navigation
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);

    } catch (error) {
      console.error('Auth error:', error.response || error);  // Debug log
      
      toast({
        title: "Authentication Error",
        description: error.response?.data?.message || error.message || "An error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
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
        <VStack spacing={4} align="stretch">
          <Heading color="white" textAlign="center">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              {!isLogin && (
                <FormControl>
                  <FormLabel color="white">Username</FormLabel>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    bg="whiteAlpha.200"
                    color="white"
                    borderColor="whiteAlpha.400"
                    _hover={{ borderColor: "whiteAlpha.500" }}
                    _focus={{ borderColor: "blue.300", boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.6)" }}
                  />
                </FormControl>
              )}
              <FormControl>
                <FormLabel color="white">Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  bg="whiteAlpha.200"
                  color="white"
                  borderColor="whiteAlpha.400"
                  _hover={{ borderColor: "whiteAlpha.500" }}
                  _focus={{ borderColor: "blue.300", boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.6)" }}
                />
              </FormControl>
              <FormControl>
                <FormLabel color="white">Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  bg="whiteAlpha.200"
                  color="white"
                  borderColor="whiteAlpha.400"
                  _hover={{ borderColor: "whiteAlpha.500" }}
                  _focus={{ borderColor: "blue.300", boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.6)" }}
                />
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
                isDisabled={!isFormValid()}
              >
                <Box as="span" position="relative" zIndex={1}>
                  {isLogin ? 'Login' : 'Register'}
                </Box>
              </Button>
            </VStack>
          </form>
          <Text 
            color="white" 
            textAlign="center" 
            cursor="pointer" 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default AuthPage;