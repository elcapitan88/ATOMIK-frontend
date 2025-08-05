// components/common/IBProvisioningStatus.js
import React, { useEffect, useState } from 'react';
import {
    Box,
    Flex,
    Text,
    Progress,
    VStack,
    HStack,
    Icon,
    Badge,
    Collapse,
    useDisclosure,
} from '@chakra-ui/react';
import { Server, Check, AlertCircle, Clock } from 'lucide-react';

const IBProvisioningStatus = ({ account, isOpen }) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const doStatus = account?.digital_ocean_status || 'unknown';
    const ibeamAuthenticated = account?.ibeam_authenticated;
    
    // Calculate progress based on status
    const getProgress = () => {
        switch (doStatus) {
            case 'provisioning':
                return 25;
            case 'initializing':
                return 50;
            case 'starting':
                return 75;
            case 'running':
                return ibeamAuthenticated ? 100 : 90;
            default:
                return 0;
        }
    };

    // Get status message
    const getStatusMessage = () => {
        switch (doStatus) {
            case 'provisioning':
                return 'Creating your dedicated Interactive Brokers server...';
            case 'initializing':
                return 'Installing IBeam authentication gateway...';
            case 'starting':
                return 'Starting IBeam services...';
            case 'running':
                if (!ibeamAuthenticated) {
                    return 'Authenticating with Interactive Brokers...';
                }
                return 'Successfully connected to Interactive Brokers!';
            case 'error':
                return 'Error provisioning server. Please try again.';
            default:
                return 'Preparing Interactive Brokers connection...';
        }
    };

    // Get status icon
    const getStatusIcon = () => {
        if (doStatus === 'running' && ibeamAuthenticated) {
            return Check;
        } else if (doStatus === 'error') {
            return AlertCircle;
        }
        return Server;
    };

    // Get status color
    const getStatusColor = () => {
        if (doStatus === 'running' && ibeamAuthenticated) {
            return 'green.400';
        } else if (doStatus === 'error') {
            return 'red.400';
        }
        return 'blue.400';
    };

    // Track elapsed time
    useEffect(() => {
        if (!isOpen || (doStatus === 'running' && ibeamAuthenticated) || doStatus === 'error') {
            return;
        }

        const interval = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, doStatus, ibeamAuthenticated]);

    // Format elapsed time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = getProgress();
    const isComplete = doStatus === 'running' && ibeamAuthenticated;
    const hasError = doStatus === 'error';

    return (
        <Collapse in={isOpen} animateOpacity>
            <Box
                bg="whiteAlpha.100"
                borderRadius="lg"
                p={4}
                mb={3}
                borderWidth="1px"
                borderColor={hasError ? 'red.400' : isComplete ? 'green.400' : 'blue.400'}
            >
                <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                        <HStack spacing={3}>
                            <Icon
                                as={getStatusIcon()}
                                boxSize={5}
                                color={getStatusColor()}
                                animation={!isComplete && !hasError ? 'pulse 1.5s infinite' : 'none'}
                            />
                            <Text fontSize="sm" fontWeight="medium">
                                {getStatusMessage()}
                            </Text>
                        </HStack>
                        
                        {!isComplete && !hasError && (
                            <HStack spacing={2}>
                                <Icon as={Clock} boxSize={4} color="whiteAlpha.600" />
                                <Text fontSize="sm" color="whiteAlpha.600">
                                    {formatTime(elapsedTime)}
                                </Text>
                            </HStack>
                        )}
                    </HStack>

                    {!isComplete && !hasError && (
                        <>
                            <Progress
                                value={progress}
                                size="sm"
                                colorScheme="blue"
                                hasStripe
                                isAnimated={progress < 100}
                                borderRadius="full"
                            />

                            <HStack spacing={4} fontSize="xs" color="whiteAlpha.600">
                                <Text>Status: <Badge colorScheme="blue" ml={1}>{doStatus}</Badge></Text>
                                <Text>Progress: {progress}%</Text>
                            </HStack>

                            {doStatus === 'provisioning' && (
                                <Box 
                                    bg="blue.900" 
                                    p={3} 
                                    borderRadius="md"
                                    fontSize="xs"
                                    color="blue.200"
                                >
                                    <Text>
                                        💡 <strong>Tip:</strong> Server provisioning typically takes 2-3 minutes. 
                                        Your dedicated IBeam server is being configured with your credentials.
                                    </Text>
                                </Box>
                            )}
                        </>
                    )}

                    {isComplete && (
                        <Box 
                            bg="green.900" 
                            p={3} 
                            borderRadius="md"
                            fontSize="xs"
                            color="green.200"
                        >
                            <Text>
                                ✅ <strong>Connected!</strong> Your Interactive Brokers account is ready for trading.
                            </Text>
                        </Box>
                    )}

                    {hasError && (
                        <Box 
                            bg="red.900" 
                            p={3} 
                            borderRadius="md"
                            fontSize="xs"
                            color="red.200"
                        >
                            <Text>
                                ❌ <strong>Connection Failed:</strong> Please check your credentials and try again.
                            </Text>
                        </Box>
                    )}
                </VStack>
            </Box>
        </Collapse>
    );
};

export default IBProvisioningStatus;