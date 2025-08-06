// frontend/src/components/features/strategies/EnhancedStrategyModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Button,
  Text,
  Box,
  Progress,
  Alert,
  AlertIcon,
  useToast,
  Flex,
  Icon,
  Badge
} from '@chakra-ui/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Target,
  Settings,
  Rocket,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import IntentDiscovery from './IntentDiscovery';
import StrategyBasics from './StrategyBasics';
import StrategyMonetizationSetup from './StrategyMonetizationSetup';
import { useAuth } from '../../../contexts/AuthContext';

const STEPS = [
  {
    id: 'intent',
    title: 'Intent',
    description: 'Choose your goal',
    icon: Target,
    required: true
  },
  {
    id: 'basics',
    title: 'Configuration',
    description: 'Set up your strategy',
    icon: Settings,
    required: true
  },
  {
    id: 'monetization',
    title: 'Monetization',
    description: 'Set pricing options',
    icon: DollarSign,
    required: false // Only for monetize intent
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Confirm and create',
    icon: Check,
    required: true
  }
];

const StepIndicator = ({ steps, currentStep, completedSteps }) => {
  return (
    <Box w="full" mb={6}>
      <HStack spacing={4} justify="center" mb={4}>
        {steps.map((step, index) => {
          const isActive = currentStep === index;
          const isCompleted = completedSteps.includes(index);
          const IconComponent = step.icon;
          
          return (
            <React.Fragment key={step.id}>
              <VStack spacing={2}>
                <Box
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  bg={
                    isCompleted 
                      ? "#00C6E0" 
                      : isActive 
                      ? "rgba(0, 198, 224, 0.2)" 
                      : "rgba(255, 255, 255, 0.1)"
                  }
                  border="2px solid"
                  borderColor={
                    isCompleted 
                      ? "#00C6E0" 
                      : isActive 
                      ? "#00C6E0" 
                      : "rgba(255, 255, 255, 0.2)"
                  }
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  transition="all 0.3s ease"
                >
                  {isCompleted ? (
                    <Icon as={Check} color="white" size="20px" />
                  ) : (
                    <Icon 
                      as={IconComponent} 
                      color={isActive ? "#00C6E0" : "rgba(255, 255, 255, 0.6)"} 
                      size="20px" 
                    />
                  )}
                </Box>
                <VStack spacing={0}>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color={isActive || isCompleted ? "white" : "rgba(255, 255, 255, 0.6)"}
                  >
                    {step.title}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="rgba(255, 255, 255, 0.5)"
                  >
                    {step.description}
                  </Text>
                </VStack>
              </VStack>
              
              {index < steps.length - 1 && (
                <Box
                  h="2px"
                  w="60px"
                  bg={isCompleted ? "#00C6E0" : "rgba(255, 255, 255, 0.2)"}
                  transition="all 0.3s ease"
                />
              )}
            </React.Fragment>
          );
        })}
      </HStack>
      
      <Box w="full" bg="rgba(255, 255, 255, 0.1)" borderRadius="full" h="4px">
        <Box
          h="full"
          bg="#00C6E0"
          borderRadius="full"
          transition="all 0.3s ease"
          w={`${((currentStep + 1) / steps.length) * 100}%`}
        />
      </Box>
    </Box>
  );
};

const ReviewStep = ({ formData, selectedIntent, onEdit }) => {
  return (
    <VStack spacing={6} align="stretch">
      <Box textAlign="center">
        <Text fontSize="xl" fontWeight="bold" color="white" mb={2}>
          Review Your Strategy
        </Text>
        <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">
          Confirm your settings before creating the strategy
        </Text>
      </Box>

      <VStack spacing={4} align="stretch">
        {/* Intent Summary */}
        <Box
          p={4}
          bg="rgba(255, 255, 255, 0.05)"
          borderRadius="lg"
          border="1px solid rgba(255, 255, 255, 0.1)"
        >
          <HStack justify="space-between" mb={2}>
            <Text color="white" fontWeight="medium">Intent</Text>
            <Button size="xs" variant="ghost" color="#00C6E0" onClick={() => onEdit(0)}>
              Edit
            </Button>
          </HStack>
          <HStack spacing={2}>
            <Badge
              colorScheme={
                selectedIntent === 'personal' ? 'gray' :
                selectedIntent === 'share_free' ? 'green' : 'yellow'
              }
            >
              {selectedIntent === 'personal' && 'Private Use'}
              {selectedIntent === 'share_free' && 'Free Sharing'}
              {selectedIntent === 'monetize' && 'Monetize'}
            </Badge>
            <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)">
              {selectedIntent === 'personal' && 'Keep strategy private for personal use'}
              {selectedIntent === 'share_free' && 'Share strategy freely with community'}
              {selectedIntent === 'monetize' && 'Set up pricing to earn revenue'}
            </Text>
          </HStack>
        </Box>

        {/* Strategy Details */}
        <Box
          p={4}
          bg="rgba(255, 255, 255, 0.05)"
          borderRadius="lg"
          border="1px solid rgba(255, 255, 255, 0.1)"
        >
          <HStack justify="space-between" mb={3}>
            <Text color="white" fontWeight="medium">Strategy Details</Text>
            <Button size="xs" variant="ghost" color="#00C6E0" onClick={() => onEdit(1)}>
              Edit
            </Button>
          </HStack>
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">Name:</Text>
              <Text fontSize="sm" color="white" fontWeight="medium">
                {formData.name || 'Untitled Strategy'}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">Type:</Text>
              <Text fontSize="sm" color="white">
                {formData.strategy_type ? 
                  formData.strategy_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                  : 'Not selected'
                }
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">Source:</Text>
              <Text fontSize="sm" color="white">
                {formData.source_type === 'tradingview' ? 'TradingView' : 'Custom Implementation'}
              </Text>
            </HStack>
            {formData.details && (
              <Box>
                <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" mb={1}>Description:</Text>
                <Text fontSize="sm" color="white" lineHeight="1.4">
                  {formData.details}
                </Text>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Next Steps Preview */}
        <Box
          p={4}
          bg="rgba(0, 198, 224, 0.05)"
          borderRadius="lg"
          border="1px solid rgba(0, 198, 224, 0.2)"
        >
          <Text color="white" fontWeight="medium" mb={2}>What happens next?</Text>
          <VStack spacing={2} align="stretch">
            <HStack spacing={3}>
              <Icon as={Rocket} color="#00C6E0" size="16px" />
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)">
                Your strategy will be created with a unique webhook URL
              </Text>
            </HStack>
            {selectedIntent === 'monetize' && (
              <HStack spacing={3}>
                <Icon as={Settings} color="#00C6E0" size="16px" />
                <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)">
                  You'll be guided to set up pricing and payment options
                </Text>
              </HStack>
            )}
            {selectedIntent === 'share_free' && (
              <HStack spacing={3}>
                <Icon as={Check} color="#00C6E0" size="16px" />
                <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)">
                  Your strategy will be immediately available in the marketplace
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>
      </VStack>
    </VStack>
  );
};

const EnhancedStrategyModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  webhook = null 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [selectedIntent, setSelectedIntent] = useState(webhook?.usage_intent || '');
  const [formData, setFormData] = useState({
    name: webhook?.name || '',
    details: webhook?.details || '',
    source_type: webhook?.source_type || 'tradingview',
    strategy_type: webhook?.strategy_type || '',
    usage_intent: webhook?.usage_intent || '',
    max_retries: webhook?.max_retries || 3,
    require_signature: webhook?.require_signature ?? true
  });
  const [monetizationData, setMonetizationData] = useState({
    pricing_options: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && !webhook) {
      setCurrentStep(0);
      setCompletedSteps([]);
      setSelectedIntent('');
      setFormData({
        name: '',
        details: '',
        source_type: 'tradingview',
        strategy_type: '',
        usage_intent: '',
        max_retries: 3,
        require_signature: true
      });
      setValidationErrors({});
    }
  }, [isOpen, webhook]);

  const handleIntentSelect = async (intent) => {
    setSelectedIntent(intent);
    setFormData(prev => ({ ...prev, usage_intent: intent }));
    
    // Mark step as completed and move to next
    if (!completedSteps.includes(0)) {
      setCompletedSteps(prev => [...prev, 0]);
    }
    setCurrentStep(1);
  };

  const handleCreatorSetup = () => {
    // Redirect to creator setup in settings
    navigate('/settings?tab=creator');
    onClose();
  };

  const validateCurrentStep = () => {
    const errors = {};
    
    if (currentStep === 0) {
      if (!selectedIntent) {
        errors.intent = 'Please select your intent';
      }
    } else if (currentStep === 1) {
      if (!formData.name?.trim()) {
        errors.name = 'Strategy name is required';
      }
      if (formData.source_type === 'custom' && !formData.details?.trim()) {
        errors.details = 'Details are required for custom implementations';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    
    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    
    setCurrentStep(prev => Math.min(prev + 1, activeSteps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleEditStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  // Get active steps based on selected intent
  const getActiveSteps = () => {
    if (selectedIntent === 'monetize') {
      return STEPS; // All steps including monetization
    } else {
      return STEPS.filter(step => step.id !== 'monetization'); // Skip monetization step
    }
  };

  const activeSteps = getActiveSteps();

  // Helper to check if current step is the final step
  const isFinalStep = () => {
    return currentStep === activeSteps.length - 1;
  };

  // Helper to get the actual step index in the full STEPS array
  const getActualStepIndex = (activeStepIndex) => {
    const stepId = activeSteps[activeStepIndex]?.id;
    return STEPS.findIndex(step => step.id === stepId);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        usage_intent: selectedIntent,
        monetizationData: selectedIntent === 'monetize' ? monetizationData : null
      };

      await onSubmit(submitData);
      
      toast({
        title: webhook ? "Strategy Updated" : "Strategy Created",
        description: `Your strategy has been ${webhook ? 'updated' : 'created'} successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Strategy creation error:', error);
      
      let errorMessage = "Failed to create strategy";
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (detail.message) {
          errorMessage = detail.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Creation Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    if (currentStep === 0) return selectedIntent !== '';
    if (currentStep === 1) return formData.name?.trim() && (formData.source_type !== 'custom' || formData.details?.trim());
    return true;
  };

  const getStepContent = () => {
    const currentStepId = activeSteps[currentStep]?.id;
    
    switch (currentStepId) {
      case 'intent':
        return (
          <IntentDiscovery
            onIntentSelect={handleIntentSelect}
            selectedIntent={selectedIntent}
            user={user}
            onCreatorSetup={handleCreatorSetup}
          />
        );
      case 'basics':
        return (
          <StrategyBasics
            formData={formData}
            onFormChange={setFormData}
            validationErrors={validationErrors}
            intent={selectedIntent}
          />
        );
      case 'monetization':
        return (
          <StrategyMonetizationSetup
            formData={formData} // Pass form data instead of webhook ID for new strategies
            webhookId={webhook?.id} // Only exists for existing webhooks
            existingMonetization={null}
            onComplete={(result) => {
              setMonetizationData(result);
              // Mark step as completed and move to review
              if (!completedSteps.includes(currentStep)) {
                setCompletedSteps(prev => [...prev, currentStep]);
              }
              setCurrentStep(prev => prev + 1);
            }}
            onCancel={() => {
              // Go back to previous step
              setCurrentStep(prev => prev - 1);
            }}
          />
        );
      case 'review':
        return (
          <ReviewStep
            formData={formData}
            selectedIntent={selectedIntent}
            monetizationData={selectedIntent === 'monetize' ? monetizationData : null}
            onEdit={handleEditStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered
      size="2xl"
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
        maxH="90vh"
        overflow="hidden"
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.15)',
            },
          },
        }}
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.18)"
          pb={4}
        >
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="xl" fontWeight="bold">
                {webhook ? 'Update Strategy' : 'Create New Strategy'}
              </Text>
              <ModalCloseButton position="static" />
            </HStack>
            <StepIndicator 
              steps={activeSteps} 
              currentStep={currentStep} 
              completedSteps={completedSteps} 
            />
          </VStack>
        </ModalHeader>

        <ModalBody 
          py={6} 
          overflowY="auto" 
          maxH="60vh"
          sx={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.15)',
              },
            },
          }}
        >
          {getStepContent()}
        </ModalBody>

        {/* Footer Actions */}
        <Box 
          borderTop="1px solid rgba(255, 255, 255, 0.18)"
          p={6}
        >
          <HStack justify="space-between">
            <Button
              variant="ghost"
              onClick={currentStep === 0 ? onClose : handlePrevious}
              leftIcon={currentStep > 0 ? <ArrowLeft size={16} /> : undefined}
              isDisabled={isSubmitting}
            >
              {currentStep === 0 ? 'Cancel' : 'Previous'}
            </Button>

            <HStack spacing={3}>
              {/* Show Next button for non-final steps, except monetization step has its own buttons */}
              {!isFinalStep() && activeSteps[currentStep]?.id !== 'monetization' && (
                <Button
                  bg="transparent"
                  color="white"
                  borderWidth={1}
                  borderColor="#00C6E0"
                  onClick={handleNext}
                  rightIcon={<ArrowRight size={16} />}
                  isDisabled={!isStepValid()}
                  _hover={{
                    bg: 'rgba(0, 198, 224, 0.1)'
                  }}
                >
                  Next Step
                </Button>
              )}
              
              {/* Show Create/Update button for final step, except monetization step handles its own submission */}
              {isFinalStep() && activeSteps[currentStep]?.id !== 'monetization' && (
                <Button
                  bg="#00C6E0"
                  color="white"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  loadingText={webhook ? "Updating..." : "Creating..."}
                  rightIcon={<Rocket size={16} />}
                  _hover={{
                    bg: '#0099B8'
                  }}
                >
                  {webhook ? 'Update Strategy' : 'Create Strategy'}
                </Button>
              )}
            </HStack>
          </HStack>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default EnhancedStrategyModal;