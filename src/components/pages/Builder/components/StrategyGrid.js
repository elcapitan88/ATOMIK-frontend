// src/components/pages/Builder/components/StrategyCard.js
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Input,
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
  const { updateComponent, deleteComponent, selectComponent } = useStrategyBuilder();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(component.title);
  const [isDragging, setIsDragging] = useState(false);
  
  // Card dimensions
  const CARD_WIDTH = 280;
  const CARD_HEIGHT = 180;
  
  const inputRef = useRef(null);
  const cardRef = useRef(null);
  
  // Refs for position tracking
  const positionX = useRef(component.position?.x || 0);
  const positionY = useRef(component.position?.y || 0);
  
  // Additional refs for improved drag handling
  const isDraggingRef = useRef(false);
  const lastKnownPositionRef = useRef({ x: 0, y: 0 });
  const canvasScrollPositionRef = useRef({ x: 0, y: 0 });
  const initialMousePositionRef = useRef({ x: 0, y: 0 });
  const cardPositionBeforeDragRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  
  // Update position refs when component position changes from outside
  useEffect(() => {
    if (component.position && !isDragging) {
      positionX.current = component.position.x;
      positionY.current = component.position.y;
      lastKnownPositionRef.current = { 
        x: component.position.x, 
        y: component.position.y 
      };
    }
  }, [component.position, isDragging]);

  // Handle outside clicks when editing title
  useOutsideClick({
    ref: inputRef,
    handler: () => {
      if (isEditing) {
        handleSaveTitle();
      }
    },
  });

  // Handle card click
  const handleCardClick = () => {
    if (!isEditing && !isDragging) {
      selectComponent(component.id);
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

  // Save edited title
  const handleSaveTitle = () => {
    if (title.trim() !== component.title) {
      updateComponent(component.id, { title: title.trim() });
    }
    setIsEditing(false);
  };

  // Cancel title editing
  const handleCancelEdit = () => {
    setTitle(component.title);
    setIsEditing(false);
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

  // Function to snap position to grid
  const snapToGrid = (value) => {
    return Math.round(value / gridSize) * gridSize;
  };

  // Improved drag start with better position handling
  const startDrag = (event) => {
    if (isEditing) return;
    
    // Cancel any ongoing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Store the canvas scroll position
    if (canvasRef && canvasRef.current && canvasRef.current.parentElement) {
      canvasScrollPositionRef.current = {
        x: canvasRef.current.parentElement.scrollLeft,
        y: canvasRef.current.parentElement.scrollTop
      };
    }
    
    // Store the current component position
    const currentX = component.position?.x || 0;
    const currentY = component.position?.y || 0;
    cardPositionBeforeDragRef.current = { x: currentX, y: currentY };
    lastKnownPositionRef.current = { x: currentX, y: currentY };
    
    // Store the exact mouse position in client coordinates
    initialMousePositionRef.current = {
      x: event.clientX,
      y: event.clientY
    };
    
    // Set drag state
    isDraggingRef.current = true;
    setIsDragging(true);
    lastUpdateTimeRef.current = performance.now();
  };

  // Improved handle drag event for faster movement
  const handleDrag = (event, info) => {
    if (!isDraggingRef.current) return;
    
    // Get mouse position delta from initial click
    const deltaX = event.clientX - initialMousePositionRef.current.x;
    const deltaY = event.clientY - initialMousePositionRef.current.y;
    
    // Add delta to original card position, accounting for zoom level
    const newX = cardPositionBeforeDragRef.current.x + (deltaX / zoomLevel);
    const newY = cardPositionBeforeDragRef.current.y + (deltaY / zoomLevel);
    
    // Apply grid snapping
    const snappedX = snapToGrid(newX);
    const snappedY = snapToGrid(newY);
    
    // Get current card position
    const currentX = positionX.current;
    const currentY = positionY.current;
    
    // Calculate differences to determine movement direction and distance
    const xDiff = snappedX - currentX;
    const yDiff = snappedY - currentY;
    
    // Only update if there's actual movement needed
    if (xDiff !== 0 || yDiff !== 0) {
      // Calculate the current time
      const now = performance.now();
      // Calculate time since last update
      const timeDelta = now - lastUpdateTimeRef.current;
      
      // Calculate maximum movement speed (grid cells per frame)
      // Adjust this value to control maximum speed
      const maxGridCellsPerFrame = 5;
      
      // Determine which axis to prioritize based on greater distance
      let targetX = currentX;
      let targetY = currentY;
      
      // Time-based velocity control
      const baseSpeed = Math.min(maxGridCellsPerFrame, Math.max(1, Math.floor(timeDelta / 16)));
      
      // Prioritize movement along the axis with the greater distance
      if (Math.abs(xDiff) > Math.abs(yDiff)) {
        // Move along X axis first
        if (xDiff !== 0) {
          const xSpeed = Math.min(Math.abs(xDiff), gridSize * baseSpeed);
          targetX = currentX + Math.sign(xDiff) * xSpeed;
          // Ensure we snap to grid
          targetX = snapToGrid(targetX);
        }
      } else {
        // Move along Y axis first
        if (yDiff !== 0) {
          const ySpeed = Math.min(Math.abs(yDiff), gridSize * baseSpeed);
          targetY = currentY + Math.sign(yDiff) * ySpeed;
          // Ensure we snap to grid
          targetY = snapToGrid(targetY);
        }
      }
      
      // Update card position
      positionX.current = targetX;
      positionY.current = targetY;
      
      // Update DOM directly for smooth visual movement
      if (cardRef.current) {
        cardRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      }
      
      // Update last known position
      lastKnownPositionRef.current = { x: targetX, y: targetY };
      
      // Call parent's drag handler
      if (onDrag) {
        onDrag(component.id, { x: targetX, y: targetY });
      }
      
      // Update last update time
      lastUpdateTimeRef.current = now;
      
      // If we're not at the desired position yet, schedule another update
      if (targetX !== snappedX || targetY !== snappedY) {
        // Cancel any existing animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Schedule next movement step
        animationFrameRef.current = requestAnimationFrame(() => {
          handleDrag(event, info);
        });
      }
    }
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    // Cancel any ongoing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    isDraggingRef.current = false;
    setIsDragging(false);
    
    // Get final position
    const finalX = lastKnownPositionRef.current.x;
    const finalY = lastKnownPositionRef.current.y;
    
    if (onDragEnd) {
      onDragEnd(component.id, { x: finalX, y: finalY });
    }
  };

  // Clean up effect
  useEffect(() => {
    return () => {
      isDraggingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Set up mouse move and mouse up event listeners for manual drag handling
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingRef.current) {
        handleDrag(e, null);
      }
    };
    
    const handleMouseUp = (e) => {
      if (isDraggingRef.current) {
        handleDragEnd(e);
      }
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Clean up
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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
    <Box
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1
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
      cursor={isDragging ? "grabbing" : "pointer"}
      width={`${CARD_WIDTH}px`}
      height={`${CARD_HEIGHT}px`}
      zIndex={isDragging ? 100 : 1}
      transition="all 0.2s"
      _hover={{
        bg: "rgba(0, 0, 0, 0.5)",
        boxShadow: `0 8px 30px rgba(0, 0, 0, 0.12), 0 0 10px rgba(${typeColor === '#00C6E0' ? '0, 198, 224' : '153, 50, 204'}, 0.3)`,
        borderColor: typeColor
      }}
      style={{ 
        transform: `translate3d(${component.position?.x || 0}px, ${component.position?.y || 0}px, 0)`
      }}
      onMouseDown={startDrag}
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
            bg="rgba(0, 0, 0, 0.8)"
            borderColor="whiteAlpha.200"
            boxShadow="lg"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem 
              icon={<Edit size={14} />} 
              onClick={handleEditTitle}
              color="white"
              _hover={{ bg: "whiteAlpha.100" }}
            >
              Rename
            </MenuItem>
            <MenuItem 
              icon={<Trash2 size={14} />} 
              onClick={handleDelete}
              color="red.300"
              _hover={{ bg: "red.900" }}
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

      {/* Card Body - Placeholder for future content */}
      <Box p={4} h="calc(100% - 45px)">
        <Flex 
          direction="column" 
          justify="center" 
          align="center" 
          h="full" 
          opacity={0.6}
        >
          <Text fontSize="sm" color="whiteAlpha.700" textAlign="center">
            Component configuration will appear here
          </Text>
          {/* Display grid coordinates if needed for debugging */}
          {isDragging && (
            <Text fontSize="xs" color="whiteAlpha.700" mt={2}>
              Position: {snapToGrid(positionX.current)}, {snapToGrid(positionY.current)}
            </Text>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default StrategyCard;