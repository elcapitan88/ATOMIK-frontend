import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
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
  Container,
  HStack,
  Image,
  keyframes,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ChevronRight, Shield, Lock, ArrowRight, Zap, BarChart3, Users } from 'lucide-react';
import logger from '@/utils/logger';
import axiosInstance from '@/services/axiosConfig';
import MaintenanceBanner from '@/components/common/MaintenanceBanner';
import ParticleBackground from './Homepage/ParticleBackground';

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// Logo glow pulse
const glowPulse = keyframes`
  0%, 100% { filter: drop-shadow(0 0 8px rgba(0, 198, 224, 0.3)); }
  50% { filter: drop-shadow(0 0 20px rgba(0, 198, 224, 0.6)); }
`;

const AuthPage = () => {
  // ─── State ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('signin');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  // ─── Hooks ──────────────────────────────────────────────────────────
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();

  // Check URL params for register flag
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('register')) {
      setActiveTab('signup');
    }
  }, [location]);

  // ─── Validation ─────────────────────────────────────────────────────
  const validateForm = useCallback(() => {
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
  }, [formData, forgotPassword]);

  // ─── Handlers ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    if (forgotPassword) {
      try {
        await axiosInstance.post('/api/v1/auth/forgot-password', {
          email: formData.email,
        });
        toast({
          title: 'Password Reset Email Sent',
          description: `If ${formData.email} is registered, you'll receive reset instructions shortly`,
          status: 'success',
          duration: 5000,
        });
        setForgotPassword(false);
        logger.info(`Password reset requested for: ${formData.email}`);
      } catch (error) {
        logger.error('Password reset request error:', error);
        toast({
          title: 'Request Processing Error',
          description: 'Unable to process your request. Please try again later.',
          status: 'error',
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const toggleForgotPassword = () => {
    setForgotPassword(!forgotPassword);
    setErrors({});
  };

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <>
      <MaintenanceBanner />
      <MotionBox
        minH="100vh"
        bg="black"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={4}
        py={12}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        overflow="hidden"
        position="relative"
      >
        {/* Particle background — same as homepage */}
        <Box position="absolute" inset="0" zIndex={0} pointerEvents="none">
          <ParticleBackground />
        </Box>

        {/* Single cyan radial gradient */}
        <Box
          position="absolute"
          top="5%"
          left="10%"
          width="40%"
          height="40%"
          bgGradient="radial(circle, rgba(0,198,224,0.04) 0%, rgba(0,0,0,0) 70%)"
          filter="blur(80px)"
          zIndex={0}
        />

        <Container maxW="420px" position="relative" zIndex={1}>
          <VStack spacing={6}>
            {/* Logo with glow pulse */}
            <MotionBox variants={itemVariants}>
              <Image
                src="/logos/atomik-logo.svg"
                alt="Atomik Trading"
                h={{ base: '32px', md: '38px' }}
                mx="auto"
                animation={`${glowPulse} 3s ease-in-out infinite`}
              />
            </MotionBox>

            {/* Glass card */}
            <MotionBox
              variants={itemVariants}
              w="100%"
              bg="rgba(255, 255, 255, 0.06)"
              backdropFilter="blur(12px)"
              border="1px solid"
              borderColor="whiteAlpha.100"
              borderRadius="xl"
              boxShadow="0 8px 32px rgba(0, 198, 224, 0.12)"
              overflow="hidden"
            >
              {/* Tab switcher — matches TradingPanel pattern */}
              <Flex
                px={4}
                pt={4}
                pb={0}
              >
                <ButtonGroup size="sm" isAttached variant="ghost" spacing={0} w="100%">
                  <Button
                    flex="1"
                    onClick={() => { setActiveTab('signin'); setForgotPassword(false); setErrors({}); }}
                    bg={activeTab === 'signin' ? 'whiteAlpha.200' : 'transparent'}
                    color={activeTab === 'signin' ? 'white' : 'whiteAlpha.500'}
                    _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                    fontWeight={activeTab === 'signin' ? 'semibold' : 'normal'}
                    borderRadius="md"
                    fontSize="sm"
                  >
                    Sign In
                  </Button>
                  <Button
                    flex="1"
                    onClick={() => { setActiveTab('signup'); setForgotPassword(false); setErrors({}); }}
                    bg={activeTab === 'signup' ? 'whiteAlpha.200' : 'transparent'}
                    color={activeTab === 'signup' ? 'white' : 'whiteAlpha.500'}
                    _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                    fontWeight={activeTab === 'signup' ? 'semibold' : 'normal'}
                    borderRadius="md"
                    fontSize="sm"
                  >
                    Sign Up
                  </Button>
                </ButtonGroup>
              </Flex>

              {/* Content */}
              <Box p={6} pt={5}>
                <AnimatePresence mode="wait">
                  {activeTab === 'signin' ? (
                    <MotionBox
                      key="signin"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <VStack spacing={5} align="stretch">
                        <VStack spacing={1}>
                          <Heading size="md" color="white" fontWeight="bold">
                            {forgotPassword ? 'Reset Password' : 'Welcome back'}
                          </Heading>
                          <Text fontSize="sm" color="whiteAlpha.600">
                            {forgotPassword
                              ? 'Enter your email for reset instructions'
                              : 'Sign in to your trading dashboard'}
                          </Text>
                        </VStack>

                        <Box as="form" onSubmit={handleSubmit}>
                          <VStack spacing={4}>
                            <FormControl isRequired isInvalid={!!errors.email}>
                              <FormLabel fontSize="xs" color="whiteAlpha.600" mb={1}>
                                Email
                              </FormLabel>
                              <Input
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                bg="whiteAlpha.100"
                                color="white"
                                border="1px solid"
                                borderColor="whiteAlpha.200"
                                size="md"
                                _hover={{ borderColor: 'whiteAlpha.300' }}
                                _focus={{
                                  borderColor: '#00C6E0',
                                  boxShadow: '0 0 0 1px #00C6E0',
                                }}
                                _placeholder={{ color: 'whiteAlpha.400' }}
                              />
                              <FormErrorMessage fontSize="xs">{errors.email}</FormErrorMessage>
                            </FormControl>

                            <AnimatePresence>
                              {!forgotPassword && (
                                <MotionBox
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  width="100%"
                                  overflow="hidden"
                                >
                                  <FormControl isRequired isInvalid={!!errors.password}>
                                    <Flex justify="space-between" align="center" mb={1}>
                                      <FormLabel fontSize="xs" color="whiteAlpha.600" mb={0}>
                                        Password
                                      </FormLabel>
                                      <Button
                                        variant="link"
                                        size="xs"
                                        color="whiteAlpha.500"
                                        fontWeight="normal"
                                        _hover={{ color: '#00C6E0' }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          toggleForgotPassword();
                                        }}
                                      >
                                        Forgot?
                                      </Button>
                                    </Flex>
                                    <InputGroup>
                                      <Input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        bg="whiteAlpha.100"
                                        color="white"
                                        border="1px solid"
                                        borderColor="whiteAlpha.200"
                                        size="md"
                                        _hover={{ borderColor: 'whiteAlpha.300' }}
                                        _focus={{
                                          borderColor: '#00C6E0',
                                          boxShadow: '0 0 0 1px #00C6E0',
                                        }}
                                        _placeholder={{ color: 'whiteAlpha.400' }}
                                      />
                                      <InputRightElement>
                                        <Box
                                          as="button"
                                          type="button"
                                          onClick={() => setShowPassword(!showPassword)}
                                          color="whiteAlpha.500"
                                          _hover={{ color: 'whiteAlpha.800' }}
                                        >
                                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </Box>
                                      </InputRightElement>
                                    </InputGroup>
                                    <FormErrorMessage fontSize="xs">{errors.password}</FormErrorMessage>
                                  </FormControl>
                                </MotionBox>
                              )}
                            </AnimatePresence>

                            <Button
                              type="submit"
                              w="100%"
                              mt={1}
                              bg="rgba(0, 198, 224, 0.1)"
                              color="#00C6E0"
                              border="1px solid"
                              borderColor="rgba(0, 198, 224, 0.3)"
                              fontWeight="600"
                              size="md"
                              _hover={{
                                bg: 'rgba(0, 198, 224, 0.18)',
                                borderColor: 'rgba(0, 198, 224, 0.5)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(0, 198, 224, 0.15)',
                              }}
                              _active={{
                                transform: 'translateY(0)',
                                bg: 'rgba(0, 198, 224, 0.25)',
                              }}
                              transition="all 0.2s ease"
                              isLoading={isLoading}
                              loadingText={forgotPassword ? 'Sending...' : 'Signing in...'}
                              rightIcon={<ChevronRight size={16} />}
                            >
                              {forgotPassword ? 'Send Reset Link' : 'Sign In'}
                            </Button>

                            {forgotPassword && (
                              <Button
                                variant="link"
                                size="sm"
                                color="whiteAlpha.500"
                                fontWeight="normal"
                                _hover={{ color: '#00C6E0' }}
                                onClick={toggleForgotPassword}
                              >
                                Back to Sign In
                              </Button>
                            )}
                          </VStack>
                        </Box>
                      </VStack>
                    </MotionBox>
                  ) : (
                    <MotionBox
                      key="signup"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <VStack spacing={5} align="stretch">
                        <VStack spacing={1}>
                          <Heading size="md" color="white" fontWeight="bold">
                            Get started
                          </Heading>
                          <Text fontSize="sm" color="whiteAlpha.600">
                            Choose a plan and start automating in minutes
                          </Text>
                        </VStack>

                        {/* Feature highlights */}
                        <VStack spacing={3} align="stretch">
                          <FeatureRow icon={Zap} text="Automate TradingView alerts instantly" />
                          <FeatureRow icon={Users} text="Multi-account and copy trading" />
                          <FeatureRow icon={BarChart3} text="Real-time execution under 50ms" />
                        </VStack>

                        <Button
                          w="100%"
                          bg="rgba(0, 198, 224, 0.1)"
                          color="#00C6E0"
                          border="1px solid"
                          borderColor="rgba(0, 198, 224, 0.3)"
                          fontWeight="600"
                          size="md"
                          _hover={{
                            bg: 'rgba(0, 198, 224, 0.18)',
                            borderColor: 'rgba(0, 198, 224, 0.5)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0, 198, 224, 0.15)',
                          }}
                          _active={{
                            transform: 'translateY(0)',
                            bg: 'rgba(0, 198, 224, 0.25)',
                          }}
                          transition="all 0.2s ease"
                          rightIcon={<ArrowRight size={16} />}
                          onClick={() => navigate('/pricing?source=auth&register=true')}
                        >
                          View Plans
                        </Button>

                        <Text fontSize="xs" color="whiteAlpha.400" textAlign="center">
                          7-day free trial on all paid plans
                        </Text>
                      </VStack>
                    </MotionBox>
                  )}
                </AnimatePresence>
              </Box>

              {/* Security strip */}
              <Flex
                px={6}
                py={3}
                bg="whiteAlpha.50"
                borderTop="1px solid"
                borderColor="whiteAlpha.100"
                justify="center"
                gap={6}
              >
                <HStack spacing={1.5} color="whiteAlpha.500">
                  <Shield size={13} />
                  <Text fontSize="xs">Secure Login</Text>
                </HStack>
                <HStack spacing={1.5} color="whiteAlpha.500">
                  <Lock size={13} />
                  <Text fontSize="xs">256-bit Encryption</Text>
                </HStack>
              </Flex>
            </MotionBox>
          </VStack>
        </Container>
      </MotionBox>
    </>
  );
};

/** Compact feature row for the Sign Up tab */
const FeatureRow = ({ icon: Icon, text }) => (
  <HStack
    spacing={3}
    px={3}
    py={2.5}
    bg="whiteAlpha.50"
    borderRadius="lg"
    border="1px solid"
    borderColor="whiteAlpha.100"
  >
    <Flex
      w="28px"
      h="28px"
      align="center"
      justify="center"
      borderRadius="md"
      bg="rgba(0, 198, 224, 0.1)"
      flexShrink={0}
    >
      <Icon size={14} color="#00C6E0" />
    </Flex>
    <Text fontSize="sm" color="whiteAlpha.800">
      {text}
    </Text>
  </HStack>
);

export default AuthPage;
