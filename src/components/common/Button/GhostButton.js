// GhostButton.js
import React from 'react';
import { Box } from '@chakra-ui/react';

const GhostButton = ({ 
  children, 
  color = "rgba(0, 198, 224, 1)", 
  onClick,
  isDisabled,
  width = "auto",
  ...props 
}) => {
  return (
    <Box
      as="button"
      px={4}
      py={2}
      width={width}
      bg="transparent"
      color="white"
      fontWeight="medium"
      borderWidth={1}
      borderColor={color}
      borderRadius="md"
      position="relative"
      overflow="hidden"
      opacity={isDisabled ? 0.5 : 1}
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      onClick={isDisabled ? undefined : onClick}
      transition="all 0.2s"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: `linear-gradient(90deg, transparent, ${color} 20%, ${color} 80%, transparent)`,
        opacity: 0.3,
      }}
      _hover={{
        _before: {
          opacity: isDisabled ? 0.3 : 0.5,
        }
      }}
      _active={{
        _before: {
          opacity: 0.7,
        }
      }}
      {...props}
    >
      <Box as="span" position="relative" zIndex={1}>
        {children}
      </Box>
    </Box>
  );
};

export default GhostButton;