import React from 'react';
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
} from '@chakra-ui/react';

const glassEffect = {
  background: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  borderRadius: "xl",
};

const DeleteWebhook = ({ isOpen, onClose, onConfirm, webhookUrl }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent 
        {...glassEffect}
        maxW="400px"
        color="white"
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.18)" 
          pb={4}
        >
          Confirm Deletion
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pt={6} pb={8}>
          <VStack spacing={4} align="stretch">
            <Text>Are you sure you want to delete this webhook?</Text>
            <Text fontSize="xs" color="whiteAlpha.700">{webhookUrl}</Text>
            <Text color="red.300" fontStyle="italic">This action cannot be undone.</Text>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid rgba(255, 255, 255, 0.18)" pt={4}>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            _hover={{ bg: 'whiteAlpha.100' }}
          >
            Cancel
          </Button>
          <Button 
            colorScheme="red" 
            onClick={onConfirm}
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