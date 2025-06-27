import React, { useState, useEffect, memo } from 'react';
import { Tr, Td, HStack, Text, Badge, IconButton, Menu, MenuButton, MenuList, MenuItem, Box, keyframes } from '@chakra-ui/react';
import { TrendingUp, TrendingDown, Clock, MoreVertical, X, Bell, FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/formatting/currency';
import { formatDate } from '@/utils/formatting/date';
import AnimatedPnL from './AnimatedPnL';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-10px); }
`;

const highlight = keyframes`
  0% { background-color: transparent; }
  50% { background-color: rgba(66, 153, 225, 0.1); }
  100% { background-color: transparent; }
`;

const priceUpGlow = keyframes`
  0% { background-color: transparent; transform: scale(1); }
  50% { background-color: rgba(72, 187, 120, 0.2); transform: scale(1.02); }
  100% { background-color: transparent; transform: scale(1); }
`;

const priceDownGlow = keyframes`
  0% { background-color: transparent; transform: scale(1); }
  50% { background-color: rgba(245, 101, 101, 0.2); transform: scale(1.02); }
  100% { background-color: transparent; transform: scale(1); }
`;

const AnimatedPositionRow = memo(({ 
  position, 
  onClose, 
  onAlert, 
  onDetails,
  calculateDuration 
}) => {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [rowAnimation, setRowAnimation] = useState('none');
  const [priceDirection, setPriceDirection] = useState(null);
  
  useEffect(() => {
    // Trigger animations based on position state
    if (position.isNew) {
      setRowAnimation(`${fadeIn} 0.5s ease-out`);
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 2000);
    } else if (position.isClosed) {
      setRowAnimation(`${fadeOut} 0.5s ease-out`);
    } else if (position.isModified) {
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 1000);
    }
  }, [position.isNew, position.isClosed, position.isModified]);
  
  // Price direction animation
  useEffect(() => {
    if (position.currentPrice !== position.previousPrice && position.previousPrice) {
      const direction = position.currentPrice > position.previousPrice ? 'up' : 'down';
      setPriceDirection(direction);
      
      // Clear direction after animation
      const timer = setTimeout(() => setPriceDirection(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [position.currentPrice, position.previousPrice]);
  
  const getPriceAnimation = () => {
    if (position.isPriceUpdating || priceDirection) {
      let animationName = highlight;
      
      if (priceDirection === 'up') {
        animationName = priceUpGlow;
      } else if (priceDirection === 'down') {
        animationName = priceDownGlow;
      }
      
      return {
        animation: `${animationName} 0.8s ease-in-out`,
        transition: 'all 0.3s'
      };
    }
    
    return {};
  };
  
  const getPriceColor = () => {
    if (!position.previousPrice || position.currentPrice === position.previousPrice) {
      return 'inherit';
    }
    return position.currentPrice > position.previousPrice ? 'green.400' : 'red.400';
  };
  
  return (
    <Tr
      animation={rowAnimation}
      bg={isHighlighted ? 'whiteAlpha.50' : 'transparent'}
      _hover={{ bg: 'whiteAlpha.100' }}
      transition="all 0.3s"
      opacity={position.isClosed ? 0.5 : 1}
    >
      <Td>{position.timeEntered ? formatDate(position.timeEntered) : '-'}</Td>
      <Td>
        <HStack spacing={1}>
          <Clock size={14} />
          <Text>{position.timeEntered ? calculateDuration(position.timeEntered) : '-'}</Text>
        </HStack>
      </Td>
      <Td>
        <HStack spacing={1}>
          <Text>{position.symbol}</Text>
          {position.contractInfo && (
            <Badge size="sm" variant="subtle" colorScheme="blue">
              {position.contractInfo.name}
            </Badge>
          )}
          {position.isNew && (
            <Badge size="sm" colorScheme="green" variant="solid">
              NEW
            </Badge>
          )}
        </HStack>
      </Td>
      <Td>
        <Badge
          colorScheme={position.side === 'LONG' ? 'green' : 'red'}
          variant="subtle"
        >
          {position.side}
        </Badge>
      </Td>
      <Td isNumeric>{position.quantity}</Td>
      <Td isNumeric>{formatCurrency(position.avgPrice)}</Td>
      <Td isNumeric>
        <Box {...getPriceAnimation()}>
          <HStack justify="flex-end" spacing={1}>
            <Text color={getPriceColor()} transition="color 0.3s">
              {formatCurrency(position.currentPrice)}
            </Text>
            {position.currentPrice > position.avgPrice ? (
              <TrendingUp size={14} color="#48BB78" />
            ) : position.currentPrice < position.avgPrice ? (
              <TrendingDown size={14} color="#F56565" />
            ) : null}
          </HStack>
        </Box>
      </Td>
      <Td isNumeric>
        <AnimatedPnL
          value={position.unrealizedPnL || position.pnl || 0}
          previousValue={position.previousPnL}
          isUpdating={position.isPnLUpdating}
        />
      </Td>
      <Td>
        <Text fontSize="sm" color="whiteAlpha.700">
          {position.strategy_name || position.strategyId || '-'}
        </Text>
      </Td>
      <Td>
        <Text fontSize="sm" color="whiteAlpha.900">
          {position.accountId}
        </Text>
      </Td>
      <Td>
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<MoreVertical size={14} />}
            variant="ghost"
            size="sm"
            isDisabled={position.isClosed}
            _hover={{ bg: 'whiteAlpha.100' }}
          />
          <MenuList bg="gray.800" borderColor="whiteAlpha.200">
            <MenuItem
              icon={<X size={14} />}
              onClick={() => onClose(position)}
              _hover={{ bg: 'whiteAlpha.100' }}
            >
              Close Position
            </MenuItem>
            <MenuItem
              icon={<Bell size={14} />}
              onClick={() => onAlert(position)}
              _hover={{ bg: 'whiteAlpha.100' }}
            >
              Set Alert
            </MenuItem>
            <MenuItem
              icon={<FileText size={14} />}
              onClick={() => onDetails(position)}
              _hover={{ bg: 'whiteAlpha.100' }}
            >
              View Details
            </MenuItem>
          </MenuList>
        </Menu>
      </Td>
    </Tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  const prev = prevProps.position;
  const next = nextProps.position;
  
  return (
    prev.quantity === next.quantity &&
    prev.currentPrice === next.currentPrice &&
    prev.previousPrice === next.previousPrice &&
    prev.unrealizedPnL === next.unrealizedPnL &&
    prev.isNew === next.isNew &&
    prev.isClosed === next.isClosed &&
    prev.isModified === next.isModified &&
    prev.isPriceUpdating === next.isPriceUpdating &&
    prev.isPnLUpdating === next.isPnLUpdating
  );
});

AnimatedPositionRow.displayName = 'AnimatedPositionRow';

export default AnimatedPositionRow;