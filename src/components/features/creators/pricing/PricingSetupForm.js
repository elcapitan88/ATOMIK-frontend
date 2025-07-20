import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Switch,
  useToast,
  Flex,
  Circle,
  keyframes,
  SimpleGrid,
} from '@chakra-ui/react';
import { DollarSign, Sparkles, Zap, Gift } from 'lucide-react';

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 198, 224, 0.3); }
  50% { box-shadow: 0 0 20px rgba(0, 198, 224, 0.6), 0 0 30px rgba(0, 198, 224, 0.4); }
  100% { box-shadow: 0 0 5px rgba(0, 198, 224, 0.3); }
`;

const PricingSetupForm = ({ 
  initialData = {}, 
  onSave, 
  isLoading = false 
}) => {
  const [selectedModel, setSelectedModel] = useState(initialData.pricingType || 'free');
  const [price, setPrice] = useState(initialData.baseAmount || '');
  const [hasFreeTrial, setHasFreeTrial] = useState(initialData.isTrialEnabled || false);
  const [revenuePreview, setRevenuePreview] = useState(0);
  
  const toast = useToast();

  // Instant revenue calculation
  useEffect(() => {
    if (price && selectedModel !== 'free') {
      const monthlyRevenue = parseFloat(price) || 0;
      const platformFee = 0.15; // 15% average
      const netRevenue = monthlyRevenue * (1 - platformFee) * 100; // Assume 100 subscribers for preview
      setRevenuePreview(netRevenue);
    } else {
      setRevenuePreview(0);
    }
  }, [price, selectedModel]);

  const pricingModels = [
    {
      id: 'free',
      icon: Gift,
      title: 'Free',
      subtitle: 'Build your audience',
      color: 'green.400',
      bgGradient: 'linear(to-br, green.400, green.600)'
    },
    {
      id: 'subscription',
      icon: Zap,
      title: 'Subscription',
      subtitle: 'Recurring revenue',
      color: 'blue.400',
      bgGradient: 'linear(to-br, blue.400, purple.500)'
    }
  ];

  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);
    if (modelId === 'free') {
      setPrice('');
      setHasFreeTrial(false);
    }
  };

  const handleSave = () => {
    const formData = {
      pricingType: selectedModel,
      baseAmount: price,
      isTrialEnabled: hasFreeTrial,
      trialDays: hasFreeTrial ? 7 : 0,
      billingInterval: 'monthly'
    };

    // Simple validation
    if (selectedModel === 'subscription' && (!price || parseFloat(price) < 1)) {
      toast({
        title: "Add a price",
        description: "Subscription requires a monthly price of at least $1",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    onSave(formData);
    
    // Success feedback with wow factor
    toast({
      title: "✨ Pricing saved!",
      description: selectedModel === 'free' ? "Your strategy is now free to access" : `Monthly revenue potential: $${revenuePreview.toLocaleString()}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box maxW="500px" mx="auto">
      <VStack spacing={8}>
        {/* Header */}
        <VStack spacing={2} textAlign="center">
          <HStack spacing={2}>
            <Circle size="10" bg="blue.500" color="white">
              <Sparkles size={20} />
            </Circle>
            <Text fontSize="2xl" fontWeight="bold" color="white">
              Monetize Your Strategy
            </Text>
          </HStack>
          <Text color="whiteAlpha.700" fontSize="lg">
            Choose how you want to earn
          </Text>
        </VStack>

        {/* Pricing Model Selection - Only 2 simple choices */}
        <SimpleGrid columns={2} spacing={4} w="full">
          {pricingModels.map((model) => {
            const IconComponent = model.icon;
            const isSelected = selectedModel === model.id;
            
            return (
              <Box
                key={model.id}
                as="button"
                onClick={() => handleModelSelect(model.id)}
                p={6}
                borderRadius="xl"
                borderWidth="2px"
                borderColor={isSelected ? model.color : "whiteAlpha.200"}
                bg={isSelected ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)"}
                backdropFilter="blur(10px)"
                transform={isSelected ? "scale(1.02)" : "scale(1)"}
                transition="all 0.3s ease"
                _hover={{
                  transform: "scale(1.02)",
                  borderColor: model.color,
                  bg: "rgba(255, 255, 255, 0.1)"
                }}
                animation={isSelected ? `${glow} 2s infinite` : undefined}
                position="relative"
                overflow="hidden"
              >
                {/* Gradient background for selected */}
                {isSelected && (
                  <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    bgGradient={model.bgGradient}
                    opacity="0.1"
                    borderRadius="xl"
                  />
                )}
                
                <VStack spacing={3} position="relative">
                  <Circle size="12" bg={model.color} color="white">
                    <IconComponent size={24} />
                  </Circle>
                  <VStack spacing={1}>
                    <Text fontWeight="bold" color="white" fontSize="lg">
                      {model.title}
                    </Text>
                    <Text color="whiteAlpha.700" fontSize="sm">
                      {model.subtitle}
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            );
          })}
        </SimpleGrid>

        {/* Price Input - Only appears for subscription */}
        {selectedModel === 'subscription' && (
          <VStack spacing={4} w="full">
            <Box textAlign="center">
              <Text color="white" fontSize="lg" fontWeight="medium" mb={2}>
                Monthly Price
              </Text>
              <InputGroup size="lg">
                <InputLeftElement color="whiteAlpha.600">
                  <DollarSign size={20} />
                </InputLeftElement>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="29"
                  bg="rgba(255, 255, 255, 0.1)"
                  borderColor="whiteAlpha.300"
                  color="white"
                  fontSize="xl"
                  textAlign="center"
                  _placeholder={{ color: 'whiteAlpha.500' }}
                  _focus={{
                    borderColor: "blue.400",
                    boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.6)"
                  }}
                />
              </InputGroup>
            </Box>

            {/* Free Trial Toggle */}
            <Flex
              p={4}
              bg="rgba(255, 255, 255, 0.05)"
              borderRadius="lg"
              w="full"
              justify="space-between"
              align="center"
            >
              <VStack align="start" spacing={0}>
                <Text color="white" fontWeight="medium">
                  7-Day Free Trial
                </Text>
                <Text color="whiteAlpha.600" fontSize="sm">
                  Let users try before they buy
                </Text>
              </VStack>
              <Switch
                isChecked={hasFreeTrial}
                onChange={(e) => setHasFreeTrial(e.target.checked)}
                colorScheme="blue"
                size="lg"
              />
            </Flex>

            {/* Revenue Preview - Wow factor! */}
            {revenuePreview > 0 && (
              <Box
                p={4}
                bg="linear-gradient(135deg, rgba(72, 187, 120, 0.2), rgba(56, 178, 172, 0.2))"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="green.400"
                w="full"
                textAlign="center"
              >
                <Text color="green.300" fontSize="sm" fontWeight="medium" mb={1}>
                  Monthly Revenue Potential
                </Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">
                  ${revenuePreview.toLocaleString()}
                </Text>
                <Text color="whiteAlpha.700" fontSize="xs">
                  Based on 100 subscribers after 15% platform fee
                </Text>
              </Box>
            )}
          </VStack>
        )}

        {/* Action Button */}
        <Button
          onClick={handleSave}
          size="lg"
          w="full"
          h="14"
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          color="white"
          fontWeight="bold"
          fontSize="lg"
          isLoading={isLoading}
          _hover={{
            transform: "translateY(-1px)",
            boxShadow: "0 10px 25px rgba(102, 126, 234, 0.4)"
          }}
          _active={{
            transform: "translateY(0px)"
          }}
          transition="all 0.2s"
        >
          {selectedModel === 'free' ? 'Keep Strategy Free' : 'Start Earning'}
        </Button>

        {/* Simple info */}
        <Text color="whiteAlpha.600" fontSize="sm" textAlign="center">
          Platform fees: 20% (Bronze), 15% (Silver), 10% (Gold)
        </Text>
      </VStack>
    </Box>
  );
};

export default PricingSetupForm;