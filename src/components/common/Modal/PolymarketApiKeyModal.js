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
    IconButton
} from '@chakra-ui/react';
import { Eye, EyeOff, Key, Lock, ExternalLink, CheckCircle, AlertTriangle, Wallet } from 'lucide-react';

const PolymarketApiKeyModal = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    const [isTestingKey, setIsTestingKey] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const toast = useToast();

    const resetForm = () => {
        setApiKey('');
        setApiSecret('');
        setWalletAddress('');
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
        if (!apiKey.trim() || !apiSecret.trim()) {
            toast({
                title: "Missing Information",
                description: "Please enter both API Key and API Secret",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsTestingKey(true);
        setTestResult(null);

        try {
            // Test connection via backend
            const response = await fetch('/api/v1/brokers/polymarket/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: apiKey.trim(),
                    api_secret: apiSecret.trim()
                })
            });

            const result = await response.json();

            if (result.success) {
                setTestResult('success');
                toast({
                    title: "API Key Valid",
                    description: "Successfully connected to Polymarket CLOB",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                setTestResult('error');
                toast({
                    title: "Invalid API Key",
                    description: result.message || "Please check your credentials",
                    status: "error",
                    duration: 4000,
                    isClosable: true,
                });
            }
        } catch (error) {
            setTestResult('error');
            toast({
                title: "Connection Failed",
                description: error.message || "Failed to validate API key",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsTestingKey(false);
        }
    };

    const handleConnect = async () => {
        if (!apiKey.trim() || !apiSecret.trim()) {
            toast({
                title: "Missing Information",
                description: "Please enter both API Key and API Secret",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (testResult !== 'success') {
            const shouldProceed = window.confirm(
                "You haven't tested your API key yet. Continue anyway?"
            );
            if (!shouldProceed) return;
        }

        setIsConnecting(true);

        try {
            const response = await fetch('/api/v1/brokers/polymarket/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: apiKey.trim(),
                    api_secret: apiSecret.trim(),
                    wallet_address: walletAddress.trim() || undefined
                })
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Account Connected",
                    description: "Polymarket account connected successfully",
                    status: "success",
                    duration: 4000,
                    isClosable: true,
                });

                if (onSuccess) {
                    onSuccess({
                        broker: 'polymarket',
                        accountId: result.account_id,
                        ...result
                    });
                }

                handleClose();
            } else {
                throw new Error(result.message || "Failed to connect");
            }
        } catch (error) {
            toast({
                title: "Connection Failed",
                description: error.message || "Failed to connect account",
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
                boxShadow="0 8px 32px 0 rgba(138, 43, 226, 0.2)"
                border="1px solid rgba(138, 43, 226, 0.3)"
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
                            bg="rgba(138, 43, 226, 0.15)"
                            borderRadius="lg"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Icon as={Key} size="20px" color="#8B2BE2" />
                        </Box>
                        <VStack align="start" spacing={0}>
                            <Text>Connect to Polymarket</Text>
                            <Text fontSize="xs" color="whiteAlpha.600" fontWeight="normal">
                                Prediction Market Trading
                            </Text>
                        </VStack>
                    </HStack>
                </ModalHeader>
                {!isSubmitting && <ModalCloseButton color="white" />}

                <ModalBody pt={6} pb={8}>
                    <VStack spacing={5}>
                        <Alert
                            status="warning"
                            bg="rgba(237, 137, 54, 0.1)"
                            border="1px solid rgba(237, 137, 54, 0.3)"
                            borderRadius="md"
                            color="white"
                        >
                            <AlertIcon color="orange.300" />
                            <VStack spacing={1} align="flex-start">
                                <Text fontSize="sm" fontWeight="medium">
                                    Jurisdiction Notice
                                </Text>
                                <Text fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                                    Polymarket is not available to US persons. By connecting, you confirm you are not a US resident.
                                </Text>
                            </VStack>
                        </Alert>

                        <FormControl isRequired>
                            <FormLabel color="white" fontSize="sm" fontWeight="medium">
                                <HStack spacing={2}>
                                    <Icon as={Key} size="14px" color="#8B2BE2" />
                                    <Text>API Key</Text>
                                </HStack>
                            </FormLabel>
                            <Input
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    setTestResult(null);
                                }}
                                placeholder="Enter your Polymarket API Key"
                                bg="rgba(255, 255, 255, 0.05)"
                                border="1px solid rgba(255, 255, 255, 0.1)"
                                borderRadius="md"
                                _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                                _focus={{
                                    borderColor: "#8B2BE2",
                                    boxShadow: "0 0 0 1px #8B2BE2"
                                }}
                                color="white"
                                isDisabled={isSubmitting}
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel color="white" fontSize="sm" fontWeight="medium">
                                <HStack spacing={2}>
                                    <Icon as={Lock} size="14px" color="#8B2BE2" />
                                    <Text>API Secret</Text>
                                </HStack>
                            </FormLabel>
                            <InputGroup>
                                <Input
                                    type={showSecret ? "text" : "password"}
                                    value={apiSecret}
                                    onChange={(e) => {
                                        setApiSecret(e.target.value);
                                        setTestResult(null);
                                    }}
                                    placeholder="Enter your API Secret"
                                    bg="rgba(255, 255, 255, 0.05)"
                                    border="1px solid rgba(255, 255, 255, 0.1)"
                                    borderRadius="md"
                                    _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                                    _focus={{
                                        borderColor: "#8B2BE2",
                                        boxShadow: "0 0 0 1px #8B2BE2"
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

                        <FormControl>
                            <FormLabel color="white" fontSize="sm" fontWeight="medium">
                                <HStack spacing={2}>
                                    <Icon as={Wallet} size="14px" color="#8B2BE2" />
                                    <Text>Wallet Address (Optional)</Text>
                                </HStack>
                            </FormLabel>
                            <Input
                                value={walletAddress}
                                onChange={(e) => setWalletAddress(e.target.value)}
                                placeholder="0x... (Polygon wallet address)"
                                bg="rgba(255, 255, 255, 0.05)"
                                border="1px solid rgba(255, 255, 255, 0.1)"
                                borderRadius="md"
                                _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                                _focus={{
                                    borderColor: "#8B2BE2",
                                    boxShadow: "0 0 0 1px #8B2BE2"
                                }}
                                color="white"
                                isDisabled={isSubmitting}
                            />
                        </FormControl>

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
                                    {testResult === 'success' ? 'API key is valid' : 'API key validation failed'}
                                </Text>
                            </HStack>
                        )}

                        <HStack w="full" spacing={3}>
                            <Button
                                flex={1}
                                variant="outline"
                                borderColor="#8B2BE2"
                                color="#8B2BE2"
                                onClick={handleTestKey}
                                isLoading={isTestingKey}
                                loadingText="Testing..."
                                isDisabled={isConnecting || !apiKey.trim() || !apiSecret.trim()}
                                _hover={{ bg: 'rgba(138, 43, 226, 0.1)' }}
                            >
                                Test Connection
                            </Button>
                            <Button
                                flex={1}
                                bg="#8B2BE2"
                                color="white"
                                onClick={handleConnect}
                                isLoading={isConnecting}
                                loadingText="Connecting..."
                                isDisabled={isTestingKey || !apiKey.trim() || !apiSecret.trim()}
                                _hover={{ bg: '#7B25C9' }}
                                fontWeight="semibold"
                            >
                                Connect Account
                            </Button>
                        </HStack>

                        <Box
                            p={3}
                            bg="rgba(255, 255, 255, 0.03)"
                            borderRadius="md"
                            border="1px solid rgba(255, 255, 255, 0.05)"
                            w="full"
                        >
                            <HStack spacing={2} justify="center">
                                <Text fontSize="xs" color="whiteAlpha.600">
                                    Need an API key?
                                </Text>
                                <Link
                                    href="https://polymarket.com"
                                    isExternal
                                    color="#8B2BE2"
                                    fontSize="xs"
                                    display="flex"
                                    alignItems="center"
                                    _hover={{ textDecoration: 'underline' }}
                                >
                                    Create at Polymarket <Icon as={ExternalLink} ml={1} size="12px" />
                                </Link>
                            </HStack>
                        </Box>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default PolymarketApiKeyModal;
