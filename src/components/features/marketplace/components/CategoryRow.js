import React, { useRef } from 'react';
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
  const showArrows = useBreakpointValue({ base: false, md: true });
  const scrollAmount = 330; // card width + margin

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
    }
  };

  return (
    <Box position="relative" my={4}>
      {/* Left Arrow */}
      {showArrows && (
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
          borderRadius="full"
          size="lg"
        />
      )}

      {/* Strategy Cards Container */}
      <Box
        ref={containerRef}
        overflowX="auto"
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
        <HStack spacing={6} py={4}>
          {strategies.map((strategy) => (
            <Box 
              key={strategy.id}
              flexShrink={0}
              scrollSnapAlign="start"
            >
              <StrategyCard strategy={strategy} />
            </Box>
          ))}
        </HStack>
      </Box>

      {/* Right Arrow */}
      {showArrows && (
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
          borderRadius="full"
          size="lg"
        />
      )}
    </Box>
  );
};

export default CategoryRow;