import React, { useState, useEffect } from 'react';
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
  InputGroup,
  InputRightElement,
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';
import logger from '@/utils/logger';

// Motion components
const MotionBox = motion(Box);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

// Glass effect styling
const glassEffect = {
  background: "rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px 0 rgba(0, 198, 224, 0.37)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "xl",
};

const ResetPassword = () => {
  // State
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('idle'); // idle, validating, success, error
  const [errorMessage, setErrorMessage] = useState('');
  
  // Hooks
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Extract token from URL and validate on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get('token');
    
    if (!tokenFromUrl) {
      setStatus('error');
      setErrorMessage('No reset token provided. Please request a new password reset link.');
      return;
    }
    
    setToken(tokenFromUrl);
    setStatus('validating');
    
    // Validate token function
    const validateToken = async () => {
      try {
        // Basic token format validation (optional security measure)
        if (!/^[A-Za-z0-9_-]+$/.test(tokenFromUrl) || tokenFromUrl.length < 20) {
          throw new Error('Invalid token format');
        }
        
        // For better UX, we'll skip a separate validation call and
        // just show the form, trusting the actual reset endpoint
        // to validate the token when submitted
        setStatus('idle');
        
        // If you want to add an actual validation endpoint, uncomment this:
        /*
        await axiosInstance.post('/api/v1/auth/validate-token', {
          token: tokenFromUrl
        });
        setStatus('idle');
        */
      } catch (error) {
        logger.error('Token validation error:', error);
        setStatus('error');
        setErrorMessage(
          error.response?.data?.detail || 
          'Invalid or expired reset token. Please request a new password reset link.'
        );
      }
    };
    
    validateToken();
  }, [location]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'New password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Call API to reset password
      const response = await axiosInstance.post('/api/v1/auth/reset-password', {
        token: token,
        new_password: formData.password
      });
      
      // Handle success
      setStatus('success');
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 3000);
      
      logger.info('Password reset successful');
    } catch (error) {
      // Handle error
      logger.error('Password reset error:', error);
      
      setStatus('error');
      setErrorMessage(
        error.response?.data?.detail || 
        error.message || 
        'Failed to reset password. Please try again or request a new reset link.'
      );
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
    
    // Special validation for confirm password
    if (name === 'password' || name === 'confirmPassword') {
      if (
        (name === 'password' && formData.confirmPassword && value !== formData.confirmPassword) ||
        (name === 'confirmPassword' && value !== formData.password)
      ) {
        setErrors(prev => ({ ...prev, confirmPassword: "Passwords don't match" }));
      } else if (formData.confirmPassword || name === 'confirmPassword') {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // Success view
  if (status === 'success') {
    return (
      <MotionBox 
        minH="100vh" 
        bg="black" 
        py={16} 
        px={4}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        overflow="hidden"
        position="relative"
      >
        <Container maxW="lg" centerContent>
          <MotionBox variants={itemVariants} {...glassEffect} p={8} width="100%" maxW="450px" mt={12}>
            <VStack spacing={6} align="center">
              <Check size={60} color="#48BB78" />
              <Heading color="white" textAlign="center">Password Reset Successful</Heading>
              <Text color="whiteAlpha.800" textAlign="center">
                Your password has been updated successfully. You will be redirected to the login page.
              </Text>
              <Button
                as={RouterLink}
                to="/auth"
                colorScheme="blue"
                width="full"
                mt={4}
              >
                Go to Login
              </Button>
            </VStack>
          </MotionBox>
        </Container>
      </MotionBox>
    );
  }
  
  // Error view
  if (status === 'error') {
    return (
      <MotionBox 
        minH="100vh" 
        bg="black" 
        py={16} 
        px={4}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        overflow="hidden"
        position="relative"
      >
        <Container maxW="lg" centerContent>
          <MotionBox variants={itemVariants} {...glassEffect} p={8} width="100%" maxW="450px" mt={12}>
            <VStack spacing={6} align="center">
              <AlertCircle size={60} color="#FC8181" />
              <Heading color="white" textAlign="center">Reset Error</Heading>
              <Text color="whiteAlpha.800" textAlign="center">
                {errorMessage}
              </Text>
              <Button
                as={RouterLink}
                to="/auth"
                colorScheme="blue"
                width="full"
                mt={4}
              >
                Back to Login
              </Button>
            </VStack>
          </MotionBox>
        </Container>
      </MotionBox>
    );
  }
  
  // Loading view
  if (status === 'validating') {
    return (
      <MotionBox 
        minH="100vh" 
        bg="black" 
        py={16} 
        px={4}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="white">Validating reset token...</Text>
        </VStack>
      </MotionBox>
    );
  }

  // Form view
  return (
    <MotionBox 
      minH="100vh" 
      bg="black" 
      py={16} 
      px={4}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      overflow="hidden"
      position="relative"
    >
      {/* Background decorative elements */}
      <Box
        position="absolute"
        top="10%"
        left="5%"
        width="30%"
        height="30%"
        bgGradient="radial(circle, rgba(0,198,224,0.15) 0%, rgba(0,0,0,0) 70%)"
        filter="blur(50px)"
        zIndex={0}
      />
      
      <Box
        position="absolute"
        bottom="20%"
        right="10%"
        width="40%"
        height="40%"
        bgGradient="radial(circle, rgba(153,50,204,0.1) 0%, rgba(0,0,0,0) 70%)"
        filter="blur(60px)"
        zIndex={0}
      />
      
      <Container maxW="lg" centerContent position="relative" zIndex={1}>
        <MotionBox variants={itemVariants}>
          <Heading 
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="bold"
            color="white"
            textAlign="center"
            mb={6}
          >
            Reset Your Password
          </Heading>
        </MotionBox>
        
        <MotionBox 
          variants={itemVariants}
          {...glassEffect}
          p={8}
          width="100%"
          maxW="450px"
          mb={8}
        >
          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={6}>
              <FormControl isRequired isInvalid={!!errors.password}>
                <FormLabel color="white">New Password</FormLabel>
                <InputGroup>
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={formData.password}
                    onChange={handleChange}
                    bg="whiteAlpha.100"
                    color="white"
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    _hover={{ borderColor: "#00C6E0" }}
                    _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
                  />
                  <InputRightElement>
                    <Box 
                      as="button" 
                      type="button" 
                      onClick={togglePasswordVisibility} 
                      color="whiteAlpha.600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Box>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>
              
              <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                <FormLabel color="white">Confirm Password</FormLabel>
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  bg="whiteAlpha.100"
                  color="white"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  _hover={{ borderColor: "#00C6E0" }}
                  _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
                />
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>
              
              <Button
                type="submit"
                width="full"
                mt={4}
                bg="#00C6E0"
                color="black"
                _hover={{
                  bg: "cyan.400",
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg'
                }}
                size="lg"
                isLoading={isLoading}
                loadingText="Resetting Password..."
              >
                Reset Password
              </Button>
              
              <Button
                as={RouterLink}
                to="/auth"
                variant="ghost"
                width="full"
                color="whiteAlpha.800"
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Back to Login
              </Button>
            </VStack>
          </Box>
        </MotionBox>
        
        <MotionBox variants={itemVariants}>
          <Alert status="info" variant="left-accent" borderRadius="md" bg="rgba(0, 0, 0, 0.5)" maxW="md">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <AlertTitle color="white">Security Tip</AlertTitle>
              <AlertDescription color="whiteAlpha.800" fontSize="sm">
                Create a strong password that you don't use for other websites.
              </AlertDescription>
            </VStack>
          </Alert>
        </MotionBox>
      </Container>
    </MotionBox>
  );
};

export default ResetPassword;