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
  SimpleGrid,
  Text,
  Box,
  Icon,
  Badge,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { Building2, TrendingUp, Shield } from 'lucide-react';
import { getAvailableBrokers } from '@/utils/constants/brokers';

const BrokerOption = ({ broker, onClick, isDisabled = false }) => {
  const isPopular = broker.id === 'tradovate'; // Mark Tradovate as popular

  return (
    <Box
      as="button"
      onClick={() => onClick(broker)}
      disabled={isDisabled}
      p={4}
      borderRadius="lg"
      border="2px solid"
      borderColor={isDisabled ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.1)"}
      bg="rgba(255, 255, 255, 0.05)"
      backdropFilter="blur(10px)"
      transition="all 0.3s ease"
      _hover={!isDisabled ? {
        borderColor: "#00C6E0",
        bg: "rgba(0, 198, 224, 0.08)",
        transform: "translateY(-2px)",
        boxShadow: "0 8px 25px 0 rgba(0, 0, 0, 0.3)"
      } : {}}
      _disabled={{
        opacity: 0.5,
        cursor: 'not-allowed'
      }}
      position="relative"
      w="full"
    >
      <VStack spacing={3}>
        <Box position="relative">
          <Box
            w="80px"
            h="80px"
            bg="rgba(255, 255, 255, 0.1)"
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            <img
              src={broker.logo}
              alt={`${broker.name} logo`}
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain',
                objectPosition: 'center'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <Box
              display="none"
              alignItems="center"
              justifyContent="center"
              w="60px"
              h="60px"
              bg="rgba(0, 198, 224, 0.15)"
              borderRadius="md"
              fontSize="xs"
              textAlign="center"
              color="#00C6E0"
              fontWeight="semibold"
              p={2}
            >
              {broker.name}
            </Box>
          </Box>

          {isPopular && (
            <Badge
              position="absolute"
              top="-8px"
              right="-8px"
              colorScheme="green"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="full"
            >
              Popular
            </Badge>
          )}
        </Box>

        <VStack spacing={1}>
          <Text fontSize="md" fontWeight="semibold" color="white">
            {broker.name}
          </Text>
          <Text fontSize="xs" color="rgba(255, 255, 255, 0.7)" textAlign="center">
            {broker.description}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};

const BrokerSelectionModal = ({ isOpen, onClose, onBrokerSelect }) => {
  const availableBrokers = getAvailableBrokers();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
    >
      <ModalOverlay
        bg="blackAlpha.300"
        backdropFilter="blur(10px)"
      />
      <ModalContent
        bg="rgba(0, 0, 0, 0.75)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.5)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        borderRadius="xl"
        maxW="550px"
        color="white"
      >
        <ModalHeader
          borderBottom="1px solid rgba(255, 255, 255, 0.1)"
          pb={4}
        >
          <HStack spacing={3}>
            <Icon as={Building2} size="20px" color="#00C6E0" />
            <Text>Select Your Broker</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pt={6} pb={8}>
          <VStack spacing={6}>
            <Alert
              status="info"
              bg="rgba(66, 153, 225, 0.1)"
              border="1px solid rgba(66, 153, 225, 0.3)"
              borderRadius="md"
              color="white"
            >
              <AlertIcon color="blue.300" />
              <VStack spacing={1} align="flex-start">
                <Text fontSize="sm" fontWeight="medium">
                  Connect your trading broker
                </Text>
                <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                  Choose your preferred broker to start automated trading
                </Text>
              </VStack>
            </Alert>

            <SimpleGrid columns={2} spacing={4} w="full">
              {availableBrokers.map((broker) => (
                <BrokerOption
                  key={broker.id}
                  broker={broker}
                  onClick={onBrokerSelect}
                />
              ))}
            </SimpleGrid>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BrokerSelectionModal;