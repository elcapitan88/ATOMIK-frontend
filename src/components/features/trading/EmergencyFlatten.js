import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useToast,
  Text,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { AlertTriangle, X } from 'lucide-react';
import axios from '@/services/axiosConfig';
import logger from '@/utils/logger';

const EmergencyFlatten = ({ accounts = [] }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleFlattenAll = async () => {
    if (accounts.length === 0) {
      toast({
        title: "No Accounts",
        description: "No trading accounts found to flatten",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      onClose();
      return;
    }

    setIsSubmitting(true);

    try {
      const accountIds = accounts.map(acc => acc.account_id);

      await axios.post('/api/v1/brokers/accounts/close-all', {
        account_ids: accountIds
      });

      toast({
        title: "All Positions Closed",
        description: "Successfully flattened all positions across all accounts",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      logger.error('Emergency flatten failed:', error);

      toast({
        title: "Flatten Failed",
        description: error.response?.data?.detail || "Failed to close positions",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        width="full"
        h="56px"
        onClick={onOpen}
        bg="rgba(220, 38, 38, 0.15)"
        color="red.400"
        border="1px solid"
        borderColor="red.500"
        borderRadius="xl"
        fontWeight="bold"
        fontSize="md"
        leftIcon={<AlertTriangle size={20} />}
        _hover={{
          bg: "rgba(220, 38, 38, 0.25)",
        }}
        _active={{
          bg: "rgba(220, 38, 38, 0.3)",
        }}
      >
        Emergency Flatten All
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <ModalContent
          bg="gray.900"
          border="1px solid"
          borderColor="red.500"
          borderRadius="xl"
          mx={4}
        >
          <ModalHeader
            color="red.400"
            borderBottom="1px solid"
            borderColor="whiteAlpha.200"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Icon as={AlertTriangle} />
            Emergency Flatten
          </ModalHeader>

          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              <Text color="white" fontSize="md">
                This will immediately close ALL open positions across ALL your accounts.
              </Text>
              <Text color="whiteAlpha.700" fontSize="sm">
                {accounts.length} account{accounts.length !== 1 ? 's' : ''} will be affected.
              </Text>
              <Text color="red.300" fontSize="sm" fontWeight="medium">
                This action cannot be undone.
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter borderTop="1px solid" borderColor="whiteAlpha.200" gap={3}>
            <Button
              variant="ghost"
              onClick={onClose}
              isDisabled={isSubmitting}
              color="whiteAlpha.700"
              _hover={{ bg: "whiteAlpha.100" }}
            >
              Cancel
            </Button>
            <Button
              bg="red.600"
              color="white"
              onClick={handleFlattenAll}
              isLoading={isSubmitting}
              loadingText="Flattening..."
              leftIcon={<X size={16} />}
              _hover={{ bg: "red.500" }}
              _active={{ bg: "red.700" }}
            >
              Flatten All Positions
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default EmergencyFlatten;
