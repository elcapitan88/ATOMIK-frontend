import React, { useState } from 'react';
import {
  HStack,
  Icon,
  Box,
  useToast,
  Tooltip,
  Text,
} from '@chakra-ui/react';
import { Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';

const MotionHStack = motion(HStack);
const MotionBox = motion(Box);

const StarRating = ({ 
  rating, 
  token, 
  onRatingChange,
  size = 16,
  isInteractive = true 
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const toast = useToast();

  const handleRating = async (newRating) => {
    if (!isInteractive || isLoading) return;

    try {
      setIsLoading(true);
      await webhookApi.rateStrategy(token, newRating);
      
      if (onRatingChange) {
        onRatingChange(newRating);
      }

      toast({
        title: "Rating Updated",
        description: "Thank you for your feedback!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      // Close the expanded state after rating
      setIsExpanded(false);
    } catch (error) {
      toast({
        title: "Rating Failed",
        description: error.message || "Failed to update rating",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandClick = () => {
    if (isInteractive && !isLoading) {
      setIsExpanded(!isExpanded);
    }
  };

  // Collapsed state
  if (!isExpanded) {
    return (
      <Box
        cursor={isInteractive ? 'pointer' : 'default'}
        onClick={handleExpandClick}
        display="flex"
        alignItems="center"
      >
        <Icon
          as={Star}
          color={rating > 0 ? "#FFD700" : "whiteAlpha.300"}
          fill={rating > 0 ? "#FFD700" : "none"}
          size={size}
          style={{
            filter: rating > 0 
              ? 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.4))'
              : 'none'
          }}
        />
        {rating > 0 && (
          <Text 
            ml={2} 
            fontSize="sm" 
            color="whiteAlpha.900"
          >
            {rating.toFixed(1)}
          </Text>
        )}
      </Box>
    );
  }

  // Expanded state
  return (
    <AnimatePresence>
      <MotionHStack
        spacing={1}
        initial={{ width: "20px", opacity: 0 }}
        animate={{ width: "auto", opacity: 1 }}
        exit={{ width: "20px", opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <MotionBox
            key={star}
            position="relative"
            cursor={isInteractive ? 'pointer' : 'default'}
            opacity={isLoading ? 0.5 : 1}
            transition="all 0.2s"
            initial={{ x: -20, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              scale: hoverRating >= star ? 1.2 : 1
            }}
            exit={{ x: -20, opacity: 0 }}
            onMouseEnter={() => isInteractive && setHoverRating(star)}
            onMouseLeave={() => isInteractive && setHoverRating(0)}
            onClick={() => handleRating(star)}
          >
            <Tooltip
              label={isInteractive ? `Rate ${star} stars` : `${star} stars`}
              placement="top"
              hasArrow
              isDisabled={!isInteractive || isLoading}
            >
              <Box>
                <Icon
                  as={Star}
                  color={star <= (hoverRating || rating) ? "#FFD700" : "whiteAlpha.300"}
                  fill={star <= (hoverRating || rating) ? "#FFD700" : "none"}
                  size={size}
                  style={{
                    filter: star <= (hoverRating || rating) 
                      ? 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.4))'
                      : 'none'
                  }}
                />
              </Box>
            </Tooltip>
          </MotionBox>
        ))}
      </MotionHStack>
    </AnimatePresence>
  );
};

export default StarRating;