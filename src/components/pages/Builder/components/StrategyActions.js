// src/components/pages/Builder/components/StrategyActions.js
import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  VStack,
  useToast
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Send, Bot } from 'lucide-react';
import useStrategyBuilder from '@/hooks/useStrategyBuilder';

// Motion components
const MotionBox = motion(Box);

const StrategyActions = ({ onOpenAIChat }) => {
  const { components, strategyMetadata } = useStrategyBuilder();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const toast = useToast();

  // Handle strategy submission - now opens AI chat
  const handleSubmit = useCallback(async () => {
    try {
      // Validate strategy has components
      if (components.length === 0) {
        toast({
          title: "Strategy Empty",
          description: "Please add at least one component to your strategy.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validate strategy has a name
      if (!strategyMetadata.name.trim()) {
        toast({
          title: "Strategy Name Required",
          description: "Please provide a name for your strategy.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Open AI chat for strategy submission
      if (onOpenAIChat) {
        onOpenAIChat();
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error opening the AI chat. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [components, strategyMetadata, toast, onOpenAIChat]);

  // Handle AI chat creation
  const handleAIChat = useCallback(async () => {
    // Open AI chat directly
    if (onOpenAIChat) {
      onOpenAIChat();
    }
  }, [onOpenAIChat]);

  return (
    <MotionBox
      position="absolute"
      bottom={4}
      left={4}
      zIndex={150}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      data-strategy-actions
    >
      <VStack spacing={3} align="stretch">
        {/* Submit Button */}
        <Button
          leftIcon={<Send size={16} />}
          onClick={handleSubmit}
          bg="linear-gradient(135deg, #00C6E0, #0099B8)"
          color="white"
          size="md"
          borderRadius="xl"
          fontWeight="semibold"
          fontSize="sm"
          minW="180px"
          h="45px"
          boxShadow="0 4px 20px rgba(0, 198, 224, 0.3)"
          border="1px solid rgba(255, 255, 255, 0.1)"
          backdropFilter="blur(10px)"
          _hover={{
            bg: "linear-gradient(135deg, #00B8D4, #0088A3)",
            boxShadow: "0 6px 25px rgba(0, 198, 224, 0.4)",
            transform: "translateY(-1px)"
          }}
          _active={{
            transform: "translateY(0px)",
            boxShadow: "0 3px 15px rgba(0, 198, 224, 0.3)"
          }}
          _disabled={{
            bg: "rgba(0, 198, 224, 0.3)",
            boxShadow: "none",
            transform: "none"
          }}
          transition="all 0.2s"
        >
          Submit Strategy
        </Button>

        {/* AI Chat Button */}
        <Button
          leftIcon={<Bot size={16} />}
          onClick={handleAIChat}
          bg="rgba(0, 0, 0, 0.7)"
          color="white"
          size="md"
          borderRadius="xl"
          fontWeight="semibold"
          fontSize="sm"
          minW="180px"
          h="45px"
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
          border="1px solid rgba(255, 255, 255, 0.2)"
          backdropFilter="blur(10px)"
          _hover={{
            bg: "rgba(0, 0, 0, 0.8)",
            boxShadow: "0 6px 25px rgba(0, 0, 0, 0.3)",
            transform: "translateY(-1px)",
            borderColor: "rgba(255, 255, 255, 0.3)"
          }}
          _active={{
            transform: "translateY(0px)",
            boxShadow: "0 3px 15px rgba(0, 0, 0, 0.2)"
          }}
          _disabled={{
            bg: "rgba(0, 0, 0, 0.4)",
            boxShadow: "none",
            transform: "none"
          }}
          transition="all 0.2s"
        >
          Create with AI Chat
        </Button>
      </VStack>
    </MotionBox>
  );
};

export default StrategyActions;