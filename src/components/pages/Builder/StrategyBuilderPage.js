import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  VStack, 
  HStack,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { StrategyBuilderProvider } from '@/contexts/StrategyBuilderContext';
import useStrategyBuilder from '@/hooks/useStrategyBuilder';
import Menu from '@/components/layout/Sidebar/Menu';
import StrategyGrid from './components/StrategyGrid';
import CreateStrategyButton from './components/CreateStrategyButton';
import EmptyState from './components/EmptyState';
import logger from '@/utils/logger';

// Motion components
const MotionBox = motion(Box);

const StrategyBuilderPageContent = () => {
  const { components, isLoading, error } = useStrategyBuilder();
  const toast = useToast();

  // Show error toast if needed
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  return (
    <Box position="relative" h="full" p={4} zIndex={2}>
      <Flex direction="column" h="full">
        {/* Header */}
        <Box mb={8}>
          <HStack justify="space-between" mb={2}>
            <Heading size="lg" color="white">Strategy Builder</Heading>
          </HStack>
          <Text color="whiteAlpha.700">
            Create and configure strategy components to build your automated trading system
          </Text>
        </Box>

        {/* Main Content */}
        {isLoading ? (
          <Flex justify="center" align="center" flex="1">
            <Spinner size="xl" color="#00C6E0" thickness="4px" />
          </Flex>
        ) : (
          <AnimatePresence mode="wait">
            {components.length === 0 ? (
              <MotionBox
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                flex="1"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <EmptyState />
              </MotionBox>
            ) : (
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                flex="1"
              >
                <StrategyGrid />
              </MotionBox>
            )}
          </AnimatePresence>
        )}
      </Flex>

      {/* Create Button (fixed position) */}
      <CreateStrategyButton />
    </Box>
  );
};

const StrategyBuilderPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Auth check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Log page view
  useEffect(() => {
    logger.info('Strategy Builder page viewed');
  }, []);

  return (
    <Flex minH="100vh" bg="background" color="text.primary" fontFamily="body">
      <Menu onSelectItem={() => {}} />
      
      <Box flexGrow={1} ml={16}>
        <Box h="100vh" w="full" overflow="hidden" position="relative">
          {/* Background Effects */}
          <Box 
            position="absolute" 
            inset={0} 
            bgGradient="linear(to-br, blackAlpha.400, blackAlpha.200, blackAlpha.400)" 
            pointerEvents="none" 
          />
          <Box 
            position="absolute" 
            inset={0} 
            backdropFilter="blur(16px)" 
            bg="blackAlpha.300" 
          />
          
          {/* Content */}
          <Box 
            position="relative" 
            h="full" 
            zIndex={1} 
            overflowY="auto"
          >
            <StrategyBuilderProvider>
              <StrategyBuilderPageContent />
            </StrategyBuilderProvider>
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default StrategyBuilderPage;