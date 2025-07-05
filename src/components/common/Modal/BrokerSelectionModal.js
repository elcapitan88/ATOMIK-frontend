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
import { getAvailableBrokers } from '@/utils/constants/brokers';

const BrokerOption = ({ broker, onClick, isDisabled = false }) => (
  <VStack spacing={3} align="center">
    <Box
      as="button"
      onClick={() => onClick(broker)}
      disabled={isDisabled}
      _disabled={{ 
        opacity: 0.5, 
        cursor: 'not-allowed',
      }}
      _hover={{ 
        transform: isDisabled ? 'none' : 'scale(1.05)',
        opacity: isDisabled ? 0.5 : 1
      }}
      transition="all 0.2s ease"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="transparent"
      border="none"
      p={2}
    >
      <img 
        src={broker.logo} 
        alt={`${broker.name} logo`}
        style={{
          width: '80px',
          height: '80px',
          objectFit: 'contain',
          objectPosition: 'center'
        }}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      <Box 
        display="none" 
        alignItems="center"
        justifyContent="center"
        w="80px"
        h="80px"
        bg="whiteAlpha.200"
        borderRadius="md"
        fontSize="sm" 
        textAlign="center"
        color="whiteAlpha.900"
        p={2}
      >
        {broker.name}
      </Box>
    </Box>
    <Text fontSize="sm" color="whiteAlpha.900" textAlign="center">
      {broker.description}
    </Text>
  </VStack>
);

const BrokerSelectionModal = ({ isOpen, onClose, onBrokerSelect }) => {
  const availableBrokers = getAvailableBrokers();

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
        boxShadow="0 8px 32px 0 rgba(255, 255, 255, 0.1)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="xl"
        maxW="400px"
        color="white"
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.18)" 
          pb={4}
        >
          Select Broker
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pt={6} pb={8}>
          <HStack spacing={8} justify="center">
            {availableBrokers.map((broker) => (
              <BrokerOption
                key={broker.id}
                broker={broker}
                onClick={onBrokerSelect}
              />
            ))}
          </HStack>
          
          <Text 
            mt={6} 
            fontSize="sm" 
            color="whiteAlpha.600" 
            textAlign="center"
          >
            Select your preferred broker to connect
          </Text>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BrokerSelectionModal;