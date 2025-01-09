import React, { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import authService from '@/services/auth/authService';
import axiosInstance from '@/services/axiosConfig';
import { debounce } from 'lodash';

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
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Debounced username check
  const checkUsername = useCallback(
    debounce(async (username) => {
      if (!username || username.length < 3) return;
      
      setIsCheckingUsername(true);
      try {
        const response = await axiosInstance.get(`/api/v1/auth/check-username/${username}`);
        if (response.data.exists) {
          setErrors(prev => ({
            ...prev,
            username: "This username is already taken"
          }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.username;
            return newErrors;
          });
        }
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500),
    [setErrors, setIsCheckingUsername]
  );

  // Effect to check username availability
  useEffect(() => {
    if (!isLogin && username && username.length >= 3) {
      checkUsername(username);
    }
    return () => checkUsername.cancel();
  }, [username, isLogin, checkUsername]);

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (!isLogin && !username) newErrors.username = 'Username is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        await authService.login(email, password);
        login();
        toast({
          title: "Login Successful",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        navigate('/dashboard');
      } else {
        try {
          await authService.register(username, email, password);
          toast({
            title: "Registration Successful",
            description: "Please login with your credentials",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          setIsLogin(true);
        } catch (error) {
          if (error.response?.data?.detail) {
            if (error.response.data.detail.includes("username is already taken")) {
              setErrors(prev => ({ ...prev, username: "This username is already taken" }));
            } else if (error.response.data.detail.includes("email already exists")) {
              setErrors(prev => ({ ...prev, email: "This email is already registered" }));
            } else {
              toast({
                title: "Registration Failed",
                description: error.response.data.detail,
                status: "error",
                duration: 5000,
                isClosable: true,
              });
            }
          } else {
            toast({
              title: "Registration Failed",
              description: "An unexpected error occurred",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
        }
      }
    } catch (error) {
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
        <VStack spacing={4} align="stretch">
          <Heading color="white" textAlign="center">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              {!isLogin && (
                <FormControl isInvalid={!!errors.username}>
                  <FormLabel color="white">Username</FormLabel>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.username;
                          return newErrors;
                        });
                      }
                    }}
                    bg="whiteAlpha.200"
                    color="white"
                    borderColor="whiteAlpha.400"
                    _hover={{ borderColor: "whiteAlpha.500" }}
                    _focus={{ borderColor: "blue.300", boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.6)" }}
                    isDisabled={isCheckingUsername}
                  />
                  <FormErrorMessage>{errors.username}</FormErrorMessage>
                </FormControl>
              )}
              <FormControl isInvalid={!!errors.email}>
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
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.password}>
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
                <FormErrorMessage>{errors.password}</FormErrorMessage>
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
                isLoading={isLoading || isCheckingUsername}
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
                <Box as="span" position="relative" zIndex={1}>
                  {isLogin ? 'Login' : 'Register'}
                </Box>
              </Button>
            </VStack>
          </form>
          <VStack spacing={2}>
            <Text 
              color="white" 
              textAlign="center" 
              cursor="pointer" 
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setUsername('');
                setEmail('');
                setPassword('');
              }}
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </Text>
            {isLogin && (
              <Text
                color="blue.300"
                fontSize="sm"
                textAlign="center"
                cursor="pointer"
                _hover={{ textDecoration: "underline" }}
                onClick={() => navigate('/auth/reset-password')}
              >
                Forgot your password?
              </Text>
            )}
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default AuthPage;