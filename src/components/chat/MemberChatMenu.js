import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  VStack,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { MessageCircle, Users, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const MemberChatMenu = ({ 
  isOpen, 
  onToggle, 
  unreadCount = 0,
  channels = [],
  onChannelSelect,
  activeChannelId 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Better styling to match debug version
  const bgColor = 'rgba(20, 20, 20, 0.8)'; // Dark background with transparency
  const hoverBgColor = 'rgba(255, 255, 255, 0.1)'; // Light hover
  const borderColor = 'rgba(255, 255, 255, 0.2)'; // More visible border

  return (
    <MotionBox
      position="fixed"
      right={4}
      top="50%"
      transform="translateY(-50%)"
      zIndex={150}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ x: 60 }}
      animate={{ x: isHovered || isOpen ? 0 : 60 }}
      transition={{ 
        type: "spring", 
        damping: 25, 
        stiffness: 200,
        duration: 0.3 
      }}
    >
      <VStack
        spacing={2}
        bg={bgColor}
        backdropFilter="blur(20px)"
        border={`1px solid ${borderColor}`}
        borderRadius="xl"
        p={2}
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.3)"
      >
        {/* Main Chat Toggle Button */}
        <Tooltip 
          label={isOpen ? "Close Chat" : "Open Chat"} 
          placement="left"
          hasArrow
        >
          <Box position="relative">
            <IconButton
              icon={<MessageCircle size={20} />}
              variant="ghost"
              colorScheme="whiteAlpha"
              size="md"
              onClick={onToggle}
              bg={isOpen ? 'rgba(0, 198, 224, 0.2)' : 'transparent'}
              color={isOpen ? '#00C6E0' : 'white'}
              _hover={{ 
                bg: isOpen ? 'rgba(0, 198, 224, 0.3)' : hoverBgColor,
                transform: 'scale(1.05)'
              }}
              _active={{
                transform: 'scale(0.95)'
              }}
              transition="all 0.2s"
              aria-label={isOpen ? "Close chat" : "Open chat"}
            />
            
            {/* Unread Badge */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <MotionBox
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", damping: 15, stiffness: 300 }}
                >
                  <Badge
                    colorScheme="red"
                    variant="solid"
                    borderRadius="full"
                    fontSize="xs"
                    minW="20px"
                    h="20px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                </MotionBox>
              )}
            </AnimatePresence>
          </Box>
        </Tooltip>

        {/* Quick Channel Access - Only show when hovered and not open */}
        <AnimatePresence>
          {isHovered && !isOpen && channels.length > 0 && (
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <VStack spacing={1}>
                {channels.slice(0, 3).map((channel) => (
                  <Tooltip 
                    key={channel.id}
                    label={`#${channel.name}`} 
                    placement="left"
                    hasArrow
                  >
                    <Box position="relative">
                      <IconButton
                        icon={<Hash size={16} />}
                        variant="ghost"
                        colorScheme="whiteAlpha"
                        size="sm"
                        onClick={() => {
                          onChannelSelect(channel.id);
                          onToggle(); // Open chat when channel is selected
                        }}
                        bg={activeChannelId === channel.id ? 'rgba(0, 198, 224, 0.2)' : 'transparent'}
                        color={activeChannelId === channel.id ? '#00C6E0' : 'whiteAlpha.700'}
                        _hover={{ 
                          bg: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          transform: 'scale(1.05)'
                        }}
                        transition="all 0.2s"
                        aria-label={`Open ${channel.name} channel`}
                      />
                      
                      {/* Channel Unread Badge */}
                      {channel.unread_count > 0 && (
                        <Badge
                          position="absolute"
                          top="-1px"
                          right="-1px"
                          colorScheme="blue"
                          variant="solid"
                          borderRadius="full"
                          fontSize="xs"
                          minW="16px"
                          h="16px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          {channel.unread_count > 9 ? '9+' : channel.unread_count}
                        </Badge>
                      )}
                    </Box>
                  </Tooltip>
                ))}
              </VStack>
            </MotionBox>
          )}
        </AnimatePresence>

        {/* Online Users Indicator */}
        <Tooltip 
          label="Chat Members" 
          placement="left"
          hasArrow
        >
          <IconButton
            icon={<Users size={16} />}
            variant="ghost"
            colorScheme="whiteAlpha"
            size="sm"
            color="whiteAlpha.600"
            _hover={{ 
              color: 'white',
              transform: 'scale(1.05)'
            }}
            transition="all 0.2s"
            aria-label="View chat members"
            isDisabled // TODO: Implement user list feature
          />
        </Tooltip>
      </VStack>
    </MotionBox>
  );
};

export default MemberChatMenu;