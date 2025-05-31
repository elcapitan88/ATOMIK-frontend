import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  VStack, 
  HStack,
  Spinner,
  IconButton,
  useToast
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StrategyBuilderProvider } from '@/contexts/StrategyBuilderContext';
import useStrategyBuilder from '@/hooks/useStrategyBuilder';
import useFeatureFlags from '@/hooks/useFeatureFlags';
import Menu from '@/components/layout/Sidebar/Menu';
import StrategyGrid from './components/StrategyGrid';
import CreateStrategyButton from './components/CreateStrategyButton';
import EmptyState from './components/EmptyState';
import Chatbox from '@/components/Chatbox';
import logger from '@/utils/logger';

// Motion components
const MotionBox = motion(Box);

const StrategyBuilderPageContent = () => {
  const { components, isLoading, error, strategyMetadata } = useStrategyBuilder();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const toast = useToast();

  // Chat handlers
  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

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
                <StrategyGrid onOpenChat={handleOpenChat} />
              </MotionBox>
            )}
          </AnimatePresence>
        )}
      </Flex>

      {/* Create Button (fixed position) */}
      <CreateStrategyButton />

      {/* Chat Toggle Arrow - Right Side */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ 
          x: isChatOpen ? -450 : 0, // Move left when chat is open
          opacity: 1 
        }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 200,
          opacity: { duration: 0.3 }
        }}
        style={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 150
        }}
      >
        <IconButton
          icon={isChatOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          onClick={isChatOpen ? handleCloseChat : handleOpenChat}
          bg="rgba(0, 0, 0, 0.8)"
          backdropFilter="blur(10px)"
          border="1px solid rgba(255, 255, 255, 0.2)"
          borderRight="none"
          borderTopLeftRadius="xl"
          borderBottomLeftRadius="xl"
          borderTopRightRadius="0"
          borderBottomRightRadius="0"
          color="#00C6E0"
          size="lg"
          h="60px"
          w="35px"
          _hover={{
            bg: "rgba(0, 198, 224, 0.1)",
            borderColor: "rgba(0, 198, 224, 0.4)",
            color: "#00D7F2"
          }}
          _active={{
            bg: "rgba(0, 198, 224, 0.2)"
          }}
          aria-label={isChatOpen ? "Close AI Chat" : "Open AI Chat"}
        />
      </motion.div>

      {/* AI Chat Overlay - positioned outside grid to prevent layout shifts */}
      <Chatbox
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        strategyData={{ components, metadata: strategyMetadata }}
      />
    </Box>
  );
};

const StrategyBuilderPage = () => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { hasStrategyBuilder, loading: featureFlagsLoading, error: featureFlagsError } = useFeatureFlags();
  const navigate = useNavigate();

  // Auth check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Feature flag check - allow admin users and beta testers
  const shouldAllowAccess = user?.app_role === 'admin' || hasStrategyBuilder;
  
  useEffect(() => {
    if (!featureFlagsLoading && !shouldAllowAccess) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasStrategyBuilder, featureFlagsLoading, navigate, user, shouldAllowAccess]);

  // Log page view
  useEffect(() => {
    logger.info('Strategy Builder page viewed');
  }, []);

  // Wait for auth and feature flags to load
  if (authLoading || !user || featureFlagsLoading) {
    return (
      <Flex justify="center" align="center" height="100vh" bg="background">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color="whiteAlpha.900">Loading strategy builder...</Text>
        </VStack>
      </Flex>
    );
  }

  // Check feature access - allow admin users and feature flag users
  if (!shouldAllowAccess) {
    return (
      <Flex justify="center" align="center" height="100vh" bg="background">
        <VStack spacing={4}>
          <Text color="red.400" fontSize="xl">Access Denied</Text>
          <Text color="whiteAlpha.700">
            You don't have access to the Strategy Builder feature.
          </Text>
          <Text color="whiteAlpha.500" fontSize="sm">
            Contact support if you believe this is an error.
          </Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="background" color="text.primary" fontFamily="body">
      <Menu onSelectItem={() => {}} />
      
      <Box 
        flexGrow={1} 
        ml={{ base: 0, md: 16 }}
        mb={{ base: "70px", md: 0 }}
      >
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