import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  useColorModeValue
} from '@chakra-ui/react';
import { Hash, Volume2, VolumeX } from 'lucide-react';

const ChannelList = ({ 
  channels = [], 
  activeChannelId, 
  onChannelSelect 
}) => {
  const hoverBg = useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)');
  const activeBg = useColorModeValue('rgba(0, 198, 224, 0.2)', 'rgba(0, 198, 224, 0.15)');

  return (
    <VStack spacing={1} p={3} align="stretch" maxH="300px" overflowY="auto">
      <Text fontSize="sm" fontWeight="bold" color="whiteAlpha.700" mb={2}>
        CHANNELS
      </Text>
      
      {channels.map((channel) => (
        <HStack
          key={channel.id}
          p={2}
          borderRadius="md"
          cursor="pointer"
          bg={activeChannelId === channel.id ? activeBg : 'transparent'}
          _hover={{
            bg: activeChannelId === channel.id ? activeBg : hoverBg
          }}
          transition="all 0.2s"
          onClick={() => onChannelSelect(channel.id)}
          justify="space-between"
          spacing={3}
        >
          <HStack spacing={2} flex={1} minW={0}>
            <Hash size={16} color={activeChannelId === channel.id ? '#00C6E0' : '#A0AEC0'} />
            
            <Text 
              fontSize="sm" 
              color={activeChannelId === channel.id ? 'white' : 'whiteAlpha.800'}
              fontWeight={activeChannelId === channel.id ? 'semibold' : 'normal'}
              isTruncated
            >
              {channel.name}
            </Text>
          </HStack>
          
          <HStack spacing={2}>
            {/* Muted indicator - TODO: implement muting */}
            {channel.is_muted && (
              <VolumeX size={12} color="#A0AEC0" />
            )}
            
            {/* Unread count badge */}
            {channel.unread_count > 0 && (
              <Badge
                colorScheme={activeChannelId === channel.id ? 'blue' : 'red'}
                variant="solid"
                borderRadius="full"
                fontSize="xs"
                minW="18px"
                h="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {channel.unread_count > 99 ? '99+' : channel.unread_count}
              </Badge>
            )}
          </HStack>
        </HStack>
      ))}
      
      {channels.length === 0 && (
        <Text fontSize="sm" color="whiteAlpha.600" textAlign="center" p={4}>
          No channels available
        </Text>
      )}
    </VStack>
  );
};

export default ChannelList;