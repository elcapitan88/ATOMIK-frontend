import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Box,
  Text,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  useClipboard,
  Code,
  Divider,
  Alert,
  AlertIcon,
  HStack,
} from '@chakra-ui/react';
import { 
  Copy, 
  CheckCircle,
  Info 
} from 'lucide-react';

const glassEffect = {
  bg: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px 0 rgba(0, 198, 224, 0.37)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  borderRadius: "xl",
  color: "white"
};

const WebhookDetailsModal = ({ isOpen, onClose, webhook }) => {
  const { hasCopied: hasUrlCopied, onCopy: onUrlCopy } = useClipboard(webhook?.webhook_url || '');

  const sampleCode = `
const payload = {
  strategy: "Your Strategy Name",
  action: "BUY",  // or "SELL"
  price: 100.50,
  quantity: 1
};

// Send the request
await fetch('${webhook?.webhook_url || ''}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});`;

  const samplePayload = {
    strategy: "Example Strategy",
    action: "BUY",
    price: 100.50,
    quantity: 1
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(samplePayload, null, 2));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered
      size="xl"
      scrollBehavior="inside"
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent {...glassEffect}>
        <ModalHeader borderBottom="1px solid" borderColor="whiteAlpha.200">
          Webhook Setup Instructions
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            {/* Webhook URL Section */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Webhook URL
              </Text>
              
              <InputGroup>
                <Input
                  value={webhook?.webhook_url || ''}
                  readOnly
                  bg="whiteAlpha.100"
                  pr="4.5rem"
                />
                <InputRightElement width="4.5rem">
                  <IconButton
                    h="1.75rem"
                    size="sm"
                    onClick={onUrlCopy}
                    icon={hasUrlCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  />
                </InputRightElement>
              </InputGroup>
            </Box>

            <Divider borderColor="whiteAlpha.200" />

            {/* Security Notice */}
            <Alert 
              status="info" 
              variant="subtle"
              bg="whiteAlpha.100"
              borderRadius="md"
            >
              <AlertIcon />
              <Box>
                <Text fontWeight="medium">Secure URL</Text>
                <Text fontSize="sm">
                  This URL includes authentication credentials. Keep it secure and don't share it publicly.
                </Text>
              </Box>
            </Alert>

            {/* Implementation Guide */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Implementation Guide
              </Text>

              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="medium" mb={2}>Implementation Example:</Text>
                  <Box 
                    p={4} 
                    bg="whiteAlpha.100" 
                    borderRadius="md" 
                    fontSize="sm"
                    fontFamily="mono"
                  >
                    <Code 
                      display="block" 
                      whiteSpace="pre" 
                      bg="transparent" 
                      color="white"
                      children={sampleCode}
                    />
                  </Box>
                </Box>

                <Box>
                  <Text fontWeight="medium" mb={2}>Example Payload:</Text>
                  <Box 
                    p={4} 
                    bg="whiteAlpha.100" 
                    borderRadius="md"
                    cursor="pointer"
                    onClick={handleCopyPayload}
                    transition="all 0.2s"
                    _hover={{ bg: "whiteAlpha.200" }}
                  >
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm">Click to copy</Text>
                      <Copy size={16} />
                    </HStack>
                    <Code 
                      display="block" 
                      whiteSpace="pre" 
                      bg="transparent" 
                      color="white"
                      children={JSON.stringify(samplePayload, null, 2)}
                    />
                  </Box>
                </Box>

                {/* Source-specific instructions */}
                {webhook?.source_type && (
                  <Box p={4} bg="whiteAlpha.100" borderRadius="md">
                    <HStack spacing={2} mb={2}>
                      <Info size={16} />
                      <Text fontWeight="medium">{webhook.source_type} Setup:</Text>
                    </HStack>
                    <Text fontSize="sm" color="whiteAlpha.800">
                      {webhook.source_type === 'tradingview' ? (
                        "Configure this URL in your TradingView alert message webhook URL field. No additional authentication is required."
                      ) : webhook.source_type === 'trendspider' ? (
                        "Add this URL to your TrendSpider automation webhook action. The authentication is included in the URL."
                      ) : (
                        "Use this URL as your webhook endpoint. The authentication is included in the URL parameters."
                      )}
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default WebhookDetailsModal;