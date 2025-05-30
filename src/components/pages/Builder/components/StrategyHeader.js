// src/components/pages/Builder/components/StrategyHeader.js
import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Input,
  Textarea,
  IconButton,
  useOutsideClick,
  VStack,
  HStack
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Edit, Check, X, FileText } from 'lucide-react';
import useStrategyBuilder from '@/hooks/useStrategyBuilder';

// Motion components
const MotionBox = motion(Box);

const StrategyHeader = ({ 
  isDraggable = true,
  onDrag,
  onDragEnd,
  zoomLevel = 1,
  gridSize = 25
}) => {
  const { strategyMetadata, updateStrategyMetadata } = useStrategyBuilder();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tempName, setTempName] = useState(strategyMetadata.name);
  const [tempDescription, setTempDescription] = useState(strategyMetadata.description);

  // Refs
  const nameInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  // Component dimensions - 9 grid dots width, elongated height
  const HEADER_WIDTH = 9 * gridSize; // 9 grid dots wide (225px at 25px grid)
  const HEADER_HEIGHT = 200; // Taller for better proportion

  // Handle drag start
  const handleDragStart = useCallback(() => {
    if (isEditingName || isEditingDescription) return;
    setIsDragging(true);
  }, [isEditingName, isEditingDescription]);

  // Handle drag end with grid snapping
  const handleDragEnd = useCallback((event, info) => {
    setIsDragging(false);
    
    if (onDragEnd) {
      // Calculate new position based on drag offset
      const newX = Math.max(0, Math.round(info.offset.x / gridSize) * gridSize);
      const newY = Math.max(0, Math.round(info.offset.y / gridSize) * gridSize);
      
      onDragEnd('strategy-header', { x: newX, y: newY });
    }
  }, [gridSize, onDragEnd]);

  // Name editing handlers
  const handleEditName = (e) => {
    e.stopPropagation();
    setTempName(strategyMetadata.name);
    setIsEditingName(true);
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
      }
    }, 50);
  };

  const handleSaveName = useCallback(() => {
    updateStrategyMetadata({ name: tempName.trim() });
    setIsEditingName(false);
  }, [tempName, updateStrategyMetadata]);

  const handleCancelNameEdit = useCallback(() => {
    setTempName(strategyMetadata.name);
    setIsEditingName(false);
  }, [strategyMetadata.name]);

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelNameEdit();
    }
  };

  // Description editing handlers
  const handleEditDescription = (e) => {
    e.stopPropagation();
    setTempDescription(strategyMetadata.description);
    setIsEditingDescription(true);
    setTimeout(() => {
      if (descriptionInputRef.current) {
        descriptionInputRef.current.focus();
      }
    }, 50);
  };

  const handleSaveDescription = useCallback(() => {
    updateStrategyMetadata({ description: tempDescription.trim() });
    setIsEditingDescription(false);
  }, [tempDescription, updateStrategyMetadata]);

  const handleCancelDescriptionEdit = useCallback(() => {
    setTempDescription(strategyMetadata.description);
    setIsEditingDescription(false);
  }, [strategyMetadata.description]);

  const handleDescriptionKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancelDescriptionEdit();
    }
    // Allow Ctrl+Enter or Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSaveDescription();
    }
  };

  // Outside click handlers
  useOutsideClick({
    ref: nameInputRef,
    handler: () => {
      if (isEditingName) {
        handleSaveName();
      }
    },
  });

  useOutsideClick({
    ref: descriptionInputRef,
    handler: () => {
      if (isEditingDescription) {
        handleSaveDescription();
      }
    },
  });

  return (
    <MotionBox
      drag={isDraggable && !isEditingName && !isEditingDescription}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: 16, // Aligned with left edge of grid controls (left={4} = 16px)
        y: 176 // Grid controls end (~126px) + 2 dots spacing (50px) = 176px
      }}
      bg="linear-gradient(135deg, rgba(0, 198, 224, 0.1), rgba(0, 198, 224, 0.05))"
      border="2px solid"
      borderColor={isDragging ? "#00C6E0" : "rgba(0, 198, 224, 0.3)"}
      borderRadius="xl"
      boxShadow={isDragging 
        ? `0 12px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 198, 224, 0.4)` 
        : `0 6px 25px rgba(0, 0, 0, 0.15), 0 0 10px rgba(0, 198, 224, 0.2)`}
      backdropFilter="blur(10px)"
      overflow="hidden"
      position="absolute"
      cursor={isDragging ? "grabbing" : "grab"}
      width={`${HEADER_WIDTH}px`}
      height={`${HEADER_HEIGHT}px`}
      zIndex={isDragging ? 100 : 2}
      transition="all 0.2s"
      data-strategy-header
      _hover={{
        bg: "linear-gradient(135deg, rgba(0, 198, 224, 0.15), rgba(0, 198, 224, 0.08))",
        boxShadow: `0 8px 30px rgba(0, 0, 0, 0.2), 0 0 15px rgba(0, 198, 224, 0.3)`,
        borderColor: "#00C6E0"
      }}
    >
      {/* Header Icon and Drag Handle */}
      <Flex
        position="absolute"
        top="8px"
        left="12px"
        align="center"
        gap={2}
        opacity={0.7}
        _hover={{ opacity: 1 }}
      >
        <FileText size={16} color="#00C6E0" />
        <Box w="20px" h="3px" bg="rgba(0, 198, 224, 0.4)" borderRadius="full" />
      </Flex>

      {/* Content */}
      <VStack p={4} pt={8} h="full" align="stretch" spacing={4}>
        {/* Strategy Name */}
        <Box>
          <Text fontSize="xs" color="whiteAlpha.600" mb={2} fontWeight="medium">
            STRATEGY NAME
          </Text>
          {isEditingName ? (
            <HStack>
              <Input
                ref={nameInputRef}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                placeholder="Enter strategy name..."
                size="sm"
                bg="rgba(0, 0, 0, 0.4)"
                border="1px solid rgba(0, 198, 224, 0.5)"
                borderRadius="lg"
                color="white"
                fontSize="lg"
                fontWeight="bold"
                _focus={{
                  borderColor: "#00C6E0",
                  boxShadow: "0 0 0 1px #00C6E0"
                }}
                _placeholder={{ color: "whiteAlpha.500" }}
                onClick={(e) => e.stopPropagation()}
              />
              <IconButton
                icon={<Check size={14} />}
                size="sm"
                variant="ghost"
                colorScheme="green"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveName();
                }}
                aria-label="Save name"
              />
              <IconButton
                icon={<X size={14} />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelNameEdit();
                }}
                aria-label="Cancel edit"
              />
            </HStack>
          ) : (
            <Flex align="center" cursor="text" onClick={handleEditName}>
              <Text
                fontSize="lg"
                fontWeight="bold"
                color="white"
                flex="1"
                noOfLines={1}
              >
                {strategyMetadata.name || "Untitled Strategy"}
              </Text>
              <IconButton
                icon={<Edit size={12} />}
                size="xs"
                variant="ghost"
                colorScheme="whiteAlpha"
                onClick={handleEditName}
                ml={2}
                aria-label="Edit name"
              />
            </Flex>
          )}
        </Box>

        {/* Strategy Description */}
        <Box flex="1">
          <Text fontSize="xs" color="whiteAlpha.600" mb={2} fontWeight="medium">
            DESCRIPTION
          </Text>
          {isEditingDescription ? (
            <VStack h="calc(100% - 20px)" spacing={2}>
              <Textarea
                ref={descriptionInputRef}
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                onKeyDown={handleDescriptionKeyDown}
                placeholder="Describe your trading strategy..."
                bg="rgba(0, 0, 0, 0.4)"
                border="1px solid rgba(0, 198, 224, 0.5)"
                borderRadius="lg"
                color="white"
                fontSize="sm"
                resize="none"
                h="full"
                _focus={{
                  borderColor: "#00C6E0",
                  boxShadow: "0 0 0 1px #00C6E0"
                }}
                _placeholder={{ color: "whiteAlpha.500" }}
                onClick={(e) => e.stopPropagation()}
              />
              <HStack justify="flex-end" w="full">
                <IconButton
                  icon={<Check size={12} />}
                  size="xs"
                  variant="ghost"
                  colorScheme="green"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveDescription();
                  }}
                  aria-label="Save description"
                />
                <IconButton
                  icon={<X size={12} />}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelDescriptionEdit();
                  }}
                  aria-label="Cancel edit"
                />
              </HStack>
            </VStack>
          ) : (
            <Box
              h="calc(100% - 20px)"
              cursor="text"
              onClick={handleEditDescription}
              p={3}
              borderRadius="lg"
              transition="all 0.2s"
              _hover={{
                bg: "rgba(255, 255, 255, 0.05)"
              }}
            >
              {strategyMetadata.description ? (
                <Text
                  fontSize="sm"
                  color="whiteAlpha.900"
                  whiteSpace="pre-wrap"
                  lineHeight="1.4"
                  noOfLines={5}
                >
                  {strategyMetadata.description}
                </Text>
              ) : (
                <Text
                  fontSize="sm"
                  color="whiteAlpha.600"
                  fontStyle="italic"
                >
                  Click to add strategy description...
                </Text>
              )}
            </Box>
          )}
        </Box>
      </VStack>
    </MotionBox>
  );
};

export default StrategyHeader;