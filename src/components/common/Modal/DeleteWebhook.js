import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';

const glassEffect = {
  bg: "rgba(0, 0, 0, 0.75)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  borderRadius: "xl",
};

const DeleteWebhook = ({ isOpen, onClose, webhookToken, onWebhookDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const handleDelete = async () => {
    if (isDeleting) return; // Prevent multiple deletion attempts
    
    try {
      setIsDeleting(true);
      const response = await webhookApi.deleteWebhook(webhookToken);
      console.log('Delete response:', response); // Debug log
      
      // Call onWebhookDeleted first
      await onWebhookDeleted?.(webhookToken);
      
      // Then show toast and close modal
      toast({
        title: "Webhook deleted",
        description: "The webhook has been successfully deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Delete error:', error); // Debug log
      toast({
        title: "Error deleting webhook",
        description: error.message || "Failed to delete webhook",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay 
        bg="blackAlpha.300" 
        backdropFilter="blur(10px)" 
      />
      <ModalContent {...glassEffect} maxW="400px" color="white">
        <ModalHeader borderBottom="1px solid rgba(255, 255, 255, 0.18)" pb={4}>
          Confirm Deletion
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pt={6} pb={8}>
          <VStack spacing={4} align="stretch">
            <Text>Are you sure you want to delete this webhook?</Text>
            <Text color="red.300" fontStyle="italic">This action cannot be undone.</Text>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid rgba(255, 255, 255, 0.18)" pt={4}>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            isDisabled={isDeleting}
            _hover={{ bg: 'whiteAlpha.100' }}
          >
            Cancel
          </Button>
          <Button 
            colorScheme="red" 
            onClick={handleDelete}
            isLoading={isDeleting}
            loadingText="Deleting..."
            bg="red.500"
            _hover={{ bg: 'red.600' }}
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteWebhook;