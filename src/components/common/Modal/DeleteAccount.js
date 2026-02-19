import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Icon,
} from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';

const DeleteAccount = ({ isOpen, onClose, onConfirm, accountName, accountDetails }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.400" />
      <ModalContent
        bg="rgba(0, 0, 0, 0.4)"
        backdropFilter="blur(10px)"
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        borderRadius="xl"
        color="white"
        p={4}
        overflow="hidden"
        maxW="400px"
      >
        <ModalHeader
          borderBottom="1px solid rgba(255, 255, 255, 0.05)"
          bg="rgba(0, 0, 0, 0.3)"
          mx={-4}
          mt={-4}
          px={4}
          pt={4}
          pb={4}
          borderTopRadius="xl"
        >
          <HStack spacing={3}>
            <Box
              p={2}
              borderRadius="lg"
              bg="rgba(245, 101, 101, 0.15)"
            >
              <Icon as={AlertTriangle} boxSize={4} color="red.400" />
            </Box>
            <Text fontSize="lg" fontWeight="bold">
              Delete Account
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="whiteAlpha.600" _hover={{ color: 'white' }} />

        <ModalBody pt={6} pb={4} px={0}>
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="whiteAlpha.800">
              Are you sure you want to delete this account?
            </Text>

            <Box
              bg="whiteAlpha.100"
              borderRadius="lg"
              p={3}
              borderWidth="1px"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="sm" fontWeight="medium" color="white">
                {accountName}
              </Text>
              {accountDetails?.environment && (
                <Text fontSize="xs" color="whiteAlpha.600" mt={1}>
                  {accountDetails.environment.charAt(0).toUpperCase() + accountDetails.environment.slice(1)} environment
                </Text>
              )}
            </Box>

            <Text fontSize="xs" color="red.300">
              This action cannot be undone. All associated strategies will be deactivated.
            </Text>

            <HStack spacing={3} pt={2}>
              <Button
                flex={1}
                size="sm"
                variant="outline"
                borderColor="whiteAlpha.300"
                color="whiteAlpha.800"
                onClick={onClose}
                _hover={{ bg: 'whiteAlpha.100', borderColor: 'whiteAlpha.400' }}
                borderRadius="lg"
              >
                Cancel
              </Button>
              <Button
                flex={1}
                size="sm"
                bg="red.500"
                color="white"
                onClick={onConfirm}
                _hover={{ bg: 'red.600' }}
                borderRadius="lg"
              >
                Delete Account
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default DeleteAccount;
