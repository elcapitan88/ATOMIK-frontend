// src/components/pages/Builder/components/StrategyGrid.js
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Box, Flex, IconButton, Tooltip, VStack } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Target, Maximize2 } from 'lucide-react';
import useStrategyBuilder from '@/hooks/useStrategyBuilder';
import StrategyCard from './StrategyCard';
import StrategyHeader from './StrategyHeader';
import StrategyActions from './StrategyActions';

// Motion components
const MotionBox = motion(Box);

// Component type colors
const getTypeColor = (type) => {
  switch(type) {
    case 'entry': return '#00C6E0'; // Cyan - Primary Atomik color
    case 'exit': return '#9932CC'; // Purple
    case 'stop_loss': return '#F56565'; // Red
    case 'take_profit': return '#48BB78'; // Green
    case 'risk_management': return '#ECC94B'; // Yellow
    case 'custom': return '#805AD5'; // Purple
    default: return '#00C6E0';
  }
};

const StrategyGrid = ({ onOpenChat }) => {
  const { components, updateComponent } = useStrategyBuilder();
  const canvasRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const gridSize = 25;
  
  // Zoom levels
  const minZoom = 0.5;
  const maxZoom = 2;
  const zoomStep = 0.1;

  // Handle component drag
  const handleComponentDrag = useCallback((componentId, position) => {
    // Update the component position immediately for smooth dragging
    updateComponent(componentId, { position });
  }, [updateComponent]);

  // Handle drag end
  const handleComponentDragEnd = useCallback((componentId, position) => {
    // Final position update when drag ends
    updateComponent(componentId, { position });
  }, [updateComponent]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(maxZoom, prev + zoomStep));
  }, [maxZoom, zoomStep]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(minZoom, prev - zoomStep));
  }, [minZoom, zoomStep]);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setTransform({ x: 0, y: 0 });
  }, []);

  // Zoom to point (for mouse wheel zoom)
  const zoomToPoint = useCallback((newZoom, clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Calculate the point in the current coordinate space
    const pointX = (x - transform.x) / zoomLevel;
    const pointY = (y - transform.y) / zoomLevel;

    // Calculate new transform to keep the point under the mouse
    const newTransform = {
      x: x - pointX * newZoom,
      y: y - pointY * newZoom
    };

    setZoomLevel(newZoom);
    setTransform(newTransform);
  }, [transform, zoomLevel]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
    const newZoom = Math.min(maxZoom, Math.max(minZoom, zoomLevel + delta));
    
    if (newZoom !== zoomLevel) {
      zoomToPoint(newZoom, e.clientX, e.clientY);
    }
  }, [zoomLevel, zoomStep, minZoom, maxZoom, zoomToPoint]);

  // Handle pan start
  const handlePanStart = useCallback((e) => {
    // Don't start panning if clicking on components or controls
    const isComponent = e.target.closest('[data-strategy-card]');
    const isHeader = e.target.closest('[data-strategy-header]');
    const isActions = e.target.closest('[data-strategy-actions]');
    const isControl = e.target.closest('button, [role="button"]');
    
    if (!isComponent && !isHeader && !isActions && !isControl) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  // Handle pan move
  const handlePanMove = useCallback((e) => {
    if (!isPanning) return;

    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;

    setTransform(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    setLastPanPoint({ x: e.clientX, y: e.clientY });
  }, [isPanning, lastPanPoint]);

  // Handle pan end
  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Center to components
  const handleCenterToComponents = useCallback(() => {
    if (components.length === 0) return;
    
    // Calculate bounding box of all components
    const positions = components.map(c => ({ 
      x: c.position?.x || 0, 
      y: c.position?.y || 0 
    }));
    
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x)) + 280; // Card width
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y)) + 180; // Card height
    
    // Calculate center point
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Get canvas dimensions
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;
    
    // Calculate transform to center the components
    const newTransform = {
      x: (canvasWidth / 2) - (centerX * zoomLevel),
      y: (canvasHeight / 2) - (centerY * zoomLevel)
    };
    
    setTransform(newTransform);
  }, [components, zoomLevel]);


  // Add event listeners for mouse interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse wheel zoom
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Mouse pan events
    const handleMouseMove = (e) => handlePanMove(e);
    const handleMouseUp = () => handlePanEnd();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handlePanMove, handlePanEnd]);

  return (
    <Box
      ref={canvasRef}
      position="relative"
      w="100%"
      h="100%"
      minH="600px"
      bg="rgba(0, 0, 0, 0.2)"
      borderRadius="xl"
      overflow="hidden"
      border="1px solid rgba(255, 255, 255, 0.1)"
      backdropFilter="blur(10px)"
      cursor={isPanning ? "grabbing" : "grab"}
      onMouseDown={handlePanStart}
      data-grid-background
    >
      {/* Grid Controls Menu */}
      <VStack
        position="absolute"
        top={4}
        left={4}
        spacing={1}
        zIndex={200}
        bg="rgba(0, 0, 0, 0.8)"
        backdropFilter="blur(10px)"
        borderRadius="lg"
        border="1px solid rgba(255, 255, 255, 0.1)"
        p={2}
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
      >
        <Tooltip label="Zoom In" placement="right" openDelay={500}>
          <IconButton
            icon={<ZoomIn size={16} />}
            size="sm"
            variant="ghost"
            colorScheme="whiteAlpha"
            color="white"
            onClick={handleZoomIn}
            isDisabled={zoomLevel >= maxZoom}
            _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
            _active={{ bg: "rgba(255, 255, 255, 0.2)" }}
            aria-label="Zoom in"
          />
        </Tooltip>
        
        <Tooltip label="Zoom Out" placement="right" openDelay={500}>
          <IconButton
            icon={<ZoomOut size={16} />}
            size="sm"
            variant="ghost"
            colorScheme="whiteAlpha"
            color="white"
            onClick={handleZoomOut}
            isDisabled={zoomLevel <= minZoom}
            _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
            _active={{ bg: "rgba(255, 255, 255, 0.2)" }}
            aria-label="Zoom out"
          />
        </Tooltip>
        
        <Tooltip label="Reset Zoom" placement="right" openDelay={500}>
          <IconButton
            icon={<Maximize2 size={16} />}
            size="sm"
            variant="ghost"
            colorScheme="whiteAlpha"
            color="white"
            onClick={handleResetZoom}
            isDisabled={zoomLevel === 1 && transform.x === 0 && transform.y === 0}
            _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
            _active={{ bg: "rgba(255, 255, 255, 0.2)" }}
            aria-label="Reset zoom"
          />
        </Tooltip>
        
        <Tooltip label="Center to Components" placement="right" openDelay={500}>
          <IconButton
            icon={<Target size={16} />}
            size="sm"
            variant="ghost"
            colorScheme="whiteAlpha"
            color="white"
            onClick={handleCenterToComponents}
            isDisabled={components.length === 0}
            _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
            _active={{ bg: "rgba(255, 255, 255, 0.2)" }}
            aria-label="Center to components"
          />
        </Tooltip>
      </VStack>

      {/* Strategy Actions - Bottom Left */}
      <StrategyActions onOpenAIChat={onOpenChat} />
      {/* Zoomable Container */}
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${zoomLevel})`,
          transformOrigin: '0 0'
        }}
        transition="transform 0.2s ease-out"
      >
        {/* Dot Grid Background */}
        <Box
          position="absolute"
          top={-5000}
          left={-5000}
          width="10000px"
          height="10000px"
          opacity={0.4}
          backgroundImage={`radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 1px, transparent 1px)`}
          backgroundSize={`${gridSize}px ${gridSize}px`}
          backgroundPosition="0 0"
          pointerEvents="none"
          data-grid-background
        />

        {/* Strategy Header */}
        <StrategyHeader
          onDrag={handleComponentDrag}
          onDragEnd={handleComponentDragEnd}
          zoomLevel={zoomLevel}
          gridSize={gridSize}
        />

        {/* Strategy Components */}
        <AnimatePresence>
          {components.map((component) => (
            <StrategyCard
              key={component.id}
              component={component}
              typeColor={getTypeColor(component.type)}
              onDrag={handleComponentDrag}
              onDragEnd={handleComponentDragEnd}
              zoomLevel={zoomLevel}
              gridSize={gridSize}
              canvasRef={canvasRef}
            />
          ))}
        </AnimatePresence>
      </Box>

      {/* Grid Info (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          position="absolute"
          bottom={4}
          right={4}
          bg="rgba(0, 0, 0, 0.6)"
          color="white"
          px={2}
          py={1}
          borderRadius="md"
          fontSize="xs"
          pointerEvents="none"
        >
          Components: {components.length} | Grid: {gridSize}px | Zoom: {Math.round(zoomLevel * 100)}%
        </Box>
      )}
    </Box>
  );
};

export default StrategyGrid;