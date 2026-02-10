import React, { useState, useCallback } from 'react';
import {
  Box, Flex, Text, Badge, IconButton, HStack, Popover,
  PopoverTrigger, PopoverContent, PopoverBody, VStack, Button
} from '@chakra-ui/react';
import { motion, useAnimation } from 'framer-motion';
import { FiPlus, FiSend, FiX } from 'react-icons/fi';

const MotionBox = motion(Box);

const SNAP_COLLAPSED = 60;
const SNAP_HALF = typeof window !== 'undefined' ? window.innerHeight * 0.4 : 400;
const SNAP_FULL = typeof window !== 'undefined' ? window.innerHeight * 0.85 : 800;

const COMPONENT_TYPES = [
  { type: 'entry', label: 'Entry Condition', color: '#00C6E0' },
  { type: 'exit', label: 'Exit Condition', color: '#FF6B6B' },
  { type: 'stopLoss', label: 'Stop Loss', color: '#FFD93D' },
  { type: 'takeProfit', label: 'Take Profit', color: '#6BCB77' },
  { type: 'riskManagement', label: 'Risk Management', color: '#B983FF' },
  { type: 'custom', label: 'Custom Rule', color: '#808080' },
];

const BlockCard = ({ component, onEdit, onDelete }) => {
  const typeConfig = COMPONENT_TYPES.find(t => t.type === component.type) || COMPONENT_TYPES[5];

  return (
    <Box
      bg="rgba(255,255,255,0.05)"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      p={3}
      minW="180px"
      maxW="220px"
      flexShrink={0}
      cursor="pointer"
      onClick={() => onEdit?.(component.id)}
      _hover={{ bg: 'rgba(255,255,255,0.08)', borderColor: typeConfig.color }}
      transition="all 0.2s"
      position="relative"
    >
      <IconButton
        icon={<FiX />}
        size="xs"
        variant="ghost"
        position="absolute"
        top={1}
        right={1}
        onClick={(e) => { e.stopPropagation(); onDelete?.(component.id); }}
        opacity={0.5}
        _hover={{ opacity: 1 }}
        aria-label="Remove block"
      />
      <Badge bg={typeConfig.color} color="white" fontSize="10px" mb={2}>
        {typeConfig.label}
      </Badge>
      <Text fontSize="xs" color="whiteAlpha.700" noOfLines={3}>
        {component.title || component.configuration || 'Click to configure...'}
      </Text>
    </Box>
  );
};

const BottomSheet = ({ components = [], onAddBlock, onSubmitToChat, onEditBlock, onDeleteBlock }) => {
  const [sheetHeight, setSheetHeight] = useState(SNAP_COLLAPSED);
  const controls = useAnimation();
  const isExpanded = sheetHeight > SNAP_COLLAPSED;

  const snapTo = useCallback((height) => {
    setSheetHeight(height);
    controls.start({ height, transition: { type: 'spring', stiffness: 300, damping: 30 } });
  }, [controls]);

  const handleDragEnd = useCallback((_, info) => {
    const velocity = info.velocity.y;
    const currentH = sheetHeight - info.offset.y;

    // Snap to nearest point, considering velocity
    if (velocity > 500) {
      snapTo(SNAP_COLLAPSED);
    } else if (velocity < -500) {
      snapTo(currentH > SNAP_HALF ? SNAP_FULL : SNAP_HALF);
    } else {
      // Snap to nearest
      const points = [SNAP_COLLAPSED, SNAP_HALF, SNAP_FULL];
      const nearest = points.reduce((prev, curr) =>
        Math.abs(curr - currentH) < Math.abs(prev - currentH) ? curr : prev
      );
      snapTo(nearest);
    }
  }, [sheetHeight, snapTo]);

  return (
    <MotionBox
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      ml={{ base: 0, md: 16 }}
      zIndex={100}
      bg="rgba(10, 10, 15, 0.95)"
      backdropFilter="blur(20px)"
      borderTop="1px solid rgba(255,255,255,0.1)"
      borderTopRadius="xl"
      animate={controls}
      initial={{ height: SNAP_COLLAPSED }}
      style={{ height: sheetHeight }}
      overflow="hidden"
    >
      {/* Drag Handle */}
      <Box
        h="48px"
        cursor="grab"
        _active={{ cursor: 'grabbing' }}
        onClick={() => snapTo(isExpanded ? SNAP_COLLAPSED : SNAP_HALF)}
      >
        <Flex direction="column" align="center" pt={2}>
          <Box w="40px" h="4px" bg="whiteAlpha.400" borderRadius="full" mb={2} />
          <Flex w="full" px={4} align="center">
            <Text fontSize="sm" fontWeight="600" color="whiteAlpha.800">
              Strategy Blocks
            </Text>
            {components.length > 0 && (
              <Badge ml={2} colorScheme="cyan" variant="subtle" fontSize="xs">
                {components.length}
              </Badge>
            )}
            <Box flex="1" />
            <Popover placement="top-end">
              <PopoverTrigger>
                <IconButton
                  icon={<FiPlus />}
                  size="xs"
                  variant="ghost"
                  colorScheme="cyan"
                  aria-label="Add block"
                  onClick={(e) => e.stopPropagation()}
                />
              </PopoverTrigger>
              <PopoverContent bg="gray.800" border="1px solid" borderColor="whiteAlpha.200" w="200px">
                <PopoverBody p={2}>
                  <VStack spacing={1}>
                    {COMPONENT_TYPES.map(ct => (
                      <Button
                        key={ct.type}
                        size="sm"
                        variant="ghost"
                        w="full"
                        justifyContent="flex-start"
                        fontSize="xs"
                        onClick={() => { onAddBlock?.(ct.type); snapTo(SNAP_HALF); }}
                        leftIcon={<Box w={2} h={2} borderRadius="full" bg={ct.color} />}
                      >
                        {ct.label}
                      </Button>
                    ))}
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </Flex>
        </Flex>
      </Box>

      {/* Content */}
      <Box px={4} pb={4} overflowY="auto" h={`calc(100% - 48px)`}>
        {components.length === 0 ? (
          <Flex h="100px" align="center" justify="center">
            <Text fontSize="sm" color="whiteAlpha.400">
              Add blocks to define your strategy visually
            </Text>
          </Flex>
        ) : (
          <>
            <HStack spacing={3} overflowX="auto" py={3} css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
              {components.map(comp => (
                <BlockCard
                  key={comp.id}
                  component={comp}
                  onEdit={onEditBlock}
                  onDelete={onDeleteBlock}
                />
              ))}
            </HStack>
            <Button
              leftIcon={<FiSend />}
              size="sm"
              colorScheme="cyan"
              variant="outline"
              mt={2}
              onClick={() => onSubmitToChat?.(components)}
            >
              Submit to ARIA
            </Button>
          </>
        )}
      </Box>
    </MotionBox>
  );
};

export default BottomSheet;
