import React from 'react';
// Individual imports from Chakra UI
import { Modal } from '@chakra-ui/react';
import { ModalOverlay } from '@chakra-ui/react';
import { ModalContent } from '@chakra-ui/react';
import { ModalHeader } from '@chakra-ui/react';
import { ModalBody } from '@chakra-ui/react';
import { ModalCloseButton } from '@chakra-ui/react';
import { VStack } from '@chakra-ui/react';
import { HStack } from '@chakra-ui/react';
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

import { Copy, CheckCircle, AlertTriangle } from 'lucide-react';

function WebhookDetailsModal({ isOpen, onClose, webhook, isNewlyCreated = false }) {
  const fullWebhookUrl = webhook?.complete_webhook_url || `${webhook?.webhook_url}?secret=${webhook?.secret_key}`;
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
        color="white"
        maxH="90vh"
        overflow="hidden"
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.15)',
            },
          },
        }}
      >
        <ModalHeader borderBottom="1px solid" borderColor="whiteAlpha.200">
          Webhook Configuration
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody 
          py={6}
          overflowY="auto"
          sx={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.15)',
              },
            },
          }}
        >
          <VStack spacing={6} align="stretch">
            {/* Combined Security Alert */}
            <Alert 
              status={isNewlyCreated ? "error" : "warning"}
              variant="subtle"
              bg={isNewlyCreated ? "rgba(229, 62, 62, 0.1)" : "rgba(236, 201, 75, 0.1)"}
              borderRadius="lg"
              border="1px solid"
              borderColor={isNewlyCreated ? "rgba(229, 62, 62, 0.2)" : "rgba(236, 201, 75, 0.2)"}
              flexDirection="column"
              alignItems="flex-start"
              p={4}
            >
              {isNewlyCreated ? (
                <>
                  <HStack mb={2} alignItems="center">
                    <AlertTriangle size={20} color="#E53E3E" />
                    <Text fontWeight="bold" fontSize="md" color="red.500">
                      IMPORTANT: Save Your Webhook URL Now!
                    </Text>
                  </HStack>
                  <VStack spacing={2} align="flex-start" w="full">
                    <Text fontSize="sm">
                      This is the ONLY time you'll see the complete webhook URL with the secret key. 
                      Copy and save it immediately - it cannot be retrieved later for security reasons.
                    </Text>
                    <Text fontSize="sm" fontStyle="italic">
                      This URL contains sensitive credentials. Keep it secure and never share it publicly.
                    </Text>
                  </VStack>
                </>
              ) : (
                <HStack>
                  <AlertIcon />
                  <Text fontSize="sm">
                    This URL contains sensitive credentials. Keep it secure and never share it publicly.
                  </Text>
                </HStack>
              )}
            </Alert>

            {/* Webhook URL */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color="white">
                Webhook URL
              </Text>
              <InputGroup size="md">
                <Input
                  value={fullWebhookUrl}
                  readOnly
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  borderRadius="lg"
                  color="white"
                  pr="4.5rem"
                  _focus={{
                    borderColor: "rgba(0, 198, 224, 0.5)",
                    boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.2)"
                  }}
                />
                <InputRightElement width="4.5rem">
                  <IconButton
                    size="sm"
                    onClick={() => {
                      onUrlCopy();
                      if (isNewlyCreated && !hasUrlCopied) {
                        toast({
                          title: "Webhook URL Copied!",
                          description: "The complete webhook URL with secret has been copied to your clipboard. Save it somewhere secure.",
                          status: "success",
                          duration: 5000,
                          isClosable: true,
                        });
                      }
                    }}
                    icon={hasUrlCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    aria-label={hasUrlCopied ? "Copied" : "Copy URL"}
                    bg={hasUrlCopied ? "rgba(72, 187, 120, 0.2)" : "rgba(255, 255, 255, 0.1)"}
                    color={hasUrlCopied ? "#48BB78" : "#00C6E0"}
                    border="1px solid"
                    borderColor={hasUrlCopied ? "rgba(72, 187, 120, 0.3)" : "rgba(0, 198, 224, 0.3)"}
                    _hover={{
                      bg: hasUrlCopied ? "rgba(72, 187, 120, 0.3)" : "rgba(0, 198, 224, 0.2)",
                      borderColor: hasUrlCopied ? "rgba(72, 187, 120, 0.4)" : "rgba(0, 198, 224, 0.4)"
                    }}
                  />
                </InputRightElement>
              </InputGroup>
            </Box>

            {/* Implementation Guide */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={4} color="white">
                Implementation Guide
              </Text>

              {webhook?.source_type === 'tradingview' ? (
                <Alert 
                  status="info" 
                  variant="subtle"
                  bg="rgba(0, 198, 224, 0.1)"
                  borderRadius="lg"
                  border="1px solid rgba(0, 198, 224, 0.2)"
                  mb={4}
                >
                  <AlertIcon color="#00C6E0" />
                  <Box>
                    <Text fontWeight="medium" color="white">TradingView Setup</Text>
                    <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)">
                      Configure this URL in your TradingView alert message webhook URL field. 
                      The {'{{strategy.order.action}}'} variable will automatically handle both buy and sell signals.
                    </Text>
                  </Box>
                </Alert>
              ) : (
                <Alert 
                  status="info" 
                  variant="subtle"
                  bg="rgba(0, 198, 224, 0.1)"
                  borderRadius="lg"
                  border="1px solid rgba(0, 198, 224, 0.2)"
                  mb={4}
                >
                  <AlertIcon color="#00C6E0" />
                  <Box>
                    <Text fontWeight="medium" color="white">Custom Implementation</Text>
                    <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)">
                      You'll need to create two separate webhooks - one for buy signals and one for sell signals.
                    </Text>
                  </Box>
                </Alert>
              )}

              <Box
                p={4}
                bg="rgba(255, 255, 255, 0.05)"
                border="1px solid rgba(255, 255, 255, 0.1)"
                borderRadius="lg"
                cursor="pointer"
                onClick={handleCopyPayload}
                transition="all 0.2s"
                _hover={{ 
                  bg: "rgba(255, 255, 255, 0.08)",
                  borderColor: "rgba(0, 198, 224, 0.3)"
                }}
              >
                <Text fontSize="sm" mb={2} color="rgba(255, 255, 255, 0.7)">
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