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
  Spinner
} from '@chakra-ui/react';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';
import { STRATEGY_TYPE_OPTIONS } from '@utils/constants/strategyTypes';
import { Info } from 'lucide-react';

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
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent 
        bg="rgba(255, 255, 255, 0.1)" 
        backdropFilter="blur(10px)"
        borderRadius="xl"
        border="1px solid rgba(255, 255, 255, 0.18)"
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.18)" 
          pb={4} 
          color="white"
          pr={12}
        >
          Share Strategy
        </ModalHeader>
        <ModalCloseButton 
          color="white"
          _hover={{ bg: 'whiteAlpha.200' }}
          isDisabled={isSubmitting}
        />
        
        <ModalBody py={6}>
          <VStack spacing={6}>
            {/* Strategy Name Display */}
            <Box width="full">
              <Text color="whiteAlpha.700" fontSize="sm" mb={1}>
                Strategy Name
              </Text>
              <Text color="white" fontWeight="medium" fontSize="lg">
                {formData.name || 'Unnamed Strategy'}
              </Text>
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
                  Activate Strategy Sharing
                </Text>
                <Text color="whiteAlpha.600" fontSize="sm">
                  Make this strategy available in the marketplace
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

            {/* Info Alert */}
            {formData.isActive && (
              <Alert status="info" bg="whiteAlpha.200" color="white">
                <AlertIcon as={Info} color="blue.300" />
                <Text fontSize="sm">
                  Your strategy will be visible to other users in the marketplace
                </Text>
              </Alert>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ShareStrategyModal;