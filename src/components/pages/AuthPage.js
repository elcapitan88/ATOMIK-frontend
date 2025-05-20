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
  Flex,
  InputGroup,
  InputRightElement,
  Link,
  Divider,
  Container,
  HStack,
  Badge,
  Image
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, LogIn, ArrowRight, ChevronRight, Shield, Lock } from 'lucide-react';
import logger from '@/utils/logger';
import axiosInstance from '@/services/axiosConfig';



// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionText = motion(Text);

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

const AuthPage = () => {
  // State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  
  // Hooks
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { login, isAuthenticated } = useAuth();
  
  // Check URL params for register flag to redirect to pricing
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('register')) {
      navigate('/pricing', { replace: true });
    }
  }, [location, navigate]);

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!forgotPassword && !formData.password) {
      newErrors.password = 'Password is required';
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
    
    // Handle forgot password request
    if (forgotPassword) {
      try {
        // Make API call to request password reset
        await axiosInstance.post('/api/v1/auth/forgot-password', {
          email: formData.email
        });
        
        // Always show success message regardless of whether email exists (security best practice)
        toast({
          title: 'Password Reset Email Sent',
          description: `If ${formData.email} is registered, you'll receive reset instructions shortly`,
          status: 'success',
          duration: 5000,
        });
        
        // Reset form to login mode
        setForgotPassword(false);
        
        // Log for debugging only
        logger.info(`Password reset requested for: ${formData.email}`);
      } catch (error) {
        // Log error but don't expose details to user
        logger.error('Password reset request error:', error);
        
        toast({
          title: 'Request Processing Error',
          description: 'Unable to process your request at this time. Please try again later.',
          status: 'error',
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // Handle login
    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      });
  
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }
      
      // Successful login is handled by the auth context (redirect to dashboard)
      
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password',
        status: 'error',
        duration: 5000,
      });
      logger.error('Login error:', error);
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
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  
  // Toggle between login and forgot password
  const toggleForgotPassword = () => {
    setForgotPassword(!forgotPassword);
    setErrors({});
  };

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
      {/* Background decorative elements - match PricingPage */}
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
      
      <Container maxW="container.xl" position="relative" zIndex={1}>
        <Flex 
          justifyContent="center" 
          alignItems="center" 
          minH="calc(100vh - 8rem)"
          flexDirection="column"
        >
          <MotionBox variants={itemVariants}>
            <Heading 
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="bold"
              color="white"
              textAlign="center"
              mb={3}
            >
              Welcome to <Text as="span" color="#00C6E0">Atomik Trading</Text>
            </Heading>
          </MotionBox>
          
          <MotionBox 
            variants={itemVariants}
            {...glassEffect}
            p={8}
            width="100%"
            maxW="450px"
            my={8}
          >
            <VStack spacing={6} align="stretch">
              <Heading 
                size="lg" 
                fontWeight="bold" 
                color="white" 
                textAlign="center"
              >
                {forgotPassword ? 'Reset Your Password' : 'Sign In'}
              </Heading>
              
              <Text color="whiteAlpha.700" textAlign="center" fontSize="md">
                {forgotPassword 
                  ? "Enter your email and we'll send you password reset instructions" 
                  : 'Access your trading dashboard and automations'}
              </Text>
              
              <Box as="form" onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired isInvalid={!!errors.email}>
                    <FormLabel color="white">Email</FormLabel>
                    <Input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      bg="whiteAlpha.100"
                      color="white"
                      border="1px solid"
                      borderColor="whiteAlpha.300"
                      _hover={{ borderColor: "#00C6E0" }}
                      _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>
                  
                  <AnimatePresence>
                    {!forgotPassword && (
                      <MotionBox 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        width="100%"
                      >
                        <FormControl isRequired isInvalid={!!errors.password}>
                          <FormLabel color="white">Password</FormLabel>
                          <InputGroup>
                            <Input
                              name="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Your password"
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
                      </MotionBox>
                    )}
                  </AnimatePresence>
                  
                  <Button
                    type="submit"
                    width="full"
                    mt={2}
                    bg={forgotPassword ? "#9932CC" : "#00C6E0"}
                    color="black"
                    _hover={{
                      bg: forgotPassword ? "purple.400" : "cyan.400",
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg'
                    }}
                    size="lg"
                    isLoading={isLoading}
                    loadingText={forgotPassword ? "Sending..." : "Signing In..."}
                    rightIcon={<ChevronRight size={16} />}
                  >
                    {forgotPassword ? 'Send Reset Link' : 'Sign In'}
                  </Button>
                </VStack>
              </Box>

              <Flex justify="center">
                <Button
                  variant="link"
                  color="#00C6E0"
                  onClick={toggleForgotPassword}
                  _hover={{ textDecoration: "underline" }}
                  size="sm"
                >
                  {forgotPassword ? 'Back to Sign In' : 'Forgot Password?'}
                </Button>
              </Flex>
              
              <Divider borderColor="whiteAlpha.200" />
              
              <VStack spacing={4}>
                <Text color="whiteAlpha.700" textAlign="center">
                  Don't have an account yet?
                </Text>
                
                <Button
                  onClick={() => window.location.href = '/pricing?source=auth&register=true'}
                  width="full"
                  bg="whiteAlpha.200"
                  color="white"
                  _hover={{
                    bg: 'whiteAlpha.300',
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg'
                  }}
                  rightIcon={<ArrowRight size={16} />}
                >
                  View Plans & Sign Up
                </Button>
              </VStack>
            </VStack>
          </MotionBox>
          
          {/* Security badges - matching PricingPage */}
          <MotionBox 
            variants={itemVariants}
            mt={8}
          >
            <HStack 
              spacing={6} 
              justify="center" 
              color="whiteAlpha.700"
              borderRadius="full"
              bg="rgba(0, 0, 0, 0.3)"
              px={6}
              py={3}
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Flex align="center">
                <Shield size={18} />
                <Text ml={2} fontSize="sm">Secure Login</Text>
              </Flex>
              
              <Flex align="center">
                <Lock size={18} />
                <Text ml={2} fontSize="sm">256-bit Encryption</Text>
              </Flex>
            </HStack>
          </MotionBox>
        </Flex>
      </Container>
    </MotionBox>
  );
};

export default AuthPage;