import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Button, 
  Stack, 
  VStack, 
  HStack, 
  Flex, 
  Image, 
  Badge, 
  List, 
  ListItem, 
  ListIcon, 
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  useToast,
  SimpleGrid,
  Avatar,
  Divider,
  Icon,
  Spinner
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Check, 
  Zap, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Bell,
  TrendingUp,
  BarChart2,
  Cpu,
  Award,
  Heart,
  ThumbsUp,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/services/axiosConfig';
import logger from '@/utils/logger';

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

// Registration Form Component
const RegistrationForm = ({ onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  
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
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
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
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Remove confirmPassword from data sent to server
      const { confirmPassword, ...submitData } = formData;
      
      // Get source information from URL if available
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source') || 'direct';
      const utmMedium = urlParams.get('utm_medium') || 'none';
      const utmCampaign = urlParams.get('utm_campaign') || 'none';
      
      // Add the attribution data
      submitData.source = {
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign
      };
      
      onSubmit(submitData);
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);
  
  return (
    <VStack spacing={6} align="stretch" as="form" onSubmit={handleSubmit}>
      <Heading size="md" color="white" textAlign="center">
        Create your free account
      </Heading>
      
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
      
      <FormControl isRequired isInvalid={!!errors.username}>
        <FormLabel color="white">Username</FormLabel>
        <Input
          name="username"
          placeholder="Choose a username"
          value={formData.username}
          onChange={handleChange}
          bg="whiteAlpha.100"
          color="white"
          border="1px solid"
          borderColor="whiteAlpha.300"
          _hover={{ borderColor: "#00C6E0" }}
          _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
        />
        <FormErrorMessage>{errors.username}</FormErrorMessage>
      </FormControl>
      
      <FormControl isRequired isInvalid={!!errors.password}>
        <FormLabel color="white">Password</FormLabel>
        <InputGroup>
          <Input
            name="password"
            type={passwordVisible ? "text" : "password"}
            placeholder="Create a secure password"
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
            <Box as="button" type="button" onClick={togglePasswordVisibility} color="whiteAlpha.600">
              {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
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
          placeholder="Confirm your password"
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
      
      <Text fontSize="xs" color="whiteAlpha.600">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </Text>
      
      <HStack spacing={4} pt={2}>
        <Button
          type="submit"
          bg="#00C6E0"
          color="black"
          size="lg"
          width="full"
          isLoading={isSubmitting}
          loadingText="Creating Account..."
          _hover={{
            bg: "cyan.400",
            transform: 'translateY(-2px)',
            boxShadow: 'lg'
          }}
        >
          Get Started Free
        </Button>
        <Button
          variant="ghost"
          size="lg"
          width="auto"
          onClick={onCancel}
          disabled={isSubmitting}
          color="whiteAlpha.700"
          _hover={{ bg: "whiteAlpha.100" }}
        >
          Cancel
        </Button>
      </HStack>
    </VStack>
  );
};

// Feature Card Component for the "Benefits" section
const FeatureCard = ({ icon, title, description }) => (
  <MotionBox
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.5 }}
    bg="rgba(0, 0, 0, 0.3)"
    borderRadius="xl"
    border="1px solid rgba(255, 255, 255, 0.1)"
    p={6}
    _hover={{
        borderColor: "#00C6E0",
        boxShadow: "0 0 20px rgba(0, 198, 224, 0.2)",
        transform: "translateY(-5px)"
      }}
      transitionProperty="all"
      transitionDuration="0.3s"
      transitionTimingFunction="ease"
    height="100%"
  >
    <VStack spacing={4} align="flex-start">
      <Flex
        w={12}
        h={12}
        borderRadius="lg"
        bg="rgba(0, 198, 224, 0.1)"
        color="#00C6E0"
        justify="center"
        align="center"
      >
        <Icon as={icon} boxSize={6} />
      </Flex>
      
      <Heading size="md" fontWeight="bold" color="white">
        {title}
      </Heading>
      
      <Text color="whiteAlpha.800" fontSize="sm">
        {description}
      </Text>
    </VStack>
  </MotionBox>
);

// Testimonial Card Component
const TestimonialCard = ({ name, role, quote }) => (
  <MotionBox
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.5 }}
    bg="rgba(255, 255, 255, 0.05)"
    backdropFilter="blur(10px)"
    borderRadius="xl"
    border="1px solid rgba(255, 255, 255, 0.1)"
    p={6}
    _hover={{
        borderColor: "#00C6E0",
        boxShadow: "0 0 20px rgba(0, 198, 224, 0.2)",
        transform: "translateY(-5px)"
      }}
      transitionProperty="all"
      transitionDuration="0.3s"
      transitionTimingFunction="ease"
    height="100%"
  >
    <VStack spacing={4} align="flex-start">
      <Text color="whiteAlpha.800" fontSize="md" fontStyle="italic">
        "{quote}"
      </Text>
      
      <HStack spacing={3}>
        <Box
          w={10}
          h={10}
          borderRadius="full"
          bg="rgba(0, 198, 224, 0.1)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="#00C6E0"
          fontWeight="bold"
          fontSize="lg"
        >
          {name.charAt(0)}
        </Box>
        
        <Box>
          <Text color="white" fontWeight="medium" fontSize="sm">
            {name}
          </Text>
          <Text color="whiteAlpha.600" fontSize="xs">
            {role}
          </Text>
        </Box>
      </HStack>
    </VStack>
  </MotionBox>
);

const LandingPage = () => {
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();
  const { register } = useAuth();

  // Get UTM parameters
  useEffect(() => {
    // Log visit with UTM parameters if present
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    
    if (utmSource || utmMedium || utmCampaign) {
      logger.info('Landing page visit with UTM parameters', {
        utm_source: utmSource || 'direct',
        utm_medium: utmMedium || 'none',
        utm_campaign: utmCampaign || 'none',
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  // Handle registration submission
  const handleRegistrationSubmit = async (formData) => {
    if (isSubmitting || isTransitioning) {
      return; // Prevent duplicate submissions
    }
    
    try {
      setIsSubmitting(true);
      setIsTransitioning(true);
      
      logger.info(`Processing registration for ${formData.email} with Starter plan`, {
        source: formData.source
      });
      
      // Store registration data for use after payment/redirect
      localStorage.setItem('pendingRegistration', JSON.stringify({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        timestamp: Date.now(),
        source: formData.source || { utm_source: 'landing_page' }
      }));
      
      // This flag is checked by PaymentSuccess component
      localStorage.setItem('processing_registration', 'true');
      
      // Create URL with parameters for PaymentSuccess component - match exact format
      const params = new URLSearchParams({
        plan: 'starter',
        email: encodeURIComponent(formData.email),
        username: encodeURIComponent(formData.username || ''),
        timestamp: Date.now(),
        source: JSON.stringify(formData.source || { utm_source: 'landing_page' })
      });
      
      // Navigate to payment success page which will complete the registration
      navigate(`/payment/success?${params.toString()}`);
      
    } catch (error) {
      logger.error('Registration error:', error);
      setIsTransitioning(false);
      setIsSubmitting(false);
      
      toast({
        title: "Registration Error",
        description: error.response?.data?.detail || error.message || "Unable to process your registration",
        status: "error",
        duration: 5000,
      });
    }
  };

  return (
    <MotionBox 
      minH="100vh" 
      bg="black" 
      py={{ base: 8, md: 0 }}
      px={4}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      position="relative"
      overflowX="hidden"
    >
      {/* Background Elements */}
      <Box
        position="absolute"
        top="15%"
        left="5%"
        width="30%"
        height="30%"
        bgGradient="radial(circle, rgba(0,198,224,0.15) 0%, rgba(0,0,0,0) 70%)"
        filter="blur(50px)"
        zIndex={0}
        pointerEvents="none"
      />
      
      <Box
        position="absolute"
        bottom="10%"
        right="5%"
        width="40%"
        height="40%"
        bgGradient="radial(circle, rgba(0,198,224,0.05) 0%, rgba(0,0,0,0) 70%)"
        filter="blur(60px)"
        zIndex={0}
        pointerEvents="none"
      />

      {/* Hero Section */}
      <Container maxW="container.xl" minH={{ md: "100vh" }} position="relative" zIndex={1}>
        <Flex 
          direction={{ base: 'column', lg: 'row' }} 
          align="center" 
          justify="center"
          gap={{ base: 8, lg: 4 }}
          minH={{ md: "100vh" }}
          py={{ base: 8, md: 0 }}
        >
          {/* Left Column - Main Content */}
          <MotionFlex 
            direction="column" 
            flex={{ lg: 1 }}
            width={{ base: "100%", lg: "auto" }}
            align={{ base: "center", lg: "flex-start" }}
            justify="center"
            textAlign={{ base: "center", lg: "left" }}
            variants={itemVariants}
            pr={{ lg: 8 }}
          >
            <Badge 
              colorScheme="cyan" 
              bg="rgba(0, 198, 224, 0.1)"
              color="#00C6E0"
              px={3}
              py={1.5}
              borderRadius="full"
              mb={4}
              fontSize="sm"
              fontWeight="medium"
              border="1px solid rgba(0, 198, 224, 0.3)"
            >
              Perfect for Funded Traders
            </Badge>
            
            <Heading
              as="h1"
              size={{ base: "xl", md: "2xl", lg: "3xl" }}
              fontWeight="bold"
              color="white"
              lineHeight="shorter"
              mb={4}
            >
              Automate Your Trading{" "}
              <Text
                as="span"
                bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                bgClip="text"
              >
                Without Code
              </Text>
            </Heading>
            
            <Text
              fontSize={{ base: "md", md: "lg" }}
              color="whiteAlpha.800"
              maxW={{ base: "100%", lg: "90%" }}
              mb={6}
            >
              Connect your funded account to automated trading strategies in minutes. 
              Eliminate emotions, trade while you sleep, and keep your Topstep or Apex 
              funding without staring at screens all day.
            </Text>
            
            {/* Feature List */}
            <VStack 
              spacing={3} 
              align={{ base: "center", lg: "flex-start" }} 
              mb={8}
              width={{ base: "100%", md: "90%" }}
            >
              <HStack spacing={3}>
                <Flex
                  minW="26px"
                  h="26px"
                  borderRadius="full"
                  bg="rgba(0, 198, 224, 0.1)"
                  color="#00C6E0"
                  justify="center"
                  align="center"
                >
                  <Check size={16} />
                </Flex>
                <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                  <Text as="span" fontWeight="bold">No coding</Text> required – set up in minutes
                </Text>
              </HStack>
              
              <HStack spacing={3}>
                <Flex
                  minW="26px"
                  h="26px"
                  borderRadius="full"
                  bg="rgba(0, 198, 224, 0.1)"
                  color="#00C6E0"
                  justify="center"
                  align="center"
                >
                  <Check size={16} />
                </Flex>
                <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                  <Text as="span" fontWeight="bold">Works with Topstep</Text>, Apex, and other funded accounts
                </Text>
              </HStack>
              
              <HStack spacing={3}>
                <Flex
                  minW="26px"
                  h="26px"
                  borderRadius="full"
                  bg="rgba(0, 198, 224, 0.1)"
                  color="#00C6E0"
                  justify="center"
                  align="center"
                >
                  <Check size={16} />
                </Flex>
                <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                  <Text as="span" fontWeight="bold">100% free</Text> to get started with one strategy
                </Text>
              </HStack>
            </VStack>
            
            {/* CTA Button */}
            <Button
              onClick={onOpen}
              size="lg"
              bg="#00C6E0"
              color="black"
              px={8}
              fontWeight="semibold"
              _hover={{
                bg: "rgba(0, 198, 224, 0.8)",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0, 198, 224, 0.25)"
              }}
              rightIcon={<ArrowRight size={18} />}
            >
              Start Free Now
            </Button>
            
            {/* Social Proof */}
            <HStack 
              spacing={4} 
              mt={6}
              color="whiteAlpha.700"
              fontSize="xs"
              fontWeight="medium"
            >
              <Flex align="center" gap={1}>
                <Zap size={14} />
                <Text>50ms Execution</Text>
              </Flex>
              
              <Flex align="center" gap={1}>
                <Clock size={14} />
                <Text>99.8% Uptime</Text>
              </Flex>
              
              <Flex align="center" gap={1}>
                <ShieldCheck size={14} />
                <Text>Bank-Grade Security</Text>
              </Flex>
            </HStack>
          </MotionFlex>
          
          
            <MotionFlex 
            flex={{ lg: 1 }}
            width={{ base: "100%", lg: "auto" }}
            justify="center"
            align="center"
            variants={itemVariants}
            >
            {/* 16:9 Aspect Ratio Container - Wider with no overlay */}
            <Box
                width="100%"
                maxW={{ base: "100%", md: "700px", lg: "800px" }}
                position="relative"
                borderRadius="2xl"
                overflow="hidden"
                boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
                border="1px solid rgba(255,255,255,0.18)"
                bg="rgba(0,0,0,0.2)"
                // This maintains 16:9 aspect ratio
                _before={{
                content: '""',
                display: 'block',
                paddingTop: '53.25%' // 16:9 Aspect Ratio
                }}
            >
                {/* Dashboard Image - Positioned Absolutely to Fill Container */}
                <Image
                src="/images/dashboard.png" // Update with your image path
                alt="Atomik Trading Dashboard"
                position="absolute"
                top="0"
                left="0"
                width="100%"
                height="100%"
                objectFit="cover"
                objectPosition="center"
                />
            </Box>
            </MotionFlex>
        </Flex>
      </Container>
      
      {/* Social Proof/Stats Section */}
      <Box 
        bg="black" 
        py={16}
        position="relative"
        borderTop="1px solid"
        borderColor="whiteAlpha.100"
      >
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 8, md: 10 }}>
            <VStack>
              <Heading
                fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                fontWeight="bold"
                color="#00C6E0"
                lineHeight={1}
              >
                &lt;50
              </Heading>
              <Text color="whiteAlpha.700" fontSize="sm" textAlign="center">
                millisecond execution
              </Text>
            </VStack>
            
            <VStack>
              <Heading
                fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                fontWeight="bold"
                color="#00C6E0"
                lineHeight={1}
              >
                99.8%
              </Heading>
              <Text color="whiteAlpha.700" fontSize="sm" textAlign="center">
                platform uptime
              </Text>
            </VStack>
            
            <VStack>
              <Heading
                fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                fontWeight="bold"
                color="#00C6E0"
                lineHeight={1}
              >
                24/7
              </Heading>
              <Text color="whiteAlpha.700" fontSize="sm" textAlign="center">
                automated trading
              </Text>
            </VStack>
            
            <VStack>
              <Heading
                fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                fontWeight="bold"
                color="#00C6E0"
                lineHeight={1}
              >
                0
              </Heading>
              <Text color="whiteAlpha.700" fontSize="sm" textAlign="center">
                coding required
              </Text>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>
      
      {/* How It Works Section */}
      <Box 
        bg="black" 
        py={16} 
        position="relative"
        borderTop="1px solid"
        borderColor="whiteAlpha.100"
      >
        <Container maxW="container.lg">
          <VStack spacing={10}>
            <Heading 
              as="h2"
              size="xl" 
              color="white"
              textAlign="center"
              mb={2}
            >
              How It{" "}
              <Text
                as="span"
                bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                bgClip="text"
              >
                Works
              </Text>
            </Heading>
            
            <Text 
              color="whiteAlpha.700"
              textAlign="center"
              maxW="2xl"
              fontSize={{ base: "sm", md: "md" }}
            >
              Atomik Trading makes automation accessible to everyone, especially those using 
              funded accounts. No coding knowledge required - just a few simple steps.
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full">
              {/* Step 1 */}
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5 }}
              >
                <Flex
                  direction={{ base: 'column', sm: 'row' }}
                  bg="rgba(255, 255, 255, 0.05)"
                  borderRadius="xl"
                  overflow="hidden"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  p={6}
                  gap={4}
                  align="center"
                  h="full"
                  transition="all 0.3s ease"
                  _hover={{
                    borderColor: "#00C6E0",
                    boxShadow: "0 0 20px rgba(0, 198, 224, 0.2)",
                    transform: "translateY(-5px)"
                  }}
                >
                  <Flex
                    minW="60px"
                    h="60px"
                    borderRadius="xl"
                    bg="rgba(0, 198, 224, 0.1)"
                    color="#00C6E0"
                    justify="center"
                    align="center"
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    1
                  </Flex>
                  <Box>
                    <Heading size="md" color="white" mb={2}>
                      Connect Your Broker
                    </Heading>
                    <Text color="whiteAlpha.800" fontSize="sm">
                      Securely connect your Topstep, Apex, or other funded account with a few clicks. Your credentials are never stored.
                    </Text>
                  </Box>
                </Flex>
              </MotionBox>
              
              {/* Step 2 */}
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Flex
                  direction={{ base: 'column', sm: 'row' }}
                  bg="rgba(255, 255, 255, 0.05)"
                  borderRadius="xl"
                  overflow="hidden"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  p={6}
                  gap={4}
                  align="center"
                  h="full"
                  transition="all 0.3s ease"
                  _hover={{
                    borderColor: "#00C6E0",
                    boxShadow: "0 0 20px rgba(0, 198, 224, 0.2)",
                    transform: "translateY(-5px)"
                  }}
                >
                  <Flex
                    minW="60px"
                    h="60px"
                    borderRadius="xl"
                    bg="rgba(0, 198, 224, 0.1)"
                    color="#00C6E0"
                    justify="center"
                    align="center"
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    2
                  </Flex>
                  <Box>
                    <Heading size="md" color="white" mb={2}>
                      Select Your Strategy
                    </Heading>
                    <Text color="whiteAlpha.800" fontSize="sm">
                      Choose from our marketplace or connect your own signal source. No programming required at any stage.
                    </Text>
                  </Box>
                </Flex>
              </MotionBox>
              
              {/* Step 3 */}
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Flex
                  direction={{ base: 'column', sm: 'row' }}
                  bg="rgba(255, 255, 255, 0.05)"
                  borderRadius="xl"
                  overflow="hidden"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  p={6}
                  gap={4}
                  align="center"
                  h="full"
                  transition="all 0.3s ease"
                  _hover={{
                    borderColor: "#00C6E0",
                    boxShadow: "0 0 20px rgba(0, 198, 224, 0.2)",
                    transform: "translateY(-5px)"
                  }}
                >
                  <Flex
                    minW="60px"
                    h="60px"
                    borderRadius="xl"
                    bg="rgba(0, 198, 224, 0.1)"
                    color="#00C6E0"
                    justify="center"
                    align="center"
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    3
                  </Flex>
                  <Box>
                    <Heading size="md" color="white" mb={2}>
                      Set Trading Rules
                    </Heading>
                    <Text color="whiteAlpha.800" fontSize="sm">
                      Configure position size, risk parameters, and trading hours. Our simple interface makes it easy.
                    </Text>
                  </Box>
                </Flex>
              </MotionBox>
              
              {/* Step 4 */}
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Flex
                  direction={{ base: 'column', sm: 'row' }}
                  bg="rgba(255, 255, 255, 0.05)"
                  borderRadius="xl"
                  overflow="hidden"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  p={6}
                  gap={4}
                  align="center"
                  h="full"
                  transition="all 0.3s ease"
                  _hover={{
                    borderColor: "#00C6E0",
                    boxShadow: "0 0 20px rgba(0, 198, 224, 0.2)",
                    transform: "translateY(-5px)"
                  }}
                >
                  <Flex
                    minW="60px"
                    h="60px"
                    borderRadius="xl"
                    bg="rgba(0, 198, 224, 0.1)"
                    color="#00C6E0"
                    justify="center"
                    align="center"
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    4
                  </Flex>
                  <Box>
                    <Heading size="md" color="white" mb={2}>
                      Let It Run
                    </Heading>
                    <Text color="whiteAlpha.800" fontSize="sm">
                      Sit back as trades execute automatically with no emotions. Get notifications for important events.
                    </Text>
                  </Box>
                </Flex>
              </MotionBox>
            </SimpleGrid>
            
            {/* CTA Button */}
            <Flex justify="center" mt={6}>
              <Button
                onClick={onOpen}
                size="lg"
                bg="#00C6E0"
                color="black"
                px={8}
                fontWeight="semibold"
                _hover={{
                  bg: "rgba(0, 198, 224, 0.8)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0, 198, 224, 0.25)"
                }}
                rightIcon={<ArrowRight size={18} />}
              >
                Start Free Now
              </Button>
            </Flex>
          </VStack>
        </Container>
      </Box>
      
      {/* Benefits Section */}
      <Box 
        bg="black" 
        py={16} 
        position="relative"
        borderTop="1px solid"
        borderColor="whiteAlpha.100"
      >
        <Container maxW="container.lg">
          <VStack spacing={10}>
            <Heading 
              as="h2"
              size="xl" 
              color="white"
              textAlign="center"
              mb={2}
            >
              Why Choose{" "}
              <Text
                as="span"
                bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                bgClip="text"
              >
                Atomik
              </Text>
            </Heading>
            
            <Text 
              color="whiteAlpha.700"
              textAlign="center"
              maxW="2xl"
              fontSize={{ base: "sm", md: "md" }}
            >
              We've designed Atomik Trading specifically for funded traders who need simplicity,
              reliability, and performance without the technical complexity.
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              <FeatureCard
                icon={Zap}
                title="Lightning Fast Execution"
                description="Execute trades in under 50ms to ensure you never miss a market opportunity due to latency."
              />
              
              <FeatureCard
                icon={Heart}
                title="Eliminate Emotions"
                description="Remove the psychological aspect of trading that often leads to breaking rules and losing funding."
              />
              
              <FeatureCard
                icon={Bell}
                title="Trade While You Sleep"
                description="Set up your strategies once and let them run 24/7, even when you're away from your screen."
              />
              
              <FeatureCard
                icon={ThumbsUp}
                title="Simple Flat Pricing"
                description="No per-trade fees or hidden costs. Our flat subscription means unlimited trades with no surprises."
              />
              
              <FeatureCard
                icon={Cpu}
                title="No Coding Required"
                description="Unlike other platforms, we designed Atomik for traders, not programmers. No coding knowledge needed."
              />
              
              <FeatureCard
                icon={TrendingUp}
                title="Maintain Your Funding"
                description="Follow your trading plan consistently and avoid the common pitfalls that lose funded accounts."
              />
            </SimpleGrid>
            
            <Box
              mt={6}
              p={8}
              bg="rgba(0, 198, 224, 0.05)"
              borderRadius="xl"
              borderWidth="1px"
              borderStyle="solid"
              borderColor="rgba(0, 198, 224, 0.2)"
              width="full"
              maxW="3xl"
              mx="auto"
            >
              <VStack spacing={4}>
                <Text 
                  color="white" 
                  fontSize="lg" 
                  fontWeight="medium"
                  textAlign="center"
                >
                  Our Competition Charges Per Trade. We Don't.
                </Text>
                
                <Text 
                  color="whiteAlpha.800"
                  fontSize="sm"
                  textAlign="center"
                >
                  Other platforms charge you for each trade executed, which can add up quickly.
                  Atomik Trading offers simple flat-rate pricing with unlimited trades, saving you money
                  as your trading volume increases.
                </Text>
                
                <Button
                  as={RouterLink}
                  to="/pricing"
                  size="md"
                  variant="outline"
                  colorScheme="blue"
                  borderColor="#00C6E0"
                  color="#00C6E0"
                  mt={2}
                  rightIcon={<ExternalLink size={14} />}
                  _hover={{
                    bg: "rgba(0, 198, 224, 0.1)"
                  }}
                >
                  View All Plans
                </Button>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>
      
      {/* FAQ Section */}
      <Box 
        bg="black" 
        py={16} 
        position="relative"
        borderTop="1px solid"
        borderColor="whiteAlpha.100"
      >
        <Container maxW="container.lg">
          <VStack spacing={10}>
            <Heading 
              as="h2"
              size="xl" 
              color="white"
              textAlign="center"
              mb={2}
            >
              Frequently Asked{" "}
              <Text
                as="span"
                bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                bgClip="text"
              >
                Questions
              </Text>
            </Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} width="full">
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5 }}
                bg="rgba(0, 0, 0, 0.3)"
                borderRadius="xl"
                p={6}
                border="1px solid rgba(255, 255, 255, 0.1)"
              >
                <Heading size="md" color="white" mb={3}>
                  What funded accounts do you support?
                </Heading>
                <Text color="whiteAlpha.800" fontSize="sm">
                  We currently support Topstep, Apex, and several other major funded account providers. Our platform is designed to work with any broker that provides API access.
                </Text>
              </MotionBox>
              
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                bg="rgba(0, 0, 0, 0.3)"
                borderRadius="xl"
                p={6}
                border="1px solid rgba(255, 255, 255, 0.1)"
              >
                <Heading size="md" color="white" mb={3}>
                  Do I need coding knowledge?
                </Heading>
                <Text color="whiteAlpha.800" fontSize="sm">
                  Absolutely not! Atomik Trading was specifically designed for traders without technical backgrounds. Our intuitive interface makes automation accessible to everyone.
                </Text>
              </MotionBox>
              
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                bg="rgba(0, 0, 0, 0.3)"
                borderRadius="xl"
                p={6}
                border="1px solid rgba(255, 255, 255, 0.1)"
              >
                <Heading size="md" color="white" mb={3}>
                  What's included in the free plan?
                </Heading>
                <Text color="whiteAlpha.800" fontSize="sm">
                  Our free plan includes one connected broker account and one active strategy. It's perfect for trying out our platform and seeing the benefits of automated trading.
                </Text>
              </MotionBox>
              
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                bg="rgba(0, 0, 0, 0.3)"
                borderRadius="xl"
                p={6}
                border="1px solid rgba(255, 255, 255, 0.1)"
              >
                <Heading size="md" color="white" mb={3}>
                  Is my trading account secure?
                </Heading>
                <Text color="whiteAlpha.800" fontSize="sm">
                  Absolutely. We use bank-grade encryption and never store your account passwords. We only maintain the secure tokens needed to execute your trades.
                </Text>
              </MotionBox>
            </SimpleGrid>
            
            {/* Final CTA */}
            <Box 
              mt={10}
              p={{ base: 6, md: 10 }}
              bg="rgba(0, 0, 0, 0.4)"
              borderRadius="xl"
              borderWidth="1px"
              borderStyle="solid"
              borderColor="rgba(0, 198, 224, 0.3)"
              width="full"
              maxW="4xl"
              mx="auto"
              boxShadow="0 8px 32px rgba(0, 198, 224, 0.15)"
              backdropFilter="blur(10px)"
            >
              <VStack spacing={6}>
                <Heading 
                  as="h2"
                  size="lg" 
                  color="white"
                  textAlign="center"
                >
                  Ready to Automate Your Trading?
                </Heading>
                
                <Text 
                  color="whiteAlpha.800"
                  textAlign="center"
                  fontSize="md"
                  maxW="2xl"
                >
                  Start for free today. Connect one account, set up one strategy, and see how automation can transform your trading.
                </Text>
                
                <Button
                  onClick={onOpen}
                  size="lg"
                  bg="#00C6E0"
                  color="black"
                  px={10}
                  fontWeight="semibold"
                  _hover={{
                    bg: "rgba(0, 198, 224, 0.8)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 12px rgba(0, 198, 224, 0.25)"
                  }}
                  rightIcon={<ArrowRight size={18} />}
                >
                  Get Started Free
                </Button>
                
                <Text 
                  color="whiteAlpha.600"
                  fontSize="xs"
                  textAlign="center"
                >
                  No credit card required. Upgrade anytime.
                </Text>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>
      
      {/* Loading Overlay - shown during registration/redirect */}
      {isTransitioning && (
        <Box 
          position="fixed" 
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0,0,0,0.8)"
          backdropFilter="blur(5px)"
          zIndex={9999}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
        >
          <Spinner size="xl" color="#00C6E0" thickness="4px" speed="0.65s" mb={4} />
          <Text color="white" fontSize="lg">Setting up your account...</Text>
        </Box>
      )}
      
      {/* Registration Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={isSubmitting ? undefined : onClose}
        isCentered
        size="md"
      >
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(8px)" />
        <ModalContent
          bg="rgba(0, 0, 0, 0.8)"
          backdropFilter="blur(16px)"
          border="1px solid rgba(255, 255, 255, 0.1)"
          borderRadius="xl"
          mx={4}
          boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
          p={6}
        >
          <ModalHeader color="white" textAlign="center" pb={0}>Get Started with Atomik</ModalHeader>
          {!isSubmitting && <ModalCloseButton color="white" />}
          
          <ModalBody>
            <RegistrationForm
              onSubmit={handleRegistrationSubmit}
              onCancel={onClose}
              isSubmitting={isSubmitting}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </MotionBox>
  );
};

export default LandingPage;