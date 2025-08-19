import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Button,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { Clock, Zap, ExternalLink } from 'lucide-react';

const TrialStatusCard = ({ subscription }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!subscription?.trial_ends_at) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const trialEnd = new Date(subscription.trial_ends_at);
      const diff = trialEnd - now;

      if (diff <= 0) {
        setTimeLeft({ expired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes, expired: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [subscription?.trial_ends_at]);

  if (!subscription?.is_in_trial || !timeLeft) {
    return null;
  }

  const trialDuration = 14; // 14 days trial
  const totalHours = trialDuration * 24;
  const remainingHours = timeLeft.days * 24 + timeLeft.hours;
  const progressValue = ((totalHours - remainingHours) / totalHours) * 100;

  const getUrgencyLevel = () => {
    if (timeLeft.days <= 1) return 'high';
    if (timeLeft.days <= 3) return 'medium';
    return 'low';
  };

  const getUrgencyColor = () => {
    const level = getUrgencyLevel();
    switch (level) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      default: return 'cyan';
    }
  };

  const formatTimeLeft = () => {
    if (timeLeft.expired) return 'Trial expired';
    if (timeLeft.days > 0) return `${timeLeft.days} day${timeLeft.days !== 1 ? 's' : ''} left`;
    if (timeLeft.hours > 0) return `${timeLeft.hours} hour${timeLeft.hours !== 1 ? 's' : ''} left`;
    return `${timeLeft.minutes} minute${timeLeft.minutes !== 1 ? 's' : ''} left`;
  };

  const getTrialMessage = () => {
    const level = getUrgencyLevel();
    switch (level) {
      case 'high':
        return "Your trial is ending soon! Add a payment method to continue using AtomikTrading.";
      case 'medium':
        return "Your trial is ending in a few days. Consider adding a payment method.";
      default:
        return "You're currently on a free trial. Enjoy exploring all features!";
    }
  };

  if (timeLeft.expired) {
    return (
      <Alert status="error" bg="rgba(229, 62, 62, 0.1)" border="1px solid rgba(229, 62, 62, 0.3)">
        <AlertIcon color="red.400" />
        <Box>
          <Text color="red.400" fontWeight="medium">Trial Expired</Text>
          <Text color="whiteAlpha.700" fontSize="sm">
            Please add a payment method to continue using AtomikTrading.
          </Text>
        </Box>
      </Alert>
    );
  }

  return (
    <Box
      bg={getUrgencyLevel() === 'high' ? "rgba(229, 62, 62, 0.05)" : "rgba(0, 198, 224, 0.05)"}
      p={6}
      borderRadius="lg"
      border={`1px solid ${getUrgencyLevel() === 'high' ? "rgba(229, 62, 62, 0.2)" : "rgba(0, 198, 224, 0.2)"}`}
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={2}>
            <Clock size={20} color={getUrgencyLevel() === 'high' ? '#E53E3E' : '#00C6E0'} />
            <Text 
              color={getUrgencyLevel() === 'high' ? 'red.400' : '#00C6E0'} 
              fontSize="sm" 
              fontWeight="semibold"
            >
              FREE TRIAL
            </Text>
          </HStack>
          <Text color="white" fontSize="sm" fontWeight="medium">
            {formatTimeLeft()}
          </Text>
        </HStack>

        {/* Progress Bar */}
        <Box>
          <Progress
            value={progressValue}
            colorScheme={getUrgencyColor()}
            bg="whiteAlpha.200"
            borderRadius="md"
            size="md"
          />
          <HStack justify="space-between" mt={2}>
            <Text color="whiteAlpha.600" fontSize="xs">
              Trial started
            </Text>
            <Text color="whiteAlpha.600" fontSize="xs">
              {Math.round(progressValue)}% complete
            </Text>
          </HStack>
        </Box>

        {/* Message */}
        <Text 
          color={getUrgencyLevel() === 'high' ? 'red.300' : 'whiteAlpha.700'} 
          fontSize="sm"
        >
          {getTrialMessage()}
        </Text>

        {/* Action Button */}
        {getUrgencyLevel() !== 'low' && (
          <Button
            bg={getUrgencyLevel() === 'high' ? "#E53E3E" : "#00C6E0"}
            color="white"
            size="sm"
            _hover={{ 
              bg: getUrgencyLevel() === 'high' ? "#C53030" : "#00A3B8" 
            }}
            rightIcon={<ExternalLink size={14} />}
            onClick={() => {
              // Navigate to billing or upgrade page
              window.open('/pricing', '_blank');
            }}
          >
            {getUrgencyLevel() === 'high' ? 'Add Payment Method' : 'Upgrade Now'}
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default TrialStatusCard;