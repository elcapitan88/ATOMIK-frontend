// components/common/AccountStatusIndicator.js
import React from 'react';
import { Box, Tooltip } from '@chakra-ui/react';
import { 
    CONNECTION_STATE, 
    CONNECTION_STATE_MESSAGES, 
    CONNECTION_STATE_COLORS 
} from '@/utils/constants/brokers';

const AccountStatusIndicator = ({ tokenValid, wsStatus }) => {
    // Simplified function that only checks if token is valid
    // WebSocket status checks temporarily disabled as requested
    const getConnectionState = () => {
        console.log('AccountStatusIndicator state:', { tokenValid, wsStatus });
        if (!tokenValid) return CONNECTION_STATE.DISCONNECTED;
        // WebSocket connection checks are temporarily disabled
        return CONNECTION_STATE.TOKEN_VALID;
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
            />
        </Tooltip>
    );
};

export default AccountStatusIndicator;