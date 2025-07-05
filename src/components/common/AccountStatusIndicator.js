// components/common/AccountStatusIndicator.js
import React from 'react';
import { Box, Tooltip } from '@chakra-ui/react';
import { 
    CONNECTION_STATE, 
    CONNECTION_STATE_MESSAGES, 
    CONNECTION_STATE_COLORS 
} from '@/utils/constants/brokers';

const AccountStatusIndicator = ({ tokenValid, wsStatus, account }) => {
    // Interactive Brokers uses completely different status logic
    if (account?.broker_id === 'interactivebrokers') {
        return <InteractiveBrokersStatusIndicator account={account} />;
    }
    
    // ORIGINAL SIMPLE LOGIC - CURRENTLY ACTIVE
    // Simplified function that only checks if token is valid
    // WebSocket status checks temporarily disabled as requested
    const getConnectionState = () => {
        console.log('AccountStatusIndicator state:', { tokenValid, wsStatus });
        if (!tokenValid) return CONNECTION_STATE.DISCONNECTED;
        // WebSocket connection checks are temporarily disabled
        return CONNECTION_STATE.TOKEN_VALID;
    };

    // TODO: ADVANCED LOGIC COMMENTED OUT - RESTORE WHEN READY
    // // Original logic for non-IB accounts (Tradovate, etc.)
    // const getConnectionState = () => {
    //     console.log('AccountStatusIndicator state:', { tokenValid, wsStatus });
    //     
    //     if (!tokenValid) return CONNECTION_STATE.DISCONNECTED;
    //     
    //     // Map WebSocket status to connection states
    //     if (wsStatus === 'disconnected') return CONNECTION_STATE.DISCONNECTED;
    //     if (wsStatus === 'connecting') return CONNECTION_STATE.WS_CONNECTING;
    //     if (wsStatus === 'validating_user') return CONNECTION_STATE.VALIDATING_USER;
    //     if (wsStatus === 'checking_subscription') return CONNECTION_STATE.CHECKING_SUBSCRIPTION;
    //     if (wsStatus === 'checking_broker_access') return CONNECTION_STATE.CHECKING_BROKER_ACCESS;
    //     if (wsStatus === 'connecting_to_broker') return CONNECTION_STATE.CONNECTING_TO_BROKER;
    //     if (wsStatus === 'connected' || wsStatus === 'ready') return CONNECTION_STATE.FULLY_CONNECTED;
    //     
    //     // Default to token valid if status is unknown
    //     return CONNECTION_STATE.TOKEN_VALID;
    // };

    const state = getConnectionState();
    const color = CONNECTION_STATE_COLORS[state];
    const message = CONNECTION_STATE_MESSAGES[state];
    
    console.log('Connection state:', { state, color, message }); 

    return (
        <Tooltip label={message}>
            <Box 
                w="10px" 
                h="10px" 
                borderRadius="full" 
                bg={color}
                boxShadow={`0 0 10px ${color}`}
                transition="all 0.3s ease"
                // TODO: RESTORE ANIMATION WHEN ADVANCED LOGIC IS ENABLED
                // animation={state.includes('CHECKING') || state.includes('CONNECTING') ? 'pulse 1.5s infinite' : 'none'}
            />
        </Tooltip>
    );
};

// Separate component for Interactive Brokers status
const InteractiveBrokersStatusIndicator = ({ account }) => {
    const doStatus = account.digital_ocean_status || account.status || 'unknown';
    
    console.log('IB Status:', { doStatus, account });
    
    // Map Digital Ocean/IBEam statuses to visual states
    const getStatusConfig = () => {
        switch (doStatus) {
            case 'provisioning':
                return {
                    color: 'blue.400',
                    message: 'Server is being provisioned...',
                    animate: true
                };
            case 'initializing':
                return {
                    color: 'blue.400',
                    message: 'IBeam service is starting...',
                    animate: true
                };
            case 'starting':
                return {
                    color: 'blue.400',
                    message: 'Server is starting...',
                    animate: true
                };
            case 'running':
                return {
                    color: 'green.400',
                    message: 'Server is running and IBeam is connected',
                    animate: false
                };
            case 'stopping':
                return {
                    color: 'orange.400',
                    message: 'Server is stopping...',
                    animate: true
                };
            case 'stopped':
            case 'off':
                return {
                    color: 'gray.400',
                    message: 'Server is powered off',
                    animate: false
                };
            case 'restarting':
                return {
                    color: 'blue.400',
                    message: 'Server is restarting...',
                    animate: true
                };
            case 'error':
                return {
                    color: 'red.400',
                    message: 'Server error - check Digital Ocean console',
                    animate: false
                };
            case 'deleted':
                return {
                    color: 'red.400',
                    message: 'Server has been deleted',
                    animate: false
                };
            default:
                return {
                    color: 'gray.400',
                    message: 'Server status unknown',
                    animate: false
                };
        }
    };
    
    const { color, message, animate } = getStatusConfig();
    
    return (
        <Tooltip label={message}>
            <Box 
                w="10px" 
                h="10px" 
                borderRadius="full" 
                bg={color}
                boxShadow={`0 0 10px ${color}`}
                transition="all 0.3s ease"
                animation={animate ? 'pulse 1.5s infinite' : 'none'}
            />
        </Tooltip>
    );
};

export default AccountStatusIndicator;