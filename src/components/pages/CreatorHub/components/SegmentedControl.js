import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const SegmentedControl = ({ options, value, onChange, size = 'md' }) => {
  const selectedIndex = options.findIndex(opt => opt.value === value);

  const sizes = {
    sm: { px: 3, py: 1.5, fontSize: '12px' },
    md: { px: 4, py: 2, fontSize: '13px' }
  };

  const s = sizes[size] || sizes.md;

  return (
    <Flex
      bg="rgba(255,255,255,0.04)"
      borderRadius="10px"
      p="3px"
      position="relative"
      gap="2px"
    >
      {/* Sliding indicator */}
      {selectedIndex >= 0 && (
        <motion.div
          layoutId="segment-indicator"
          style={{
            position: 'absolute',
            top: '3px',
            bottom: '3px',
            borderRadius: '8px',
            background: 'rgba(0, 198, 224, 0.15)',
            border: '1px solid rgba(0, 198, 224, 0.3)',
            zIndex: 0,
            left: `calc(${(selectedIndex / options.length) * 100}% + 3px)`,
            width: `calc(${100 / options.length}% - 4px)`
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      {options.map((option) => (
        <Box
          key={option.value}
          as="button"
          flex="1"
          px={s.px}
          py={s.py}
          borderRadius="8px"
          bg="transparent"
          border="none"
          color={value === option.value ? '#00C6E0' : 'whiteAlpha.600'}
          fontSize={s.fontSize}
          fontWeight="600"
          cursor="pointer"
          position="relative"
          zIndex={1}
          transition="color 0.2s"
          onClick={() => onChange(option.value)}
          _hover={{
            color: value === option.value ? '#00C6E0' : 'whiteAlpha.800'
          }}
          whiteSpace="nowrap"
        >
          <Text>{option.label}{option.count !== undefined ? ` (${option.count})` : ''}</Text>
        </Box>
      ))}
    </Flex>
  );
};

export default SegmentedControl;
