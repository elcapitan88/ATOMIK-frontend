// src/components/pages/Builder/components/StrategyCard.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Input,
  Textarea,
  useOutsideClick,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Badge
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Edit, Trash2, MoreVertical, Check, X } from 'lucide-react';
import useStrategyBuilder from '@/hooks/useStrategyBuilder';

// Define a motion Box component
const MotionBox = motion(Box);

const StrategyCard = ({ 
  component, 
  typeColor, 
  isDraggable = true,
  onDrag,
  onDragEnd,
  zoomLevel = 1,
  gridSize = 25,
  canvasRef
}) => {
  // ALL HOOKS MUST BE CALLED FIRST, BEFORE ANY CONDITIONAL LOGIC
  const { updateComponent, deleteComponent, selectComponent } = useStrategyBuilder();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(component?.title || '');
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [configText, setConfigText] = useState(component?.configuration || '');
  
  // Card dimensions
  const CARD_WIDTH = 280;
  const CARD_HEIGHT = 180;
  
  const inputRef = useRef(null);
  const configRef = useRef(null);

  // Function to snap position to grid
  const snapToGrid = useCallback((value) => {
    return Math.round(value / gridSize) * gridSize;
  }, [gridSize]);

  // Update title when component title changes
  useEffect(() => {
    if (component?.title) {
      setTitle(component.title);
    }
  }, [component?.title]);

  // Update config text when component configuration changes
  useEffect(() => {
    if (component?.configuration !== undefined) {
      setConfigText(component.configuration);
    }
  }, [component?.configuration]);

  // Save edited title
  const handleSaveTitle = useCallback(() => {
    if (component && title.trim() !== component.title) {
      updateComponent(component.id, { title: title.trim() });
    }
    setIsEditing(false);
  }, [component, title, updateComponent]);

  // Cancel title editing
  const handleCancelEdit = useCallback(() => {
    if (component) {
      setTitle(component.title);
    }
    setIsEditing(false);
  }, [component]);

  // Save edited configuration
  const handleSaveConfig = useCallback(() => {
    if (component && configText !== component.configuration) {
      updateComponent(component.id, { configuration: configText });
    }
    setIsEditingConfig(false);
  }, [component, configText, updateComponent]);

  // Cancel configuration editing
  const handleCancelConfigEdit = useCallback(() => {
    if (component) {
      setConfigText(component.configuration || '');
    }
    setIsEditingConfig(false);
  }, [component]);

  // Handle outside clicks when editing title
  useOutsideClick({
    ref: inputRef,
    handler: () => {
      if (isEditing) {
        handleSaveTitle();
      }
    },
  });

  // Handle outside clicks when editing config
  useOutsideClick({
    ref: configRef,
    handler: () => {
      if (isEditingConfig) {
        handleSaveConfig();
      }
    },
  });

  // Handle drag start
  const handleDragStart = useCallback(() => {
    if (isEditing || isEditingConfig) return;
    setIsDragging(true);
  }, [isEditing, isEditingConfig]);

  // Handle drag end with grid snapping
  const handleDragEnd = useCallback((event, info) => {
    if (!component) return;
    
    setIsDragging(false);
    
    // Get current position from the drag
    const currentX = component.position?.x || 0;
    const currentY = component.position?.y || 0;
    
    // Calculate new position based on drag offset
    const newX = currentX + info.offset.x;
    const newY = currentY + info.offset.y;
    
    // Snap to grid
    const snappedX = snapToGrid(newX);
    const snappedY = snapToGrid(newY);
    
    // Ensure position doesn't go negative
    const finalX = Math.max(0, snappedX);
    const finalY = Math.max(0, snappedY);
    
    // Update component position
    if (onDragEnd) {
      onDragEnd(component.id, { x: finalX, y: finalY });
    }
  }, [component, snapToGrid, onDragEnd]);

  // NOW we can do safety checks AFTER all hooks have been called
  if (!component || !component.id || !component.title) {
    console.error('StrategyCard: component prop is missing or invalid:', component);
    return null;
  }

  // Handle card click
  const handleCardClick = () => {
    if (!isEditing && !isEditingConfig && !isDragging) {
      selectComponent(component.id);
    }
  };

  // Start editing configuration
  const handleEditConfig = (e) => {
    e.stopPropagation();
    setIsEditingConfig(true);
    setTimeout(() => {
      if (configRef.current) {
        configRef.current.focus();
      }
    }, 50);
  };

  // Handle config text change
  const handleConfigChange = (e) => {
    setConfigText(e.target.value);
  };

  // Handle config keydown
  const handleConfigKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancelConfigEdit();
    }
    // Allow Ctrl+Enter or Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSaveConfig();
    }
  };

  // Start editing title
  const handleEditTitle = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
  };

  // Handle title input change
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  // Handle title input keydown
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Handle delete
  const handleDelete = (e) => {
    e.stopPropagation();
    deleteComponent(component.id);
  };

  // Get component type display name
  const getTypeDisplayName = () => {
    switch(component.type) {
      case 'entry': return 'Entry';
      case 'exit': return 'Exit';
      case 'stop_loss': return 'Stop Loss';
      case 'take_profit': return 'Take Profit';
      case 'risk_management': return 'Risk';
      case 'custom': return 'Custom';
      default: return component.type;
    }
  };

  // Grid of dots handle (drag control)
  const DragHandle = () => (
    <Flex 
      position="absolute"
      top="0"
      left="0"
      right="0"
      height="10px"
      cursor="grab"
      opacity={0.4}
      _hover={{ opacity: 0.8 }}
      zIndex={5}
      bg="rgba(255,255,255,0.1)"
      borderTopLeftRadius="xl"
      borderTopRightRadius="xl"
      justify="center"
      align="center"
    >
      <Box w="30px" h="4px" bg="rgba(255,255,255,0.3)" borderRadius="full" />
    </Flex>
  );

  return (
    <MotionBox
      drag={!isEditing && !isEditingConfig}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: component.position?.x || 0,
        y: component.position?.y || 0
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={handleCardClick}
      bg="rgba(0, 0, 0, 0.4)"
      border="1px solid"
      borderColor={isDragging ? typeColor : "rgba(255, 255, 255, 0.1)"}
      borderRadius="xl"
      boxShadow={isDragging 
        ? `0 12px 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(${typeColor === '#00C6E0' ? '0, 198, 224' : '153, 50, 204'}, 0.5)` 
        : `0 4px 20px rgba(0, 0, 0, 0.2)`}
      backdropFilter="blur(10px)"
      overflow="hidden"
      position="absolute"
      cursor={isDragging ? "grabbing" : "grab"}
      width={`${CARD_WIDTH}px`}
      height={`${CARD_HEIGHT}px`}
      zIndex={isDragging ? 100 : 1}
      transition="all 0.2s"
      data-strategy-card
      _hover={{
        bg: "rgba(0, 0, 0, 0.5)",
        boxShadow: `0 8px 30px rgba(0, 0, 0, 0.12), 0 0 10px rgba(${typeColor === '#00C6E0' ? '0, 198, 224' : '153, 50, 204'}, 0.3)`,
        borderColor: typeColor
      }}
    >
      {/* Drag Handle */}
      <DragHandle />

      {/* Card Header */}
      <Flex
        p={3}
        justify="space-between"
        align="center"
        borderBottom="1px solid"
        borderColor="rgba(255, 255, 255, 0.05)"
        bg="rgba(0, 0, 0, 0.3)"
      >
        {isEditing ? (
          <Flex flex="1" mr={2}>
            <Input
              ref={inputRef}
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleKeyDown}
              size="sm"
              bg="blackAlpha.500"
              border="1px solid"
              borderColor="whiteAlpha.300"
              color="white"
              _focus={{
                borderColor: typeColor,
                boxShadow: `0 0 0 1px ${typeColor}`
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <IconButton
              icon={<Check size={16} />}
              size="sm"
              variant="ghost"
              colorScheme="green"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveTitle();
              }}
              ml={1}
              aria-label="Save title"
            />
            <IconButton
              icon={<X size={16} />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={(e) => {
                e.stopPropagation();
                handleCancelEdit();
              }}
              ml={1}
              aria-label="Cancel edit"
            />
          </Flex>
        ) : (
          <Flex flex="1" align="center">
            <Tooltip label={component.title} placement="top" openDelay={500}>
              <Text
                fontWeight="medium"
                fontSize="sm"
                color="white"
                mr={2}
                noOfLines={1}
              >
                {component.title}
              </Text>
            </Tooltip>
            <IconButton
              icon={<Edit size={14} />}
              size="xs"
              variant="ghost"
              colorScheme="whiteAlpha"
              onClick={handleEditTitle}
              aria-label="Edit title"
            />
          </Flex>
        )}

        <Menu placement="bottom-end" isLazy>
          <MenuButton
            as={IconButton}
            icon={<MoreVertical size={16} />}
            variant="ghost"
            size="sm"
            colorScheme="whiteAlpha"
            onClick={(e) => e.stopPropagation()}
            aria-label="More options"
          />
          <MenuList
            bg="rgba(0, 0, 0, 0.95)"
            backdropFilter="blur(10px)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            borderRadius="xl"
            boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
            py={2}
            minW="180px"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem 
              icon={<Edit size={14} />} 
              onClick={handleEditTitle}
              color="white"
              bg="transparent"
              borderRadius="lg"
              mx={2}
              mb={1}
              _hover={{ 
                bg: "rgba(255, 255, 255, 0.1)",
                transform: "translateX(2px)"
              }}
              _focus={{
                bg: "rgba(255, 255, 255, 0.1)"
              }}
              transition="all 0.2s"
            >
              Rename
            </MenuItem>
            <MenuItem 
              icon={<Trash2 size={14} />} 
              onClick={handleDelete}
              color="red.300"
              bg="transparent"
              borderRadius="lg"
              mx={2}
              _hover={{ 
                bg: "rgba(239, 68, 68, 0.2)",
                color: "red.200",
                transform: "translateX(2px)"
              }}
              _focus={{
                bg: "rgba(239, 68, 68, 0.2)",
                color: "red.200"
              }}
              transition="all 0.2s"
            >
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      {/* Type Badge */}
      <Badge
        position="absolute"
        top={3}
        right={12}
        px={2}
        py={0.5}
        bg={`${typeColor}33`} // 20% transparency
        color={typeColor}
        fontSize="xs"
        borderRadius="sm"
      >
        {getTypeDisplayName()}
      </Badge>

      {/* Card Body - Configuration Area */}
      <Box p={4} h="calc(100% - 45px)">
        {isEditingConfig ? (
          <Flex direction="column" h="full">
            <Textarea
              ref={configRef}
              value={configText}
              onChange={handleConfigChange}
              onKeyDown={handleConfigKeyDown}
              placeholder={`Enter ${getTypeDisplayName().toLowerCase()} condition...`}
              bg="rgba(0, 0, 0, 0.6)"
              border="1px solid"
              borderColor={typeColor}
              borderRadius="lg"
              color="white"
              fontSize="sm"
              resize="none"
              h="full"
              _focus={{
                borderColor: typeColor,
                boxShadow: `0 0 0 1px ${typeColor}`
              }}
              _placeholder={{
                color: "whiteAlpha.500"
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <Flex mt={2} justify="flex-end" gap={2}>
              <IconButton
                icon={<Check size={14} />}
                size="xs"
                variant="ghost"
                colorScheme="green"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveConfig();
                }}
                aria-label="Save configuration"
              />
              <IconButton
                icon={<X size={14} />}
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelConfigEdit();
                }}
                aria-label="Cancel edit"
              />
            </Flex>
          </Flex>
        ) : (
          <Box 
            h="full" 
            cursor="text"
            onClick={handleEditConfig}
            p={2}
            borderRadius="lg"
            transition="all 0.2s"
            _hover={{
              bg: "rgba(255, 255, 255, 0.05)"
            }}
          >
            {configText ? (
              <Text 
                fontSize="sm" 
                color="white" 
                whiteSpace="pre-wrap"
                lineHeight="1.4"
              >
                {configText}
              </Text>
            ) : (
              <Flex 
                direction="column" 
                justify="center" 
                align="center" 
                h="full" 
                opacity={0.6}
              >
                <Text fontSize="sm" color="whiteAlpha.700" textAlign="center">
                  Click to add {getTypeDisplayName().toLowerCase()} condition
                </Text>
              </Flex>
            )}
          </Box>
        )}
      </Box>
    </MotionBox>
  );
};

export default StrategyCard;