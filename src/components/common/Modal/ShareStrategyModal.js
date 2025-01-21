import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Box,
  Text,
  Select,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import StrategyCard from '@/components/features/marketplace/components/StrategyCard';

const ShareStrategyModal = ({ isOpen, onClose, webhook }) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'momentum',
    riskLevel: 'medium',
    timeframe: '5m',
    winRate: '',
    totalTrades: '',
    author: '',
    authorTitle: 'Trader',
    price: 0,
    isPublic: true
  });

  // Populate form with webhook data if available
  useEffect(() => {
    if (webhook) {
      setFormData(prev => ({
        ...prev,
        name: webhook.name || '',
        description: webhook.details || '',
      }));
    }
  }, [webhook]);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const validateForm = () => {
    const required = ['name', 'category', 'timeframe', 'riskLevel'];
    return required.every(field => formData[field]);
  };

  const handleShare = async () => {
    try {
      setIsSubmitting(true);

      if (!validateForm()) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Here you would typically make an API call to save the strategy
      // const response = await api.shareStrategy({ ...formData, webhookId: webhook.id });

      toast({
        title: "Strategy Shared",
        description: "Your strategy has been successfully shared",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to share strategy",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
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
        >
          Share Your Strategy
        </ModalHeader>
        
        <ModalBody py={6}>
          <VStack spacing={6}>
            {/* Basic Info Section */}
            <FormControl isRequired>
              <FormLabel color="white">Strategy Name</FormLabel>
              <Input 
                placeholder="E.g., MACD Momentum Strategy"
                value={formData.name}
                onChange={handleInputChange('name')}
                bg="whiteAlpha.100"
                border="1px solid"
                borderColor="whiteAlpha.200"
                _hover={{ borderColor: "whiteAlpha.300" }}
                _focus={{ 
                  borderColor: "rgba(0, 198, 224, 0.6)",
                  boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                }}
                color="white"
              />
            </FormControl>

            <FormControl>
              <FormLabel color="white">Description</FormLabel>
              <Textarea
                placeholder="Describe your strategy..."
                value={formData.description}
                onChange={handleInputChange('description')}
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
              />
            </FormControl>

            <HStack spacing={4} width="full">
              <FormControl isRequired>
                <FormLabel color="white">Category</FormLabel>
                <Select
                  value={formData.category}
                  onChange={handleInputChange('category')}
                  bg="whiteAlpha.100"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  _hover={{ borderColor: "whiteAlpha.300" }}
                  _focus={{ 
                    borderColor: "rgba(0, 198, 224, 0.6)",
                    boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                  }}
                  color="white"
                >
                  <option value="momentum">Momentum</option>
                  <option value="mean-reversion">Mean Reversion</option>
                  <option value="breakout">Breakout</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="white">Risk Level</FormLabel>
                <Select
                  value={formData.riskLevel}
                  onChange={handleInputChange('riskLevel')}
                  bg="whiteAlpha.100"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  _hover={{ borderColor: "whiteAlpha.300" }}
                  _focus={{ 
                    borderColor: "rgba(0, 198, 224, 0.6)",
                    boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                  }}
                  color="white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </FormControl>
            </HStack>

            <HStack spacing={4} width="full">
              <FormControl>
                <FormLabel color="white">Win Rate (%)</FormLabel>
                <Input 
                  type="number"
                  min="0"
                  max="100"
                  value={formData.winRate}
                  onChange={handleInputChange('winRate')}
                  bg="whiteAlpha.100"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  _hover={{ borderColor: "whiteAlpha.300" }}
                  _focus={{ 
                    borderColor: "rgba(0, 198, 224, 0.6)",
                    boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                  }}
                  color="white"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel color="white">Total Trades</FormLabel>
                <Input 
                  type="number"
                  min="0"
                  value={formData.totalTrades}
                  onChange={handleInputChange('totalTrades')}
                  bg="whiteAlpha.100"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  _hover={{ borderColor: "whiteAlpha.300" }}
                  _focus={{ 
                    borderColor: "rgba(0, 198, 224, 0.6)",
                    boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                  }}
                  color="white"
                />
              </FormControl>
            </HStack>

            {/* Preview Section */}
            <Box width="full">
              <Text fontWeight="bold" mb={2} color="white">Preview</Text>
              <StrategyCard strategy={formData} isPreview />
            </Box>
          </VStack>
        </ModalBody>
        
        <ModalFooter 
          borderTop="1px solid rgba(255, 255, 255, 0.18)" 
          pt={4}
        >
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            color="white"
            _hover={{ bg: 'whiteAlpha.100' }}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            bg="rgba(0, 198, 224, 0.6)"
            color="white"
            onClick={handleShare}
            isLoading={isSubmitting}
            loadingText="Sharing..."
            _hover={{ bg: 'rgba(0, 198, 224, 0.8)' }}
            isDisabled={!validateForm()}
          >
            Share Strategy
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ShareStrategyModal;