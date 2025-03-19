import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Button, 
  VStack, 
  HStack, 
  Badge, 
  Icon, 
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useClipboard,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Select,
  ModalFooter
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Webhook, Copy, Info, MoreVertical, AlertCircle, Check } from 'lucide-react';
import { useDemoAnimation } from '../DemoController';

const WebhookCreation = () => {
  // Get animation state from context
  const { isAnimating, animationProgress, typingText, typeText } = useDemoAnimation();
  
  // Local state
  const [webhooks, setWebhooks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  
  // Reset and coordinate animations when this step becomes active
  useEffect(() => {
    if (isAnimating) {
      // Reset state
      setWebhooks([
        {
          id: 'webhook1',
          name: 'TradingView Signal',
          url: 'https://api.atomiktrading.io/api/v1/webhooks/abc123',
          source: 'tradingview',
          status: 'active',
          subscribers: 0
        }
      ]);
      
      setNewWebhookUrl('');
      
      // After delay, show modal
      const timer1 = setTimeout(() => {
        setIsModalOpen(true);
      }, 1500);
      
      // After modal opens, start typing the webhook URL
      const timer2 = setTimeout(() => {
        typeText('https://api.atomiktrading.io/api/v1/webhooks/xyz789');
        setNewWebhookUrl('https://api.atomiktrading.io/api/v1/webhooks/xyz789');
      }, 2500);
      
      // After typing, close modal and add new webhook
      const timer3 = setTimeout(() => {
        setIsModalOpen(false);
        
        setWebhooks(prev => [
          ...prev,
          {
            id: 'webhook2',
            name: 'Custom Strategy',
            url: 'https://api.atomiktrading.io/api/v1/webhooks/xyz789',
            source: 'custom',
            status: 'active',
            subscribers: 0
          }
        ]);
      }, 5000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isAnimating, typeText]);
  
  return (
    <Flex direction="column" h="100%" p={2}>
      {/* Header with action button */}
      <Flex justify="space-between" align="center" mb={4} px={2}>
        <Text color="white" fontSize="lg" fontWeight="bold">
          Webhooks
        </Text>
        
        <Button
          as={motion.button}
          size="sm"
          bg={isModalOpen ? "transparent" : "rgba(0, 198, 224, 0.2)"}
          color="white"
          borderWidth="1px"
          borderColor="rgba(0, 198, 224, 0.6)"
          _hover={{ bg: "rgba(0, 198, 224, 0.3)" }}
          fontSize="sm"
          px={3}
          animate={{
            scale: isModalOpen ? 1 : [1, 1.05, 1],
            boxShadow: isModalOpen ? 
              "0 0 0px rgba(0, 198, 224, 0)" : 
              ["0 0 0px rgba(0, 198, 224, 0)", "0 0 10px rgba(0, 198, 224, 0.5)", "0 0 0px rgba(0, 198, 224, 0)"]
          }}
          transition={{ repeat: isModalOpen ? 0 : Infinity, repeatDelay: 3 }}
        >
          Generate Webhook
        </Button>
      </Flex>
      
      {/* Webhooks table */}
      <Box 
        flex="1" 
        overflowY="auto" 
        bg="rgba(30, 30, 30, 0.3)" 
        borderRadius="lg"
        borderWidth="1px"
        borderColor="rgba(255, 255, 255, 0.1)"
        p={2}
      >
        <Table variant="unstyled" size="sm">
          <Thead>
            <Tr>
              <Th color="whiteAlpha.600" fontSize="xs">NAME</Th>
              <Th color="whiteAlpha.600" fontSize="xs">URL</Th>
              <Th color="whiteAlpha.600" fontSize="xs">STATUS</Th>
              <Th color="whiteAlpha.600" fontSize="xs">DETAILS</Th>
              <Th color="whiteAlpha.600" fontSize="xs" width="50px">ACTIONS</Th>
            </Tr>
          </Thead>
          <Tbody>
            <AnimatePresence>
              {webhooks.map((webhook, index) => (
                <WebhookRow key={webhook.id} webhook={webhook} isNew={index === webhooks.length - 1 && webhooks.length > 1} />
              ))}
            </AnimatePresence>
          </Tbody>
        </Table>
        
        {webhooks.length === 0 && (
          <Flex 
            direction="column" 
            align="center" 
            justify="center" 
            py={10}
            opacity={0.7}
          >
            <Icon as={AlertCircle} boxSize={10} color="whiteAlpha.400" mb={3} />
            <Text color="whiteAlpha.600" fontSize="sm">
              No webhooks created
            </Text>
            <Text color="whiteAlpha.500" fontSize="xs" mt={1}>
              Create your first webhook to get started
            </Text>
          </Flex>
        )}
      </Box>
      
      {/* Webhook creation modal */}
      <AnimatePresence>
        {isModalOpen && (
          <WebhookModal 
            onClose={() => setIsModalOpen(false)} 
            typingText={typingText} 
            url={newWebhookUrl}
          />
        )}
      </AnimatePresence>
    </Flex>
  );
};

// Webhook table row
const WebhookRow = ({ webhook, isNew }) => {
  const { hasCopied, onCopy } = useClipboard(webhook.url);
  
  return (
    <Tr
      as={motion.tr}
      bg="transparent"
      _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
      initial={isNew ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      borderBottom="1px solid rgba(255, 255, 255, 0.05)"
    >
      <Td position="relative">
        <Box
          position="absolute"
          left={0}
          top="6px"
          bottom="6px"
          width="3px"
          bg={webhook.source === 'tradingview' ? "cyan.400" : "purple.400"}
        />
        <VStack align="flex-start" spacing={0} pl={2}>
          <Text color="white" fontWeight="medium" fontSize="sm">
            {webhook.name}
          </Text>
          <Text fontSize="xs" color="whiteAlpha.600">
            {webhook.source}
          </Text>
        </VStack>
      </Td>
      
      <Td>
        <HStack>
          <Text
            color="whiteAlpha.900"
            fontSize="xs"
            fontFamily="mono"
            isTruncated
            maxW="200px"
          >
            {webhook.url}
          </Text>
          <IconButton
            icon={<Copy size={12} />}
            size="xs"
            variant="ghost"
            color={hasCopied ? "green.400" : "whiteAlpha.400"}
            _hover={{ color: "white", bg: "whiteAlpha.100" }}
            onClick={onCopy}
            aria-label="Copy webhook URL"
          />
        </HStack>
      </Td>
      
      <Td>
        <Badge colorScheme="green" variant="subtle" fontSize="xs">
          Active
        </Badge>
      </Td>
      
      <Td>
        <Icon as={Info} boxSize={3} color="whiteAlpha.400" />
      </Td>
      
      <Td>
        <IconButton
          icon={<MoreVertical size={14} />}
          variant="ghost"
          size="xs"
          color="whiteAlpha.600"
          _hover={{ bg: "whiteAlpha.100" }}
          aria-label="More options"
        />
      </Td>
    </Tr>
  );
};

// Webhook creation modal
const WebhookModal = ({ onClose, typingText, url }) => {
  const [formStep, setFormStep] = useState(1);
  
  // Progress through form steps
  useEffect(() => {
    if (url) {
      const timer = setTimeout(() => {
        setFormStep(2);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [url]);
  
  return (
    <Modal isOpen={true} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(3px)" />
      <ModalContent
        as={motion.div}
        bg="rgba(30, 35, 40, 0.95)"
        borderColor="rgba(255, 255, 255, 0.1)"
        borderWidth="1px"
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.3)"
        borderRadius="xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        maxW="500px"
      >
        <ModalHeader borderBottom="1px solid rgba(255, 255, 255, 0.1)" color="white">
          <HStack>
            <Icon as={Webhook} color="cyan.400" mr={2} />
            <Text>Create New Webhook</Text>
          </HStack>
        </ModalHeader>
        
        <ModalBody py={4}>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text color="whiteAlpha.700" fontSize="sm" mb={1}>
                Webhook Name
              </Text>
              <Input
                placeholder="Enter webhook name"
                defaultValue="Custom Strategy"
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
                color="white"
                _hover={{ borderColor: "whiteAlpha.400" }}
                _focus={{ borderColor: "cyan.500", boxShadow: "0 0 0 1px cyan.500" }}
              />
            </Box>
            
            <Box>
              <Text color="whiteAlpha.700" fontSize="sm" mb={1}>
                Source Type
              </Text>
              <Select
                defaultValue="custom"
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
                color="white"
                _hover={{ borderColor: "whiteAlpha.400" }}
                _focus={{ borderColor: "cyan.500", boxShadow: "0 0 0 1px cyan.500" }}
              >
                <option value="tradingview">TradingView</option>
                <option value="custom">Custom Implementation</option>
                <option value="trendspider">TrendSpider</option>
              </Select>
            </Box>
            
            <Box>
              <Text color="whiteAlpha.700" fontSize="sm" mb={1}>
                Your Webhook URL
              </Text>
              <Box
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
                borderWidth="1px"
                borderRadius="md"
                p={2}
                fontFamily="mono"
                color="cyan.300"
                fontSize="sm"
                position="relative"
              >
                {formStep === 1 ? (
                  <>
                    {typingText}<Box as="span" animation="blink 1s step-end infinite">|</Box>
                  </>
                ) : (
                  <HStack justify="space-between">
                    <Text>{url}</Text>
                    <Badge colorScheme="green" variant="subtle">
                      <HStack spacing={1}>
                        <Check size={10} />
                        <Text>Ready</Text>
                      </HStack>
                    </Badge>
                  </HStack>
                )}
              </Box>
            </Box>
          </VStack>
        </ModalBody>
        
        <ModalFooter borderTop="1px solid rgba(255, 255, 255, 0.1)">
          <Button
            variant="ghost"
            color="whiteAlpha.700"
            mr={3}
            onClick={onClose}
            _hover={{ bg: "whiteAlpha.100" }}
          >
            Cancel
          </Button>
          <Button
            color="black"
            bg="cyan.400"
            _hover={{ bg: "cyan.500" }}
            isDisabled={formStep === 1}
            onClick={onClose}
          >
            Create Webhook
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WebhookCreation;