import React, { useState, useEffect, memo } from 'react';
import { Tr, Td, HStack, Text, Badge, IconButton, Menu, MenuButton, MenuList, MenuItem, Box, keyframes } from '@chakra-ui/react';
import { Clock, MoreVertical, X, Bell, FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/formatting/currency';
import { formatDate } from '@/utils/formatting/date';

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


const AnimatedPositionRow = memo(({ 
  position, 
  onClose, 
  onAlert, 
  onDetails,
  calculateDuration 
}) => {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [rowAnimation, setRowAnimation] = useState('none');
  
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
    prev.isNew === next.isNew &&
    prev.isClosed === next.isClosed &&
    prev.isModified === next.isModified &&
    prev.isPriceUpdating === next.isPriceUpdating &&
    prev.isPnLUpdating === next.isPnLUpdating
  );
});

AnimatedPositionRow.displayName = 'AnimatedPositionRow';

export default AnimatedPositionRow;