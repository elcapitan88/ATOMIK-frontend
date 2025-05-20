import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  VStack,
  Button,
  Input,
  Textarea,
  Select,
  Flex,
  Text,
  Box,
  Tooltip,
  IconButton,
  Alert,
  AlertIcon,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { HelpCircle } from 'lucide-react';

const SOURCE_TYPES = [
  { value: 'tradingview', label: 'TradingView' },
  { value: 'custom', label: 'Custom Implementation' }
];

const WebhookModal = ({ isOpen, onClose, onSubmit, webhook = null }) => {
  const [formData, setFormData] = useState({
    name: webhook?.name || '',
    details: webhook?.details || '',
    source_type: webhook?.source_type || 'tradingview',
    max_retries: webhook?.max_retries || 3,
    require_signature: webhook?.require_signature ?? true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [testResult, setTestResult] = useState(null);
  const toast = useToast();

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (formData.source_type === 'custom' && !formData.details.trim()) {
      errors.details = 'Details are required for custom webhooks';
    }
    return errors;
  };

  const getSamplePayload = () => {
    switch (formData.source_type) {
      case 'tradingview':
        return {
          action: "{{strategy.order.action}}",
        };
      case 'trendspider':
        return {
          alert: "MA Crossover",
          action: "BUY",
          symbol: "ES",
          timeframe: "5m"
        };
      default:
        return {
          action: "BUY",
          
        };
    }
  };

  const handleSubmit = async () => {
    try {
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      setIsSubmitting(true);
      await onSubmit(formData);
      
      toast({
        title: webhook ? "Webhook Updated" : "Webhook Created",
        description: `Your webhook has been ${webhook ? 'updated' : 'created'} successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setTestResult({
        success: true,
        message: "Webhook configured successfully"
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setTestResult({
        success: false,
        message: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered
      size="xl"
      closeOnOverlayClick={!isSubmitting}
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent 
        bg="rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="xl"
        color="white"
      >
        <ModalHeader borderBottom="1px solid rgba(255, 255, 255, 0.18)">
          {webhook ? 'Update Webhook' : 'Create New Webhook'}
        </ModalHeader>
        <ModalBody py={6}>
          <VStack spacing={6}>
            <Box width="full">
              <Flex justify="space-between" align="center" mb={2}>
                <Text>Webhook Name</Text>
                {validationErrors.name && (
                  <Text color="red.300" fontSize="sm">
                    {validationErrors.name}
                  </Text>
                )}
              </Flex>
              <Input
                placeholder="Enter webhook name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                isInvalid={!!validationErrors.name}
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
              />
            </Box>

            <Box width="full">
              <Text mb={2}>Source Type</Text>
              <Box
                position="relative"
                width="full"
              >
                <Select
                  value={formData.source_type}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    source_type: e.target.value
                  }))}
                  bg="rgba(255, 255, 255, 0.1)"
                  backdropFilter="blur(10px)"
                  borderColor="rgba(255, 255, 255, 0.18)"
                  color="white"
                  _hover={{ bg: "whiteAlpha.200" }}
                  css={{
                    option: {
                      background: "rgba(23, 25, 35, 0.95) !important",
                      backdropFilter: "blur(10px)",
                      color: "white !important",
                      padding: "8px"
                    },
                    "option:hover": {
                      background: "rgba(255, 255, 255, 0.1) !important"
                    }
                  }}
                >
                  {SOURCE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </Box>
            </Box>

            <Box width="full">
              <Flex justify="space-between" align="center" mb={2}>
                <Text>Details</Text>
                <Tooltip label="Add description or special handling instructions">
                  <IconButton
                    icon={<HelpCircle size={16} />}
                    variant="ghost"
                    size="sm"
                  />
                </Tooltip>
              </Flex>
              <Textarea
                placeholder="Enter webhook details or instructions"
                value={formData.details}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  details: e.target.value
                }))}
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
                rows={4}
              />
            </Box>

            <Divider borderColor="whiteAlpha.200" />

            <Box width="full">
              <Text mb={4}>Expected Payload Format:</Text>
              <Box
                bg="whiteAlpha.100"
                p={3}
                borderRadius="md"
                fontSize="sm"
                fontFamily="mono"
              >
                <pre>{JSON.stringify(getSamplePayload(), null, 2)}</pre>
              </Box>
            </Box>

            {testResult && (
              <Alert
                status={testResult.success ? "success" : "warning"}
                variant="subtle"
                borderRadius="md"
              >
                <AlertIcon />
                {testResult.message}
              </Alert>
            )}

            <Flex width="full" gap={4} mt={4}>
              <Button
                flex={1}
                variant="ghost"
                onClick={onClose}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                bg="transparent"
                color="white"
                borderWidth={1}
                borderColor="rgba(0, 198, 224, 1)"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText={webhook ? "Updating..." : "Creating..."}
                _hover={{
                  bg: 'whiteAlpha.100'
                }}
              >
                {webhook ? 'Update Webhook' : 'Create Webhook'}
              </Button>
            </Flex>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default WebhookModal;