import React, { useState } from 'react';
import {
  Box, 
  Flex,
  useDisclosure,
  Button,
  HStack,
  Text,
  useToast,
} from '@chakra-ui/react';
import WebhooksView from './WebhooksView';
import WebhookModal from '../webhooks/WebhookModal';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';

const TradesTable = () => {
  const [webhooksHandler, setWebhooksHandler] = useState(null);
  const toast = useToast();
  
  // Modal control - only for webhook creation
  const {
    isOpen: isWebhookModalOpen,
    onOpen: onWebhookModalOpen,
    onClose: onWebhookModalClose
  } = useDisclosure();

  // Handler for webhook creation
  const handleCreateWebhook = async (webhookData) => {
    try {
      console.log('Creating webhook...', webhookData);
      await webhookApi.generateWebhook(webhookData);
      
      console.log('Webhook created, handler:', webhooksHandler);
      if (webhooksHandler?.refreshData) {
        console.log('Refreshing webhooks...');
        await webhooksHandler.refreshData();
      } else {
        console.warn('No refresh handler available');
      }

      toast({
        title: "Webhook Created",
        description: "Your webhook has been generated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onWebhookModalClose();
    } catch (error) {
      console.error('Webhook creation error:', error);
      toast({
        title: "Error Creating Webhook",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box 
      h="full"
      bg="whiteAlpha.100" 
      borderRadius="xl" 
      borderWidth="1px" 
      borderColor="whiteAlpha.200" 
      boxShadow="lg"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Flex p={4} borderBottomWidth="1px" borderColor="whiteAlpha.200">
        <Button
          bg="transparent"
          color="white"
          fontWeight="medium"
          borderWidth={1}
          borderColor="rgba(0, 198, 224, 1)"
          onClick={onWebhookModalOpen}
          _hover={{ bg: 'whiteAlpha.100' }}
          _active={{ bg: 'whiteAlpha.200' }}
        >
          Generate Webhook
        </Button>
      </Flex>

      {/* Content */}
      <Box flex="1" overflow="hidden">
        <WebhooksView 
          onWebhooksChange={setWebhooksHandler}
        />
      </Box>

      {/* Footer */}
      <Flex 
        justify="center" 
        borderTop="1px solid" 
        borderColor="whiteAlpha.200"
        p={4}
      >
        <HStack 
          spacing={6} 
          color="whiteAlpha.600"
          fontSize="sm"
        >
          <HStack spacing={2}>
            <Box w="3px" h="16px" bg="purple.400" />
            <Text>Subscribed Strategies</Text>
          </HStack>
          <HStack spacing={2}>
            <Box w="3px" h="16px" bg="cyan.400" />
            <Text>Shared Strategies</Text>
          </HStack>
          <HStack spacing={2}>
            <Box w="3px" h="16px" bg="transparent" border="1px solid" borderColor="whiteAlpha.400" />
            <Text>Regular Webhooks</Text>
          </HStack>
        </HStack>
      </Flex>

      {/* Only WebhookModal remains here */}
      <WebhookModal
        isOpen={isWebhookModalOpen}
        onClose={onWebhookModalClose}
        onSubmit={handleCreateWebhook}
      />
    </Box>
  );
};

export default TradesTable;