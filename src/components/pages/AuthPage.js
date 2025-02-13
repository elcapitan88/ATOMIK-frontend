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
  FormErrorMessage,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { debounce } from 'lodash';
import logger from '@/utils/logger';

const MotionBox = motion(Box);

const glassEffect = {
  background: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px 0 rgba(0, 198, 224, 0.37)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  borderRadius: "xl",
};

const AuthPage = () => {
  // State management
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Hooks
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { login, register } = useAuth();

  // Check URL params for register flag
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('register')) {
      setIsLogin(false);
    }
  }, [location]);

  // Username availability check
  const checkUsername = useCallback(
    debounce(async (username) => {
      if (!username || username.length < 3) return;
      
      setIsCheckingUsername(true);
      try {
        const response = await fetch(`/api/v1/auth/check-username/${username}`);
        const data = await response.json();
        
        if (data.exists) {
          setErrors(prev => ({
            ...prev,
            username: "Username already taken"
          }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.username;
            return newErrors;
          });
        }
      } catch (error) {
        logger.error('Username check error:', error);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500),
    []
  );

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!isLogin && !formData.username) newErrors.username = 'Username is required';
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const success = await login({
          email: formData.email,
          password: formData.password
        });

        if (!success) {
          throw new Error('Login failed');
        }
      } else {
        const success = await register({
          email: formData.email,
          password: formData.password,
          username: formData.username
        });

        if (!success) {
          throw new Error('Registration failed');
        }
      }
    } catch (error) {
      toast({
        title: isLogin ? 'Login Failed' : 'Registration Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Check username availability
    if (name === 'username' && value.length >= 3) {
      checkUsername(value);
    }
  };

  return (
    <MotionBox
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <MotionBox
        {...glassEffect}
        p={8}
        width="100%"
        maxWidth="400px"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <VStack spacing={4} align="stretch">
          <Heading color="white" textAlign="center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Heading>
          
          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={4}>
              {!isLogin && (
                <FormControl isInvalid={!!errors.username}>
                  <FormLabel color="white">Username</FormLabel>
                  <Input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    bg="whiteAlpha.200"
                    color="white"
                    isDisabled={isCheckingUsername}
                  />
                  <FormErrorMessage>{errors.username}</FormErrorMessage>
                </FormControl>
              )}
              
              <FormControl isInvalid={!!errors.email}>
                <FormLabel color="white">Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  bg="whiteAlpha.200"
                  color="white"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.password}>
                <FormLabel color="white">Password</FormLabel>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  bg="whiteAlpha.200"
                  color="white"
                />
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>
              
              <Button
                type="submit"
                width="full"
                isLoading={isLoading || isCheckingUsername}
                loadingText={isLogin ? "Logging in..." : "Creating account..."}
                colorScheme="blue"
              >
                {isLogin ? 'Login' : 'Create Account'}
              </Button>
            </VStack>
          </Box>

          <Text 
            color="white" 
            textAlign="center" 
            cursor="pointer"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({});
              setFormData({ email: '', password: '', username: '' });
            }}
          >
            {isLogin 
              ? "Don't have an account? Register" 
              : "Already have an account? Login"}
          </Text>
        </VStack>
      </MotionBox>
    </MotionBox>
  );
};

export default AuthPage;