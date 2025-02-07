// CategoryRow.js
import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  HStack,
  IconButton,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import StrategyCard from './StrategyCard';

const CategoryRow = ({ strategies }) => {
  const containerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const showArrows = useBreakpointValue({ base: false, md: true });
  const scrollAmount = 330; // card width + margin

  const checkScrollButtons = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10); // 10px threshold
    }
  };

  useEffect(() => {
    checkScrollButtons();
    // Add resize listener
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, []);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft;
      const target = direction === 'left' 
        ? scrollLeft - scrollAmount 
        : scrollLeft + scrollAmount;
      
      containerRef.current.scrollTo({
        left: target,
        behavior: 'smooth'
      });

      // Update arrow visibility after scroll animation
      setTimeout(checkScrollButtons, 300);
    }
  };

  // Handle scroll event to update arrow visibility
  const handleScroll = () => {
    checkScrollButtons();
  };

  return (
    <Box position="relative" my={4}>
      {/* Left Arrow */}
      {showArrows && showLeftArrow && (
        <IconButton
          icon={<ChevronLeft />}
          position="absolute"
          left="-16px"
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
          onClick={() => scroll('left')}
          bg="rgba(0, 0, 0, 0.7)"
          color="white"
          _hover={{ bg: 'rgba(0, 0, 0, 0.8)' }}
          _active={{ bg: 'rgba(0, 0, 0, 0.9)' }}
          borderRadius="full"
          size="lg"
          boxShadow="lg"
        />
      )}

      {/* Strategy Cards Container */}
      <Box
        ref={containerRef}
        overflowX="auto"
        onScroll={handleScroll}
        css={{
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          'scrollbarWidth': 'none',
          '-ms-overflow-style': 'none',
          'scrollSnapType': 'x mandatory'
        }}
        mx={showArrows ? 4 : 0}
      >
        <HStack 
          spacing={6} 
          py={4}
          px={2}
        >
          {strategies.map((strategy) => (
            <Box 
              key={strategy.id}
              flexShrink={0}
              scrollSnapAlign="start"
              transition="transform 0.2s"
              _hover={{
                transform: 'scale(1.02)'
              }}
            >
              <StrategyCard strategy={strategy} />
            </Box>
          ))}
        </HStack>
      </Box>

      {/* Right Arrow */}
      {showArrows && showRightArrow && (
        <IconButton
          icon={<ChevronRight />}
          position="absolute"
          right="-16px"
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
          onClick={() => scroll('right')}
          bg="rgba(0, 0, 0, 0.7)"
          color="white"
          _hover={{ bg: 'rgba(0, 0, 0, 0.8)' }}
          _active={{ bg: 'rgba(0, 0, 0, 0.9)' }}
          borderRadius="full"
          size="lg"
          boxShadow="lg"
        />
      )}
    </Box>
  );
};

export default CategoryRow;