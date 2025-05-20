import React from 'react';
import { Box, Tooltip } from '@chakra-ui/react';
import { ConnectionState } from '@/services/websocket-proxy/WebSocketManager';

/**
 * Component to display WebSocket connection status
 * @param {object} props - Component properties
 * @param {boolean} props.tokenValid - Whether the API token is valid
 * @param {string} props.wsStatus - Current WebSocket status (connected, connecting, disconnected, error)
 * @param {string} props.wsConnectionState - Raw connection state from WebSocketManager
 */
const AccountStatusIndicator = ({ tokenValid = true, wsStatus = 'disconnected', wsConnectionState }) => {
    // Determine color and status
    let color, status, tooltipText;

    // Check token validity first
    if (!tokenValid) {
        color = "red.500";
        status = "error";
        tooltipText = "Token expired or invalid";
    } else {
        // Based on WebSocket status
        switch (wsStatus) {
            case 'connected':
                color = "green.400";
                status = "connected";
                tooltipText = "Connected to trading account";
                break;
            case 'connecting':
                color = "yellow.400";
                status = "connecting";
                tooltipText = "Connecting to trading account...";
                break;
            case 'reconnecting':
                color = "orange.400";
                status = "reconnecting";
                tooltipText = "Reconnecting to trading account...";
                break;
            case 'error':
                color = "red.500";
                status = "error";
                tooltipText = "Connection error";
                break;
            case 'disconnected':
            default:
                color = "gray.400";
                status = "disconnected";
                tooltipText = "Not connected to trading account";
                break;
        }
    }

    return (
        <Tooltip label={tooltipText} placement="top" hasArrow bg="gray.700">
            <Box
                w="10px"
                h="10px"
                borderRadius="full"
                bg={color}
                boxShadow={`0 0 4px ${color}`}
                transition="all 0.2s"
                title={status}
            />
        </Tooltip>
    );
};

export default AccountStatusIndicator;