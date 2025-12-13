import React, { useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    VStack,
    Text,
    Box,
    Input,
    InputGroup,
    InputRightElement,
    FormControl,
    FormLabel,
    Button,
    useToast,
    HStack,
    Icon,
    Alert,
    AlertIcon,
    Link,
    IconButton,
    Spinner
} from '@chakra-ui/react';
import { Eye, EyeOff, Key, Lock, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';
import { binanceApi } from '@/services/api/brokers/binance';
import { getBrokerById } from '@/utils/constants/brokers';

const BinanceApiKeyModal = ({
    isOpen,
    onClose,
    onSuccess,
    brokerId = 'binance' // 'binance' or 'binanceus'
}) => {
    const [apiKey, setApiKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    const [isTestingKey, setIsTestingKey] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [testResult, setTestResult] = useState(null); // null, 'success', 'error'
    const toast = useToast();

    const broker = getBrokerById(brokerId);
    const brokerName = broker?.name || 'Binance';
    const helpUrl = broker?.apiKeyConfig?.helpUrl || 'https://www.binance.com/en/support/faq';

    const resetForm = () => {
        setApiKey('');
        setSecretKey('');
        setShowSecret(false);
        setTestResult(null);
        setIsTestingKey(false);
        setIsConnecting(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleTestKey = async () => {
        if (!apiKey.trim() || !secretKey.trim()) {
            toast({
                title: "Missing Information",
                description: "Please enter both API Key and Secret Key",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsTestingKey(true);
        setTestResult(null);

        try {
            const result = await binanceApi.testApiKey(apiKey.trim(), secretKey.trim());

            if (result.success) {
                setTestResult('success');
                toast({
                    title: "API Key Valid",
                    description: `Connected to ${result.account_type || 'SPOT'} account`,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                setTestResult('error');
                toast({
                    title: "Invalid API Key",
                    description: "Please check your credentials and try again",
                    status: "error",
                    duration: 4000,
                    isClosable: true,
                });
            }
        } catch (error) {
            setTestResult('error');
            const errorMessage = error.response?.data?.detail || error.message || "Failed to validate API key";
            toast({
                title: "Connection Failed",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsTestingKey(false);
        }
    };

    const handleConnect = async () => {
        if (!apiKey.trim() || !secretKey.trim()) {
            toast({
                title: "Missing Information",
                description: "Please enter both API Key and Secret Key",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // Recommend testing first
        if (testResult !== 'success') {
            const shouldProceed = window.confirm(
                "You haven't tested your API key yet. It's recommended to test before connecting. Continue anyway?"
            );
            if (!shouldProceed) return;
        }

        setIsConnecting(true);

        try {
            const result = await binanceApi.saveApiKey(apiKey.trim(), secretKey.trim());

            toast({
                title: "Account Connected",
                description: `${brokerName} account connected successfully`,
                status: "success",
                duration: 4000,
                isClosable: true,
            });

            // Call success callback
            if (onSuccess) {
                onSuccess({
                    broker: brokerId,
                    accountId: result.account_id,
                    ...result
                });
            }

            handleClose();
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message || "Failed to connect account";
            toast({
                title: "Connection Failed",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsConnecting(false);
        }
    };

    const isSubmitting = isTestingKey || isConnecting;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            closeOnOverlayClick={!isSubmitting}
            isCentered
        >
            <ModalOverlay
                bg="blackAlpha.300"
                backdropFilter="blur(10px)"
            />
            <ModalContent
                bg="rgba(0, 0, 0, 0.85)"
                backdropFilter="blur(10px)"
                boxShadow="0 8px 32px 0 rgba(240, 185, 11, 0.2)"
                border="1px solid rgba(240, 185, 11, 0.3)"
                borderRadius="xl"
                maxW="500px"
                color="white"
            >
                <ModalHeader
                    borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                    pb={4}
                >
                    <HStack spacing={3}>
                        <Box
                            w="40px"
                            h="40px"
                            bg="rgba(240, 185, 11, 0.15)"
                            borderRadius="lg"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Icon as={Key} size="20px" color="#F0B90B" />
                        </Box>
                        <VStack align="start" spacing={0}>
                            <Text>Connect to {brokerName}</Text>
                            <Text fontSize="xs" color="whiteAlpha.600" fontWeight="normal">
                                Enter your API credentials
                            </Text>
                        </VStack>
                    </HStack>
                </ModalHeader>
                {!isSubmitting && <ModalCloseButton color="white" />}

                <ModalBody pt={6} pb={8}>
                    <VStack spacing={5}>
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
                                    API Key Authentication
                                </Text>
                                <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                                    Your credentials are encrypted and stored securely. We recommend enabling only trading permissions, not withdrawals.
                                </Text>
                            </VStack>
                        </Alert>

                        <FormControl isRequired>
                            <FormLabel color="white" fontSize="sm" fontWeight="medium">
                                <HStack spacing={2}>
                                    <Icon as={Key} size="14px" color="#F0B90B" />
                                    <Text>API Key</Text>
                                </HStack>
                            </FormLabel>
                            <Input
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    setTestResult(null);
                                }}
                                placeholder={broker?.apiKeyConfig?.keyPlaceholder || "Enter your API Key"}
                                bg="rgba(255, 255, 255, 0.05)"
                                border="1px solid rgba(255, 255, 255, 0.1)"
                                borderRadius="md"
                                _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                                _focus={{
                                    borderColor: "#F0B90B",
                                    boxShadow: "0 0 0 1px #F0B90B"
                                }}
                                color="white"
                                isDisabled={isSubmitting}
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel color="white" fontSize="sm" fontWeight="medium">
                                <HStack spacing={2}>
                                    <Icon as={Lock} size="14px" color="#F0B90B" />
                                    <Text>Secret Key</Text>
                                </HStack>
                            </FormLabel>
                            <InputGroup>
                                <Input
                                    type={showSecret ? "text" : "password"}
                                    value={secretKey}
                                    onChange={(e) => {
                                        setSecretKey(e.target.value);
                                        setTestResult(null);
                                    }}
                                    placeholder={broker?.apiKeyConfig?.secretPlaceholder || "Enter your Secret Key"}
                                    bg="rgba(255, 255, 255, 0.05)"
                                    border="1px solid rgba(255, 255, 255, 0.1)"
                                    borderRadius="md"
                                    _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                                    _focus={{
                                        borderColor: "#F0B90B",
                                        boxShadow: "0 0 0 1px #F0B90B"
                                    }}
                                    color="white"
                                    isDisabled={isSubmitting}
                                />
                                <InputRightElement>
                                    <IconButton
                                        aria-label={showSecret ? "Hide secret" : "Show secret"}
                                        icon={showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                        variant="ghost"
                                        color="whiteAlpha.600"
                                        size="sm"
                                        onClick={() => setShowSecret(!showSecret)}
                                        _hover={{ color: "white", bg: "transparent" }}
                                        isDisabled={isSubmitting}
                                    />
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>

                        {/* Test Result Indicator */}
                        {testResult && (
                            <HStack
                                w="full"
                                p={3}
                                bg={testResult === 'success' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(245, 101, 101, 0.1)'}
                                border={`1px solid ${testResult === 'success' ? 'rgba(72, 187, 120, 0.3)' : 'rgba(245, 101, 101, 0.3)'}`}
                                borderRadius="md"
                            >
                                <Icon
                                    as={testResult === 'success' ? CheckCircle : AlertTriangle}
                                    color={testResult === 'success' ? 'green.400' : 'red.400'}
                                />
                                <Text fontSize="sm" color={testResult === 'success' ? 'green.300' : 'red.300'}>
                                    {testResult === 'success' ? 'API key is valid and ready to connect' : 'API key validation failed'}
                                </Text>
                            </HStack>
                        )}

                        {/* Action Buttons */}
                        <HStack w="full" spacing={3}>
                            <Button
                                flex={1}
                                variant="outline"
                                borderColor="#F0B90B"
                                color="#F0B90B"
                                onClick={handleTestKey}
                                isLoading={isTestingKey}
                                loadingText="Testing..."
                                isDisabled={isConnecting || !apiKey.trim() || !secretKey.trim()}
                                _hover={{ bg: 'rgba(240, 185, 11, 0.1)' }}
                            >
                                Test Connection
                            </Button>
                            <Button
                                flex={1}
                                bg="#F0B90B"
                                color="black"
                                onClick={handleConnect}
                                isLoading={isConnecting}
                                loadingText="Connecting..."
                                isDisabled={isTestingKey || !apiKey.trim() || !secretKey.trim()}
                                _hover={{ bg: '#D9A60A' }}
                                fontWeight="semibold"
                            >
                                Connect Account
                            </Button>
                        </HStack>

                        {/* Help Link */}
                        <Box
                            p={3}
                            bg="rgba(255, 255, 255, 0.03)"
                            borderRadius="md"
                            border="1px solid rgba(255, 255, 255, 0.05)"
                            w="full"
                        >
                            <HStack spacing={2} justify="center">
                                <Text fontSize="xs" color="whiteAlpha.600">
                                    Need help creating an API key?
                                </Text>
                                <Link
                                    href={helpUrl}
                                    isExternal
                                    color="#F0B90B"
                                    fontSize="xs"
                                    display="flex"
                                    alignItems="center"
                                    _hover={{ textDecoration: 'underline' }}
                                >
                                    View Guide <Icon as={ExternalLink} ml={1} size="12px" />
                                </Link>
                            </HStack>
                        </Box>

                        {/* Security Note */}
                        <Box
                            p={3}
                            bg="rgba(255, 255, 255, 0.05)"
                            borderRadius="md"
                            border="1px solid rgba(255, 255, 255, 0.1)"
                            w="full"
                        >
                            <HStack spacing={3}>
                                <Icon as={Lock} size="16px" color="#00C6E0" />
                                <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                                    Your credentials are encrypted and never stored in plaintext. We recommend using read-only + trade permissions without withdrawal access.
                                </Text>
                            </HStack>
                        </Box>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default BinanceApiKeyModal;
