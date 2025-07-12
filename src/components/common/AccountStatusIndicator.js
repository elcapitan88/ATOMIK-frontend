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
    
    // ADVANCED LOGIC - RESTORED FOR PROPER STATUS INDICATION
    // Maps WebSocket connection states to visual indicators
    const getConnectionState = () => {
        console.log('[AccountStatusIndicator] State evaluation:', { 
            tokenValid, 
            wsStatus, 
            account: account?.account_id 
        });
        
        if (!tokenValid) {
            console.log('[AccountStatusIndicator] → DISCONNECTED (no valid token)');
            return CONNECTION_STATE.DISCONNECTED;
        }
        
        // Map WebSocket status to connection states with enhanced logging
        // Note: wsStatus comes from WebSocketManager's ConnectionState enum
        switch (wsStatus) {
            case 'disconnected':
            case 'error':
                console.log('[AccountStatusIndicator] → DISCONNECTED (WebSocket disconnected/error)');
                return CONNECTION_STATE.DISCONNECTED;
                
            case 'connecting':
            case 'reconnecting':
                console.log('[AccountStatusIndicator] → WS_CONNECTING (WebSocket connecting)');
                return CONNECTION_STATE.WS_CONNECTING;
                
            case 'validating_user':
                console.log('[AccountStatusIndicator] → VALIDATING_USER (checking credentials)');
                return CONNECTION_STATE.VALIDATING_USER;
                
            case 'checking_subscription':
                console.log('[AccountStatusIndicator] → CHECKING_SUBSCRIPTION (validating subscription)');
                return CONNECTION_STATE.CHECKING_SUBSCRIPTION;
                
            case 'checking_broker_access':
                console.log('[AccountStatusIndicator] → CHECKING_BROKER_ACCESS (validating broker access)');
                return CONNECTION_STATE.CHECKING_BROKER_ACCESS;
                
            case 'connecting_to_broker':
                console.log('[AccountStatusIndicator] → CONNECTING_TO_BROKER (connecting to broker)');
                return CONNECTION_STATE.CONNECTING_TO_BROKER;
                
            case 'connected':
            case 'ready':
                console.log('[AccountStatusIndicator] → FULLY_CONNECTED (ready for trading)');
                return CONNECTION_STATE.FULLY_CONNECTED;
                
            default:
                // Default to token valid if status is unknown or not provided
                console.log(`[AccountStatusIndicator] → TOKEN_VALID (default - token valid but unknown WebSocket status: ${wsStatus})`);
                return CONNECTION_STATE.TOKEN_VALID;
        }
    };

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
                animation={state.includes('CHECKING') || state.includes('CONNECTING') ? 'pulse 1.5s infinite' : 'none'}
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