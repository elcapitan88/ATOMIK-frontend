// src/components/features/trading/OrderControl/OrderFeedback.js
import React from 'react';
import {
  Box,
  HStack,
  Text,
  Collapse,
  keyframes,
  Spinner,
} from '@chakra-ui/react';
import { 
  CheckCircle2, 
  XCircle,
  AlertCircle,
} from 'lucide-react';

const slideIn = keyframes`
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const OrderFeedback = ({ status }) => {
  const getFeedbackContent = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Spinner size="sm" color="blue.400" />,
          text: 'Processing Order...',
          bg: 'rgba(66, 153, 225, 0.2)',
          border: 'rgba(66, 153, 225, 0.4)'
        };
      case 'success':
        return {
          icon: <CheckCircle2 size={16} color="#48BB78" />,
          text: 'Order Executed Successfully',
          bg: 'rgba(72, 187, 120, 0.2)',
          border: 'rgba(72, 187, 120, 0.4)'
        };
      case 'error':
        return {
          icon: <XCircle size={16} color="#F56565" />,
          text: 'Order Failed',
          bg: 'rgba(245, 101, 101, 0.2)',
          border: 'rgba(245, 101, 101, 0.4)'
        };
      case 'warning':
        return {
          icon: <AlertCircle size={16} color="#ECC94B" />,
          text: 'Order Warning',
          bg: 'rgba(236, 201, 75, 0.2)',
          border: 'rgba(236, 201, 75, 0.4)'
        };
      default:
        return null;
    }
  };

  const feedback = getFeedbackContent();

  if (!feedback) return null;

  return (
    <Collapse in={!!status} animateOpacity>
      <Box
        bg={feedback.bg}
        borderRadius="md"
        borderWidth="1px"
        borderColor={feedback.border}
        borderLeft="4px"
        p={2}
        animation={`${slideIn} 0.2s ease-out`}
        position="relative"
        overflow="hidden"
      >
        <HStack spacing={2}>
          {feedback.icon}
          <Text color="white" fontSize="sm">
            {feedback.text}
          </Text>
        </HStack>

        {/* Animated progress bar for pending state */}
        {status === 'pending' && (
          <Box
            position="absolute"
            bottom={0}
            left={0}
            height="2px"
            bg="blue.400"
            width="100%"
            sx={{
              '@keyframes progress': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' }
              },
              animation: 'progress 1.5s infinite',
            }}
          />
        )}
      </Box>
    </Collapse>
  );
};

export default OrderFeedback;