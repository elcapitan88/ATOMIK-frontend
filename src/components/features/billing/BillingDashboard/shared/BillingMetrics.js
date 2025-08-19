import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Progress,
  Tooltip
} from '@chakra-ui/react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const BillingMetrics = ({ 
  title, 
  current, 
  limit, 
  unit = "",
  showProgress = true,
  warningThreshold = 0.8 
}) => {
  const percentage = limit === -1 ? 0 : (current / limit) * 100;
  const isUnlimited = limit === -1 || limit === 999999;
  const isAtWarning = percentage >= (warningThreshold * 100);
  const isAtLimit = current >= limit && !isUnlimited;

  const getProgressColor = () => {
    if (isAtLimit) return "red";
    if (isAtWarning) return "yellow";
    return "cyan";
  };

  const getStatusIcon = () => {
    if (isAtLimit) return <AlertTriangle size={16} color="#E53E3E" />;
    if (isAtWarning) return <AlertTriangle size={16} color="#D69E2E" />;
    return <CheckCircle size={16} color="#00C6E0" />;
  };

  return (
    <Box
      bg="#1a1a1a"
      p={4}
      borderRadius="lg"
      border="1px solid #333"
      position="relative"
    >
      <VStack spacing={3} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Text color="white" fontSize="sm" fontWeight="medium">
            {title}
          </Text>
          <Tooltip 
            label={
              isAtLimit 
                ? "At limit" 
                : isAtWarning 
                ? "Approaching limit" 
                : "Available"
            }
          >
            {getStatusIcon()}
          </Tooltip>
        </HStack>

        {/* Count Display */}
        <HStack justify="space-between" align="baseline">
          <Text color="white" fontSize="2xl" fontWeight="bold">
            {current}
            {unit && <Text as="span" fontSize="sm" color="whiteAlpha.600" ml={1}>{unit}</Text>}
          </Text>
          <Text color="whiteAlpha.600" fontSize="sm">
            {isUnlimited ? "Unlimited" : `of ${limit}`}
          </Text>
        </HStack>

        {/* Progress Bar */}
        {showProgress && !isUnlimited && (
          <Box>
            <Progress
              value={Math.min(percentage, 100)}
              colorScheme={getProgressColor()}
              bg="whiteAlpha.200"
              borderRadius="md"
              size="sm"
            />
            <Text 
              color="whiteAlpha.600" 
              fontSize="xs" 
              mt={1}
              textAlign="right"
            >
              {percentage.toFixed(0)}% used
            </Text>
          </Box>
        )}

        {/* Warning Messages */}
        {isAtLimit && (
          <Text color="red.400" fontSize="xs">
            You've reached your limit. Upgrade to add more.
          </Text>
        )}
        {isAtWarning && !isAtLimit && (
          <Text color="yellow.400" fontSize="xs">
            Approaching limit. Consider upgrading soon.
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default BillingMetrics;