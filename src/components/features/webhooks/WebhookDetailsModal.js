import React from 'react';
// Individual imports from Chakra UI
import { Modal } from '@chakra-ui/react';
import { ModalOverlay } from '@chakra-ui/react';
import { ModalContent } from '@chakra-ui/react';
import { ModalHeader } from '@chakra-ui/react';
import { ModalBody } from '@chakra-ui/react';
import { ModalCloseButton } from '@chakra-ui/react';
import { VStack } from '@chakra-ui/react';
import { Box } from '@chakra-ui/react';
import { Text } from '@chakra-ui/react';
import { Input } from '@chakra-ui/react';
import { InputGroup } from '@chakra-ui/react';
import { InputRightElement } from '@chakra-ui/react';
import { IconButton } from '@chakra-ui/react';
import { useClipboard } from '@chakra-ui/react';
import { Alert } from '@chakra-ui/react';
import { AlertIcon } from '@chakra-ui/react';
import { useToast } from '@chakra-ui/react';
import { Code } from '@chakra-ui/react';

import { Copy, CheckCircle } from 'lucide-react';

function WebhookDetailsModal({ isOpen, onClose, webhook }) {
  const fullWebhookUrl = `${webhook?.webhook_url}?secret=${webhook?.secret_key}`;
  const { hasCopied: hasUrlCopied, onCopy: onUrlCopy } = useClipboard(fullWebhookUrl);
  const toast = useToast();

  const getPayloadExample = () => {
    if (webhook?.source_type === 'tradingview') {
      return {
        action: "{{strategy.order.action}}"
      };
    }
    return {
      action: "BUY"
    };
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(getPayloadExample(), null, 2));
    toast({
      title: "Copied to clipboard",
      status: "success",
      duration: 2000,
    });
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
      <ModalContent
        bg="rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="xl"
        color="white"
        maxH="90vh"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.3)',
            },
          },
        }}
      >
        <ModalHeader borderBottom="1px solid" borderColor="whiteAlpha.200">
          Webhook Configuration
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            {/* Security Alert */}
            <Alert 
              status="warning" 
              variant="subtle"
              bg="rgba(236, 201, 75, 0.1)"
              borderRadius="md"
            >
              <AlertIcon />
              <Text fontSize="sm">
                This URL contains sensitive credentials. Keep it secure and never share it publicly.
              </Text>
            </Alert>

            {/* Webhook URL */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Webhook URL
              </Text>
              <InputGroup size="md">
                <Input
                  value={fullWebhookUrl}
                  readOnly
                  bg="whiteAlpha.100"
                  pr="4.5rem"
                />
                <InputRightElement width="4.5rem">
                  <IconButton
                    size="sm"
                    onClick={onUrlCopy}
                    icon={hasUrlCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    aria-label={hasUrlCopied ? "Copied" : "Copy URL"}
                  />
                </InputRightElement>
              </InputGroup>
            </Box>

            {/* Implementation Guide */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={4}>
                Implementation Guide
              </Text>

              {webhook?.source_type === 'tradingview' ? (
                <Alert 
                  status="info" 
                  variant="subtle"
                  bg="whiteAlpha.100"
                  borderRadius="md"
                  mb={4}
                >
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="medium">TradingView Setup</Text>
                    <Text fontSize="sm">
                      Configure this URL in your TradingView alert message webhook URL field. 
                      The {'{{strategy.order.action}}'} variable will automatically handle both buy and sell signals.
                    </Text>
                  </Box>
                </Alert>
              ) : (
                <Alert 
                  status="info" 
                  variant="subtle"
                  bg="whiteAlpha.100"
                  borderRadius="md"
                  mb={4}
                >
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="medium">Custom Implementation</Text>
                    <Text fontSize="sm">
                      You'll need to create two separate webhooks - one for buy signals and one for sell signals.
                    </Text>
                  </Box>
                </Alert>
              )}

              <Box
                p={4}
                bg="whiteAlpha.100"
                borderRadius="md"
                cursor="pointer"
                onClick={handleCopyPayload}
                transition="all 0.2s"
                _hover={{ bg: "whiteAlpha.200" }}
              >
                <Text fontSize="sm" mb={2} color="whiteAlpha.700">
                  Click to copy example payload
                </Text>
                <Code
                  display="block"
                  whiteSpace="pre"
                  bg="transparent"
                  color="white"
                  fontSize="sm"
                  p={0}
                >
                  {JSON.stringify(getPayloadExample(), null, 2)}
                </Code>
              </Box>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default WebhookDetailsModal;