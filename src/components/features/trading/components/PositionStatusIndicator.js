import React from 'react';
import { Badge, Box, keyframes, Tooltip } from '@chakra-ui/react';
import { Activity, Pause, AlertCircle } from 'lucide-react';

const liveAnimation = keyframes`
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
`;

const PositionStatusIndicator = ({ position, lastUpdate }) => {
  const getStatus = () => {
    const updateTime = position?.lastUpdate || lastUpdate;
    
    if (!updateTime) {
      return { status: 'unknown', color: 'gray', icon: AlertCircle };
    }
    
    const timeSinceUpdate = Date.now() - updateTime;
    
    if (timeSinceUpdate < 5000) {
      return { status: 'live', color: 'green', icon: Activity };
    } else if (timeSinceUpdate < 30000) {
      return { status: 'delayed', color: 'yellow', icon: Pause };
    } else {
      return { status: 'stale', color: 'red', icon: AlertCircle };
    }
  };
  
  const { status, color, icon: Icon } = getStatus();
  
  const getTooltipText = () => {
    switch (status) {
      case 'live':
        return 'Receiving real-time updates';
      case 'delayed':
        return 'Updates may be delayed';
      case 'stale':
        return 'No recent updates - data may be outdated';
      default:
        return 'Connection status unknown';
    }
  };
  
  return (
    <Tooltip label={getTooltipText()} placement="top" hasArrow>
      <Box display="inline-flex" alignItems="center">
        <Badge
          colorScheme={color}
          size="sm"
          display="flex"
          alignItems="center"
          gap={1}
          px={2}
          animation={status === 'live' ? `${liveAnimation} 2s infinite` : 'none'}
        >
          {Icon && <Icon size={12} />}
          {status.toUpperCase()}
        </Badge>
      </Box>
    </Tooltip>
  );
};

export default PositionStatusIndicator;