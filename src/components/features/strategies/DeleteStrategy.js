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
  Badge,
  Flex,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { 
  AlertTriangle, 
  AlertCircle,
  Trash2
} from 'lucide-react';

const DeleteStrategy = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  strategyName, 
  strategyType,
  isLoading = false,
  additionalInfo = null
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      toast({
        title: "Confirm Deletion",
        description: "Click delete again to confirm",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsDeleting(true);
      await onConfirm();
      toast({
        title: "Strategy Deleted",
        description: "The strategy has been successfully removed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      handleClose();
    } catch (error) {
      toast({
        title: "Error Deleting Strategy",
        description: error.message || "Failed to delete strategy",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmDelete(false);
    setIsDeleting(false);
    onClose();
  };

  const getStrategyTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'single':
        return 'blue';
      case 'multiple':
        return 'purple';
      default:
        return 'gray';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      isCentered
      closeOnOverlayClick={!isDeleting}
      closeOnEsc={!isDeleting}
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent 
        bg="rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="xl"
        maxW="400px"
        color="white"
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.18)" 
          pb={4}
          display="flex"
          alignItems="center"
          gap={2}
        >
          {isDeleting ? (
            <>
              <Spinner size="sm" />
              <Text>Deleting Strategy...</Text>
            </>
          ) : (
            <>
              <AlertTriangle color="#F56565" />
              Confirm Strategy Deletion
            </>
          )}
        </ModalHeader>
        
        {!isDeleting && <ModalCloseButton />}

        <ModalBody pt={6} pb={8}>
          <VStack spacing={4} align="stretch">
            <Text>
              Are you sure you want to delete this strategy?
            </Text>

            <Box
              p={4}
              bg="whiteAlpha.100"
              borderRadius="md"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Flex gap={2} align="center" mb={2}>
                <Text fontWeight="bold" color="whiteAlpha.900">
                  {strategyName}
                </Text>
                {strategyType && (
                  <Badge colorScheme={getStrategyTypeColor(strategyType)}>
                    {strategyType}
                  </Badge>
                )}
              </Flex>

              {additionalInfo && (
                <Text fontSize="sm" color="whiteAlpha.700">
                  {additionalInfo}
                </Text>
              )}
            </Box>

            {strategyType === 'multiple' && (
              <Alert 
                status="warning" 
                variant="subtle"
                borderRadius="md"
                bg="rgba(236, 201, 75, 0.2)"
              >
                <AlertIcon />
                <Box>
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    This will stop all follower account executions and remove all associated configurations.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {confirmDelete && (
              <Alert 
                status="error" 
                variant="subtle"
                borderRadius="md"
                bg="rgba(245, 101, 101, 0.2)"
              >
                <AlertIcon />
                <Box>
                  <AlertTitle>Confirmation Required</AlertTitle>
                  <AlertDescription>
                    Click delete again to permanently remove this strategy.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            <Text 
              color="red.300" 
              fontStyle="italic"
              fontSize="sm"
              fontWeight="medium"
            >
              This action cannot be undone.
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter 
          borderTop="1px solid rgba(255, 255, 255, 0.18)" 
          pt={4}
        >
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={handleClose}
            isDisabled={isDeleting}
            _hover={{ bg: 'whiteAlpha.100' }}
          >
            Cancel
          </Button>
          <Button 
            colorScheme={confirmDelete ? "red" : "gray"}
            onClick={handleDelete}
            isLoading={isDeleting}
            loadingText="Deleting..."
            leftIcon={confirmDelete ? <AlertCircle size={16} /> : <Trash2 size={16} />}
            bg={confirmDelete ? "red.500" : "whiteAlpha.200"}
            _hover={{
              bg: confirmDelete ? "red.600" : "whiteAlpha.300"
            }}
          >
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

DeleteStrategy.defaultProps = {
  isLoading: false,
  additionalInfo: null
};

export default DeleteStrategy;