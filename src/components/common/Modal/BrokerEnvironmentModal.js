import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Box,
} from '@chakra-ui/react';
import { doesBrokerSupportEnvironment } from '@/utils/constants/brokers';

const EnvironmentOption = ({ title, onClick, isDisabled = false }) => (
  <VStack spacing={2} align="center">
    <Box
      as="button"
      w="100px"
      h="100px"
      borderRadius="md"
      border="1px solid rgba(255, 255, 255, 0.18)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={() => onClick(title.toLowerCase())}
      disabled={isDisabled}
      bg="rgba(255, 255, 255, 0.05)"
      _hover={{ 
        bg: isDisabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)' 
      }}
      _disabled={{ 
        opacity: 0.5, 
        cursor: 'not-allowed',
      }}
      transition="all 0.3s"
      backdropFilter="blur(5px)"
    >
      <Box 
        w="60px" 
        h="60px" 
        bg="whiteAlpha.300" 
        borderRadius="md" 
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="sm"
        color="whiteAlpha.900"
      >
        {title}
      </Box>
    </Box>
    <Text fontSize="sm" color="whiteAlpha.900">
      {title} Trading
    </Text>
  </VStack>
);

const BrokerEnvironmentModal = ({ isOpen, onClose, selectedBroker, onEnvironmentSelect }) => {
  if (!selectedBroker) return null;

  const environments = ['Demo', 'Live'];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered
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
        >
          Select Environment for {selectedBroker.name}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pt={6} pb={8}>
          <HStack spacing={8} justify="center">
            {environments.map((env) => (
              <EnvironmentOption
                key={env}
                title={env}
                onClick={onEnvironmentSelect}
                isDisabled={!doesBrokerSupportEnvironment(selectedBroker.id, env.toLowerCase())}
              />
            ))}
          </HStack>
          
          <Text 
            mt={6} 
            fontSize="sm" 
            color="whiteAlpha.600" 
            textAlign="center"
          >
            Select Demo for practice or Live for real trading
          </Text>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BrokerEnvironmentModal;