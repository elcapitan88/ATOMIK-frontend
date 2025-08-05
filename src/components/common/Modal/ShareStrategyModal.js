import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormHelperText,
  Textarea,
  useToast,
  VStack,
  Text,
  Box,
  Switch,
  Flex,
  Select,
  Alert,
  AlertIcon,
  Spinner,
  Badge,
  HStack,
  Icon
} from '@chakra-ui/react';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';
import { STRATEGY_TYPE_OPTIONS } from '@utils/constants/strategyTypes';
import { Info, User, Share2, DollarSign, Lock, Users, TrendingUp } from 'lucide-react';

const ShareStrategyModal = ({ isOpen, onClose, webhook, onWebhookUpdate }) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isShared: false,
    strategyType: '',
  });

  // Debug logging
  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  useEffect(() => {
    console.log('Webhook updated:', webhook);
  }, [webhook]);

  // Reset and sync form data when modal opens or webhook changes
  useEffect(() => {
    if (webhook) {
      setFormData({
        name: webhook.name || '',
        description: webhook.details || '',
        isShared: Boolean(webhook.is_shared),
        strategyType: webhook.strategy_type || webhook.strategyType || null
      });
    }
  }, [webhook]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.isActive) {
      if (!formData.strategyType) {
        toast({
          title: "Strategy Type Required",
          description: "Please select a strategy type before sharing",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return false;
      }
      if (!formData.description) {
        toast({
          title: "Description Required",
          description: "Please provide a description of your strategy",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return false;
      }
    }
    return true;
  };

  const handleToggleShare = async (e) => {
    try {
        const newSharedState = e.target.checked;
        setIsSubmitting(true);

        // If trying to deactivate sharing, make sure we keep the existing strategy type
        const data = {
            isActive: newSharedState,
            description: formData.description,
            strategyType: formData.strategyType // Keep existing strategy type even when deactivating
        };

        console.log('Sending toggle data:', data);

        // Optimistically update UI
        setFormData(prev => ({
            ...prev,
            isShared: newSharedState
        }));

        const response = await webhookApi.toggleSharing(webhook.token, data);

        // Update parent component
        if (onWebhookUpdate) {
            onWebhookUpdate(response);
        }

        toast({
            title: newSharedState ? "Strategy Sharing Activated" : "Strategy Sharing Deactivated",
            status: "success",
            duration: 3000,
            isClosable: true,
        });

    } catch (error) {
        // Revert on error
        setFormData(prev => ({
            ...prev,
            isShared: !e.target.checked
        }));

        toast({
            title: "Error",
            description: error.message || "Failed to update sharing status",
            status: "error",
            duration: 5000,
            isClosable: true,
        });
    } finally {
        setIsSubmitting(false);
    }
};

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      size="xl"
      closeOnOverlayClick={!isSubmitting}
    >
      <ModalOverlay 
        bg="blackAlpha.300" 
        backdropFilter="blur(10px)" 
      />
      <ModalContent 
        bg="rgba(0, 0, 0, 0.75)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.5)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        borderRadius="xl"
        color="white"
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.1)" 
          pb={4} 
          color="white"
          pr={12}
        >
          <HStack spacing={3}>
            <Icon as={Share2} size="20px" color="#00C6E0" />
            <Text>Manage Strategy Sharing</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton 
          color="white"
          _hover={{ bg: 'whiteAlpha.200' }}
          isDisabled={isSubmitting}
        />
        
        <ModalBody py={6}>
          <VStack spacing={6}>
            {/* Strategy Overview Card */}
            <Box 
              width="full" 
              p={4} 
              bg="rgba(255, 255, 255, 0.05)" 
              borderRadius="lg" 
              border="1px solid rgba(255, 255, 255, 0.1)"
            >
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text color="white" fontWeight="semibold" fontSize="lg">
                    {formData.name || 'Unnamed Strategy'}
                  </Text>
                  <Badge 
                    colorScheme={
                      webhook?.usage_intent === 'personal' ? 'gray' :
                      webhook?.usage_intent === 'share_free' ? 'green' :
                      webhook?.usage_intent === 'monetize' ? 'yellow' : 'gray'
                    }
                    fontSize="xs"
                    px={2}
                    py={1}
                  >
                    {webhook?.usage_intent === 'personal' && 'Personal Use'}
                    {webhook?.usage_intent === 'share_free' && 'Free Sharing'}
                    {webhook?.usage_intent === 'monetize' && 'Monetized'}
                    {!webhook?.usage_intent && 'Legacy Strategy'}
                  </Badge>
                </HStack>
                
                <HStack spacing={2}>
                  <Icon 
                    as={
                      webhook?.usage_intent === 'personal' ? Lock :
                      webhook?.usage_intent === 'share_free' ? Users :
                      webhook?.usage_intent === 'monetize' ? DollarSign : User
                    } 
                    size="14px" 
                    color="rgba(255, 255, 255, 0.7)" 
                  />
                  <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)">
                    {webhook?.usage_intent === 'personal' && 'Originally created for private use'}
                    {webhook?.usage_intent === 'share_free' && 'Originally created for free community sharing'}
                    {webhook?.usage_intent === 'monetize' && 'Originally created with monetization intent'}
                    {!webhook?.usage_intent && 'Legacy strategy - can be shared or monetized'}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Strategy Type Selector */}
            <FormControl isRequired={formData.isActive}>
              <FormLabel color="white">Strategy Type</FormLabel>
              <Select
                name="strategyType"
                value={formData.strategyType}
                onChange={handleInputChange}
                bg="whiteAlpha.100"
                border="1px solid"
                borderColor="whiteAlpha.200"
                _hover={{ borderColor: "whiteAlpha.300" }}
                _focus={{ 
                  borderColor: "rgba(0, 198, 224, 0.6)",
                  boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                }}
                color="white"
                placeholder="Select strategy type"
                isDisabled={isSubmitting}
              >
                {STRATEGY_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <FormHelperText color="whiteAlpha.600">
                Choose the type that best describes your strategy
              </FormHelperText>
            </FormControl>

            {/* Strategy Description */}
            <FormControl isRequired={formData.isActive}>
              <FormLabel color="white">Strategy Description</FormLabel>
              <Textarea
                name="description"
                placeholder="Describe your strategy..."
                value={formData.description}
                onChange={handleInputChange}
                bg="whiteAlpha.100"
                border="1px solid"
                borderColor="whiteAlpha.200"
                _hover={{ borderColor: "whiteAlpha.300" }}
                _focus={{ 
                  borderColor: "rgba(0, 198, 224, 0.6)",
                  boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                }}
                color="white"
                rows={3}
                isDisabled={isSubmitting}
              />
              <FormHelperText color="whiteAlpha.600">
                Provide details about your strategy's approach and objectives
              </FormHelperText>
            </FormControl>

            {/* Sharing Toggle */}
            <Flex
              width="full"
              justifyContent="space-between"
              alignItems="center"
              p={4}
              bg="whiteAlpha.100"
              borderRadius="md"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
              opacity={isSubmitting ? 0.7 : 1}
              transition="opacity 0.2s"
            >
              <Box>
                <Text color="white" fontWeight="medium">
                  {formData.isShared ? 'Strategy Sharing Active' : 'Activate Strategy Sharing'}
                </Text>
                <Text color="whiteAlpha.600" fontSize="sm">
                  {formData.isShared 
                    ? 'Your strategy is currently visible in the marketplace' 
                    : 'Make this strategy discoverable by other users'
                  }
                </Text>
              </Box>
              <Box position="relative">
                {isSubmitting && (
                  <Spinner
                    position="absolute"
                    right="100%"
                    mr={2}
                    size="sm"
                    color="blue.500"
                  />
                )}
                <Switch
                  isChecked={formData.isShared}  // Use formData.isShared directly
                  onChange={handleToggleShare}
                  isDisabled={isSubmitting}
                  colorScheme="green"
                  size="lg"
                  sx={{
                      '& .chakra-switch__track': {
                          transition: 'background-color 0.2s'
                      }
                  }}
              />
              </Box>
            </Flex>

            {/* Intent-Aware Info Alert */}
            {formData.isShared && (
              <Alert 
                status="success" 
                bg="rgba(72, 187, 120, 0.1)" 
                border="1px solid rgba(72, 187, 120, 0.3)"
                borderRadius="md"
                color="white"
              >
                <AlertIcon as={Share2} color="green.300" />
                <VStack spacing={1} align="flex-start">
                  <Text fontSize="sm" fontWeight="medium">
                    Strategy is now shared in the marketplace
                  </Text>
                  <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                    {webhook?.usage_intent === 'monetize' 
                      ? 'Users can discover and purchase your strategy' 
                      : 'Users can discover and follow your strategy for free'
                    }
                  </Text>
                </VStack>
              </Alert>
            )}
            
            {!formData.isShared && webhook?.usage_intent === 'personal' && (
              <Alert 
                status="info" 
                bg="rgba(66, 153, 225, 0.1)" 
                border="1px solid rgba(66, 153, 225, 0.3)"
                borderRadius="md"
                color="white"
              >
                <AlertIcon as={Info} color="blue.300" />
                <VStack spacing={1} align="flex-start">
                  <Text fontSize="sm" fontWeight="medium">
                    Transform your private strategy into a community asset
                  </Text>
                  <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                    Share it freely or set up monetization to earn from your trading expertise
                  </Text>
                </VStack>
              </Alert>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ShareStrategyModal;