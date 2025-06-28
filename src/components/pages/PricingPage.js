import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Stack,
  Badge,
  List,
  Spinner,
  ListItem,
  ListIcon,
  SimpleGrid,
  Divider,
  useToast,
  useBreakpointValue,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/services/axiosConfig';
import logger from '@/utils/logger';
import { debounce } from 'lodash';
import { 
  Check,
  X,
  ShieldCheck, 
  Lock, 
  CreditCard,
  Zap,
  Trophy,
  Clock,
  Settings,
  Globe,
  Users,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader
} from 'lucide-react';

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

// Helper function to get Stripe price IDs
const get_price_id = (tier, interval) => {
  const price_mapping = {
    // Pro tier
    'pro_monthly': process.env.REACT_APP_STRIPE_PRICE_PRO_MONTHLY || 'price_1R1CX5Dw86VJEB1ab48KpdsV',
    'pro_yearly': process.env.REACT_APP_STRIPE_PRICE_PRO_YEARLY || 'price_1R1CXqDw86VJEB1arD41G8w4',
    'pro_lifetime': process.env.REACT_APP_STRIPE_PRICE_PRO_LIFETIME || '',
    
    // Elite tier
    'elite_monthly': process.env.REACT_APP_STRIPE_PRICE_ELITE_MONTHLY || 'price_1R1CaDDw86VJEB1adLeC4qFL',
    'elite_yearly': process.env.REACT_APP_STRIPE_PRICE_ELITE_YEARLY || 'price_1R1CaaDw86VJEB1aFWp4yr9c',
    'elite_lifetime': process.env.REACT_APP_STRIPE_PRICE_ELITE_LIFETIME || 'price_1R1Cb5Dw86VJEB1ag4jgp4W5',
  };
  
  const key = `${tier}_${interval}`;
  return price_mapping[key];
};

// Pricing data
const pricingData = {
  pro: { // Internal ID 'pro' is now marketed as "Starter"
    name: "Starter", // New marketing name (was "Pro")
    description: "For serious traders seeking automation and reliability",
    monthlyPrice: 129,
    yearlyPrice: 1290, // $107.50/month billed annually
    lifetimePrice: 2990,
    features: [
      { text: "Up to 5 connected trading accounts", available: true },
      { text: "5 active webhooks", available: true },
      { text: "Advanced webhook configurations", available: true },
      { text: "Automated trade execution", available: true },
      { text: "Funded Account Connectivity", available: true },
      { text: "Full marketplace access", available: true },
      { text: "Advanced position management", available: true },
      { text: "Trade history & analytics", available: true },
      { text: "Priority support", available: false },
      { text: "Custom strategy building", available: false }
    ],
    ctaText: "Start Free Trial",
    popular: true,
    color: "#00C6E0",
    trial: "14-day free trial"
  },
  elite: { // Internal ID 'elite' is now marketed as "Pro"
    name: "Pro", // New marketing name (was "Elite")
    description: "For professional traders and institutions",
    monthlyPrice: 189,
    yearlyPrice: 1890, // $157.50/month billed annually
    lifetimePrice: 2990,
    features: [
      { text: "Unlimited connected accounts", available: true },
      { text: "Unlimited webhooks & configs", available: true },
      { text: "Enterprise-grade webhooks", available: true },
      { text: "Advanced trade execution rules", available: true },
      { text: "Funded and Live Account Functionality", available: true },
      { text: "Early access to new features", available: true },
      { text: "Advanced position management", available: true },
      { text: "Advanced analytics & reporting", available: true },
      { text: "Priority technical support", available: true },
      { text: "Custom strategy development", available: true }
    ],
    ctaText: "Start Free Trial",
    popular: false,
    color: "#9932CC", // Purple that complements the cyan
    trial: "14-day free trial"
  }
};

// Price toggle component
const PricingToggle = ({ selectedInterval, onChange }) => {
  const activeButtonStyles = {
    bg: "rgba(0, 198, 224, 0.15)",
    color: "#00C6E0",
    fontWeight: "semibold",
    borderColor: "#00C6E0"
  };
  
  const inactiveButtonStyles = {
    bg: "transparent",
    color: "whiteAlpha.700",
    fontWeight: "normal",
    borderColor: "transparent",
    _hover: {
      bg: "whiteAlpha.100",
      color: "white"
    }
  };

  return (
    <HStack spacing={0} borderRadius="full" border="1px solid" borderColor="whiteAlpha.200" overflow="hidden" my={4}>  
  <Button 
    size="sm"  
    variant="ghost" 
    px={4}  
    borderRight="1px solid"
    borderColor="whiteAlpha.200"
    borderRadius="none"
    {...(selectedInterval === 'monthly' ? activeButtonStyles : inactiveButtonStyles)}
    onClick={() => onChange('monthly')}
  >
    Monthly
  </Button>
  <Button 
    size="sm"  
    variant="ghost" 
    px={4}  
    borderRight="1px solid"
    borderColor="whiteAlpha.200"
    borderRadius="none"
    {...(selectedInterval === 'yearly' ? activeButtonStyles : inactiveButtonStyles)}
    onClick={() => onChange('yearly')}
  >
    Yearly <Badge ml={1} colorScheme="green" variant="solid" fontSize="2xs">Save 20%</Badge>  
  </Button>
  <Button 
    size="sm"  
    variant="ghost" 
    px={4}  
    borderRadius="none"
    {...(selectedInterval === 'lifetime' ? activeButtonStyles : inactiveButtonStyles)}
    onClick={() => onChange('lifetime')}
  >
    Lifetime <Badge ml={1} colorScheme="purple" variant="solid" fontSize="2xs">Best Value</Badge> 
  </Button>
</HStack>
  );
};

// Price card component
// Update PriceCard component to display trial information
const PriceCard = ({ tier, billingInterval, onClick, isPopular }) => {
  const tierKey = tier.toLowerCase();
  const pricingTier = pricingData[tierKey];
  const price = 
    billingInterval === 'monthly' 
      ? pricingTier.monthlyPrice 
      : billingInterval === 'yearly' 
        ? pricingTier.yearlyPrice
        : pricingTier.lifetimePrice;
  
  // Save calculation for yearly
  const monthlySavings = billingInterval === 'yearly' ? Math.round((pricingTier.monthlyPrice * 12 - pricingTier.yearlyPrice) / 12) : 0;

  const cardBorderColor = isPopular ? pricingTier.color : 'whiteAlpha.200';
  const popularBadgeVisibility = isPopular ? 'visible' : 'hidden';
  
  // Show trial info only for subscription plans (not lifetime)
  const showTrialInfo = billingInterval !== 'lifetime' && pricingTier.trial;
  
  const hoverAnimation = {
    rest: { 
      scale: 1,
      boxShadow: "0px 0px 0px rgba(0, 198, 224, 0)"
    },
    hover: { 
      scale: 1.02,
      boxShadow: `0px 0px 20px rgba(0, 198, 224, 0.2)`,
      borderColor: pricingTier.color,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  return (
    <MotionBox
      as={motion.div}
      initial="rest"
      whileHover="hover"
      variants={hoverAnimation}
      borderRadius="xl"
      border="1px solid"
      borderColor={cardBorderColor}
      bg="rgba(0, 0, 0, 0.5)"
      backdropFilter="blur(10px)"
      overflow="hidden"
      position="relative"
      transition="all 0.3s"
      height="100%"
    >
      {/* Popular badge */}
      <Badge
        position="absolute"
        top={2}  // Reduced from top={4}
        right={2}  // Reduced from right={4}
        colorScheme="cyan"
        variant="solid"
        borderRadius="full"
        px={2}  // Reduced from px={3}
        py={0.5}  // Reduced from py={1}
        visibility={popularBadgeVisibility}
        fontSize="xs"
        fontWeight="bold"
        letterSpacing="0.5px"
      >
        MOST POPULAR
      </Badge>

      <VStack spacing={3} height="100%" p={4}>  {/* Reduced from spacing={6} p={6} */}
        {/* Tier name and description */}
        <VStack spacing={1} align="center" mb={1}>  {/* Reduced from spacing={2} mb={2} */}
          <Heading size="md" fontWeight="bold" color="white">  {/* Changed from size="lg" */}
            {pricingTier.name}
          </Heading>
          <Text color="whiteAlpha.700" textAlign="center" fontSize="xs">  {/* Changed from fontSize="sm" */}
            {pricingTier.description}
          </Text>
        </VStack>

        {/* Price - more compact layout */}
        <Box my={2} textAlign="center">  {/* Reduced from my={4} */}
          <Flex align="flex-start" justify="center">
            <Text fontSize="xs" color="whiteAlpha.700" mt={2} mr={0.5}>$</Text>  {/* Changed from fontSize="sm" mr={1} */}
            <Text fontSize="4xl" fontWeight="bold" color="white" lineHeight="1">  {/* Changed from fontSize="5xl" */}
              {billingInterval === 'lifetime' ? price : Math.round(price / (billingInterval === 'yearly' ? 12 : 1))}
            </Text>
            {billingInterval !== 'lifetime' && (
              <Text fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" mb={1.5} ml={0.5}>
                /mo
              </Text>
            )}
          </Flex>
          
          {billingInterval === 'yearly' && (
            <Text fontSize="xs" color="#00C6E0" mt={0.5}>  {/* Changed from fontSize="sm" mt={1} */}
              Save ${monthlySavings}/mo
            </Text>
          )}
          
          {billingInterval === 'lifetime' && (
            <Text fontSize="xs" color="#9932CC" mt={0.5}>  {/* Changed from fontSize="sm" mt={1} */}
              One-time payment
            </Text>
          )}
          
          {showTrialInfo && (
            <Box mt={1}>  {/* Reduced from mt={2} */}
              <Badge colorScheme="green" p={0.5} borderRadius="md" fontSize="2xs">  {/* Added fontSize="2xs" */}
                {pricingTier.trial}
              </Badge>
            </Box>
          )}
          
          {billingInterval !== 'lifetime' && (
            <Text fontSize="2xs" color="whiteAlpha.600" mt={0.5}>  {/* Changed from fontSize="xs" mt={1} */}
              {billingInterval === 'yearly' ? 'Billed annually' : 'Billed monthly'}
            </Text>
          )}
        </Box>

        <Divider borderColor="whiteAlpha.200" />

        {/* Features - more compact list */}
        <VStack spacing={1} align="stretch" flex="1" mt={0}>  {/* Changed from spacing={3} */}
          <List spacing={1} styleType="none" flex="1">  {/* Changed from spacing={3} */}
            {pricingTier.features.map((feature, index) => (
              <ListItem key={index} display="flex" alignItems="flex-start">
                <ListIcon 
                  as={feature.available ? Check : X} 
                  color={feature.available ? (isPopular ? pricingTier.color : 'green.400') : 'gray.500'} 
                  mt="2px"  /* Reduced from mt="3px" */
                  boxSize={3}  /* Added boxSize to make icons smaller */
                />
                <Text
                  fontSize="xs"  /* Changed from fontSize="sm" */
                  color={feature.available ? 'white' : 'whiteAlpha.500'}
                >
                  {feature.text}
                </Text>
              </ListItem>
            ))}
          </List>

          {/* CTA Button */}
          <Button
            mt="auto"
            size="md"  /* Changed from size="lg" */
            width="full"
            bg={isPopular ? pricingTier.color : 'whiteAlpha.200'}
            color={isPopular ? 'black' : 'white'}
            _hover={{
              bg: isPopular ? 'cyan.400' : 'whiteAlpha.300',
              transform: 'translateY(-2px)',
              boxShadow: 'lg'
            }}
            onClick={() => onClick(tierKey, billingInterval)}
            rightIcon={<ArrowRight size={14} />}  /* Reduced from size={16} */
          >
            {pricingTier.ctaText}
          </Button>
        </VStack>
      </VStack>
    </MotionBox>
  );
};

// Registration Form Component
const RegistrationForm = ({ selectedPlan, selectedInterval, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
  
  // Username availability check
  const checkUsername = debounce(async (username) => {
    if (!username || username.length < 3) return;
    
    setIsCheckingUsername(true);
    try {
      const response = await axiosInstance.get(`/api/v1/auth/check-username/${username}`);
      
      if (response.data?.exists) {
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
  }, 500);
  
  // Username input handler with availability check
  const handleUsernameChange = (e) => {
    const { value } = e.target;
    handleChange(e);
    
    if (value && value.length >= 3) {
      checkUsername(value);
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
    } else if (errors.username) {
      // Keep existing username error if present (from availability check)
      newErrors.username = errors.username;
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
      onSubmit(submitData);
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);
  
  return (
    <VStack spacing={6} align="stretch" as="form" onSubmit={handleSubmit}>
      <Heading size="md" color="white" textAlign="center">
        Create your account to get started with the {selectedPlan} plan
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
          _hover={{ borderColor: "blue.300" }}
          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
        />
        <FormErrorMessage>{errors.email}</FormErrorMessage>
      </FormControl>
      
      <FormControl isRequired isInvalid={!!errors.username}>
        <FormLabel color="white">Username</FormLabel>
        <InputGroup>
          <Input
            name="username"
            placeholder="Choose a username"
            value={formData.username}
            onChange={handleUsernameChange}
            bg="whiteAlpha.100"
            color="white"
            border="1px solid"
            borderColor="whiteAlpha.300"
            _hover={{ borderColor: "blue.300" }}
            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
          />
          {isCheckingUsername && (
            <InputRightElement>
              <Spinner size="sm" color="blue.300" />
            </InputRightElement>
          )}
        </InputGroup>
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
            _hover={{ borderColor: "blue.300" }}
            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
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
          _hover={{ borderColor: "blue.300" }}
          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
        />
        <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
      </FormControl>
      
      <Text fontSize="xs" color="whiteAlpha.600">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </Text>
      
      <HStack spacing={4} pt={2}>
        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          width="full"
          isLoading={isSubmitting}
          loadingText="Creating Account..."
        >
          {selectedPlan === 'starter' ? 'Get Started Free' : 'Create Account & Continue'}
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

// Security badges section
const SecurityBadges = () => {
  return (
    <Box 
      mt={12} 
      py={6} 
      px={8} 
      borderRadius="xl"
      maxW="3xl"
      mx="auto"
      w="full"
    >
      <VStack spacing={5}>
        <Text
          fontSize="lg"
          fontWeight="medium"
          color="white"
          textAlign="center"
        >
          Your Security Is Our Priority
        </Text>
        
        <Flex 
          w="full" 
          justify="space-around" 
          direction={{ base: 'column', sm: 'row' }} 
          align="center"
          wrap="wrap"
          gap={6}
        >
          <VStack spacing={2}>
            <Center 
              w={12} 
              h={12} 
              borderRadius="full" 
              bg="rgba(0, 0, 0, 0.4)" 
              color="#00c6e0"
              border="1px solid rgba(0, 198, 224, 0.3)"
              boxShadow="0 0 15px rgba(0, 198, 224, 0.1)"
            >
              <Lock size={22} />
            </Center>
            <Text color="whiteAlpha.900" fontSize="sm" fontWeight="medium" textAlign="center">
              256-bit SSL Encryption
            </Text>
          </VStack>
          
          <VStack spacing={2}>
            <Center 
              w={12} 
              h={12} 
              borderRadius="full" 
              bg="rgba(0, 0, 0, 0.4)" 
              color="#00c6e0"
              border="1px solid rgba(0, 198, 224, 0.3)"
              boxShadow="0 0 15px rgba(0, 198, 224, 0.1)"
            >
              <ShieldCheck size={22} />
            </Center>
            <Text color="whiteAlpha.900" fontSize="sm" fontWeight="medium" textAlign="center">
              PCI DSS Compliant
            </Text>
          </VStack>
          
          <VStack spacing={2}>
            <Center 
              w={12} 
              h={12} 
              borderRadius="full" 
              bg="rgba(0, 0, 0, 0.4)" 
              color="#00c6e0"
              border="1px solid rgba(0, 198, 224, 0.3)"
              boxShadow="0 0 15px rgba(0, 198, 224, 0.1)"
            >
              <CreditCard size={22} />
            </Center>
            <Text color="whiteAlpha.900" fontSize="sm" fontWeight="medium" textAlign="center">
              Secure Payment Processing
            </Text>
          </VStack>
        </Flex>
      </VStack>
    </Box>
  );
};

// Feature highlights section
const FeatureHighlights = () => {
  const features = [
    {
      icon: <Globe size={24} />,
      title: "Connect Any Broker",
      description: "Connect to your favorite broker with our seamless integration system"
    },
    {
      icon: <Zap size={24} />,
      title: "Lightning Fast",
      description: "Execute trades in milliseconds with our optimized infrastructure"
    },
    {
      icon: <Settings size={24} />,
      title: "Customizable Webhooks",
      description: "Configure webhooks to respond exactly how you want them to"
    },
    {
      icon: <Users size={24} />,
      title: "Growing Community",
      description: "Join thousands of traders automating their strategy with precision"
    }
  ];
  
  return (
    <Box mt={16} mb={12}>
      <Heading 
        as="h2" 
        textAlign="center" 
        fontSize={{ base: "2xl", md: "3xl" }} 
        fontWeight="bold" 
        color="white"
        mb={12}
      >
        Why Choose <Text as="span" color="#00C6E0">Atomik Trading</Text>
      </Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
        {features.map((feature, index) => (
          <MotionBox
            key={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={itemVariants}
          >
            <VStack 
              spacing={4} 
              p={6} 
              bg="rgba(0, 0, 0, 0.3)" 
              borderRadius="lg" 
              border="1px solid"
              borderColor="whiteAlpha.100"
              align="flex-start"
              height="100%"
              _hover={{
                borderColor: "#00C6E0",
                boxShadow: "0 0 20px rgba(0, 198, 224, 0.2)",
                transform: "translateY(-5px)"
              }}
              transition="all 0.3s ease"
            >
              <Center
                w={12}
                h={12}
                borderRadius="lg"
                bg="rgba(0, 198, 224, 0.1)"
                color="#00C6E0"
              >
                {feature.icon}
              </Center>
              <Heading as="h3" fontSize="lg" fontWeight="bold" color="white">
                {feature.title}
              </Heading>
              <Text color="whiteAlpha.700" fontSize="sm">
                {feature.description}
              </Text>
            </VStack>
          </MotionBox>
        ))}
      </SimpleGrid>
    </Box>
  );
};

// FAQ Section
const FAQ = () => {
  const faqs = [
    {
      question: "How does Atomik Trading work?",
      answer: "Atomik Trading connects to your trading account via API, allowing you to create webhooks that automatically execute trades based on signals from your preferred charting platform, indicator, or trading bot."
    },
    {
      question: "Which brokers are supported?",
      answer: "Currently, we support Tradovate with plans to add more brokers in the near future. Our platform is designed to be broker-agnostic, making it easy to scale with additional brokers."
    },
    {
      question: "What is the 14-day free trial?",
      answer: "All our plans include a 14-day free trial that gives you full access to all features. You can cancel anytime during the trial period without being charged."
    },
    {
      question: "How secure is my trading account?",
      answer: "Security is our top priority. We use industry-standard 256-bit SSL encryption and never store your broker passwords. We only maintain the API tokens needed to execute trades on your behalf."
    },
    {
      question: "Can I cancel or change my subscription?",
      answer: "Yes, you can cancel or change your subscription at any time. For monthly and yearly plans, you'll retain access until the end of your billing period."
    },
    {
      question: "What's the difference between yearly and lifetime plans?",
      answer: "Yearly plans are billed annually at a discounted rate compared to monthly plans. Lifetime plans are a one-time payment that gives you permanent access to the features of that tier."
    }
  ];
  
  return (
    <Box mt={20} mb={16}>
      <Heading 
        as="h2" 
        textAlign="center" 
        fontSize={{ base: "2xl", md: "3xl" }} 
        fontWeight="bold" 
        color="white"
        mb={10}
      >
        Frequently Asked Questions
      </Heading>
      
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} maxW="container.lg" mx="auto">
        {faqs.map((faq, index) => (
          <MotionBox
            key={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={itemVariants}
          >
            <Box 
              p={6} 
              bg="rgba(0, 0, 0, 0.3)" 
              borderRadius="lg" 
              border="1px solid"
              borderColor="whiteAlpha.100"
              _hover={{
                borderColor: "#00C6E0",
                boxShadow: "0 0 15px rgba(0, 198, 224, 0.15)",
              }}
              transition="all 0.3s ease"
            >
              <Heading as="h3" fontSize="md" fontWeight="bold" color="white" mb={3}>
                {faq.question}
              </Heading>
              <Text color="whiteAlpha.800" fontSize="sm">
                {faq.answer}
              </Text>
            </Box>
          </MotionBox>
        ))}
      </SimpleGrid>
    </Box>
  );
};

// Main PricingPage component
const PricingPage = () => {
  // State
  const [selectedInterval, setSelectedInterval] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Hooks
  const toast = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, register, login } = useAuth();
  const componentMounted = useRef(true);
  
  // Responsive adjustments
  const pricingColumns = useBreakpointValue({ base: 1, md: 2, lg: 2 });

  const containerSpacing = useBreakpointValue({ 
    base: { py: 4, px: 2 },  // On mobile, use minimal padding
    md: { py: 6, px: 4 },    // On tablets, slightly more padding
    lg: { py: 8, px: 4 }     // On desktop, use more vertical padding
  });
  
  // Check for authentication on mount
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const fromAuth = queryParams.get('source') === 'auth';
    const isRegister = queryParams.get('register') === 'true';
    
    // If user is authenticated and NOT coming from auth page, redirect to dashboard
    if (isAuthenticated && !fromAuth) {
      logger.info('User is already authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
    
    // Cleanup
    return () => {
      componentMounted.current = false;
    };
  }, [isAuthenticated, navigate]);
  
  // Handle plan selection
  const handleSelectPlan = (tier, interval) => {
    logger.info(`Selected ${tier} plan with ${interval} billing`);
    setSelectedPlan({
      tier,
      interval
    });
    setShowRegistration(true);
  };
  
  // Handle registration submission
  const handleRegistrationSubmit = async (formData) => {
    if (!selectedPlan) return;
    if (isSubmitting || isTransitioning) {
      return; // Prevent duplicate submissions
    }
    
    try {
      setIsSubmitting(true);
      logger.info(`Processing registration for ${formData.email} with ${selectedPlan.tier} plan`);
      
      // NEW: Call prepare-registration endpoint
      const response = await axiosInstance.post('/api/v1/auth/prepare-registration', {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        plan: selectedPlan.tier,
        interval: selectedPlan.interval
      });
      
      if (response.data?.checkout_url) {
        logger.info(`Registration prepared, redirecting to Stripe`);
        setIsTransitioning(true);
        
        // Store session token temporarily (just for PaymentSuccess fallback)
        sessionStorage.setItem('registration_session_token', response.data.session_token);
        
        // Redirect to Stripe
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error("No checkout URL returned from server");
      }
      
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
  
  // Handle registration modal close
  const handleCloseRegistration = () => {
    setShowRegistration(false);
    setSelectedPlan(null);
  };
  
  return (
    // Replace your existing MotionBox container with this one
    <MotionBox 
      minH="100vh" 
      bg="black" 
      py={containerSpacing.py}
      px={containerSpacing.px}
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
      
      <Container maxW="container.xl" position="relative" zIndex={1}>
        <VStack spacing={4} mb={8}>
          <MotionBox variants={itemVariants}>
            <Heading 
              fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
              fontWeight="bold"
              color="white"
              textAlign="center"
              mb={2}
            >
              Pricing Plans for Every <Text as="span" color="#00C6E0">Trader</Text>
            </Heading>
          </MotionBox>
          
          <MotionBox variants={itemVariants} maxW="container.md" textAlign="center">
            <Text
              fontSize={{ base: "sm", md: "md" }}
              color="whiteAlpha.800"
            >
              Choose the perfect plan to automate your trading strategy with precision and reliability.
              All plans include our core features with flexible billing options.
            </Text>
          </MotionBox>

          {/* Pricing Toggle */}
          <MotionBox variants={itemVariants}>
            <PricingToggle 
              selectedInterval={selectedInterval} 
              onChange={setSelectedInterval} 
            />
          </MotionBox>
        </VStack>
        
        {/* Pricing Cards - now with only 2 tiers */}
        <SimpleGrid 
        columns={pricingColumns > 2 ? 2 : pricingColumns} 
        spacing={{ base: 4, md: 6 }}  /* Reduce spacing on smaller screens */
        mb={8}  /* Reduced from mb={16} */
        maxW="container.lg"
        mx="auto"
      >
        <MotionBox variants={itemVariants}>
          <PriceCard 
            tier="pro"
            billingInterval={selectedInterval} 
            onClick={handleSelectPlan}
            isPopular={true}
          />
        </MotionBox>
        
        <MotionBox variants={itemVariants}>
          <PriceCard 
            tier="elite"
            billingInterval={selectedInterval} 
            onClick={handleSelectPlan}
            isPopular={false}
          />
        </MotionBox>
      </SimpleGrid>
        
        {/* Feature Highlights */}
        <FeatureHighlights />
        
        {/* FAQ Section */}
        <FAQ />
        
        {/* Security Badges Section */}
        <SecurityBadges />
      </Container>
      
      {/* Registration Modal */}
      <Modal 
        isOpen={showRegistration} 
        onClose={handleCloseRegistration}
        isCentered
        size="xl"
        closeOnOverlayClick={!isSubmitting}
        closeOnEsc={!isSubmitting}
      >
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
        <ModalContent
          bg="rgba(0, 0, 0, 0.8)"
          backdropFilter="blur(10px)"
          borderRadius="xl"
          border="1px solid rgba(255, 255, 255, 0.1)"
          boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
          p={6}
        >
          <ModalHeader 
            color="white" 
            textAlign="center"
            borderBottom="1px solid" 
            borderColor="whiteAlpha.200" 
            pb={4}
          >
            {selectedPlan?.tier === 'starter' ? 'Get Started Free' : `Join ${selectedPlan?.tier} Plan`}
          </ModalHeader>
          {!isSubmitting && <ModalCloseButton color="white" />}
          <ModalBody py={6}>
            <RegistrationForm
              selectedPlan={selectedPlan?.tier}
              selectedInterval={selectedPlan?.interval}
              onSubmit={handleRegistrationSubmit}
              onCancel={handleCloseRegistration}
              isSubmitting={isSubmitting}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Loading overlay during transitions */}
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
    </MotionBox>
  );
};

export default PricingPage;