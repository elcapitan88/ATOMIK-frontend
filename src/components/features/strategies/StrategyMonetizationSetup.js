// frontend/src/components/features/strategies/StrategyMonetizationSetup.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Switch,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Divider,
  Badge,
  Icon,
  Tooltip,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Flex,
  Grid,
  GridItem,
  useToast
} from '@chakra-ui/react';
import {
  DollarSign,
  Calendar,
  Clock,
  Zap,
  TrendingUp,
  HelpCircle,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const PRICING_TYPES = [
  {
    key: 'monthly',
    label: 'Monthly Subscription',
    icon: Calendar,
    description: 'Recurring monthly payments',
    color: 'blue',
    billingInterval: 'month'
  },
  {
    key: 'yearly',
    label: 'Yearly Subscription',
    icon: TrendingUp,
    description: 'Annual payments with discount potential',
    color: 'green',
    billingInterval: 'year'
  },
  {
    key: 'lifetime',
    label: 'Lifetime Access',
    icon: Zap,
    description: 'One-time payment for permanent access',
    color: 'purple',
    billingInterval: null
  },
  {
    key: 'setup',
    label: 'Setup Fee',
    icon: Clock,
    description: 'One-time fee charged before subscription',
    color: 'orange',
    billingInterval: null
  }
];

const PricingOptionCard = ({ 
  type, 
  isEnabled, 
  onToggle, 
  pricing, 
  onPricingChange, 
  validationErrors = {},
  isDisabled = false 
}) => {
  const IconComponent = type.icon;
  
  return (
    <Box
      p={4}
      borderRadius="lg"
      border="1px solid"
      borderColor={isEnabled ? "#00C6E0" : "rgba(255, 255, 255, 0.15)"}
      bg={isEnabled ? "rgba(0, 198, 224, 0.05)" : "rgba(255, 255, 255, 0.02)"}
      opacity={isDisabled ? 0.6 : 1}
      transition="all 0.2s ease"
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Box
              p={2}
              borderRadius="md"
              bg={`${type.color}.500`}
              opacity={0.8}
            >
              <Icon as={IconComponent} size="16px" color="white" />
            </Box>
            <Box>
              <Text color="white" fontWeight="medium" fontSize="sm">
                {type.label}
              </Text>
              <Text color="rgba(255, 255, 255, 0.6)" fontSize="xs">
                {type.description}
              </Text>
            </Box>
          </HStack>
          <Switch
            isChecked={isEnabled}
            onChange={(e) => onToggle(type.key, e.target.checked)}
            colorScheme="teal"
            isDisabled={isDisabled}
          />
        </HStack>

        {/* Pricing Input */}
        {isEnabled && (
          <VStack spacing={3} align="stretch">
            <FormControl isInvalid={!!validationErrors[type.key]?.amount}>
              <FormLabel fontSize="sm" color="white" mb={1}>
                Price Amount (USD)
              </FormLabel>
              <NumberInput
                value={pricing.amount || ''}
                onChange={(value) => onPricingChange(type.key, 'amount', value)}
                min={type.key === 'setup' ? 1 : type.key === 'monthly' ? 5 : 10}
                max={10000}
                precision={2}
              >
                <NumberInputField
                  bg="rgba(255, 255, 255, 0.05)"
                  borderColor="rgba(255, 255, 255, 0.15)"
                  color="white"
                  _placeholder={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  _hover={{ borderColor: "rgba(0, 198, 224, 0.4)" }}
                  _focus={{ 
                    borderColor: "#00C6E0",
                    boxShadow: "0 0 0 1px #00C6E0"
                  }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper color="white" />
                  <NumberDecrementStepper color="white" />
                </NumberInputStepper>
              </NumberInput>
              {validationErrors[type.key]?.amount && (
                <FormErrorMessage fontSize="xs">
                  {validationErrors[type.key].amount}
                </FormErrorMessage>
              )}
              <FormHelperText fontSize="xs" color="rgba(255, 255, 255, 0.6)">
                {type.key === 'setup' && 'Minimum $1'}
                {type.key === 'monthly' && 'Minimum $5/month'}
                {(type.key === 'yearly' || type.key === 'lifetime') && 'Minimum $10'}
              </FormHelperText>
            </FormControl>

            {/* Trial Period for Subscriptions */}
            {(type.key === 'monthly' || type.key === 'yearly') && (
              <FormControl>
                <HStack justify="space-between" mb={2}>
                  <FormLabel fontSize="sm" color="white" mb={0}>
                    Free Trial Period
                  </FormLabel>
                  <Switch
                    size="sm"
                    isChecked={pricing.hasTrialPeriod || false}
                    onChange={(e) => onPricingChange(type.key, 'hasTrialPeriod', e.target.checked)}
                    colorScheme="teal"
                  />
                </HStack>
                
                {pricing.hasTrialPeriod && (
                  <NumberInput
                    value={pricing.trialDays || 7}
                    onChange={(value) => onPricingChange(type.key, 'trialDays', parseInt(value) || 7)}
                    min={1}
                    max={30}
                    size="sm"
                  >
                    <NumberInputField
                      bg="rgba(255, 255, 255, 0.05)"
                      borderColor="rgba(255, 255, 255, 0.15)"
                      color="white"
                      _hover={{ borderColor: "rgba(0, 198, 224, 0.4)" }}
                      _focus={{ 
                        borderColor: "#00C6E0",
                        boxShadow: "0 0 0 1px #00C6E0"
                      }}
                    />
                  </NumberInput>
                )}
                <FormHelperText fontSize="xs" color="rgba(255, 255, 255, 0.6)">
                  {pricing.hasTrialPeriod ? 
                    `${pricing.trialDays || 7} days free, then ${pricing.amount ? `$${pricing.amount}` : '$0'}/${type.billingInterval}` :
                    'Add a free trial to increase conversions'
                  }
                </FormHelperText>
              </FormControl>
            )}
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

const RevenueEstimator = ({ pricingOptions }) => {
  const calculateEstimatedRevenue = () => {
    let monthly = 0;
    let yearly = 0;
    
    // Estimate based on enabled pricing options
    if (pricingOptions.monthly?.enabled && pricingOptions.monthly?.amount) {
      monthly += parseFloat(pricingOptions.monthly.amount) * 10; // Assume 10 subscribers
    }
    
    if (pricingOptions.yearly?.enabled && pricingOptions.yearly?.amount) {
      yearly += parseFloat(pricingOptions.yearly.amount) * 5; // Assume 5 yearly subscribers
      monthly += (yearly / 12);
    }
    
    if (pricingOptions.lifetime?.enabled && pricingOptions.lifetime?.amount) {
      monthly += (parseFloat(pricingOptions.lifetime.amount) * 2) / 12; // Assume 2 lifetime per month
    }
    
    return {
      monthly: monthly.toFixed(2),
      yearly: (monthly * 12).toFixed(2)
    };
  };

  const estimates = calculateEstimatedRevenue();
  
  if (estimates.monthly === '0.00') return null;

  return (
    <Box
      p={4}
      bg="rgba(0, 198, 224, 0.08)"
      borderRadius="lg"
      border="1px solid rgba(0, 198, 224, 0.2)"
    >
      <HStack justify="space-between" mb={3}>
        <Text color="white" fontWeight="medium" fontSize="sm">
          Revenue Estimation
        </Text>
        <Tooltip label="Based on conservative subscriber projections">
          <IconButton
            icon={<HelpCircle size={14} />}
            variant="ghost"
            size="xs"
            color="rgba(255, 255, 255, 0.6)"
          />
        </Tooltip>
      </HStack>
      
      <Grid templateColumns="1fr 1fr" gap={4}>
        <GridItem>
          <Text fontSize="xs" color="rgba(255, 255, 255, 0.7)" mb={1}>
            Estimated Monthly
          </Text>
          <Text color="#00C6E0" fontWeight="bold" fontSize="lg">
            ${estimates.monthly}
          </Text>
        </GridItem>
        <GridItem>
          <Text fontSize="xs" color="rgba(255, 255, 255, 0.7)" mb={1}>
            Estimated Yearly
          </Text>
          <Text color="#00C6E0" fontWeight="bold" fontSize="lg">
            ${estimates.yearly}
          </Text>
        </GridItem>
      </Grid>
      
      <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)" mt={2}>
        *Platform takes 15% service fee. Estimates based on similar strategies.
      </Text>
    </Box>
  );
};

const StrategyMonetizationSetup = ({ 
  webhookId,
  existingMonetization = null,
  onComplete,
  onCancel 
}) => {
  const [pricingOptions, setPricingOptions] = useState({
    monthly: { enabled: false, amount: '', hasTrialPeriod: false, trialDays: 7 },
    yearly: { enabled: false, amount: '', hasTrialPeriod: false, trialDays: 7 },
    lifetime: { enabled: false, amount: '' },
    setup: { enabled: false, amount: '' }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const toast = useToast();

  // Load existing monetization data
  useEffect(() => {
    if (existingMonetization && existingMonetization.prices) {
      const updatedOptions = { ...pricingOptions };
      
      existingMonetization.prices.forEach(price => {
        if (updatedOptions[price.price_type]) {
          updatedOptions[price.price_type] = {
            enabled: price.is_active,
            amount: price.amount.toString(),
            hasTrialPeriod: price.trial_period_days > 0,
            trialDays: price.trial_period_days || 7
          };
        }
      });
      
      setPricingOptions(updatedOptions);
    }
  }, [existingMonetization]);

  const handlePricingToggle = (priceType, enabled) => {
    setPricingOptions(prev => ({
      ...prev,
      [priceType]: {
        ...prev[priceType],
        enabled
      }
    }));

    // Clear validation errors when disabling
    if (!enabled && validationErrors[priceType]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[priceType];
        return newErrors;
      });
    }
  };

  const handlePricingChange = (priceType, field, value) => {
    setPricingOptions(prev => ({
      ...prev,
      [priceType]: {
        ...prev[priceType],
        [field]: value
      }
    }));

    // Clear validation errors on change
    if (validationErrors[priceType]?.[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [priceType]: {
          ...prev[priceType],
          [field]: undefined
        }
      }));
    }
  };

  const validatePricingOptions = () => {
    const errors = {};
    let hasEnabledOption = false;

    Object.entries(pricingOptions).forEach(([key, option]) => {
      if (option.enabled) {
        hasEnabledOption = true;
        
        if (!option.amount || parseFloat(option.amount) <= 0) {
          if (!errors[key]) errors[key] = {};
          errors[key].amount = 'Amount is required';
        } else {
          const amount = parseFloat(option.amount);
          const minAmounts = { setup: 1, monthly: 5, yearly: 10, lifetime: 10 };
          
          if (amount < minAmounts[key]) {
            if (!errors[key]) errors[key] = {};
            errors[key].amount = `Minimum $${minAmounts[key]} required`;
          }
        }
      }
    });

    if (!hasEnabledOption) {
      errors.general = 'At least one pricing option must be enabled';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validatePricingOptions()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before continuing",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare pricing data for API
      const enabledPricing = Object.entries(pricingOptions)
        .filter(([_, option]) => option.enabled)
        .map(([key, option]) => ({
          price_type: key,
          amount: parseFloat(option.amount),
          billing_interval: PRICING_TYPES.find(t => t.key === key)?.billingInterval,
          trial_period_days: option.hasTrialPeriod ? (option.trialDays || 7) : 0
        }));

      // Call API to set up monetization
      const response = await fetch(`/api/v1/strategies/${webhookId}/setup-monetization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          pricing_options: enabledPricing
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to set up monetization');
      }

      const result = await response.json();
      
      toast({
        title: "Monetization Setup Complete",
        description: "Your strategy pricing has been configured successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onComplete && onComplete(result);
      
    } catch (error) {
      console.error('Monetization setup error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to set up monetization",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasEnabledOptions = Object.values(pricingOptions).some(option => option.enabled);

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Box>
        <Text fontSize="lg" fontWeight="bold" color="white" mb={2}>
          Set Up Strategy Monetization
        </Text>
        <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">
          Configure pricing options for your strategy. You can offer multiple pricing tiers to maximize revenue.
        </Text>
      </Box>

      {/* Validation Error */}
      {validationErrors.general && (
        <Alert status="error" bg="rgba(255, 0, 0, 0.1)" border="1px solid rgba(255, 0, 0, 0.3)">
          <AlertIcon color="red.300" />
          <Text color="red.300" fontSize="sm">
            {validationErrors.general}
          </Text>
        </Alert>
      )}

      {/* Pricing Options */}
      <VStack spacing={4} align="stretch">
        <Text color="white" fontWeight="medium">
          Pricing Options
        </Text>
        
        {PRICING_TYPES.map(type => (
          <PricingOptionCard
            key={type.key}
            type={type}
            isEnabled={pricingOptions[type.key].enabled}
            onToggle={handlePricingToggle}
            pricing={pricingOptions[type.key]}
            onPricingChange={handlePricingChange}
            validationErrors={validationErrors}
          />
        ))}
      </VStack>

      {/* Revenue Estimator */}
      {hasEnabledOptions && (
        <RevenueEstimator pricingOptions={pricingOptions} />
      )}

      {/* Platform Fee Notice */}
      <Alert status="info" bg="rgba(0, 198, 224, 0.1)" border="1px solid rgba(0, 198, 224, 0.3)">
        <AlertIcon color="#00C6E0" />
        <Box>
          <Text color="white" fontWeight="medium" fontSize="sm" mb={1}>
            Platform Service Fee: 15%
          </Text>
          <Text color="rgba(255, 255, 255, 0.8)" fontSize="xs">
            This covers payment processing, infrastructure, customer support, and platform maintenance. 
            You keep 85% of all revenue from your strategy subscriptions.
          </Text>
        </Box>
      </Alert>

      {/* Action Buttons */}
      <HStack justify="flex-end" spacing={3} pt={4}>
        <Button
          variant="ghost"
          onClick={onCancel}
          isDisabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          bg="#00C6E0"
          color="white"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          loadingText="Setting up..."
          rightIcon={<CheckCircle size={16} />}
          _hover={{
            bg: '#0099B8'
          }}
          isDisabled={!hasEnabledOptions}
        >
          Complete Setup
        </Button>
      </HStack>
    </VStack>
  );
};

export default StrategyMonetizationSetup;