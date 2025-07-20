import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Circle,
  keyframes,
  useToast,
  Flex,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { 
  Sparkles, 
  CreditCard, 
  Shield, 
  Clock,
  CheckCircle,
  Gift,
  Zap
} from 'lucide-react';

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const QuickPurchaseModal = ({ 
  isOpen, 
  onClose, 
  strategy, 
  onPurchase, 
  currentUser 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('confirm'); // confirm, processing, success
  const toast = useToast();

  const pricing = strategy?.pricing || {};
  const isFree = !pricing || pricing.pricingType === 'free';
  const monthlyPrice = pricing.baseAmount ? parseFloat(pricing.baseAmount) : 0;
  const hasFreeTrial = pricing.isTrialEnabled && pricing.trialDays > 0;
  const platformFee = monthlyPrice * 0.15; // 15% average

  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handlePurchase = async () => {
    setIsProcessing(true);
    setStep('processing');

    try {
      // Simulate processing time for UX
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await onPurchase(strategy);
      
      setStep('success');
      
      // Auto close after success
      setTimeout(() => {
        onClose();
        toast({
          title: "🎉 Welcome aboard!",
          description: hasFreeTrial 
            ? `Your ${pricing.trialDays}-day free trial has started` 
            : "You now have full access to this strategy",
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      }, 2000);

    } catch (error) {
      setIsProcessing(false);
      setStep('confirm');
      toast({
        title: "Purchase failed",
        description: error.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const ConfirmStep = () => (
    <VStack spacing={6} textAlign="center">
      {/* Hero Section */}
      <VStack spacing={3}>
        <Circle 
          size="16" 
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          color="white"
          animation={`${float} 3s ease-in-out infinite`}
        >
          {hasFreeTrial ? <Gift size={32} /> : <Zap size={32} />}
        </Circle>
        
        <VStack spacing={1}>
          <Text fontSize="xl" fontWeight="bold" color="white">
            {hasFreeTrial ? 'Start Your Free Trial' : 'Subscribe to Strategy'}
          </Text>
          <Text fontSize="lg" color="blue.400" fontWeight="bold">
            {strategy.name}
          </Text>
          <Text color="whiteAlpha.700" fontSize="sm">
            by {strategy.username}
          </Text>
        </VStack>
      </VStack>

      {/* Pricing Box */}
      <Box
        p={5}
        bg="rgba(102, 126, 234, 0.1)"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="blue.400"
        w="full"
      >
        <VStack spacing={3}>
          <HStack spacing={2} align="baseline">
            <Text fontSize="3xl" fontWeight="bold" color="white">
              ${monthlyPrice}
            </Text>
            <Text color="whiteAlpha.700">/month</Text>
          </HStack>
          
          {hasFreeTrial && (
            <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full">
              {pricing.trialDays} days free, then ${monthlyPrice}/month
            </Badge>
          )}
          
          <Text color="whiteAlpha.600" fontSize="sm" textAlign="center">
            Cancel anytime • Secure payment • Instant access
          </Text>
        </VStack>
      </Box>

      {/* Benefits */}
      <VStack spacing={2} w="full">
        {[
          { icon: CheckCircle, text: 'Instant strategy access' },
          { icon: Shield, text: 'Secure payment processing' },
          { icon: Clock, text: hasFreeTrial ? 'Free for first week' : 'Cancel anytime' }
        ].map((benefit, index) => {
          const IconComponent = benefit.icon;
          return (
            <HStack key={index} spacing={3} w="full" p={2}>
              <Circle size="6" bg="green.500" color="white">
                <IconComponent size={12} />
              </Circle>
              <Text color="whiteAlpha.800" fontSize="sm">
                {benefit.text}
              </Text>
            </HStack>
          );
        })}
      </VStack>

      {/* Revenue split info */}
      <Box
        p={3}
        bg="rgba(255, 255, 255, 0.05)"
        borderRadius="lg"
        w="full"
      >
        <Text color="whiteAlpha.600" fontSize="xs" textAlign="center">
          ${(monthlyPrice - platformFee).toFixed(2)} goes to creator • ${platformFee.toFixed(2)} platform fee
        </Text>
      </Box>
    </VStack>
  );

  const ProcessingStep = () => (
    <VStack spacing={6} textAlign="center" py={8}>
      <Circle 
        size="20" 
        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        color="white"
        animation={`${float} 2s ease-in-out infinite`}
      >
        <CreditCard size={40} />
      </Circle>
      
      <VStack spacing={2}>
        <Text fontSize="xl" fontWeight="bold" color="white">
          Processing your {hasFreeTrial ? 'trial' : 'subscription'}...
        </Text>
        <Text color="whiteAlpha.700">
          This will only take a moment
        </Text>
      </VStack>
    </VStack>
  );

  const SuccessStep = () => (
    <VStack spacing={6} textAlign="center" py={8}>
      <Circle 
        size="20" 
        bg="green.500"
        color="white"
        animation={`${float} 2s ease-in-out infinite`}
      >
        <CheckCircle size={40} />
      </Circle>
      
      <VStack spacing={2}>
        <Text fontSize="xl" fontWeight="bold" color="white">
          🎉 Success!
        </Text>
        <Text color="whiteAlpha.700">
          {hasFreeTrial 
            ? `Your ${pricing.trialDays}-day free trial has started`
            : 'You now have access to this strategy'
          }
        </Text>
      </VStack>
    </VStack>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered
      closeOnOverlayClick={step === 'confirm'}
    >
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(4px)" />
      <ModalContent
        bg="rgba(26, 32, 44, 0.95)"
        backdropFilter="blur(20px)"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        borderRadius="xl"
        mx={4}
        maxW="400px"
      >
        <ModalBody p={6}>
          {step === 'confirm' && <ConfirmStep />}
          {step === 'processing' && <ProcessingStep />}
          {step === 'success' && <SuccessStep />}

          {/* Action Buttons */}
          {step === 'confirm' && (
            <VStack spacing={3} mt={6}>
              <Button
                onClick={handlePurchase}
                size="lg"
                w="full"
                h="12"
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                color="white"
                fontWeight="bold"
                leftIcon={hasFreeTrial ? <Gift size={18} /> : <Zap size={18} />}
                _hover={{
                  transform: "translateY(-1px)",
                  boxShadow: "0 8px 25px rgba(102, 126, 234, 0.4)"
                }}
                _active={{
                  transform: "translateY(0px)"
                }}
                transition="all 0.2s"
              >
                {hasFreeTrial ? 'Start Free Trial' : `Subscribe for $${monthlyPrice}/mo`}
              </Button>
              
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                color="whiteAlpha.700"
                _hover={{ color: 'white' }}
              >
                Maybe later
              </Button>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default QuickPurchaseModal;