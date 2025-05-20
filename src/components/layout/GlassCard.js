// GlassCard.js
import React from 'react';
import { Box } from '@chakra-ui/react';

const GlassCard = ({ children, ...props }) => {
  return (
    <Box
      bg="rgba(255, 255, 255, 0.1)"
      backdropFilter="blur(10px)"
      boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
      border="1px solid rgba(255, 255, 255, 0.18)"
      borderRadius="xl"
      p={4}
      {...props}
    >
      {children}
    </Box>
  );
};

export default GlassCard;